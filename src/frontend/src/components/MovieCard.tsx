interface MovieCardProps {
  title: string;
  year: number | null;
  poster: string | null;
  rating: number;
  actionLabel: string;
  onOpen: () => void;
}

export default function MovieCard({
  title,
  year,
  poster,
  rating,
  actionLabel,
  onOpen,
}: MovieCardProps) {
  const img = poster;
  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-slate-800 shadow transition hover:shadow-lg">
      <button onClick={onOpen} className="block aspect-[2/3] w-full cursor-pointer bg-slate-700">
        {img ? (
          <img src={img} alt={title} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center p-2 text-sm text-slate-400">
            No poster
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="truncate font-semibold text-slate-100" title={title}>
          {title}
        </h3>
        <p className="text-sm text-slate-400">
          {year ?? "—"} · ★ {rating.toFixed(1)}
        </p>
        <button
          className="mt-auto rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
