// Bundles src/index.js into dist/: an ES module for bundlers and <script type="module">, and a plain
// script that sets window.BharatMap. Run: node scripts/build.mjs
import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync(new URL("../dist", import.meta.url), { recursive: true });
const common = { entryPoints: ["src/index.js"], bundle: true, minify: true, target: "es2020", legalComments: "none" };
await build({ ...common, format: "esm", outfile: "dist/bharatmap.esm.js" });
await build({ ...common, format: "iife", globalName: "BharatMap", outfile: "dist/bharatmap.iife.js" });
console.log("built dist/bharatmap.esm.js and dist/bharatmap.iife.js");
