import { rewriteTile } from "./tile.js";

const COORD = /(\d+)\/(\d+)\/(\d+)(?:\.\w+)?(?:\?.*)?$/;

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Fetch a vector tile, gunzip it if needed, cut the disputed lines out of it. Returns plain bytes.
// coord is [z, x, y]; when it is left out it is read from the end of the url.
export async function loadRewritten(url, signal, coord) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`tile ${res.status}: ${url}`);
  let bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await gunzip(bytes);
  const m = coord || (COORD.exec(url) || []).slice(1).map(Number);
  if (m.length !== 3) return bytes;
  try { return rewriteTile(bytes, m[0], m[1], m[2]) || bytes; } catch (e) { return bytes; }
}

export { COORD };
