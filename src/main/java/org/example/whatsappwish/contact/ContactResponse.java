package org.example.whatsappwish.contact;

import java.time.Instant;

/** Contact returned to the client. */
public record ContactResponse(
        Long id,
        String phoneNumber,
        String whatsappName,
        String intendedName,
        Instant createdAt
) {
    public static ContactResponse from(Contact contact) {
        return new ContactResponse(
                contact.getId(),
                contact.getPhoneNumber(),
                contact.getWhatsappName(),
                contact.getIntendedName(),
                contact.getCreatedAt());
    }
}
