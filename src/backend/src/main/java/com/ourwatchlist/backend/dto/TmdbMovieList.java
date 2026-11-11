// TMDB's answer for a list of movies (popular or search).
// The movies are inside "results"; the rest of the answer is ignored.
package com.ourwatchlist.backend.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TmdbMovieList(List<TmdbMovie> results) {}
