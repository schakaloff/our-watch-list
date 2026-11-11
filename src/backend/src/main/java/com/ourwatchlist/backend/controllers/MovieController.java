// Holds the movie routes: popular movies and search.
// Open to everyone, because browsing the catalog does not need an account.
package com.ourwatchlist.backend.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ourwatchlist.backend.dto.TmdbMovie;
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
    // Returns the list of popular movies. The home page shows these first.
    @GetMapping("/popular")
    public List<TmdbMovie> popular() {
        return tmdb.getPopular();
    }

    // Handles GET /api/movies/search?query=batman.
    // Returns the movies whose title matches the text in "query".
    @GetMapping("/search")
    public List<TmdbMovie> search(@RequestParam String query) {
        return tmdb.search(query);
    }
}
