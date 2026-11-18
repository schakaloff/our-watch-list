// Talks to TMDB to get movies: the popular list, search results, and the details of single movies.
// Uses our TMDB token, which stays on the backend.
// All text comes straight from TMDB in the language asked for. When TMDB has no description in that
// language, TMDB's own English description is used instead. Nothing is ever translated by us.
package com.ourwatchlist.backend.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.ourwatchlist.backend.dto.TmdbMovie;
import com.ourwatchlist.backend.dto.TmdbMovieList;

import jakarta.annotation.PreDestroy;

@Service
public class TmdbService {

    private final RestClient client;
    // The two languages of a movie are asked at the same time, so they run on a few threads.
    private final ExecutorService lookups = Executors.newFixedThreadPool(8, task -> {
        Thread thread = new Thread(task, "tmdb-lookup");
        thread.setDaemon(true);
        return thread;
    });

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

    @PreDestroy
    void stop() {
        lookups.shutdown();
    }

    // Gets the list of popular movies from TMDB, in the given language ("en-US" or "ru-RU").
    public List<TmdbMovie> getPopular(String language) {
        return withEnglishDescriptions(fetchPopular(language), language, () -> fetchPopular(Languages.ENGLISH));
    }

    // Searches TMDB for movies matching the text the user typed, in the given language.
    // TMDB understands titles in any language, so a Russian title finds the movie even in English mode.
    public List<TmdbMovie> search(String query, String language) {
        return withEnglishDescriptions(fetchSearch(query, language), language, () -> fetchSearch(query, Languages.ENGLISH));
    }

    // One movie in several languages, asked at the same time, waiting at most the given time.
    // A language that could not be looked up in time is left out of the answer. Keys are TMDB codes like "ru-RU".
    public Map<String, TmdbMovie> detailsInLanguages(int tmdbId, List<String> languages, long timeoutMillis) {
        Map<String, Future<TmdbMovie>> pending = new HashMap<>();
        for (String language : languages) {
            pending.put(language, lookups.submit(() -> details(tmdbId, language)));
        }

        Map<String, TmdbMovie> found = new HashMap<>();
        long deadline = System.currentTimeMillis() + timeoutMillis;
        for (Map.Entry<String, Future<TmdbMovie>> entry : pending.entrySet()) {
            try {
                long wait = Math.max(1, deadline - System.currentTimeMillis());
                found.put(entry.getKey(), entry.getValue().get(wait, TimeUnit.MILLISECONDS));
            } catch (Exception e) {
                entry.getValue().cancel(true);
            }
        }
        return found;
    }

    // One movie's details in one language. If TMDB has no description (or no poster) in that language,
    // TMDB's English ones fill the gap.
    private TmdbMovie details(int tmdbId, String language) {
        TmdbMovie movie = fetchDetails(tmdbId, language);

        boolean noDescription = movie.overview() == null || movie.overview().isBlank();
        boolean noPoster = movie.posterPath() == null;
        if (!language.equals(Languages.ENGLISH) && (noDescription || noPoster)) {
            TmdbMovie english = fetchDetails(tmdbId, Languages.ENGLISH);
            movie = new TmdbMovie(movie.id(), movie.title(),
                    noDescription ? english.overview() : movie.overview(),
                    noPoster ? english.posterPath() : movie.posterPath(),
                    movie.releaseDate(), movie.voteAverage());
        }

        return movie;
    }

    // Fills in the movies that have no description in the asked language with TMDB's English description.
    // The English list is only fetched when it is needed (and never when the language is English already).
    private List<TmdbMovie> withEnglishDescriptions(List<TmdbMovie> movies, String language, Supplier<List<TmdbMovie>> english) {
        boolean someMissing = movies.stream().anyMatch(m -> m.overview() == null || m.overview().isBlank());
        if (language.equals(Languages.ENGLISH) || !someMissing) {
            return movies;
        }

        Map<Integer, String> englishOverviews = new HashMap<>();
        for (TmdbMovie m : english.get()) {
            englishOverviews.put(m.id(), m.overview());
        }
        return movies.stream()
                .map(m -> m.overview() == null || m.overview().isBlank()
                        ? new TmdbMovie(m.id(), m.title(), englishOverviews.get(m.id()), m.posterPath(), m.releaseDate(), m.voteAverage())
                        : m)
                .toList();
    }

    private List<TmdbMovie> fetchPopular(String language) {
        TmdbMovieList result = client.get()
                .uri(uri -> uri.path("/movie/popular").queryParam("language", language).build())
                .retrieve()
                .body(TmdbMovieList.class);
        return result.results();
    }

    private List<TmdbMovie> fetchSearch(String query, String language) {
        TmdbMovieList result = client.get()
                .uri(uri -> uri.path("/search/movie").queryParam("query", query).queryParam("language", language).build())
                .retrieve()
                .body(TmdbMovieList.class);
        return result.results();
    }

    private TmdbMovie fetchDetails(int tmdbId, String language) {
        return client.get()
                .uri(uri -> uri.path("/movie/{id}").queryParam("language", language).build(tmdbId))
                .retrieve()
                .body(TmdbMovie.class);
    }
}
