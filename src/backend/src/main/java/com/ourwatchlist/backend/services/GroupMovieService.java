// The rules for a group's shared movie list: show it, add a movie, remove one, change its status.
// Every method first checks that the user belongs to the group.
package com.ourwatchlist.backend.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.ourwatchlist.backend.dto.MovieDtos.AddMovieRequest;
import com.ourwatchlist.backend.dto.MovieDtos.MovieResponse;
import com.ourwatchlist.backend.dto.MovieDtos.RatingResponse;
import com.ourwatchlist.backend.entity.GroupMovie;
import com.ourwatchlist.backend.entity.Rating;
import com.ourwatchlist.backend.exception.ApiException;
import com.ourwatchlist.backend.repository.GroupMovieRepository;
import com.ourwatchlist.backend.repository.RatingRepository;

@Service
public class GroupMovieService {

    private final GroupService groupService;
    private final GroupMovieRepository movies;
    private final RatingRepository ratings;

    // Spring passes in what this service needs.
    public GroupMovieService(GroupService groupService, GroupMovieRepository movies, RatingRepository ratings) {
        this.groupService = groupService;
        this.movies = movies;
        this.ratings = ratings;
    }

    // The group's whole list, newest first, with everyone's ratings on each movie.
    public List<MovieResponse> list(UUID userId, UUID groupId) {
        // Checks membership and loads the names in one go.
        Map<UUID, String> names = groupService.memberNames(userId, groupId);

        List<GroupMovie> list = movies.findByGroupIdOrderByAddedAtDesc(groupId);
        if (list.isEmpty()) {
            return List.of();
        }

        // Load all ratings for these movies in one query, then sort them by movie.
        List<Long> movieIds = list.stream().map(GroupMovie::getId).toList();
        Map<Long, List<RatingResponse>> ratingsByMovie = new HashMap<>();
        for (Rating r : ratings.findByIdGroupMovieIdIn(movieIds)) {
            ratingsByMovie
                    .computeIfAbsent(r.getGroupMovieId(), key -> new ArrayList<>())
                    .add(new RatingResponse(r.getUserId(), names.get(r.getUserId()), r.getScore(), r.getNotes()));
        }

        return list.stream()
                .map(m -> toResponse(m, ratingsByMovie.getOrDefault(m.getId(), List.of())))
                .toList();
    }

    // Puts a movie on the group's list. A movie can only be on the list once.
    public MovieResponse add(UUID userId, UUID groupId, AddMovieRequest request) {
        groupService.requireMember(userId, groupId);

        if (request.tmdbId() <= 0 || request.title() == null || request.title().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A movie needs an id and a title");
        }
        // No separate "is it already there?" query: the database refuses a duplicate itself
        // (the unique rule on group + movie), which saves a round trip on every add.
        try {
            GroupMovie saved = movies.save(new GroupMovie(groupId, request.tmdbId(), request.title().trim(),
                    request.posterPath(), request.releaseYear(), request.tmdbRating(), request.overview(), userId));
            return toResponse(saved, List.of());
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(HttpStatus.CONFLICT, "This movie is already on your list");
        }
    }

    // Takes a movie off the list. Any member of the group may do this.
    public void remove(UUID userId, UUID groupId, Long movieId) {
        groupService.requireMember(userId, groupId);
        movies.delete(findInGroup(groupId, movieId));
    }

    // Moves a movie between "want" and "watched".
    public MovieResponse changeStatus(UUID userId, UUID groupId, Long movieId, String status) {
        groupService.requireMember(userId, groupId);

        if (!"want".equals(status) && !"watched".equals(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Status must be want or watched");
        }
        GroupMovie movie = findInGroup(groupId, movieId);
        movie.changeStatus(status);
        return toResponse(movies.save(movie), List.of());
    }

    // Finds the movie only inside this group, so other couples' movies cannot be reached.
    private GroupMovie findInGroup(UUID groupId, Long movieId) {
        return movies.findByIdAndGroupId(movieId, groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Movie not found"));
    }

    // Turns a movie into the shape the frontend receives.
    private MovieResponse toResponse(GroupMovie m, List<RatingResponse> movieRatings) {
        return new MovieResponse(m.getId(), m.getTmdbId(), m.getTitle(), m.getPosterPath(),
                m.getReleaseYear(), m.getTmdbRating(), m.getOverview(), m.getStatus(),
                m.getAddedBy(), m.getAddedAt(), m.getWatchedAt(), movieRatings);
    }
}
