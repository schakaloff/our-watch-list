// Spring Security rules: which routes anyone can open and which need a login.
// Specific paths go first, anyRequest() goes last.
package com.ourwatchlist.backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.ourwatchlist.backend.security.CookieAuthFilter;
import com.ourwatchlist.backend.services.SupabaseAuthService;

@Configuration
public class SecurityConfig {
    // Builds the security rules Spring applies to every request.
    // Needed because Spring Security blocks everything by default.
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, SupabaseAuthService supabase) throws Exception {
        // CSRF protection: every POST/PUT/PATCH/DELETE must carry a token, or it is rejected with 403.
        // spa() is the setup for React apps: the token is sent in a readable XSRF-TOKEN cookie,
        // and the frontend copies it into an X-XSRF-TOKEN header. A site on another domain cannot read it.
        // Login is the one exception, because the user has no login cookie yet to abuse.
        http.csrf(csrf -> csrf.spa().ignoringRequestMatchers("/api/auth/login"));

        // Before each group request, find out who is calling from the login cookie.
        http.addFilterBefore(new CookieAuthFilter(supabase), UsernamePasswordAuthenticationFilter.class);

        // Anonymous callers of protected routes get 401 (not logged in), not the default 403.
        http.exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));

        // Anyone can open the test route, the auth routes (login, me, logout) and the movie routes.
        // /me and logout check the cookie themselves. /error is Spring's own error page: it must be open,
        // or a rejected request (like a missing CSRF token) would show 401 instead of its real status.
        // Everything else (like /api/groups/**) needs a login.
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/hello", "/api/auth/login", "/api/auth/me", "/api/auth/logout", "/api/movies/**", "/error").permitAll()
                .anyRequest().authenticated());
        return http.build();
    }
}
