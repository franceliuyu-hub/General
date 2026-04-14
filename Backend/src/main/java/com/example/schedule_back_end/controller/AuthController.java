package com.example.schedule_back_end.controller;

import com.example.schedule_back_end.dto.auth.AuthUserResponse;
import com.example.schedule_back_end.dto.auth.ChangePasswordRequest;
import com.example.schedule_back_end.dto.auth.LoginRequest;
import com.example.schedule_back_end.dto.auth.RegisterRequest;
import com.example.schedule_back_end.dto.auth.UpdateProfileRequest;
import com.example.schedule_back_end.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AuthController {

    private final AuthService authService;

    @PostMapping("/auth/register")
    public ResponseEntity<AuthUserResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<AuthUserResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/users/{userId}/profile")
    public ResponseEntity<AuthUserResponse> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(authService.getProfile(userId));
    }

    @PutMapping("/users/{userId}/profile")
    public ResponseEntity<AuthUserResponse> updateProfile(
            @PathVariable Long userId,
            @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(authService.updateProfile(userId, request));
    }

    @PutMapping("/users/{userId}/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable Long userId,
            @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(userId, request);
        return ResponseEntity.ok(Map.of("message", "Mot de passe mis a jour avec succes."));
    }
}
