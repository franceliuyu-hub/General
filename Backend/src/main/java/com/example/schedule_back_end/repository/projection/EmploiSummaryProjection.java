package com.example.schedule_back_end.repository.projection;

import com.example.schedule_back_end.model.StatutEmploi;

import java.time.LocalDateTime;

public interface EmploiSummaryProjection {
    Long getId();
    Long getNegotiationId();
    String getNegotiationTitre();
    String getNegotiationNiveau();
    String getNegotiationFiliere();
    String getNegotiationFinalSlot();
    String getAnneeUniversitaire();
    String getPromotion();
    Float getScoreSatisfaction();
    StatutEmploi getStatut();
    LocalDateTime getGeneratedAt();
}
