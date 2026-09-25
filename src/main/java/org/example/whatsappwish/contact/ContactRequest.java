package org.example.whatsappwish.contact;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Payload for creating or updating a contact. */
public record ContactRequest(
        @NotBlank(message = "phoneNumber is required")
        @Pattern(regexp = "\\+?[0-9 ()-]{6,20}", message = "phoneNumber must be a valid phone number")
        String phoneNumber,

        String whatsappName,

        @NotBlank(message = "intendedName is required")
        String intendedName,

        /** Optional: id of the single channel this contact should belong to (null = none). */
        Long channelId
) {
}
