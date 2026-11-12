-- Database schema for OurWatchList. Run it once in the Supabase SQL Editor.
-- Users themselves live in Supabase Auth (auth.users); these tables hang off them.

-- A user's name shown to their partner. Created automatically the first time it is needed.
create table profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  username     text unique,                 -- optional; the user can set it in Settings
  display_name text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- A couple's shared list. People join with the invite code.
create table groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

-- Who belongs to which group (a couple's group has at most two members, enforced by the backend).
create table group_members (
  group_id  uuid not null references groups(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- The movies on a group's list, with the TMDB details saved at the time they were added.
create table group_movies (
  id           bigint generated always as identity primary key,
  group_id     uuid not null references groups(id) on delete cascade,
  tmdb_id      integer not null,
  title        text not null,
  poster_path  text,
  release_year integer,
  tmdb_rating  numeric(3,1),
  overview     text,
  status       text not null default 'want' check (status in ('want', 'watched')),
  added_by     uuid not null references auth.users(id),
  added_at     timestamptz not null default now(),
  watched_at   timestamptz,
  unique (group_id, tmdb_id)                -- the same movie cannot be added twice
);

-- Each person's own score and notes for a movie.
create table ratings (
  group_movie_id bigint not null references group_movies(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  score          integer not null check (score between 1 and 10),
  notes          text,
  updated_at     timestamptz not null default now(),
  primary key (group_movie_id, user_id)
);

-- Only our backend (which connects directly to the database) should read these tables.
-- With security turned on and no policies, Supabase's public web API sees nothing.
alter table profiles      enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;
alter table group_movies  enable row level security;
alter table ratings       enable row level security;
