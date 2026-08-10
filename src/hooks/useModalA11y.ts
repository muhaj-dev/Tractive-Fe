"use client";

import { useEffect, RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Makes a modal usable by keyboard and screen reader.
 *
 * Without this, a dialog renders on top of the page but the page keeps focus: the user is
 * left outside the thing they just opened and has to Tab across everything it covers to
 * reach it. Measured on the Add-to-store modal on 09 Aug 2026 — **57 tab stops** before
 * focus entered the dialog, and the page behind kept scrolling.
 *
 * On open it moves focus into the dialog, traps Tab inside it (wrapping both ways), and
 * locks body scroll. On close it restores scroll and returns focus to whatever opened the
 * dialog.
 *
 * The element still needs `role="dialog"` + `aria-modal="true"` + an accessible name; this
 * hook handles behaviour, not semantics.
 *
 * @param isOpen   whether the dialog is currently rendered
 * @param ref      the dialog panel (the thing Tab must stay inside)
 * @param options  `initialFocusRef` to focus something other than the first focusable;
 *                 `onEscape` to close on Escape (skip if the component already handles it)
 */
export function useModalA11y(
  isOpen: boolean,
  ref: RefObject<HTMLElement | null>,
  options?: {
    initialFocusRef?: RefObject<HTMLElement | null>;
    onEscape?: () => void;
  },
) {
  const initialFocusRef = options?.initialFocusRef;
  const onEscape = options?.onEscape;

  // Move focus in, lock scroll, and put focus back where it came from on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current ??
        ref.current?.querySelector<HTMLElement>(FOCUSABLE) ??
        ref.current;
      target?.focus?.();
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Trap Tab inside the panel, and optionally close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onEscape) {
        onEscape();
        return;
      }
      if (event.key !== "Tab") return;
      const root = ref.current;
      if (!root) return;
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) =>
          el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!root.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onEscape]);
}
