package org.example.whatsappwish.contact;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, Long> {

    Optional<Contact> findByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumber(String phoneNumber);

    List<Contact> findByChannelId(Long channelId);

    /** Removes any contact with a missing or blank intended name; returns the count deleted. */
    @Modifying
    @Query("delete from Contact c where c.intendedName is null or trim(c.intendedName) = ''")
    int deleteBlankIntendedName();
}
