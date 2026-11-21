// Writes the root of the Cloudflare site (docs/schools/DESIGN.md, section 7) after the deploy jobs
// have laid out each school at <site>/<id>/: index.html, the school picker; 404.html, which
// Cloudflare Pages gives every unknown path with status 404 (a site without a top-level 404.html is
// taken for a single-page app, and every unknown path would get the picker with status 200); and
// the favicon both pages name. The pages are static HTML; the picker also loads the globe, built into
// globe/ by scripts/lib/globe-build.ts (scripts/lib/picker.ts).
// Beside them, what search engines and AI assistants read (scripts/lib/seo.ts): og.jpg, the
// picker's picture for link previews (docs/og/home.jpg), sitemap.xml, robots.txt and llms.txt.
//   node scripts/build-root.ts <list.json> <site>
// Each school's meta.json is read from <site>/<id>/data/, the file the site publishes, so a school
// on the list that was not laid out stops the job; About's section for it from the same folder
// (scripts/lib/about.ts) and, for its landmarks, the repository's landmarks/. The campus worlds made by
// others come from src/worlds/worlds.json (scripts/lib/worlds-pages.ts): each has its page at
// worlds/<id>/index.html, with its screenshot beside it.
import fs from "node:fs";
import path from "node:path";
import type { Words } from "../src/shared/school.ts";
import type { CampusData, Meta } from "../src/shared/types.ts";
import { loadSchoolAbout } from "./lib/about.ts";
import { buildingPagePaths } from "./lib/building-pages.ts";
import { buildGlobe } from "./lib/globe-build.ts";
import { llmsTxt, pickerPages, schoolWords, sitemapEntries } from "./lib/picker.ts";
import { readWorlds, worldPageFile } from "./lib/worlds-pages.ts";
import { parseSchoolList } from "./lib/school-list.ts";
import { robotsTxt, sitemapXml } from "./lib/seo.ts";

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
    const { origin } = readJson<{ origin: { lat: number; lon: number } }>(path.join(site, id, "data", "campus.json"));
    return { id, words: schoolWords(root, id, shared), meta: readJson<Meta>(meta), about: loadSchoolAbout(root, path.join(site, id, "data"), id), origin };
  });
  const worlds = readWorlds(root, ids);
  const globe = await buildGlobe(root, site);
  const { index, notFound } = pickerPages(schools, shared, worlds, globe);
  for (const w of worlds) {
    const page = worldPageFile(w, worlds, shared);
    fs.mkdirSync(path.join(site, path.dirname(page.path)), { recursive: true });
    fs.writeFileSync(path.join(site, page.path), page.html);
    if (w.screenshot) fs.copyFileSync(path.join(root, "src", "worlds", "screenshots", w.screenshot.file), path.join(site, "worlds", w.id, "screenshot.jpg"));
  }
  fs.writeFileSync(path.join(site, "index.html"), index);
  fs.writeFileSync(path.join(site, "404.html"), notFound);
  fs.copyFileSync(path.join(root, "public", "favicon.svg"), path.join(site, "favicon.svg"));
  // What search engines and AI assistants read (scripts/lib/seo.ts): the picker's picture for link
  // previews, the sitemap of the picker and each school's page, robots.txt and llms.txt.
  fs.copyFileSync(path.join(root, "docs", "og", "home.jpg"), path.join(site, "og.jpg"));
  const pagesUnder = Object.fromEntries(ids.map((id) => [id, buildingPagePaths({ campus: readJson<CampusData>(path.join(site, id, "data", "campus.json")) })]));
  fs.writeFileSync(path.join(site, "sitemap.xml"), sitemapXml(sitemapEntries(schools, pagesUnder, worlds)));
  fs.writeFileSync(path.join(site, "robots.txt"), robotsTxt());
  fs.writeFileSync(path.join(site, "llms.txt"), llmsTxt(schools, shared, worlds));
  console.log(`${site}: index.html and 404.html list ${ids.join(", ")} and ${worlds.length} worlds by others; worlds/<id>/, sitemap.xml, robots.txt and llms.txt written`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
