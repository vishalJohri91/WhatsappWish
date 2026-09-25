package org.example.whatsappwish.channel;

import java.time.Instant;
import java.util.List;

/**
 * Channel returned to the client. Includes the member count (for badges) and the
 * ids of member contacts (so the UI can render membership editors without a second call).
 */
public record ChannelResponse(
        Long id,
        String name,
        Instant createdAt,
        int memberCount,
        List<Long> contactIds
) {
    public static ChannelResponse from(Channel channel) {
        List<Long> ids = channel.getContacts().stream()
                .map(c -> c.getId())
                .toList();
        return new ChannelResponse(
                channel.getId(),
                channel.getName(),
                channel.getCreatedAt(),
                ids.size(),
                ids);
    }
}
