// Places each campus world of src/worlds/worlds.json that has no `place` yet: one OpenStreetMap Nominatim
// search for its `placeQuery`, through scripts/lib/snapshot.ts (cached, paced, logged in data/sources.json).
// The answer is OpenStreetMap data (© OpenStreetMap contributors, ODbL 1.0), so it is kept under
// data/raw/osm/nominatim/, which is committed. Nominatim's usage policy asks for at most one request a second
// and an honest User-Agent; snapshot.ts gives both. The maintainer runs it (AGENTS.md, "How a change lands"):
//   node scripts/worlds/geocode.ts [--refresh <id>]
import fs from "node:fs";
import path from "node:path";
import { HttpError, snapshot } from "../lib/snapshot.ts";
import type { World } from "../../src/worlds/worlds.ts";

const root = path.resolve(import.meta.dirname, "..", "..");
const listFile = path.join(root, "src", "worlds", "worlds.json");
const list = JSON.parse(fs.readFileSync(listFile, "utf8")) as { note: string; worlds: World[] };
const args = process.argv.slice(2);
const refresh = args[0] === "--refresh" ? args[1] : undefined;

interface Hit {
  lat: string;
  lon: string;
  osm_type: string;
  osm_id: number;
  display_name: string;
}

for (const w of list.worlds) {
  if (w.place && w.id !== refresh) continue;
  const file = `osm/nominatim/${w.id}.json`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(w.placeQuery)}`;
  let hits: Hit[];
  try {
    hits = JSON.parse((await snapshot({ source: "nominatim", file, url, refresh: w.id === refresh })).toString("utf8")) as Hit[];
  } catch (e) {
    // A 401, a 403 or a dropped connection is a verdict (AGENTS.md, "Closed is a verdict"): stop, ask nothing more.
    console.error(e instanceof HttpError ? `${w.id}: ${e.message}; stopping` : `${w.id}: ${(e as Error).message}; stopping`);
    process.exit(1);
  }
  const hit = hits[0];
  if (!hit) {
    console.error(`${w.id}: Nominatim finds nothing for "${w.placeQuery}"; change placeQuery`);
    continue;
  }
  const fetched = fs.statSync(path.join(root, "data", "raw", file)).mtime.toISOString().slice(0, 10);
  w.place = { lat: Number(Number(hit.lat).toFixed(5)), lon: Number(Number(hit.lon).toFixed(5)), osm: `${hit.osm_type}/${hit.osm_id}`, file: `data/raw/${file}`, date: fetched };
  console.log(`${w.id}: ${w.place.lat}, ${w.place.lon} (${w.place.osm}) ${hit.display_name}`);
}
fs.writeFileSync(listFile, JSON.stringify(list, null, 2) + "\n");
