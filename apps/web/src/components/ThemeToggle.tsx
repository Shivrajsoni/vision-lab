"use client";

/** Flips between light and dark and remembers the choice. Until used, the page follows the system setting. */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const current =
      root.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked; the theme still changes for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-sm border border-line px-2.5 py-1 text-sm text-muted hover:text-text"
    >
      Switch theme
    </button>
  );
}
