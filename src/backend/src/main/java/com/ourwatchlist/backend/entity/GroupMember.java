// Maps to the "group_members" table: which users belong to which group.
// A couple's group has at most two members (checked in the service, not here).
package com.ourwatchlist.backend.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "group_members")
public class GroupMember {

    @EmbeddedId
    private GroupMemberId id;

    @Column(name = "joined_at")
    private Instant joinedAt = Instant.now();

    // JPA needs an empty constructor to build objects from database rows.
    protected GroupMember() {}

    // Used by our code when someone creates or joins a group.
    public GroupMember(UUID groupId, UUID userId) {
        this.id = new GroupMemberId(groupId, userId);
    }

    public UUID getGroupId() { return id.groupId(); }
    public UUID getUserId() { return id.userId(); }
    public Instant getJoinedAt() { return joinedAt; }
}
