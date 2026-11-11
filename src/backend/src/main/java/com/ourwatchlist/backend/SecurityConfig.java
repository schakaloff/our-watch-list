// Spring Security rules: which routes anyone can open and which need a login.
// Specific paths go first, anyRequest() goes last.
package com.ourwatchlist.backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    // Builds the security rules Spring applies to every request.
    // Needed because Spring Security blocks everything by default.
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Turn off CSRF tokens, otherwise every POST (like login) is rejected with 403.
        // Our cookie uses SameSite=Strict, which covers the same attack.
        http.csrf(csrf -> csrf.disable());

        // Anyone can open the test route, the auth routes (login, me, logout) and the movie routes.
        // /me and logout check the cookie themselves. Everything else needs a login.
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/hello", "/api/auth/login", "/api/auth/me", "/api/auth/logout", "/api/movies/**").permitAll()
                .anyRequest().authenticated());
        return http.build();
    }
}
