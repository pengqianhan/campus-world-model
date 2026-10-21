// The triangles of one measured massing, for the top-view check in massing.py: builds
// landmarks/measured/model.js from a data file and writes every triangle as nine float32 numbers,
// metres east and north of the campus origin and up from the data's ground.zero.
//   node landmarks/pipeline/tools/massing_triangles.mjs <data.json> <triangles.bin>
// Node runs the site's TypeScript that the model builds with by stripping its types (Node 22.18 or later).
import fs from "node:fs";
import { build } from "../../measured/model.js";

const [source, target] = process.argv.slice(2);
if (!source || !target) throw new Error("usage: massing_triangles.mjs <data.json> <triangles.bin>");
const data = JSON.parse(fs.readFileSync(source, "utf8"));
const [cx, cy] = data.place.centre;
const group = build({}, undefined, data);
const out = [];
group.traverse((o) => {
  if (!o.isMesh) return;
  const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) out.push(p.getX(i) + cx, cy - p.getZ(i), p.getY(i));
});
fs.writeFileSync(target, Buffer.from(new Float32Array(out).buffer));
