// Database access for ratings: each person's score for each movie.
package com.ourwatchlist.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ourwatchlist.backend.entity.Rating;
import com.ourwatchlist.backend.entity.RatingId;

public interface RatingRepository extends JpaRepository<Rating, RatingId> {

    // Loads the ratings of many movies at once, so showing a list needs one query and not one per movie.
    List<Rating> findByIdGroupMovieIdIn(Collection<Long> groupMovieIds);
}
