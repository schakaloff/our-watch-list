import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { getCached, setCached } from "../lib/cache";
import { deleteGroup } from "../lib/groupActions";
import type { Group } from "../types";

const inputClass =
  "w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none";
const buttonClass =
  "w-full rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500";

// Lists your groups and lets you create one or join your partner's with a code.
export default function Groups() {
  const { t } = useTranslation();
  // Start from the groups we saw last time, so the page does not wait for the backend.
  const cached = getCached<Group[]>("groups");
  const [groups, setGroups] = useState<Group[]>(cached ?? []);
  const [loading, setLoading] = useState(cached === undefined);
  const [loggedIn, setLoggedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // Asks the backend for the groups of the logged-in user.
  async function loadGroups() {
    const res = await apiFetch("/api/groups");
    if (res.status === 401) {
      setLoggedIn(false);
    } else if (res.ok) {
      const list: Group[] = await res.json();
      setCached("groups", list);
      setGroups(list);
    }
  }

  useEffect(() => {
    loadGroups().finally(() => setLoading(false));
  }, []);

  // Sends a create or join request. On success the form is cleared and the list reloads.
  async function send(path: string, body: unknown, reset: () => void) {
    setError(null);
    const res = await apiFetch(path, { method: "POST", body });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      return;
    }
    reset();
    await loadGroups();
  }

  // Deletes a group you created, after asking. Then the list of groups is loaded again.
  async function onDelete(group: Group) {
    if (!window.confirm(t("groups.deleteConfirm", { name: group.name }))) {
      return;
    }
    setError(null);
    const message = await deleteGroup(group.id);
    if (message) {
      setError(message);
      return;
    }
    await loadGroups();
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    send("/api/groups", { name: createName }, () => {
      setCreateName("");
    });
  }

  function onJoin(e: FormEvent) {
    e.preventDefault();
    send("/api/groups/join", { code: joinCode }, () => {
      setJoinCode("");
    });
  }

  if (loading) {
    return <p className="text-slate-400">{t("common.loading")}</p>;
  }

  if (!loggedIn) {
    return (
      <p className="text-slate-400">
        <Trans
          i18nKey="groups.pleaseSignIn"
          components={{ go: <Link to="/login" className="text-emerald-400 hover:underline" /> }}
        />
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("groups.title")}</h1>

      {error && <p className="mb-4 rounded bg-red-900/40 p-3 text-sm text-red-300">{error}</p>}

      {groups.length === 0 ? (
        <p className="mb-8 text-slate-400">
          {t("groups.none")}
        </p>
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.id} className="rounded-lg border border-slate-800 bg-slate-800/50 p-4">
              <h2 className="mb-1 text-lg font-semibold">{g.name}</h2>
              <p className="mb-3 text-sm text-slate-400">
                {g.members.map((m) => m.displayName).join(" & ")} · {g.members.length}/2
              </p>
              <p className="text-sm text-slate-300">
                {t("groups.inviteCode")}{" "}
                <span className="rounded bg-slate-900 px-2 py-1 font-mono tracking-widest text-emerald-400">
                  {g.inviteCode}
                </span>
              </p>
              {g.members.length < 2 && (
                <p className="mt-2 text-xs text-slate-500">{t("groups.waiting")}</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <Link to={`/groups/${g.id}`} className="text-sm font-medium text-emerald-400 hover:underline">
                  {t("groups.openList")}
                </Link>
                {g.owner && (
                  <button
                    onClick={() => onDelete(g)}
                    className="text-sm text-slate-500 hover:text-red-400"
                  >
                    {t("groups.delete")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={onCreate} className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">{t("groups.createTitle")}</h2>
          <input
            required
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder={t("groups.createPlaceholder")}
            className={inputClass}
          />
          <button className={buttonClass}>{t("groups.create")}</button>
        </form>

        <form onSubmit={onJoin} className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">{t("groups.joinTitle")}</h2>
          <input
            required
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder={t("groups.joinPlaceholder")}
            className={`${inputClass} font-mono uppercase tracking-widest`}
          />
          <button className={buttonClass}>{t("groups.join")}</button>
        </form>
      </div>
    </div>
  );
}
