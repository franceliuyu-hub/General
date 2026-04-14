package com.example.schedule_back_end.dto.auth;

import com.example.schedule_back_end.model.GestionnaireSalle;
import com.example.schedule_back_end.model.Users;

public record AuthUserResponse(
        Long id,
        String username,
        String email,
        String nom,
        String prenom,
        String telephone,
        String departement,
        String ville,
        String bio,
        String role
) {
    public static AuthUserResponse fromUser(Users user) {
        String telephone = null;
        String departement = null;

        if (user instanceof GestionnaireSalle gestionnaireSalle) {
            telephone = gestionnaireSalle.getTelephone();
            departement = gestionnaireSalle.getDepartement();
        }

        return new AuthUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getNom(),
                user.getPrenom(),
                telephone,
                departement,
                user.getVille(),
                user.getBio(),
                user.getRole().name()
        );
    }
}
