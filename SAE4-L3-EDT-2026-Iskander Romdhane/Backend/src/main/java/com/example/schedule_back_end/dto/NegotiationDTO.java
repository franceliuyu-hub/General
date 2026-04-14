package com.example.schedule_back_end.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NegotiationDTO {
    @JsonProperty("scenario_id")
    private String scenarioId;

    @JsonProperty("timestamp")
    private String timestamp;

    @JsonProperty("difficulty")
    private String difficulty;

    @JsonProperty("room_manager")
    private RoomManager roomManager;

    @JsonProperty("teacher")
    private Teacher teacher;

    @JsonProperty("students")
    private Students students;

    @JsonProperty("all_possible_slots")
    private List<String> allPossibleSlots;

    @JsonProperty("target_slot")
    private String targetSlot;

    @JsonProperty("final_slot")
    private String finalSlot;

    @JsonProperty("negotiation_rounds")
    private List<NegotiationRound> negotiationRounds;

    @JsonProperty("final_scores")
    private Scores finalScores;

    @JsonProperty("success")
    private Boolean success;

    @JsonProperty("final_alternatives")
    private List<AlternativeSlot> finalAlternatives;

    @JsonProperty("failure_reasons")
    private List<String> failureReasons;

    @JsonProperty("accepted_by_all")
    private Boolean acceptedByAll;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NegotiationRound {
        @JsonProperty("round")
        private Integer round;

        @JsonProperty("proposed_slot")
        private String proposedSlot;

        @JsonProperty("predicted_idx")
        private Integer predictedIdx;

        @JsonProperty("scores")
        private Scores scores;

        @JsonProperty("explanation")
        private String explanation;

        @JsonProperty("agent_proposals")
        private Map<String, AgentProposal> agentProposals;

        @JsonProperty("agent_feedback")
        private Map<String, AgentFeedback> agentFeedback;

        @JsonProperty("accepted_by_all")
        private Boolean acceptedByAll;

        @JsonProperty("alternative_slots")
        private List<AlternativeSlot> alternativeSlots;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Scores {
        @JsonProperty("room")
        private Double room;

        @JsonProperty("teacher")
        private Double teacher;

        @JsonProperty("student")
        private Double student;

        @JsonProperty("global")
        private Double global;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentProposal {
        @JsonProperty("slot")
        private String slot;

        @JsonProperty("scores")
        private Scores scores;

        @JsonProperty("reason")
        private String reason;

        @JsonProperty("decision_score")
        private Double decisionScore;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentFeedback {
        @JsonProperty("status")
        private String status;

        @JsonProperty("message")
        private String message;

        @JsonProperty("counter_slot")
        private String counterSlot;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlternativeSlot {
        @JsonProperty("slot")
        private String slot;

        @JsonProperty("global_score")
        private Double globalScore;

        @JsonProperty("room_score")
        private Double roomScore;

        @JsonProperty("teacher_score")
        private Double teacherScore;

        @JsonProperty("student_score")
        private Double studentScore;
    }
}
