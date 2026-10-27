// Snapshot OpenStreetMap context geometry (surrounding buildings, streets, parks, trees) with one
// Overpass query for each area the map draws (scripts/lib/areas.ts): the City / Grafton /
// Newmarket area, and each campus or building away from it.
// OSM data is © OpenStreetMap contributors, ODbL 1.0, so these snapshots are committed.
import fs from "node:fs";
import path from "node:path";
import { AREAS, type SceneArea } from "./lib/areas.ts";
import { askOverpass, closedOnDisk } from "./lib/overpass.ts";
import { RAW_DIR, snapshot } from "./lib/snapshot.ts";

const query = (area: SceneArea) => `
[out:json][timeout:180][bbox:${area.bbox.join(",")}];
(
  way["building"];
  relation["building"];
  way["building:part"];
  way["highway"];
  way["railway"="rail"];
  way["leisure"~"^(park|garden|pitch|playground|sports_centre|track)$"];
  relation["leisure"~"^(park|garden)$"];
  way["landuse"~"^(grass|forest|recreation_ground|cemetery|meadow|village_green)$"];
  way["natural"~"^(wood|water|scrub|grassland|tree_row)$"];
  relation["natural"~"^(wood|water)$"];
  way["waterway"];
  node["natural"="tree"];
);
out body geom qt;
`;

// Public Overpass instances, tried in order; the main one is often busy and answers 504. A busy one is
// asked again; one that refuses or redirects the query, or drops the connection where another instance
// answers after it, is recorded once and left alone, and a snapshot on disk is read with no request
// (scripts/lib/overpass.ts).
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const refresh = process.argv.includes("--refresh");
for (const area of AREAS) {
  // Go round the instances up to three times, a minute apart.
  const file = path.join(RAW_DIR, area.osm);
  const buf = await askOverpass(ENDPOINTS, {
    cached: () => (!refresh && fs.existsSync(file) ? fs.readFileSync(file) : undefined),
    get: (url) =>
      snapshot({
        source: "osm",
        file: area.osm,
        url,
        method: "POST",
        body: "data=" + encodeURIComponent(query(area)),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        // An API has no reason to send the query elsewhere: a redirect is a failure, never followed.
        redirect: "error",
        refresh,
      }),
    ...closedOnDisk,
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    warn: (message) => console.warn(message),
  }).catch((e: unknown) => {
    throw new Error(`${area.id}: ${e instanceof Error ? e.message : String(e)}`);
  });
  const data = JSON.parse(buf.toString("utf8")) as { elements: { type: string; tags?: Record<string, string> }[] };
  const count: Record<string, number> = {};
  for (const e of data.elements) {
    const t = e.tags ?? {};
    const k = t.building ? "building" : t["building:part"] ? "building:part" : t.highway ? "highway" : t.natural === "tree" ? "tree" : t.leisure ? "leisure" : t.landuse ? "landuse" : t.natural ? "natural" : t.railway ? "railway" : t.waterway ? "waterway" : "other";
    count[`${e.type}:${k}`] = (count[`${e.type}:${k}`] ?? 0) + 1;
  }
  console.log(area.id, buf.length, "bytes", data.elements.length, "elements", count);
}
