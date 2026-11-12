import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import GroupPicker from "../components/GroupPicker";
import MovieCard from "../components/MovieCard";
import MovieDetailModal from "../components/MovieDetailModal";
import { apiFetch } from "../lib/api";
import { forget, setCached } from "../lib/cache";
import { getHomeData, setHomeData } from "../lib/homeCache";
import { IMAGE_URL } from "../lib/tmdb";
import type { Group, SavedMovie } from "../types";

// One movie as the backend sends it. The field names come from TMDB.
interface ApiMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
}

// A message shown above the movies, such as "Added to Movie nights" or an error.
interface Notice {
  ok: boolean;
  text: string;
  linkTo?: string;
  linkLabel?: string;
}

// Turns a movie from the backend into the shape our cards and popup use.
function toMovie(m: ApiMovie): SavedMovie {
  return {
    id: m.id,
    title: m.title,
    poster: m.poster_path ? IMAGE_URL + m.poster_path : null,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    tmdbRating: m.vote_average,
    overview: m.overview,
    status: "want",
    addedAt: "",
  };
}

// Asks the backend for a list of movies (popular or search results).
async function loadMovies(path: string): Promise<SavedMovie[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Could not load movies");
  const data: ApiMovie[] = await res.json();
  return data.map(toMovie);
}

export default function Browse() {
  // If the home page was open earlier, start from what it knew then, so nothing flashes or waits.
  const cached = getHomeData() ?? null;

  const [movies, setMovies] = useState<SavedMovie[]>(cached?.popular ?? []);
  // The popular movies only (not search results), which are what we remember for the next visit.
  const popular = useRef<SavedMovie[]>(cached?.popular ?? []);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SavedMovie | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [picker, setPicker] = useState<{ movie: SavedMovie; groups: Group[] } | null>(null);
  // Your groups, and for each movie (by TMDB id) the ids of the groups it is already on.
  const [groups, setGroups] = useState<Group[]>(cached?.groups ?? []);
  const [savedIn, setSavedIn] = useState<Record<number, string[]>>(cached?.savedIn ?? {});
  const [loggedIn, setLoggedIn] = useState(cached?.loggedIn ?? true);
  // False until we know what is already added, so the buttons never show the wrong state.
  const [savedLoaded, setSavedLoaded] = useState(cached !== null);

  // Finds your groups and what is already on their lists, in two requests that run together.
  const loadSaved = useCallback(async () => {
    const [groupsRes, savedRes] = await Promise.all([apiFetch("/api/groups"), apiFetch("/api/groups/saved")]);

    if (!groupsRes.ok || !savedRes.ok) {
      setGroups([]);
      setSavedIn({});
      setLoggedIn(groupsRes.status !== 401);
      setSavedLoaded(true);
      return;
    }

    // The backend sends { groupId: [tmdbId, ...] }. We flip it to { tmdbId: [groupId, ...] }.
    const saved: Record<string, number[]> = await savedRes.json();
    const map: Record<number, string[]> = {};
    for (const [groupId, tmdbIds] of Object.entries(saved)) {
      for (const tmdbId of tmdbIds) {
        map[tmdbId] = [...(map[tmdbId] ?? []), groupId];
      }
    }
    const groupList: Group[] = await groupsRes.json();
    setCached("groups", groupList);
    setGroups(groupList);
    setSavedIn(map);
    setLoggedIn(true);
    setSavedLoaded(true);
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  // Remember what we know, so the next visit to this page starts with it.
  useEffect(() => {
    if (savedLoaded) {
      setHomeData({ popular: popular.current, groups, savedIn, loggedIn });
    }
  }, [movies, groups, savedIn, loggedIn, savedLoaded]);

  // A movie counts as added when it is on the list of every group you are in.
  function isAdded(movieId: number): boolean {
    return groups.length > 0 && groups.every((g) => savedIn[movieId]?.includes(g.id));
  }

  // Marks a movie as added to (or removed from) a group on screen, without waiting for the backend.
  function markAdded(groupId: string, movieId: number, added: boolean) {
    setSavedIn((current) => {
      const others = (current[movieId] ?? []).filter((id) => id !== groupId);
      return { ...current, [movieId]: added ? [...others, groupId] : others };
    });
  }

  // When the page opens, show the popular movies (unless we already have them).
  useEffect(() => {
    if (cached) return;
    loadMovies("/api/movies/popular")
      .then((list) => {
        popular.current = list;
        setMovies(list);
      })
      .catch(() => setError("Could not load movies. Is the backend running?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search for what the user typed. An empty search shows the popular movies again.
  async function onSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const text = query.trim();
    const path = text
      ? `/api/movies/search?query=${encodeURIComponent(text)}`
      : "/api/movies/popular";

    try {
      const list = await loadMovies(path);
      if (!text) popular.current = list;
      setMovies(list);
    } catch {
      setError("Search failed. Is the backend running?");
    }
  }

  // Called by "+ Add". Uses what the page already knows, and asks only when there is a choice.
  function onAdd(movie: SavedMovie) {
    setNotice(null);

    if (!loggedIn) {
      setNotice({ ok: false, text: "Sign in to add movies to a group.", linkTo: "/login", linkLabel: "Sign in" });
      return;
    }
    if (groups.length === 0) {
      setNotice({ ok: false, text: "Create a group first, then you can add movies.", linkTo: "/groups", linkLabel: "Go to Groups" });
      return;
    }

    // Only offer the groups that do not have this movie yet.
    const available = groups.filter((g) => !savedIn[movie.id]?.includes(g.id));
    if (available.length === 1) {
      addTo(available[0], movie);
    } else if (available.length > 1) {
      setPicker({ movie, groups: available });
    }
  }

  // Adds the movie to the group. The button changes at once; if the backend refuses, it changes back.
  async function addTo(group: Group, movie: SavedMovie) {
    setPicker(null);
    markAdded(group.id, movie.id, true);
    // That group's list is about to change, so any remembered copy of it is out of date.
    forget(`movies:${group.id}`);

    try {
      const res = await apiFetch(`/api/groups/${group.id}/movies`, {
        method: "POST",
        body: {
          tmdbId: movie.id,
          title: movie.title,
          // The card holds the full image address, but the backend stores only the end of it.
          posterPath: movie.poster ? movie.poster.slice(IMAGE_URL.length) : null,
          releaseYear: movie.year,
          tmdbRating: movie.tmdbRating,
          overview: movie.overview,
        },
      });

      if (res.ok) {
        setNotice({ ok: true, text: `Added "${movie.title}" to ${group.name}.`, linkTo: `/groups/${group.id}`, linkLabel: "View list" });
        return;
      }

      // 409 means it was already on the list, so "added" is right. Any other error undoes the change.
      if (res.status !== 409) {
        markAdded(group.id, movie.id, false);
      }
      setNotice({ ok: false, text: (await res.json()).message });
    } catch {
      markAdded(group.id, movie.id, false);
      setNotice({ ok: false, text: "Could not reach the server. Try again." });
    }
  }

  return (
    <div>
      <form onSubmit={onSearch} className="mb-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies…"
          className="flex-1 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <button className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500">
          Search
        </button>
      </form>

      {error && <p className="mb-4 rounded bg-amber-900/40 p-4 text-amber-200">{error}</p>}

      {notice && (
        <p
          className={`mb-4 rounded p-3 text-sm ${
            notice.ok ? "bg-emerald-900/40 text-emerald-200" : "bg-red-900/40 text-red-300"
          }`}
        >
          {notice.text}{" "}
          {notice.linkTo && (
            <Link to={notice.linkTo} className="font-medium underline">
              {notice.linkLabel}
            </Link>
          )}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {movies.map((m) => (
          <MovieCard
            key={m.id}
            title={m.title}
            year={m.year}
            poster={m.poster}
            rating={m.tmdbRating}
            actionLabel={isAdded(m.id) ? "✓ Added" : "+ Add"}
            actionDisabled={!savedLoaded || isAdded(m.id)}
            onAction={() => onAdd(m)}
            onOpen={() => setSelected(m)}
          />
        ))}
      </div>

      {picker && (
        <GroupPicker
          movieTitle={picker.movie.title}
          groups={picker.groups}
          onPick={(group) => addTo(group, picker.movie)}
          onClose={() => setPicker(null)}
        />
      )}

      {selected && <MovieDetailModal movie={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
