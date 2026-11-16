import { ChevronDown } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useHoverMenu } from "../lib/useHoverMenu";
import GB from "country-flag-icons/react/3x2/GB";
import RU from "country-flag-icons/react/3x2/RU";

// Each language is written in its own name, so people can find theirs even on a page they cannot read.
// The flags come from the country-flag-icons library (SVG, so they look the same on every device).
const flagClass = "h-4 w-6 shrink-0 rounded-sm ring-1 ring-white/20";
// Width of the open menu: one flag button plus padding.
const MENU_WIDTH = 64;

const languages: { code: string; label: string; flag: ReactElement }[] = [
  { code: "en", label: "English", flag: <GB className={flagClass} aria-hidden="true" /> },
  { code: "ru", label: "Русский", flag: <RU className={flagClass} aria-hidden="true" /> },
];

// A dropdown in the top bar: just the current flag, and a menu of flags to pick another language.
// It opens when the mouse moves onto it, or when you click, tap or press Enter.
// The names (English, Русский) are not shown, but are read out by screen readers and appear when the mouse rests on a flag.
// The choice is remembered by the browser.
export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { open, close, wrapper, alignRight, hoverProps, onButtonClick } = useHoverMenu(MENU_WIDTH);

  const current = languages.find((l) => l.code === i18n.resolvedLanguage) ?? languages[0];

  function choose(code: string) {
    i18n.changeLanguage(code);
    close();
  }

  return (
    <div ref={wrapper} className="relative" {...hoverProps}>
      <button
        onClick={onButtonClick}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("nav.language")}: ${current.label}`}
        title={current.label}
        className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-muted transition-colors hover:bg-surface-2"
      >
        {current.flag}
        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        // The top padding (not a margin) keeps the hover unbroken while the mouse crosses from the button to the menu.
        <div className={`absolute top-full z-20 pt-1 ${alignRight ? "right-0" : "left-0"}`}>
          <ul role="menu" className="rounded-lg border border-line bg-surface p-1 shadow-lg">
            {languages.map((l) => (
              <li key={l.code} role="none">
                <button
                  role="menuitemradio"
                  aria-checked={l.code === current.code}
                  aria-label={l.label}
                  title={l.label}
                  onClick={() => choose(l.code)}
                  className={`flex cursor-pointer items-center justify-center rounded px-3 py-2 transition-colors hover:bg-surface-2 ${
                    l.code === current.code ? "bg-surface-2 ring-1 ring-white/60" : ""
                  }`}
                >
                  {l.flag}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
