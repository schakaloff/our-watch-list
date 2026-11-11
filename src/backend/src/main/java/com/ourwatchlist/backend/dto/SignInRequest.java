// The email and password we send to Supabase when someone logs in.
// A record is a short class that only holds data.
package com.ourwatchlist.backend.dto;

public record SignInRequest(String email, String password) {}

