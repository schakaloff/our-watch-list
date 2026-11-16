// Talks to Supabase: logs a user in, renews a login, ends one, and finds out who a token belongs to.
package com.ourwatchlist.backend.services;

import com.ourwatchlist.backend.dto.RefreshRequest;
import com.ourwatchlist.backend.dto.SignInRequest;
import com.ourwatchlist.backend.dto.SignInResponse;
import com.ourwatchlist.backend.dto.SupabaseUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

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

    // Trades a refresh token for a new access token (and a new refresh token).
    // Throws an error if the refresh token is no longer valid, for example after signing out.
    public SignInResponse refresh(String refreshToken){
        return client.post().uri("/token?grant_type=refresh_token").body(new RefreshRequest(refreshToken)).retrieve().body(SignInResponse.class);
    }

    // Ends this login at Supabase, so its refresh token stops working too.
    // "local" ends only this session, not the person's logins on other devices.
    // If it fails, nothing is lost: the cookies are deleted either way.
    public void signOut(String accessToken){
        try{
            client.post().uri("/logout?scope=local").header("Authorization", "Bearer " + accessToken).retrieve().toBodilessEntity();
        }catch (RestClientException e){
            // The token may already be expired. Nothing to do.
        }
    }

    // Asks Supabase who owns this access token.
    // Returns the user if the token is valid, or throws an error if it is wrong or expired.
    public SupabaseUser getUser(String accessToken){
        return client.get().uri("/user").header("Authorization", "Bearer " + accessToken).retrieve().body(SupabaseUser.class);
    }

}