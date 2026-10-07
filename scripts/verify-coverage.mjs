// Fetches real basemap tiles over the removal regions at each zoom, applies the module's rewrite and
// looks for gaps in the border network. After the rewrite, every free end of a country line inside
// (or just outside) the regions must meet either a drawn line or another basemap line. A free end
// that touches nothing is a gap a person would see.
//
//   node scripts/verify-coverage.mjs [--tiles TILEJSON_URL_OR_TEMPLATE] [--tol-px 3] [--zmin 1] [--zmax 10]
import zlib from "node:zlib";
import { readFileSync } from "node:fs";
import Pbf from "pbf";
import { VectorTile } from "@mapbox/vector-tile";
import { REGIONS, PROFILE, ringBox } from "../src/config.js";
import { rewriteTile } from "../src/tile.js";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const TILEJSON = arg("tiles", "https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json");
const TOLPX = +arg("tol-px", 3), ZMIN = +arg("zmin", 1), ZMAX = +arg("zmax", 10);
const tpl = TILEJSON.includes("{z}") ? TILEJSON : (await (await fetch(TILEJSON)).json()).tiles[0];
const gj = JSON.parse(readFileSync(new URL("../src/data/india-boundary.geojson", import.meta.url)));

const K = 111.32, COS = Math.cos((30 * Math.PI) / 180);
const toKm = ([lon, lat]) => [lon * K * COS, lat * K];
const segDist = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
// drawn lines
const drawn = [];
gj.features.forEach((f, id) => {
  for (const c of f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates)
    drawn.push({ id, pts: c.map(toKm) });
});
const nearLine = (p, lines, skipId) => {
  let best = 1e9;
  for (const l of lines) { if (l.id === skipId) continue; for (let i = 0; i + 1 < l.pts.length; i++) { const d = segDist(p, l.pts[i], l.pts[i + 1]); if (d < best) best = d; } }
  return best;
};
const tx2lon = (z, x, px, ext) => ((x + px / ext) / 2 ** z) * 360 - 180;
const ty2lat = (z, y, py, ext) => { const n = Math.PI - 2 * Math.PI * ((y + py / ext) / 2 ** z); return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); };
const BOXES = REGIONS.map(ringBox);
const near = (lon, lat, m) => BOXES.some(([w, s, e, n]) => lon >= w - m && lon <= e + m && lat >= s - m && lat <= n + m);
const lon2x = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2y = (lat, z) => { const s = Math.sin((lat * Math.PI) / 180); return Math.floor((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 2 ** z); };
const get = async (z, x, y) => {
  const r = await fetch(tpl.replace("{z}", z).replace("{x}", x).replace("{y}", y));
  if (!r.ok) return null;
  let b = Buffer.from(await r.arrayBuffer()); if (b[0] === 0x1f && b[1] === 0x8b) b = zlib.gunzipSync(b);
  return new Uint8Array(b);
};

let fail = 0;
for (let z = ZMIN; z <= ZMAX; z++) {
  const tilesAt = new Set();
  for (const [w, s, e, n] of BOXES)
    for (let x = lon2x(w - 0.5, z); x <= lon2x(e + 0.5, z); x++) for (let y = lat2y(n + 0.5, z); y <= lat2y(s - 0.5, z); y++) tilesAt.add(x + "," + y);
  const list = [...tilesAt].map((k) => k.split(",").map(Number));
  const kept = []; // basemap country lines left after the rewrite
  const ends = [];
  let id = 0;
  for (let i = 0; i < list.length; i += 2) {
    await new Promise((r) => setTimeout(r, 150)); // two at a time with a pause, to stay light on the machine
    await Promise.all(list.slice(i, i + 2).map(async ([x, y]) => {
      const raw = await get(z, x, y); if (!raw) return;
      const bytes = rewriteTile(raw, z, x, y) || raw;
      const layer = new VectorTile(new Pbf(bytes)).layers[PROFILE.layer]; if (!layer) return;
      for (let q = 0; q < layer.length; q++) {
        const f = layer.feature(q);
        if (f.type !== 2 || Number(f.properties.admin_level) !== 2 || Number(f.properties.maritime || 0) !== 0) continue;
        for (const ring of f.loadGeometry()) {
          const pts = ring.map((p) => { const ll = [tx2lon(z, x, p.x, layer.extent), ty2lat(z, y, p.y, layer.extent)]; return { ll, km: toKm(ll), inTile: p.x >= 0 && p.x <= layer.extent && p.y >= 0 && p.y <= layer.extent }; });
          const lid = ++id;
          kept.push({ id: lid, pts: pts.map((p) => p.km) });
          for (const e of [pts[0], pts[pts.length - 1]]) if (e.inTile && near(e.ll[0], e.ll[1], 0.4)) ends.push({ ...e, lid, props: f.properties, x, y });
        }
      }
    }));
  }
  const pxKm = (40075 * Math.cos((30 * Math.PI) / 180)) / (512 * 2 ** z), tol = Math.max(TOLPX * pxKm, 0.05);
  const bad = [];
  for (const e of ends) {
    // a tile-edge cut shows up as an end in a neighbour too, so a kept line that continues counts as a join
    const d = Math.min(nearLine(e.km, drawn, -1), nearLine(e.km, kept, e.lid));
    if (d > tol) bad.push({ ll: e.ll.map((v) => +v.toFixed(3)), d: +d.toFixed(2), name: e.props.disputed_name || "", tile: `${z}/${e.x}/${e.y}` });
  }
  // drawn line ends
  const dEnds = [];
  for (const l of drawn) for (const p of [l.pts[0], l.pts[l.pts.length - 1]]) dEnds.push({ km: p, id: l.id });
  const badD = [];
  for (const e of dEnds) {
    const d = Math.min(nearLine(e.km, drawn, e.id), nearLine(e.km, kept, -1));
    if (d > tol) badD.push({ id: e.id, d: +d.toFixed(2), at: [+(e.km[0] / K / COS).toFixed(3), +(e.km[1] / K).toFixed(3)] });
  }
  console.log(`z${z}: tiles ${list.length}, tol ${tol.toFixed(2)} km, basemap free ends ${bad.length}, drawn free ends ${badD.length}`);
  for (const b of bad.slice(0, +arg("show", 6))) console.log("   basemap end", JSON.stringify(b));
  for (const b of badD.slice(0, +arg("show", 6))) console.log("   drawn end", JSON.stringify(b));
  fail += bad.length + badD.length;
}
process.exit(fail ? 1 : 0);
