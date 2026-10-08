import { loadRewritten, COORD } from "./load.js";

// A fetch handler that serves corrected tiles at /{z}/{x}/{y}.pbf, for any map library that can read
// vector tiles from a URL. Runs on Cloudflare Workers, Deno, Bun and Node 18+.
//   upstream: the basemap's tile template, for example "https://tiles.example.com/planet/{z}/{x}/{y}.pbf"
export function tileProxy(upstream) {
  return async (request) => {
    const m = COORD.exec(new URL(request.url).pathname);
    if (!m) return new Response("not found", { status: 404 });
    const [z, x, y] = m.slice(1).map(Number);
    const url = upstream.replace("{z}", z).replace("{x}", x).replace("{y}", y);
    let bytes;
    try { bytes = await loadRewritten(url, request.signal, [z, x, y]); }
    catch (e) { return new Response(String(e.message), { status: 502 }); }
    return new Response(bytes, {
      headers: {
        "content-type": "application/x-protobuf",
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=3600",
      },
    });
  };
}
