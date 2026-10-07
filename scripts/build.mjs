// Bundles src/index.js into dist/: an ES module for bundlers and <script type="module">, and a plain
// script that sets window.IndiaBorderFix. Run: node scripts/build.mjs
import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync(new URL("../dist", import.meta.url), { recursive: true });
const common = { entryPoints: ["src/index.js"], bundle: true, minify: true, target: "es2020", legalComments: "none" };
await build({ ...common, format: "esm", outfile: "dist/india-border-fix.esm.js" });
await build({ ...common, format: "iife", globalName: "IndiaBorderFix", outfile: "dist/india-border-fix.iife.js" });
console.log("built dist/india-border-fix.esm.js and dist/india-border-fix.iife.js");
