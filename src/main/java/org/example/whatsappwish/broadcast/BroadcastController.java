package org.example.whatsappwish.broadcast;

import jakarta.validation.Valid;
import org.example.whatsappwish.whatsapp.WhatsappClient;
import org.example.whatsappwish.whatsapp.WhatsappStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class BroadcastController {

    private final BroadcastService broadcastService;
    private final WhatsappClient whatsappClient;

    public BroadcastController(BroadcastService broadcastService, WhatsappClient whatsappClient) {
        this.broadcastService = broadcastService;
        this.whatsappClient = whatsappClient;
    }

    /** Live WhatsApp connection status (includes QR code when login is pending). */
    @GetMapping("/whatsapp/status")
    public WhatsappStatus whatsappStatus() {
        return whatsappClient.status();
    }

    /** Renders the message per-contact without sending — useful to sanity-check names. */
    @PostMapping("/broadcast/preview")
    public BroadcastResult preview(@Valid @RequestBody BroadcastRequest request) {
        return broadcastService.preview(request);
    }

    /** Actually sends the broadcast. */
    @PostMapping("/broadcast")
    public BroadcastResult broadcast(@Valid @RequestBody BroadcastRequest request) {
        return broadcastService.broadcast(request);
    }
}
