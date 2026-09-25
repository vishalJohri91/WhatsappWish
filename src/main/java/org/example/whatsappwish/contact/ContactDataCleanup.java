package org.example.whatsappwish.contact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * On startup, removes any contact with a missing or blank intended name. The intended
 * name is required everywhere it is created/updated, so this only ever purges legacy rows
 * (e.g. inserted directly via SQL) that would otherwise break wish rendering.
 */
@Component
public class ContactDataCleanup implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ContactDataCleanup.class);

    private final ContactRepository repository;

    public ContactDataCleanup(ContactRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        int removed = repository.deleteBlankIntendedName();
        if (removed > 0) {
            log.warn("Removed {} contact(s) with no intended name", removed);
        }
    }
}
