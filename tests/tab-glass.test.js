import { test } from "node:test";
import assert from "node:assert/strict";
import { nearestIndex, lensLeft, stretchFor, isHorizontalDrag, DRAG_THRESHOLD_PX, MAX_STRETCH } from "../js/tab-glass.js";

test("nearestIndex picks the tab whose center is closest to the finger", () => {
  const centers = [27, 71, 115, 159];
  assert.equal(nearestIndex(centers, 30), 0);
  assert.equal(nearestIndex(centers, 100), 2);
  assert.equal(nearestIndex(centers, 158), 3);
});

test("nearestIndex clamps fingers past either end to the first or last tab", () => {
  const centers = [27, 71, 115];
  assert.equal(nearestIndex(centers, -40), 0);
  assert.equal(nearestIndex(centers, 900), 2);
});

test("lensLeft centers the lens under the finger but keeps it inside the bar", () => {
  assert.equal(lensLeft(100, 42, 6, 230), 79);
  assert.equal(lensLeft(0, 42, 6, 230), 6);
  assert.equal(lensLeft(500, 42, 6, 230), 230);
});

test("stretchFor leaves a still lens round and stretches a fast one up to a cap", () => {
  assert.equal(stretchFor(0), 1);
  assert.ok(stretchFor(2) > 1);
  assert.ok(stretchFor(2) < stretchFor(6));
  assert.equal(stretchFor(-6), stretchFor(6));
  assert.equal(stretchFor(10_000), MAX_STRETCH);
});

test("isHorizontalDrag ignores small jitters and mostly vertical swipes", () => {
  assert.equal(isHorizontalDrag(DRAG_THRESHOLD_PX - 1, 0), false);
  assert.equal(isHorizontalDrag(DRAG_THRESHOLD_PX + 1, 2), true);
  assert.equal(isHorizontalDrag(-(DRAG_THRESHOLD_PX + 4), 1), true);
  assert.equal(isHorizontalDrag(12, 20), false);
});
