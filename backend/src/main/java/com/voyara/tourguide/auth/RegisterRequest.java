package com.voyara.tourguide.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @Size(min = 6, message = "must be at least 6 characters") String password,
        String phone,
        String nationality,
        String passportNumber,
        String preferences
) {
}
