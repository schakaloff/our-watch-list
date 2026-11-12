// Database access for groups (couples' shared lists).
// Spring writes the code for these methods from their names.
package com.ourwatchlist.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ourwatchlist.backend.entity.WatchGroup;

public interface GroupRepository extends JpaRepository<WatchGroup, UUID> {

    // Finds the group that an invite code belongs to. Used when someone joins.
    Optional<WatchGroup> findByInviteCode(String inviteCode);

    // Checks if a code is already taken. Used when generating a new code.
    boolean existsByInviteCode(String inviteCode);
}
