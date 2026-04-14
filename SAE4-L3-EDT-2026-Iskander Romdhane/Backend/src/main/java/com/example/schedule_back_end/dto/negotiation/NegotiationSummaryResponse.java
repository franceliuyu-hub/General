package com.example.schedule_back_end.dto.negotiation;

import com.example.schedule_back_end.model.StatutNegotiation;

import java.time.LocalDateTime;

public record NegotiationSummaryResponse(
        Long id,
        String titre,
        String description,
        String scenarioId,
        String niveau,
        String filiere,
        String finalSlot,
        Float scoreConsensus,
        Boolean success,
        StatutNegotiation statut,
        LocalDateTime dateOuverture,
        LocalDateTime dateCloture
) {
}
