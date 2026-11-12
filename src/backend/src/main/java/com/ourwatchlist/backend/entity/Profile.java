// Maps to the "profiles" table: a user's name and username, saved once and used everywhere.
// The display name is what the partner sees. The username is optional and starts empty.
package com.ourwatchlist.backend.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "profiles")
public class Profile {

    // The same id as the user in Supabase Auth, so there is no separate id to generate.
    @Id
    @Column(name = "user_id")
    private UUID userId;

    private String username;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    // JPA needs an empty constructor to build objects from database rows.
    protected Profile() {}

    // Used by our code when a user's profile is created for the first time.
    public Profile(UUID userId, String displayName) {
        this.userId = userId;
        this.displayName = displayName;
    }

    // Changes the name and username and remembers when it happened.
    public void update(String displayName, String username) {
        this.displayName = displayName;
        this.username = username;
        this.updatedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
