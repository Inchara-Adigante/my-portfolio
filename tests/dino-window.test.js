import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, stepGame, makeObstacle, resizeGame } from "../js/dino/game.js";
import { morphGrid, morphDelays, blockFrame, MIN_BLOCK_SCALE } from "../js/dino/morph.js";

const never = () => 0.999;

test("resizing the game keeps the run going, with everything still on the ground", () => {
  let s = stepGame(createGame({ width: 300, height: 150, best: 9 }), 16, { jump: true, duck: false }, never);
  for (let i = 0; i < 5; i++) s = stepGame(s, 16, { jump: false, duck: false }, never);
  const cactus = makeObstacle("cactus", 200, s.groundY, never);
  s = { ...s, obstacles: [cactus], score: 123 };
  const airborne = s.groundY - s.dino.feet;

  const big = resizeGame(s, 520, 260);
  assert.equal(big.width, 520);
  assert.equal(big.height, 260);
  assert.equal(big.groundY, 260 - (150 - s.groundY));
  assert.ok(Math.abs(big.groundY - big.dino.feet - airborne) < 1e-9, "same height above the ground");
  assert.equal(big.obstacles[0].y + big.obstacles[0].h, big.groundY, "cactus still stands on the ground");
  assert.equal(big.obstacles[0].x, 200);
  assert.equal(big.score, 123);
  assert.equal(big.best, 9);
  assert.equal(big.status, "running");
});

test("the window splits into a grid of square pixels that covers it exactly", () => {
  const blocks = morphGrid({ left: 10, top: 20, width: 100, height: 45 }, 20);
  assert.equal(blocks.length, 5 * 3);
  assert.deepEqual(blocks[0], { x: 10, y: 20, w: 20, h: 20 });
  const last = blocks.at(-1);
  assert.equal(last.x + last.w, 110, "the last column is trimmed to the edge");
  assert.equal(last.y + last.h, 65, "the last row is trimmed to the edge");
});

test("pixels nearest the icon leave first and the farthest leave last", () => {
  const blocks = morphGrid({ left: 0, top: 0, width: 200, height: 100 }, 20);
  const icon = { x: 190, y: 90 };
  const delays = morphDelays(blocks, icon, 300);
  const nearest = blocks.findIndex((b) => b.x === 180 && b.y === 80);
  const farthest = blocks.findIndex((b) => b.x === 0 && b.y === 0);
  assert.equal(delays[nearest], Math.min(...delays));
  assert.equal(delays[farthest], 300);
});

test("collapsing, each pixel starts in place and ends shrunk on the icon; restoring plays it backwards", () => {
  const block = { x: 0, y: 0, w: 20, h: 20 };
  const icon = { x: 200, y: 100 };
  const start = blockFrame(block, icon, 0, 50, 200, "collapse");
  assert.deepEqual([start.cx, start.cy, start.size], [10, 10, 20]);
  const end = blockFrame(block, icon, 400, 50, 200, "collapse");
  assert.deepEqual([end.cx, end.cy], [200, 100]);
  assert.equal(end.size, 20 * MIN_BLOCK_SCALE);
  const restoreStart = blockFrame(block, icon, 0, 50, 200, "restore");
  assert.deepEqual([restoreStart.cx, restoreStart.cy], [200, 100]);
  const restoreEnd = blockFrame(block, icon, 400, 50, 200, "restore");
  assert.deepEqual([restoreEnd.cx, restoreEnd.cy, restoreEnd.size], [10, 10, 20]);
  const mid = blockFrame(block, icon, 150, 50, 200, "collapse");
  assert.ok(mid.cx > 10 && mid.cx < 200 && mid.size < 20 && mid.size > 20 * MIN_BLOCK_SCALE);
});

test("closing scatters pixels away instead of gathering them", () => {
  const block = { x: 0, y: 0, w: 20, h: 20 };
  const end = blockFrame(block, { x: 200, y: 100 }, 400, 0, 200, "dissolve");
  assert.equal(end.size, 0, "dissolved pixels vanish");
  assert.deepEqual([end.cx, end.cy], [10, 10], "and stay where they were");
});
