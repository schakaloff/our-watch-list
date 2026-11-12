import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Groups from "./pages/Groups";
import GroupList from "./pages/GroupList";
import Settings from "./pages/Settings";
import { apiFetch } from "./lib/api";
import { clearCache } from "./lib/cache";
import Browse from "./pages/Browse";
import MyList from "./pages/MyList";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${
    isActive ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-700"
  }`;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState<string | null>(null);

  // Asks the backend who is logged in and what their display name is.
  // Runs on load and whenever the page changes (for example after login).
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => setName(profile ? profile.displayName : null))
      .catch(() => setName(null));
  }, [location.pathname]);

  // Tells the backend to delete the login cookie, then goes to the login page.
  async function signOut() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    clearCache();
    setName(null);
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <span className="mr-auto text-lg font-bold">🎬 OurWatchList</span>
          <NavLink to="/home" className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/list" className={linkClass}>
            Group List
          </NavLink>
          {name && (
            <NavLink to="/groups" end className={linkClass}>
              Groups
            </NavLink>
          )}
          {name ? (
            <>
              <NavLink to="/settings" className={linkClass}>
                {name}
              </NavLink>
              <button
                onClick={signOut}
                className="rounded px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Sign in
            </NavLink>
          )}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Browse />} />
          <Route path="/list" element={<MyList />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId" element={<GroupList />} />
          <Route path="/settings" element={<Settings onSaved={setName} />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      {/* TMDB's terms require this credit wherever their data is used. */}
      <footer className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
        This product uses the{" "}
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">
          TMDB
        </a>{" "}
        API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  );
}
