// Pixel morph for the game window's buttons, in the same spirit as the theme
// switch's pixel wave. The window is split into square pixels that keep its
// real colors (a snapshot of the title bar and the game scene), then:
// collapse: the pixels fly into the dock icon, nearest first, shrinking as they go
// restore:  the same, backwards, out of the icon
// dissolve: the pixels shrink away where they are (closing the window)
// Moving pixels flash a violet or teal core, like the theme transition.

export const MIN_BLOCK_SCALE = 0.2;
const MAX_DPR = 2;
const SPREAD_MS = 260;   // stagger between the first and last pixel
const BLOCK_MS = 300;    // flight time of one pixel
const CORE_SIZE = 0.5;   // accent core, as a share of the pixel
const CORE_FROM = 0.35;  // cores appear once a pixel is this far along, so the window shows first

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeIn = (p) => p * p * p;
const easeOut = (p) => 1 - (1 - p) ** 3;
const lerp = (a, b, t) => a + (b - a) * t;

/** Square pixels covering rect, row by row; the last row and column are trimmed to fit. */
export function morphGrid({ left, top, width, height }, size) {
  const blocks = [];
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      blocks.push({ x: left + x, y: top + y, w: Math.min(size, width - x), h: Math.min(size, height - y) });
    }
  }
  return blocks;
}

/** Start delay per pixel: the nearest to the target starts at 0, the farthest at spread. */
export function morphDelays(blocks, target, spread) {
  const distances = blocks.map((b) => Math.hypot(b.x + b.w / 2 - target.x, b.y + b.h / 2 - target.y));
  const min = Math.min(...distances);
  const range = Math.max(...distances) - min || 1;
  return distances.map((d) => ((d - min) / range) * spread);
}

/** Center and size of one pixel at time t. */
export function blockFrame(block, target, t, delay, duration, mode) {
  const p = clamp01((t - delay) / duration);
  const home = { x: block.x + block.w / 2, y: block.y + block.h / 2 };
  const full = Math.max(block.w, block.h);
  if (mode === "dissolve") return { cx: home.x, cy: home.y, size: full * (1 - easeIn(p)), p };
  if (mode === "restore") {
    const e = easeOut(p);
    return { cx: lerp(target.x, home.x, e), cy: lerp(target.y, home.y, e), size: lerp(full * MIN_BLOCK_SCALE, full, e), p };
  }
  const e = easeIn(p);
  return { cx: lerp(home.x, target.x, e), cy: lerp(home.y, target.y, e), size: lerp(full, full * MIN_BLOCK_SCALE, e), p };
}

/**
 * The window's look as a small image: page and card background, title bar and
 * its buttons, and the live game canvas. Returns one CSS color per block.
 */
function sampleColors(windowEl, gameCanvas, rect, blocks, size) {
  const cols = Math.ceil(rect.width / size);
  const rows = Math.ceil(rect.height / size);
  const snap = document.createElement("canvas");
  snap.width = Math.ceil(rect.width);
  snap.height = Math.ceil(rect.height);
  const ctx = snap.getContext("2d");
  const paint = (el, color = getComputedStyle(el).backgroundColor) => {
    const r = el.getBoundingClientRect();
    ctx.fillStyle = color;
    ctx.fillRect(r.left - rect.left, r.top - rect.top, r.width, r.height);
  };
  ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
  ctx.fillRect(0, 0, snap.width, snap.height);
  paint(windowEl);
  windowEl.querySelectorAll(".window-bar, .win-btn").forEach((el) => paint(el));
  const g = gameCanvas.getBoundingClientRect();
  if (g.width && g.height) ctx.drawImage(gameCanvas, g.left - rect.left, g.top - rect.top, g.width, g.height);

  const small = document.createElement("canvas");
  small.width = cols;
  small.height = rows;
  const sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(snap, 0, 0, cols, rows);
  const data = sctx.getImageData(0, 0, cols, rows).data;
  return blocks.map((_, i) => `rgb(${data[i * 4]}, ${data[i * 4 + 1]}, ${data[i * 4 + 2]})`);
}

/**
 * Plays one morph on a canvas laid over `stage` (the positioned element that
 * holds both the window and the icon). Resolves when the last pixel lands.
 */
export function runMorph({ stage, windowEl, gameCanvas, iconEl, mode, accents, size }) {
  return new Promise((resolve) => {
    const stageRect = stage.getBoundingClientRect();
    const winRect = windowEl.getBoundingClientRect();
    const iconRect = iconEl.getBoundingClientRect();
    const local = { left: winRect.left - stageRect.left, top: winRect.top - stageRect.top, width: winRect.width, height: winRect.height };
    const target = { x: iconRect.left - stageRect.left + iconRect.width / 2, y: iconRect.top - stageRect.top + iconRect.height / 2 };
    const blocks = morphGrid(local, size);
    const colors = sampleColors(windowEl, gameCanvas, winRect, blocks, size);
    const delays = morphDelays(blocks, target, SPREAD_MS);

    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.className = "pixel-morph";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = Math.ceil(stageRect.width * dpr);
    canvas.height = Math.ceil(stageRect.height * dpr);
    canvas.style.width = `${stageRect.width}px`;
    canvas.style.height = `${stageRect.height}px`;
    stage.append(canvas);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const total = SPREAD_MS + BLOCK_MS;
    const start = performance.now();
    function frame(now) {
      const t = now - start;
      ctx.clearRect(0, 0, stageRect.width, stageRect.height);
      for (let i = 0; i < blocks.length; i++) {
        const { cx, cy, size: s, p } = blockFrame(blocks[i], target, t, delays[i], BLOCK_MS, mode);
        if (s <= 0.2) continue;
        ctx.fillStyle = colors[i];
        ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
        if (p > CORE_FROM && p < 1) {
          const core = s * CORE_SIZE;
          ctx.fillStyle = accents[i % accents.length];
          ctx.fillRect(cx - core / 2, cy - core / 2, core, core);
        }
      }
      if (t < total) {
        requestAnimationFrame(frame);
        return;
      }
      canvas.remove();
      resolve();
    }
    requestAnimationFrame(frame);
  });
}
