package org.example.whatsappwish.broadcast;

import org.example.whatsappwish.config.NotFoundException;
import org.example.whatsappwish.contact.Contact;
import org.example.whatsappwish.contact.ContactRepository;
import org.example.whatsappwish.whatsapp.WhatsappClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BroadcastService {

    private static final Logger log = LoggerFactory.getLogger(BroadcastService.class);

    private final ContactRepository contactRepository;
    private final WhatsappClient whatsappClient;

    public BroadcastService(ContactRepository contactRepository, WhatsappClient whatsappClient) {
        this.contactRepository = contactRepository;
        this.whatsappClient = whatsappClient;
    }

    public BroadcastResult broadcast(BroadcastRequest request) {
        List<Contact> targets = resolveTargets(request.contactIds());
        if (targets.isEmpty()) {
            throw new NotFoundException("No contacts to send to");
        }

        List<BroadcastResult.RecipientResult> results = new ArrayList<>(targets.size());
        int sent = 0;
        int failed = 0;

        for (Contact contact : targets) {
            String message = MessageRenderer.render(request.messageTemplate(), contact.getIntendedName());
            try {
                whatsappClient.sendMessage(contact.getPhoneNumber(), message);
                sent++;
                results.add(new BroadcastResult.RecipientResult(
                        contact.getId(), contact.getPhoneNumber(), contact.getIntendedName(),
                        message, "SENT", null));
            } catch (Exception e) {
                failed++;
                log.warn("Failed to send to {} ({}): {}",
                        contact.getIntendedName(), contact.getPhoneNumber(), e.getMessage());
                results.add(new BroadcastResult.RecipientResult(
                        contact.getId(), contact.getPhoneNumber(), contact.getIntendedName(),
                        message, "FAILED", e.getMessage()));
            }
        }

        return new BroadcastResult(targets.size(), sent, failed, results);
    }

    /** Preview what each recipient would receive, without sending anything. */
    public BroadcastResult preview(BroadcastRequest request) {
        List<Contact> targets = resolveTargets(request.contactIds());
        List<BroadcastResult.RecipientResult> results = targets.stream()
                .map(c -> new BroadcastResult.RecipientResult(
                        c.getId(), c.getPhoneNumber(), c.getIntendedName(),
                        MessageRenderer.render(request.messageTemplate(), c.getIntendedName()),
                        "PREVIEW", null))
                .toList();
        return new BroadcastResult(targets.size(), 0, 0, results);
    }

    private List<Contact> resolveTargets(List<Long> contactIds) {
        if (contactIds == null || contactIds.isEmpty()) {
            return contactRepository.findAll();
        }
        return contactRepository.findAllById(contactIds);
    }
}
