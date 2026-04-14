package com.example.schedule_back_end.dto.negotiation;

import com.example.schedule_back_end.dto.NegotiationDTO;
import com.example.schedule_back_end.model.Niveau;

public record NegotiationSaveRequest(
        String titre,
        String description,
        Niveau niveau,
        String filiere,
        NegotiationDTO negotiationRequest,
        NegotiationDTO negotiationResponse
) {
}
