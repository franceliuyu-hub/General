package com.example.schedule_back_end.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;


@Entity
@Data
@ToString(exclude = {"createdBy", "emploiDuTemps"})
@EqualsAndHashCode(exclude = {"createdBy", "emploiDuTemps"})
public class Negotiation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    private String description;

    @Column(unique = true)
    private String scenarioId;

    @Enumerated(EnumType.STRING)
    private Niveau niveau;

    private String filiere;

    private String difficulty;

    private String targetSlot;

    private String finalSlot;

    private Boolean success;

    @Column(nullable = false)
    private LocalDateTime dateOuverture;

    private LocalDateTime dateCloture;

    private Float scoreConsensus;

    @Enumerated(EnumType.STRING)
    private StatutNegotiation statut;

    @Column(columnDefinition = "TEXT")
    private String requestPayload;

    @Column(columnDefinition = "TEXT")
    private String responsePayload;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users createdBy;

    @OneToOne(mappedBy = "negotiation", fetch = FetchType.LAZY)
    private EmploiDuTemps emploiDuTemps;
}
