package org.example.whatsappwish.channel;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds a few sensible default channels on first run (only when none exist yet).
 * After that, channels are fully user-managed.
 */
@Component
public class ChannelSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ChannelSeeder.class);
    private static final List<String> DEFAULTS = List.of("Friends", "Family", "Colleagues");

    private final ChannelRepository repository;

    public ChannelSeeder(ChannelRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }
        DEFAULTS.forEach(name -> repository.save(new Channel(name)));
        log.info("Seeded default channels: {}", DEFAULTS);
    }
}
