// The settings routes: read your profile and change your display name and username.
// Your email comes from the login and is shown but never changed here.
package com.ourwatchlist.backend.controllers;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ourwatchlist.backend.dto.ProfileDtos.ProfileRequest;
import com.ourwatchlist.backend.dto.ProfileDtos.ProfileResponse;
import com.ourwatchlist.backend.dto.SupabaseUser;
import com.ourwatchlist.backend.entity.Profile;
import com.ourwatchlist.backend.services.ProfileService;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    // Spring passes in the profile service here.
    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    // Handles GET /api/profile. Returns your profile, creating it on first use.
    @GetMapping
    public ProfileResponse get(@AuthenticationPrincipal SupabaseUser user) {
        Profile profile = profileService.getOrCreate(UUID.fromString(user.id()), user.email());
        return toResponse(user, profile);
    }

    // Handles PUT /api/profile. Saves a new display name and username.
    @PutMapping
    public ProfileResponse update(@AuthenticationPrincipal SupabaseUser user, @RequestBody ProfileRequest body) {
        Profile profile = profileService.update(UUID.fromString(user.id()), user.email(),
                body.displayName(), body.username());
        return toResponse(user, profile);
    }

    // Combines the login email with the saved profile into what the Settings page shows.
    private ProfileResponse toResponse(SupabaseUser user, Profile profile) {
        return new ProfileResponse(user.email(), profile.getDisplayName(), profile.getUsername());
    }
}
