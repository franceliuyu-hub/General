package com.example.schedule_back_end.dto.negotiation;

import com.example.schedule_back_end.model.StatutEmploi;

import java.time.LocalDateTime;

public record EmploiSummaryResponse(
        Long id,
        Long negotiationId,
        String negotiationTitle,
        String niveau,
        String filiere,
        String finalSlot,
        String anneeUniversitaire,
        String promotion,
        Float scoreSatisfaction,
        StatutEmploi statut,
        LocalDateTime generatedAt
) {
}
