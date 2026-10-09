// Questions and answers. One list feeds the page and the FAQPage structured data, so the two never
// drift. Answers are plain text; `code` and [text](url) are the only markup.
export const FAQ = [
  {
    group: "Troubleshooting",
    q: "Nothing changed on my map",
    a: "Check three things. First, the basemap must be vector tiles. If your map uses .png or .jpg tiles the border is part of the picture and cannot be cut. Second, the style needs a `boundary` layer with `admin_level` 2, which is the OpenMapTiles schema. Look for `\"source-layer\": \"boundary\"` in the style JSON. Third, make sure the style you pass to the map is the one that came back from `fixStyle`, and that you waited for it.",
  },
  {
    group: "Troubleshooting",
    q: "It is right until I switch between light and dark",
    a: "A new style replaces the fixed one. Use `fixMap(maplibregl, map)`, which fixes every later `setStyle` for you. If you use `fixStyle` instead, run every style you load through it, including the dark one.",
  },
  {
    group: "Troubleshooting",
    q: "Where did the data credit go?",
    a: "bharatmap adds the border data attribution to the map's credits on its own. Keep the attribution control on the map and it stays there.",
  },
  {
    group: "Troubleshooting",
    q: "I see a small gap at a high zoom",
    a: "The coverage check reports no gaps from zoom 1 to 10 and a few tile-edge pieces at zoom 11 and 12. Zoom 13 and above was checked by eye. If you find one, open an issue on GitHub with the zoom level and the coordinates, and it can be fixed in the module's region data.",
  },
  {
    group: "Troubleshooting",
    q: "My basemap uses a different schema",
    a: "You can pass a profile that names the tile layer and says which lines to cut. The three parts are described in [basemaps](/basemaps.md), along with a command that checks a new basemap for gaps.",
  },
  {
    group: "Questions",
    q: "Is the line legally authoritative?",
    a: "No. It follows a published depiction of the Survey of India line, checked against OpenStreetMap where OpenStreetMap independently draws the same line. If you publish the map, verify the line against the Survey of India itself.",
  },
  {
    group: "Questions",
    q: "Does it need a server or an API key?",
    a: "No. It runs in the browser. Only the optional tile proxy for Mapbox GL JS and similar clients needs hosting.",
  },
  {
    group: "Questions",
    q: "Does it slow the map down?",
    a: "Tiles that do not touch the affected areas are returned untouched. The others take a few milliseconds each. The library is about 40 kB gzipped and has no runtime dependencies.",
  },
  {
    group: "Questions",
    q: "What is the license?",
    a: "The code is Apache-2.0. The border data is ODbL 1.0, and its attribution is added to the map for you. Both are described in the repository.",
  },
  {
    group: "Questions",
    q: "Does it work with TypeScript?",
    a: "Yes. Types ship with the package.",
  },
];

// Plain text for structured data: drop the inline markup.
export const plain = (s) => s.replace(/`([^`]*)`/g, "$1").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
