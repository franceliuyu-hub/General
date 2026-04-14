package com.example.schedule_back_end.dto.auth;

public record RegisterRequest(
        String username,
        String email,
        String password,
        String nom,
        String prenom,
        String telephone,
        String departement,
        String ville,
        String bio
) {
}
