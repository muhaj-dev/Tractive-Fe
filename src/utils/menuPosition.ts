import type { CSSProperties } from "react";

/**
 * Viewport (`position: fixed`) placement for a row action menu anchored to its
 * trigger button.
 *
 * Opens below the button, or above it when there isn't room below (the last
 * rows of a table on a phone). The menus close on scroll, so a menu that ran
 * off the bottom of the screen left its lower items, often Delete, out of reach.
 * When it opens upward it is anchored by `bottom`, so its real height doesn't
 * need to be known. `estHeight` is only used to decide which way to open.
 */
export function anchoredMenuStyle(
  trigger: HTMLElement,
  { width, estHeight = 180, gap = 8 }: { width: number; estHeight?: number; gap?: number },
): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.max(8, Math.min(rect.right - width, vw - width - 8));
  const spaceBelow = vh - rect.bottom;
  const openUp = spaceBelow < estHeight + gap && rect.top > spaceBelow;
  return openUp ? { bottom: vh - rect.top + gap, left } : { top: rect.bottom + gap, left };
}
