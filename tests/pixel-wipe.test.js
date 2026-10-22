import { test } from "node:test";
import assert from "node:assert/strict";
import { cornerNearest, waveDelays, blockScale } from "../js/pixel-wipe.js";

test("the wave starts from the screen corner nearest the button", () => {
  assert.deepEqual(cornerNearest(30, 20, 400, 800), { x: 0, y: 0 });
  assert.deepEqual(cornerNearest(1200, 20, 1280, 800), { x: 1, y: 0 });
  assert.deepEqual(cornerNearest(30, 790, 400, 800), { x: 0, y: 1 });
});

test("pixels near the starting corner go first and the opposite corner goes last", () => {
  const cols = 6;
  const rows = 4;
  const delays = waveDelays(cols, rows, { x: 1, y: 0 }, { spread: 300, jitter: 0 }, () => 0);
  const at = (c, r) => delays[r * cols + c];
  assert.equal(at(cols - 1, 0), 0);
  assert.equal(at(0, rows - 1), 300);
  assert.ok(at(cols - 2, 0) < at(cols - 3, 1));
  assert.equal(delays.length, cols * rows);
});

test("jitter scatters pixels a little without changing the overall order", () => {
  const delays = waveDelays(10, 10, { x: 0, y: 0 }, { spread: 400, jitter: 60 }, () => 0.5);
  assert.equal(delays[0], 30);
  assert.equal(delays[99], 430);
});

test("a pixel grows in when covering and shrinks away when uncovering", () => {
  assert.equal(blockScale(0, 100, 150, "cover"), 0);
  assert.equal(blockScale(300, 100, 150, "cover"), 1);
  assert.equal(blockScale(0, 100, 150, "uncover"), 1);
  assert.equal(blockScale(300, 100, 150, "uncover"), 0);
  const mid = blockScale(175, 100, 150, "cover");
  assert.ok(mid > 0 && mid < 1);
});
