// The rules for ratings: each person gives their own score (1 to 10) and notes for a movie.
// Rating the same movie again replaces your earlier rating.
package com.ourwatchlist.backend.services;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.ourwatchlist.backend.dto.MovieDtos.RatingRequest;
import com.ourwatchlist.backend.dto.MovieDtos.RatingResponse;
import com.ourwatchlist.backend.entity.Rating;
import com.ourwatchlist.backend.entity.RatingId;
import com.ourwatchlist.backend.exception.ApiException;
import com.ourwatchlist.backend.repository.GroupMovieRepository;
import com.ourwatchlist.backend.repository.RatingRepository;

@Service
public class RatingService {

    private final GroupService groupService;
    private final GroupMovieRepository movies;
    private final RatingRepository ratings;

    // Spring passes in what this service needs.
    public RatingService(GroupService groupService, GroupMovieRepository movies, RatingRepository ratings) {
        this.groupService = groupService;
        this.movies = movies;
        this.ratings = ratings;
    }

    // Saves the user's score and notes for a movie: creates the rating or updates the old one.
    public RatingResponse rate(UUID userId, UUID groupId, Long movieId, RatingRequest request) {
        groupService.requireMember(userId, groupId);

        if (request.score() < 1 || request.score() > 10) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Score must be between 1 and 10");
        }
        movies.findByIdAndGroupId(movieId, groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Movie not found"));

        String notes = request.notes() == null || request.notes().isBlank() ? null : request.notes().trim();

        Rating rating = ratings.findById(new RatingId(movieId, userId)).orElse(null);
        if (rating == null) {
            rating = new Rating(movieId, userId, request.score(), notes);
        } else {
            rating.update(request.score(), notes);
        }
        ratings.save(rating);

        String name = groupService.displayNames(groupId).get(userId);
        return new RatingResponse(userId, name, rating.getScore(), rating.getNotes());
    }
}
