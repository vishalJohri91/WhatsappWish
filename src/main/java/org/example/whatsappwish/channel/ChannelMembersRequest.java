package org.example.whatsappwish.channel;

import java.util.List;

/** Payload for replacing the full member list of a channel. */
public record ChannelMembersRequest(
        List<Long> contactIds
) {
}
