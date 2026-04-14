package com.example.schedule_back_end.repository.projection;

import com.example.schedule_back_end.model.Niveau;
import com.example.schedule_back_end.model.StatutNegotiation;

import java.time.LocalDateTime;

public interface NegotiationSummaryProjection {
    Long getId();
    String getTitre();
    String getDescription();
    String getScenarioId();
    Niveau getNiveau();
    String getFiliere();
    String getFinalSlot();
    Float getScoreConsensus();
    Boolean getSuccess();
    StatutNegotiation getStatut();
    LocalDateTime getDateOuverture();
    LocalDateTime getDateCloture();
}
