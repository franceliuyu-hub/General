package com.example.schedule_back_end.repository.projection;

import com.example.schedule_back_end.model.Niveau;
import com.example.schedule_back_end.model.StatutNegotiation;

import java.time.LocalDateTime;

public interface NegotiationDetailsProjection {
    Long getId();
    String getTitre();
    String getDescription();
    String getScenarioId();
    Niveau getNiveau();
    String getFiliere();
    String getDifficulty();
    String getTargetSlot();
    String getFinalSlot();
    Float getScoreConsensus();
    Boolean getSuccess();
    StatutNegotiation getStatut();
    LocalDateTime getDateOuverture();
    LocalDateTime getDateCloture();
    String getRequestPayload();
    String getResponsePayload();
}
