package com.example.schedule_back_end.service;

import com.example.schedule_back_end.dto.auth.AuthUserResponse;
import com.example.schedule_back_end.dto.auth.ChangePasswordRequest;
import com.example.schedule_back_end.dto.auth.LoginRequest;
import com.example.schedule_back_end.dto.auth.RegisterRequest;
import com.example.schedule_back_end.dto.auth.UpdateProfileRequest;
import com.example.schedule_back_end.model.GestionnaireSalle;
import com.example.schedule_back_end.model.Users;
import com.example.schedule_back_end.repository.GestionnaireSalleRepository;
import com.example.schedule_back_end.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsersRepository usersRepository;
    private final GestionnaireSalleRepository gestionnaireSalleRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthUserResponse register(RegisterRequest request) {
        String username = normalize(request.username(), "Le nom d'utilisateur est obligatoire.");
        String email = normalize(request.email(), "L'email est obligatoire.").toLowerCase();
        String password = normalize(request.password(), "Le mot de passe est obligatoire.");
        String nom = normalize(request.nom(), "Le nom est obligatoire.");
        String prenom = normalize(request.prenom(), "Le prenom est obligatoire.");

        if (password.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le mot de passe doit contenir au moins 6 caracteres.");
        }
        if (usersRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce nom d'utilisateur existe deja.");
        }
        if (usersRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email existe deja.");
        }

        GestionnaireSalle user = new GestionnaireSalle();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setTelephone(trimToNull(request.telephone()));
        user.setDepartement(trimToNull(request.departement()));
        user.setVille(trimToNull(request.ville()));
        user.setBio(trimToNull(request.bio()));

        return AuthUserResponse.fromUser(gestionnaireSalleRepository.save(user));
    }

    public AuthUserResponse login(LoginRequest request) {
        String identifier = normalize(request.identifier(), "Le nom d'utilisateur ou l'email est obligatoire.");
        String password = normalize(request.password(), "Le mot de passe est obligatoire.");

        Users user = usersRepository.findByUsernameIgnoreCase(identifier)
                .or(() -> usersRepository.findByEmailIgnoreCase(identifier))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nom d'utilisateur, email ou mot de passe incorrect."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nom d'utilisateur, email ou mot de passe incorrect.");
        }

        return AuthUserResponse.fromUser(user);
    }

    public AuthUserResponse getProfile(Long userId) {
        return AuthUserResponse.fromUser(findUser(userId));
    }

    public AuthUserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        Users baseUser = findUser(userId);
        if (!(baseUser instanceof GestionnaireSalle user)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seul le role Room Manager est pris en charge ici.");
        }

        String username = normalize(request.username(), "Le nom d'utilisateur est obligatoire.");
        String email = normalize(request.email(), "L'email est obligatoire.").toLowerCase();
        String nom = normalize(request.nom(), "Le nom est obligatoire.");
        String prenom = normalize(request.prenom(), "Le prenom est obligatoire.");

        usersRepository.findByUsernameIgnoreCase(username)
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce nom d'utilisateur existe deja.");
                });

        usersRepository.findByEmailIgnoreCase(email)
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email existe deja.");
                });

        user.setUsername(username);
        user.setEmail(email);
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setTelephone(trimToNull(request.telephone()));
        user.setDepartement(trimToNull(request.departement()));
        user.setVille(trimToNull(request.ville()));
        user.setBio(trimToNull(request.bio()));

        return AuthUserResponse.fromUser(gestionnaireSalleRepository.save(user));
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        Users user = findUser(userId);
        String oldPassword = normalize(request.oldPassword(), "L'ancien mot de passe est obligatoire.");
        String newPassword = normalize(request.newPassword(), "Le nouveau mot de passe est obligatoire.");

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'ancien mot de passe est incorrect.");
        }
        if (newPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nouveau mot de passe doit contenir au moins 6 caracteres.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        usersRepository.save(user);
    }

    private Users findUser(Long userId) {
        return usersRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
    }

    private String normalize(String value, String errorMessage) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
