// Where the tools find the page. The page is served from the repository root, so that its import map
// reaches the repository's own node_modules/three; this folder is a path below it.
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ROOT = path.resolve(here, "../..");
export const PAGE = `http://localhost:${process.env.PORT ?? 8765}/${path.relative(ROOT, here).split(path.sep).join("/")}/`;
