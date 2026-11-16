import { useTranslation } from "react-i18next";
import { IMAGE_URL } from "../lib/tmdb";
import type { GroupMovie, Member } from "../types";

interface Props {
  movie: GroupMovie;
  members: Member[];
  onStatusChange: (status: "want" | "watched") => void;
  onRemove: () => void;
  onOpen: () => void;
}

// A movie on the shared list: poster, details, each person's score, and the buttons to
// move it between "want" and "watched" or take it off the list.
export default function GroupMovieCard({ movie, members, onStatusChange, onRemove, onOpen }: Props) {
  const { t } = useTranslation();
  const watched = movie.status === "watched";

  return (
    <div className="group flex flex-col">
      <button
        onClick={onOpen}
        className="relative block aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-sm bg-surface-2 shadow-[0_4px_4px_rgba(0,0,0,0.25)] ring-1 ring-white/10"
      >
        {movie.posterPath ? (
          <img
            src={IMAGE_URL + movie.posterPath}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center p-2 text-sm text-faint">{t("common.noPoster")}</span>
        )}
      </button>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        <button onClick={onOpen} className="cursor-pointer text-left">
          <h3 className="truncate text-base font-medium text-white" title={movie.title}>
            {movie.title}
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <span>{movie.releaseYear ?? "—"}</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-white" />
            <span>{t("movie.tmdb", { rating: movie.tmdbRating?.toFixed(1) ?? "—" })}</span>
          </p>
        </button>

        {/* Each member's own score, or a dash if they have not rated it yet. Only for movies already watched. */}
        {watched && (
          <ul className="space-y-0.5 border-t border-line pt-2 text-sm">
            {members.map((m) => {
              const rating = movie.ratings.find((r) => r.userId === m.userId);
              return (
                <li key={m.userId} className="flex justify-between text-muted">
                  <span className="truncate">{m.displayName}</span>
                  <span className={rating ? "font-medium text-white" : "text-faint"}>
                    {rating ? `★ ${rating.score}` : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => onStatusChange(watched ? "want" : "watched")}
            className="min-w-0 flex-1 cursor-pointer rounded-sm border border-white/40 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white hover:text-black"
          >
            {watched ? t("list.moveBack") : t("list.markWatched")}
          </button>
          <button
            onClick={onRemove}
            className="cursor-pointer rounded-sm px-2 py-1.5 text-xs font-medium text-faint transition-colors hover:text-red-400"
          >
            {t("common.remove")}
          </button>
        </div>
      </div>
    </div>
  );
}
