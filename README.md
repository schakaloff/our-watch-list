# 🎬 OurWatchList

A shared watch list for couples. Find movies, add them to a list you share with your partner, mark what you have watched, and rate each one separately so you can compare scores.

Built as a full-stack project: a React frontend, a Spring Boot API, and Supabase for accounts and the database.

## Features

- **Discover movies** – popular titles and search, powered by TMDB.
- **Shared groups** – a group is a couple's list. One person creates it and shares a 6-character invite code; the other joins with it. A group holds at most two people, and you can be in several groups.
- **Want to watch / Watched** – move movies between the two tabs.
- **Separate ratings** – each person gives their own score (1–10) and notes, and sees their partner's.
- **Profiles** – a display name and an optional unique username, set once in Settings.
- **Delete a group** – only the person who created it can, and it removes the list and all ratings.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router |
| Backend | Java 21, Spring Boot 4, Spring Security, Spring Data JPA, Maven |
| Accounts | Supabase Auth (email + password) |
| Database | Supabase Postgres |
| Movie data | The Movie Database (TMDB) API |

## How it fits together

```
Browser (React)  ──/api/*──▶  Spring Boot API  ──▶  Supabase Auth     (check passwords, who is this token?)
                                     │         ──▶  Supabase Postgres (groups, movies, ratings, profiles)
                                     └─────────▶  TMDB API            (popular + search)
```

The frontend only draws pages and calls `/api/...`. All secrets, data rules and permission checks live in the backend.

## Security design

- **Login cookie, not localStorage.** The access token is stored in an `HttpOnly`, `SameSite=Strict` cookie (and `Secure` in production), so scripts on the page cannot read it.
- **CSRF protection.** Every request that changes data must carry an `X-XSRF-TOKEN` header matching a cookie (Spring Security's SPA mode). Login is the only exception.
- **Permission checks on every group route.** The backend confirms you belong to a group before showing or changing anything in it. Strangers get a plain "not found", so they cannot tell which groups exist. Movies are always looked up *inside* their group.
- **Only the creator can delete a group**, checked on the server.
- **Rate limits.** 10 attempts per minute per email on login, and 10 per minute per user on joining with an invite code.
- **Secrets stay out of git.** They live in `src/backend/.env` (ignored) and the host's environment settings. The database tables have row level security on, so Supabase's public web API cannot read them; only the backend can.
- **Input is validated** (lengths, score range, allowed statuses, username format), and errors are returned as `{"message": "..."}` with a proper status code.

## Project layout

```
src/
  backend/                Spring Boot API
    .../controllers/      HTTP routes
    .../services/         business rules (groups, movies, ratings, profiles, Supabase, TMDB)
    .../repository/       database access
    .../entity/           database tables as Java classes
    .../dto/              request and response shapes
    .../security/         login-cookie filter and rate limiter
    .../exception/        clean error responses
  frontend/               React app (pages, components, small helpers in lib/)
docs/schema.sql           the database tables
```

## Run it locally

You need **Java 21**, **Node 20.19+ or 22.12+**, a free **Supabase** project, and a free **TMDB** account.

**1. Database.** In Supabase, open the SQL Editor and run [`docs/schema.sql`](docs/schema.sql).

**2. Create a user.** In Supabase, go to Authentication → Users and add a user with an email and password. (There is no sign-up page yet; accounts are created by hand.)

**3. Backend settings.**

```bash
cd src/backend
cp .env.example .env      # then fill in the values; the file explains where to find each one
./mvnw spring-boot:run    # starts on http://localhost:8080
```

**4. Frontend.**

```bash
cd src/frontend
npm install
npm run dev               # opens http://localhost:5173
```

In development Vite forwards `/api` to the backend on port 8080, so the browser sees one site and the login cookie works.

> **Tip:** some networks (campus or work wifi) block the database port. If the backend cannot reach Supabase, a VPN such as Cloudflare WARP fixes it. Use Supabase's **Session pooler** address, which works over IPv4.

## API overview

| Route | What it does |
|---|---|
| `POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/logout` | Log in, who am I, log out |
| `GET /api/movies/popular` · `GET /api/movies/search?query=` | Movie data from TMDB |
| `GET` · `PUT /api/profile` | Read and change your display name and username |
| `GET` · `POST /api/groups` · `POST /api/groups/join` | Your groups, create one, join with a code |
| `GET /api/groups/saved` | Which movies are already on each of your lists |
| `DELETE /api/groups/{groupId}` | Delete a group (creator only) |
| `GET` · `POST /api/groups/{groupId}/movies` | The shared list, add a movie |
| `PATCH` · `DELETE /api/groups/{groupId}/movies/{movieId}` | Mark watched / want, remove |
| `PUT /api/groups/{groupId}/movies/{movieId}/rating` | Save your score and notes |

## Deploying

The frontend is a static build (`npm run build`) and works on hosts like Vercel. The backend is a standard Spring Boot jar. On the host, set the same variables as in `.env.example`, plus:

- `COOKIE_SECURE=true` (the site must use HTTPS)
- `PORT` is usually provided by the host

The login cookie is `SameSite=Strict`, so the frontend and backend must be reached on **one site**. The simplest way is to have the frontend host forward `/api/*` to the backend (a rewrite on Vercel), just like the Vite proxy does in development. Putting the backend in the same region as the database keeps requests fast.

## Credits

Movie data and images are provided by [TMDB](https://www.themoviedb.org). This product uses the TMDB API but is not endorsed or certified by TMDB.
