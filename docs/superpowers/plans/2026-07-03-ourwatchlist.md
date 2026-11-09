# OurWatchList Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Local movie watchlist SPA — browse/search TMDB movies, save to a personal list with want/watched status, rating, and notes, persisted in localStorage.

**Architecture:** Client-only React SPA. TMDB API called from the browser (`src/tmdb.ts`); all personal data goes through one storage module (`src/storage.ts`) backed by localStorage. Two routes (`/` Browse, `/list` My List) share a card grid and a detail modal.

**Tech Stack:** React 18+, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), react-router-dom, TypeScript, Vitest + jsdom.

## Global Constraints

- **No git.** User explicitly deferred git/GitHub. Skip all commits; do NOT run `git init`.
- Spec: `docs/superpowers/specs/2026-07-03-ourwatchlist-design.md`.
- API key read from `import.meta.env.VITE_TMDB_KEY`; app must degrade gracefully without it (Browse shows message, My List still works).
- `status` ∈ `"want" | "watched"`. Personal rating 1–10.
- Unit tests only for storage + data logic (spec: UI verified manually).

---

### Task 1: Project scaffold

**Files:**
- Create: entire Vite scaffold at repo root, `vite.config.ts`, `src/index.css`, `.env.example`
- Test: none (verify dev server + test runner start)

**Interfaces:**
- Consumes: nothing
- Produces: working `npm run dev`, `npx vitest run`, Tailwind active, deps installed (`react-router-dom`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `jsdom`)

- [ ] **Step 1: Scaffold Vite react-ts into repo root**

Repo root already contains `docs/`, so scaffold into a temp dir and move:

```bash
cd /home/apelsinchik/antigravity/our-watch-list
npm create vite@latest tmp-scaffold -- --template react-ts
mv tmp-scaffold/* tmp-scaffold/.gitignore .
rmdir tmp-scaffold
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom tailwindcss @tailwindcss/vite
npm install -D vitest jsdom
```

- [ ] **Step 3: Configure Vite + Vitest + Tailwind**

Replace `vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
  },
});
```

Replace ALL content of `src/index.css` with:

```css
@import "tailwindcss";
```

Delete `src/App.css` and remove its import from `src/App.tsx`.

- [ ] **Step 4: Add env example**

Create `.env.example`:

```
VITE_TMDB_KEY=paste_your_tmdb_api_key_here
```

If the user has a key, also create `.env` with the real value; otherwise skip (app must still run).

- [ ] **Step 5: Verify**

Run: `npx vitest run` — Expected: "No test files found" (exit ok with passWithNoTests may be needed; if it errors, that's fine — just confirm vitest executes).
Run: `npm run dev` briefly (or `npm run build`) — Expected: builds/serves without errors.

---

### Task 2: Types + storage module (TDD)

**Files:**
- Create: `src/types.ts`, `src/storage.ts`
- Test: `src/storage.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `types.ts`: `type Status = "want" | "watched"`; `interface SavedMovie { id: number; title: string; poster: string | null; year: number | null; tmdbRating: number; overview: string; status: Status; myRating?: number; notes?: string; addedAt: string; watchedAt?: string }`
  - `storage.ts`: `getAll(): SavedMovie[]`, `get(id: number): SavedMovie | undefined`, `save(movie: SavedMovie): void`, `remove(id: number): void`

- [ ] **Step 1: Create `src/types.ts`**

```ts
export type Status = "want" | "watched";

export interface SavedMovie {
  id: number;
  title: string;
  poster: string | null;
  year: number | null;
  tmdbRating: number;
  overview: string;
  status: Status;
  myRating?: number;
  notes?: string;
  addedAt: string;
  watchedAt?: string;
}
```

- [ ] **Step 2: Write failing tests `src/storage.test.ts`**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { getAll, get, save, remove } from "./storage";
import type { SavedMovie } from "./types";

function movie(overrides: Partial<SavedMovie> = {}): SavedMovie {
  return {
    id: 603,
    title: "The Matrix",
    poster: "/matrix.jpg",
    year: 1999,
    tmdbRating: 8.2,
    overview: "A hacker learns the truth.",
    status: "want",
    addedAt: "2026-07-03T12:00:00Z",
    ...overrides,
  };
}

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty list initially", () => {
    expect(getAll()).toEqual([]);
  });

  it("saves and retrieves a movie", () => {
    save(movie());
    expect(get(603)).toEqual(movie());
    expect(getAll()).toHaveLength(1);
  });

  it("overwrites existing movie with same id", () => {
    save(movie());
    save(movie({ status: "watched", myRating: 9 }));
    expect(getAll()).toHaveLength(1);
    expect(get(603)?.status).toBe("watched");
    expect(get(603)?.myRating).toBe(9);
  });

  it("removes a movie", () => {
    save(movie());
    remove(603);
    expect(get(603)).toBeUndefined();
    expect(getAll()).toEqual([]);
  });

  it("survives corrupted localStorage", () => {
    localStorage.setItem("owl:movies", "not json{");
    expect(getAll()).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests, verify FAIL**

Run: `npx vitest run src/storage.test.ts`
Expected: FAIL — cannot resolve `./storage`.

- [ ] **Step 4: Implement `src/storage.ts`**

```ts
import type { SavedMovie } from "./types";

const KEY = "owl:movies";

function load(): Record<string, SavedMovie> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function persist(map: Record<string, SavedMovie>): void {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getAll(): SavedMovie[] {
  return Object.values(load());
}

export function get(id: number): SavedMovie | undefined {
  return load()[String(id)];
}

export function save(movie: SavedMovie): void {
  const map = load();
  map[String(movie.id)] = movie;
  persist(map);
}

export function remove(id: number): void {
  const map = load();
  delete map[String(id)];
  persist(map);
}
```

- [ ] **Step 5: Run tests, verify PASS**

Run: `npx vitest run src/storage.test.ts`
Expected: 5 passed.

---

### Task 3: TMDB API module (TDD for pure logic)

**Files:**
- Create: `src/tmdb.ts`
- Test: `src/tmdb.test.ts`

**Interfaces:**
- Consumes: `SavedMovie`, `Status` from `src/types.ts`
- Produces:
  - `interface TmdbMovie { id: number; title: string; poster_path: string | null; release_date: string; vote_average: number; overview: string }`
  - `hasApiKey(): boolean`
  - `getPopular(): Promise<TmdbMovie[]>`
  - `searchMovies(query: string): Promise<TmdbMovie[]>`
  - `posterUrl(path: string | null, size?: string): string | null`
  - `toSavedMovie(m: TmdbMovie, status?: Status): SavedMovie`

- [ ] **Step 1: Write failing tests `src/tmdb.test.ts`** (pure functions only; network functions verified manually in UI)

```ts
import { describe, expect, it } from "vitest";
import { posterUrl, toSavedMovie, type TmdbMovie } from "./tmdb";

const raw: TmdbMovie = {
  id: 603,
  title: "The Matrix",
  poster_path: "/matrix.jpg",
  release_date: "1999-03-31",
  vote_average: 8.2,
  overview: "A hacker learns the truth.",
};

describe("posterUrl", () => {
  it("builds full image url", () => {
    expect(posterUrl("/matrix.jpg")).toBe("https://image.tmdb.org/t/p/w342/matrix.jpg");
  });

  it("returns null for missing poster", () => {
    expect(posterUrl(null)).toBeNull();
  });
});

describe("toSavedMovie", () => {
  it("snapshots tmdb fields with default want status", () => {
    const saved = toSavedMovie(raw);
    expect(saved).toMatchObject({
      id: 603,
      title: "The Matrix",
      poster: "/matrix.jpg",
      year: 1999,
      tmdbRating: 8.2,
      overview: "A hacker learns the truth.",
      status: "want",
    });
    expect(saved.addedAt).toBeTruthy();
  });

  it("handles empty release date", () => {
    expect(toSavedMovie({ ...raw, release_date: "" }).year).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests, verify FAIL**

Run: `npx vitest run src/tmdb.test.ts`
Expected: FAIL — cannot resolve `./tmdb`.

- [ ] **Step 3: Implement `src/tmdb.ts`**

```ts
import type { SavedMovie, Status } from "./types";

export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

const API = "https://api.themoviedb.org/3";

function apiKey(): string | undefined {
  return import.meta.env.VITE_TMDB_KEY;
}

export function hasApiKey(): boolean {
  return Boolean(apiKey());
}

async function request(path: string, params: Record<string, string> = {}): Promise<TmdbMovie[]> {
  const url = new URL(API + path);
  url.searchParams.set("api_key", apiKey() ?? "");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  const data = await res.json();
  return data.results as TmdbMovie[];
}

export function getPopular(): Promise<TmdbMovie[]> {
  return request("/movie/popular");
}

export function searchMovies(query: string): Promise<TmdbMovie[]> {
  return request("/search/movie", { query });
}

export function posterUrl(path: string | null, size = "w342"): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export function toSavedMovie(m: TmdbMovie, status: Status = "want"): SavedMovie {
  return {
    id: m.id,
    title: m.title,
    poster: m.poster_path,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    tmdbRating: m.vote_average,
    overview: m.overview,
    status,
    addedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run tests, verify PASS**

Run: `npx vitest run`
Expected: all tests pass (storage 5 + tmdb 4).

---

### Task 4: Saved-movies hook + MovieCard component

**Files:**
- Create: `src/hooks/useSavedMovies.ts`, `src/components/MovieCard.tsx`
- Test: manual (spec scopes unit tests to storage/data logic)

**Interfaces:**
- Consumes: `storage.ts` (`getAll`, `save`, `remove`), `posterUrl` from `tmdb.ts`, `SavedMovie` from `types.ts`
- Produces:
  - `useSavedMovies(): { movies: SavedMovie[]; save: (m: SavedMovie) => void; remove: (id: number) => void }`
  - `MovieCard` props: `{ title: string; year: number | null; posterPath: string | null; rating: number; actionLabel: string; actionDisabled?: boolean; onAction: () => void; onOpen: () => void }`

- [ ] **Step 1: Create `src/hooks/useSavedMovies.ts`**

```ts
import { useCallback, useState } from "react";
import * as storage from "../storage";
import type { SavedMovie } from "../types";

export function useSavedMovies() {
  const [movies, setMovies] = useState<SavedMovie[]>(() => storage.getAll());

  const save = useCallback((movie: SavedMovie) => {
    storage.save(movie);
    setMovies(storage.getAll());
  }, []);

  const remove = useCallback((id: number) => {
    storage.remove(id);
    setMovies(storage.getAll());
  }, []);

  return { movies, save, remove };
}
```

- [ ] **Step 2: Create `src/components/MovieCard.tsx`**

```tsx
import { posterUrl } from "../tmdb";

interface MovieCardProps {
  title: string;
  year: number | null;
  posterPath: string | null;
  rating: number;
  actionLabel: string;
  actionDisabled?: boolean;
  onAction: () => void;
  onOpen: () => void;
}

export default function MovieCard({
  title,
  year,
  posterPath,
  rating,
  actionLabel,
  actionDisabled,
  onAction,
  onOpen,
}: MovieCardProps) {
  const img = posterUrl(posterPath);
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
          onClick={onAction}
          disabled={actionDisabled}
          className="mt-auto rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-default disabled:bg-slate-600"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` (or `npm run build`) — Expected: no type errors. Visual check happens in Task 5.

---

### Task 5: App shell, routing, Browse page

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`
- Create: `src/pages/Browse.tsx`, `src/pages/MyList.tsx` (placeholder)
- Test: manual

**Interfaces:**
- Consumes: `getPopular`, `searchMovies`, `hasApiKey`, `toSavedMovie`, `TmdbMovie` from `tmdb.ts`; `useSavedMovies`; `MovieCard`
- Produces: routed app — `/` Browse, `/list` My List placeholder; nav bar

- [ ] **Step 1: Replace `src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { NavLink, Route, Routes } from "react-router-dom";
import Browse from "./pages/Browse";
import MyList from "./pages/MyList";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${
    isActive ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-700"
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <span className="mr-auto text-lg font-bold">🎬 OurWatchList</span>
          <NavLink to="/" end className={linkClass}>
            Browse
          </NavLink>
          <NavLink to="/list" className={linkClass}>
            My List
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/list" element={<MyList />} />
        </Routes>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/pages/MyList.tsx` placeholder** (real version in Task 6)

```tsx
export default function MyList() {
  return <p className="text-slate-400">My List — coming in Task 6.</p>;
}
```

- [ ] **Step 4: Create `src/pages/Browse.tsx`**

```tsx
import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import { useSavedMovies } from "../hooks/useSavedMovies";
import { getPopular, hasApiKey, searchMovies, toSavedMovie, type TmdbMovie } from "../tmdb";

export default function Browse() {
  const [results, setResults] = useState<TmdbMovie[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { movies, save } = useSavedMovies();
  const savedIds = new Set(movies.map((m) => m.id));

  useEffect(() => {
    if (!hasApiKey()) {
      setError("No TMDB API key found. Add VITE_TMDB_KEY to .env and restart the dev server.");
      return;
    }
    getPopular()
      .then(setResults)
      .catch(() => setError("Could not load movies. Check your internet connection."));
  }, []);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!hasApiKey()) return;
    try {
      const q = query.trim();
      setResults(q ? await searchMovies(q) : await getPopular());
      setError(null);
    } catch {
      setError("Search failed. Check your internet connection.");
    }
  }

  return (
    <div>
      <form onSubmit={onSearch} className="mb-6 flex gap-2">
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

      {error && <p className="rounded bg-amber-900/40 p-4 text-amber-200">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {results.map((m) => {
          const saved = savedIds.has(m.id);
          return (
            <MovieCard
              key={m.id}
              title={m.title}
              year={m.release_date ? Number(m.release_date.slice(0, 4)) : null}
              posterPath={m.poster_path}
              rating={m.vote_average}
              actionLabel={saved ? "✓ Added" : "+ Add"}
              actionDisabled={saved}
              onAction={() => save(toSavedMovie(m))}
              onOpen={() => save(toSavedMovie(m))}
            />
          );
        })}
      </div>
    </div>
  );
}
```

(`onOpen` temporarily adds too — detail modal wires in Task 7.)

- [ ] **Step 5: Verify manually**

Run: `npm run dev`, open browser.
Expected: nav bar renders; without API key → amber message, no crash; with key → popular movies grid, search works, "+ Add" flips to "✓ Added" and persists after page reload (localStorage).

---

### Task 6: My List page with status tabs

**Files:**
- Modify: `src/pages/MyList.tsx` (replace placeholder)
- Test: manual

**Interfaces:**
- Consumes: `useSavedMovies`, `MovieCard`, `Status`/`SavedMovie` from `types.ts`
- Produces: `/list` page with Want to watch / Watched tabs; remove button per card

- [ ] **Step 1: Replace `src/pages/MyList.tsx`**

```tsx
import { useState } from "react";
import MovieCard from "../components/MovieCard";
import { useSavedMovies } from "../hooks/useSavedMovies";
import type { Status } from "../types";

const tabs: { key: Status; label: string }[] = [
  { key: "want", label: "Want to watch" },
  { key: "watched", label: "Watched" },
];

export default function MyList() {
  const [tab, setTab] = useState<Status>("want");
  const { movies, remove } = useSavedMovies();
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

      {shown.length === 0 ? (
        <p className="text-slate-400">
          Nothing here yet. Add movies from the Browse page.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {shown.map((m) => (
            <MovieCard
              key={m.id}
              title={m.title}
              year={m.year}
              posterPath={m.poster}
              rating={m.myRating ?? m.tmdbRating}
              actionLabel="Remove"
              onAction={() => remove(m.id)}
              onOpen={() => remove(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

(`onOpen` temporarily removes — detail modal wires in Task 7.)

- [ ] **Step 2: Verify manually**

Run: `npm run dev`.
Expected: added movies appear under "Want to watch" with counts; Remove works and persists after reload; empty state shows message.

---

### Task 7: Movie detail modal (status, rating, notes)

**Files:**
- Create: `src/components/MovieDetailModal.tsx`
- Modify: `src/pages/Browse.tsx`, `src/pages/MyList.tsx` (wire `onOpen` to modal)
- Test: manual

**Interfaces:**
- Consumes: `SavedMovie`, `Status`, `posterUrl`
- Produces: `MovieDetailModal` props: `{ movie: SavedMovie; isSaved: boolean; onSave: (m: SavedMovie) => void; onRemove: (id: number) => void; onClose: () => void }`

- [ ] **Step 1: Create `src/components/MovieDetailModal.tsx`**

```tsx
import { useState } from "react";
import { posterUrl } from "../tmdb";
import type { SavedMovie, Status } from "../types";

interface Props {
  movie: SavedMovie;
  isSaved: boolean;
  onSave: (movie: SavedMovie) => void;
  onRemove: (id: number) => void;
  onClose: () => void;
}

export default function MovieDetailModal({ movie, isSaved, onSave, onRemove, onClose }: Props) {
  const [status, setStatus] = useState<Status>(movie.status);
  const [myRating, setMyRating] = useState(movie.myRating ?? 0);
  const [notes, setNotes] = useState(movie.notes ?? "");
  const img = posterUrl(movie.poster);

  function handleSave() {
    onSave({
      ...movie,
      status,
      myRating: status === "watched" && myRating > 0 ? myRating : undefined,
      notes: notes.trim() || undefined,
      watchedAt:
        status === "watched" ? (movie.watchedAt ?? new Date().toISOString()) : undefined,
    });
    onClose();
  }

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
              onClick={handleSave}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Save
            </button>
            {isSaved && (
              <button
                onClick={() => {
                  onRemove(movie.id);
                  onClose();
                }}
                className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Remove
              </button>
            )}
            <button onClick={onClose} className="ml-auto rounded px-4 py-2 text-sm text-slate-400 hover:text-white">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire modal into `src/pages/Browse.tsx`**

Add state + swap `onOpen`. Full updated component:

```tsx
import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import MovieDetailModal from "../components/MovieDetailModal";
import { useSavedMovies } from "../hooks/useSavedMovies";
import { getPopular, hasApiKey, searchMovies, toSavedMovie, type TmdbMovie } from "../tmdb";
import type { SavedMovie } from "../types";

export default function Browse() {
  const [results, setResults] = useState<TmdbMovie[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SavedMovie | null>(null);
  const { movies, save, remove } = useSavedMovies();
  const savedIds = new Set(movies.map((m) => m.id));

  useEffect(() => {
    if (!hasApiKey()) {
      setError("No TMDB API key found. Add VITE_TMDB_KEY to .env and restart the dev server.");
      return;
    }
    getPopular()
      .then(setResults)
      .catch(() => setError("Could not load movies. Check your internet connection."));
  }, []);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!hasApiKey()) return;
    try {
      const q = query.trim();
      setResults(q ? await searchMovies(q) : await getPopular());
      setError(null);
    } catch {
      setError("Search failed. Check your internet connection.");
    }
  }

  function open(m: TmdbMovie) {
    setSelected(movies.find((s) => s.id === m.id) ?? toSavedMovie(m));
  }

  return (
    <div>
      <form onSubmit={onSearch} className="mb-6 flex gap-2">
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

      {error && <p className="rounded bg-amber-900/40 p-4 text-amber-200">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {results.map((m) => {
          const saved = savedIds.has(m.id);
          return (
            <MovieCard
              key={m.id}
              title={m.title}
              year={m.release_date ? Number(m.release_date.slice(0, 4)) : null}
              posterPath={m.poster_path}
              rating={m.vote_average}
              actionLabel={saved ? "✓ Added" : "+ Add"}
              actionDisabled={saved}
              onAction={() => save(toSavedMovie(m))}
              onOpen={() => open(m)}
            />
          );
        })}
      </div>

      {selected && (
        <MovieDetailModal
          movie={selected}
          isSaved={savedIds.has(selected.id)}
          onSave={save}
          onRemove={remove}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire modal into `src/pages/MyList.tsx`**

Full updated component:

```tsx
import { useState } from "react";
import MovieCard from "../components/MovieCard";
import MovieDetailModal from "../components/MovieDetailModal";
import { useSavedMovies } from "../hooks/useSavedMovies";
import type { SavedMovie, Status } from "../types";

const tabs: { key: Status; label: string }[] = [
  { key: "want", label: "Want to watch" },
  { key: "watched", label: "Watched" },
];

export default function MyList() {
  const [tab, setTab] = useState<Status>("want");
  const [selected, setSelected] = useState<SavedMovie | null>(null);
  const { movies, save, remove } = useSavedMovies();
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

      {shown.length === 0 ? (
        <p className="text-slate-400">
          Nothing here yet. Add movies from the Browse page.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {shown.map((m) => (
            <MovieCard
              key={m.id}
              title={m.title}
              year={m.year}
              posterPath={m.poster}
              rating={m.myRating ?? m.tmdbRating}
              actionLabel="Remove"
              onAction={() => remove(m.id)}
              onOpen={() => setSelected(m)}
            />
          ))}
        </div>
      )}

      {selected && (
        <MovieDetailModal
          movie={selected}
          isSaved={true}
          onSave={save}
          onRemove={remove}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify manually (full flow)**

Run: `npm run dev`. Check:
1. Browse → click poster → modal opens with overview.
2. Set "Watched", rating 8, notes "great" → Save → My List → Watched tab shows it with ★ 8.0.
3. Reload page → data persists.
4. Modal Remove → movie gone from list, Browse shows "+ Add" again.
5. Click backdrop → modal closes without saving.

- [ ] **Step 5: Final check**

Run: `npx vitest run` — Expected: all tests pass.
Run: `npm run build` — Expected: no type errors, build succeeds.

---

## Spec Coverage Check

- Browse popular + search (spec "Browse") → Tasks 3, 5
- My List with tabs (spec "My List") → Task 6
- Detail modal with status/rating/notes (spec "Movie detail") → Task 7
- Data model + snapshot on add → Tasks 2, 3 (`toSavedMovie`)
- Error handling (no key / network) → Task 5; corrupted storage → Task 2
- storage.ts single swap point → Task 2
- Vitest for storage + data logic → Tasks 2, 3
