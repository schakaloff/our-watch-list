import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

// How long a menu stays open after the mouse leaves, so a small slip does not close it.
const CLOSE_DELAY_MS = 200;

// The behavior shared by the top bar menus (language and profile):
// - a mouse opens the menu by hovering, and a tap or the keyboard opens it by clicking,
// - it closes on Escape, on a click elsewhere, or shortly after the mouse leaves,
// - it lines up with the right edge of its button, or the left edge if there is no room, so it never leaves the screen.
// menuWidth is the width of the open menu in pixels, used to decide the side.
export function useHoverMenu(menuWidth: number) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(true);
  const wrapper = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  // Works out which side to open on, then opens the menu.
  function show() {
    window.clearTimeout(closeTimer.current);
    if (!open && wrapper.current) {
      const box = wrapper.current.getBoundingClientRect();
      setAlignRight(box.right - menuWidth >= 8);
    }
    setOpen(true);
  }

  function hideSoon() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

  // Put these on the element that wraps both the button and the menu.
  // Only a real mouse hovers. A finger's tap is handled by the click instead,
  // otherwise the tap would open the menu and the click would immediately close it again.
  const hoverProps = {
    onPointerEnter: (e: ReactPointerEvent) => {
      if (e.pointerType === "mouse") show();
    },
    onPointerLeave: (e: ReactPointerEvent) => {
      if (e.pointerType === "mouse") hideSoon();
    },
  };

  // Put this on the button. With a mouse the menu is already open from hovering, so a click keeps it open
  // (closing it would feel like a glitch). With a finger or the keyboard, a click opens and closes it.
  function onButtonClick(e: ReactMouseEvent) {
    const pointerType = (e.nativeEvent as PointerEvent).pointerType;
    if (pointerType === "mouse") {
      show();
    } else if (open) {
      setOpen(false);
    } else {
      show();
    }
  }

  // While the menu is open, a click anywhere else or the Escape key closes it.
  useEffect(() => {
    if (!open) return;

    function onClick(e: MouseEvent) {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
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

  // Stops a pending close from running after the component has gone.
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return { open, close: () => setOpen(false), wrapper, alignRight, hoverProps, onButtonClick };
}
