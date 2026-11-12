// Maps to the "group_movies" table: one row per movie on a couple's shared list.
// Holds the movie details we saved from TMDB, and whether it is still "want" or already "watched".
package com.ourwatchlist.backend.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "group_movies")
public class GroupMovie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id")
    private UUID groupId;

    @Column(name = "tmdb_id")
    private int tmdbId;

    private String title;

    @Column(name = "poster_path")
    private String posterPath;

    @Column(name = "release_year")
    private Integer releaseYear;

    @Column(name = "tmdb_rating")
    private BigDecimal tmdbRating;

    private String overview;

    // Either "want" or "watched". The database rejects anything else.
    private String status = "want";

    @Column(name = "added_by")
    private UUID addedBy;

    @Column(name = "added_at")
    private Instant addedAt = Instant.now();

    @Column(name = "watched_at")
    private Instant watchedAt;

    // JPA needs an empty constructor to build objects from database rows.
    protected GroupMovie() {}

    // Used by our code when someone adds a movie to the group's list.
    public GroupMovie(UUID groupId, int tmdbId, String title, String posterPath,
            Integer releaseYear, BigDecimal tmdbRating, String overview, UUID addedBy) {
        this.groupId = groupId;
        this.tmdbId = tmdbId;
        this.title = title;
        this.posterPath = posterPath;
        this.releaseYear = releaseYear;
        this.tmdbRating = tmdbRating;
        this.overview = overview;
        this.addedBy = addedBy;
    }

    // Moves the movie between "want" and "watched" and keeps the watched date in step.
    public void changeStatus(String newStatus) {
        this.status = newStatus;
        this.watchedAt = newStatus.equals("watched") ? Instant.now() : null;
    }

    public Long getId() { return id; }
    public UUID getGroupId() { return groupId; }
    public int getTmdbId() { return tmdbId; }
    public String getTitle() { return title; }
    public String getPosterPath() { return posterPath; }
    public Integer getReleaseYear() { return releaseYear; }
    public BigDecimal getTmdbRating() { return tmdbRating; }
    public String getOverview() { return overview; }
    public String getStatus() { return status; }
    public UUID getAddedBy() { return addedBy; }
    public Instant getAddedAt() { return addedAt; }
    public Instant getWatchedAt() { return watchedAt; }
}
