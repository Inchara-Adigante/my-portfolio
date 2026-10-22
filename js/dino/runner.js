// Draws the pixel runner game (rules in ./game.js) and wires up its controls:
// Space, Up or W to jump and Down or S to duck when the game has focus; a
// click jumps; on touch screens a tap jumps and holding the left third ducks.
// It only animates while a run is in progress, pauses when scrolled away or
// the tab is hidden, and redraws in the site's colors when the theme changes.

import { createGame, stepGame, resizeGame, LIMITS } from "./game.js";
import { SPRITES, FONT, UI_TEXT } from "./sprites.js";
import { spriteCanvas, readPalette } from "./draw.js";

const MAX_DPR = 2;
const MAX_ZOOM = 4;
const MIN_WORLD_WIDTH = 140;     // 2x pixels whenever the world still has this much room
const WORLD_WIDTH_PER_ZOOM = 360; // bigger windows (maximized) step up to 3x, 4x
const MIN_WORLD_HEIGHT = 100;
const BEST_KEY = "dino-best";
const DUCK_ZONE = 0.35;       // left share of the game a touch holds to duck
const RUN_FRAME_MS = 100;
const FLAP_FRAME_MS = 160;
const MILESTONE = 100;
const BLINK_MS = 900;
const CLOUD_PARALLAX = 0.2;
const PEBBLE_SPACING = 23;
const JUMP_KEYS = new Set([" ", "ArrowUp", "w", "W"]);
const DUCK_KEYS = new Set(["ArrowDown", "s", "S"]);

const pad = (n) => String(Math.floor(n)).padStart(5, "0");

function readBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(best) {
  try {
    window.localStorage.setItem(BEST_KEY, String(best));
  } catch {
    // Private browsing can block storage; the best score lasts for this visit.
  }
}

function buildSprites(p) {
  const art = (name, main, repeat) => spriteCanvas(SPRITES[name], main, p.accent, repeat);
  return {
    dinoStand: art("dinoStand", p.dino), dinoRunA: art("dinoRunA", p.dino), dinoRunB: art("dinoRunB", p.dino),
    dinoDead: art("dinoDead", p.dino), dinoDuckA: art("dinoDuckA", p.dino), dinoDuckB: art("dinoDuckB", p.dino),
    flyerUp: art("flyerUp", p.flyer), flyerDown: art("flyerDown", p.flyer), cloud: art("cloud", p.cloud),
    cactus: Object.fromEntries(["small", "large"].flatMap((v) => [1, 2, 3].map((n) =>
      [`${v}${n}`, art(v === "small" ? "cactusSmall" : "cactusLarge", p.accent, n)]))),
  };
}

const glyphWidth = (ch) => (FONT[ch]?.[0].length ?? 3);
const textWidth = (text, scale) => ([...text].reduce((w, ch) => w + glyphWidth(ch) + 1, 0) - 1) * scale;

function drawText(ctx, text, x, y, scale, color) {
  ctx.fillStyle = color;
  let cursor = x;
  for (const ch of text) {
    FONT[ch]?.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === "#") ctx.fillRect(cursor + rx * scale, y + ry * scale, scale, scale);
      }
    });
    cursor += (glyphWidth(ch) + 1) * scale;
  }
}

function dinoFrame(state) {
  const { status, dino, time } = state;
  if (status === "over") return "dinoDead";
  const alt = Math.floor(time / RUN_FRAME_MS) % 2 === 0;
  if (dino.ducking) return alt ? "dinoDuckA" : "dinoDuckB";
  if (status !== "running" || dino.feet < state.groundY) return "dinoStand";
  return alt ? "dinoRunA" : "dinoRunB";
}

export function initDinoGame(canvas, liveRegion) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  let palette = readPalette();
  let sprites = buildSprites(palette);
  let dpr = 1;
  let zoom = 1;
  let state = null;
  let clouds = [];
  let groundShift = 0;
  let input = { jump: false, duck: false };
  let frameId = 0;
  let last = 0;
  let blinkUntil = 0;

  function layout() {
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (!cssW || !cssH) return false;
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const byWidth = Math.max(cssW >= 2 * MIN_WORLD_WIDTH ? 2 : 1, Math.round(cssW / WORLD_WIDTH_PER_ZOOM));
    zoom = Math.max(1, Math.min(MAX_ZOOM, byWidth, Math.floor(cssH / MIN_WORLD_HEIGHT)));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const width = Math.floor(cssW / zoom);
    const height = Math.floor(cssH / zoom);
    // A resize (maximize, restore, rotation) keeps the run; only the first layout starts a new game.
    state = state ? resizeGame(state, width, height) : createGame({ width, height, best: readBest() });
    clouds = [0.15, 0.55, 0.85].map((f, i) => ({ x: width * f, y: 12 + i * 11 }));
    return true;
  }

  function draw() {
    const { width, height, groundY } = state;
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);

    clouds.forEach((c) => ctx.drawImage(sprites.cloud, Math.round(c.x), c.y));
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, groundY, width, 1);
    for (let x = -(groundShift % PEBBLE_SPACING); x < width; x += PEBBLE_SPACING) {
      ctx.fillRect(Math.round(x), groundY + 3, 2, 1);
      ctx.fillRect(Math.round(x + 11), groundY + 6, 1, 1);
    }

    for (const o of state.obstacles) {
      const image = o.kind === "flyer"
        ? sprites[Math.floor(state.time / FLAP_FRAME_MS) % 2 ? "flyerUp" : "flyerDown"]
        : sprites.cactus[`${o.variant}${o.count}`];
      ctx.drawImage(image, Math.round(o.x), Math.round(o.y));
    }
    const dinoImage = sprites[dinoFrame(state)];
    ctx.drawImage(dinoImage, state.dino.x, Math.round(state.dino.feet - dinoImage.height));

    const blinking = performance.now() < blinkUntil && Math.floor(performance.now() / 150) % 2 === 0;
    const scoreText = pad(state.score);
    const right = width - 6;
    if (!blinking) drawText(ctx, scoreText, right - textWidth(scoreText, 1), 6, 1, palette.text);
    const hiText = `${UI_TEXT.hi} ${pad(state.best)}`;
    drawText(ctx, hiText, right - textWidth(scoreText, 1) - 8 - textWidth(hiText, 1), 6, 1, palette.ground);

    const center = (text, y, scale, color) => drawText(ctx, text, Math.round((width - textWidth(text, scale)) / 2), y, scale, color);
    if (state.status === "ready") center(UI_TEXT.start, Math.round(height * 0.38), 1, palette.text);
    if (state.status === "paused") center(UI_TEXT.paused, Math.round(height * 0.38), 1, palette.text);
    if (state.status === "over") {
      center(UI_TEXT.over, Math.round(height * 0.28), 2, palette.text);
      center(UI_TEXT.retry, Math.round(height * 0.28) + 16, 1, palette.ground);
    }
  }

  function gameLoop(now) {
    const dt = Math.min(now - last, LIMITS.maxStepMs);
    last = now;
    const before = state;
    state = stepGame(state, dt, input);
    input = { ...input, jump: false };
    if (state.status === "running") {
      const travel = state.speed * dt;
      groundShift += travel;
      clouds = clouds.map((c) => ({ ...c, x: c.x - travel * CLOUD_PARALLAX < -20 ? state.width + 10 : c.x - travel * CLOUD_PARALLAX }));
      if (Math.floor(state.score / MILESTONE) > Math.floor(before.score / MILESTONE)) blinkUntil = now + BLINK_MS;
    }
    if (before.status === "running" && state.status === "over") {
      saveBest(state.best);
      if (liveRegion) liveRegion.textContent = `Game over. Score ${Math.floor(state.score)}. Best ${state.best}.`;
    }
    draw();
    // Keep going while running, and briefly after a crash so the restart cool-down runs out.
    const keepGoing = state.status === "running" || (state.status === "over" && state.cooldown > 0);
    frameId = keepGoing ? requestAnimationFrame(gameLoop) : 0;
  }

  function wake() {
    if (frameId) return;
    last = performance.now();
    frameId = requestAnimationFrame(gameLoop);
  }

  function press() {
    if (!state) return;
    if (state.status === "running") {
      input = { ...input, jump: true };
      return;
    }
    if (state.status === "paused") state = { ...state, status: "running" };
    else state = stepGame(state, 0, { jump: true, duck: false });
    if (liveRegion && state.status === "running") liveRegion.textContent = "";
    draw();
    if (state.status === "running" || state.cooldown > 0) wake();
  }

  function pause() {
    if (state?.status !== "running") return;
    state = { ...state, status: "paused" };
    input = { jump: false, duck: false };
    cancelAnimationFrame(frameId);
    frameId = 0;
    draw();
  }

  canvas.addEventListener("keydown", (e) => {
    if (JUMP_KEYS.has(e.key)) {
      e.preventDefault();
      if (!e.repeat) press();
    } else if (DUCK_KEYS.has(e.key)) {
      e.preventDefault();
      input = { ...input, duck: true };
    }
  });
  canvas.addEventListener("keyup", (e) => {
    if (DUCK_KEYS.has(e.key)) input = { ...input, duck: false };
  });
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const duckTouch = e.pointerType === "touch" && state?.status === "running" && e.clientX - rect.left < rect.width * DUCK_ZONE;
    if (duckTouch) input = { ...input, duck: true };
    else press();
  });
  const release = () => { input = { ...input, duck: false }; };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("blur", release);

  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); }).observe(canvas);
  }
  window.addEventListener("themechange", () => {
    palette = readPalette();
    sprites = buildSprites(palette);
    if (state) draw();
  });
  new ResizeObserver(() => {
    pause();
    if (layout()) draw();
  }).observe(canvas);

  return {
    pause,
    /** Back to a fresh, waiting game (closing the window); the best score stays. */
    reset() {
      cancelAnimationFrame(frameId);
      frameId = 0;
      input = { jump: false, duck: false };
      if (!state) return;
      state = createGame({ width: state.width, height: state.height, best: state.best });
      draw();
    },
    focus: () => canvas.focus({ preventScroll: true }),
  };
}
