import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedMovie, Status } from "../types";

interface Props {
  movie: SavedMovie;
  onClose: () => void;
}

export default function MovieDetailModal({ movie, onClose }: Props) {
  const { t } = useTranslation();
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
        className="flex max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto rounded-lg bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {img && (
          <img src={img} alt={movie.title} className="hidden h-72 rounded sm:block" />
        )}
        <div className="flex flex-1 flex-col gap-3">
          <h2 className="text-xl font-bold">
            {movie.title} {movie.year && <span className="font-normal text-muted">({movie.year})</span>}
          </h2>
          <p className="text-sm text-muted">{t("movie.tmdb", { rating: movie.tmdbRating.toFixed(1) })}</p>
          <p className="text-sm text-muted">{movie.overview || t("movie.noDescription")}</p>

          <div className="flex gap-2">
            {(["want", "watched"] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded px-3 py-1.5 text-sm font-medium ${
                  status === s ? "bg-white text-black" : "bg-surface-2 text-muted"
                }`}
              >
                {s === "want" ? t("list.tabWant") : t("list.tabWatched")}
              </button>
            ))}
          </div>

          {status === "watched" && (
            <label className="text-sm text-muted">
              {t("movie.myRating")}{" "}
              <select
                value={myRating}
                onChange={(e) => setMyRating(Number(e.target.value))}
                className="rounded bg-surface-2 px-2 py-1"
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
            placeholder={t("movie.notes")}
            rows={3}
            className="rounded border border-line bg-page p-2 text-sm text-white placeholder:text-faint"
          />

          <div className="mt-auto flex gap-2">
            <button
              onClick={onClose}
              className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/85"
            >
              {t("common.save")}
            </button>
            <button
              onClick={onClose}
              className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              {t("common.remove")}
            </button>
            <button onClick={onClose} className="ml-auto rounded px-4 py-2 text-sm text-muted hover:text-white">
              {t("common.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
