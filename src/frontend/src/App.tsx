import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "./components/LanguageSwitcher";
import ProfileMenu from "./components/ProfileMenu";
import Login from "./pages/Login";
import Groups from "./pages/Groups";
import GroupList from "./pages/GroupList";
import Settings from "./pages/Settings";
import { apiFetch } from "./lib/api";
import { clearCache } from "./lib/cache";
import Browse from "./pages/Browse";
import MyList from "./pages/MyList";

// The top bar links: the page you are on is white with a line under it, the others are grey.
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap border-b-2 px-2 py-1.5 text-sm font-medium transition-colors ${
    isActive ? "border-white text-white" : "border-transparent text-muted hover:text-white"
  }`;

export default function App() {
  const { t } = useTranslation();
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
    <div className="flex min-h-screen flex-col bg-page text-white">
      <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3 sm:gap-4">
          {/* The logo: two overlapping screens and the name. It is a picture, so it keeps its exact shape. */}
          <Link to="/home" className="mr-auto flex items-center" aria-label="OurWatchList">
            <img src="/logo.svg" alt="OurWatchList" className="h-6 w-auto sm:h-8" />
          </Link>
          <NavLink to="/home" className={linkClass}>
            {t("nav.home")}
          </NavLink>
          {/* Stays highlighted while you are inside one of your groups (/groups/...). */}
          <NavLink
            to="/list"
            className={({ isActive }) => linkClass({ isActive: isActive || location.pathname.startsWith("/groups/") })}
          >
            {t("nav.groupList")}
          </NavLink>
          {name && (
            <NavLink to="/groups" end className={linkClass}>
              {t("nav.groups")}
            </NavLink>
          )}
          <LanguageSwitcher />
          {name ? (
            <ProfileMenu name={name} onSignOut={signOut} />
          ) : (
            <NavLink to="/login" className={linkClass}>
              {t("nav.signIn")}
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
      <footer className="border-t border-line px-4 py-5 text-center text-xs text-faint">
        <Trans
          i18nKey="footer.credit"
          components={{
            tmdb: (
              <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="underline hover:text-white" />
            ),
          }}
        />
      </footer>
    </div>
  );
}
