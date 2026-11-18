// The two-part primary key of movie_texts: which TMDB movie and which language ("en" or "ru").
package com.ourwatchlist.backend.entity;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public record MovieTextId(
        @Column(name = "tmdb_id") int tmdbId,
        String language) implements Serializable {}
