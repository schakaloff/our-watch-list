# OurWatchList — Design Spec

Date: 2026-07-03
Status: Approved

## Purpose

Local movie watchlist website. Browse/search real movies (TMDB), add them to a personal list, track want-to-watch / watched status, rate and annotate watched movies. Single user, no database, no backend.

## Architecture

- **Stack:** React + Vite + Tailwind CSS. Single-page app, client-only.
- **Movie data:** TMDB API, called directly from the browser. API key stored in `.env` as `VITE_TMDB_KEY`. Key is exposed client-side — acceptable for local use.
- **Personal data:** statuses, ratings, notes stored in `localStorage`, keyed by TMDB movie id.
- **Routing:** react-router with 2 routes: `/` (Browse) and `/list` (My List).

## Pages / Components

### Browse (`/`)
- Grid of movie cards. Default content: TMDB "popular" feed.
- Search bar on top → TMDB search endpoint.
- Card shows: poster, title, year, TMDB rating, add button.

### My List (`/list`)
- Same card grid, sourced from localStorage.
- Tabs: **Want to watch** / **Watched**.

### Movie detail
- Modal (or page) with full movie info plus user controls:
  - Status: want-to-watch / watched
  - Personal rating: 1–10
  - Free-text notes

## Data Model

One object per saved movie in localStorage:

```json
{
  "id": 603,
  "title": "The Matrix",
  "poster": "/path.jpg",
  "year": 1999,
  "status": "watched",
  "myRating": 9,
  "notes": "rewatch",
  "addedAt": "2026-07-03T12:00:00Z",
  "watchedAt": "2026-07-03T12:00:00Z"
}
```

- TMDB fields are snapshotted at add time → My List works offline, no re-fetch needed.
- `status` ∈ `"want" | "watched"`. `myRating`, `notes`, `watchedAt` optional (only meaningful when watched).

## Error Handling

- Missing API key or network failure → friendly message on Browse page; My List keeps working from local data.
- All localStorage access goes through a small `storage.ts` module — single swap point for a real DB later.

## Testing

- Vitest for the storage module and status-transition logic.
- UI verified manually.

## Out of Scope (for now)

- Multiple users / profiles / sharing
- Backend, database, deployment
- TV shows (movies only)

## Prerequisite

Free TMDB API key (themoviedb.org → settings → API). Not a build blocker — app must degrade gracefully without it.
