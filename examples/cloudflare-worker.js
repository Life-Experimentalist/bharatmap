// A Cloudflare Worker that serves corrected vector tiles at /{z}/{x}/{y}.pbf. Point any vector-tile map
// library at https://your-worker.example/{z}/{x}/{y}.pbf (Mapbox GL JS, OpenLayers, Tangram, QGIS) and the
// disputed lines are already cut out. Add the lines themselves from bharatmap's `boundary` GeoJSON.
//
//   npm install bharatmap, then deploy this file with wrangler.
import { tileProxy } from "bharatmap";

export default {
  fetch: tileProxy("https://tiles.example.com/planet/{z}/{x}/{y}.pbf"),
};
