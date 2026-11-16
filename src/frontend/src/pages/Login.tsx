import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { clearCache } from "../lib/cache";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sends the email and password to the backend. The browser keeps the login cookie itself.
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      clearCache();
      navigate("/home");
    } else {
      const data = await res.json();
      setError(data.message);
    }
  }

  const inputClass =
    "w-full rounded border border-line bg-surface px-3 py-2 text-sm text-white placeholder:text-faint focus:border-white focus:outline-none";

  return (
    <div className="mx-auto mt-10 max-w-sm rounded-lg border border-line bg-page p-6 shadow-lg">
      <h1 className="mb-1 text-2xl font-bold">{t("login.title")}</h1>
      <p className="mb-6 text-sm text-muted">{t("login.subtitle")}</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-muted">
            {t("login.email")}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-muted">
            {t("login.password")}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          className="w-full rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/85"
        >
          {t("login.submit")}
        </button>
      </form>
    </div>
  );
}
