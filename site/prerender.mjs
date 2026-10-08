// Second half of the build: render the app with the server bundle and write the result into
// docs/index.html, so the page has its content before any script runs.
import { readFile, writeFile, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const out = path.resolve("../docs/index.html");
const { render } = await import(pathToFileURL(path.resolve("dist-ssr/entry-server.js")).href);
const html = await readFile(out, "utf8");
if (!html.includes("<!--app-html-->")) throw new Error("placeholder missing in " + out);
await writeFile(out, html.replace("<!--app-html-->", render()));
await rm("dist-ssr", { recursive: true, force: true });
console.log("prerendered " + out);
