import { useState } from "react";
import MovieCard from "../components/MovieCard";
import MovieDetailModal from "../components/MovieDetailModal";
import type { SavedMovie } from "../types";

const movies: SavedMovie[] = [];

export default function Browse() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SavedMovie | null>(null);

  return (
    <div>
      <form onSubmit={(e) => e.preventDefault()} className="mb-6 flex gap-2">
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
