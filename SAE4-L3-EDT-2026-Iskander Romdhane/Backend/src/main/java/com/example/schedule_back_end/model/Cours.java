package com.example.schedule_back_end.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Cours {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String filiere;

    @Column(nullable = false)
    private Integer dureeMinutes;

    @Enumerated(EnumType.STRING)
    private TypeCours type;
}
