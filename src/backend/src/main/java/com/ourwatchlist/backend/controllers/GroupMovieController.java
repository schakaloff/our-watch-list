// The routes for a group's shared movie list: show it, add, remove, change status, and rate.
// Every route starts with /api/groups/{groupId}/movies, and the services check the user is in that group.
package com.ourwatchlist.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ourwatchlist.backend.dto.MovieDtos.AddMovieRequest;
import com.ourwatchlist.backend.dto.MovieDtos.MovieResponse;
import com.ourwatchlist.backend.dto.MovieDtos.RatingRequest;
import com.ourwatchlist.backend.dto.MovieDtos.RatingResponse;
import com.ourwatchlist.backend.dto.MovieDtos.StatusRequest;
import com.ourwatchlist.backend.dto.SupabaseUser;
import com.ourwatchlist.backend.services.GroupMovieService;
import com.ourwatchlist.backend.services.RatingService;

@RestController
@RequestMapping("/api/groups/{groupId}/movies")
public class GroupMovieController {

    private final GroupMovieService movieService;
    private final RatingService ratingService;

    // Spring passes in the two services here.
    public GroupMovieController(GroupMovieService movieService, RatingService ratingService) {
        this.movieService = movieService;
        this.ratingService = ratingService;
    }

    // Handles GET /api/groups/{groupId}/movies. The group's list with everyone's ratings.
    @GetMapping
    public List<MovieResponse> list(@AuthenticationPrincipal SupabaseUser user, @PathVariable UUID groupId) {
        return movieService.list(UUID.fromString(user.id()), groupId);
    }

    // Handles POST /api/groups/{groupId}/movies. Adds a movie to the list.
    @PostMapping
    public MovieResponse add(@AuthenticationPrincipal SupabaseUser user, @PathVariable UUID groupId,
            @RequestBody AddMovieRequest body) {
        return movieService.add(UUID.fromString(user.id()), groupId, body);
    }

    // Handles DELETE /api/groups/{groupId}/movies/{movieId}. Removes a movie from the list.
    @DeleteMapping("/{movieId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal SupabaseUser user, @PathVariable UUID groupId,
            @PathVariable Long movieId) {
        movieService.remove(UUID.fromString(user.id()), groupId, movieId);
    }

    // Handles PATCH /api/groups/{groupId}/movies/{movieId}. Moves a movie between want and watched.
    @PatchMapping("/{movieId}")
    public MovieResponse changeStatus(@AuthenticationPrincipal SupabaseUser user, @PathVariable UUID groupId,
            @PathVariable Long movieId, @RequestBody StatusRequest body) {
        return movieService.changeStatus(UUID.fromString(user.id()), groupId, movieId, body.status());
    }

    // Handles PUT /api/groups/{groupId}/movies/{movieId}/rating. Saves the user's own score and notes.
    @PutMapping("/{movieId}/rating")
    public RatingResponse rate(@AuthenticationPrincipal SupabaseUser user, @PathVariable UUID groupId,
            @PathVariable Long movieId, @RequestBody RatingRequest body) {
        return ratingService.rate(UUID.fromString(user.id()), groupId, movieId, body);
    }
}
