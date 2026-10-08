import "./index.css";
import "./site.css";
import { hydrateRoot, createRoot } from "react-dom/client";
import { App } from "./App.jsx";

const root = document.getElementById("root");
// the prerendered page hydrates; a page served without prerendering (vite dev) renders fresh
if (root.firstElementChild) hydrateRoot(root, <App />);
else createRoot(root).render(<App />);
