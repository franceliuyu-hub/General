package com.example.schedule_back_end.dto.auth;

public record UpdateProfileRequest(
        String username,
        String email,
        String nom,
        String prenom,
        String telephone,
        String departement,
        String ville,
        String bio
) {
}
