import Pbf from "pbf";
import { VectorTile } from "@mapbox/vector-tile";
import vtpbf from "vt-pbf";
import { clipOutside } from "./clip.js";
import { REGIONS, PROFILE, ringBox } from "./config.js";
import boundary from "./data/india-boundary.js";

const lonToX = (lon) => (lon + 180) / 360;
const latToY = (lat) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};

// Region rings in the pixel space of one tile (y grows downward). Rings that do not reach the tile
// are dropped, judged by their bounding box.
function tileRings(regions, z, x, y, extent) {
  const n = 2 ** z;
  const out = [];
  for (const ring of regions) {
    const [w, s, e, nn] = ringBox(ring);
    const x0 = (lonToX(w) * n - x) * extent, x1 = (lonToX(e) * n - x) * extent;
    const y0 = (latToY(nn) * n - y) * extent, y1 = (latToY(s) * n - y) * extent;
    if (x1 <= 0 || x0 >= extent || y1 <= 0 || y0 >= extent) continue;
    out.push(ring.map(([lon, lat]) => [(lonToX(lon) * n - x) * extent, (latToY(lat) * n - y) * extent]));
  }
  return out;
}

// How far a cut end may reach to meet the drawn line, in degrees (about 1.6 km).
const SNAP_DEG = 0.015;

// The drawn lines in tile pixels, keeping only segments near the tile.
function tileSnapLines(data, z, x, y, extent, reach) {
  const n = 2 ** z, out = [];
  const px = ([lon, lat]) => [(lonToX(lon) * n - x) * extent, (latToY(lat) * n - y) * extent];
  for (const f of data.features) {
    for (const c of f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates) {
      const pts = c.map(px);
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1];
        if (Math.max(a[0], b[0]) < -reach || Math.min(a[0], b[0]) > extent + reach || Math.max(a[1], b[1]) < -reach || Math.min(a[1], b[1]) > extent + reach) continue;
        out.push([a, b]);
      }
    }
  }
  return out;
}

// The point on the drawn lines nearest to p, when one lies within reach.
function nearestOn(p, segs, reach) {
  let best = null, bd = reach;
  for (const [a, b] of segs) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const q = [a[0] + t * dx, a[1] + t * dy], d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}

// Where a cut left a new end next to the drawn line, extend it so the two meet. A cut sits a little
// off the drawn line by design, and without this the gap would show at high zoom.
function snapCutEnds(pieces, line, segs, reach) {
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];
  for (const piece of pieces) {
    const first = piece[0], last = piece[piece.length - 1];
    if (!same(first, line[0])) { const q = nearestOn(first, segs, reach); if (q) piece.unshift(q); }
    if (!same(last, line[line.length - 1])) { const q = nearestOn(last, segs, reach); if (q) piece.push(q); }
  }
}

// The same basemap tile with the country boundary lines that fall inside the regions cut away.
// Returns null when nothing in this tile needs to change, so the caller can keep the original bytes.
export function rewriteTile(bytes, z, x, y, opts = {}) {
  const regions = opts.regions || REGIONS;
  const profile = { ...PROFILE, ...(opts.profile || {}) };
  const tile = new VectorTile(new Pbf(bytes));
  const layer = tile.layers[profile.layer];
  if (!layer) return null;
  const live = tileRings(regions, z, x, y, layer.extent);
  if (!live.length) return null;

  const reach = (SNAP_DEG / 360) * 2 ** z * layer.extent;
  const segs = tileSnapLines(opts.data || boundary, z, x, y, layer.extent, reach);
  const kept = [];
  let changed = false;
  for (let i = 0; i < layer.length; i++) {
    const f = layer.feature(i);
    if (f.type !== 2 || !profile.match(f.properties)) { kept.push(f); continue; }
    const lines = f.loadGeometry().map((ring) => ring.map((p) => [p.x, p.y]));
    const pieces = [];
    for (const ln of lines) {
      const cut = clipOutside(ln, live);
      const untouched = cut.length === 1 && cut[0].length === ln.length && cut[0].every((q, m) => q[0] === ln[m][0] && q[1] === ln[m][1]);
      if (!untouched) snapCutEnds(cut, ln, segs, reach);
      pieces.push(...cut);
    }
    const same = pieces.length === lines.length && pieces.every((p, k) => p.length === lines[k].length && p.every((q, m) => q[0] === lines[k][m][0] && q[1] === lines[k][m][1]));
    if (same) { kept.push(f); continue; }
    changed = true;
    if (!pieces.length) continue;
    const rings = pieces.map((p) => p.map(([px, py]) => ({ x: Math.round(px), y: Math.round(py) })));
    kept.push({ id: f.id, type: 2, properties: f.properties, loadGeometry: () => rings });
  }
  if (!changed) return null;

  const layers = {};
  for (const name of Object.keys(tile.layers)) layers[name] = tile.layers[name];
  layers[profile.layer] = { version: layer.version, name: layer.name, extent: layer.extent, length: kept.length, feature: (i) => kept[i] };
  return vtpbf.fromVectorTileJs({ layers });
}
