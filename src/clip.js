// Cut a polyline against polygons and keep only what lies outside them.
// Everything works on plain [x, y] pairs, in whatever plane the caller chose (tile pixels here).

// Even-odd test: is the point inside the ring?
function inside(px, py, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// Parameters t in (0, 1) where the segment a-b crosses an edge of the ring, in increasing order.
function crossings(a, b, ring) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const ts = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const p = ring[j], q = ring[i];
    const ex = q[0] - p[0], ey = q[1] - p[1];
    const den = dx * ey - dy * ex;
    if (den === 0) continue;
    const t = ((p[0] - a[0]) * ey - (p[1] - a[1]) * ex) / den;
    const u = ((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / den;
    if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t);
  }
  return ts.sort((m, n) => m - n);
}

// Pieces of one polyline that lie outside one polygon ring.
export function clipOutsideRing(line, ring) {
  const out = [];
  let cur = null;
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i], b = line[i + 1];
    const ts = [0, ...crossings(a, b, ring), 1];
    for (let k = 0; k + 1 < ts.length; k++) {
      const t0 = ts[k], t1 = ts[k + 1];
      if (t1 - t0 < 1e-12) continue;
      const m = lerp(a, b, (t0 + t1) / 2);
      if (inside(m[0], m[1], ring)) { if (cur && cur.length > 1) out.push(cur); cur = null; continue; }
      if (!cur) cur = [t0 === 0 ? a : lerp(a, b, t0)];
      cur.push(t1 === 1 ? b : lerp(a, b, t1));
    }
  }
  if (cur && cur.length > 1) out.push(cur);
  return out;
}

// Pieces of one polyline that lie outside every ring in the list.
export function clipOutside(line, rings) {
  let pieces = [line];
  for (const r of rings) {
    const next = [];
    for (const p of pieces) next.push(...clipOutsideRing(p, r));
    pieces = next;
    if (!pieces.length) break;
  }
  return pieces;
}
