import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import GroupMovieCard from "../components/GroupMovieCard";
import GroupMovieModal from "../components/GroupMovieModal";
import { apiFetch } from "../lib/api";
import { forget, getCached, setCached } from "../lib/cache";
import { deleteGroup } from "../lib/groupActions";
import type { Group, GroupMovie, MemberRating, Status } from "../types";

// The label is a translation key, looked up when the tabs are drawn.
const tabs: { key: Status; label: string }[] = [
  { key: "want", label: "list.tabWant" },
  { key: "watched", label: "list.tabWatched" },
];

// The shared list of one group, with a "Want to watch" tab and a "Watched" tab.
export default function GroupList() {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const navigate = useNavigate();

  // Start from what we saw last time, so the page does not wait for the backend.
  const cachedGroups = getCached<Group[]>("groups");
  const cachedMovies = getCached<GroupMovie[]>(`movies:${groupId}`);

  const [groups, setGroups] = useState<Group[]>(cachedGroups ?? []);
  const [movies, setMovies] = useState<GroupMovie[]>(cachedMovies ?? []);
  const [tab, setTab] = useState<Status>("want");
  const [state, setState] = useState<"loading" | "ready" | "loggedOut" | "notFound">(
    cachedGroups && cachedMovies ? "ready" : "loading",
  );
  const [error, setError] = useState<string | null>(null);
  // The movie whose popup is open, and your own user id (to tell which rating is yours).
  const [openMovieId, setOpenMovieId] = useState<number | null>(null);
  const [myId, setMyId] = useState<string | null>(getCached<string>("myId") ?? null);

  // Loads the user's groups (for the header) and this group's movies.
  const load = useCallback(async () => {
    // Ask for both at the same time, so the page waits for one round trip and not two.
    // Your own id is only asked for the first time, then remembered.
    const knownId = getCached<string>("myId");
    const [groupsRes, moviesRes, meRes] = await Promise.all([
      apiFetch("/api/groups"),
      apiFetch(`/api/groups/${groupId}/movies`),
      knownId ? null : apiFetch("/api/auth/me"),
    ]);
    if (groupsRes.status === 401) {
      setState("loggedOut");
      return;
    }
    if (!moviesRes.ok) {
      setState("notFound");
      return;
    }
    const groupList: Group[] = await groupsRes.json();
    const movieList: GroupMovie[] = await moviesRes.json();
    setCached("groups", groupList);
    setCached(`movies:${groupId}`, movieList);
    if (meRes && meRes.ok) {
      const me: { id: string } = await meRes.json();
      setCached("myId", me.id);
      setMyId(me.id);
    }
    setGroups(groupList);
    setMovies(movieList);
    setState("ready");
  }, [groupId]);

  // Runs when the page opens or you switch to another group.
  useEffect(() => {
    const knownGroups = getCached<Group[]>("groups");
    const knownMovies = getCached<GroupMovie[]>(`movies:${groupId}`);
    if (knownGroups && knownMovies) {
      // Show what we remember straight away; fresh data replaces it when it arrives.
      setGroups(knownGroups);
      setMovies(knownMovies);
      setState("ready");
    } else {
      setState("loading");
    }
    load();
  }, [load, groupId]);

  // Keeps the memory in step with changes made on this page.
  function updateMovies(next: GroupMovie[]) {
    setMovies(next);
    setCached(`movies:${groupId}`, next);
  }

  // Deletes this whole group after asking, then goes back to the list of groups.
  async function removeGroup(name: string) {
    if (!window.confirm(t("groups.deleteConfirm", { name }))) {
      return;
    }
    setError(null);
    const message = await deleteGroup(groupId ?? "");
    if (message) {
      setError(message);
      return;
    }
    navigate("/groups");
  }

  // Adds a just-saved rating to the movie, replacing your earlier one if there was one.
  function saveRating(movieId: number, rating: MemberRating) {
    updateMovies(
      movies.map((m) =>
        m.id === movieId ? { ...m, ratings: [...m.ratings.filter((r) => r.userId !== rating.userId), rating] } : m,
      ),
    );
  }

  // Moves a movie between "want" and "watched". The screen changes at once;
  // if the backend refuses, the real list is loaded again to undo it.
  async function changeStatus(movie: GroupMovie, status: Status) {
    setError(null);
    updateMovies(
      movies.map((m) =>
        m.id === movie.id ? { ...m, status, watchedAt: status === "watched" ? new Date().toISOString() : null } : m,
      ),
    );

    const res = await apiFetch(`/api/groups/${groupId}/movies/${movie.id}`, {
      method: "PATCH",
      body: { status },
    });
    if (!res.ok) {
      setError((await res.json()).message);
      await load();
    }
  }

  // Takes a movie off the list after asking for confirmation. It disappears at once;
  // if the backend refuses, the real list is loaded again to bring it back.
  async function remove(movie: GroupMovie) {
    if (!window.confirm(t("list.removeConfirm", { title: movie.title }))) {
      return;
    }
    setError(null);
    updateMovies(movies.filter((m) => m.id !== movie.id));
    // The home page remembers which movies are added; it must learn this one is gone.
    forget("home");

    const res = await apiFetch(`/api/groups/${groupId}/movies/${movie.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError((await res.json()).message);
      await load();
    }
  }

  if (state === "loading") {
    return <p className="text-slate-400">{t("common.loading")}</p>;
  }

  if (state === "loggedOut") {
    return (
      <p className="text-slate-400">
        <Trans
          i18nKey="list.pleaseSignIn"
          components={{ go: <Link to="/login" className="text-emerald-400 hover:underline" /> }}
        />
      </p>
    );
  }

  const group = groups.find((g) => g.id === groupId);

  if (state === "notFound" || !group) {
    return (
      <p className="text-slate-400">
        <Trans
          i18nKey="list.notFound"
          components={{ go: <Link to="/groups" className="text-emerald-400 hover:underline" /> }}
        />
      </p>
    );
  }

  const shown = movies.filter((m) => m.status === tab);
  const openMovie = movies.find((m) => m.id === openMovieId) ?? null;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{group.name}</h1>
          {group.owner && (
            <button
              onClick={() => removeGroup(group.name)}
              className="rounded border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-red-700 hover:text-red-400"
            >
              {t("groups.deleteGroup")}
            </button>
          )}
        </div>
        <p className="text-sm text-slate-400">
          {group.members.map((m) => m.displayName).join(" & ")}
          {group.members.length < 2 && (
            <span>
              {" "}
              · {t("list.waitingForPartner")}{" "}
              <span className="font-mono tracking-widest text-emerald-400">{group.inviteCode}</span>
            </span>
          )}
        </p>

        {/* If you are in several groups, switch between them here. */}
        {groups.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {groups.map((g) => (
              <Link
                key={g.id}
                to={`/groups/${g.id}`}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  g.id === groupId ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {g.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 flex gap-2">
        {tabs.map((tab_) => (
          <button
            key={tab_.key}
            onClick={() => setTab(tab_.key)}
            className={`rounded px-4 py-2 text-sm font-medium ${
              tab === tab_.key ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {t(tab_.label)} ({movies.filter((m) => m.status === tab_.key).length})
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded bg-red-900/40 p-3 text-sm text-red-300">{error}</p>}

      {shown.length === 0 ? (
        <p className="text-slate-400">
          <Trans
            i18nKey="list.empty"
            components={{ go: <Link to="/home" className="text-emerald-400 hover:underline" /> }}
          />
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {shown.map((m) => (
            <GroupMovieCard
              key={m.id}
              movie={m}
              members={group.members}
              onStatusChange={(status) => changeStatus(m, status)}
              onRemove={() => remove(m)}
              onOpen={() => setOpenMovieId(m.id)}
            />
          ))}
        </div>
      )}

      {openMovie && (
        <GroupMovieModal
          // Starts fresh if your id arrives after the popup opened, so your own rating is filled in.
          key={myId ?? "unknown"}
          movie={openMovie}
          members={group.members}
          myId={myId}
          groupId={group.id}
          onSaved={saveRating}
          onClose={() => setOpenMovieId(null)}
        />
      )}
    </div>
  );
}
