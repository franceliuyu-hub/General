package com.example.schedule_back_end.dto.auth;

public record ChangePasswordRequest(
        String oldPassword,
        String newPassword
) {
}
