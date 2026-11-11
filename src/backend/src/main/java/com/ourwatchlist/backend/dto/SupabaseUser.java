// The user part of Supabase's answer: just their id and email.
// Any extra fields in the JSON are ignored.
package com.ourwatchlist.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SupabaseUser(String id, String email) {}
