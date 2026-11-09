import { useState } from "react";
import MovieCard from "../components/MovieCard";
import MovieDetailModal from "../components/MovieDetailModal";
import type { SavedMovie, Status } from "../types";

const tabs: { key: Status; label: string }[] = [
  { key: "want", label: "Want to watch" },
  { key: "watched", label: "Watched" },
];

const movies: SavedMovie[] = [];

export default function MyList() {
  const [tab, setTab] = useState<Status>("want");
  const [selected, setSelected] = useState<SavedMovie | null>(null);
  const shown = movies.filter((m) => m.status === tab);

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded px-4 py-2 text-sm font-medium ${
              tab === t.key ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {t.label} ({movies.filter((m) => m.status === t.key).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {shown.map((m) => (
          <MovieCard
            key={m.id}
            title={m.title}
            year={m.year}
            poster={m.poster}
            rating={m.myRating ?? m.tmdbRating}
            actionLabel="Remove"
            onOpen={() => setSelected(m)}
          />
        ))}
      </div>

      {selected && <MovieDetailModal movie={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
