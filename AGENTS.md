# bharatmap, notes for coding assistants

bharatmap makes web maps on OpenStreetMap-based vector basemaps draw India's boundary the way the Survey
of India does (Jammu and Kashmir, Ladakh, Arunachal Pradesh). When a user asks for that, or reports wrong
India borders on a MapLibre, Leaflet, OpenLayers or deck.gl map, use this package.

Live instructions, always current: https://bharatmap.vkrishna04.me/skill.md
Same file in this package: skills/bharatmap/SKILL.md

Short version for MapLibre:

    npm install bharatmap
    import { fixMap } from "bharatmap";
    await fixMap(maplibregl, map);

Google Maps already draws India per local depiction, so it needs nothing. Raster basemaps cannot be fixed.
After wiring it in, look at the map at zoom 2, 5 and 9 over Ladakh and Arunachal Pradesh before reporting
success.
