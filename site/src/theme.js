import { useSyncExternalStore } from "react";

// Theme: light, dark or system, saved under bharatmap-theme. Kumo reads data-mode="dark" on <html>,
// so the resolved choice is written there; light is the absence of the attribute. The server render
// and the first client render both see "system", so hydration matches, and the saved choice is
// picked up right after.
const KEY = "bharatmap-theme";
const subs = new Set();
let pref = "system";
let started = false;
const mq = () => window.matchMedia("(prefers-color-scheme: dark)");

function resolved() {
  return pref === "dark" || (pref === "system" && mq().matches);
}

function paint() {
  if (resolved()) document.documentElement.setAttribute("data-mode", "dark");
  else document.documentElement.removeAttribute("data-mode");
  subs.forEach((f) => f());
}

function start() {
  if (started) return;
  started = true;
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") pref = v;
  } catch (e) { /* storage blocked */ }
  mq().addEventListener("change", () => { if (pref === "system") paint(); });
  paint();
}

export function setTheme(v) {
  start();
  pref = v;
  try { if (v === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ }
  paint();
}

export function useThemePref() {
  return useSyncExternalStore(
    (cb) => { start(); subs.add(cb); return () => subs.delete(cb); },
    () => pref,
    () => "system",
  );
}
