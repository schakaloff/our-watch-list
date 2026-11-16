// Trades a refresh token for a new login session, once.
// A page often sends several requests at the same moment. If they all find the access token expired,
// they all arrive here with the same refresh token. Supabase lets a refresh token be used only once, so
// the first request does the real refresh and the others get the same answer (kept for 20 seconds).
package com.ourwatchlist.backend.security;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.ourwatchlist.backend.dto.SignInResponse;
import com.ourwatchlist.backend.services.SupabaseAuthService;

@Component
public class SessionRefresher {

    private static final long KEEP_MILLIS = 20_000;

    // A session we got for a refresh token, and when we got it.
    private record Result(SignInResponse session, long createdAt) {}

    private final SupabaseAuthService supabase;
    private final Map<String, Result> recent = new ConcurrentHashMap<>();

    public SessionRefresher(SupabaseAuthService supabase) {
        this.supabase = supabase;
    }

    // "synchronized" makes requests take turns: while one is refreshing, the others wait and then reuse its answer.
    // Refreshing happens about once an hour per person, so waiting a fraction of a second is fine.
    // If Supabase refuses the token (it throws an error), nothing is kept.
    public synchronized SignInResponse refresh(String refreshToken) {
        long now = System.currentTimeMillis();
        recent.values().removeIf(r -> now - r.createdAt() > KEEP_MILLIS);

        Result known = recent.get(refreshToken);
        if (known != null) {
            return known.session();
        }

        SignInResponse fresh = supabase.refresh(refreshToken);
        recent.put(refreshToken, new Result(fresh, System.currentTimeMillis()));
        return fresh;
    }
}
