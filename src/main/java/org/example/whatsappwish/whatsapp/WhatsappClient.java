package org.example.whatsappwish.whatsapp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Thin HTTP client for the Node whatsapp-web.js sidecar.
 * The sidecar owns the actual WhatsApp Web session (QR login, sending).
 */
@Component
@EnableConfigurationProperties(WhatsappProperties.class)
public class WhatsappClient {

    private static final Logger log = LoggerFactory.getLogger(WhatsappClient.class);

    private final RestClient restClient;

    public WhatsappClient(WhatsappProperties properties, RestClient.Builder builder) {
        this.restClient = builder.baseUrl(properties.serviceUrl()).build();
    }

    /** Fetches connection status (and QR code, if login is pending) from the sidecar. */
    public WhatsappStatus status() {
        try {
            WhatsappStatus status = restClient.get()
                    .uri("/status")
                    .retrieve()
                    .body(WhatsappStatus.class);
            return status != null ? status : new WhatsappStatus(false, "UNKNOWN", null);
        } catch (Exception e) {
            log.warn("Could not reach WhatsApp sidecar: {}", e.getMessage());
            return new WhatsappStatus(false, "SIDECAR_UNREACHABLE", null);
        }
    }

    /**
     * Sends a message. Throws {@link WhatsappSendException} on any failure so the
     * broadcast layer can record it per-contact.
     */
    public void sendMessage(String phoneNumber, String message) {
        try {
            restClient.post()
                    .uri("/send")
                    .body(Map.of("phone", phoneNumber, "message", message))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            throw new WhatsappSendException(e.getMessage(), e);
        }
    }

    public static class WhatsappSendException extends RuntimeException {
        public WhatsappSendException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
