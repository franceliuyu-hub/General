package com.example.schedule_back_end.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Data;

@Entity
@Data
public class RepresentantEtudiant extends Users {

    @Column(nullable = false)
    private String promotion;

    private String groupe;

    @Column(nullable = false)
    private String filiere;

    @Column(nullable = false, unique = true)
    private String numeroEtudiant;
}
