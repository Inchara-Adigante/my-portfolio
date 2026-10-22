// Rules of the pixel runner game, kept free of the DOM so they can be tested:
// stepGame(state, ms, input) returns the next state. Distances are world
// pixels (the renderer scales them up), times are milliseconds, and the
// y axis points down, so "feet" is the y of the dinosaur's feet.

import { SPRITES } from "./sprites.js";

export const LIMITS = Object.freeze({
  startSpeed: 0.17,        // px per ms on a 300px-wide world
  maxSpeed: 0.4,
  accel: 0.0000035,        // speed gained per ms
  maxStepMs: 50,           // a long frame (tab switch, slow phone) never moves things further than this
  restartDelayMs: 450,     // after a crash, so a held key doesn't instantly restart
});

const GRAVITY = 0.0022;        // px per ms²
const JUMP_VELOCITY = -0.54;   // px per ms, about a 66px jump
const FAST_FALL = 3;           // gravity multiplier while holding duck in the air
const GROUND_MARGIN = 16;      // ground line sits this far above the bottom
const DINO_X = 24;
const SCORE_PER_PX = 0.1;
const FLYER_MIN_SCORE = 250;
const FLYER_CHANCE = 0.25;
const MIN_GAP_MS = 650;        // obstacles never come closer than this much travel time
const HITBOX_INSET = 2;
const FLYER_HEIGHTS = Object.freeze([["low", 2], ["mid", 14], ["high", 28]]); // gap under the flyer, in px

const size = (name) => ({ w: SPRITES[name][0].length, h: SPRITES[name].length });
const STAND = size("dinoStand");
const DUCK = size("dinoDuckA");
const CACTUS = Object.freeze({ small: size("cactusSmall"), large: size("cactusLarge") });
const FLYER = size("flyerUp");

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** A fresh game, waiting for the first jump. */
export function createGame({ width, height, best = 0 }) {
  const speedScale = clamp(width / 300, 0.8, 1.3);
  return {
    status: "ready",
    width,
    height,
    groundY: height - GROUND_MARGIN,
    speedScale,
    speed: LIMITS.startSpeed * speedScale,
    score: 0,
    best,
    time: 0,
    cooldown: 0,
    dino: { x: DINO_X, feet: height - GROUND_MARGIN, vy: 0, ducking: false },
    obstacles: [],
    nextSpawnIn: width * 0.9,
  };
}

/**
 * Fits a game into a new world size (the window was maximized or restored),
 * keeping any run in progress: the dinosaur and obstacles move with the ground.
 */
export function resizeGame(state, width, height) {
  const groundY = height - GROUND_MARGIN;
  const shift = groundY - state.groundY;
  return {
    ...state,
    width,
    height,
    groundY,
    dino: { ...state.dino, feet: state.dino.feet + shift },
    obstacles: state.obstacles.map((o) => ({ ...o, y: o.y + shift })),
  };
}

/** A cactus group or a pterodactyl, with its left edge at x. */
export function makeObstacle(kind, x, groundY, random) {
  if (kind === "flyer") {
    const [height, gap] = FLYER_HEIGHTS[Math.min(FLYER_HEIGHTS.length - 1, Math.floor(random() * FLYER_HEIGHTS.length))];
    return { kind, height, x, y: groundY - gap - FLYER.h, w: FLYER.w, h: FLYER.h };
  }
  const variant = random() < 0.5 ? "small" : "large";
  const count = 1 + Math.floor(random() * (variant === "small" ? 3 : 2));
  const { w, h } = CACTUS[variant];
  return { kind, variant, count, x, y: groundY - h, w: count * w + (count - 1), h };
}

function gapAfter(speed, width, random) {
  return Math.max(speed * MIN_GAP_MS, width * (0.45 + random() * 0.7));
}

function dinoBox({ x, feet, ducking }) {
  const { w, h } = ducking ? DUCK : STAND;
  return { left: x + HITBOX_INSET, right: x + w - HITBOX_INSET, top: feet - h + HITBOX_INSET, bottom: feet - 1 };
}

function obstacleBox(o) {
  return { left: o.x + HITBOX_INSET, right: o.x + o.w - HITBOX_INSET, top: o.y + HITBOX_INSET, bottom: o.y + o.h - 1 };
}

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

function startRun(state) {
  const fresh = createGame({ width: state.width, height: state.height, best: state.best });
  return { ...fresh, status: "running", dino: { ...fresh.dino, vy: JUMP_VELOCITY } };
}

function moveDino(dino, groundY, input, dt) {
  const onGround = dino.feet >= groundY;
  const vy = onGround && input.jump ? JUMP_VELOCITY : dino.vy;
  const gravity = GRAVITY * (input.duck && !onGround ? FAST_FALL : 1);
  const airborne = !onGround || vy < 0;
  if (!airborne) return { ...dino, vy: 0, feet: groundY, ducking: input.duck };
  const nextVy = vy + gravity * dt;
  const feet = dino.feet + nextVy * dt;
  return feet >= groundY
    ? { ...dino, feet: groundY, vy: 0, ducking: false }
    : { ...dino, feet, vy: nextVy, ducking: false };
}

/**
 * Advances the game by dtMs. input = { jump, duck }: jump is a fresh press this
 * frame, duck is held. random() is injectable for tests.
 */
export function stepGame(state, dtMs, input, random = Math.random) {
  const dt = Math.min(dtMs, LIMITS.maxStepMs);
  if (state.status === "ready") return input.jump ? startRun(state) : state;
  if (state.status === "over") {
    const cooldown = Math.max(0, state.cooldown - dt);
    return input.jump && cooldown === 0 ? startRun(state) : { ...state, cooldown };
  }
  if (state.status !== "running") return state;

  const speed = Math.min(LIMITS.maxSpeed * state.speedScale, state.speed + LIMITS.accel * state.speedScale * dt);
  const travel = speed * dt;
  const dino = moveDino(state.dino, state.groundY, input, dt);
  const moved = state.obstacles.map((o) => ({ ...o, x: o.x - travel })).filter((o) => o.x + o.w > 0);

  let nextSpawnIn = state.nextSpawnIn - travel;
  let obstacles = moved;
  if (nextSpawnIn <= 0) {
    const kind = state.score >= FLYER_MIN_SCORE && random() < FLYER_CHANCE ? "flyer" : "cactus";
    obstacles = [...moved, makeObstacle(kind, state.width, state.groundY, random)];
    nextSpawnIn = gapAfter(speed, state.width, random);
  }

  const score = state.score + travel * SCORE_PER_PX;
  const hit = obstacles.some((o) => overlaps(dinoBox(dino), obstacleBox(o)));
  const next = { ...state, speed, dino, obstacles, nextSpawnIn, score, time: state.time + dt };
  if (!hit) return next;
  return { ...next, status: "over", best: Math.max(state.best, Math.floor(score)), cooldown: LIMITS.restartDelayMs };
}
