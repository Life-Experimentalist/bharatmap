# Prompt: integrate india-border-fix into my map

Paste this into any coding assistant, with your project open.

---

My web map shows India's borders the way the OpenStreetMap-based basemap does (LAC, LoC and the China
side of Arunachal Pradesh in the wrong place, sometimes as stray lines at world zoom). I want India's
boundary as the Survey of India depicts it. Use the `india-border-fix` module
(https://github.com/Life-Experimentalist/india-border-fix) to do that. Work like this:

1. Find which map library and basemap the project uses. If it is MapLibre GL, or Leaflet through
   `maplibre-gl-leaflet`, continue. If it is Leaflet with raster `.png` tiles, tell me the raster border
   cannot be cut and ask whether to switch to a vector basemap. If it is anything else, tell me and stop.
2. Check the basemap is an OpenMapTiles-schema vector style (layers with `"source-layer": "boundary"`).
   If not, read docs/basemaps.md in the module and tell me what the profile would need.
3. `npm install india-border-fix`, call `install(maplibregl)` once before the map is created, and pass
   every style the app uses (including each theme and every `setStyle` call) through
   `await fixStyle(style)`. Change as little of the existing code as you can.
4. Run the app and look at the map at zoom 2, 3, 5, 7, 9 and 12, over Ladakh and Kashmir, Arunachal
   Pradesh, and where the boundary meets Himachal Pradesh and Bhutan, in light and dark themes. There must
   be one continuous Indian boundary, no stray lines, and the Myanmar and Bhutan borders must still be
   drawn. Fix problems by reporting them, not by adding workarounds.
5. Tell me what you changed and what you checked.
