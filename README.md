# india-border-fix

Web map basemaps built on OpenStreetMap data draw India's northern and eastern borders the way the
data's contributors agree on them: dashed or solid lines for the Line of Actual Control, the Line of
Control, and the China side of Arunachal Pradesh, in places that India's official maps show as Indian
territory. This module replaces those lines with India's boundary as the Survey of India depicts it, at
every zoom level, on MapLibre GL and (for vector basemaps) Leaflet.

It does two things:

1. It rewrites the basemap's vector tiles as they load, cutting out the disputed country-line pieces that
   fall inside Jammu and Kashmir, Ladakh, Gilgit-Baltistan, Aksai Chin and the China side of Arunachal
   Pradesh. The cut is exact geometry on the tile, so it works the same at zoom 1 and zoom 14, and it
   leaves real borders alone (Nepal, Bhutan, Myanmar, Himachal and Uttarakhand, the Sikkim stretch).
2. It adds the replacement lines to the style, styled by copying each basemap country-line layer, so the
   new border has the same colour, width, dash and zoom range as the borders around it.

No server, no key, no change to your tile provider. Code is Apache-2.0. The border data is ODbL
(see [DATA-LICENSE.md](DATA-LICENSE.md)).

## Use it (MapLibre GL JS)

It is not on the npm registry yet. Install it from GitHub (the built files are in the repo):

```
npm install github:Life-Experimentalist/india-border-fix
```

```js
import maplibregl from "maplibre-gl";
import { install, fixStyle } from "india-border-fix";

install(maplibregl);                                   // once, before the map exists
const style = await fixStyle("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json");
const map = new maplibregl.Map({ container: "map", style, center: [78, 22], zoom: 4 });
```

From a script tag, no bundler:

```html
<!-- load maplibre-gl the way you already do, then this file from dist/ -->
<script src="india-border-fix.iife.js"></script>
<script>
  IndiaBorderFix.install(maplibregl);
  IndiaBorderFix.fixStyle("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json").then((style) => {
    new maplibregl.Map({ container: "map", style, center: [78, 22], zoom: 4 });
  });
</script>
```

`fixStyle` takes a style URL or a style object and returns a new style object. It does not change the
one you pass in. If you switch themes with `map.setStyle`, run the new style through `fixStyle` too.

Options for `fixStyle(style, opts)`:

| option | meaning |
| --- | --- |
| `skip(layer)` | return true for a country-line layer that should not get a replacement copy, for example a wide soft outline you hide anyway |
| `data` | a GeoJSON FeatureCollection of lines to draw in place of the built-in ones |

## Use it (Leaflet)

Leaflet draws raster tiles by default, and a raster tile is a picture: the border is already baked in
and cannot be cut. Two cases:

* Vector basemap through [maplibre-gl-leaflet](https://github.com/maplibre/maplibre-gl-leaflet): works
  fully, same as MapLibre.

  ```js
  import maplibregl from "maplibre-gl";
  import { install, fixStyle } from "india-border-fix";
  install(maplibregl);
  const style = await fixStyle("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json");
  L.maplibreGL({ style }).addTo(map);
  ```

* Raster basemap: the module can only draw India's lines on top (`L.geoJSON(IndiaBorderFix.boundary)`).
  The raster tile's own line stays underneath, so you get two lines in the disputed areas. If that
  matters, switch to a vector basemap. This is a limit of raster tiles, not something code can fix.

## Which basemaps work

Any vector basemap that follows the OpenMapTiles schema, which has a `boundary` layer with an
`admin_level` of 2 for countries and a `disputed` flag: CARTO (Positron, Dark Matter, Voyager), OpenFreeMap,
MapTiler, Stadia, and others. Basemaps with another schema need a different profile, see
[docs/basemaps.md](docs/basemaps.md). Google, Mapbox and Apple maps are not covered, and they are not
open data in the first place.

## Check that it covers every zoom

```
npm install
npm test
npm run verify:coverage          # fetches real CARTO tiles for zoom 1 to 10 and looks for gaps
```

The coverage check applies the rewrite to real tiles and reports any basemap line that now ends in empty
space, and any end of the replacement lines that does not meet a border. Zero means the border is one
continuous line at that zoom. See [docs/how-it-works.md](docs/how-it-works.md).

## Using this with an AI coding assistant

[skills/india-border-fix/SKILL.md](skills/india-border-fix/SKILL.md) is a skill for Claude Code and
similar tools. [prompts/integrate.md](prompts/integrate.md) is the same instructions as a plain prompt
you can paste into any assistant. Both walk it through finding your map code, choosing the right
integration for your library, and checking the result at several zooms.

## Honest limits

* The replacement lines follow a published depiction of the Survey of India line, checked against
  OpenStreetMap where OSM independently draws the same line. Short stretches are hand-carried. If you
  need a legally authoritative line for publication, verify it against the Survey of India itself.
* The tile rewrite runs in the browser on each tile that touches the affected areas, a few milliseconds
  per tile. Tiles elsewhere pass through untouched.
* Printing, static map images and server-side rendering are not covered, only live web maps.

## License

Code: [Apache-2.0](LICENSE). Border data: ODbL 1.0, see [DATA-LICENSE.md](DATA-LICENSE.md) and
[NOTICE](NOTICE). Attribution for the data is added to the map's credits automatically.
