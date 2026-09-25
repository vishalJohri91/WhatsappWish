package org.example.whatsappwish.channel;

import org.example.whatsappwish.config.NotFoundException;
import org.example.whatsappwish.contact.Contact;
import org.example.whatsappwish.contact.ContactRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class ChannelService {

    private final ChannelRepository repository;
    private final ContactRepository contactRepository;

    public ChannelService(ChannelRepository repository, ContactRepository contactRepository) {
        this.repository = repository;
        this.contactRepository = contactRepository;
    }

    @Transactional(readOnly = true)
    public List<ChannelResponse> findAll() {
        return repository.findAll().stream()
                .map(ChannelResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChannelResponse findById(Long id) {
        return ChannelResponse.from(getOrThrow(id));
    }

    public ChannelResponse create(ChannelRequest request) {
        String name = request.name().trim();
        requireUniqueName(name, null);
        return ChannelResponse.from(repository.save(new Channel(name)));
    }

    public ChannelResponse update(Long id, ChannelRequest request) {
        Channel channel = getOrThrow(id);
        String name = request.name().trim();
        requireUniqueName(name, id);
        channel.setName(name);
        return ChannelResponse.from(channel);
    }

    public void delete(Long id) {
        Channel channel = getOrThrow(id);
        // Contact holds the FK, so detach every member (set channel = null) before
        // deleting the channel to avoid a foreign-key violation. Contacts are kept.
        for (Contact member : Set.copyOf(channel.getContacts())) {
            member.setChannel(null);
        }
        channel.getContacts().clear();
        repository.delete(channel);
    }

    /**
     * Replaces the channel's full membership with exactly the given contacts. Because a
     * contact belongs to at most one channel, adding a contact here moves it out of any
     * other channel it was in.
     */
    public ChannelResponse setContacts(Long id, List<Long> contactIds) {
        Channel channel = getOrThrow(id);
        Set<Long> desired = contactIds == null ? Set.of() : new HashSet<>(contactIds);

        // Remove members no longer wanted.
        for (Contact member : Set.copyOf(channel.getContacts())) {
            if (!desired.contains(member.getId())) {
                member.setChannel(null);
            }
        }
        // Assign newly wanted members to this channel (moving them from any other).
        for (Contact contact : contactRepository.findAllById(desired)) {
            contact.setChannel(channel);
        }
        // Build the response from a fresh query: the channel's in-memory collection
        // is stale after reassigning FKs, so read the current members back.
        List<Long> memberIds = contactRepository.findByChannelId(id).stream()
                .map(Contact::getId)
                .toList();
        return new ChannelResponse(channel.getId(), channel.getName(), channel.getCreatedAt(),
                memberIds.size(), memberIds);
    }

    private Channel getOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Channel " + id + " not found"));
    }

    private void requireUniqueName(String name, Long selfId) {
        repository.findByNameIgnoreCase(name)
                .filter(other -> !other.getId().equals(selfId))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "A channel named \"" + name + "\" already exists");
                });
    }
}
