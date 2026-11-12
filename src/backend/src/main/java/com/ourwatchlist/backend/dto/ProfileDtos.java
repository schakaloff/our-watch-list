// The shapes of the data sent to and from the profile (settings) routes.
package com.ourwatchlist.backend.dto;

public final class ProfileDtos {

    private ProfileDtos() {}

    // Body of "save my settings". The username may be empty.
    public record ProfileRequest(String displayName, String username) {}

    // The profile as shown on the Settings page. The email comes from the login and cannot be changed here.
    public record ProfileResponse(String email, String displayName, String username) {}
}
