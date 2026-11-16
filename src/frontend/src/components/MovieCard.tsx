import { useTranslation } from "react-i18next";

interface MovieCardProps {
  title: string;
  year: number | null;
  poster: string | null;
  rating: number;
  actionLabel: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  onOpen: () => void;
}

// A movie on the home page: the poster, the title, the year and rating, and the "+ Add" button.
export default function MovieCard({
  title,
  year,
  poster,
  rating,
  actionLabel,
  actionDisabled,
  onAction,
  onOpen,
}: MovieCardProps) {
  const { t } = useTranslation();
  return (
    <div className="group flex flex-col">
      <button
        onClick={onOpen}
        className="relative block aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-sm bg-surface-2 shadow-[0_4px_4px_rgba(0,0,0,0.25)] ring-1 ring-white/10"
      >
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center p-2 text-sm text-faint">{t("common.noPoster")}</span>
        )}
      </button>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <h3 className="truncate text-base font-medium text-white" title={title}>
          {title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <span>{year ?? "—"}</span>
          <span aria-hidden="true" className="size-1 rounded-full bg-white" />
          <span>★ {rating.toFixed(1)}</span>
        </p>
        <button
          onClick={onAction}
          disabled={actionDisabled}
          className="mt-2 cursor-pointer rounded-sm border border-white/40 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-black disabled:cursor-default disabled:border-white/15 disabled:bg-transparent disabled:text-white/50"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
