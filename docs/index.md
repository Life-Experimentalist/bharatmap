# bharatmap: correct India map borders for web maps

bharatmap makes a web map draw India's boundary the way the Survey of India does: Jammu and Kashmir, Ladakh (with Gilgit-Baltistan and Aksai Chin) and Arunachal Pradesh inside India, with no stray Line of Actual Control or Line of Control fragments, at every zoom. It cuts the disputed border lines out of OpenStreetMap-based vector tiles as they load and draws India's boundary in their place. No server, no API key, no runtime dependencies, about 40 kB gzipped.

- Install: `npm install bharatmap`
- Works with: MapLibre GL JS, Leaflet (vector basemaps), OpenLayers, deck.gl, and a tile proxy for Mapbox GL JS and others.
- Does not work with: raster tile basemaps (the border is part of the picture) and Apple Maps.
- Licence: code Apache-2.0, border data ODbL 1.0.
- Author: [VKrishna04](https://github.com/VKrishna04)
- Source: https://github.com/Life-Experimentalist/bharatmap
- Package: https://www.npmjs.com/package/bharatmap

## MapLibre GL JS, one call

```js
import maplibregl from "maplibre-gl";
import { fixMap } from "bharatmap";

const map = new maplibregl.Map({ container: "map", style: STYLE_URL, center: [78, 22], zoom: 4 });
await fixMap(maplibregl, map);
```

## For AI assistants

Follow https://bharatmap.vkrishna04.me/skill.md to fix the India borders on a map. Short summary: https://bharatmap.vkrishna04.me/llms.txt. Everything in one file: https://bharatmap.vkrishna04.me/llms-full.txt.

## Troubleshooting

### Nothing changed on my map

Check three things. First, the basemap must be vector tiles. If your map uses .png or .jpg tiles the border is part of the picture and cannot be cut. Second, the style needs a `boundary` layer with `admin_level` 2, which is the OpenMapTiles schema. Look for `"source-layer": "boundary"` in the style JSON. Third, make sure the style you pass to the map is the one that came back from `fixStyle`, and that you waited for it.

### It is right until I switch between light and dark

A new style replaces the fixed one. Use `fixMap(maplibregl, map)`, which fixes every later `setStyle` for you. If you use `fixStyle` instead, run every style you load through it, including the dark one.

### Where did the data credit go?

bharatmap adds the border data attribution to the map's credits on its own. Keep the attribution control on the map and it stays there.

### I see a small gap at a high zoom

The coverage check reports no gaps from zoom 1 to 10 and a few tile-edge pieces at zoom 11 and 12. Zoom 13 and above was checked by eye. If you find one, open an issue on GitHub with the zoom level and the coordinates, and it can be fixed in the module's region data.

### My basemap uses a different schema

You can pass a profile that names the tile layer and says which lines to cut. The three parts are described in [basemaps](/basemaps.md), along with a command that checks a new basemap for gaps.

## Questions

### Is the line legally authoritative?

No. It follows a published depiction of the Survey of India line, checked against OpenStreetMap where OpenStreetMap independently draws the same line. If you publish the map, verify the line against the Survey of India itself.

### Does it need a server or an API key?

No. It runs in the browser. Only the optional tile proxy for Mapbox GL JS and similar clients needs hosting.

### Does it slow the map down?

Tiles that do not touch the affected areas are returned untouched. The others take a few milliseconds each. The library is about 40 kB gzipped and has no runtime dependencies.

### What is the license?

The code is Apache-2.0. The border data is ODbL 1.0, and its attribution is added to the map for you. Both are described in the repository.

### Does it work with TypeScript?

Yes. Types ship with the package.

Not legally authoritative: verify against the Survey of India before publishing.
