// Second half of the build: render the app with the server bundle and write the result into
// docs/index.html, so the page has its content before any script runs.
import { readFile, writeFile, rm, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { FAQ, plain } from "./src/faq.js";

const out = path.resolve("../docs/index.html");
const { render } = await import(pathToFileURL(path.resolve("dist-ssr/entry-server.js")).href);
const html = await readFile(out, "utf8");
if (!html.includes("<!--app-html-->")) throw new Error("placeholder missing in " + out);
if (!html.includes("<!--faq-ld-->")) throw new Error("faq placeholder missing in " + out);

// FAQPage structured data comes from the same list the page renders, so the two cannot disagree
const faq = {
  "@type": "FAQPage",
  "@id": "https://bharatmap.vkrishna04.me/#faq",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
};
await writeFile(out, html.replace("<!--faq-ld-->", () => JSON.stringify(faq)).replace("<!--app-html-->", () => render()));
await rm("dist-ssr", { recursive: true, force: true });
console.log("prerendered " + out);

// Machine-readable companions of the page, written next to it: a Markdown copy of the page, one
// file with everything an assistant needs (llms-full.txt) and a sitemap with real modified dates.
const docs = path.resolve("../docs");
const SITE = "https://bharatmap.vkrishna04.me";
const read = (p) => readFile(path.resolve(p), "utf8");

const indexMd = `# bharatmap: correct India map borders for web maps

bharatmap makes a web map draw India's boundary the way the Survey of India does: Jammu and Kashmir, Ladakh (with Gilgit-Baltistan and Aksai Chin) and Arunachal Pradesh inside India, with no stray Line of Actual Control or Line of Control fragments, at every zoom. It cuts the disputed border lines out of OpenStreetMap-based vector tiles as they load and draws India's boundary in their place. No server, no API key, no runtime dependencies, about 40 kB gzipped.

- Install: \`npm install bharatmap\`
- Works with: MapLibre GL JS, Leaflet (vector basemaps), OpenLayers, deck.gl, and a tile proxy for Mapbox GL JS and others.
- Does not work with: raster tile basemaps (the border is part of the picture) and Apple Maps.
- Licence: code Apache-2.0, border data ODbL 1.0.
- Author: [VKrishna04](https://github.com/VKrishna04)
- Source: https://github.com/Life-Experimentalist/bharatmap
- Package: https://www.npmjs.com/package/bharatmap

## MapLibre GL JS, one call

\`\`\`js
import maplibregl from "maplibre-gl";
import { fixMap } from "bharatmap";

const map = new maplibregl.Map({ container: "map", style: STYLE_URL, center: [78, 22], zoom: 4 });
await fixMap(maplibregl, map);
\`\`\`

## For AI assistants

Follow ${SITE}/skill.md to fix the India borders on a map. Short summary: ${SITE}/llms.txt. Everything in one file: ${SITE}/llms-full.txt.

${["Troubleshooting", "Questions"].map((g) => `## ${g}\n\n` + FAQ.filter((f) => f.group === g).map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n")).join("\n\n")}

Not legally authoritative: verify against the Survey of India before publishing.
`;
await writeFile(path.join(docs, "index.md"), indexMd);

const parts = [
  await read("../llms.txt"),
  "# Page content\n\n" + indexMd,
  "# Integration skill (skill.md)\n\n" + (await read("../docs/skill.md")),
  "# How it works (how-it-works.md)\n\n" + (await read("../docs/how-it-works.md")),
  "# Basemaps and custom schemas (basemaps.md)\n\n" + (await read("../docs/basemaps.md")),
];
await writeFile(path.join(docs, "llms-full.txt"), parts.join("\n\n---\n\n"));

const day = async (f) => (await stat(path.join(docs, f))).mtime.toISOString().slice(0, 10);
const entries = [["", "index.html", "weekly", "1.0"], ["skill.md", "skill.md", "monthly", "0.8"], ["llms.txt", "llms.txt", "monthly", "0.6"], ["llms-full.txt", "llms-full.txt", "monthly", "0.6"], ["index.md", "index.md", "weekly", "0.6"], ["how-it-works.md", "how-it-works.md", "monthly", "0.7"], ["basemaps.md", "basemaps.md", "monthly", "0.7"]];
const urls = [];
for (const [loc, file, freq, prio] of entries) {
  const image = loc === "" ? `<image:image><image:loc>${SITE}/og.png</image:loc><image:title>bharatmap</image:title></image:image>` : "";
  urls.push(`  <url><loc>${SITE}/${loc}</loc><lastmod>${await day(file)}</lastmod><changefreq>${freq}</changefreq><priority>${prio}</priority>${image}</url>`);
}
await writeFile(path.join(docs, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>\n`);
console.log("wrote index.md, llms-full.txt, sitemap.xml");
