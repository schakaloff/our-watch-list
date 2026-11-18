// Holds the movie routes: popular movies and search.
// Open to everyone, because browsing the catalog does not need an account.
package com.ourwatchlist.backend.controllers;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ourwatchlist.backend.dto.TmdbMovie;
import com.ourwatchlist.backend.services.Languages;
import com.ourwatchlist.backend.services.TmdbService;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final TmdbService tmdb;

    // Spring passes in the TMDB service here, so the controller can use it.
    public MovieController(TmdbService tmdb) {
        this.tmdb = tmdb;
    }

    // Handles GET /api/movies/popular.
    // Returns the list of popular movies, in the language the browser asks for (Accept-Language).
    // "Vary" tells caches that the answer depends on that language.
    @GetMapping("/popular")
    public ResponseEntity<List<TmdbMovie>> popular(@RequestHeader(name = "Accept-Language", required = false) String acceptLanguage) {
        return ResponseEntity.ok()
                .header(HttpHeaders.VARY, HttpHeaders.ACCEPT_LANGUAGE)
                .body(tmdb.getPopular(Languages.tmdbCode(acceptLanguage)));
    }

    // Handles GET /api/movies/search?query=batman.
    // Returns the movies whose title matches the text in "query" (in any language), shown in the browser's language.
    @GetMapping("/search")
    public ResponseEntity<List<TmdbMovie>> search(@RequestParam String query,
            @RequestHeader(name = "Accept-Language", required = false) String acceptLanguage) {
        return ResponseEntity.ok()
                .header(HttpHeaders.VARY, HttpHeaders.ACCEPT_LANGUAGE)
                .body(tmdb.search(query, Languages.tmdbCode(acceptLanguage)));
    }
}
