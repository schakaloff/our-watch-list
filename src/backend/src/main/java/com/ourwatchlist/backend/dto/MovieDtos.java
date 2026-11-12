// The shapes of the data sent to and from the movie and rating routes.
package com.ourwatchlist.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class MovieDtos {

    private MovieDtos() {}

    // Body of "add a movie to the group's list": the TMDB details the card already has.
    public record AddMovieRequest(int tmdbId, String title, String posterPath,
            Integer releaseYear, BigDecimal tmdbRating, String overview) {}

    // Body of "change status": "want" or "watched".
    public record StatusRequest(String status) {}

    // Body of "rate a movie": a score from 1 to 10 and optional notes.
    public record RatingRequest(int score, String notes) {}

    // One person's rating, with their name so the page can show who gave it.
    public record RatingResponse(UUID userId, String displayName, int score, String notes) {}

    // A movie on the list, with everyone's ratings.
    public record MovieResponse(Long id, int tmdbId, String title, String posterPath,
            Integer releaseYear, BigDecimal tmdbRating, String overview, String status,
            UUID addedBy, Instant addedAt, Instant watchedAt, List<RatingResponse> ratings) {}
}
