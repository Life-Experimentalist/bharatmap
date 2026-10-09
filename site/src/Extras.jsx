import { useEffect, useState } from "react";
import { Code } from "./Code.jsx";

const REPO = "Life-Experimentalist/bharatmap";
const SITE = "https://bharatmap.vkrishna04.me";

// Live numbers from the npm and GitHub public APIs, fetched in the browser and kept for an hour in
// sessionStorage (GitHub allows 60 anonymous requests an hour per address). The server render and
// the first client render show dashes, so hydration matches.
async function getJson(url) {
  const key = "bm:" + url;
  try {
    const hit = JSON.parse(sessionStorage.getItem(key));
    if (hit && Date.now() - hit.t < 3600e3) return hit.v;
  } catch (e) { /* storage blocked or empty */ }
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + " " + res.status);
  const v = await res.json();
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch (e) { /* storage blocked */ }
  return v;
}

const today = () => new Date().toISOString().slice(0, 10);

function useStats() {
  const [s, set] = useState({});
  useEffect(() => {
    const put = (k) => (v) => set((o) => ({ ...o, [k]: v }));
    // null marks a number that could not be fetched. npm reports no downloads for a package until
    // its first day of statistics is in, so a new release lands here and the cell is left out.
    const lost = (k) => () => put(k)(null);
    getJson("https://api.npmjs.org/downloads/point/last-month/bharatmap").then((d) => put("month")(d.downloads), lost("month"));
    getJson("https://api.npmjs.org/downloads/point/last-week/bharatmap").then((d) => put("week")(d.downloads), lost("week"));
    getJson("https://api.npmjs.org/downloads/point/2025-01-01:" + today() + "/bharatmap").then((d) => put("total")(d.downloads), lost("total"));
    getJson("https://registry.npmjs.org/bharatmap/latest").then((d) => put("version")(d.version), lost("version"));
    getJson("https://api.github.com/repos/" + REPO).then((d) => put("stars")(d.stargazers_count), lost("stars"));
  }, []);
  return s;
}

const num = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "-");

export function Stats() {
  const s = useStats();
  const cells = [
    ["month", "Installs this month", num(s.month), "npm downloads, last 30 days"],
    ["week", "Installs this week", num(s.week), "npm downloads, last 7 days"],
    ["total", "Installs in total", num(s.total), "npm downloads since January 2025"],
    ["stars", "GitHub stars", num(s.stars), "on " + REPO],
    ["version", "Latest version", s.version ? "v" + s.version : "-", "on npm"],
  ].filter(([k]) => s[k] !== null);
  return (
    <section id="stats" aria-label="Usage">
      <div className="wrap">
        <dl className="stats">
          {cells.map(([k, label, value, note]) => (
            <div key={k} title={note}>
              <dd>{value}</dd>
              <dt>{label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const shield = (path, extra = "") => `https://img.shields.io/${path}?style=flat-square&color=000000&labelColor=737373${extra}`;

export const BADGES = [
  { alt: "npm version", src: shield("npm/v/bharatmap"), href: "https://www.npmjs.com/package/bharatmap" },
  { alt: "npm downloads per month", src: shield("npm/dm/bharatmap"), href: "https://www.npmjs.com/package/bharatmap" },
  { alt: "GitHub stars", src: shield("github/stars/" + REPO), href: "https://github.com/" + REPO },
  { alt: "Bundle size", src: shield("bundlephobia/minzip/bharatmap"), href: "https://bundlephobia.com/package/bharatmap" },
  { alt: "Types included", src: shield("npm/types/bharatmap"), href: "https://www.npmjs.com/package/bharatmap" },
  { alt: "License", src: shield("npm/l/bharatmap"), href: "https://github.com/" + REPO + "/blob/main/LICENSE" },
];

const mdBadge = (b) => `[![${b.alt}](${b.src})](${b.href})`;

export function Badges() {
  const used = `[![Map borders: bharatmap](${shield("badge/map%20borders-bharatmap-000")})](${SITE}/)`;
  const banner = `[![bharatmap: correct India borders on web maps](${SITE}/og.png)](${SITE}/)`;
  return (
    <section id="badges">
      <div className="wrap split">
        <header>
          <h2>Badges and banner</h2>
          <p>Using bharatmap on your site or in your project? Add a badge so others can find it.</p>
        </header>
        <div>
          <ul className="badges" aria-label="Live badges">
            {BADGES.map((b) => (
              <li key={b.alt}><a href={b.href}><img src={b.src} alt={b.alt} height="20" loading="lazy" decoding="async" /></a></li>
            ))}
          </ul>
          <h3 className="sub">"Uses bharatmap" badge</h3>
          <p className="lead"><a href={SITE + "/"}><img src={shield("badge/map%20borders-bharatmap-000")} alt="Map borders: bharatmap" height="20" loading="lazy" decoding="async" /></a></p>
          <Code>{used}</Code>
          <h3 className="sub">Project badges for your README</h3>
          <Code>{BADGES.map(mdBadge).join("\n")}</Code>
          <h3 className="sub">Banner</h3>
          <p className="lead">A 1200 by 630 image, the same one used when this page is shared.</p>
          <a className="banner" href={SITE + "/og.png"}><img src="/og.png" alt="bharatmap: correct India borders on web maps" width="1200" height="630" loading="lazy" decoding="async" /></a>
          <Code>{banner}</Code>
        </div>
      </div>
    </section>
  );
}

export function Author({ big = false }) {
  return (
    <a className={"author" + (big ? " big" : "")} href="https://github.com/VKrishna04" rel="me author noopener">
      <img src="/avatar.jpg" alt="VKrishna04" width="96" height="96" loading="lazy" decoding="async" />
      <span>{big ? <>Made by <b>VKrishna04</b><small>github.com/VKrishna04</small></> : <>by <b>VKrishna04</b></>}</span>
    </a>
  );
}
