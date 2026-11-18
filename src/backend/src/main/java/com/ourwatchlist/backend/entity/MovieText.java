// Maps to the "movie_texts" table: a movie's title, description and poster in one language,
// copied from TMDB once. Every group that saved the movie shares the same row.
package com.ourwatchlist.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "movie_texts")
public class MovieText {

    @EmbeddedId
    private MovieTextId id;

    private String title;

    private String overview;

    @Column(name = "poster_path")
    private String posterPath;

    @Column(name = "fetched_at")
    private Instant fetchedAt;

    // JPA needs an empty constructor to build objects from database rows.
    protected MovieText() {}

    public MovieTextId getId() { return id; }
    public String getTitle() { return title; }
    public String getOverview() { return overview; }
    public String getPosterPath() { return posterPath; }
    public Instant getFetchedAt() { return fetchedAt; }
}
