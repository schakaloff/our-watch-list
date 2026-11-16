// Builds the two login cookies in one place, so login, refreshing and logout all use the same settings:
// - access_token: proves who you are. Lasts as long as Supabase says (one hour).
// - refresh_token: trades itself for a new access token when that one runs out. Lasts 30 days,
//   and the 30 days start again each time it is used, so regular visitors stay logged in.
// Both are HttpOnly (scripts cannot read them), SameSite=Strict, and Secure on a real HTTPS site.
package com.ourwatchlist.backend.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import com.ourwatchlist.backend.dto.SignInResponse;

@Component
public class AuthCookies {

    public static final String ACCESS = "access_token";
    public static final String REFRESH = "refresh_token";

    private static final long REFRESH_SECONDS = 30L * 24 * 60 * 60;

    // True in production (HTTPS only), false on your own computer. Set with the COOKIE_SECURE setting.
    private final boolean secure;

    public AuthCookies(@Value("${supabase.cookie-secure:false}") boolean secure) {
        this.secure = secure;
    }

    // The cookies to set after a login or a refresh.
    public List<ResponseCookie> session(SignInResponse session) {
        ResponseCookie access = build(ACCESS, session.accessToken(), session.expiresIn(), "/");
        if (session.refreshToken() == null) {
            return List.of(access);
        }
        // The refresh token is only needed by our API routes, so the browser sends it nowhere else.
        return List.of(access, build(REFRESH, session.refreshToken(), REFRESH_SECONDS, "/api"));
    }

    // The cookies that tell the browser to delete both (max age 0). Used on logout.
    public List<ResponseCookie> cleared() {
        return List.of(build(ACCESS, "", 0, "/"), build(REFRESH, "", 0, "/api"));
    }

    private ResponseCookie build(String name, String value, long seconds, String path) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path(path)
                .maxAge(seconds)
                .build();
    }
}
