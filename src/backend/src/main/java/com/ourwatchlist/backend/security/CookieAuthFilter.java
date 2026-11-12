// Runs before group and profile requests. Reads the login cookie, asks Supabase who it belongs to,
// and tells Spring Security who is calling. Without a valid cookie the user stays anonymous.
// Asking Supabase takes about 150 ms, so an answer is remembered for a minute.
package com.ourwatchlist.backend.security;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.client.RestClientException;
import org.springframework.web.filter.OncePerRequestFilter;

import com.ourwatchlist.backend.dto.SupabaseUser;
import com.ourwatchlist.backend.services.SupabaseAuthService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class CookieAuthFilter extends OncePerRequestFilter {

    // How long a verified token is remembered before Supabase is asked again.
    private static final long REMEMBER_MILLIS = 60_000;
    private static final int MAX_REMEMBERED = 1000;

    // A user that Supabase confirmed, and the time until which we trust that answer.
    private record Remembered(SupabaseUser user, long validUntil) {}

    private final SupabaseAuthService supabase;
    private final Map<String, Remembered> remembered = new ConcurrentHashMap<>();

    public CookieAuthFilter(SupabaseAuthService supabase) {
        this.supabase = supabase;
    }

    // Only group and profile routes need to know who the user is, so other requests skip this filter.
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(path.startsWith("/api/groups") || path.startsWith("/api/profile"));
    }

    // Runs once per request: find the token, ask Supabase, remember the user.
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        String token = findToken(request);

        if (token != null) {
            try {
                SupabaseUser user = findUser(token);
                var auth = new UsernamePasswordAuthenticationToken(user, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (RestClientException e) {
                // Bad or expired token: leave the user anonymous.
            }
        }
        chain.doFilter(request, response);
    }

    // Returns the user for this token. Uses the remembered answer if it is still fresh,
    // otherwise asks Supabase (which throws an error if the token is bad or expired).
    private SupabaseUser findUser(String token) {
        Remembered known = remembered.get(token);
        if (known != null && System.currentTimeMillis() < known.validUntil()) {
            return known.user();
        }

        SupabaseUser user = supabase.getUser(token);
        if (remembered.size() >= MAX_REMEMBERED) {
            remembered.clear();
        }
        remembered.put(token, new Remembered(user, System.currentTimeMillis() + REMEMBER_MILLIS));
        return user;
    }

    // Looks through the request's cookies for access_token.
    private String findToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookie.getName().equals("access_token")) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
