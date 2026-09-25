package org.example.whatsappwish.channel;

import jakarta.validation.constraints.NotBlank;

/** Payload for creating or renaming a channel. */
public record ChannelRequest(
        @NotBlank(message = "name is required")
        String name
) {
}
