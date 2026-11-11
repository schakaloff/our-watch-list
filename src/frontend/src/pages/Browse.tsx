import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import MovieCard from "../components/MovieCard";
import MovieDetailModal from "../components/MovieDetailModal";
import type { SavedMovie } from "../types";

// One movie as the backend sends it. The field names come from TMDB.
interface ApiMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
}

// TMDB only gives the end of the image address, so we add the start.
const IMAGE_URL = "https://image.tmdb.org/t/p/w342";

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
  const [movies, setMovies] = useState<SavedMovie[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SavedMovie | null>(null);

  // When the page opens, show the popular movies.
  useEffect(() => {
    loadMovies("/api/movies/popular")
      .then(setMovies)
      .catch(() => setError("Could not load movies. Is the backend running?"));
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
      setMovies(await loadMovies(path));
    } catch {
      setError("Search failed. Is the backend running?");
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {movies.map((m) => (
          <MovieCard
            key={m.id}
            title={m.title}
            year={m.year}
            poster={m.poster}
            rating={m.tmdbRating}
            actionLabel="+ Add"
            onOpen={() => setSelected(m)}
          />
        ))}
      </div>

      {selected && <MovieDetailModal movie={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
