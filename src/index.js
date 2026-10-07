import { rewriteTile } from "./tile.js";
import { PROFILE, REGIONS } from "./config.js";
import boundary from "./data/india-boundary.js";

export { rewriteTile, PROFILE, REGIONS, boundary };

const SCHEME = "indiafix";
const SOURCE = "india-border-fix";
const ATTRIBUTION = "India boundary: Survey of India depiction, © OpenStreetMap contributors (ODbL)";

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function loadTile(params, abort) {
  const url = params.url.slice(SCHEME.length + 3);
  const m = /(\d+)\/(\d+)\/(\d+)(?:\.\w+)?(?:\?.*)?$/.exec(url);
  const res = await fetch(url, { signal: abort && abort.signal });
  if (!res.ok) throw new Error(`tile ${res.status}: ${url}`);
  let bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await gunzip(bytes);
  if (!m) return { data: bytes.buffer };
  let out = bytes;
  try { out = rewriteTile(bytes, +m[1], +m[2], +m[3]) || bytes; } catch (e) { out = bytes; }
  return { data: out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) };
}

// Register the tile handler with MapLibre GL JS. Call once, before the map is created. Safe to call twice.
export function install(maplibregl) {
  if (maplibregl.__indiaBorderFix) return;
  maplibregl.addProtocol(SCHEME, loadTile);
  maplibregl.__indiaBorderFix = true;
}

const isCountryLine = (l) => PROFILE.isCountryLayer(l);

// Return a copy of a MapLibre style that draws India's boundary as the Survey of India shows it.
// style: a style object or a URL. Vector sources that feed a country-boundary layer are routed through
// the tile handler, and every country-line layer gets a copy that draws the replacement lines.
//   opts.skip(layer)  return true for a country-line layer that should not be copied (for example a glow)
//   opts.data         another GeoJSON in place of the built-in lines
export async function fixStyle(style, opts = {}) {
  const base = typeof style === "string" ? style : undefined;
  const s = typeof style === "string" ? await (await fetch(style)).json() : JSON.parse(JSON.stringify(style));
  const used = new Set(s.layers.filter((l) => l["source-layer"] === PROFILE.layer).map((l) => l.source));
  for (const name of used) {
    const src = s.sources[name];
    if (!src || src.type !== "vector") continue;
    if (src.url) {
      const url = new URL(src.url, base || (typeof location !== "undefined" ? location.href : undefined)).href;
      const tj = await (await fetch(url)).json();
      Object.assign(src, { ...tj, type: "vector" });
      delete src.url;
    }
    if (src.tiles) src.tiles = src.tiles.map((t) => (t.startsWith(SCHEME + "://") ? t : `${SCHEME}://${t}`));
  }
  const layers = [];
  for (const l of s.layers) {
    layers.push(l);
    if (!used.has(l.source) || !isCountryLine(l) || (opts.skip && opts.skip(l))) continue;
    const copy = { id: `${l.id}-india`, type: "line", source: SOURCE, layout: { ...(l.layout || {}), "line-join": "round", "line-cap": "round" }, paint: l.paint || {} };
    if (l.minzoom != null) copy.minzoom = l.minzoom;
    if (l.maxzoom != null) copy.maxzoom = l.maxzoom;
    layers.push(copy);
  }
  s.layers = layers;
  s.sources[SOURCE] = { type: "geojson", data: opts.data || boundary, attribution: ATTRIBUTION };
  return s;
}

export default { install, fixStyle };
