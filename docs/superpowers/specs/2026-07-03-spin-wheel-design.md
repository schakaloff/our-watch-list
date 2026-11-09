# Spin Wheel — Design Spec

Date: 2026-07-03
Status: Approved

## Purpose

New page with a spinning prize wheel loaded with all "want to watch" movies. User clicks Spin; wheel animates and lands on a random movie; winner shown with actions. Solves "what do we watch tonight?".

## Placement

- New route `/wheel`, third nav item "🎡 Wheel" after My List in `src/App.tsx`.

## Components

### `src/components/SpinWheel.tsx` (presentational, reusable)
- Props: `{ items: { id: number; label: string }[]; onResult: (id: number) => void }`
- Custom SVG wheel (no library — no maintained React 19 wheel lib exists):
  - Equal slices per item, alternating palette colors (slate/emerald family), truncated labels (~18 chars) along each slice.
  - Fixed pointer at top.
  - Spin: random target = 4–6 full turns + random offset; CSS `transform: rotate(...)` with `cubic-bezier` ease-out transition ≈ 4 s; on `transitionend`, compute winning segment from final angle, call `onResult(id)`.
  - Spin button disabled while spinning.

### `src/lib/wheel.ts` (pure logic, unit-tested)
- `pickWinner(finalAngleDeg: number, count: number): number` — maps final rotation angle to winning segment index (pointer at top).

### `src/pages/Wheel.tsx`
- Items = `useSavedMovies().movies.filter(m => m.status === "want")`.
- Renders SpinWheel + winner panel:
  - On result: winner movie shown big — poster, title, year.
  - Buttons: **Watch it** → opens existing `MovieDetailModal` (isSaved=true) for the winner; **Spin again** → clears winner, re-enables spin.
  - Saving as "watched" in the modal removes movie from want-list → wheel segments update.

## Edge Cases

- 0 want-movies: no wheel; message "Add movies to Want to watch first" with link to Browse.
- 1 movie: wheel renders and spins normally (trivial winner).
- Many movies (30+): labels truncate/shrink; equal slices always.

## Error Handling

Nothing network-based; purely local state. No new failure modes.

## Testing

- Vitest: `pickWinner` (angle→index mapping, wrap-around, boundaries).
- Wheel animation and page flow verified manually/via browser.

## Out of Scope

- Weighted slices, spin history, sounds, removing winner automatically.
