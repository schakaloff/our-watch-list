// Talks to TMDB to get movies: the popular list and search results.
// Uses our TMDB token, which stays on the backend.
package com.ourwatchlist.backend.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.ourwatchlist.backend.dto.TmdbMovie;
import com.ourwatchlist.backend.dto.TmdbMovieList;

@Service
public class TmdbService {

    private final RestClient client;

    // Runs once at startup. Spring passes in the URL and token from application.properties.
    // Builds the HTTP client that sends the token with every call to TMDB.
    public TmdbService(
            @Value("${tmdb.url}") String url,
            @Value("${tmdb.token}") String token) {
        this.client = RestClient.builder()
                .baseUrl(url)
                .defaultHeader("Authorization", "Bearer " + token)
                .build();
    }

    // Gets the list of popular movies from TMDB.
    public List<TmdbMovie> getPopular() {
        TmdbMovieList result = client.get()
                .uri("/movie/popular")
                .retrieve()
                .body(TmdbMovieList.class);
        return result.results();
    }

    // Searches TMDB for movies matching the text the user typed.
    public List<TmdbMovie> search(String query) {
        TmdbMovieList result = client.get()
                .uri(uri -> uri.path("/search/movie").queryParam("query", query).build())
                .retrieve()
                .body(TmdbMovieList.class);
        return result.results();
    }
}
