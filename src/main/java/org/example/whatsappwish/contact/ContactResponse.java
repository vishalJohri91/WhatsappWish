package org.example.whatsappwish.contact;

import org.example.whatsappwish.channel.ChannelSummary;

import java.time.Instant;

/** Contact returned to the client. */
public record ContactResponse(
        Long id,
        String phoneNumber,
        String whatsappName,
        String intendedName,
        Instant createdAt,
        ChannelSummary channel
) {
    public static ContactResponse from(Contact contact) {
        ChannelSummary channel = contact.getChannel() == null
                ? null
                : ChannelSummary.from(contact.getChannel());
        return new ContactResponse(
                contact.getId(),
                contact.getPhoneNumber(),
                contact.getWhatsappName(),
                contact.getIntendedName(),
                contact.getCreatedAt(),
                channel);
    }
}
