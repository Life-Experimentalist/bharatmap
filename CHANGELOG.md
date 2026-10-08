# Changelog

## 0.2.0

First npm release. The project was called india-border-fix on GitHub before this.

* Renamed to bharatmap. Files are now `dist/bharatmap.esm.js` and `dist/bharatmap.iife.js`, the browser
  global is `BharatMap`.
* `fixMap(maplibregl, map)`: one call that fixes the current style and every later `setStyle`.
* `tileProxy(upstream)`: fetch handler that serves corrected tiles, for Mapbox GL JS and other clients.
* `olTileLoadFunction` and `fixStyle(..., { protocol: false })` for OpenLayers.
* Leaflet and OpenLayers examples, TypeScript types, `exports` map, `llms.txt`.
* `fixStyle` no longer adds a second copy of the replacement layers when run on a style that was already fixed.

## 0.1.0

Tile rewrite for MapLibre GL JS, replacement lines for Jammu and Kashmir, Ladakh and Arunachal Pradesh,
coverage check for zoom 1 to 10.
