import { useState } from "react";
import { ClipboardText, LinkButton, Tabs } from "@cloudflare/kumo";
import { Desktop, GithubLogo, Moon, Sun } from "@phosphor-icons/react";
import { Code } from "./Code.jsx";
import { Compare } from "./Compare.jsx";
import { Author, Badges, Stats } from "./Extras.jsx";
import { FAQ } from "./faq.js";
import { setTheme, useThemePref } from "./theme.js";

const THEMES = [
  { value: "light", label: <span className="inline-flex items-center"><Sun size={14} /><span className="sr">Light</span></span> },
  { value: "dark", label: <span className="inline-flex items-center"><Moon size={14} /><span className="sr">Dark</span></span> },
  { value: "system", label: <span className="inline-flex items-center"><Desktop size={14} /><span className="sr">System</span></span> },
];

function Header() {
  const pref = useThemePref();
  return (
    <header className="bar">
      <div className="wrap">
        <a className="brand" href="/" aria-label="bharatmap home">
          <img className="light" src="/logo.svg" alt="bharatmap" />
          <img className="dark" src="/logo-dark.svg" alt="" aria-hidden="true" />
        </a>
        <nav aria-label="Main">
          <a className="plain" href="#guide">Guide</a>
          <a className="plain" href="#assistants">AI assistants</a>
          <a className="plain" href="#libraries">Libraries</a>
          <a className="plain" href="#questions">Questions</a>
        </nav>
        <Tabs variant="segmented" size="sm" tabs={THEMES} value={pref} onValueChange={setTheme} />
        <LinkButton className="gh" href="https://github.com/Life-Experimentalist/bharatmap" variant="primary" size="sm" icon={GithubLogo}>GitHub</LinkButton>
      </div>
    </header>
  );
}

const CHECKS = [
  <><b>Whole India (zoom 2 to 3):</b> one line around India, with no extra dashed lines over Ladakh or Kashmir.</>,
  <><b>Arunachal Pradesh (zoom 5 to 7):</b> one continuous border, and the Myanmar and Bhutan borders still drawn.</>,
  <><b>Where the line meets Himachal Pradesh and Bhutan (zoom 9 to 12):</b> no gaps and no doubled lines.</>,
  <><b>Credits:</b> the border data attribution shows in the map's corner.</>,
];

const Check = () => (
  <li>
    <h3>Check that it worked</h3>
    <ul>
      <li>Open the map in light and dark if you support both, and look at these views.</li>
      {CHECKS.map((c, i) => <li key={i}>{c}</li>)}
    </ul>
  </li>
);

const LIBS = [
  {
    id: "maplibre", label: "MapLibre GL JS",
    steps: (
      <>
        <li><h3>Install the package</h3><Code>npm install bharatmap</Code></li>
        <li>
          <h3>Call fixMap after you create the map</h3>
          <p>It fixes the style you have now and every later <code>setStyle</code>, so switching between light and dark keeps working.</p>
          <Code>{`import maplibregl from "maplibre-gl";
import { fixMap } from "bharatmap";

const map = new maplibregl.Map({ container: "map", style: STYLE_URL, center: [78, 22], zoom: 4 });
await fixMap(maplibregl, map);`}</Code>
          <p>If you would rather fix the style before the map exists, use <code>install(maplibregl)</code> once, then <code>await fixStyle(STYLE_URL)</code> and pass the result as <code>style</code>.</p>
        </li>
        <Check />
      </>
    ),
  },
  {
    id: "script", label: "Plain HTML",
    steps: (
      <>
        <li><h3>Nothing to install</h3><p>Add the script after MapLibre. It puts a <code>BharatMap</code> object on the page.</p></li>
        <li>
          <h3>Fix the style, then make the map</h3>
          <Code>{`<script src="https://cdn.jsdelivr.net/npm/bharatmap@0.2.0/dist/bharatmap.iife.js"></script>
<script>
  BharatMap.install(maplibregl);
  BharatMap.fixStyle("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json").then((style) => {
    new maplibregl.Map({ container: "map", style, center: [78, 22], zoom: 4 });
  });
</script>`}</Code>
          <p>This is how the map at the top of this page is built.</p>
        </li>
        <Check />
      </>
    ),
  },
  {
    id: "leaflet", label: "Leaflet",
    steps: (
      <>
        <li>
          <h3>Install the packages</h3>
          <p>Leaflet draws vector basemaps through <a href="https://github.com/maplibre/maplibre-gl-leaflet">maplibre-gl-leaflet</a>, which needs MapLibre. bharatmap fixes the MapLibre style.</p>
          <Code>npm install bharatmap maplibre-gl</Code>
        </li>
        <li>
          <h3>Fix the style, then hand it to Leaflet</h3>
          <Code>{`import maplibregl from "maplibre-gl";
import { install, fixStyle } from "bharatmap";

install(maplibregl);
const style = await fixStyle("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json");
L.maplibreGL({ style }).addTo(map);`}</Code>
          <p>If your Leaflet map uses plain <code>L.tileLayer("...png")</code> tiles, bharatmap cannot cut the border. See the table below for what you can do.</p>
        </li>
        <Check />
      </>
    ),
  },
  {
    id: "ol", label: "OpenLayers",
    steps: (
      <>
        <li><h3>Install the packages</h3><Code>npm install bharatmap ol ol-mapbox-style</Code></li>
        <li>
          <h3>Fix the style and set the tile loader</h3>
          <p>OpenLayers has its own tile loading, so you turn off the MapLibre protocol and give each vector tile source bharatmap's loader.</p>
          <Code>{`import { fixStyle, olTileLoadFunction } from "bharatmap";
import { apply } from "ol-mapbox-style";
import VectorTileSource from "ol/source/VectorTile";

await apply(map, await fixStyle(STYLE_URL, { protocol: false }));
map.getAllLayers().forEach((layer) => {
  const source = layer.getSource && layer.getSource();
  if (source instanceof VectorTileSource) {
    source.setTileLoadFunction(olTileLoadFunction);
    source.refresh();
  }
});`}</Code>
        </li>
        <Check />
      </>
    ),
  },
  {
    id: "deck", label: "deck.gl and React",
    steps: (
      <>
        <li><h3>Install the package</h3><Code>npm install bharatmap</Code></li>
        <li>
          <h3>Fix the basemap style, not deck.gl</h3>
          <p>deck.gl, react-map-gl and the Vue and Angular wrappers draw their basemap with MapLibre, so you fix the style you pass in. This is the same engine as the MapLibre tab, but it has not been tested separately for each wrapper.</p>
          <Code>{`import maplibregl from "maplibre-gl";
import { install, fixStyle } from "bharatmap";

install(maplibregl);                       // once, at startup
const style = await fixStyle(STYLE_URL);   // pass this as the basemap style`}</Code>
        </li>
        <Check />
      </>
    ),
  },
  {
    id: "proxy", label: "Mapbox GL and others",
    steps: (
      <>
        <li>
          <h3>Host the corrected tiles</h3>
          <p>Mapbox GL JS, Tangram and QGIS cannot change tile requests the way MapLibre can, so you run a small tile proxy that returns tiles with the disputed lines already cut out. This one is a Cloudflare Worker, and the same handler runs on Deno, Bun and Node 18 and later.</p>
          <Code>{`import { tileProxy } from "bharatmap";

export default {
  fetch: tileProxy("https://tiles.example.com/planet/{z}/{x}/{y}.pbf"),
};`}</Code>
        </li>
        <li>
          <h3>Point your map at it and add the lines</h3>
          <p>The proxy serves <code>/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.pbf</code>. Use that as the tile source. India's boundary itself is in <code>boundary</code>, a GeoJSON FeatureCollection you can add to any map as a line layer.</p>
          <p>On Mapbox's own styles, check their worldview setting first. It is meant for this and may already do what you need.</p>
        </li>
        <Check />
      </>
    ),
  },
];

function Guide() {
  const [lib, setLib] = useState("maplibre");
  return (
    <section id="guide">
      <div className="wrap split">
        <header>
          <h2>Add it to your map</h2>
          <p>Pick the library you use. Three steps, about a minute.</p>
        </header>
        <div>
          <div className="tabscroll">
            <Tabs variant="underline" tabs={LIBS.map((l) => ({ value: l.id, label: l.label }))} value={lib} onValueChange={setLib} />
          </div>
          {LIBS.map((l) => (
            <div className="panel" key={l.id} role="tabpanel" hidden={l.id !== lib}>
              <ol className="steps">{l.steps}</ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Assistants() {
  return (
    <section id="assistants">
      <div className="wrap split">
        <header>
          <h2>Or let your AI assistant do it</h2>
          <p>It reads the project, finds your map library and basemap, makes the change and checks it at several zoom levels.</p>
        </header>
        <div>
          <h3 className="sub">One command for your project</h3>
          <p className="lead">Writes the instructions where your assistant looks: Claude Code, Cursor, Copilot, Windsurf, Gemini CLI, or AGENTS.md for the rest. Then ask it to "fix the India borders on my map with bharatmap".</p>
          <Code>npx bharatmap init</Code>
          <h3 className="sub">Claude Code plugin</h3>
          <Code>{`/plugin marketplace add Life-Experimentalist/bharatmap
/plugin install bharatmap@bharatmap`}</Code>
          <h3 className="sub">Any assistant that can open a link</h3>
          <p className="lead">Paste this. The file behind the link is always the current version, so you never have stale instructions.</p>
          <Code>Follow https://bharatmap.vkrishna04.me/skill.md to fix the India borders on my map.</Code>
          <p className="lead">Crawlers and agents can also read <a href="/skill.md">skill.md</a> and <a href="/llms.txt">llms.txt</a> directly.</p>
        </div>
      </div>
    </section>
  );
}

const ROWS = [
  ["MapLibre GL JS", <><code>fixMap(maplibregl, map)</code> <span className="ok">Tested in a browser, light and dark, zoom 2 to 14.</span></>],
  ["Leaflet, vector basemap", <><code>fixStyle</code>, then <code>L.maplibreGL(&#123; style &#125;)</code>. <span className="ok">Tested in a browser.</span></>],
  ["OpenLayers", <><code>fixStyle</code> with <code>protocol: false</code> and <code>olTileLoadFunction</code>. <span className="ok">Tested in a browser.</span></>],
  ["deck.gl, react-map-gl", "Same as MapLibre, on the style you pass in. Same engine, not tested separately."],
  ["Mapbox GL JS, Tangram, QGIS", <>Use <code>tileProxy</code>, a handler you host. Covered by unit tests only.</>],
  ["Leaflet, raster tiles", <>Only an overlay is possible: <code>L.geoJSON(BharatMap.boundary)</code>. The raster's own line stays underneath, because a border baked into a picture cannot be cut.</>],
  ["Google Maps", "Nothing to do. Google already draws India's borders per local depiction."],
  ["Apple Maps", "Not possible. The vendor decides what it draws."],
];

function Libraries() {
  return (
    <section id="libraries">
      <div className="wrap split">
        <header>
          <h2>What works with what</h2>
          <p>Any vector basemap in the OpenMapTiles schema: CARTO (Positron, Dark Matter, Voyager), OpenFreeMap, MapTiler, Stadia and others.</p>
        </header>
        <ul className="rows">
          {ROWS.map(([name, text]) => <li key={name}><h3>{name}</h3><p>{text}</p></li>)}
        </ul>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section id="why">
      <div className="wrap split">
        <header><h2>Why a style filter is not enough</h2></header>
        <div className="prose">
          <p>Free basemaps are built from OpenStreetMap, whose contributors draw disputed borders as the lines on the ground. So an OpenStreetMap-based map shows the Line of Actual Control, the Line of Control and the China side of Arunachal Pradesh as international borders, often as dashed fragments that are still visible at world zoom.</p>
          <p>You cannot hide them with a style rule. The tile builder merges several disputed borders into one long line, so a filter removes all of it or none of it. A filter box big enough to catch the strays also deletes real borders, such as Myanmar and Bhutan in Arunachal Pradesh.</p>
          <p><strong>bharatmap cuts the geometry inside each vector tile as it loads</strong>, then draws India's boundary in its place, in the basemap's own line style. Tiles that miss the affected areas come back untouched, and the rest take a few milliseconds each. The technical details are in <a href="/how-it-works.md">how it works</a>, and custom schemas are covered in <a href="/basemaps.md">basemaps</a>.</p>
        </div>
      </div>
    </section>
  );
}

// Answers carry `code` and [text](url) markup; turn it into elements.
function Rich({ text }) {
  return text.split(/(`[^`]*`|\[[^\]]*\]\([^)]*\))/).map((part, i) => {
    if (part[0] === "`") return <code key={i}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
    return link ? <a key={i} href={link[2]}>{link[1]}</a> : part;
  });
}

// Native details elements: the answers are in the page HTML for readers, search engines and AI
// crawlers alike, and they open without any script.
function Q({ q, a }) {
  return (
    <details className="qa">
      <summary className="qa-trigger">{q}</summary>
      <div className="qa-panel"><p><Rich text={a} /></p></div>
    </details>
  );
}

function Questions() {
  const groups = [...new Set(FAQ.map((f) => f.group))];
  return (
    <section id="questions">
      <div className="wrap split">
        <header><h2>If something looks wrong, and other questions</h2></header>
        <div>
          {groups.map((g) => (
            <div className="qgroup" key={g}>
              <h3 className="sub">{g}</h3>
              {FAQ.filter((f) => f.group === g).map((f) => <Q key={f.q} q={f.q} a={f.a} />)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function App() {
  return (
    <>
      <a className="skip" href="#guide">Skip to the guide</a>
      <Header />
      <main>
        <div className="wrap hero">
          <div className="hero-top">
            <h1>India's borders, drawn correctly on any web map.</h1>
            <div>
              <p className="lede">Free map styles are built from OpenStreetMap, which shows Kashmir, Ladakh and Arunachal Pradesh differently from the Survey of India. bharatmap fixes that with one function call. No server, no API key, no dependencies.</p>
              <div className="cta">
                <ClipboardText text="npm install bharatmap" size="base" />
                <LinkButton href="#guide" variant="secondary">Read the guide</LinkButton>
              </div>
              <p className="facts">About 40 kB gzipped. Apache-2.0. Works with MapLibre, Leaflet, OpenLayers and deck.gl.</p>
              <Author />
            </div>
          </div>
          <Compare />
        </div>
        <Stats />
        <Guide />
        <Assistants />
        <Libraries />
        <Why />
        <Questions />
        <Badges />
      </main>
      <footer>
        <div className="wrap">
          <div>
            <Author big />
            <p><strong style={{ color: "var(--ink)" }}>bharatmap</strong> is open source. Code under Apache-2.0, border data under ODbL 1.0.</p>
            <p>It follows a published depiction of the Survey of India boundary. It is not a legal authority. Verify before you publish.</p>
          </div>
          <ul>
            <li><a href="https://github.com/Life-Experimentalist/bharatmap">GitHub</a></li>
            <li><a href="https://www.npmjs.com/package/bharatmap">npm</a></li>
            <li><a href="https://vkrishna04.me">vkrishna04.me</a></li>
            <li><a href="/index.md">This page as Markdown</a></li>
            <li><a href="/llms-full.txt">llms-full.txt</a></li>
            <li><a href="/skill.md">skill.md</a></li>
            <li><a href="/llms.txt">llms.txt</a></li>
            <li><a href="/how-it-works.md">How it works</a></li>
            <li><a href="/basemaps.md">Basemaps</a></li>
          </ul>
        </div>
      </footer>
    </>
  );
}
