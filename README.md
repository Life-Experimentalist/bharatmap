<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/logo-dark.svg"><img src="docs/logo.svg" alt="bharatmap" height="72"></picture></p>

# bharatmap: correct India map borders for web maps

[![npm version](https://img.shields.io/npm/v/bharatmap?style=flat-square&color=000000&labelColor=737373)](https://www.npmjs.com/package/bharatmap)
[![npm downloads per month](https://img.shields.io/npm/dm/bharatmap?style=flat-square&color=000000&labelColor=737373)](https://www.npmjs.com/package/bharatmap)
[![GitHub stars](https://img.shields.io/github/stars/Life-Experimentalist/bharatmap?style=flat-square&color=000000&labelColor=737373)](https://github.com/Life-Experimentalist/bharatmap)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/bharatmap?style=flat-square&color=000000&labelColor=737373)](https://bundlephobia.com/package/bharatmap)
[![Types included](https://img.shields.io/npm/types/bharatmap?style=flat-square&color=000000&labelColor=737373)](https://www.npmjs.com/package/bharatmap)
[![License](https://img.shields.io/npm/l/bharatmap?style=flat-square&color=000000&labelColor=737373)](LICENSE)

[![bharatmap: correct India borders on web maps](https://bharatmap.vkrishna04.me/og.png)](https://bharatmap.vkrishna04.me/)

Site and live demo: https://bharatmap.vkrishna04.me/. Made by [VKrishna04](https://github.com/VKrishna04).

bharatmap makes a web map draw India's boundary the way the Survey of India does: Jammu and Kashmir,
Ladakh (with Gilgit-Baltistan and Aksai Chin) and Arunachal Pradesh inside India, with no stray Line of
Actual Control or Line of Control fragments, at every zoom level. It works with MapLibre GL JS, Leaflet
(vector basemaps), OpenLayers and deck.gl, and a tile proxy covers other vector-tile libraries.

```
npm install bharatmap
```

No runtime dependencies, about 40 kB gzipped, Apache-2.0.

## Why your map shows India wrongly

Free basemaps (CARTO, OpenFreeMap, MapTiler, Stadia and others) are built from OpenStreetMap, whose
contributors draw disputed borders as the lines on the ground. So an OSM-based map shows the LAC and LoC
and the China side of Arunachal Pradesh as international borders, often as dashed fragments that are still
visible at world zoom. A style filter cannot fix this: the tile builder merges several disputed borders
into one long line, so a filter removes all of it or none of it, and a box big enough to catch the strays
also deletes real borders (Myanmar, Bhutan) in Arunachal Pradesh.

bharatmap cuts the geometry inside each vector tile as it loads, then draws India's boundary in its place,
styled to match the other borders of the basemap. No server, no API key, no change of tile provider.

## MapLibre GL JS (one call)

```js
import maplibregl from "maplibre-gl";
import { fixMap } from "bharatmap";

const map = new maplibregl.Map({ container: "map", style: STYLE_URL, center: [78, 22], zoom: 4 });
await fixMap(maplibregl, map);   // fixes this style and every later map.setStyle (theme switches too)
```

Or fix the style before the map exists:

```js
import { install, fixStyle } from "bharatmap";
install(maplibregl);
const map = new maplibregl.Map({ container: "map", style: await fixStyle(STYLE_URL) });
```

From a script tag, no bundler:

```html
<script src="https://cdn.jsdelivr.net/npm/bharatmap@0.2.0/dist/bharatmap.iife.js"></script>
<script>
  BharatMap.install(maplibregl);
  BharatMap.fixStyle("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json").then((style) => {
    new maplibregl.Map({ container: "map", style, center: [78, 22], zoom: 4 });
  });
</script>
```

## Which libraries work

| Library | How | Checked |
| --- | --- | --- |
| MapLibre GL JS | `fixMap(maplibregl, map)` or `fixStyle` | in a browser, light and dark, zoom 2 to 14 |
| Leaflet with a vector basemap ([maplibre-gl-leaflet](https://github.com/maplibre/maplibre-gl-leaflet)) | `fixStyle`, then `L.maplibreGL({ style })` | in a browser, [examples/leaflet.html](examples/leaflet.html) |
| OpenLayers with [ol-mapbox-style](https://github.com/openlayers/ol-mapbox-style) | `fixStyle(url, { protocol: false })` and `olTileLoadFunction` | in a browser, [examples/openlayers.html](examples/openlayers.html) |
| deck.gl, react-map-gl, Vue and Angular wrappers on MapLibre | same as MapLibre, on the map or style you pass in | same engine, not tested separately |
| Mapbox GL JS, Tangram, QGIS, any other vector-tile client | `tileProxy`, a fetch handler you host ([examples/cloudflare-worker.js](examples/cloudflare-worker.js)) | unit tests only |
| Leaflet with raster tiles | overlay only: `L.geoJSON(BharatMap.boundary)` | the raster's own line stays underneath |
| Google Maps | not needed | Google already draws India's borders per local depiction on its own |
| Apple Maps | not possible | the vendor decides what it draws |

A raster tile is a picture, so a border baked into it cannot be cut. Use a vector basemap.

Mapbox's own styles have a worldview setting that is meant for this, so on Mapbox basemaps check their
documentation first. bharatmap is for the open basemaps that have no such setting.

### Leaflet

```js
import maplibregl from "maplibre-gl";
import { install, fixStyle } from "bharatmap";
install(maplibregl);
const style = await fixStyle("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json");
L.maplibreGL({ style }).addTo(map);
```

### OpenLayers

```js
import { fixStyle, olTileLoadFunction } from "bharatmap";
import { apply } from "ol-mapbox-style";
import VectorTileSource from "ol/source/VectorTile";

await apply(map, await fixStyle(STYLE_URL, { protocol: false }));
map.getAllLayers().forEach((layer) => {
  const source = layer.getSource && layer.getSource();
  if (source instanceof VectorTileSource) { source.setTileLoadFunction(olTileLoadFunction); source.refresh(); }
});
```

### Any other vector-tile client

Host the corrected tiles and point the client at them. `tileProxy(upstream)` returns a fetch handler for
Cloudflare Workers, Deno, Bun or Node 18 and later that serves `/{z}/{x}/{y}.pbf`. The replacement lines
are in `boundary`, a GeoJSON FeatureCollection you can add to any map.

## Options

`fixStyle(style, opts)` takes a style URL or object and returns a new style. It does not change the one
you pass in.

| option | meaning |
| --- | --- |
| `skip(layer)` | return true for a country-line layer that should not get a replacement copy, for example a wide soft outline you hide anyway |
| `data` | a GeoJSON FeatureCollection of lines to draw in place of the built-in ones |
| `protocol` | `false` leaves tile URLs alone (OpenLayers) |

TypeScript types are included.

## Which basemaps work

Any vector basemap that follows the OpenMapTiles schema, which has a `boundary` layer with `admin_level` 2
for countries and a `disputed` flag: CARTO (Positron, Dark Matter, Voyager), OpenFreeMap, MapTiler, Stadia
and others. Other schemas need a profile, see [docs/basemaps.md](docs/basemaps.md).

## Questions

**Why does my map show Kashmir or Arunachal Pradesh wrongly?** The basemap is built from OpenStreetMap,
which does not follow India's official depiction. See above.

**Does it work at every zoom?** Yes, because it edits the tile geometry rather than filtering. The coverage
check reports zero gaps from zoom 1 to 10 and a few tile-edge pieces at zoom 11 and 12. Zoom 13 and
above was checked by eye. See [docs/how-it-works.md](docs/how-it-works.md).

**Does it slow the map down?** Tiles that do not touch the affected areas are returned untouched. The
others take a few milliseconds each in the browser.

**Does it need a server or an API key?** No. Only the optional tile proxy needs hosting.

**Is the line legally authoritative?** No. It follows a published depiction of the Survey of India line,
checked against OpenStreetMap where OSM independently draws the same line. For publication, verify it
against the Survey of India itself.

**Can an AI assistant add it to my project?** Yes. [skills/bharatmap/SKILL.md](skills/bharatmap/SKILL.md)
is a skill for Claude Code and similar tools, and [prompts/integrate.md](prompts/integrate.md) is the same
instructions as a prompt for any assistant. [llms.txt](llms.txt) is a short summary for crawlers.

## Let your AI assistant do it

One command puts the instructions where your assistant looks (Claude Code, Cursor, Copilot, Windsurf,
Gemini CLI, or AGENTS.md for the rest):

```
npx bharatmap init
```

Then ask: "fix the India borders on my map with bharatmap". Claude Code users can also install it as a plugin:

```
/plugin marketplace add Life-Experimentalist/bharatmap
/plugin install bharatmap@bharatmap
```

Any assistant that can read a URL can be told: "follow https://bharatmap.vkrishna04.me/skill.md". That file
is always the current version.

## Check it yourself

```
npm install
npm test
npm run verify:coverage          # fetches real CARTO tiles for zoom 1 to 10 and looks for gaps
```

## Limits

* The replacement lines are a depiction, short stretches are hand-carried. See the question above.
* Printing, static map images and server-side rendering are not covered, only live web maps.
* Mapbox GL JS cannot intercept tile requests the way MapLibre can, so it needs the tile proxy.

## License

Code: [Apache-2.0](LICENSE). Border data: ODbL 1.0, see [DATA-LICENSE.md](DATA-LICENSE.md) and
[NOTICE](NOTICE). Attribution for the data is added to the map's credits automatically.
