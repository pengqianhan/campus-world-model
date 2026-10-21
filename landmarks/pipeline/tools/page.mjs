// Where the tools find the landmark and the viewer's pages. Every tool runs in the landmark's folder,
// landmarks/<name>/ (../pipeline/run.sh <name> goes there), and finds its files there: config/, data/,
// refs/, out/. The pages are served from the repository root, so that their import maps reach the
// repository's own node_modules/three.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
/** This folder, landmarks/pipeline/tools. */
export const TOOLS = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(TOOLS, "../../..");
/** The landmark: the name of the folder the tool runs in. */
export const NAME = path.basename(process.cwd());
export const CONFIG = process.env.CONFIG ?? `config/${NAME}.json`;
if (path.resolve(process.cwd(), "..") !== path.join(ROOT, "landmarks") || !fs.existsSync(CONFIG)) {
  console.error(`run the tools in a landmark's folder (landmarks/<name>/, with config/<name>.json), or through landmarks/pipeline/run.sh <name>`);
  process.exit(2);
}
const SERVER = `http://localhost:${process.env.PORT ?? 8765}`;
/** The landmark's folder as the pages see it: references and masks are loaded from here. */
export const HERE = `${SERVER}/landmarks/${NAME}/`;
/** A page of the viewer (index.html or mask.html) showing this landmark, with more of the query. */
export const viewer = (file, query = "") => `${SERVER}/landmarks/pipeline/viewer/${file}?landmark=${NAME}${query.replace(/^[?&]?(?=.)/, "&")}`;
