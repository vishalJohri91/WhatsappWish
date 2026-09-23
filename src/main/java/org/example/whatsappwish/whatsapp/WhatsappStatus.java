package org.example.whatsappwish.whatsapp;

/** Connection status of the WhatsApp sidecar, surfaced to the UI. */
public record WhatsappStatus(
        boolean ready,
        String state,
        String qr
) {
}
