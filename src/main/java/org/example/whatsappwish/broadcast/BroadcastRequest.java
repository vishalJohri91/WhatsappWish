package org.example.whatsappwish.broadcast;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * A broadcast request. {@code messageTemplate} may contain a name placeholder
 * (e.g. {@code <Intended Name>}) which is replaced per-contact with their intended name.
 *
 * <p>Recipients are the union of {@code contactIds} and the members of {@code channelIds},
 * deduplicated by contact so nobody receives the message twice. If BOTH lists are null or
 * empty, the message goes to ALL contacts.
 */
public record BroadcastRequest(
        @NotBlank(message = "messageTemplate is required")
        String messageTemplate,

        List<Long> contactIds,

        List<Long> channelIds
) {
}
