import { PROFILE, REGIONS } from "./config.js";
import { rewriteTile } from "./tile.js";
import { loadRewritten } from "./load.js";
import { tileProxy } from "./proxy.js";
import { olTileLoadFunction } from "./openlayers.js";
import boundary from "./data/india-boundary.js";

export { rewriteTile, tileProxy, olTileLoadFunction, PROFILE, REGIONS, boundary };

const SCHEME = "indiafix";
const SOURCE = "bharatmap";
const ATTRIBUTION = "India boundary: Survey of India depiction, © OpenStreetMap contributors (ODbL)";

async function loadTile(params, abort) {
  const bytes = await loadRewritten(params.url.slice(SCHEME.length + 3), abort && abort.signal);
  return { data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
}

// Register the tile handler with MapLibre GL JS. Call once, before the map is created. Safe to call twice.
export function install(maplibregl) {
  if (maplibregl.__bharatmap) return;
  maplibregl.addProtocol(SCHEME, loadTile);
  maplibregl.__bharatmap = true;
}

const isCountryLine = (l) => PROFILE.isCountryLayer(l);

// Return a copy of a map style that draws India's boundary as the Survey of India shows it.
// style: a style object or a URL. Vector sources that feed a country-boundary layer are routed through
// the tile handler, and every country-line layer gets a copy that draws the replacement lines.
//   opts.skip(layer)   return true for a country-line layer that should not be copied (for example a glow)
//   opts.data          another GeoJSON in place of the built-in lines
//   opts.protocol      false to leave tile URLs alone (OpenLayers loads tiles itself, see olTileLoadFunction)
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
    if (src.tiles && opts.protocol !== false) {
      src.tiles = src.tiles.map((t) => (t.startsWith(SCHEME + "://") ? t : `${SCHEME}://${t}`));
    }
  }
  const have = new Set(s.layers.map((l) => l.id));
  const layers = [];
  for (const l of s.layers) {
    layers.push(l);
    if (!used.has(l.source) || !isCountryLine(l) || (opts.skip && opts.skip(l)) || have.has(`${l.id}-india`)) continue;
    const copy = { id: `${l.id}-india`, type: "line", source: SOURCE, layout: { ...(l.layout || {}), "line-join": "round", "line-cap": "round" }, paint: l.paint || {} };
    if (l.minzoom != null) copy.minzoom = l.minzoom;
    if (l.maxzoom != null) copy.maxzoom = l.maxzoom;
    layers.push(copy);
  }
  s.layers = layers;
  s.sources[SOURCE] = { type: "geojson", data: opts.data || boundary, attribution: ATTRIBUTION };
  return s;
}

// The one-call route for MapLibre GL JS: fixes the map's current style and every style set on it later
// (theme switches), so the rest of your code stays as it is.
//   await fixMap(maplibregl, map)
export async function fixMap(maplibregl, map, opts = {}) {
  install(maplibregl);
  const set = map.setStyle.bind(map);
  let latest = 0;
  const apply = async (style, options) => {
    const mine = ++latest;
    let fixed = style;
    try { fixed = await fixStyle(style, opts); } catch (e) { /* keep the original style */ }
    if (mine === latest) set(fixed, options);
  };
  map.setStyle = (style, options) => {
    if (!style) set(style, options); else apply(style, options);
    return map;
  };
  const current = map.getStyle();
  if (current && current.layers && current.layers.length) await apply(current);
  return map;
}

export default { install, fixStyle, fixMap, tileProxy, olTileLoadFunction, boundary };
