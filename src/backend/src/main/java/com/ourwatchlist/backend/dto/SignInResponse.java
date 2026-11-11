// Supabase's answer to a successful login: the access token, how long it lasts, and the user.
// @JsonProperty links the JSON name (access_token) to the Java name (accessToken).
package com.ourwatchlist.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SignInResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("expires_in") int expiresIn,
        SupabaseUser user) {}
