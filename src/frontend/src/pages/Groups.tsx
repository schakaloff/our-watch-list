import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import type { Group } from "../types";

const inputClass =
  "w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none";
const buttonClass =
  "w-full rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500";

// Lists your groups and lets you create one or join your partner's with a code.
export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
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
      setGroups(await res.json());
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
    return <p className="text-slate-400">Loading…</p>;
  }

  if (!loggedIn) {
    return (
      <p className="text-slate-400">
        Please{" "}
        <Link to="/login" className="text-emerald-400 hover:underline">
          sign in
        </Link>{" "}
        to see your groups.
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Your groups</h1>

      {error && <p className="mb-4 rounded bg-red-900/40 p-3 text-sm text-red-300">{error}</p>}

      {groups.length === 0 ? (
        <p className="mb-8 text-slate-400">
          You are not in a group yet. Create one, or join your partner's with their code.
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
                Invite code:{" "}
                <span className="rounded bg-slate-900 px-2 py-1 font-mono tracking-widest text-emerald-400">
                  {g.inviteCode}
                </span>
              </p>
              {g.members.length < 2 && (
                <p className="mt-2 text-xs text-slate-500">Waiting for your partner. Share this code with them.</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={onCreate} className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Create a group</h2>
          <input
            required
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Group name, e.g. Movie nights"
            className={inputClass}
          />
          <button className={buttonClass}>Create</button>
        </form>

        <form onSubmit={onJoin} className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Join with a code</h2>
          <input
            required
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Invite code"
            className={`${inputClass} font-mono uppercase tracking-widest`}
          />
          <button className={buttonClass}>Join</button>
        </form>
      </div>
    </div>
  );
}
