// Database access for the movies on a group's shared list.
package com.ourwatchlist.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ourwatchlist.backend.entity.GroupMovie;

public interface GroupMovieRepository extends JpaRepository<GroupMovie, Long> {

    // The whole list of a group, newest first.
    List<GroupMovie> findByGroupIdOrderByAddedAtDesc(UUID groupId);

    // The movies of many groups in one query.
    List<GroupMovie> findByGroupIdIn(Collection<UUID> groupIds);

    // Finds a movie only if it belongs to this group, so nobody can touch another couple's movie by guessing its id.
    Optional<GroupMovie> findByIdAndGroupId(Long id, UUID groupId);

    // Is this TMDB movie already on the group's list? Stops duplicates.
    boolean existsByGroupIdAndTmdbId(UUID groupId, int tmdbId);
}
