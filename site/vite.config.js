import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The site is served from the root of bharatmap.vkrishna04.me, straight out of docs/.
// docs/ also holds skill.md, llms.txt and the library bundle, so the build never empties it.
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  build: { outDir: "../docs", emptyOutDir: false },
  ssr: { noExternal: ["@cloudflare/kumo"] },
});
