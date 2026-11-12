// The two-part primary key of ratings: which movie on the list and which user rated it.
// This is why each person can give only one score per movie.
package com.ourwatchlist.backend.entity;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public record RatingId(
        @Column(name = "group_movie_id") Long groupMovieId,
        @Column(name = "user_id") UUID userId) implements Serializable {}
