// "Skill constellations" background: a quiet field of twinkling stars with
// Inchara's skills hidden in it as constellations, one per skill group. Moving
// the cursor near a constellation draws its lines and fades in the skill
// names; with no mouse (phones, idle), their lines brighten one at a time,
// without names, so nothing pops up beside the text while someone is reading.
// Pauses when the tab is hidden; renders one static frame for
// prefers-reduced-motion. On touch screens it also holds still while you type,
// so the keyboard stays responsive.

import { PROFILE } from "./profile.js";
import { isTextField } from "./text-fields.js";

const MAX_DPR = 2;
const STAR_DENSITY = 1 / 7500;    // background stars per px²
const MAX_STARS = 260;
const STARS_PER_CONSTELLATION = 5;
const REVEAL_RADIUS = 230;        // px from a constellation's center where it starts to appear
const REVEAL_EASE = 0.08;
const IDLE_REVEAL_MS = 4500;      // each constellation's turn when there's no mouse
const SPREAD_X = 0.08;            // constellation size, as a share of the viewport
const SPREAD_Y = 0.3;
// Where each constellation sits, as viewport fractions: in the side margins, so
// the names stay out of the main text column on wide screens.
const CENTERS = [[0.05, 0.3], [0.93, 0.24], [0.93, 0.74], [0.05, 0.76]];
const RESIZE_DEBOUNCE_MS = 150;
const MIN_HEIGHT_CHANGE_PX = 150; // mobile URL bar show/hide is smaller than this

// Fallbacks for the theme's --net-* colors ("r, g, b"), which styles.css sets per theme.
const DEFAULT_COLORS = Object.freeze({ node: "190, 216, 224", a: "255, 154, 133", b: "79, 209, 197" });

function readColors() {
  const style = getComputedStyle(document.documentElement);
  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return Object.freeze({
    node: read("--net-node", DEFAULT_COLORS.node), // background stars and labels
    a: read("--net-a", DEFAULT_COLORS.a),          // constellation stars
    b: read("--net-b", DEFAULT_COLORS.b),          // constellation lines
  });
}

/** Deterministic random numbers, so the sky looks the same on every visit. */
function seeded(seed) {
  let x = seed;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
}

/** One constellation per skill group, named with that group's first few skills. */
function createSky(width, height) {
  const random = seeded(7);
  const count = Math.min(MAX_STARS, Math.round(width * height * STAR_DENSITY));
  const stars = Array.from({ length: count }, () => ({
    x: random() * width, y: random() * height, size: random() * 1.1 + 0.3, phase: random() * Math.PI * 2,
  }));
  const constellations = PROFILE.skills.slice(0, CENTERS.length).map((group, g) => {
    const [cx, cy] = CENTERS[g];
    const points = group.items.slice(0, STARS_PER_CONSTELLATION).map((name) => ({
      name,
      x: (cx + (random() - 0.5) * SPREAD_X) * width,
      y: (cy + (random() - 0.5) * SPREAD_Y) * height,
    }));
    // Sort around the center so the connecting line forms a loose shape instead of a scribble.
    const mx = points.reduce((s, p) => s + p.x, 0) / points.length;
    const my = points.reduce((s, p) => s + p.y, 0) / points.length;
    points.sort((p, q) => Math.atan2(p.y - my, p.x - mx) - Math.atan2(q.y - my, q.x - mx));
    return { group: group.group, points, x: mx, y: my, reveal: 0 };
  });
  return { stars, constellations };
}

function dot(ctx, x, y, radius, rgb, alpha) {
  ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** Eases each constellation's reveal toward the cursor's nearness, or the idle turn. */
function updateReveals(constellations, cursor, time) {
  const idle = Math.floor(time / IDLE_REVEAL_MS) % constellations.length;
  const idleFade = Math.sin(((time % IDLE_REVEAL_MS) / IDLE_REVEAL_MS) * Math.PI);
  for (const [g, c] of constellations.entries()) {
    const target = cursor.active
      ? Math.max(0, 1 - Math.hypot(cursor.x - c.x, cursor.y - c.y) / REVEAL_RADIUS)
      : g === idle ? idleFade * 0.5 : 0;
    c.reveal += (target - c.reveal) * REVEAL_EASE;
  }
}

function draw(ctx, width, height, sky, time, colors, showNames = false) {
  ctx.clearRect(0, 0, width, height);
  for (const s of sky.stars) {
    dot(ctx, s.x, s.y, s.size, colors.node, 0.16 + 0.14 * Math.sin(time * 0.0012 + s.phase));
  }
  ctx.font = "11px ui-monospace, Menlo, monospace";
  for (const c of sky.constellations) {
    const r = c.reveal;
    ctx.strokeStyle = `rgba(${colors.b}, ${0.05 + r * 0.35})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    c.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
    for (const p of c.points) {
      if (r > 0.02) dot(ctx, p.x, p.y, 6, colors.a, r * 0.16);
      dot(ctx, p.x, p.y, 1.9, colors.a, 0.3 + r * 0.6);
      if (showNames && r > 0.05) {
        ctx.fillStyle = `rgba(${colors.node}, ${r * 0.7})`;
        ctx.fillText(p.name, p.x + 8, p.y - 7);
      }
    }
    if (showNames && r > 0.3) {
      ctx.fillStyle = `rgba(${colors.b}, ${(r - 0.3) * 0.8})`;
      ctx.fillText(c.group.toUpperCase(), c.x - ctx.measureText(c.group.toUpperCase()).width / 2, c.y + 4);
    }
  }
}

export function startBackground(canvas) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pauseWhileTyping = window.matchMedia("(pointer: coarse)").matches;
  let typing = false;
  let colors = readColors();
  let width = 0;
  let height = 0;
  let sky = { stars: [], constellations: [] };
  const cursor = { x: 0, y: 0, active: false };
  let frameId = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sky = createSky(width, height);
  }

  function loop(time) {
    updateReveals(sky.constellations, cursor, time);
    draw(ctx, width, height, sky, time, colors, cursor.active);
    frameId = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(frameId);
    if (reducedMotion || typing) draw(ctx, width, height, sky, 0, colors);
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
    Object.assign(cursor, { x: e.clientX, y: e.clientY, active: true });
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { cursor.active = false; });
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
    if (reducedMotion || typing) draw(ctx, width, height, sky, 0, colors);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frameId);
    else start();
  });

  resize();
  start();
}
