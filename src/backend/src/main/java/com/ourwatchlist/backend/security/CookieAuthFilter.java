// Runs before group, profile and "who am I" requests. Reads the login cookies and tells Spring Security who is calling.
// - If the access token is good, that's the user.
// - If it has expired (they last an hour) or the browser dropped it, the refresh token is used to get a new one
//   and the new cookies are sent back, so the person never notices and is not logged out.
// - Otherwise the user stays anonymous.
// Asking Supabase takes about 150 ms, so an answer is remembered for a minute.
package com.ourwatchlist.backend.security;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.filter.OncePerRequestFilter;

import com.ourwatchlist.backend.dto.SignInResponse;
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
    private final SessionRefresher refresher;
    private final AuthCookies cookies;
    private final Map<String, Remembered> remembered = new ConcurrentHashMap<>();

    public CookieAuthFilter(SupabaseAuthService supabase, SessionRefresher refresher, AuthCookies cookies) {
        this.supabase = supabase;
        this.refresher = refresher;
        this.cookies = cookies;
    }

    // Only these routes need to know who the user is, so other requests skip this filter.
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(path.startsWith("/api/groups") || path.startsWith("/api/profile") || path.equals("/api/auth/me"));
    }

    // Runs once per request: work out who is calling, renewing the login if it has expired.
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        String accessToken = findCookie(request, AuthCookies.ACCESS);
        String refreshToken = findCookie(request, AuthCookies.REFRESH);

        SupabaseUser user = null;
        if (accessToken != null) {
            try {
                user = findUser(accessToken);
            } catch (RestClientException e) {
                // Bad or expired token: try to renew it below.
            }
        }
        if (user == null && refreshToken != null) {
            user = renewLogin(refreshToken, response);
        }

        if (user != null) {
            var auth = new UsernamePasswordAuthenticationToken(user, null, List.of());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(request, response);
    }

    // Uses the refresh token to get a new login, and puts the new cookies on this response.
    // Returns the user, or null if the login could not be renewed.
    private SupabaseUser renewLogin(String refreshToken, HttpServletResponse response) {
        try {
            SignInResponse fresh = refresher.refresh(refreshToken);
            for (ResponseCookie cookie : cookies.session(fresh)) {
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            }
            remember(fresh.accessToken(), fresh.user());
            return fresh.user();
        } catch (HttpClientErrorException e) {
            // Supabase says this refresh token is not valid any more (signed out, or too old).
            // Delete the cookies so the browser stops sending them.
            for (ResponseCookie cookie : cookies.cleared()) {
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            }
        } catch (RestClientException e) {
            // Supabase is unreachable or having a problem. Keep the cookies: the next request may work.
        }
        return null;
    }

    // Returns the user for this token. Uses the remembered answer if it is still fresh,
    // otherwise asks Supabase (which throws an error if the token is bad or expired).
    private SupabaseUser findUser(String token) {
        Remembered known = remembered.get(token);
        if (known != null && System.currentTimeMillis() < known.validUntil()) {
            return known.user();
        }

        SupabaseUser user = supabase.getUser(token);
        remember(token, user);
        return user;
    }

    private void remember(String token, SupabaseUser user) {
        if (remembered.size() >= MAX_REMEMBERED) {
            remembered.clear();
        }
        remembered.put(token, new Remembered(user, System.currentTimeMillis() + REMEMBER_MILLIS));
    }

    // Looks through the request's cookies for the one with this name.
    private String findCookie(HttpServletRequest request, String name) {
        Cookie[] all = request.getCookies();
        if (all == null) {
            return null;
        }
        for (Cookie cookie : all) {
            if (cookie.getName().equals(name)) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
