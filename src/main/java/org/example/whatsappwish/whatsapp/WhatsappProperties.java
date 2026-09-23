package org.example.whatsappwish.whatsapp;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Settings for reaching the Node whatsapp-web.js sidecar. */
@ConfigurationProperties(prefix = "whatsapp")
public record WhatsappProperties(
        /** Base URL of the Node service, e.g. http://localhost:3000 */
        String serviceUrl
) {
    public WhatsappProperties {
        if (serviceUrl == null || serviceUrl.isBlank()) {
            serviceUrl = "http://localhost:3000";
        }
    }
}
