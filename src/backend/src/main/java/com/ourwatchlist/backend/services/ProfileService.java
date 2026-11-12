// The rules for user profiles: create one automatically, change the name and username,
// and look up names for groups. The username is optional, unique, and always stored in lowercase.
package com.ourwatchlist.backend.services;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.ourwatchlist.backend.entity.Profile;
import com.ourwatchlist.backend.exception.ApiException;
import com.ourwatchlist.backend.repository.ProfileRepository;

@Service
public class ProfileService {

    private final ProfileRepository profiles;

    // Spring passes in the repository here.
    public ProfileService(ProfileRepository profiles) {
        this.profiles = profiles;
    }

    // Returns the user's profile. The first time, it creates one with a display name
    // taken from the start of their email (admin@x.com becomes "admin").
    public Profile getOrCreate(UUID userId, String email) {
        return profiles.findById(userId).orElseGet(() -> profiles.save(new Profile(userId, nameFromEmail(email))));
    }

    // Saves a new display name and username. An empty username clears it.
    public Profile update(UUID userId, String email, String displayName, String username) {
        Profile profile = getOrCreate(userId, email);

        if (displayName == null || displayName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Display name is required");
        }
        String cleanName = displayName.trim();
        if (cleanName.length() > 30) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Display name is too long (30 characters at most)");
        }

        String cleanUsername = null;
        if (username != null && !username.isBlank()) {
            cleanUsername = username.trim().toLowerCase();
            if (!cleanUsername.matches("[a-z0-9_]{3,20}")) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Username must be 3 to 20 characters: letters, digits and underscores only");
            }
            if (profiles.existsByUsernameIgnoreCaseAndUserIdNot(cleanUsername, userId)) {
                throw new ApiException(HttpStatus.CONFLICT, "That username is already taken");
            }
        }

        profile.update(cleanName, cleanUsername);
        return profiles.save(profile);
    }

    // Maps user ids to display names. Used to show who is in a group and who gave a rating.
    // Someone who has not opened the site since profiles were added shows up as "Someone".
    public Map<UUID, String> displayNames(Collection<UUID> userIds) {
        Map<UUID, String> names = new HashMap<>();
        for (UUID id : userIds) {
            names.put(id, "Someone");
        }
        for (Profile profile : profiles.findAllById(userIds)) {
            names.put(profile.getUserId(), profile.getDisplayName());
        }
        return names;
    }

    // Builds a starting display name from an email: the part before the @, trimmed to fit.
    private String nameFromEmail(String email) {
        String name = email == null ? "" : email.split("@")[0];
        if (name.isBlank()) {
            name = "Me";
        }
        return name.length() > 30 ? name.substring(0, 30) : name;
    }
}
