import type { FeatureCollection } from "geojson";

export interface FixOptions {
  /** Return true for a country-line layer that should not get a replacement copy. */
  skip?: (layer: any) => boolean;
  /** Lines to draw in place of the built-in ones. */
  data?: FeatureCollection;
  /** false leaves tile URLs alone (OpenLayers). */
  protocol?: boolean;
}

export function install(maplibregl: any): void;
export function fixStyle(style: string | object, opts?: FixOptions): Promise<any>;
export function fixMap<T>(maplibregl: any, map: T, opts?: FixOptions): Promise<T>;
export function tileProxy(upstream: string): (request: Request) => Promise<Response>;
export function olTileLoadFunction(tile: any, url: string): void;
export function rewriteTile(bytes: Uint8Array, z: number, x: number, y: number): Uint8Array | null;
export const boundary: FeatureCollection;
export const PROFILE: any;
export const REGIONS: any;
declare const _default: {
  install: typeof install;
  fixStyle: typeof fixStyle;
  fixMap: typeof fixMap;
  tileProxy: typeof tileProxy;
  olTileLoadFunction: typeof olTileLoadFunction;
  boundary: FeatureCollection;
};
export default _default;
