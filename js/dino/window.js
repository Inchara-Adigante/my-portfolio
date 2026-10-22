// The game window's title-bar buttons, like a desktop window:
// red closes it (the run resets), yellow minimizes it into a pixel-dino dock
// icon (the run pauses), green maximizes it to a large view (green again,
// Escape or a click outside goes back). Closing and minimizing play the pixel
// morph from ./morph.js; clicking the icon brings the window back the same way.

import { runMorph } from "./morph.js";
import { SPRITES } from "./sprites.js";
import { spriteCanvas, readPalette } from "./draw.js";

const ICON_PX = 72;
const MAX_DPR = 2;
const BLOCK_PX = 14;
const SMALL_BLOCK_PX = 10;   // finer pixels on narrow windows
const NARROW_PX = 480;
const MAXIMIZE_MS = 320;
const ICON_DARK = "#16171b";
const ICON_LIGHT = "#ecfffa";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The dock icon: a violet-to-teal app tile with the pixel dinosaur standing on it. */
function drawIcon(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = ICON_PX * dpr;
  canvas.height = ICON_PX * dpr;
  canvas.style.width = `${ICON_PX}px`;
  canvas.style.height = `${ICON_PX}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const tile = ctx.createLinearGradient(0, 0, ICON_PX, ICON_PX);
  tile.addColorStop(0, "#ff9a85");
  tile.addColorStop(1, "#4fd1c5");
  ctx.fillStyle = tile;
  ctx.beginPath();
  ctx.roundRect(0, 0, ICON_PX, ICON_PX, 18);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  ctx.beginPath();
  ctx.roundRect(0, 0, ICON_PX, ICON_PX * 0.45, [18, 18, 0, 0]);
  ctx.fill();
  const dino = spriteCanvas(SPRITES.dinoStand, ICON_DARK, ICON_LIGHT);
  const scale = 2;
  const x = Math.round((ICON_PX - dino.width * scale) / 2);
  const y = 12;
  ctx.drawImage(dino, x, y, dino.width * scale, dino.height * scale);
  ctx.fillStyle = ICON_DARK;
  ctx.fillRect(10, y + dino.height * scale, ICON_PX - 20, 2);
}

/** Animates el from rect `from` to where it now sits (a FLIP), without layout work per frame. */
function slideFrom(el, from) {
  const to = el.getBoundingClientRect();
  if (reducedMotion() || !to.width || !to.height) return Promise.resolve();
  const move = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  return el.animate([{ transform: move }, { transform: "none" }], { duration: MAXIMIZE_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" })
    .finished.catch(() => {});
}

export function initGameWindow(slot, game, liveRegion) {
  const windowEl = slot?.querySelector(".game-window");
  const icon = slot?.querySelector(".game-icon");
  const canvas = slot?.querySelector(".dino-canvas");
  if (!windowEl || !icon || !canvas || !game) return;
  const maxButton = windowEl.querySelector('[data-action="maximize"]');
  const backdrop = document.createElement("div");
  backdrop.className = "game-backdrop";
  backdrop.hidden = true;
  document.body.append(backdrop);
  drawIcon(icon.querySelector("canvas"));

  let mode = "open";   // open | maximized | minimized | closed
  let busy = false;
  const announce = (text) => { if (liveRegion) liveRegion.textContent = text; };
  const accents = () => { const p = readPalette(); return [p.accent, p.dino]; };
  const blockSize = () => (windowEl.getBoundingClientRect().width < NARROW_PX ? SMALL_BLOCK_PX : BLOCK_PX);

  async function setMaximized(on) {
    const from = windowEl.getBoundingClientRect();
    if (on) slot.style.minHeight = `${slot.offsetHeight}px`; // keep the hero from jumping while the window floats
    windowEl.classList.toggle("is-max", on);
    document.documentElement.classList.toggle("game-max", on);
    backdrop.hidden = !on;
    maxButton.setAttribute("aria-pressed", String(on));
    maxButton.setAttribute("aria-label", on ? "Restore the game window" : "Maximize the game");
    mode = on ? "maximized" : "open";
    await slideFrom(windowEl, from);
    if (!on) slot.style.minHeight = "";
    game.focus();
  }

  /** Close or minimize: the window turns to pixels, then the dock icon pops in. */
  async function dock(kind) {
    if (busy || mode === "minimized" || mode === "closed") return;
    busy = true;
    if (mode === "maximized") await setMaximized(false);
    game.pause();
    icon.hidden = false;
    icon.classList.add("is-pending");
    const morph = reducedMotion()
      ? Promise.resolve()
      : runMorph({ stage: slot, windowEl, gameCanvas: canvas, iconEl: icon, mode: kind === "close" ? "dissolve" : "collapse", accents: accents(), size: blockSize() });
    windowEl.classList.add("is-docked"); // the snapshot is taken, so the real window can go
    await morph;
    if (kind === "close") game.reset();
    icon.classList.remove("is-pending");
    icon.classList.remove("pop");
    void icon.offsetWidth; // restart the pop animation
    icon.classList.add("pop");
    icon.setAttribute("aria-label", kind === "close" ? "Open the dino-run game" : "Restore the dino-run game (paused)");
    mode = kind === "close" ? "closed" : "minimized";
    announce(kind === "close" ? "Game closed." : "Game minimized. Use the dino-run icon to bring it back.");
    icon.focus({ preventScroll: true });
    busy = false;
  }

  /** The icon bursts back into pixels that rebuild the window. */
  async function undock() {
    if (busy || (mode !== "minimized" && mode !== "closed")) return;
    busy = true;
    icon.classList.add("is-pending");
    if (!reducedMotion()) {
      await runMorph({ stage: slot, windowEl, gameCanvas: canvas, iconEl: icon, mode: "restore", accents: accents(), size: blockSize() });
    }
    windowEl.classList.remove("is-docked");
    icon.hidden = true;
    icon.classList.remove("is-pending", "pop");
    mode = "open";
    announce("");
    game.focus();
    busy = false;
  }

  windowEl.querySelector(".window-controls").addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "close" || action === "minimize") dock(action);
    if (action === "maximize" && !busy) setMaximized(mode !== "maximized");
  });
  icon.addEventListener("click", undock);
  backdrop.addEventListener("click", () => { if (mode === "maximized") setMaximized(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mode === "maximized") setMaximized(false);
  });
}
