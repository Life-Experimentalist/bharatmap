import test from "node:test";
import assert from "node:assert/strict";
import Pbf from "pbf";
import { VectorTile } from "@mapbox/vector-tile";
import vtpbf from "vt-pbf";
import { rewriteTile } from "../src/tile.js";

const EXT = 4096;
// Build a z0 tile whose boundary layer holds the given features. Coordinates are tile pixels.
function makeTile(features) {
  const layer = {
    version: 2, name: "boundary", extent: EXT, length: features.length,
    feature: (i) => ({ id: i, type: 2, properties: features[i].props, loadGeometry: () => features[i].lines.map((l) => l.map(([x, y]) => ({ x, y }))) }),
  };
  return vtpbf.fromVectorTileJs({ layers: { boundary: layer } });
}
const lonPx = (lon) => ((lon + 180) / 360) * EXT;
const latPx = (lat) => { const s = Math.sin((lat * Math.PI) / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * EXT; };
const read = (bytes) => {
  const L = new VectorTile(new Pbf(bytes)).layers.boundary;
  return Array.from({ length: L.length }, (_, i) => L.feature(i));
};

const disputed = { admin_level: 2, maritime: 0, disputed: 1 };
const plain = { admin_level: 2, maritime: 0, disputed: 0 };
const line = [[lonPx(60), latPx(34)], [lonPx(100), latPx(34)]]; // runs along 34N through region 1

test("a disputed line through Kashmir loses the part inside the region", () => {
  const out = rewriteTile(makeTile([{ props: disputed, lines: [line] }]), 0, 0, 0);
  assert.ok(out, "tile should be rewritten");
  const feats = read(out);
  assert.equal(feats.length, 1);
  assert.equal(feats[0].loadGeometry().length, 2, "cut into two pieces");
});

test("an ordinary border inside the region is left alone", () => {
  assert.equal(rewriteTile(makeTile([{ props: plain, lines: [line] }]), 0, 0, 0), null);
});

test("a disputed line far from both regions is left alone", () => {
  const far = [[lonPx(-100), latPx(40)], [lonPx(-90), latPx(40)]];
  assert.equal(rewriteTile(makeTile([{ props: disputed, lines: [far] }]), 0, 0, 0), null);
});

test("maritime lines are never touched", () => {
  assert.equal(rewriteTile(makeTile([{ props: { ...disputed, maritime: 1 }, lines: [line] }]), 0, 0, 0), null);
});

test("a tile without a boundary layer returns null", () => {
  const bytes = vtpbf.fromVectorTileJs({ layers: { water: { version: 2, name: "water", extent: EXT, length: 0, feature: () => null } } });
  assert.equal(rewriteTile(bytes, 0, 0, 0), null);
});
