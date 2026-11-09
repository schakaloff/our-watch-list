import { useState } from "react";
import type { FormEvent } from "react";

type Mode = "signin" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // No login logic yet: this is only the page.
  }

  const inputClass =
    "w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none";

  return (
    <div className="mx-auto mt-10 max-w-sm rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <h1 className="mb-1 text-2xl font-bold">
        {mode === "signin" ? "Welcome back" : "Create account"}
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        {mode === "signin"
          ? "Sign in to your watch list."
          : "Sign up to start your watch list."}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-slate-300">
            Email
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
          <label htmlFor="password" className="mb-1 block text-sm text-slate-300">
            Password
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

        <button
          type="submit"
          className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-400">
        {mode === "signin" ? "No account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="font-medium text-emerald-400 hover:underline"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
