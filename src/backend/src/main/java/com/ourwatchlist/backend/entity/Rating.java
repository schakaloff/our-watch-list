// Maps to the "ratings" table: one person's score (1 to 10) and notes for one movie.
// Each member of a couple rates separately, so a movie can have two ratings.
package com.ourwatchlist.backend.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "ratings")
public class Rating {

    @EmbeddedId
    private RatingId id;

    private int score;

    private String notes;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    // JPA needs an empty constructor to build objects from database rows.
    protected Rating() {}

    // Used by our code when someone rates a movie for the first time.
    public Rating(Long groupMovieId, UUID userId, int score, String notes) {
        this.id = new RatingId(groupMovieId, userId);
        this.score = score;
        this.notes = notes;
    }

    // Changes an existing rating and remembers when it happened.
    public void update(int score, String notes) {
        this.score = score;
        this.notes = notes;
        this.updatedAt = Instant.now();
    }

    public Long getGroupMovieId() { return id.groupMovieId(); }
    public UUID getUserId() { return id.userId(); }
    public int getScore() { return score; }
    public String getNotes() { return notes; }
    public Instant getUpdatedAt() { return updatedAt; }
}
