import type { Group } from "../types";

interface Props {
  movieTitle: string;
  groups: Group[];
  onPick: (group: Group) => void;
  onClose: () => void;
}

// A small popup that asks which group a movie should be added to.
export default function GroupPicker({ movieTitle, groups, onPick, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-slate-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold">Add to which group?</h2>
        <p className="mb-4 truncate text-sm text-slate-400">{movieTitle}</p>

        <div className="space-y-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => onPick(g)}
              className="w-full rounded bg-slate-700 px-4 py-3 text-left hover:bg-slate-600"
            >
              <span className="block font-medium">{g.name}</span>
              <span className="block text-xs text-slate-400">
                {g.members.map((m) => m.displayName).join(" & ")}
              </span>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="mt-4 text-sm text-slate-400 hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}
