"""
FastAPI server for SchedulingTransformer.
Provides REST API endpoints for scenario generation and negotiation.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import torch
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_generator.scenario_generator import ScenarioGenerator
from model.scheduler_model import SchedulerModel
import config


# Pydantic models for API
class Room(BaseModel):
    room_id: str
    capacity: int
    available_slots: List[str]


class TeacherInfo(BaseModel):
    teacher_id: str
    preferred_slots: List[str]
    unavailable_slots: List[str]
    min_slots_needed: int = 1


class StudentInfo(BaseModel):
    group_id: str
    preferred_slots: List[str]
    constraints: Optional[Dict[str, Any]] = None


class NegotiationScenario(BaseModel):
    """Complete negotiation scenario."""
    scenario_id: str
    timestamp: str
    room_manager: Dict[str, Any]
    teacher: Dict[str, Any]
    students: Dict[str, Any]
    all_possible_slots: List[str]
    target_slot: Optional[str] = None
    difficulty: str = "medium"


class NegotiationRound(BaseModel):
    """Single round of negotiation."""
    round: int
    proposed_slot: str
    predicted_idx: int
    scores: Dict[str, float]
    explanation: str
    agent_proposals: Optional[Dict[str, Any]] = None
    agent_feedback: Optional[Dict[str, Any]] = None
    accepted_by_all: bool = False
    alternative_slots: Optional[List[Dict[str, Any]]] = None


class NegotiationResult(BaseModel):
    """Complete negotiation result."""
    scenario_id: str
    final_slot: str
    negotiation_rounds: List[NegotiationRound]
    final_scores: Dict[str, float]
    success: bool
    final_alternatives: Optional[List[Dict[str, Any]]] = None
    failure_reasons: Optional[List[str]] = None
    accepted_by_all: bool = False


# Initialize FastAPI app
app = FastAPI(
    title="SchedulingTransformer API",
    description="Multi-agent negotiation using Transformer attention mechanism",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
scenario_generator = None
scheduler_model = None
slot_names = None


@app.on_event("startup")
async def startup_event():
    """Initialize components on startup."""
    global scenario_generator, scheduler_model, slot_names
    
    print("Initializing SchedulingTransformer API...")
    
    # Initialize scenario generator
    scenario_generator = ScenarioGenerator(seed=config.SEED)
    slot_names = scenario_generator.all_slots
    
    # Initialize model
    scheduler_model = SchedulerModel(num_slots=len(slot_names))
    
    # Try to load pre-trained weights if available
    try:
        scheduler_model.load_state_dict(torch.load('best_model.pth', map_location='cpu'))
        print("Loaded pre-trained model weights")
    except FileNotFoundError:
        print("No pre-trained weights found, using random initialization")
    
    print(f"API ready! Available slots: {len(slot_names)}")
    print(f"Slot names: {slot_names}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model": "SchedulingTransformer",
        "num_slots": len(slot_names) if slot_names else "Not initialized",
        "num_agents": 3  # Room Manager, Teacher, Students
    }


@app.post("/generate-scenario")
async def generate_scenario(difficulty: str = "medium") -> NegotiationScenario:
    """
    Generate a new negotiation scenario.
    
    Args:
        difficulty: "easy", "medium", or "hard"
    
    Returns:
        A synthetic negotiation scenario
    """
    if scenario_generator is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    if difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be 'easy', 'medium', or 'hard'"
        )
    
    scenario = scenario_generator.generate_scenario(difficulty=difficulty)
    return scenario


@app.post("/negotiate")
async def negotiate(scenario: NegotiationScenario) -> NegotiationResult:
    """
    Run negotiation for a given scenario.
    
    This endpoint:
    1. Takes a scenario with room/teacher/student info
    2. Runs the Transformer negotiation (multiple rounds)
    3. Returns final decision with satisfaction scores
    
    Args:
        scenario: The negotiation scenario
    
    Returns:
        Full negotiation result with round-by-round details
    """
    if scheduler_model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    try:
        # Run negotiation
        result = scheduler_model.forward(scenario.dict(), slot_names)
        
        # Convert to API format
        rounds = []
        for round_data in result['negotiation_rounds']:
            rounds.append(NegotiationRound(
                round=round_data['round'],
                proposed_slot=round_data['proposed_slot'],
                predicted_idx=round_data['predicted_idx'],
                scores=round_data['scores'],
                explanation=round_data['explanation'],
                agent_proposals=round_data.get('agent_proposals'),
                agent_feedback=round_data.get('agent_feedback'),
                accepted_by_all=round_data.get('accepted_by_all', False),
                alternative_slots=round_data.get('alternative_slots')
            ))
        
        return NegotiationResult(
            scenario_id=result['scenario_id'],
            final_slot=result['final_slot'],
            negotiation_rounds=rounds,
            final_scores=result['final_scores'],
            success=result['success'],
            final_alternatives=result.get('final_alternatives'),
            failure_reasons=result.get('failure_reasons'),
            accepted_by_all=result.get('accepted_by_all', False)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Negotiation failed: {str(e)}")


@app.post("/batch-negotiate")
async def batch_negotiate(scenarios: List[NegotiationScenario]) -> List[NegotiationResult]:
    """
    Run negotiation for multiple scenarios.
    
    Args:
        scenarios: List of scenarios
    
    Returns:
        List of results
    """
    if scheduler_model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    results = []
    for scenario in scenarios:
        result = await negotiate(scenario)
        results.append(result)
    
    return results


@app.get("/slots")
async def get_all_slots() -> Dict[str, Any]:
    """Get all available time slots."""
    if slot_names is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    return {
        "total_slots": len(slot_names),
        "slots": slot_names,
        "days": ["Mo", "Tu", "We", "Th", "Fr"],
        "hours": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]
    }


@app.get("/config")
async def get_config() -> Dict[str, Any]:
    """Get model configuration."""
    return {
        "model": {
            "embedding_dim": config.MODEL_DIM,
            "num_heads": config.NUM_HEADS,
            "num_layers": config.NUM_LAYERS,
            "feedforward_dim": config.FEEDFORWARD_DIM,
            "dropout": config.DROPOUT
        },
        "training": {
            "batch_size": config.BATCH_SIZE,
            "learning_rate": config.LEARNING_RATE,
            "epochs": config.NUM_EPOCHS
        },
        "agents": {
            "room_manager": "Provides available rooms and time slots",
            "teacher": "Provides preferred time slots and constraints",
            "students": "Provides group preferences and constraints"
        },
        "satisfaction_threshold": config.SATISFACTION_THRESHOLD
    }


@app.post("/explain-decision")
async def explain_decision(scenario: NegotiationScenario) -> Dict[str, Any]:
    """
    Get detailed explanation of negotiation process.
    
    Includes:
    - Round-by-round decisions
    - Attention weights (who influences who)
    - Satisfaction evolution
    - Why final slot was chosen
    
    Args:
        scenario: The scenario
    
    Returns:
        Detailed explanation
    """
    if scheduler_model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")
    
    result = scheduler_model.forward(scenario.dict(), slot_names)
    
    # Build detailed explanation
    explanation = {
        "scenario_id": result['scenario_id'],
        "final_decision": result['final_slot'],
        "final_satisfaction": result['final_scores'],
        "success": result['success'],
        "accepted_by_all": result.get('accepted_by_all', False),
        "final_alternatives": result.get('final_alternatives', []),
        "failure_reasons": result.get('failure_reasons', []),
        "negotiation_trace": [],
        "convergence": {
            "converged": result['final_scores']['global'] >= config.SATISFACTION_THRESHOLD,
            "final_global_score": result['final_scores']['global'],
            "num_rounds": len(result['negotiation_rounds'])
        }
    }
    
    # Build round-by-round trace
    for round_data in result['negotiation_rounds']:
        trace_item = {
            "round": round_data['round'],
            "proposed_slot": round_data['proposed_slot'],
            "scores": round_data['scores'],
            "explanation": round_data['explanation'],
            "agent_proposals": round_data.get('agent_proposals', {}),
            "agent_feedback": round_data.get('agent_feedback', {}),
            "accepted_by_all": round_data.get('accepted_by_all', False),
            "alternative_slots": round_data.get('alternative_slots', []),
            "attention_weights_summary": {
                "room_manager": {
                    "attends_to_teacher": float(round_data['attention_weights'][0, 1]),
                    "attends_to_students": float(round_data['attention_weights'][0, 2])
                },
                "teacher": {
                    "attends_to_room": float(round_data['attention_weights'][1, 0]),
                    "attends_to_students": float(round_data['attention_weights'][1, 2])
                },
                "students": {
                    "attends_to_room": float(round_data['attention_weights'][2, 0]),
                    "attends_to_teacher": float(round_data['attention_weights'][2, 1])
                }
            }
        }
        explanation['negotiation_trace'].append(trace_item)
    
    return explanation


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config.API_HOST,
        port=config.API_PORT,
        log_level="info"
    )
