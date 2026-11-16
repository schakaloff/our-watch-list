// Supabase's answer to a successful login or refresh: the access token, how long it lasts,
// the refresh token that can get a new one, and the user.
// @JsonProperty links the JSON name (access_token) to the Java name (accessToken).
package com.ourwatchlist.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SignInResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("expires_in") int expiresIn,
        @JsonProperty("refresh_token") String refreshToken,
        SupabaseUser user) {}
