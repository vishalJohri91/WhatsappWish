package org.example.whatsappwish.contact;

import org.example.whatsappwish.config.NotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
@Transactional
public class ContactService {

    private final ContactRepository repository;

    public ContactService(ContactRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> findAll() {
        return repository.findAll().stream()
                .map(ContactResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContactResponse findById(Long id) {
        return ContactResponse.from(getOrThrow(id));
    }

    public ContactResponse create(ContactRequest request) {
        String normalized = normalizePhone(request.phoneNumber());
        if (repository.existsByPhoneNumber(normalized)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A contact with phone number " + normalized + " already exists");
        }
        Contact contact = new Contact(normalized, blankToNull(request.whatsappName()), request.intendedName().trim());
        try {
            return ContactResponse.from(repository.save(contact));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A contact with phone number " + normalized + " already exists");
        }
    }

    public ContactResponse update(Long id, ContactRequest request) {
        Contact contact = getOrThrow(id);
        String normalized = normalizePhone(request.phoneNumber());
        repository.findByPhoneNumber(normalized)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "A contact with phone number " + normalized + " already exists");
                });
        contact.setPhoneNumber(normalized);
        contact.setWhatsappName(blankToNull(request.whatsappName()));
        contact.setIntendedName(request.intendedName().trim());
        return ContactResponse.from(contact);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Contact " + id + " not found");
        }
        repository.deleteById(id);
    }

    private Contact getOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Contact " + id + " not found"));
    }

    /** Strips spaces, dashes, parentheses and a leading "+" so numbers store consistently. */
    static String normalizePhone(String raw) {
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "phoneNumber has no digits");
        }
        return digits;
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
