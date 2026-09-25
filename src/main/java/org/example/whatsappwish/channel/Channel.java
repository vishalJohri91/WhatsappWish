package org.example.whatsappwish.channel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.example.whatsappwish.contact.Contact;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * A named grouping of contacts (e.g. "Friends", "Family", "Colleagues").
 * A contact belongs to at most one channel; a channel holds many contacts.
 *
 * <p>{@link Contact} is the owning side (it holds the {@code channel_id} foreign
 * key); this side is the inverse, used for reading membership. To change a
 * contact's channel, mutate {@link Contact#setChannel}.
 */
@Entity
@Table(name = "channels")
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "channel")
    private Set<Contact> contacts = new LinkedHashSet<>();

    protected Channel() {
        // for JPA
    }

    public Channel(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Set<Contact> getContacts() {
        return contacts;
    }
}
