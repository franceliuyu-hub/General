package com.example.schedule_back_end.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Data
@ToString(exclude = {"owner", "negotiation"})
@EqualsAndHashCode(exclude = {"owner", "negotiation"})
public class EmploiDuTemps {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Float scoreSatisfaction;

    @Column(nullable = false)
    private String anneeUniversitaire;

    @Column(nullable = false)
    private String promotion;

    @Enumerated(EnumType.STRING)
    private StatutEmploi statut;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users owner;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "negotiation_id", nullable = false, unique = true)
    private Negotiation negotiation;
}
