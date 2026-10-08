import { useEffect, useRef, useState } from "react";
import { Button } from "@cloudflare/kumo";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

const INDIA = [[67.5, 6], [98.2, 37.8]];
const VIEWS = {
  india: { label: "Whole India" },
  ladakh: { label: "Ladakh", center: [77.9, 34.3], zoom: 5.9 },
  arunachal: { label: "Arunachal Pradesh", center: [94.4, 28.2], zoom: 6.3 },
};
const styleUrl = (dark) => "https://basemaps.cartocdn.com/gl/" + (dark ? "dark-matter" : "positron") + "-gl-style/style.json";
const isDark = () => document.documentElement.getAttribute("data-mode") === "dark";

// Two stacked MapLibre maps. The lower one is the basemap as shipped, the upper one is the same
// style run through bharatmap and clipped at the handle. Their cameras are kept identical.
export function Compare() {
  const box = useRef(null);
  const maps = useRef({});
  const touched = useRef(false);
  const [pos, setPos] = useState(50);
  const [view, setView] = useState("india");
  const [failed, setFailed] = useState(false);
  const dragging = useRef(false);

  useEffect(() => {
    const ml = window.maplibregl, bm = window.BharatMap;
    if (!ml || !bm) { setFailed(true); return; }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const base = { cooperativeGestures: true, bounds: INDIA, fitBoundsOptions: { padding: 10 }, renderWorldCopies: false };
    let dead = false, locked = false, after = null;
    bm.install(ml);
    const before = new ml.Map({ container: "before", style: styleUrl(isDark()), attributionControl: false, ...base });
    maps.current = { before, reduce };
    const link = (a, b) => a.on("move", () => {
      if (locked) return;
      locked = true;
      b.jumpTo({ center: a.getCenter(), zoom: a.getZoom(), bearing: a.getBearing(), pitch: a.getPitch() });
      locked = false;
    });
    const make = async () => {
      const style = await bm.fixStyle(styleUrl(isDark()));
      if (dead) return;
      after = new ml.Map({ container: "after", style, attributionControl: { compact: true }, ...base });
      maps.current.after = after;
      link(before, after); link(after, before);
      after.once("load", () => after.jumpTo({ center: before.getCenter(), zoom: before.getZoom() }));
    };
    make();

    // follow the page theme
    const obs = new MutationObserver(async () => {
      before.setStyle(styleUrl(isDark()));
      if (after) after.setStyle(await bm.fixStyle(styleUrl(isDark())));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });

    let rt;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (!touched.current) before.fitBounds(INDIA, { padding: 10, duration: 0 }); }, 150);
    };
    addEventListener("resize", onResize);
    return () => { dead = true; obs.disconnect(); removeEventListener("resize", onResize); before.remove(); if (after) after.remove(); };
  }, []);

  const go = (name) => {
    const { before, reduce } = maps.current;
    if (!before) return;
    setView(name); touched.current = false;
    const v = VIEWS[name], duration = reduce ? 0 : 900;
    if (name === "india") before.fitBounds(INDIA, { padding: 10, duration });
    else before.easeTo({ center: v.center, zoom: v.zoom, duration });
  };
  const userMoved = () => { touched.current = true; setView(""); };

  const move = (e) => {
    const r = box.current.getBoundingClientRect();
    setPos(Math.max(2, Math.min(98, ((e.clientX - r.left) / r.width) * 100)));
  };
  const key = (e) => {
    const step = { ArrowLeft: -5, ArrowRight: 5 }[e.key];
    if (step) setPos((p) => Math.max(2, Math.min(98, p + step)));
    else if (e.key === "Home") setPos(2);
    else if (e.key === "End") setPos(98);
    else return;
    e.preventDefault();
  };

  return (
    <div className="stage">
      <div
        className="compare" id="compare" ref={box} style={{ "--pos": pos + "%" }}
        aria-label="Same map with and without bharatmap"
        onMouseDown={userMoved} onTouchStart={userMoved} onWheel={userMoved}
      >
        <div className="pane" id="before" />
        <div className="pane" id="after" />
        <span className="chip l">Basemap as shipped</span>
        <span className="chip r">With <b>bharatmap</b></span>
        <div
          className="handle" role="slider" tabIndex={0} aria-label="Comparison position"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)}
          onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); }}
          onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
          onPointerMove={(e) => { if (dragging.current) move(e); }}
          onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}
          onKeyDown={key}
        >
          <span className="grip" aria-hidden="true"><CaretLeft size={14} weight="bold" /><CaretRight size={14} weight="bold" /></span>
        </div>
        {failed && <p className="nomap">The comparison map could not load. Check your connection and reload.</p>}
      </div>
      <div className="jump" role="group" aria-label="Jump to a place">
        {Object.entries(VIEWS).map(([k, v]) => (
          <Button key={k} size="sm" variant={view === k ? "primary" : "secondary"} aria-pressed={view === k} onClick={() => go(k)}>{v.label}</Button>
        ))}
      </div>
      <p className="hint">Drag the handle to compare. Pan and zoom the map, or use the buttons. To zoom with the scroll wheel hold Ctrl; on a phone use two fingers.</p>
    </div>
  );
}
