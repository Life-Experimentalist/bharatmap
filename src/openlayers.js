import { loadRewritten } from "./load.js";

// For ol/source/VectorTile: new VectorTile({ ..., tileLoadFunction: olTileLoadFunction }), or
// source.setTileLoadFunction(olTileLoadFunction). Cuts the disputed lines out of each tile before OpenLayers
// parses it.
export function olTileLoadFunction(tile, url) {
  const coord = tile.getTileCoord();
  tile.setLoader((extent, resolution, projection) => {
    loadRewritten(url, undefined, coord).then((bytes) => {
      const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      tile.setFeatures(tile.getFormat().readFeatures(data, { extent, featureProjection: projection }));
    }).catch(() => tile.setState(3));
  });
}
