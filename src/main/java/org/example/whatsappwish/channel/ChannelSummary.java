package org.example.whatsappwish.channel;

/** Lightweight channel reference used when embedding a contact's channels. */
public record ChannelSummary(Long id, String name) {
    public static ChannelSummary from(Channel channel) {
        return new ChannelSummary(channel.getId(), channel.getName());
    }
}
