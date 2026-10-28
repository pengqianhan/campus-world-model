// The two pages at the root of the Cloudflare site (docs/schools/DESIGN.md, section 7): index.html,
// the school picker, and 404.html, the page an unknown path gets. Both are static: no script and
// no WebGL. Each school's line comes from its meta.json and its words, and every other text from
// the picker.* keys of src/i18n/locales/en.json. A school's `reo`, shown under its name, is its name in
// te reo Māori as the school gives it on its own site: the University of Auckland's and AUT's home
// pages, read on 2026-10-27 through scripts/research/polite.mjs, robots.txt first ("Waipapa Taumata
// Rau", the University's title and logo, its home page redirecting once; "Te Wānanga Aronui o
// Tāmaki Makau Rau", AUT's welcome), and VUW's pages as docs/schools/vuw.md quotes them, its
// copyright page in the recon of 2026-10-22 ("Te Herenga Waka"), UC's own text as docs/schools/uc.md
// quotes it ("Te Whare Wānanga o Waitaha"), and the title of Massey's home page as
// docs/schools/massey.md quotes it ("Te Kunenga ki Pūrehuroa"). scripts/build-root.ts writes the two
// pages in the deploy jobs; tests/picker.test.ts checks them.
import fs from "node:fs";
import path from "node:path";
import type { Words } from "../../src/shared/school.ts";
import type { Meta } from "../../src/shared/types.ts";
import { lookupWords, overlayWords } from "../../src/shared/words.ts";

/** A school on the list, with what its line on the picker is made from. */
export interface PickerSchool {
  id: string;
  /** The school's words: src/i18n/locales/en.json with its overlay laid over it, as its page's head has them. */
  words: Words;
  /** Its published meta.json. */
  meta: Meta;
}

/** How much of a school the site shows, in the forms of docs/schools/DESIGN.md, section 2. */
export type Form = "floors" | "roomCodes" | "buildings";

/**
 * A school's form, from its meta.json. A layer with no verdict is the school's own and usable: the
 * University of Auckland's meta.json gives none. Indoor data that is not usable leaves the
 * buildings only; usable indoor data with floor-plan shapes is floors and rooms, and without them
 * rooms by code.
 */
export function schoolForm(meta: Meta): Form {
  if ((meta.layers?.indoor ?? "usable") !== "usable") return "buildings";
  if (meta.coverage.planShapes > 0) return "floors";
  if (meta.coverage.rooms > 0) return "roomCodes";
  return "buildings";
}

/** The date of a school's campus snapshot: that of its first source, the one its buildings come from (scripts/build-data.ts puts it first). */
export function campusSnapshot(meta: Meta): string {
  const date = meta.sources[0]?.snapshotDate;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`meta.json gives no campus snapshot date as YYYY-MM-DD: ${JSON.stringify(date)}`);
  return date;
}

/** The words of a school as its page's head has them (vite.config.ts): the shared English words with its overlay, if it has one. */
export function schoolWords(root: string, id: string, shared: Words): Words {
  const overlay = path.join(root, "src", "schools", id, "locales", "en.json");
  return overlayWords(shared, fs.existsSync(overlay) ? (JSON.parse(fs.readFileSync(overlay, "utf8")) as Words) : undefined);
}

/** Text made safe for HTML, in an element or in a quoted attribute. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** The text of a key, which must exist, with each {name} filled in. */
function word(words: Words, key: string, params: Record<string, string> = {}): string {
  const text = lookupWords(words, key);
  if (text === undefined) throw new Error(`src/i18n/locales/en.json has no text for "${key}"`);
  return text.replace(/\{(\w+)\}/g, (all, name: string) => params[name] ?? all);
}

/** A date such as 2026-10-13 in long form, "13 October 2026", in the words' own locale (_meta.intl), as About shows it. */
function longDate(date: string, shared: Words): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const locale = lookupWords(shared, "_meta.intl") ?? "en-NZ";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** The facts each school's line shows, as plain text, in the order they are shown. */
export function schoolLine(school: PickerSchool, shared: Words) {
  const date = campusSnapshot(school.meta);
  return {
    id: school.id,
    href: `/${school.id}/`,
    site: word(school.words, "app.title"),
    name: word(shared, `picker.schools.${school.id}.name`),
    reo: lookupWords(shared, `picker.schools.${school.id}.reo`),
    city: word(shared, `picker.schools.${school.id}.city`),
    form: word(shared, `picker.form.${schoolForm(school.meta)}`),
    date,
    snapshot: word(shared, "picker.snapshot", { date: longDate(date, shared) }),
  };
}

// The project's palette (src/ui/styles.css and src/scene/palette.ts): the map's sky and ground
// behind, the panels' ink, and the accent #ffb454. No university's colours and no logo.
const STYLE = `
:root{--ink:#0f1b25;--panel:#14222e;--text:#eef3f6;--muted:#a3b3bf;--accent:#ffb454;--sky:#dfe8ec;--ground:#e9e5da;--edge:#8b7b62;
--font:"Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,"Helvetica Neue","Noto Sans",Arial,sans-serif;
--font-display:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,"Noto Serif",serif}
*{box-sizing:border-box}
html{background:var(--sky)}
body{margin:0;min-height:100vh;background:linear-gradient(180deg,var(--sky) 0%,var(--ground) 100%);color:var(--ink);font:16px/1.5 var(--font)}
main{max-width:44rem;margin:0 auto;padding:56px 16px 48px}
h1{margin:0 0 8px;font:600 2.25rem/1.15 var(--font-display);overflow-wrap:anywhere}
.lead{margin:0 0 16px;color:#33424d}
.notice{margin:0;padding:10px 14px;border-left:4px solid var(--accent);border-radius:8px;background:rgba(255,255,255,.6);font-size:.9375rem}
ul{display:grid;gap:12px;margin:28px 0 0;padding:0;list-style:none}
li{position:relative;padding:16px 48px 16px 18px;border:1px solid transparent;border-radius:12px;background:var(--panel);color:var(--text);box-shadow:0 10px 34px rgba(5,12,18,.18)}
li::after{content:"";position:absolute;top:50%;right:22px;width:10px;height:10px;border-top:2px solid var(--accent);border-right:2px solid var(--accent);transform:translateY(-50%) rotate(45deg)}
li:hover{border-color:var(--accent)}
li:focus-within{outline:2px solid var(--accent);outline-offset:3px}
.site{margin:0 0 2px;color:var(--accent);font:600 .75rem/1.3 var(--font);letter-spacing:.06em;text-transform:uppercase}
h2{margin:0 0 6px;font:600 1.375rem/1.25 var(--font-display);overflow-wrap:anywhere}
h2 a{color:inherit;text-decoration:none}
h2 a::before{content:"";position:absolute;inset:0;border-radius:12px}
h2 a:focus{outline:none}
.reo{margin:-2px 0 6px;font:1rem/1.3 var(--font-display);overflow-wrap:anywhere}
.facts{display:flex;flex-wrap:wrap;gap:2px 16px;margin:0;color:var(--muted);font-size:.9375rem}
`.trim();

/** One page: the head, the heading and its lead, the notice, and the list of schools. */
function page(shared: Words, schools: PickerSchool[], words: { documentTitle: string; heading: string; lead: string }): string {
  const e = escapeHtml;
  const items = schools.map((school) => {
    const s = schoolLine(school, shared);
    return [
      `<li data-school="${e(s.id)}">`,
      `<p class="site">${e(s.site)}</p>`,
      `<h2><a href="${e(s.href)}">${e(s.name)}</a></h2>`,
      s.reo ? `<p class="reo" lang="mi">${e(s.reo)}</p>` : "",
      `<p class="facts"><span>${e(s.city)}</span><span>${e(s.form)}</span><span>${e(s.snapshot)}</span></p>`,
      `</li>`,
    ].join("");
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0f1b25">
<meta name="description" content="${e(word(shared, "picker.description"))}">
<meta property="og:title" content="${e(words.documentTitle)}">
<meta property="og:description" content="${e(word(shared, "picker.description"))}">
<meta property="og:type" content="website">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>${e(words.documentTitle)}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<h1>${e(words.heading)}</h1>
<p class="lead">${e(words.lead)}</p>
<p class="notice">${e(word(shared, "picker.notice"))}</p>
<ul aria-label="${e(word(shared, "picker.listLabel"))}">
${items.join("\n")}
</ul>
</main>
</body>
</html>
`;
}

/** The picker, index.html, and the page for an unknown path, 404.html, for the schools on the list in its order. */
export function pickerPages(schools: PickerSchool[], shared: Words): { index: string; notFound: string } {
  if (schools.length === 0) throw new Error("the picker needs one school or more");
  return {
    index: page(shared, schools, {
      documentTitle: word(shared, "picker.documentTitle"),
      heading: word(shared, "picker.heading"),
      lead: word(shared, "picker.lead"),
    }),
    notFound: page(shared, schools, {
      documentTitle: word(shared, "picker.notFound.documentTitle"),
      heading: word(shared, "picker.notFound.heading"),
      lead: word(shared, "picker.notFound.lead"),
    }),
  };
}
