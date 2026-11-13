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
// pages in the deploy jobs; tests/picker.test.ts checks them. Since 2026-11-10 (the maintainer) the root
// carries what each school's page had in its top bar and its About: a link to the source code on GitHub,
// About with each school's section (scripts/lib/about.ts), and the Tsinghua World Model, which inspired it.
import fs from "node:fs";
import path from "node:path";
import type { Words } from "../../src/shared/school.ts";
import { INSPIRED_BY, LANDMARK_LIDAR, LINZ_ELEVATION_CREDIT, REPO } from "../../src/app/links.ts";
import type { Meta } from "../../src/shared/types.ts";
import { lookupWords, overlayWords } from "../../src/shared/words.ts";
import { ICON_BOXES, ICON_PATHS } from "../../src/ui/icons.ts";
import { type SchoolAbout, schoolAboutHtml } from "./about.ts";

/** A school on the list, with what its line on the picker is made from. */
export interface PickerSchool {
  id: string;
  /** The school's words: src/i18n/locales/en.json with its overlay laid over it, as its page's head has them. */
  words: Words;
  /** Its published meta.json. */
  meta: Meta;
  /** What its section of About is made from (scripts/lib/about.ts, loadSchoolAbout). */
  about: SchoolAbout;
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
.schools{display:grid;gap:12px;margin:28px 0 0;padding:0;list-style:none}
.schools>li{position:relative;padding:16px 48px 16px 18px;border:1px solid transparent;border-radius:12px;background:var(--panel);color:var(--text);box-shadow:0 10px 34px rgba(5,12,18,.18)}
.schools>li::after{content:"";position:absolute;top:50%;right:22px;width:10px;height:10px;border-top:2px solid var(--accent);border-right:2px solid var(--accent);transform:translateY(-50%) rotate(45deg)}
.schools>li:hover{border-color:var(--accent)}
.schools>li:focus-within{outline:2px solid var(--accent);outline-offset:3px}
.site{margin:0 0 2px;color:var(--accent);font:600 .75rem/1.3 var(--font);letter-spacing:.06em;text-transform:uppercase}
.schools h2{margin:0 0 6px;font:600 1.375rem/1.25 var(--font-display);overflow-wrap:anywhere}
.schools h2 a{color:inherit;text-decoration:none}
.schools h2 a::before{content:"";position:absolute;inset:0;border-radius:12px}
.schools h2 a:focus{outline:none}
.reo{margin:-2px 0 6px;font:1rem/1.3 var(--font-display);overflow-wrap:anywhere}
.facts{display:flex;flex-wrap:wrap;gap:2px 16px;margin:0;color:var(--muted);font-size:.9375rem}
.masthead{display:flex;flex-wrap:wrap-reverse;align-items:center;justify-content:space-between;gap:8px 20px;margin:0 0 8px}
.masthead h1{margin:0}
.top{display:flex;align-items:center;gap:4px;margin-left:auto}
.top a{display:inline-flex;align-items:center;justify-content:center;min-width:40px;min-height:40px;padding:0 10px;border-radius:10px;color:#33424d;font:600 .9375rem/1 var(--font);text-decoration:none}
.top a:hover{background:rgba(255,255,255,.6);color:var(--ink)}
.top a:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.top svg{width:22px;height:22px}
@media (max-width:560px){main{padding-top:20px}}
#about{margin-top:48px}
#about:not(:target):not(:has(:target)){display:none}
#about>h2{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
#about-close{font:600 .9375rem/1 var(--font)}
.inspired{margin-top:32px}
.inspired .facts{color:var(--text)}
#about>h2{margin:0 0 12px;font:600 1.75rem/1.2 var(--font-display)}
#about h3{margin:28px 0 8px;font:600 1.375rem/1.25 var(--font-display)}
#about h4{margin:18px 0 6px;font:600 1rem/1.3 var(--font)}
#about p,#about li,#about dd,#about td,#about th{font-size:.9375rem}
#about a{color:#0b4f7c}
.about-school{margin-top:20px;padding:4px 18px 16px;border-radius:12px;background:rgba(255,255,255,.6)}
.callout{margin:12px 0;padding:10px 14px;border-left:4px solid var(--accent);border-radius:8px;background:rgba(255,255,255,.7)}
.callout p{margin:4px 0 0}
.sources{margin:0;padding-left:18px}
.sources dl{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;margin:4px 0 10px}
.sources dt{color:#4a5a66}
.sources dd{margin:0}
.coverage{border-collapse:collapse}
.coverage th{padding:2px 16px 2px 0;font-weight:400;text-align:left}
.coverage td{text-align:right}
.coverage .sub th{padding-left:14px;color:#4a5a66}
.limits{margin:0;padding-left:18px}
.built{color:#4a5a66}
`.trim();

/** The GitHub mark, as the app draws it (src/ui/icons.ts). */
const github = () =>
  `<svg viewBox="${ICON_BOXES.github}" aria-hidden="true" focusable="false"><path d="${ICON_PATHS.github}" fill="currentColor"/></svg>`;

/**
 * The Tsinghua World Model, which inspired the site: a card under the schools, as they are drawn, with what
 * it inspired (the maintainer, 2026-11-10).
 */
function inspiredBy(shared: Words): string {
  const e = escapeHtml;
  return [
    `<ul class="schools inspired" aria-label="${e(word(shared, "about.inspirationTitle"))}">`,
    `<li data-world="${e(INSPIRED_BY.id)}">`,
    `<p class="site">${e(word(shared, "about.inspirationTitle"))}</p>`,
    `<h2><a id="inspired-by" href="${e(INSPIRED_BY.url)}" rel="noopener noreferrer">${e(word(shared, `travel.worlds.${INSPIRED_BY.id}.name`))}</a></h2>`,
    `<p class="facts" id="inspiration">${e(word(shared, "about.inspiration"))}</p>`,
    `</li>`,
    `</ul>`,
  ].join("");
}

/**
 * About: the site's code, then each school's section in the list's order. Hidden until asked for: shown while
 * the address points at it (the bar's About link, #about) or at a section in it (a school's page links to its
 * own, #about-<id>), and hidden again by its Close link; a browser without :has() shows it always.
 */
function about(shared: Words, schools: PickerSchool[]): string {
  const e = escapeHtml;
  const links = { repo: REPO, landmarkLidar: LANDMARK_LIDAR, linzElevationCredit: LINZ_ELEVATION_CREDIT };
  return [
    `<section id="about" aria-labelledby="about-title">`,
    `<h2><span id="about-title">${e(word(shared, "about.title"))}</span><a id="about-close" href="#">${e(word(shared, "nav.close"))}</a></h2>`,
    `<h3>${e(word(shared, "about.codeTitle"))}</h3>`,
    `<p>${e(word(shared, "about.code"))} <a href="${e(REPO)}" rel="noopener noreferrer">${e(word(shared, "about.repo"))}</a></p>`,
    `<h3>${e(word(shared, "picker.aboutSchools"))}</h3>`,
    ...schools.map((s) => schoolAboutHtml(s.id, word(s.words, "app.title"), s.words, s.about, links)),
    `</section>`,
  ].join("\n");
}

/**
 * One page: the heading with, on its line, the links to About and the source code, its lead, the notice, the list of
 * schools, and on the picker the Tsinghua World Model's card and About below it, hidden until asked for (the
 * page for an unknown path links to the picker's).
 */
function page(shared: Words, schools: PickerSchool[], words: { documentTitle: string; heading: string; lead: string }, withAbout: boolean): string {
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
<header class="masthead">
<h1>${e(words.heading)}</h1>
<nav class="top" aria-label="${e(word(shared, "picker.navLabel"))}">
<a id="about-link" href="${withAbout ? "#about" : "/#about"}">${e(word(shared, "nav.about"))}</a>
<a id="repo-link" href="${e(REPO)}" rel="noopener noreferrer" aria-label="${e(word(shared, "about.repo"))}" title="${e(word(shared, "about.repo"))}">${github()}</a>
</nav>
</header>
<p class="lead">${e(words.lead)}</p>
<p class="notice">${e(word(shared, "picker.notice"))}</p>
<ul class="schools" aria-label="${e(word(shared, "picker.listLabel"))}">
${items.join("\n")}
</ul>
${withAbout ? `${inspiredBy(shared)}\n${about(shared, schools)}` : ""}
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
    }, true),
    notFound: page(shared, schools, {
      documentTitle: word(shared, "picker.notFound.documentTitle"),
      heading: word(shared, "picker.notFound.heading"),
      lead: word(shared, "picker.notFound.lead"),
    }, false),
  };
}
