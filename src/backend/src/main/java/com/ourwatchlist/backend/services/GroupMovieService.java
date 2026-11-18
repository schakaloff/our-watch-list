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
import com.ourwatchlist.backend.entity.MovieText;
import com.ourwatchlist.backend.entity.Rating;
import com.ourwatchlist.backend.exception.ApiException;
import com.ourwatchlist.backend.repository.GroupMovieRepository;
import com.ourwatchlist.backend.repository.RatingRepository;

@Service
public class GroupMovieService {

    private final GroupService groupService;
    private final GroupMovieRepository movies;
    private final RatingRepository ratings;
    private final MovieTextService movieTexts;

    // Spring passes in what this service needs.
    public GroupMovieService(GroupService groupService, GroupMovieRepository movies, RatingRepository ratings,
            MovieTextService movieTexts) {
        this.groupService = groupService;
        this.movies = movies;
        this.ratings = ratings;
        this.movieTexts = movieTexts;
    }

    // The group's whole list, newest first, with everyone's ratings on each movie.
    // The title, description and poster come in the given language from the text we saved for each movie
    // (see MovieTextService). A movie with no saved text yet shows the copy saved when it was added,
    // and its text is fetched in the background for next time. TMDB is never called while showing a list.
    public List<MovieResponse> list(UUID userId, UUID groupId, String language) {
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

        Map<Integer, MovieText> texts = movieTexts.textsFor(list.stream().map(GroupMovie::getTmdbId).toList(), language);

        return list.stream()
                .map(m -> toResponse(m, texts.get(m.getTmdbId()), ratingsByMovie.getOrDefault(m.getId(), List.of())))
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
            // Keep the movie's English and Russian text in our database, so lists never need to wait for TMDB.
            movieTexts.saveBothLanguages(request.tmdbId());
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
    // Turns a movie into the shape the frontend receives, with no TMDB text (used right after adding or changing one).
    private MovieResponse toResponse(GroupMovie m, List<RatingResponse> movieRatings) {
        return toResponse(m, null, movieRatings);
    }

    // Same, but takes the title, description and poster from the saved text in the user's language when we have it.
    // Anything missing there stays as saved with the movie.
    private MovieResponse toResponse(GroupMovie m, MovieText text, List<RatingResponse> movieRatings) {
        String title = text != null && text.getTitle() != null && !text.getTitle().isBlank() ? text.getTitle() : m.getTitle();
        String overview = text != null && text.getOverview() != null && !text.getOverview().isBlank() ? text.getOverview() : m.getOverview();
        String poster = text != null && text.getPosterPath() != null ? text.getPosterPath() : m.getPosterPath();
        return new MovieResponse(m.getId(), m.getTmdbId(), title, poster,
                m.getReleaseYear(), m.getTmdbRating(), overview, m.getStatus(),
                m.getAddedBy(), m.getAddedAt(), m.getWatchedAt(), movieRatings);
    }
}
