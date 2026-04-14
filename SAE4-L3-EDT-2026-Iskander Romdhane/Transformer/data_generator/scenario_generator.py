"""
Dataset Generator for SchedulingTransformer.
Generates synthetic negotiation scenarios for training and testing.
"""

import random
import json
from typing import Dict, List, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import config
from utils.satisfaction import SatisfactionEvaluator


@dataclass
class Room:
    """Room entity with capacity and available time slots."""
    room_id: str
    capacity: int
    available_slots: List[str]  # e.g., ["Mo-09:00", "Mo-10:00", ...]


@dataclass
class TeacherPreferences:
    """Teacher's scheduling preferences and constraints."""
    teacher_id: str
    preferred_slots: List[str]
    unavailable_slots: List[str]
    min_slots_needed: int = 1


@dataclass
class StudentPreferences:
    """Student group preferences and constraints."""
    group_id: str
    preferred_slots: List[str]
    constraints: Dict[str, Any]  # e.g., {"no_early_morning": True, "max_days_per_week": 3}


class ScenarioGenerator:
    """Generates synthetic negotiation scenarios."""
    
    DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr']
    HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
    
    def __init__(self, seed: int = None):
        if seed is not None:
            random.seed(seed)
        self.all_slots = self._generate_all_slots()
    
    def _generate_all_slots(self) -> List[str]:
        """Generate all possible time slots."""
        slots = []
        for day in self.DAYS[:config.AVAILABLE_DAYS]:
            for hour in self.HOURS[:config.AVAILABLE_HOURS]:
                slots.append(f"{day}-{hour}")
        return slots
    
    def _generate_rooms(self, num_rooms: int = None) -> List[Room]:
        """Generate room instances with random availability."""
        if num_rooms is None:
            num_rooms = config.NUM_ROOMS
        
        rooms = []
        for i in range(num_rooms):
            capacity = random.randint(
                config.ROOM_CAPACITY_RANGE[0],
                config.ROOM_CAPACITY_RANGE[1]
            )
            # Each room has 70% of slots available
            available_slots = random.sample(
                self.all_slots,
                int(len(self.all_slots) * 0.7)
            )
            rooms.append(Room(
                room_id=f"ROOM-{i+1:03d}",
                capacity=capacity,
                available_slots=available_slots
            ))
        return rooms
    
    def _generate_teacher_preferences(self) -> TeacherPreferences:
        """Generate teacher preferences."""
        preferred = random.sample(
            self.all_slots,
            config.NUM_PREFERRED_SLOTS_TEACHER
        )
        unavailable = random.sample(
            self.all_slots,
            config.NUM_UNAVAILABLE_SLOTS_TEACHER
        )
        # Ensure no overlap
        unavailable = [s for s in unavailable if s not in preferred]
        
        return TeacherPreferences(
            teacher_id="T001",
            preferred_slots=preferred,
            unavailable_slots=unavailable,
            min_slots_needed=1
        )
    
    def _generate_student_preferences(self) -> StudentPreferences:
        """Generate student group preferences."""
        preferred = random.sample(
            self.all_slots,
            config.NUM_PREFERRED_SLOTS_STUDENT
        )
        
        constraints = {
            "no_early_morning": random.choice([True, False]),
            "no_late_afternoon": random.choice([True, False]),
            "max_days_per_week": random.randint(2, 5),
            "preferred_days": random.sample(self.DAYS, random.randint(2, 5))
        }
        
        return StudentPreferences(
            group_id="GROUP-001",
            preferred_slots=preferred,
            constraints=constraints
        )
    
    def generate_scenario(self, difficulty: str = "medium") -> Dict[str, Any]:
        """
        Generate a synthetic negotiation scenario.
        
        Args:
            difficulty: "easy", "medium", or "hard" (affects conflict levels)
        
        Returns:
            Scenario dict with room_manager, teacher, and students info
        """
        rooms = self._generate_rooms()
        teacher = self._generate_teacher_preferences()
        students = self._generate_student_preferences()
        
        # Select target slot (optional, for supervised scenario)
        target_slot = self._find_satisfactory_slot(rooms, teacher, students, difficulty)
        
        scenario = {
            "scenario_id": f"SCENARIO-{random.randint(10000, 99999)}",
            "timestamp": datetime.now().isoformat(),
            "room_manager": {
                "rooms": [asdict(r) for r in rooms],
                "total_slots_available": len(self.all_slots)
            },
            "teacher": asdict(teacher),
            "students": asdict(students),
            "all_possible_slots": self.all_slots,
            "target_slot": target_slot,  # Ground truth (if exists)
            "difficulty": difficulty
        }
        
        return scenario
    
    def _find_satisfactory_slot(self, rooms: List[Room], 
                                teacher: TeacherPreferences,
                                students: StudentPreferences,
                                difficulty: str) -> str:
        """
        Find the best compromise slot for diagnostics/training.

        Important:
        - this target is not meant to force inference
        - it is only a reference for evaluation or supervised fine-tuning
        """
        scenario = {
            "room_manager": {
                "rooms": [asdict(r) for r in rooms],
                "total_slots_available": len(self.all_slots)
            },
            "teacher": asdict(teacher),
            "students": asdict(students),
            "all_possible_slots": self.all_slots,
            "difficulty": difficulty
        }

        evaluator = SatisfactionEvaluator(scenario, self.all_slots)
        best_slot, _ = evaluator.best_compromise_slot()
        return best_slot
    
    def generate_batch(self, batch_size: int, difficulty: str = "medium") -> List[Dict[str, Any]]:
        """Generate a batch of scenarios."""
        return [self.generate_scenario(difficulty) for _ in range(batch_size)]
    
    @staticmethod
    def save_scenario(scenario: Dict[str, Any], filepath: str):
        """Save scenario to JSON file."""
        with open(filepath, 'w') as f:
            json.dump(scenario, f, indent=2)
    
    @staticmethod
    def load_scenario(filepath: str) -> Dict[str, Any]:
        """Load scenario from JSON file."""
        with open(filepath, 'r') as f:
            return json.load(f)


# Example usage
if __name__ == "__main__":
    gen = ScenarioGenerator(seed=config.SEED)
    scenario = gen.generate_scenario(difficulty="medium")
    
    print("=" * 60)
    print("GENERATED SCENARIO")
    print("=" * 60)
    print(json.dumps(scenario, indent=2))
