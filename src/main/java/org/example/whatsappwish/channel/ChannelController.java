package org.example.whatsappwish.channel;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/channels")
public class ChannelController {

    private final ChannelService service;

    public ChannelController(ChannelService service) {
        this.service = service;
    }

    @GetMapping
    public List<ChannelResponse> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ChannelResponse get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChannelResponse create(@Valid @RequestBody ChannelRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public ChannelResponse update(@PathVariable Long id, @Valid @RequestBody ChannelRequest request) {
        return service.update(id, request);
    }

    /** Replace the channel's full member list. */
    @PutMapping("/{id}/contacts")
    public ChannelResponse setContacts(@PathVariable Long id, @RequestBody ChannelMembersRequest request) {
        return service.setContacts(id, request.contactIds());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
