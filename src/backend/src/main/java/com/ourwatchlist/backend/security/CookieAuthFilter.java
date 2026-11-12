// Runs before group requests. Reads the login cookie, asks Supabase who it belongs to,
// and tells Spring Security who is calling. Without a valid cookie the user stays anonymous.
package com.ourwatchlist.backend.security;

import java.io.IOException;
import java.util.List;

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

    private final SupabaseAuthService supabase;

    public CookieAuthFilter(SupabaseAuthService supabase) {
        this.supabase = supabase;
    }

    // Only group routes need to know who the user is, so other requests skip this filter.
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/groups");
    }

    // Runs once per request: find the token, ask Supabase, remember the user.
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        String token = findToken(request);

        if (token != null) {
            try {
                SupabaseUser user = supabase.getUser(token);
                var auth = new UsernamePasswordAuthenticationToken(user, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (RestClientException e) {
                // Bad or expired token: leave the user anonymous.
            }
        }
        chain.doFilter(request, response);
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
