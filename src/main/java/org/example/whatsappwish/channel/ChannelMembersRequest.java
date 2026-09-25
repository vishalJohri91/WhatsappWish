package org.example.whatsappwish.channel;

/** Payload for replacing the full member list of a channel. */
public record ChannelMembersRequest(
        java.util.List<Long> contactIds
) {
}
