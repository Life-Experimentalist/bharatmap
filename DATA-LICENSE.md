# Data license

The source code in this repository is under the Apache License 2.0 (see LICENSE).

The boundary lines in `src/data/india-boundary.geojson` (and the copy of them embedded in
`src/data/india-boundary.js`) are a separate work under the Open Database License (ODbL) 1.0,
https://opendatacommons.org/licenses/odbl/1-0/

What that means for you:

* You may use the lines in any map, including commercial ones, as long as you credit the source. The
  module adds the credit "India boundary: Survey of India depiction, (c) OpenStreetMap contributors (ODbL)"
  to the map's attribution control. Keep it.
* If you change the lines and publish the changed data, publish it under ODbL too.
* ODbL applies to the data, not to your application code or the maps you draw with it.

Where the data comes from:

* Most pieces (the features marked `"source": "osm"`) are derived from OpenStreetMap, (c) OpenStreetMap
  contributors, ODbL, through https://github.com/lux-in-tenebris-lucet/leaflet-india-boundary.
* A few pieces (`"source": "hand"`) were drawn by hand to close short stretches.
* A few short connectors (`"source": "basemap"`) were copied from the CARTO basemap, whose boundary lines
  are themselves derived from OpenStreetMap, so that the drawn line meets the ordinary border exactly.
