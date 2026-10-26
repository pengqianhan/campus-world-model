// Writes the root of the Cloudflare site (docs/schools/DESIGN.md, section 7) after the deploy jobs
// have laid out each school at <site>/<id>/: index.html, the school picker; 404.html, which
// Cloudflare Pages gives every unknown path with status 404 (a site without a top-level 404.html is
// taken for a single-page app, and every unknown path would get the picker with status 200); and
// the favicon both pages name. The pages are static: no script and no WebGL (scripts/lib/picker.ts).
//   node scripts/build-root.ts <list.json> <site>
// Each school's meta.json is read from <site>/<id>/data/, the file the site publishes, so a school
// on the list that was not laid out stops the job.
import fs from "node:fs";
import path from "node:path";
import type { Words } from "../src/shared/school.ts";
import type { Meta } from "../src/shared/types.ts";
import { pickerPages, schoolWords } from "./lib/picker.ts";
import { parseSchoolList } from "./lib/school-list.ts";

const [list, site, ...rest] = process.argv.slice(2);
if (!list || !site || rest.length) {
  console.error("usage: node scripts/build-root.ts <list.json> <site>");
  process.exit(2);
}

const root = path.resolve(import.meta.dirname, "..");
const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8")) as T;
try {
  const ids = parseSchoolList(fs.readFileSync(list, "utf8"));
  const shared = readJson<Words>(path.join(root, "src", "i18n", "locales", "en.json"));
  const schools = ids.map((id) => {
    const meta = path.join(site, id, "data", "meta.json");
    if (!fs.existsSync(meta)) throw new Error(`${meta} is missing: lay out every school on the list before the picker`);
    return { id, words: schoolWords(root, id, shared), meta: readJson<Meta>(meta) };
  });
  const { index, notFound } = pickerPages(schools, shared);
  fs.writeFileSync(path.join(site, "index.html"), index);
  fs.writeFileSync(path.join(site, "404.html"), notFound);
  fs.copyFileSync(path.join(root, "public", "favicon.svg"), path.join(site, "favicon.svg"));
  console.log(`${site}: index.html and 404.html list ${ids.join(", ")}`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
