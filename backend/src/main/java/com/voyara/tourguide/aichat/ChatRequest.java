package com.voyara.tourguide.aichat;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(@NotBlank String message) {
}
