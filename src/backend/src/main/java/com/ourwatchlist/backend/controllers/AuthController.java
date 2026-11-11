// Holds the auth routes: login, "who am I" (me) and logout.
// The login state lives in the access_token cookie.
package com.ourwatchlist.backend.controllers;


import com.ourwatchlist.backend.dto.SignInRequest;
import com.ourwatchlist.backend.dto.SignInResponse;
import com.ourwatchlist.backend.dto.SupabaseUser;
import com.ourwatchlist.backend.services.SupabaseAuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SupabaseAuthService supabase;

    // Spring passes in the Supabase service here, so the controller can use it.
    public AuthController(SupabaseAuthService supabase){
        this.supabase = supabase;
    }

    // Handles POST /api/auth/login.
    // Success: puts the token in a cookie and returns the user. Wrong password: returns 401.
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody SignInRequest body){
        try{
            SignInResponse result = supabase.signIn(body.email(), body.password());
                ResponseCookie cookie = ResponseCookie.from("access_token", result.accessToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/")
                .maxAge(result.expiresIn())
                .build();

            return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(result.user());
        }catch (HttpClientErrorException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", "Wrong email or password"));
        }
    }

    // Handles GET /api/auth/me.
    // Reads the cookie, asks Supabase who it belongs to, and returns that user. No valid login: returns 401.
    // The frontend uses this to show the logged-in email.
    @GetMapping("/me")
    public ResponseEntity<?> me(@CookieValue(name = "access_token", required = false) String token){
        if (token == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try{
            SupabaseUser user = supabase.getUser(token);
            return ResponseEntity.ok(user);
        }catch (HttpClientErrorException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    // Handles POST /api/auth/logout.
    // Logging out means telling the browser to delete the cookie (max age 0).
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(){
        ResponseCookie cookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }
    
}
