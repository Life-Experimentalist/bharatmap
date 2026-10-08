import test from "node:test";
import assert from "node:assert/strict";
import { fixStyle, fixMap, install, tileProxy, boundary } from "../src/index.js";

const style = {
  version: 8,
  sources: { v: { type: "vector", tiles: ["https://t.example/{z}/{x}/{y}.pbf"] } },
  layers: [
    { id: "boundary_country", type: "line", source: "v", "source-layer": "boundary", filter: ["==", "admin_level", 2], paint: { "line-color": "#888" } },
    { id: "water", type: "fill", source: "v", "source-layer": "water" },
  ],
};

test("fixStyle prefixes tiles, adds the source and one copy per country-line layer", async () => {
  const s = await fixStyle(style);
  assert.ok(s.sources.v.tiles[0].startsWith("indiafix://https://t.example/"));
  assert.equal(s.sources.bharatmap.type, "geojson");
  assert.deepEqual(s.layers.map((l) => l.id), ["boundary_country", "boundary_country-india", "water"]);
  assert.equal(style.sources.v.tiles[0], "https://t.example/{z}/{x}/{y}.pbf");
});

test("fixStyle twice does not duplicate layers or prefixes", async () => {
  const s = await fixStyle(await fixStyle(style));
  assert.equal(s.layers.filter((l) => l.id === "boundary_country-india").length, 1);
  assert.equal(s.sources.v.tiles[0].split("indiafix://").length, 2);
});

test("protocol:false leaves tile urls alone", async () => {
  const s = await fixStyle(style, { protocol: false });
  assert.equal(s.sources.v.tiles[0], "https://t.example/{z}/{x}/{y}.pbf");
  assert.equal(s.layers.length, 3);
});

test("fixMap fixes the current style and later setStyle calls", async () => {
  const calls = [];
  const map = { getStyle: () => style, setStyle(s) { calls.push(s); } };
  let registered = 0;
  const gl = { addProtocol() { registered++; } };
  await fixMap(gl, map);
  assert.equal(registered, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].layers.length, 3);
  map.setStyle(style);
  map.setStyle(style);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(calls.length, 2, "two quick calls, only the latest is applied");
  install(gl);
  assert.equal(registered, 1);
});

test("tileProxy: 404 on a bad path, 502 when upstream fails, passes an untouched tile through", async () => {
  const real = globalThis.fetch;
  const proxy = tileProxy("https://up.example/{z}/{x}/{y}.pbf");
  assert.equal((await proxy(new Request("https://p.example/nope"))).status, 404);
  globalThis.fetch = async () => new Response("x", { status: 500 });
  assert.equal((await proxy(new Request("https://p.example/5/0/0.pbf"))).status, 502);
  globalThis.fetch = async (u) => {
    assert.equal(u, "https://up.example/5/0/0.pbf");
    return new Response(new Uint8Array([1, 2, 3]));
  };
  const ok = await proxy(new Request("https://p.example/5/0/0.pbf"));
  assert.equal(ok.status, 200);
  assert.deepEqual([...new Uint8Array(await ok.arrayBuffer())], [1, 2, 3]);
  assert.equal(ok.headers.get("access-control-allow-origin"), "*");
  globalThis.fetch = real;
  assert.ok(boundary.features.length > 0);
});
