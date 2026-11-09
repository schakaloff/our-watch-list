# Spin Wheel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/wheel` page with an animated SVG prize wheel over all "want to watch" movies; spin lands on a random winner shown with Watch it / Spin again actions.

**Architecture:** Pure angle→index logic in `src/lib/wheel.ts` (unit-tested). Presentational `SpinWheel` SVG component animated via CSS `transform: rotate` transition. `Wheel` page wires want-list movies into the wheel and reuses the existing `MovieDetailModal` for the winner.

**Tech Stack:** Existing stack only — React 19, TypeScript, Tailwind v4, react-router-dom, Vitest. No new dependencies.

## Global Constraints

- **No git.** User deferred git — skip all commit steps, never run `git init`.
- Spec: `docs/superpowers/specs/2026-07-03-spin-wheel-design.md`.
- No new npm dependencies (no maintained React-19 wheel lib exists; custom SVG).
- Wheel items = saved movies with `status === "want"` only.
- 0 want-movies → message + links, no wheel. Spin button disabled while spinning.
- Unit tests only for pure logic (`pickWinner`); UI verified manually/browser.
- Existing interfaces (do not change): `useSavedMovies(): { movies: SavedMovie[]; save(m): void; remove(id): void }`; `MovieDetailModal` props `{ movie, isSaved, onSave, onRemove, onClose }`; `posterUrl(path: string | null, size?): string | null`.

---

### Task 1: Wheel logic — `pickWinner` (TDD)

**Files:**
- Create: `src/lib/wheel.ts`
- Test: `src/lib/wheel.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `pickWinner(finalAngleDeg: number, count: number): number` — wheel rotated clockwise by `finalAngleDeg`; segment 0 starts at top (12 o'clock) and segments proceed clockwise; returns index of segment under the fixed top pointer.

- [ ] **Step 1: Write failing tests `src/lib/wheel.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { pickWinner } from "./wheel";

describe("pickWinner", () => {
  it("returns 0 at angle 0", () => {
    expect(pickWinner(0, 4)).toBe(0);
  });

  it("rotating clockwise brings the previous segment under the pointer", () => {
    // 4 segments of 90°; rotating wheel 90° clockwise puts segment 3 on top
    expect(pickWinner(90, 4)).toBe(3);
    expect(pickWinner(180, 4)).toBe(2);
    expect(pickWinner(270, 4)).toBe(1);
  });

  it("handles multi-turn angles", () => {
    expect(pickWinner(360 * 5, 4)).toBe(0);
    expect(pickWinner(360 * 5 + 90, 4)).toBe(3);
  });

  it("handles angles inside a segment (not on boundary)", () => {
    expect(pickWinner(45, 4)).toBe(3); // pointer at 315° of original wheel → segment 3
    expect(pickWinner(89.9, 4)).toBe(3);
    expect(pickWinner(91, 4)).toBe(2);
  });

  it("works with count 1", () => {
    expect(pickWinner(1234.5, 1)).toBe(0);
  });

  it("handles negative angles", () => {
    expect(pickWinner(-90, 4)).toBe(1);
  });

  it("throws on non-positive count", () => {
    expect(() => pickWinner(0, 0)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests, verify FAIL**

Run: `npx vitest run src/lib/wheel.test.ts`
Expected: FAIL — cannot resolve `./wheel`.

- [ ] **Step 3: Implement `src/lib/wheel.ts`**

```ts
export function pickWinner(finalAngleDeg: number, count: number): number {
  if (count <= 0) throw new Error("count must be positive");
  const seg = 360 / count;
  const normalized = ((finalAngleDeg % 360) + 360) % 360;
  const pointerAngle = (360 - normalized) % 360;
  return Math.floor(pointerAngle / seg) % count;
}
```

- [ ] **Step 4: Run tests, verify PASS**

Run: `npx vitest run`
Expected: all pass (10 existing + 7 new).

---

### Task 2: SpinWheel component

**Files:**
- Create: `src/components/SpinWheel.tsx`
- Test: typecheck only (`npm run build`); visuals verified in Task 3

**Interfaces:**
- Consumes: `pickWinner` from `src/lib/wheel.ts`
- Produces: default export `SpinWheel`, props `{ items: WheelItem[]; onResult: (id: number) => void }`; exported `interface WheelItem { id: number; label: string }`. Caller guarantees `items.length >= 1`.

- [ ] **Step 1: Create `src/components/SpinWheel.tsx`**

```tsx
import { useState } from "react";
import { pickWinner } from "../lib/wheel";

export interface WheelItem {
  id: number;
  label: string;
}

interface SpinWheelProps {
  items: WheelItem[];
  onResult: (id: number) => void;
}

const COLORS = ["#059669", "#334155", "#0284c7", "#475569"];

function truncate(label: string): string {
  return label.length > 18 ? label.slice(0, 17) + "…" : label;
}

function slicePath(i: number, count: number): string {
  const seg = 360 / count;
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const a0 = toRad(i * seg);
  const a1 = toRad((i + 1) * seg);
  const x0 = 100 * Math.cos(a0);
  const y0 = 100 * Math.sin(a0);
  const x1 = 100 * Math.cos(a1);
  const y1 = 100 * Math.sin(a1);
  const largeArc = seg > 180 ? 1 : 0;
  return `M0,0 L${x0},${y0} A100,100 0 ${largeArc} 1 ${x1},${y1} Z`;
}

export default function SpinWheel({ items, onResult }: SpinWheelProps) {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const count = items.length;
  const seg = 360 / count;
  const fontSize = count > 20 ? 5 : count > 12 ? 6.5 : 8;

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setAngle((a) => a + 360 * (4 + Math.floor(Math.random() * 3)) + Math.random() * 360);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md">
        <svg viewBox="-104 -104 208 208" className="w-full">
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.2, 0.6, 0.1, 1)" : "none",
            }}
            onTransitionEnd={() => {
              setSpinning(false);
              onResult(items[pickWinner(angle, count)].id);
            }}
          >
            {count === 1 ? (
              <circle r="100" fill={COLORS[0]} />
            ) : (
              items.map((item, i) => (
                <path key={item.id} d={slicePath(i, count)} fill={COLORS[i % COLORS.length]} />
              ))
            )}
            {items.map((item, i) => (
              <text
                key={item.id}
                transform={`rotate(${(i + 0.5) * seg}) translate(0 -60)`}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize={fontSize}
              >
                {truncate(item.label)}
              </text>
            ))}
          </g>
          <path d="M-8,-104 L8,-104 L0,-88 Z" fill="#f59e0b" />
        </svg>
      </div>
      <button
        onClick={spin}
        disabled={spinning}
        className="rounded bg-emerald-600 px-8 py-3 text-lg font-semibold text-white hover:bg-emerald-500 disabled:cursor-default disabled:bg-slate-600"
      >
        {spinning ? "Spinning…" : "Spin 🎡"}
      </button>
    </div>
  );
}
```

Notes for the implementer (do not change the code, this explains it):
- SVG `transform` on `<g>` uses CSS transforms, so the `transition` property animates it; `transform-origin` defaults to `0 0` which is the wheel center in this viewBox.
- `onTransitionEnd` reads `angle` from the render where the target angle is already set — correct winner math.
- `count === 1`: full-circle arc path degenerates, hence the `<circle>` special case.

- [ ] **Step 2: Verify typecheck + tests**

Run: `npm run build`
Expected: no type errors, build succeeds.
Run: `npx vitest run`
Expected: 17/17 pass.

---

### Task 3: Wheel page, route, nav + verification

**Files:**
- Create: `src/pages/Wheel.tsx`
- Modify: `src/App.tsx` (add nav link + route)
- Test: manual/browser

**Interfaces:**
- Consumes: `SpinWheel` + `WheelItem` (Task 2), `useSavedMovies`, `MovieDetailModal`, `posterUrl`, `SavedMovie`
- Produces: route `/wheel`

- [ ] **Step 1: Create `src/pages/Wheel.tsx`**

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import MovieDetailModal from "../components/MovieDetailModal";
import SpinWheel from "../components/SpinWheel";
import { useSavedMovies } from "../hooks/useSavedMovies";
import { posterUrl } from "../tmdb";

export default function Wheel() {
  const { movies, save, remove } = useSavedMovies();
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const wantMovies = movies.filter((m) => m.status === "want");
  const winner = movies.find((m) => m.id === winnerId) ?? null;
  const winnerImg = winner ? posterUrl(winner.poster) : null;

  if (wantMovies.length === 0) {
    return (
      <p className="text-slate-400">
        The wheel needs at least one movie in{" "}
        <Link to="/list" className="text-emerald-400 hover:underline">
          Want to watch
        </Link>
        . Find some on the{" "}
        <Link to="/" className="text-emerald-400 hover:underline">
          Browse
        </Link>{" "}
        page first.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
      <SpinWheel
        items={wantMovies.map((m) => ({ id: m.id, label: m.title }))}
        onResult={setWinnerId}
      />

      {winner && (
        <div className="flex w-64 flex-col items-center gap-3 rounded-lg bg-slate-800 p-6 text-center">
          <p className="text-sm uppercase tracking-wide text-emerald-400">Tonight you watch</p>
          {winnerImg && <img src={winnerImg} alt={winner.title} className="w-40 rounded" />}
          <h2 className="text-lg font-bold">
            {winner.title}{" "}
            {winner.year && <span className="font-normal text-slate-400">({winner.year})</span>}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Watch it
            </button>
            <button
              onClick={() => setWinnerId(null)}
              className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
            >
              Spin again
            </button>
          </div>
        </div>
      )}

      {showModal && winner && (
        <MovieDetailModal
          movie={winner}
          isSaved={true}
          onSave={save}
          onRemove={remove}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire route + nav in `src/App.tsx`** — full replacement:

```tsx
import { NavLink, Route, Routes } from "react-router-dom";
import Browse from "./pages/Browse";
import MyList from "./pages/MyList";
import Wheel from "./pages/Wheel";

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
          <NavLink to="/wheel" className={linkClass}>
            🎡 Wheel
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/list" element={<MyList />} />
          <Route path="/wheel" element={<Wheel />} />
        </Routes>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify build + tests**

Run: `npm run build` — Expected: clean.
Run: `npx vitest run` — Expected: 17/17.

- [ ] **Step 4: Manual/browser verification (controller)**

1. `/wheel` with empty want-list → message with working links, no wheel.
2. Seed 3+ want movies → wheel renders segments with truncated titles, pointer on top.
3. Click Spin → button disables, wheel animates ~4 s, decelerates, stops.
4. Winner panel shows movie whose segment is under pointer (verify visually against final wheel position).
5. Watch it → modal opens; mark watched + save → movie leaves wheel (segment count drops).
6. Spin again → panel clears, spin works repeatedly (angles accumulate).

---

## Spec Coverage Check

- Route `/wheel` + nav item → Task 3
- SpinWheel presentational component, SVG, CSS rotate, 4–6 turns + random offset, disabled during spin → Task 2
- `pickWinner` pure + tested → Task 1
- Winner panel with Watch it (modal reuse) + Spin again → Task 3
- Edge cases: 0 movies (message + links) → Task 3; 1 movie (circle case) → Task 2; many movies (fontSize shrink + truncate) → Task 2
- No new deps → all tasks
