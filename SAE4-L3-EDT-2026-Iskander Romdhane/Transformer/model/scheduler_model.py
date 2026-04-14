"""
Complete Scheduler Model - orchestrates negotiation process.
Converts scenario data into model inputs and generates full negotiation traces.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Any, Tuple
from model.transformer import TransformerScheduler
from utils.satisfaction import SatisfactionEvaluator
import config


class SchedulerModel(nn.Module):
    """
    Complete scheduling model combining Transformer + satisfaction evaluation.
    
    This model:
    1. Takes a scenario (rooms, teacher, students)
    2. Converts to embeddings
    3. Runs negotiation (transformer attention)
    4. Evaluates satisfaction at each round
    5. Returns detailed negotiation trace
    """
    
    def __init__(self, num_slots: int = 40):
        super().__init__()
        
        self.num_slots = num_slots
        self.transformer = TransformerScheduler(
            d_model=config.MODEL_DIM,
            num_heads=config.NUM_HEADS,
            num_layers=config.NUM_LAYERS,
            d_ff=config.FEEDFORWARD_DIM,
            dropout=config.DROPOUT,
            num_slots=num_slots
        )
    
    def scenario_to_tensor(self, scenario: Dict[str, Any], 
                          slot_names: List[str]) -> Dict[str, torch.Tensor]:
        """
        Convert scenario dict to tensors for model input.
        
        Args:
            scenario: Raw scenario from ScenarioGenerator
            slot_names: List of all slot names
        
        Returns:
            Dict with batched tensors for rooms, teacher, students
        """
        slot_to_idx = {slot: i for i, slot in enumerate(slot_names)}
        
        # Initialize tensors (batch_size=1 for single scenario)
        rooms_tensor = torch.zeros(1, self.num_slots)
        teacher_tensor = torch.zeros(1, self.num_slots)
        students_tensor = torch.zeros(1, self.num_slots)
        
        rooms = scenario['room_manager']['rooms']
        teacher = scenario['teacher']
        students = scenario['students']

        # Room Manager: mark available slots
        for room in rooms:
            for slot in room['available_slots']:
                if slot in slot_to_idx:
                    rooms_tensor[0, slot_to_idx[slot]] += 1.0
        
        # Normalize by number of rooms
        if rooms:
            rooms_tensor = rooms_tensor / len(rooms)
        
        preferred_teacher_days = {slot.split('-')[0] for slot in teacher['preferred_slots']}
        preferred_teacher_hours = {slot.split('-')[1] for slot in teacher['preferred_slots']}

        # Teacher: preferred strongest, unavailable zero, related slots mildly positive.
        for slot in slot_to_idx:
            day, hour = slot.split('-')

            if slot in teacher['unavailable_slots']:
                teacher_tensor[0, slot_to_idx[slot]] = 0.0
            elif slot in teacher['preferred_slots']:
                teacher_tensor[0, slot_to_idx[slot]] = 1.0
            else:
                value = 0.2
                if day in preferred_teacher_days:
                    value += 0.15
                if hour in preferred_teacher_hours:
                    value += 0.15
                teacher_tensor[0, slot_to_idx[slot]] = value
        
        preferred_student_days = {slot.split('-')[0] for slot in students['preferred_slots']}
        preferred_student_hours = {slot.split('-')[1] for slot in students['preferred_slots']}
        student_constraints_data = students.get('constraints', {})

        for slot in slot_to_idx:
            day, hour = slot.split('-')

            if slot in students['preferred_slots']:
                students_tensor[0, slot_to_idx[slot]] = 1.0
            else:
                value = 0.25
                if day in preferred_student_days:
                    value += 0.15
                if hour in preferred_student_hours:
                    value += 0.1
                if student_constraints_data.get('preferred_days') and day in student_constraints_data['preferred_days']:
                    value += 0.1
                if student_constraints_data.get('no_early_morning') and hour in ('09:00', '10:00'):
                    value -= 0.2
                if student_constraints_data.get('no_late_afternoon') and hour in ('15:00', '16:00', '17:00'):
                    value -= 0.2
                students_tensor[0, slot_to_idx[slot]] = max(0.0, min(1.0, value))
        
        # Constraint tensors (batch_size=1, 4 features each)
        # Room constraints: [capacity_normalized, availability_ratio, room_count, occupancy_pressure]
        average_capacity = (
            sum(room['capacity'] for room in rooms) / len(rooms)
            if rooms else 0.0
        )
        average_availability = (
            sum(len(room['available_slots']) for room in rooms) / len(rooms)
            if rooms else 0.0
        )

        room_constraints = torch.tensor([[
            min(1.0, average_capacity / 100.0),
            average_availability / self.num_slots,
            min(1.0, float(len(rooms)) / 10.0),
            1.0 - min(1.0, average_availability / self.num_slots)
        ]], dtype=torch.float32)
        
        # Teacher constraints: [preference_count, unavailable_count, importance, flexibility]
        teacher_constraints = torch.tensor([[
            float(len(teacher['preferred_slots'])) / self.num_slots,
            float(len(teacher['unavailable_slots'])) / self.num_slots,
            0.8,
            max(0.0, 1.0 - (float(len(teacher['unavailable_slots'])) / self.num_slots) * 2.0)
        ]], dtype=torch.float32)
        
        # Student constraints: [preference_count, constraint_count, group_size, timing_flexibility]
        constraints = students.get('constraints', {})
        constraint_count = 0
        if constraints.get('no_early_morning'):
            constraint_count += 1
        if constraints.get('no_late_afternoon'):
            constraint_count += 1
        if constraints.get('preferred_days'):
            constraint_count += 1
        if constraints.get('max_days_per_week') is not None:
            constraint_count += 1
        
        student_constraints = torch.tensor([[
            float(len(students['preferred_slots'])) / self.num_slots,
            float(constraint_count) / 4.0,
            1.0,
            max(0.0, 1.0 - float(constraint_count) / 5.0)
        ]], dtype=torch.float32)
        
        return {
            'rooms': rooms_tensor,
            'teacher': teacher_tensor,
            'students': students_tensor,
            'room_constraints': room_constraints,
            'teacher_constraints': teacher_constraints,
            'student_constraints': student_constraints
        }

    def _get_round_profile(self, round_idx: int) -> Dict[str, Any]:
        """Return the concession profile for a negotiation round."""
        profiles = config.ROUND_PROFILES
        if round_idx < len(profiles):
            return profiles[round_idx]
        return profiles[-1]

    def _agent_focus_weights(self, agent_name: str, round_idx: int) -> Dict[str, float]:
        """
        Each party enters the discussion with its own priorities, then becomes
        slightly more conciliatory in later rounds.
        """
        concession = min(0.12 * round_idx, 0.24)

        if agent_name == "room_manager":
            return {
                "room": max(0.55, 0.80 - concession),
                "teacher": min(0.25, 0.10 + concession / 2),
                "student": min(0.25, 0.10 + concession / 2)
            }
        if agent_name == "teacher":
            return {
                "room": min(0.22, 0.10 + concession / 2),
                "teacher": max(0.55, 0.80 - concession),
                "student": min(0.28, 0.10 + concession)
            }
        return {
            "room": min(0.24, 0.10 + concession / 2),
            "teacher": min(0.26, 0.10 + concession),
            "student": max(0.55, 0.80 - concession)
        }

    def _agent_preference_flags(self, evaluator: SatisfactionEvaluator, slot: str) -> Dict[str, bool]:
        metadata = evaluator.slot_metadata(slot)
        return {
            "room_manager": metadata["room_ratio"] > 0.0,
            "teacher": metadata["teacher_preferred"] or evaluator.teacher_satisfaction(slot) >= 0.6,
            "students": metadata["student_preferred"] or evaluator.student_satisfaction(slot) >= 0.6
        }

    def _build_round_memory(self, rounds: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compact negotiation memory used to simulate a running discussion.
        """
        if not rounds:
            return {
                "previous_slots": [],
                "consensus_slots": set(),
                "proposal_history": {"room_manager": [], "teacher": [], "students": []},
                "rejected_slots": set(),
                "counter_slots": set(),
                "accepted_round": None
            }

        previous_slots = [round_data["proposed_slot"] for round_data in rounds]
        proposal_history = {
            "room_manager": [round_data["agent_proposals"]["room_manager"]["slot"] for round_data in rounds],
            "teacher": [round_data["agent_proposals"]["teacher"]["slot"] for round_data in rounds],
            "students": [round_data["agent_proposals"]["students"]["slot"] for round_data in rounds]
        }

        consensus_slots = set()
        for round_data in rounds:
            proposed_slots = {
                round_data["agent_proposals"]["room_manager"]["slot"],
                round_data["agent_proposals"]["teacher"]["slot"],
                round_data["agent_proposals"]["students"]["slot"]
            }
            if len(proposed_slots) < 3:
                consensus_slots.update(proposed_slots)

        rejected_slots = set()
        counter_slots = set()
        accepted_round = None
        for round_data in rounds:
            if round_data.get("accepted_by_all") and accepted_round is None:
                accepted_round = round_data["round"]

            for feedback in round_data.get("agent_feedback", {}).values():
                if feedback.get("status") == "reject":
                    rejected_slots.add(round_data["proposed_slot"])
                    counter_slot = feedback.get("counter_slot")
                    if counter_slot:
                        counter_slots.add(counter_slot)

        return {
            "previous_slots": previous_slots,
            "consensus_slots": consensus_slots,
            "proposal_history": proposal_history,
            "rejected_slots": rejected_slots,
            "counter_slots": counter_slots,
            "accepted_round": accepted_round
        }

    def _propose_slot_for_agent(
        self,
        agent_name: str,
        ranked_candidates: List[Dict[str, Any]],
        evaluator: SatisfactionEvaluator,
        round_idx: int,
        memory: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Simulate what each stakeholder would put on the table this round.
        """
        focus_weights = self._agent_focus_weights(agent_name, round_idx)
        previous_for_agent = set(memory["proposal_history"].get(agent_name, []))
        consensus_slots = memory["consensus_slots"]

        best_candidate = None
        best_value = -999.0

        for candidate in ranked_candidates[:10]:
            slot = candidate["slot"]
            scores = evaluator.evaluate_proposal(slot, weights=focus_weights)
            metadata = candidate["metadata"]
            support_flags = self._agent_preference_flags(evaluator, slot)

            value = scores["global"]
            if support_flags[agent_name]:
                value += 0.12
            if slot in consensus_slots:
                value += 0.06
            if slot in previous_for_agent:
                value -= 0.03
            if round_idx > 0 and (metadata["same_day_match"] or metadata["same_hour_match"]):
                value += 0.03

            if value > best_value:
                best_value = value
                best_candidate = {
                    "slot": slot,
                    "scores": scores,
                    "reason": self._agent_reason(agent_name, slot, evaluator, metadata, round_idx),
                    "decision_score": float(value)
                }

        return best_candidate or {
            "slot": ranked_candidates[0]["slot"],
            "scores": ranked_candidates[0]["scores"],
            "reason": f"{agent_name} falls back to the best currently feasible slot.",
            "decision_score": float(ranked_candidates[0]["decision_score"])
        }

    def _agent_reason(
        self,
        agent_name: str,
        slot: str,
        evaluator: SatisfactionEvaluator,
        metadata: Dict[str, Any],
        round_idx: int
    ) -> str:
        if agent_name == "room_manager":
            if metadata["room_ratio"] >= 0.6:
                return f"Round {round_idx + 1}: room manager supports {slot} because several rooms can host it."
            return f"Round {round_idx + 1}: room manager accepts {slot} because at least one room is available."

        if agent_name == "teacher":
            teacher_score = evaluator.teacher_satisfaction(slot)
            if metadata["teacher_preferred"]:
                return f"Round {round_idx + 1}: teacher proposes {slot} because it is a preferred teaching slot."
            if teacher_score >= 0.6:
                return f"Round {round_idx + 1}: teacher concedes toward {slot} because it remains acceptable."
            return f"Round {round_idx + 1}: teacher weakly accepts {slot} to keep negotiation moving."

        student_score = evaluator.student_satisfaction(slot)
        if metadata["student_preferred"]:
            return f"Round {round_idx + 1}: students propose {slot} because it matches their preferred timing."
        if student_score >= 0.6:
            return f"Round {round_idx + 1}: students can attend {slot} without major discomfort."
        return f"Round {round_idx + 1}: students tolerate {slot} as a compromise."

    def _select_committee_slot(
        self,
        ranked_candidates: List[Dict[str, Any]],
        agent_proposals: Dict[str, Dict[str, Any]],
        round_idx: int,
        previous_slots: List[str]
    ) -> Dict[str, Any]:
        """
        Committee decision:
        1. consider stakeholder proposals
        2. consider top ranked alternatives from the hybrid model
        3. pick the strongest compromise
        """
        proposal_slots = {proposal["slot"] for proposal in agent_proposals.values()}
        short_list = [candidate for candidate in ranked_candidates if candidate["slot"] in proposal_slots]

        for candidate in ranked_candidates[:3]:
            if candidate["slot"] not in proposal_slots:
                short_list.append(candidate)

        short_list.sort(key=lambda item: item["decision_score"], reverse=True)
        return self._choose_round_candidate(short_list or ranked_candidates, previous_slots, round_idx)

    def _build_failure_reasons(
        self,
        final_scores: Dict[str, float],
        evaluator: SatisfactionEvaluator,
        final_slot: str
    ) -> List[str]:
        reasons = []
        metadata = evaluator.slot_metadata(final_slot)

        if final_scores["global"] < config.SATISFACTION_THRESHOLD:
            reasons.append("Global satisfaction stayed below the acceptance threshold.")
        if final_scores["room"] < 0.5:
            reasons.append("Room availability remained weak for the selected slot.")
        if final_scores["teacher"] < 0.5:
            reasons.append("Teacher acceptance remained limited.")
        if final_scores["student"] < 0.5:
            reasons.append("Student preferences were only partially satisfied.")
        if metadata["student_soft_penalty"] > 0.25:
            reasons.append("Student timing constraints still impose a noticeable penalty.")

        return reasons

    def _find_agent_counter_slot(
        self,
        agent_name: str,
        ranked_candidates: List[Dict[str, Any]],
        evaluator: SatisfactionEvaluator,
        round_idx: int,
        excluded_slot: str
    ) -> str | None:
        """
        Find the next-best slot an agent would counter-propose after rejecting
        the committee proposal.
        """
        preferred_slot = self._propose_slot_for_agent(
            agent_name=agent_name,
            ranked_candidates=ranked_candidates,
            evaluator=evaluator,
            round_idx=round_idx,
            memory={
                "proposal_history": {"room_manager": [], "teacher": [], "students": []},
                "consensus_slots": set()
            }
        )["slot"]

        if preferred_slot != excluded_slot:
            return preferred_slot

        for candidate in ranked_candidates:
            if candidate["slot"] != excluded_slot:
                return candidate["slot"]

        return None

    def _evaluate_agent_feedback(
        self,
        proposed_slot: str,
        ranked_candidates: List[Dict[str, Any]],
        evaluator: SatisfactionEvaluator,
        round_idx: int
    ) -> Dict[str, Dict[str, Any]]:
        """
        After the committee proposes a slot, each party reacts explicitly:
        accept, accept_with_concession, or reject with a counter-proposal.
        """
        metadata = evaluator.slot_metadata(proposed_slot)
        teacher_score = evaluator.teacher_satisfaction(proposed_slot)
        student_score = evaluator.student_satisfaction(proposed_slot)

        feedback = {}

        if metadata["room_ratio"] <= 0.0:
            feedback["room_manager"] = {
                "status": "reject",
                "message": "Room manager rejects this slot because no room is actually available.",
                "counter_slot": self._find_agent_counter_slot("room_manager", ranked_candidates, evaluator, round_idx, proposed_slot)
            }
        elif metadata["room_ratio"] >= 0.6:
            feedback["room_manager"] = {
                "status": "accept",
                "message": "Room manager accepts because several rooms can host this slot.",
                "counter_slot": None
            }
        else:
            feedback["room_manager"] = {
                "status": "accept_with_concession",
                "message": "Room manager can host the slot, but room choice is limited.",
                "counter_slot": self._find_agent_counter_slot("room_manager", ranked_candidates, evaluator, round_idx, proposed_slot)
            }

        if not metadata["teacher_allowed"]:
            feedback["teacher"] = {
                "status": "reject",
                "message": "Teacher rejects because this slot is unavailable.",
                "counter_slot": self._find_agent_counter_slot("teacher", ranked_candidates, evaluator, round_idx, proposed_slot)
            }
        elif metadata["teacher_preferred"]:
            feedback["teacher"] = {
                "status": "accept",
                "message": "Teacher accepts because this is a preferred slot.",
                "counter_slot": None
            }
        elif teacher_score >= 0.6:
            feedback["teacher"] = {
                "status": "accept_with_concession",
                "message": "Teacher accepts as a compromise even though it is not ideal.",
                "counter_slot": self._find_agent_counter_slot("teacher", ranked_candidates, evaluator, round_idx, proposed_slot)
            }
        else:
            feedback["teacher"] = {
                "status": "reject",
                "message": "Teacher rejects because the slot is too far from preferred availability.",
                "counter_slot": self._find_agent_counter_slot("teacher", ranked_candidates, evaluator, round_idx, proposed_slot)
            }

        if metadata["student_preferred"]:
            feedback["students"] = {
                "status": "accept",
                "message": "Students accept because this slot matches their preferred timing.",
                "counter_slot": None
            }
        elif student_score >= 0.55:
            feedback["students"] = {
                "status": "accept_with_concession",
                "message": "Students can attend this slot, but it requires a concession.",
                "counter_slot": self._find_agent_counter_slot("students", ranked_candidates, evaluator, round_idx, proposed_slot)
            }
        else:
            feedback["students"] = {
                "status": "reject",
                "message": "Students reject because the timing remains uncomfortable.",
                "counter_slot": self._find_agent_counter_slot("students", ranked_candidates, evaluator, round_idx, proposed_slot)
            }

        return feedback

    def _rank_slots_for_round(
        self,
        slot_logits: torch.Tensor,
        slot_names: List[str],
        evaluator: SatisfactionEvaluator,
        round_idx: int,
        memory: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Hybrid ranking:
        - transformer probabilities give a learned prior
        - satisfaction + feasibility decide whether the slot is a good compromise
        """
        profile = self._get_round_profile(round_idx)
        slot_probs = F.softmax(slot_logits, dim=0)
        candidates = []

        feasible_slots = set(evaluator.get_candidate_slots())
        previous_slots = set(memory.get("previous_slots", []))
        rejected_slots = set(memory.get("rejected_slots", []))
        counter_slots = set(memory.get("counter_slots", []))

        for slot_idx, slot in enumerate(slot_names):
            metadata = evaluator.slot_metadata(slot)
            scores = evaluator.evaluate_proposal(slot, weights=profile['score_weights'])

            decision_score = (
                profile['model_weight'] * float(slot_probs[slot_idx].item())
                + (1.0 - profile['model_weight']) * scores['global']
                + profile['feasibility_bonus'] * metadata['room_ratio']
            )

            if metadata['teacher_preferred'] and metadata['student_preferred']:
                decision_score += profile['overlap_bonus']

            if metadata['same_day_match'] or metadata['same_hour_match']:
                decision_score += profile['same_day_hour_bonus']

            if slot in previous_slots:
                decision_score -= profile['repeat_penalty']

            if slot not in feasible_slots:
                decision_score -= 1.0
            if slot in rejected_slots:
                decision_score -= 0.18
            if slot in counter_slots:
                decision_score += 0.12

            candidates.append({
                'slot': slot,
                'slot_idx': slot_idx,
                'decision_score': float(decision_score),
                'scores': scores,
                'metadata': metadata,
                'model_probability': float(slot_probs[slot_idx].item())
            })

        candidates.sort(key=lambda item: item['decision_score'], reverse=True)
        return candidates

    def _choose_round_candidate(
        self,
        ranked_candidates: List[Dict[str, Any]],
        previous_slots: List[str],
        round_idx: int
    ) -> Dict[str, Any]:
        """
        Encourage visible negotiation movement in early rounds when several
        candidates are close, while still preserving the best compromise.
        """
        best = ranked_candidates[0]
        if round_idx >= len(config.ROUND_PROFILES) - 1 or not previous_slots:
            return best

        margin = 0.03
        for candidate in ranked_candidates[1:]:
            if candidate['slot'] in previous_slots:
                continue
            if candidate['decision_score'] >= best['decision_score'] - margin:
                weakest_best = min(best['scores']['room'], best['scores']['teacher'], best['scores']['student'])
                weakest_candidate = min(candidate['scores']['room'], candidate['scores']['teacher'], candidate['scores']['student'])
                if weakest_candidate >= weakest_best:
                    return candidate

        return best
    
    def forward(self, scenario: Dict[str, Any],
                slot_names: List[str]) -> Dict[str, Any]:
        """
        Run complete negotiation (single scenario).
        
        Args:
            scenario: Negotiation scenario
            slot_names: List of all slot names
        
        Returns:
            Dict with:
            - final_slot: Best proposed slot
            - negotiation_rounds: List of round details
            - success: Whether satisfied (global_score >= threshold)
        """
        # Convert scenario to tensors
        tensor_inputs = self.scenario_to_tensor(scenario, slot_names)
        
        # Get negotiation trace from transformer
        trace = self.transformer.get_negotiation_trace(tensor_inputs)
        
        # Evaluate satisfaction at each round
        evaluator = SatisfactionEvaluator(scenario, slot_names)
        
        rounds = []
        for round_idx, layer_output in enumerate(trace, 1):
            slot_logits = layer_output['slot_logits'][0]  # Remove batch dim

            memory = self._build_round_memory(rounds)
            ranked_candidates = self._rank_slots_for_round(
                slot_logits=slot_logits,
                slot_names=slot_names,
                evaluator=evaluator,
                round_idx=round_idx - 1,
                memory=memory
            )
            agent_proposals = {
                "room_manager": self._propose_slot_for_agent("room_manager", ranked_candidates, evaluator, round_idx - 1, memory),
                "teacher": self._propose_slot_for_agent("teacher", ranked_candidates, evaluator, round_idx - 1, memory),
                "students": self._propose_slot_for_agent("students", ranked_candidates, evaluator, round_idx - 1, memory)
            }
            selected = self._select_committee_slot(
                ranked_candidates=ranked_candidates,
                agent_proposals=agent_proposals,
                round_idx=round_idx - 1,
                previous_slots=memory["previous_slots"]
            )

            predicted_idx = selected['slot_idx']
            proposed_slot = selected['slot']
            scores = selected['scores']
            agent_feedback = self._evaluate_agent_feedback(
                proposed_slot=proposed_slot,
                ranked_candidates=ranked_candidates,
                evaluator=evaluator,
                round_idx=round_idx - 1
            )
            accepted_by_all = all(
                feedback["status"] in {"accept", "accept_with_concession"}
                for feedback in agent_feedback.values()
            )
            
            # Get explanation
            explanation = self._explain_decision(
                proposed_slot,
                scores,
                scenario,
                slot_names,
                selected['metadata'],
                round_idx,
                ranked_candidates[:3]
            )
            
            # Get attention weights
            attention = layer_output['attention_weights'][0].detach().numpy()
            
            rounds.append({
                'round': round_idx,
                'proposed_slot': proposed_slot,
                'predicted_idx': predicted_idx,
                'slot_logits': slot_logits.detach().numpy(),
                'attention_weights': attention,
                'scores': scores,
                'explanation': explanation,
                'decision_score': selected['decision_score'],
                'agent_proposals': agent_proposals,
                'agent_feedback': agent_feedback,
                'accepted_by_all': accepted_by_all,
                'alternative_slots': [
                    {
                        'slot': candidate['slot'],
                        'global_score': candidate['scores']['global'],
                        'room_score': candidate['scores']['room'],
                        'teacher_score': candidate['scores']['teacher'],
                        'student_score': candidate['scores']['student']
                    }
                    for candidate in ranked_candidates[:3]
                ]
            })
        
        accepted_rounds = [round_data for round_data in rounds if round_data.get('accepted_by_all')]
        if accepted_rounds:
            final_round = max(accepted_rounds, key=lambda item: (item['scores']['global'], item['decision_score']))
        else:
            # Final result = best compromise discovered across rounds, not simply last argmax.
            final_round = max(rounds, key=lambda item: (item['decision_score'], item['scores']['global']))
        failure_reasons = self._build_failure_reasons(final_round['scores'], evaluator, final_round['proposed_slot'])
        
        return {
            'scenario_id': scenario.get('scenario_id'),
            'final_slot': final_round['proposed_slot'],
            'negotiation_rounds': rounds,
            'final_scores': final_round['scores'],
            'success': final_round['scores']['global'] >= config.SATISFACTION_THRESHOLD,
            'slot_names': slot_names,
            'final_alternatives': final_round['alternative_slots'],
            'failure_reasons': failure_reasons,
            'accepted_by_all': final_round.get('accepted_by_all', False)
        }
    
    def _explain_decision(self, slot: str, scores: Dict[str, float],
                         scenario: Dict[str, Any], slot_names: List[str],
                         metadata: Dict[str, Any], round_idx: int,
                         top_candidates: List[Dict[str, Any]]) -> str:
        """
        Generate textual explanation of why this slot was chosen.
        
        Args:
            slot: The proposed slot
            scores: Satisfaction scores
            scenario: The scenario
            slot_names: All available slots
        
        Returns:
            Explanation string
        """
        explanation = f"Round {round_idx}: proposed {slot}. "
        
        if scores['global'] >= 0.8:
            explanation += "Excellent agreement across all agents. "
        elif scores['global'] >= 0.6:
            explanation += "Good compromise found. "
        else:
            explanation += "Negotiation still in progress. "
        
        # Add details about each agent
        reasons = []
        if scores['room'] >= 0.8:
            reasons.append("room available")
        if scores['teacher'] >= 0.8:
            reasons.append("teacher preferred")
        elif scores['teacher'] >= 0.6:
            reasons.append("teacher acceptable")
        if scores['student'] >= 0.8:
            reasons.append("students satisfied")
        elif scores['student'] >= 0.6:
            reasons.append("students can attend")
        
        if reasons:
            explanation += f"({', '.join(reasons)}). "

        if metadata['teacher_preferred'] and metadata['student_preferred']:
            explanation += "Both teacher and students explicitly prefer this slot. "
        elif metadata['room_ratio'] >= 0.6:
            explanation += "Several rooms can host this slot, which improves feasibility. "

        if len(top_candidates) > 1:
            runner_up = top_candidates[1]['slot']
            explanation += f"It ranked above nearby alternatives such as {runner_up}."
        
        return explanation
    
    def batch_negotiate(self, scenarios: List[Dict[str, Any]],
                       slot_names: List[str]) -> List[Dict[str, Any]]:
        """Run negotiation for multiple scenarios."""
        results = []
        for scenario in scenarios:
            result = self.forward(scenario, slot_names)
            results.append(result)
        return results


def create_model(num_slots: int = 40) -> SchedulerModel:
    """Factory function to create a scheduler model."""
    return SchedulerModel(num_slots=num_slots)
