// Database access for movie_texts: the saved title, description and poster of each movie, per language.
package com.ourwatchlist.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.ourwatchlist.backend.entity.MovieText;
import com.ourwatchlist.backend.entity.MovieTextId;

public interface MovieTextRepository extends JpaRepository<MovieText, MovieTextId> {

    // The saved text of many movies in one language, in one query.
    List<MovieText> findByIdTmdbIdInAndIdLanguage(Collection<Integer> tmdbIds, String language);

    // Saves a movie's text, or replaces it if it was saved before. One statement, so one trip to the database.
    @Modifying
    @Transactional
    @Query(nativeQuery = true, value = """
            insert into movie_texts (tmdb_id, language, title, overview, poster_path, fetched_at)
            values (:tmdbId, :language, :title, :overview, :posterPath, now())
            on conflict (tmdb_id, language) do update
            set title = excluded.title, overview = excluded.overview,
                poster_path = excluded.poster_path, fetched_at = now()
            """)
    void upsert(@Param("tmdbId") int tmdbId, @Param("language") String language, @Param("title") String title,
            @Param("overview") String overview, @Param("posterPath") String posterPath);
}
