// Keeps each movie's title, description and poster in English and Russian in our own database,
// so showing a list never has to wait for TMDB. The text is copied from TMDB once, when a movie is added.
package com.ourwatchlist.backend.services;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.ourwatchlist.backend.dto.TmdbMovie;
import com.ourwatchlist.backend.entity.MovieText;
import com.ourwatchlist.backend.repository.MovieTextRepository;

import jakarta.annotation.PreDestroy;

@Service
public class MovieTextService {

    private static final Logger log = LoggerFactory.getLogger(MovieTextService.class);

    // The most time adding a movie will wait for TMDB. After that the movie is added anyway.
    private static final long SAVE_TIMEOUT_MILLIS = 3_000;

    // Saved text older than this is shown as it is, but also fetched again in the background.
    private static final Duration REFRESH_AFTER = Duration.ofDays(30);

    private final TmdbService tmdb;
    private final MovieTextRepository texts;
    // Filling in missing text happens in the background, two movies at a time, so nobody waits for it.
    private final ExecutorService background = Executors.newFixedThreadPool(2, task -> {
        Thread thread = new Thread(task, "movie-text-fill");
        thread.setDaemon(true);
        return thread;
    });
    // Movies being filled in right now, so opening a list again does not start the same work twice.
    private final Set<Integer> filling = ConcurrentHashMap.newKeySet();

    public MovieTextService(TmdbService tmdb, MovieTextRepository texts) {
        this.tmdb = tmdb;
        this.texts = texts;
    }

    @PreDestroy
    void stop() {
        background.shutdown();
    }

    // The saved text of these movies in the given language ("en-US" or "ru-RU"), read from our own database.
    // Movies with no saved text (or very old text) are not in the answer or are old; they are fetched from TMDB
    // in the background for next time. This never waits for TMDB and never throws: if the database read fails,
    // the caller just gets an empty answer and shows the copy saved with the movie.
    public Map<Integer, MovieText> textsFor(Collection<Integer> tmdbIds, String tmdbLanguage) {
        Map<Integer, MovieText> found = new HashMap<>();
        try {
            for (MovieText text : texts.findByIdTmdbIdInAndIdLanguage(tmdbIds, Languages.shortCode(tmdbLanguage))) {
                found.put(text.getId().tmdbId(), text);
            }
        } catch (Exception e) {
            log.warn("Could not read saved movie text: {}", e.toString());
            return found;
        }

        Instant tooOld = Instant.now().minus(REFRESH_AFTER);
        List<Integer> needed = tmdbIds.stream()
                .distinct()
                .filter(id -> !found.containsKey(id) || found.get(id).getFetchedAt().isBefore(tooOld))
                .toList();
        fillInBackground(needed);
        return found;
    }

    // Fetches and saves the text of these movies, without making the caller wait.
    private void fillInBackground(Collection<Integer> tmdbIds) {
        for (int id : tmdbIds) {
            if (filling.add(id)) {
                background.submit(() -> {
                    try {
                        saveBothLanguages(id);
                    } finally {
                        filling.remove(id);
                    }
                });
            }
        }
    }

    // Asks TMDB for the movie in both languages at the same time and saves what came back.
    // This is a bonus on top of adding the movie, so it never throws: if TMDB is slow or fails,
    // the text is simply missing and gets filled in later.
    public void saveBothLanguages(int tmdbId) {
        try {
            Map<String, TmdbMovie> found = tmdb.detailsInLanguages(tmdbId, List.of(Languages.ENGLISH, Languages.RUSSIAN), SAVE_TIMEOUT_MILLIS);
            for (Map.Entry<String, TmdbMovie> entry : found.entrySet()) {
                TmdbMovie movie = entry.getValue();
                if (movie.title() != null && !movie.title().isBlank()) {
                    texts.upsert(tmdbId, Languages.shortCode(entry.getKey()), movie.title(), movie.overview(), movie.posterPath());
                }
            }
        } catch (Exception e) {
            log.warn("Could not save the text of movie {}: {}", tmdbId, e.toString());
        }
    }
}
