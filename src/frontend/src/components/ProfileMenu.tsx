import { ChevronDown, CircleUser, LogOut, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useHoverMenu } from "../lib/useHoverMenu";

// Width of the open menu (Tailwind's min-w-44 is 11rem = 176px).
const MENU_WIDTH = 176;

interface Props {
  name: string;
  onSignOut: () => void;
}

// Your name in the top bar. A menu with Settings and Sign out opens when the mouse moves onto it,
// and also when you click or tap it (touch screens have no hover) or press Enter.
export default function ProfileMenu({ name, onSignOut }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const { open, close, wrapper, alignRight, hoverProps, onButtonClick } = useHoverMenu(MENU_WIDTH);

  // The button gets the same line under it as the top bar links when you are on the Settings page.
  const onSettings = location.pathname === "/settings";

  return (
    <div ref={wrapper} className="relative" {...hoverProps}>
      <button
        onClick={onButtonClick}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.profile")}
        className={`flex cursor-pointer items-center gap-2 border-b-2 px-2 py-1.5 text-sm font-medium transition-colors hover:text-white ${
          onSettings || open ? "border-white text-white" : "border-transparent text-muted"
        }`}
      >
        <CircleUser aria-hidden="true" className="size-5 shrink-0" />
        <span className="max-w-[9rem] truncate">{name}</span>
        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        // The top padding (not a margin) keeps the hover unbroken while the mouse crosses from the button to the menu.
        <div className={`absolute top-full z-20 pt-1 ${alignRight ? "right-0" : "left-0"}`}>
          <div role="menu" className="min-w-44 rounded-lg border border-line bg-surface p-1 shadow-lg">
            <Link
              to="/settings"
              role="menuitem"
              onClick={close}
              className="flex items-center gap-3 rounded px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-white"
            >
              <Settings aria-hidden="true" className="size-4" />
              {t("settings.title")}
            </Link>
            <button
              role="menuitem"
              onClick={() => {
                close();
                onSignOut();
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-white"
            >
              <LogOut aria-hidden="true" className="size-4" />
              {t("nav.signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
