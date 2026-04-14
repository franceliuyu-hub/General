package com.example.schedule_back_end.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Data;

@Entity
@Data
public class GestionnaireSalle extends  Users{
    private String telephone;

    @Column(unique = true)
    private String matricule;

    private String departement;

}
