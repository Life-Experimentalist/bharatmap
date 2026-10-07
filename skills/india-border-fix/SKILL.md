---
name: india-border-fix
description: Use when a web map (MapLibre GL, Leaflet, deck.gl on a vector basemap) shows India's borders wrongly, or when asked to draw India's boundary per the Survey of India, fix the Kashmir, Ladakh or Arunachal Pradesh borders, or integrate the india-border-fix module into an existing map.
---

# Integrating india-border-fix

The module cuts the basemap's disputed country lines out of vector tiles as they load and adds India's
boundary lines in their place. You wire it into the project's existing map code. Do not rewrite the
map. Work in this order and stop to report if a step does not hold.

## 1. Find out what the project uses

Search the code for the map library and the basemap:

* `maplibre-gl` / `maplibregl.Map`: MapLibre. Direct integration.
* `leaflet` with `maplibre-gl-leaflet` (`L.maplibreGL`): vector, works as MapLibre.
* `leaflet` with plain `L.tileLayer("...png")`: raster. Cutting is impossible. Tell the user, offer a
  vector basemap, and otherwise only overlay the lines (the raster's own line stays visible).
* `mapbox-gl`: close to MapLibre but `addProtocol` differs by version and the licence is different. Ask first.
* `deck.gl` with a MapLibre base map: integrate at the MapLibre style, not in deck.gl.
* OpenLayers, Google Maps, Apple Maps: not supported. Say so.

Find the style: a URL string, an object, or a function that returns one per theme. Find where `setStyle`
is called, since every style needs the fix.

## 2. Check the basemap schema

The basemap needs a `boundary` layer with `admin_level` 2, `maritime` and `disputed` properties
(OpenMapTiles schema: CARTO, OpenFreeMap, MapTiler, Stadia). Confirm by looking at the style JSON for
layers with `"source-layer": "boundary"`. For other schemas read docs/basemaps.md and use a custom profile.

## 3. Install and wire

```
npm install india-border-fix
```

```js
import { install, fixStyle } from "india-border-fix";
install(maplibregl);                    // once, before any map is created
const style = await fixStyle(styleUrlOrObject);   // every style, including theme switches
```

Pass the result where the original style went. If the project switches theme with `map.setStyle`, run the
new style through `fixStyle` first. If the project hides a glow or outline layer, pass
`{ skip: (layer) => layer.id === "..." }` for it rather than editing the module.

Keep the data attribution: the module adds it as a source attribution, so do not strip the attribution
control.

## 4. Verify, at several zooms

Do not report success from the code alone.

1. `npm run verify:coverage` from the module repo (or against the project's tile URL with `--tiles`) must
   report zero free ends at zoom 1 to 10.
2. Open the app. Look at these views in each theme:
   * Zoom 2 to 3, whole world: no stray dashed or solid line over Ladakh, Kashmir or Aksai Chin other
     than the single Indian boundary.
   * Zoom 5 to 7 over Arunachal Pradesh: one continuous border, and the Myanmar border and Bhutan border
     still drawn.
   * Zoom 9 to 12 at the points where the Indian boundary meets Himachal Pradesh and the Bhutan border:
     no gaps, no doubled lines.
3. Check the map credits show the data attribution.

If you find a gap, note the zoom and the coordinates. Fixes belong in the module's `REGIONS`, not as
workarounds in the app.

## 5. Report

State what you changed, which basemaps and zooms you checked, and any limit that applies (raster tiles,
unsupported library, printing). Do not claim legal authority for the line.
