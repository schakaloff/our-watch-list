import { NavLink, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Browse from "./pages/Browse";
import MyList from "./pages/MyList";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${
    isActive ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-700"
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <span className="mr-auto text-lg font-bold">🎬 OurWatchList</span>
          <NavLink to="/" end className={linkClass}>
            Browse
          </NavLink>
          <NavLink to="/list" className={linkClass}>
            My List
          </NavLink>
          <NavLink to="/login" className={linkClass}>
            Sign in
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/list" element={<MyList />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}
