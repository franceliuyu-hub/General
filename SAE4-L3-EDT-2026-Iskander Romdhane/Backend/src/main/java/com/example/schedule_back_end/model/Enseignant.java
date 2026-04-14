package com.example.schedule_back_end.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Data;
@Entity
@Data
public class Enseignant extends Users {

    @Column(nullable = false, unique = true)
    private String matricule;

    private String telephone;



}
