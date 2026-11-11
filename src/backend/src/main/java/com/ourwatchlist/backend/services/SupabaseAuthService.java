// Talks to Supabase: logs a user in and finds out who a token belongs to.
package com.ourwatchlist.backend.services;

import com.ourwatchlist.backend.dto.SignInRequest;
import com.ourwatchlist.backend.dto.SignInResponse;
import com.ourwatchlist.backend.dto.SupabaseUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class SupabaseAuthService{
    private final RestClient client;

    // Runs once at startup. Spring passes in the URL and key from application.properties.
    // Builds the HTTP client that every call to Supabase will use.
    public SupabaseAuthService(
        @Value("${supabase.url}") String url,
        @Value("${supabase.anon-key}") String anonKey){
        this.client = RestClient.builder().baseUrl(url + "/auth/v1").defaultHeader("apikey", anonKey).build();
    }

    // Asks Supabase to check an email and password.
    // Returns the token and user if correct, or throws an error if the login is wrong.
    public SignInResponse signIn(String email, String password){
        return client.post().uri("/token?grant_type=password").body(new SignInRequest(email, password)).retrieve().body(SignInResponse.class);
    }

    // Asks Supabase who owns this access token.
    // Returns the user if the token is valid, or throws an error if it is wrong or expired.
    public SupabaseUser getUser(String accessToken){
        return client.get().uri("/user").header("Authorization", "Bearer " + accessToken).retrieve().body(SupabaseUser.class);
    }

}