// Light and dark themes. The choice is saved per browser. A tiny inline script
// in every page's <head> applies it before the first paint (so nothing
// flashes); this module adds the header switch and handles changes.

import { ICONS } from "./icons.js";
import { pixelWipe } from "./pixel-wipe.js";

export const THEMES = Object.freeze(["dark", "light"]);
export const DEFAULT_THEME = "dark";
const STORAGE_KEY = "theme";
// Page background per theme (also the phone's browser-bar color), and the
// accent colors the transition's pixels flash as they land.
const BACKGROUNDS = Object.freeze({ dark: "#121915", light: "#f6f4ee" });
const ACCENTS = Object.freeze({ dark: ["#f4a259", "#9bd4a8"], light: ["#b45309", "#2f7d4f"] });
let switching = false;

/** A saved choice if it's a real theme, otherwise the default. */
export const resolveTheme = (stored) => (THEMES.includes(stored) ? stored : DEFAULT_THEME);

export const nextTheme = (theme) => (theme === "light" ? "dark" : "light");

export const currentTheme = () => resolveTheme(document.documentElement.dataset.theme);

function saveTheme(theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private browsing can block storage; the switch still works for this visit.
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BACKGROUNDS[theme]);
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

/** Switches theme behind a corner-to-corner pixel wave (instant with reduced motion). */
async function switchTheme(theme, origin) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    applyTheme(theme);
    return;
  }
  const rect = origin.getBoundingClientRect();
  switching = true;
  try {
    await pixelWipe({
      color: BACKGROUNDS[theme],
      accents: ACCENTS[theme],
      originX: rect.left + rect.width / 2,
      originY: rect.top + rect.height / 2,
      onCovered: () => applyTheme(theme),
    });
  } finally {
    switching = false;
    if (currentTheme() !== theme) applyTheme(theme); // in case the animation was cut short
  }
}

const labelFor = (theme) => (theme === "light" ? "Switch to dark mode" : "Switch to light mode");

/** The sun/moon button for the header. */
export function createThemeToggle() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  button.innerHTML = `<span class="icon-sun">${ICONS.sun}</span><span class="icon-moon">${ICONS.moon}</span>`;
  const syncLabel = (theme = currentTheme()) => {
    const label = labelFor(theme);
    button.setAttribute("aria-label", label);
    button.title = label;
  };
  syncLabel();
  button.addEventListener("click", () => {
    if (switching) return;
    const theme = nextTheme(currentTheme());
    saveTheme(theme);
    switchTheme(theme, button);
    syncLabel(theme); // the animated switch applies the theme a moment later
  });
  // Another tab changed the theme: follow it.
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    applyTheme(resolveTheme(e.newValue));
    syncLabel();
  });
  return button;
}
