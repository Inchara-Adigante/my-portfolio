// "Aurora" background: a few large, soft color glows drift very slowly behind
// the content, with one faint glow that eases toward the cursor. Kept calm on
// purpose: no particles or lines competing with the text. Pauses when the tab
// is hidden; renders one static frame for prefers-reduced-motion. On touch
// screens it also holds still while you type, so the keyboard stays responsive.

import { isTextField } from "./text-fields.js";

const MAX_DPR = 1.5;            // soft gradients don't need full resolution
const BLOB_COUNT = 4;
const DRIFT = 0.00006;          // radians per ms; one slow loop takes minutes
const BLOB_ALPHA = 0.16;
const CURSOR_ALPHA = 0.07;
const CURSOR_RADIUS = 360;
const CURSOR_EASE = 0.05;
const RESIZE_DEBOUNCE_MS = 150;
const MIN_HEIGHT_CHANGE_PX = 150; // mobile URL bar show/hide is smaller than this

// Fallbacks for the theme's --net-* colors ("r, g, b"), which styles.css sets per theme.
const DEFAULT_COLORS = Object.freeze({ a: "244, 162, 89", b: "155, 212, 168" });

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return Object.freeze({ a: read("--net-a", DEFAULT_COLORS.a), b: read("--net-b", DEFAULT_COLORS.b) });
}

const random = (min, max) => min + Math.random() * (max - min);

/** Each blob circles its own anchor point on a slow, slightly oval path. */
function createBlobs() {
  return Array.from({ length: BLOB_COUNT }, (_, i) => ({
    ax: (i % 2 === 0 ? 0.2 : 0.8) + random(-0.1, 0.1),
    ay: (i < 2 ? 0.25 : 0.75) + random(-0.1, 0.1),
    rx: random(0.06, 0.14),
    ry: random(0.05, 0.12),
    radius: random(0.32, 0.48),
    speed: random(0.6, 1.4) * (Math.random() < 0.5 ? -1 : 1),
    phase: random(0, Math.PI * 2),
    tone: i % 2 === 0 ? "a" : "b",
  }));
}

function glow(ctx, x, y, radius, rgb, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function draw(ctx, width, height, time, blobs, cursor, colors) {
  ctx.clearRect(0, 0, width, height);
  const size = Math.max(width, height);
  for (const b of blobs) {
    const angle = b.phase + time * DRIFT * b.speed;
    const x = (b.ax + b.rx * Math.cos(angle)) * width;
    const y = (b.ay + b.ry * Math.sin(angle)) * height;
    glow(ctx, x, y, b.radius * size, colors[b.tone], BLOB_ALPHA);
  }
  if (cursor.visible) glow(ctx, cursor.x, cursor.y, CURSOR_RADIUS, colors.a, CURSOR_ALPHA);
}

export function startBackground(canvas) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pauseWhileTyping = window.matchMedia("(pointer: coarse)").matches;
  const blobs = createBlobs();
  let typing = false;
  let colors = readColors();
  let width = 0;
  let height = 0;
  // The cursor glow eases toward the pointer rather than jumping to it.
  const cursor = { x: 0, y: 0, tx: 0, ty: 0, visible: false };
  let frameId = 0;
  let time = random(0, 100000);
  let last = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loop(now) {
    time += last ? Math.min(now - last, 100) : 0;
    last = now;
    cursor.x += (cursor.tx - cursor.x) * CURSOR_EASE;
    cursor.y += (cursor.ty - cursor.y) * CURSOR_EASE;
    draw(ctx, width, height, time, blobs, cursor, colors);
    frameId = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(frameId);
    last = 0;
    if (reducedMotion || typing) draw(ctx, width, height, time, blobs, { visible: false }, colors);
    else frameId = requestAnimationFrame(loop);
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const widthChanged = window.innerWidth !== width;
      const heightChanged = Math.abs(window.innerHeight - height) >= MIN_HEIGHT_CHANGE_PX;
      if (!widthChanged && !heightChanged) return;
      resize();
      start();
    }, RESIZE_DEBOUNCE_MS);
  });
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    cursor.tx = e.clientX;
    cursor.ty = e.clientY;
    if (!cursor.visible) Object.assign(cursor, { x: e.clientX, y: e.clientY, visible: true });
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { cursor.visible = false; });
  if (pauseWhileTyping) {
    document.addEventListener("focusin", (e) => {
      if (!isTextField(e.target)) return;
      typing = true;
      start();
    });
    document.addEventListener("focusout", () => {
      // Focus may be hopping to the next field; check once it lands.
      setTimeout(() => {
        if (!typing || isTextField(document.activeElement)) return;
        typing = false;
        if (!document.hidden) start();
      }, 0);
    });
  }
  window.addEventListener("themechange", () => {
    colors = readColors();
    if (reducedMotion || typing) draw(ctx, width, height, time, blobs, { visible: false }, colors);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frameId);
    else start();
  });

  resize();
  start();
}
