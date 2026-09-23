package org.example.whatsappwish.contact;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A WhatsApp contact together with the "intended name" the user wants to
 * address them by in wishes (e.g. real contact "Lalita Johri" -> "Mummy").
 */
@Entity
@Table(name = "contacts")
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Phone number in international format, digits only preferred (e.g. 919812345678). */
    @Column(nullable = false, unique = true)
    private String phoneNumber;

    /** The actual name of the contact in the phone book, optional. */
    private String whatsappName;

    /** The name to address them by in wishes, e.g. "Mummy". */
    @Column(nullable = false)
    private String intendedName;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Contact() {
        // for JPA
    }

    public Contact(String phoneNumber, String whatsappName, String intendedName) {
        this.phoneNumber = phoneNumber;
        this.whatsappName = whatsappName;
        this.intendedName = intendedName;
    }

    public Long getId() {
        return id;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getWhatsappName() {
        return whatsappName;
    }

    public void setWhatsappName(String whatsappName) {
        this.whatsappName = whatsappName;
    }

    public String getIntendedName() {
        return intendedName;
    }

    public void setIntendedName(String intendedName) {
        this.intendedName = intendedName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
