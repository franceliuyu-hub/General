package com.example.schedule_back_end.dto.auth;

public record LoginRequest(
        String identifier,
        String password
) {
}
