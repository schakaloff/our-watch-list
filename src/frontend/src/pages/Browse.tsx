import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Flame, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import GroupPicker from "../components/GroupPicker";
import MovieCard from "../components/MovieCard";
import MovieDetailModal from "../components/MovieDetailModal";
import { apiFetch } from "../lib/api";
import { forgetPrefix, setCached } from "../lib/cache";
import { getHomeData, setHomeData } from "../lib/homeCache";
import { currentLanguage, moviesKeyPrefix } from "../lib/language";
import { IMAGE_URL, IMAGE_URL_LARGE } from "../lib/tmdb";
import type { Group, SavedMovie } from "../types";

// One movie as the backend sends it. The field names come from TMDB.
interface ApiMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
}

// A message shown above the movies, such as "Added to Movie nights" or an error.
interface Notice {
  ok: boolean;
  text: string;
  linkTo?: string;
  linkLabel?: string;
}

// Turns a movie from the backend into the shape our cards and popup use.
function toMovie(m: ApiMovie): SavedMovie {
  return {
    id: m.id,
    title: m.title,
    poster: m.poster_path ? IMAGE_URL + m.poster_path : null,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    tmdbRating: m.vote_average,
    overview: m.overview,
    status: "want",
    addedAt: "",
  };
}

// Asks the backend for a list of movies (popular or search results). The request says which language the site is in,
// so the titles and descriptions come back in it.
async function loadMovies(path: string): Promise<SavedMovie[]> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error("Could not load movies");
  const data: ApiMovie[] = await res.json();
  return data.map(toMovie);
}

export default function Browse() {
  const { t } = useTranslation();
  const language = currentLanguage();
  // If the home page was open earlier (in this language), start from what it knew then, so nothing flashes or waits.
  const cached = getHomeData(language) ?? null;

  const [movies, setMovies] = useState<SavedMovie[]>(cached?.popular ?? []);
  // The popular movies only (not search results), which are what we remember for the next visit.
  const popular = useRef<SavedMovie[]>(cached?.popular ?? []);
  // The language the movies on screen are really in. It changes only once the movies of the new language have been asked for,
  // so what we remember is always filed under the language it came from.
  const shownLanguage = useRef(language);
  const [query, setQuery] = useState("");
  // What the movies on screen were searched for (empty means they are the popular ones).
  const [searchedFor, setSearchedFor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SavedMovie | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [picker, setPicker] = useState<{ movie: SavedMovie; groups: Group[] } | null>(null);
  // Your groups, and for each movie (by TMDB id) the ids of the groups it is already on.
  const [groups, setGroups] = useState<Group[]>(cached?.groups ?? []);
  const [savedIn, setSavedIn] = useState<Record<number, string[]>>(cached?.savedIn ?? {});
  const [loggedIn, setLoggedIn] = useState(cached?.loggedIn ?? true);
  // False until we know what is already added, so the buttons never show the wrong state.
  const [savedLoaded, setSavedLoaded] = useState(cached !== null);

  // Finds your groups and what is already on their lists, in two requests that run together.
  const loadSaved = useCallback(async () => {
    const [groupsRes, savedRes] = await Promise.all([apiFetch("/api/groups"), apiFetch("/api/groups/saved")]);

    if (!groupsRes.ok || !savedRes.ok) {
      setGroups([]);
      setSavedIn({});
      setLoggedIn(groupsRes.status !== 401);
      setSavedLoaded(true);
      return;
    }

    // The backend sends { groupId: [tmdbId, ...] }. We flip it to { tmdbId: [groupId, ...] }.
    const saved: Record<string, number[]> = await savedRes.json();
    const map: Record<number, string[]> = {};
    for (const [groupId, tmdbIds] of Object.entries(saved)) {
      for (const tmdbId of tmdbIds) {
        map[tmdbId] = [...(map[tmdbId] ?? []), groupId];
      }
    }
    const groupList: Group[] = await groupsRes.json();
    setCached("groups", groupList);
    setGroups(groupList);
    setSavedIn(map);
    setLoggedIn(true);
    setSavedLoaded(true);
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  // Remember what we know, so the next visit to this page starts with it.
  useEffect(() => {
    if (savedLoaded) {
      setHomeData(shownLanguage.current, { popular: popular.current, groups, savedIn, loggedIn });
    }
  }, [movies, groups, savedIn, loggedIn, savedLoaded]);

  // A movie counts as added when it is on the list of every group you are in.
  function isAdded(movieId: number): boolean {
    return groups.length > 0 && groups.every((g) => savedIn[movieId]?.includes(g.id));
  }

  // Marks a movie as added to (or removed from) a group on screen, without waiting for the backend.
  function markAdded(groupId: string, movieId: number, added: boolean) {
    setSavedIn((current) => {
      const others = (current[movieId] ?? []).filter((id) => id !== groupId);
      return { ...current, [movieId]: added ? [...others, groupId] : others };
    });
  }

  // When the page opens, show the popular movies (unless we already have them).
  useEffect(() => {
    if (cached) return;
    loadMovies("/api/movies/popular")
      .then((list) => {
        popular.current = list;
        setMovies(list);
      })
      .catch(() => setError(t("home.loadError")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When you switch language, load the movies again in the new language (TMDB sends titles and descriptions
  // in the language we ask for). A search is repeated with the same words. Popular movies that were
  // already loaded in that language are shown straight away.
  useEffect(() => {
    if (shownLanguage.current === language) return;
    shownLanguage.current = language;

    setError(null);
    const known = getHomeData(language);
    if (!searchedFor && known && known.popular.length > 0) {
      popular.current = known.popular;
      setMovies(known.popular);
      return;
    }

    const path = searchedFor ? `/api/movies/search?query=${encodeURIComponent(searchedFor)}` : "/api/movies/popular";
    loadMovies(path)
      .then((list) => {
        if (!searchedFor) popular.current = list;
        setMovies(list);
      })
      .catch(() => setError(t("home.loadError")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Search for what the user typed. An empty search shows the popular movies again.
  async function onSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const text = query.trim();
    const path = text
      ? `/api/movies/search?query=${encodeURIComponent(text)}`
      : "/api/movies/popular";

    try {
      const list = await loadMovies(path);
      if (!text) popular.current = list;
      setMovies(list);
      setSearchedFor(text);
    } catch {
      setError(t("home.searchError"));
    }
  }

  // Called by "+ Add". Uses what the page already knows, and asks only when there is a choice.
  function onAdd(movie: SavedMovie) {
    setNotice(null);

    if (!loggedIn) {
      setNotice({ ok: false, text: t("home.signInToAdd"), linkTo: "/login", linkLabel: t("nav.signIn") });
      return;
    }
    if (groups.length === 0) {
      setNotice({ ok: false, text: t("home.createGroupFirst"), linkTo: "/groups", linkLabel: t("home.goToGroups") });
      return;
    }

    // Only offer the groups that do not have this movie yet.
    const available = groups.filter((g) => !savedIn[movie.id]?.includes(g.id));
    if (available.length === 1) {
      addTo(available[0], movie);
    } else if (available.length > 1) {
      setPicker({ movie, groups: available });
    }
  }

  // Adds the movie to the group. The button changes at once; if the backend refuses, it changes back.
  async function addTo(group: Group, movie: SavedMovie) {
    setPicker(null);
    markAdded(group.id, movie.id, true);
    // That group's list is about to change, so any remembered copy of it is out of date.
    forgetPrefix(moviesKeyPrefix(group.id));

    try {
      const res = await apiFetch(`/api/groups/${group.id}/movies`, {
        method: "POST",
        body: {
          tmdbId: movie.id,
          title: movie.title,
          // The card holds the full image address, but the backend stores only the end of it.
          posterPath: movie.poster ? movie.poster.slice(IMAGE_URL.length) : null,
          releaseYear: movie.year,
          tmdbRating: movie.tmdbRating,
          overview: movie.overview,
        },
      });

      if (res.ok) {
        setNotice({
          ok: true,
          text: t("home.addedTo", { movie: movie.title, group: group.name }),
          linkTo: `/groups/${group.id}`,
          linkLabel: t("home.viewList"),
        });
        return;
      }

      // 409 means it was already on the list, so "added" is right. Any other error undoes the change.
      if (res.status !== 409) {
        markAdded(group.id, movie.id, false);
      }
      setNotice({ ok: false, text: (await res.json()).message });
    } catch {
      markAdded(group.id, movie.id, false);
      setNotice({ ok: false, text: t("common.serverUnreachable") });
    }
  }

  // The two posters shown in the collage next to the search box. Always the popular movies, even during a search.
  const heroPosters = popular.current.filter((m) => m.poster).slice(0, 2);

  return (
    <div>
      {/* The top of the page: a big heading, the search box, and a collage of two posters. */}
      <section className="relative isolate mb-14">
        <div
          aria-hidden="true"
          className="absolute -left-40 -top-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(80,74,121,0.35),transparent_70%)]"
        />
        <div className="grid items-center gap-10 py-8 lg:grid-cols-2 lg:py-14">
          <div>
            <p className="font-display text-3xl font-semibold uppercase leading-none sm:text-5xl lg:text-6xl">{t("home.heroLine1")}</p>
            <h1 className="mt-1 font-display text-4xl font-bold uppercase leading-[1] sm:text-5xl lg:text-6xl">
              {t("home.heroLine2")}
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted">{t("home.heroText")}</p>

            <form onSubmit={onSearch} role="search" className="mt-8 flex max-w-lg gap-2">
              <div className="relative min-w-0 flex-1">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("home.searchPlaceholder")}
                  aria-label={t("home.search")}
                  className="w-full rounded-sm border border-line bg-surface py-2.5 pl-9 pr-3 text-white placeholder:text-faint focus:border-white focus:outline-none"
                />
              </div>
              <button className="cursor-pointer rounded-sm bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/85">
                {t("home.search")}
              </button>
            </form>
          </div>

          {/* Decorative: hidden on phones and tablets, where there is no room for it. */}
          <div aria-hidden="true" className="relative hidden h-[440px] lg:block">
            <div className="absolute bottom-0 left-16 right-0 top-10 border-l border-t border-line-strong/60" />
            {heroPosters[1]?.poster && (
              <img
                src={heroPosters[1].poster.replace(IMAGE_URL, IMAGE_URL_LARGE)}
                alt=""
                className="absolute right-4 top-0 h-[360px] w-auto rounded-sm shadow-2xl ring-1 ring-white/10"
              />
            )}
            {heroPosters[0]?.poster && (
              <img
                src={heroPosters[0].poster.replace(IMAGE_URL, IMAGE_URL_LARGE)}
                alt=""
                className="absolute bottom-0 left-28 h-[390px] w-auto rounded-sm shadow-2xl ring-1 ring-white/10"
              />
            )}
          </div>
        </div>
      </section>

      {error && <p className="mb-4 rounded-sm bg-amber-900/40 p-4 text-amber-200">{error}</p>}

      {notice && (
        <p
          className={`mb-6 rounded-sm p-3 text-sm ${notice.ok ? "bg-white/10 text-white" : "bg-red-900/40 text-red-300"}`}
        >
          {notice.text}{" "}
          {notice.linkTo && (
            <Link to={notice.linkTo} className="font-medium underline">
              {notice.linkLabel}
            </Link>
          )}
        </p>
      )}

      {/* The section title: an icon, the name, and a thin line across the page. */}
      <div className="mb-6 flex items-center gap-3">
        {searchedFor ? <Search aria-hidden="true" className="size-6" /> : <Flame aria-hidden="true" className="size-6" />}
        <h2 className="font-display text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
          {searchedFor ? t("home.resultsFor", { query: searchedFor }) : t("home.popular")}
        </h2>
        <div aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>

      {searchedFor && movies.length === 0 && <p className="text-muted">{t("home.noResults")}</p>}

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {movies.map((m) => (
          <MovieCard
            key={m.id}
            title={m.title}
            year={m.year}
            poster={m.poster}
            rating={m.tmdbRating}
            actionLabel={isAdded(m.id) ? t("home.added") : t("home.add")}
            actionDisabled={!savedLoaded || isAdded(m.id)}
            onAction={() => onAdd(m)}
            onOpen={() => setSelected(m)}
          />
        ))}
      </div>

      {picker && (
        <GroupPicker
          movieTitle={picker.movie.title}
          groups={picker.groups}
          onPick={(group) => addTo(group, picker.movie)}
          onClose={() => setPicker(null)}
        />
      )}

      {selected && <MovieDetailModal movie={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
