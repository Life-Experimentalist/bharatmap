#!/usr/bin/env node
// npx bharatmap init [--all|--claude|--cursor|--copilot|--windsurf|--gemini|--agents]
// Writes assistant instructions into the current project so an AI assistant can wire bharatmap in.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skill = readFileSync(join(root, "skills/bharatmap/SKILL.md"), "utf8");
const body = skill.replace(/^---[\s\S]*?---\s*/, "");
const LIVE = "https://bharatmap.vkrishna04.me/skill.md";
const note = `## bharatmap (India map borders)\n\nWhen the map must draw India's boundary per the Survey of India, follow ${LIVE}\n(or the copy below). Install with \`npm install bharatmap\`.\n\n${body}`;

const args = process.argv.slice(2);
const cmd = args[0];
if (cmd !== "init") {
  console.log("usage: npx bharatmap init [--all|--claude|--cursor|--copilot|--windsurf|--gemini|--agents]");
  console.log("Adds assistant instructions to this project. Then ask your assistant to fix the India borders.");
  process.exit(cmd ? 1 : 0);
}

const write = (file, text, append) => {
  const path = join(process.cwd(), file);
  mkdirSync(dirname(path), { recursive: true });
  if (append && existsSync(path)) {
    const old = readFileSync(path, "utf8");
    if (old.includes("## bharatmap")) return console.log("skip   " + file + " (already has bharatmap)");
    writeFileSync(path, old.replace(/\s*$/, "\n\n") + text);
  } else if (existsSync(path)) {
    return console.log("skip   " + file + " (exists)");
  } else writeFileSync(path, text);
  console.log("wrote  " + file);
};

const targets = {
  claude: () => write(".claude/skills/bharatmap/SKILL.md", skill, false),
  cursor: () => write(".cursor/rules/bharatmap.mdc", `---\ndescription: India map borders with bharatmap\nalwaysApply: false\n---\n${note}`, false),
  copilot: () => write(".github/copilot-instructions.md", note, true),
  windsurf: () => write(".windsurf/rules/bharatmap.md", note, false),
  gemini: () => write("GEMINI.md", note, true),
  agents: () => write("AGENTS.md", note, true),
};
let picked = Object.keys(targets).filter((k) => args.includes("--" + k));
if (args.includes("--all")) picked = Object.keys(targets);
if (!picked.length) {
  // Detect what the project already uses; fall back to AGENTS.md, which most tools read.
  const has = (p) => existsSync(join(process.cwd(), p));
  if (has(".claude") || has("CLAUDE.md")) picked.push("claude");
  if (has(".cursor")) picked.push("cursor");
  if (has(".github")) picked.push("copilot");
  if (has(".windsurf")) picked.push("windsurf");
  if (has("GEMINI.md")) picked.push("gemini");
  if (!picked.length || has("AGENTS.md")) picked.push("agents");
}
picked.forEach((k) => targets[k]());
console.log("\nDone. Ask your assistant: \"fix the India borders on my map with bharatmap\".");
