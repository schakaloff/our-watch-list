import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import type { Profile } from "../types";

const inputClass =
  "w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none";

interface Props {
  // Called after saving, so the name in the top bar updates right away.
  onSaved: (displayName: string) => void;
}

// Your profile: display name and username are editable, the email is shown only.
export default function Settings({ onSaved }: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Loads the profile from the backend when the page opens.
  useEffect(() => {
    apiFetch("/api/profile")
      .then(async (res) => {
        if (res.status === 401) {
          setLoggedIn(false);
        } else if (res.ok) {
          const profile: Profile = await res.json();
          setEmail(profile.email);
          setDisplayName(profile.displayName);
          setUsername(profile.username ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Sends the new name and username to the backend and shows what came back.
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const res = await apiFetch("/api/profile", { method: "PUT", body: { displayName, username } });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      return;
    }

    const profile: Profile = data;
    setDisplayName(profile.displayName);
    setUsername(profile.username ?? "");
    setSaved(true);
    onSaved(profile.displayName);
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
        to see your settings.
      </p>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <h1 className="mb-1 text-2xl font-bold">Settings</h1>
      <p className="mb-6 text-sm text-slate-400">This is how your partner sees you.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm text-slate-300">
            Display name
          </label>
          <input
            id="displayName"
            required
            maxLength={30}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="username" className="mb-1 block text-sm text-slate-300">
            Username <span className="text-slate-500">(optional)</span>
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="3-20 letters, digits or _"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-slate-300">
            Email
          </label>
          <input
            id="email"
            value={email}
            readOnly
            className={`${inputClass} cursor-not-allowed text-slate-400`}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-emerald-400">Saved.</p>}

        <button
          type="submit"
          className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Save
        </button>
      </form>
    </div>
  );
}
