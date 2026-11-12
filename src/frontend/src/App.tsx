import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Browse from "./pages/Browse";
import MyList from "./pages/MyList";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${
    isActive ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-700"
  }`;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  // Asks the backend who is logged in. Runs on load and whenever the page changes (for example after login).
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => setEmail(user ? user.email : null))
      .catch(() => setEmail(null));
  }, [location.pathname]);

  // Tells the backend to delete the login cookie, then goes to the login page.
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmail(null);
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <span className="mr-auto text-lg font-bold">🎬 OurWatchList</span>
          <NavLink to="/home" className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/list" className={linkClass}>
            My List
          </NavLink>
          {email ? (
            <>
              <span className="text-sm text-slate-300">{email}</span>
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
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Browse />} />
          <Route path="/list" element={<MyList />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}
