package org.example.whatsappwish.broadcast;

import org.example.whatsappwish.channel.Channel;
import org.example.whatsappwish.channel.ChannelRepository;
import org.example.whatsappwish.config.NotFoundException;
import org.example.whatsappwish.contact.Contact;
import org.example.whatsappwish.contact.ContactRepository;
import org.example.whatsappwish.whatsapp.WhatsappClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

@Service
public class BroadcastService {

    private static final Logger log = LoggerFactory.getLogger(BroadcastService.class);

    private final ContactRepository contactRepository;
    private final ChannelRepository channelRepository;
    private final WhatsappClient whatsappClient;

    public BroadcastService(ContactRepository contactRepository,
                            ChannelRepository channelRepository,
                            WhatsappClient whatsappClient) {
        this.contactRepository = contactRepository;
        this.channelRepository = channelRepository;
        this.whatsappClient = whatsappClient;
    }

    @Transactional
    public BroadcastResult broadcast(BroadcastRequest request) {
        List<Contact> targets = resolveTargets(request.contactIds(), request.channelIds());
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
    @Transactional(readOnly = true)
    public BroadcastResult preview(BroadcastRequest request) {
        List<Contact> targets = resolveTargets(request.contactIds(), request.channelIds());
        List<BroadcastResult.RecipientResult> results = targets.stream()
                .map(c -> new BroadcastResult.RecipientResult(
                        c.getId(), c.getPhoneNumber(), c.getIntendedName(),
                        MessageRenderer.render(request.messageTemplate(), c.getIntendedName()),
                        "PREVIEW", null))
                .toList();
        return new BroadcastResult(targets.size(), 0, 0, results);
    }

    /**
     * Resolves the recipient list as the union of the given individual contacts and the
     * members of the given channels, deduplicated by contact id (a {@link LinkedHashMap}
     * preserves order and guarantees one entry per contact). When both lists are empty,
     * the broadcast targets ALL contacts.
     */
    private List<Contact> resolveTargets(List<Long> contactIds, List<Long> channelIds) {
        boolean noContacts = contactIds == null || contactIds.isEmpty();
        boolean noChannels = channelIds == null || channelIds.isEmpty();
        if (noContacts && noChannels) {
            return contactRepository.findAll();
        }

        LinkedHashMap<Long, Contact> byId = new LinkedHashMap<>();
        if (!noContacts) {
            for (Contact c : contactRepository.findAllById(contactIds)) {
                byId.put(c.getId(), c);
            }
        }
        if (!noChannels) {
            for (Channel channel : channelRepository.findAllById(channelIds)) {
                for (Contact c : channel.getContacts()) {
                    byId.put(c.getId(), c);
                }
            }
        }
        return new ArrayList<>(byId.values());
    }
}
