# Basemaps

## What a basemap needs

The module works with a vector basemap whose tiles have:

* a layer named `boundary`;
* country lines marked `admin_level` = 2;
* a numeric `maritime` property (0 on land);
* a `disputed` property (1 on disputed lines).

That is the OpenMapTiles schema. CARTO, OpenFreeMap, MapTiler and Stadia all use it. Check yours by
opening a tile in a vector tile inspector (for example maputnik.github.io, or `npm run verify:coverage
-- --tiles URL_TEMPLATE`) and looking at the `boundary` layer.

## Checking a new basemap

```
node scripts/verify-coverage.mjs --tiles "https://example.com/tiles/{z}/{x}/{y}.pbf" --zmin 1 --zmax 10
```

Zero free ends at every zoom means the cut and the drawn line meet. If a zoom range reports many free
ends, the basemap probably does not flag its disputed lines, or flags them differently (see below).

## Another schema

If the layer name or properties differ, pass a profile. `PROFILE` in `src/config.js` has the three parts:

* `layer`: the tile layer name;
* `match(properties)`: true for a country line the module should cut;
* `isCountryLayer(styleLayer)`: true for the style layers that draw country lines.

`rewriteTile(bytes, z, x, y, { profile })` takes an override for the first two. `fixStyle` uses the
default `isCountryLayer`; copy `fixStyle` into your project and swap it if your style names things
differently.

If the basemap does not flag disputed lines at all, `match` can test the two countries on each side of
the line instead (for example `adm0_l` and `adm0_r` as CHN and IND), as long as the tile has them at the
zoom you care about. Check the low zooms, where some basemaps drop those properties.

## Raster basemaps

Not supported for cutting. See the Leaflet section of the README.
