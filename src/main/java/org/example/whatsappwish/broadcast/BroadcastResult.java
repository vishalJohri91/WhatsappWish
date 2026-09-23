package org.example.whatsappwish.broadcast;

import java.util.List;

/** Outcome of a broadcast, with a per-recipient breakdown. */
public record BroadcastResult(
        int total,
        int sent,
        int failed,
        List<RecipientResult> results
) {
    public record RecipientResult(
            Long contactId,
            String phoneNumber,
            String intendedName,
            String renderedMessage,
            String status,   // SENT or FAILED
            String error     // null when SENT
    ) {
    }
}
