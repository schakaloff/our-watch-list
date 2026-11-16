import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import type { Profile } from "../types";

const inputClass =
  "w-full rounded border border-line bg-surface px-3 py-2 text-sm text-white placeholder:text-faint focus:border-white focus:outline-none";

interface Props {
  // Called after saving, so the name in the top bar updates right away.
  onSaved: (displayName: string) => void;
}

// Your profile: display name and username are editable, the email is shown only.
export default function Settings({ onSaved }: Props) {
  const { t } = useTranslation();
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
    return <p className="text-muted">{t("common.loading")}</p>;
  }

  if (!loggedIn) {
    return (
      <p className="text-muted">
        <Trans
          i18nKey="settings.pleaseSignIn"
          components={{ go: <Link to="/login" className="text-white hover:underline" /> }}
        />
      </p>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-lg border border-line bg-page p-6 shadow-lg">
      <h1 className="mb-1 text-2xl font-bold">{t("settings.title")}</h1>
      <p className="mb-6 text-sm text-muted">{t("settings.subtitle")}</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm text-muted">
            {t("settings.displayName")}
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
          <label htmlFor="username" className="mb-1 block text-sm text-muted">
            {t("settings.username")} <span className="text-faint">{t("settings.optional")}</span>
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("settings.usernamePlaceholder")}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-muted">
            {t("settings.email")}
          </label>
          <input
            id="email"
            value={email}
            readOnly
            className={`${inputClass} cursor-not-allowed text-muted`}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-white">{t("common.saved")}</p>}

        <button
          type="submit"
          className="w-full rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/85"
        >
          {t("settings.save")}
        </button>
      </form>
    </div>
  );
}
