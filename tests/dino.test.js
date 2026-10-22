import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, stepGame, makeObstacle, LIMITS } from "../js/dino/game.js";
import { SPRITES, FONT, UI_TEXT } from "../js/dino/sprites.js";

const IDLE = { jump: false, duck: false };
const JUMP = { jump: true, duck: false };
const DUCK = { jump: false, duck: true };
const never = () => 0.999; // random() that keeps the first obstacle far away

function running(overrides = {}) {
  const game = stepGame(createGame({ width: 300, height: 150 }), 16, JUMP, never);
  // Land the opening jump so tests start from a dino standing on the ground.
  let state = game;
  for (let i = 0; i < 60; i++) state = stepGame(state, 16, IDLE, never);
  return { ...state, obstacles: [], nextSpawnIn: 1e9, ...overrides };
}

const run = (state, frames, input = IDLE) => {
  let s = state;
  for (let i = 0; i < frames; i++) s = stepGame(s, 16, input, never);
  return s;
};

test("the game waits for a jump to start", () => {
  const ready = createGame({ width: 300, height: 150, best: 42 });
  assert.equal(ready.status, "ready");
  assert.equal(stepGame(ready, 16, IDLE).status, "ready");
  const started = stepGame(ready, 16, JUMP, never);
  assert.equal(started.status, "running");
  assert.equal(started.best, 42);
});

test("a jump goes up about 60px and lands back on the ground", () => {
  const start = running();
  assert.equal(start.dino.feet, start.groundY);
  let s = stepGame(start, 16, JUMP, never);
  assert.ok(s.dino.vy < 0);
  let apex = start.groundY;
  for (let i = 0; i < 60; i++) {
    s = stepGame(s, 16, IDLE, never);
    apex = Math.min(apex, s.dino.feet);
  }
  const height = start.groundY - apex;
  assert.ok(height > 50 && height < 75, `jump height ${height}`);
  assert.equal(s.dino.feet, start.groundY);
  assert.equal(s.dino.vy, 0);
});

test("you can't jump again while in the air", () => {
  const up = run(stepGame(running(), 16, JUMP, never), 5);
  const again = stepGame(up, 16, JUMP, never);
  assert.ok(again.dino.vy > up.dino.vy, "gravity keeps pulling; no second boost");
});

test("holding duck in the air makes the dino fall faster", () => {
  const up = run(stepGame(running(), 16, JUMP, never), 12);
  const framesToLand = (input) => {
    let s = up;
    for (let i = 1; i < 100; i++) {
      s = stepGame(s, 16, input, never);
      if (s.dino.feet === up.groundY) return i;
    }
    return Infinity;
  };
  assert.ok(framesToLand(DUCK) < framesToLand(IDLE));
});

test("running into a cactus ends the run and records the best score", () => {
  const start = running({ score: 120, best: 50 });
  const cactus = makeObstacle("cactus", start.dino.x, start.groundY, never);
  const over = stepGame({ ...start, obstacles: [cactus] }, 16, IDLE, never);
  assert.equal(over.status, "over");
  assert.equal(over.best, 120);
});

test("ducking slips under a mid-height pterodactyl, standing does not", () => {
  const start = running();
  const flyer = { ...makeObstacle("flyer", start.dino.x, start.groundY, () => 0.5), x: start.dino.x };
  assert.equal(flyer.height, "mid");
  assert.equal(stepGame({ ...start, obstacles: [flyer] }, 1, IDLE, never).status, "over");
  assert.equal(stepGame({ ...start, obstacles: [flyer] }, 1, DUCK, never).status, "running");
});

test("speed rises over time but never past the cap, and score climbs", () => {
  const start = running({ score: 0 });
  const later = run(start, 300);
  assert.ok(later.speed > start.speed);
  assert.ok(later.score > start.score);
  const capped = run({ ...start, speed: LIMITS.maxSpeed * 10 }, 2);
  assert.ok(capped.speed <= LIMITS.maxSpeed * start.speedScale + 1e-9);
});

test("obstacles spawn off the right edge and are dropped once off the left", () => {
  const spawned = stepGame(running({ nextSpawnIn: 0 }), 16, IDLE, () => 0.2);
  assert.equal(spawned.obstacles.length, 1);
  assert.ok(spawned.obstacles[0].x >= spawned.width - 10);
  const gone = stepGame(running({ obstacles: [{ ...spawned.obstacles[0], x: -500 }] }), 16, IDLE, never);
  assert.equal(gone.obstacles.length, 0);
});

test("a long pause between frames can't teleport anything", () => {
  const start = running();
  const after = stepGame({ ...start, obstacles: [makeObstacle("cactus", 200, start.groundY, never)] }, 5000, IDLE, never);
  assert.ok(after.obstacles[0].x > 150, "movement per step is capped");
});

test("after a crash, a jump only restarts once the short cool-down has passed", () => {
  const start = running();
  const over = stepGame({ ...start, obstacles: [makeObstacle("cactus", start.dino.x, start.groundY, never)] }, 16, IDLE, never);
  assert.equal(stepGame(over, 16, JUMP, never).status, "over");
  const cooled = run(over, Math.ceil(LIMITS.restartDelayMs / 16) + 1);
  const restarted = stepGame(cooled, 16, JUMP, never);
  assert.equal(restarted.status, "running");
  assert.equal(restarted.score, 0);
  assert.equal(restarted.best, over.best);
});

test("pixel art and font are well-formed", () => {
  for (const [name, frame] of Object.entries(SPRITES)) {
    const widths = new Set(frame.map((row) => row.length));
    assert.equal(widths.size, 1, `${name} rows are all the same width`);
  }
  for (const text of Object.values(UI_TEXT)) {
    for (const ch of text) assert.ok(ch in FONT, `font has "${ch}" (used in "${text}")`);
  }
  for (let d = 0; d <= 9; d++) assert.ok(String(d) in FONT);
  for (const [ch, rows] of Object.entries(FONT)) {
    assert.equal(rows.length, 5, `"${ch}" is 5 rows tall`);
    assert.equal(new Set(rows.map((r) => r.length)).size, 1, `"${ch}" rows share one width`);
  }
});
