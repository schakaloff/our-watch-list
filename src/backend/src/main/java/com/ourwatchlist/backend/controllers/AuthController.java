// Holds the auth routes: login, "who am I" (me) and logout.
// The login state lives in two cookies: access_token (one hour) and refresh_token (30 days, renewed as you use the site).
package com.ourwatchlist.backend.controllers;


import com.ourwatchlist.backend.dto.SignInRequest;
import com.ourwatchlist.backend.dto.SignInResponse;
import com.ourwatchlist.backend.dto.SupabaseUser;
import com.ourwatchlist.backend.security.AuthCookies;
import com.ourwatchlist.backend.security.RateLimiter;
import com.ourwatchlist.backend.services.SupabaseAuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SupabaseAuthService supabase;
    private final AuthCookies cookies;
    private final RateLimiter rateLimiter;

    // Spring passes in what this controller needs.
    public AuthController(SupabaseAuthService supabase, AuthCookies cookies, RateLimiter rateLimiter){
        this.supabase = supabase;
        this.cookies = cookies;
        this.rateLimiter = rateLimiter;
    }

    // Handles POST /api/auth/login.
    // Success: puts the login cookies in the answer and returns the user. Wrong password: returns 401.
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody SignInRequest body){
        // Limits password guessing: 10 tries a minute for each email address.
        String email = body.email() == null ? "" : body.email().trim().toLowerCase();
        if (!rateLimiter.allow("login:" + email, 10, 60_000)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "Too many login attempts. Wait a minute and try again."));
        }

        try{
            SignInResponse result = supabase.signIn(body.email(), body.password());
            return ResponseEntity.ok()
                    .headers(cookieHeaders(cookies.session(result)))
                    .body(result.user());
        }catch (HttpClientErrorException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Wrong email or password"));
        }
    }

    // Handles GET /api/auth/me.
    // The login filter has already worked out who is calling (and renewed an expired login, if needed).
    // Returns that user, or 401 if nobody is logged in. The frontend uses this to know if you are logged in.
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal SupabaseUser user){
        if (user == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(user);
    }

    // Handles POST /api/auth/logout.
    // Ends the login at Supabase (so the refresh token stops working) and tells the browser to delete both cookies.
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = AuthCookies.ACCESS, required = false) String accessToken){
        if (accessToken != null){
            supabase.signOut(accessToken);
        }
        return ResponseEntity.noContent()
                .headers(cookieHeaders(cookies.cleared()))
                .build();
    }

    // Turns cookies into the Set-Cookie headers of an answer.
    private HttpHeaders cookieHeaders(List<ResponseCookie> list){
        HttpHeaders headers = new HttpHeaders();
        for (ResponseCookie cookie : list){
            headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
        }
        return headers;
    }

}
