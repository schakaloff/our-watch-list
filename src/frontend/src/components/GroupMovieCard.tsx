import { IMAGE_URL } from "../lib/tmdb";
import type { GroupMovie, Member } from "../types";

interface Props {
  movie: GroupMovie;
  members: Member[];
  onStatusChange: (status: "want" | "watched") => void;
  onRemove: () => void;
}

// A movie on the shared list: poster, details, each person's score, and the buttons to
// move it between "want" and "watched" or take it off the list.
export default function GroupMovieCard({ movie, members, onStatusChange, onRemove }: Props) {
  const watched = movie.status === "watched";

  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-slate-800 shadow">
      <div className="aspect-[2/3] w-full bg-slate-700">
        {movie.posterPath ? (
          <img src={IMAGE_URL + movie.posterPath} alt={movie.title} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center p-2 text-sm text-slate-400">No poster</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="truncate font-semibold text-slate-100" title={movie.title}>
            {movie.title}
          </h3>
          <p className="text-sm text-slate-400">
            {movie.releaseYear ?? "—"} · TMDB ★ {movie.tmdbRating?.toFixed(1) ?? "—"}
          </p>
        </div>

        {/* Each member's own score, or a dash if they have not rated it yet. */}
        <ul className="space-y-0.5 text-sm">
          {members.map((m) => {
            const rating = movie.ratings.find((r) => r.userId === m.userId);
            return (
              <li key={m.userId} className="flex justify-between text-slate-300">
                <span className="truncate">{m.displayName}</span>
                <span className={rating ? "font-medium text-emerald-400" : "text-slate-500"}>
                  {rating ? `★ ${rating.score}` : "—"}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto flex gap-2 pt-1">
          <button
            onClick={() => onStatusChange(watched ? "want" : "watched")}
            className="flex-1 rounded bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
          >
            {watched ? "Move back" : "Mark watched"}
          </button>
          <button
            onClick={onRemove}
            className="rounded bg-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-red-700 hover:text-white"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
