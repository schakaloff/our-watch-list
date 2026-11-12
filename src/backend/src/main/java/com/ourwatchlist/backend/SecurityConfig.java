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
        // Turn off CSRF tokens, otherwise every POST (like login) is rejected with 403.
        // Our cookie uses SameSite=Strict, which covers the same attack.
        http.csrf(csrf -> csrf.disable());

        // Before each group request, find out who is calling from the login cookie.
        http.addFilterBefore(new CookieAuthFilter(supabase), UsernamePasswordAuthenticationFilter.class);

        // Anonymous callers of protected routes get 401 (not logged in), not the default 403.
        http.exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));

        // Anyone can open the test route, the auth routes (login, me, logout) and the movie routes.
        // /me and logout check the cookie themselves. Everything else (like /api/groups/**) needs a login.
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/hello", "/api/auth/login", "/api/auth/me", "/api/auth/logout", "/api/movies/**").permitAll()
                .anyRequest().authenticated());
        return http.build();
    }
}
