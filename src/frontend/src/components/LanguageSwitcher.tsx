import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import GB from "country-flag-icons/react/3x2/GB";
import RU from "country-flag-icons/react/3x2/RU";

// Each language is written in its own name, so people can find theirs even on a page they cannot read.
// The flags come from the country-flag-icons library (SVG, so they look the same on every device).
const flagClass = "h-4 w-6 shrink-0 rounded-sm ring-1 ring-white/20";
// Width of the open menu (Tailwind's min-w-40 is 10rem = 160px).
const MENU_WIDTH = 160;

const languages: { code: string; label: string; flag: ReactElement }[] = [
  { code: "en", label: "English", flag: <GB className={flagClass} aria-hidden="true" /> },
  { code: "ru", label: "Русский", flag: <RU className={flagClass} aria-hidden="true" /> },
];

// A dropdown in the top bar: the current flag and language name, and a menu to pick another.
// The choice is remembered by the browser.
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  // Which side of the button the menu lines up with, so it never hangs off the screen.
  const [alignRight, setAlignRight] = useState(true);
  const wrapper = useRef<HTMLDivElement>(null);

  const current = languages.find((l) => l.code === i18n.resolvedLanguage) ?? languages[0];

  // While the menu is open, a click anywhere else or the Escape key closes it.
  useEffect(() => {
    if (!open) return;

    function onClick(e: MouseEvent) {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Opens or closes the menu. On opening, it lines up with the button's right edge if there is
  // room to its left, and with the left edge otherwise (the top bar wraps on small screens).
  function toggle() {
    if (!open && wrapper.current) {
      const box = wrapper.current.getBoundingClientRect();
      setAlignRight(box.right - MENU_WIDTH >= 8);
    }
    setOpen(!open);
  }

  function choose(code: string) {
    i18n.changeLanguage(code);
    setOpen(false);
  }

  return (
    <div ref={wrapper} className="relative">
      <button
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.language")}
        className="flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700"
      >
        {current.flag}
        <span className="hidden sm:inline">{current.label}</span>
        <span aria-hidden="true" className="text-xs text-slate-500">
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="menu"
          className={`absolute z-20 mt-1 min-w-40 rounded-lg ${alignRight ? "right-0" : "left-0"} border border-slate-700 bg-slate-800 p-1 shadow-lg`}
        >
          {languages.map((l) => (
            <li key={l.code} role="none">
              <button
                role="menuitemradio"
                aria-checked={l.code === current.code}
                onClick={() => choose(l.code)}
                className={`flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-slate-700 ${
                  l.code === current.code ? "text-white" : "text-slate-300"
                }`}
              >
                {l.flag}
                <span className="flex-1">{l.label}</span>
                {l.code === current.code && <span className="text-emerald-400">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
