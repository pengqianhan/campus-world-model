// Snapshots the land of the world for the globe on the page at the site's root: Natural Earth's 1:110m land
// polygons (public domain, naturalearthdata.com), as the Natural Earth project publishes them in GeoJSON on
// GitHub. One request through scripts/lib/snapshot.ts, kept in data/raw/naturalearth/, which is committed
// (AGENTS.md, "Snapshot once": openly licensed raw data). scripts/build-root.ts reads it. The maintainer runs it:
//   node scripts/worlds/fetch-land.ts
import { snapshot } from "../lib/snapshot.ts";

const url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_land.geojson";
const buf = await snapshot({ source: "naturalearth", file: "naturalearth/ne_110m_land.geojson", url });
const land = JSON.parse(buf.toString("utf8")) as { features: unknown[] };
console.log(`ne_110m_land.geojson: ${land.features.length} polygons`);
