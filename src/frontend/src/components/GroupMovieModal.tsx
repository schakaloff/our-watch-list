import { useState } from "react";
import { apiFetch } from "../lib/api";
import { IMAGE_URL } from "../lib/tmdb";
import type { GroupMovie, Member, MemberRating } from "../types";

interface Props {
  movie: GroupMovie;
  members: Member[];
  // Your own user id, so we know which rating is yours. Null until it has loaded.
  myId: string | null;
  groupId: string;
  // Called with the saved rating, so the list behind the popup updates.
  onSaved: (movieId: number, rating: MemberRating) => void;
  onClose: () => void;
}

// The popup for one movie on the shared list: its details, your partner's score and notes,
// and the box where you give your own score (1 to 10) and notes.
export default function GroupMovieModal({ movie, members, myId, groupId, onSaved, onClose }: Props) {
  const mine = movie.ratings.find((r) => r.userId === myId);
  const [score, setScore] = useState(mine?.score ?? 0);
  const [notes, setNotes] = useState(mine?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The other people in the group. For a couple, this is your partner.
  const others = members.filter((m) => m.userId !== myId);

  // Sends your score and notes to the backend.
  async function save() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await apiFetch(`/api/groups/${groupId}/movies/${movie.id}/rating`, {
        method: "PUT",
        body: { score, notes },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      onSaved(movie.id, data);
      setSaved(true);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl gap-5 overflow-y-auto rounded-lg bg-slate-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {movie.posterPath && (
          <img
            src={IMAGE_URL + movie.posterPath}
            alt={movie.title}
            className="hidden h-72 rounded sm:block"
          />
        )}

        <div className="flex flex-1 flex-col gap-3">
          <div>
            <h2 className="text-xl font-bold">
              {movie.title}{" "}
              {movie.releaseYear && <span className="font-normal text-slate-400">({movie.releaseYear})</span>}
            </h2>
            <p className="text-sm text-slate-400">TMDB ★ {movie.tmdbRating?.toFixed(1) ?? "—"}</p>
          </div>

          {movie.overview && <p className="text-sm text-slate-300">{movie.overview}</p>}

          {/* What the other person thought. */}
          {others.map((m) => {
            const rating = movie.ratings.find((r) => r.userId === m.userId);
            return (
              <div key={m.userId} className="rounded bg-slate-900 p-3 text-sm">
                <p className="font-medium text-slate-200">
                  {m.displayName}:{" "}
                  {rating ? (
                    <span className="text-emerald-400">★ {rating.score}</span>
                  ) : (
                    <span className="font-normal text-slate-500">has not rated it yet</span>
                  )}
                </p>
                {rating?.notes && <p className="mt-1 italic text-slate-400">"{rating.notes}"</p>}
              </div>
            );
          })}

          {/* Your own score and notes. */}
          {myId ? (
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-sm text-slate-300">Your score</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setScore(n)}
                      className={`h-8 w-8 rounded text-sm font-medium ${
                        score === n ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Your notes…"
                rows={3}
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100 placeholder:text-slate-500"
              />

              {error && <p className="text-sm text-red-400">{error}</p>}
              {saved && <p className="text-sm text-emerald-400">Saved.</p>}

              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={score === 0 || saving}
                  className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-default disabled:bg-slate-600"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={onClose} className="ml-auto rounded px-4 py-2 text-sm text-slate-400 hover:text-white">
                  Close
                </button>
              </div>
            </div>
          ) : (
            <button onClick={onClose} className="self-end rounded px-4 py-2 text-sm text-slate-400 hover:text-white">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
