// What we send to Supabase to trade a refresh token for a new access token.
// @JsonProperty makes the JSON name refresh_token, which is what Supabase expects.
package com.ourwatchlist.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RefreshRequest(@JsonProperty("refresh_token") String refreshToken) {}
