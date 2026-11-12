// Database access for user profiles.
package com.ourwatchlist.backend.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ourwatchlist.backend.entity.Profile;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    // Is this username used by anyone other than the given user? Ignores upper/lower case.
    boolean existsByUsernameIgnoreCaseAndUserIdNot(String username, UUID userId);
}
