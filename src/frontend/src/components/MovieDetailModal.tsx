import { useState } from "react";
import type { SavedMovie, Status } from "../types";

interface Props {
  movie: SavedMovie;
  onClose: () => void;
}

export default function MovieDetailModal({ movie, onClose }: Props) {
  const [status, setStatus] = useState<Status>(movie.status);
  const [myRating, setMyRating] = useState(movie.myRating ?? 0);
  const [notes, setNotes] = useState(movie.notes ?? "");
  const img = movie.poster;

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto rounded-lg bg-slate-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {img && (
          <img src={img} alt={movie.title} className="hidden h-72 rounded sm:block" />
        )}
        <div className="flex flex-1 flex-col gap-3">
          <h2 className="text-xl font-bold">
            {movie.title} {movie.year && <span className="font-normal text-slate-400">({movie.year})</span>}
          </h2>
          <p className="text-sm text-slate-400">TMDB ★ {movie.tmdbRating.toFixed(1)}</p>
          <p className="text-sm text-slate-300">{movie.overview || "No description."}</p>

          <div className="flex gap-2">
            {(["want", "watched"] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded px-3 py-1.5 text-sm font-medium ${
                  status === s ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                {s === "want" ? "Want to watch" : "Watched"}
              </button>
            ))}
          </div>

          {status === "watched" && (
            <label className="text-sm text-slate-300">
              My rating:{" "}
              <select
                value={myRating}
                onChange={(e) => setMyRating(Number(e.target.value))}
                className="rounded bg-slate-700 px-2 py-1"
              >
                <option value={0}>—</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes…"
            rows={3}
            className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 placeholder:text-slate-500"
          />

          <div className="mt-auto flex gap-2">
            <button
              onClick={onClose}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Remove
            </button>
            <button onClick={onClose} className="ml-auto rounded px-4 py-2 text-sm text-slate-400 hover:text-white">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
