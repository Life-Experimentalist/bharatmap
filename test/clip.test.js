import test from "node:test";
import assert from "node:assert/strict";
import { clipOutsideRing, clipOutside } from "../src/clip.js";

const square = [[10, 10], [20, 10], [20, 20], [10, 20]];

test("a line far from the ring is returned whole", () => {
  const out = clipOutsideRing([[0, 0], [5, 0], [5, 5]], square);
  assert.deepEqual(out, [[[0, 0], [5, 0], [5, 5]]]);
});

test("a line inside the ring is removed", () => {
  assert.deepEqual(clipOutsideRing([[12, 12], [18, 18]], square), []);
});

test("a line through the ring is cut at the edges", () => {
  const out = clipOutsideRing([[0, 15], [30, 15]], square);
  assert.deepEqual(out, [[[0, 15], [10, 15]], [[20, 15], [30, 15]]]);
});

test("a line that ends inside keeps the part outside", () => {
  const out = clipOutsideRing([[0, 15], [15, 15]], square);
  assert.deepEqual(out, [[[0, 15], [10, 15]]]);
});

test("a concave ring is respected", () => {
  // an L shape: the notch at the top right is outside the ring
  const L = [[0, 0], [10, 0], [10, 4], [4, 4], [4, 10], [0, 10]];
  const out = clipOutsideRing([[8, 8], [8, -2]], L);
  assert.deepEqual(out, [[[8, 8], [8, 4]], [[8, 0], [8, -2]]]);
});

test("clipOutside applies every ring", () => {
  const other = [[30, 10], [40, 10], [40, 20], [30, 20]];
  const out = clipOutside([[0, 15], [50, 15]], [square, other]);
  assert.equal(out.length, 3);
  assert.deepEqual(out[1], [[20, 15], [30, 15]]);
});
