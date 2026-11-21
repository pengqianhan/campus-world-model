// The two pages at the root of the Cloudflare site (docs/schools/DESIGN.md, section 7): index.html,
// the school picker, and 404.html, the page an unknown path gets. Both are static HTML. Since 2026-11-21 the
// picker also carries the globe (src/globe/), one module script that draws with WebGL above the list and leaves
// the page as it was where it cannot; 404.html still runs nothing. Each school's line comes from its meta.json and its words, and every other text from
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
// About with each school's section (scripts/lib/about.ts), and the Tsinghua World Model, which inspired it. Since
// 2026-11-20 (the maintainer; PROGRESS.md, "Decisions", A global collection of campus worlds) the list holds every
// campus world, by country: this site's schools, and the worlds made by others (src/worlds/worlds.json), each of
// which has a page of its own at /worlds/<id>/ (scripts/lib/worlds-pages.ts).
import fs from "node:fs";
import path from "node:path";
import type { Words } from "../../src/shared/school.ts";
import { INSPIRED_BY, INSPIRED_LIST, LANDMARK_LIDAR, OWN_LINEAGE, LINZ_ELEVATION_CREDIT, REPO } from "../../src/app/links.ts";
import type { Meta } from "../../src/shared/types.ts";
import type { World } from "../../src/worlds/worlds.ts";
import type { GlobeData } from "../../src/globe/data.ts";
import { lookupWords, overlayWords } from "../../src/shared/words.ts";
import { ICON_BOXES, ICON_PATHS } from "../../src/ui/icons.ts";
import { type SchoolAbout, schoolAboutHtml } from "./about.ts";
import { SITE_NAME, type SitemapEntry, headTags, isoDate, jsonLd, siteUrl } from "./seo.ts";

/** A school on the list, with what its line on the picker is made from. */
export interface PickerSchool {
  id: string;
  /** The school's words: src/i18n/locales/en.json with its overlay laid over it, as its page's head has them. */
  words: Words;
  /** Its published meta.json. */
  meta: Meta;
  /** What its section of About is made from (scripts/lib/about.ts, loadSchoolAbout). */
  about: SchoolAbout;
  /** Where its campus stands, from its published campus.json: its pin on the globe. A school without it has none. */
  origin?: { lat: number; lon: number };
}

/** The globe's files beside the page, as scripts/build-root.ts wrote them: its script and its land, by their paths from the root. */
export interface GlobeFiles {
  script: string;
  land: string;
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
export function word(words: Words, key: string, params: Record<string, string> = {}): string {
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

/** One line of the list: one of this site's schools, or a campus world made by others. */
export interface ListEntry {
  kind: "own" | "other";
  id: string;
  /** Its page: the school's map, or the world's page on this site. */
  href: string;
  /** The project's name, over the school's: the school's map's title, or the world's own. */
  site: string;
  /** The school, with its campus for a world made by others. */
  name: string;
  /** The school's name in its own language, with its language tag. */
  native?: { lang: string; text: string };
  country: string;
  /** The facts under it, as plain text, in the order shown. */
  facts: string[];
  /** The day it joined the list, YYYY-MM-DD: for a school of this site, the day of its campus snapshot. */
  added: string;
}

/** The country of this site's schools. */
const OWN_COUNTRY = "New Zealand";

/** A world's school, with its campus: "Zhejiang University, Zijingang campus". */
export function worldPlace(w: World): string {
  return w.campus ? `${w.school.en}, ${w.campus.en}` : w.school.en;
}

/** A world's school's name in its own language, with its campus where it has one. */
export function worldNative(w: World): { lang: string; text: string } | undefined {
  const s = w.school.native;
  if (!s) return undefined;
  const c = w.campus?.native;
  return { lang: s.lang, text: c && c.lang === s.lang ? `${s.text} ${c.text}` : s.text };
}

/** Every line of the list: this site's schools in the list's order, then the worlds made by others in the order they joined. */
export function listEntries(schools: PickerSchool[], worlds: World[], shared: Words): ListEntry[] {
  const own = schools.map((school): ListEntry => {
    const s = schoolLine(school, shared);
    return {
      kind: "own",
      id: s.id,
      href: s.href,
      site: s.site,
      name: s.name,
      native: s.reo ? { lang: "mi", text: s.reo } : undefined,
      country: OWN_COUNTRY,
      facts: [s.city, s.form, s.snapshot],
      added: s.date,
    };
  });
  const others = [...worlds].sort((a, b) => a.added.localeCompare(b.added) || a.id.localeCompare(b.id)).map((w): ListEntry => ({
    kind: "other",
    id: w.id,
    href: `/worlds/${w.id}/`,
    site: w.title,
    name: worldPlace(w),
    native: worldNative(w),
    country: w.country,
    facts: [w.city, ...w.flags.map((f) => word(shared, `picker.worlds.flags.${f}`)), ...(w.by ? [word(shared, "picker.worlds.by", { name: w.by.name })] : [])],
    added: w.added,
  }));
  return [...own, ...others];
}

/** The list's countries in alphabetical order, each with its lines in the list's order. */
export function byCountry(entries: ListEntry[]): [string, ListEntry[]][] {
  const groups = new Map<string, ListEntry[]>();
  for (const x of entries) groups.set(x.country, [...(groups.get(x.country) ?? []), x]);
  return [...groups].sort(([a], [b]) => a.localeCompare(b, "en"));
}

// The project's palette (src/ui/styles.css and src/scene/palette.ts): the map's sky and ground
// behind, the panels' ink, and the accent #ffb454. No university's colours and no logo.
export const STYLE = `
:root{--ink:#0f1b25;--panel:#14222e;--text:#eef3f6;--muted:#a3b3bf;--accent:#ffb454;--accent-ink:#a65400;--card:#ffffff;--line:#d3dde3;--sky:#dfe8ec;--ground:#e9e5da;--edge:#8b7b62;
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
.schools>li{position:relative;padding:16px 48px 16px 18px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);box-shadow:0 4px 16px rgba(15,27,37,.06)}
.schools>li::after{content:"";position:absolute;top:50%;right:22px;width:10px;height:10px;border-top:2px solid #c06a0c;border-right:2px solid #c06a0c;transform:translateY(-50%) rotate(45deg)}
.schools>li:hover{border-color:var(--accent);box-shadow:0 6px 22px rgba(15,27,37,.12)}
.schools>li:focus-within{outline:2px solid var(--accent);outline-offset:3px}
.site{margin:0 0 2px;color:var(--accent-ink);font:600 .75rem/1.3 var(--font);letter-spacing:.06em;text-transform:uppercase}
.schools h3{margin:0 0 6px;font:600 1.375rem/1.25 var(--font-display);overflow-wrap:anywhere}
.schools h3 a{color:inherit;text-decoration:none}
.schools h3 a::before{content:"";position:absolute;inset:0;border-radius:12px}
.schools h3 a:focus{outline:none}
.country{margin:32px 0 0;font:600 1.5rem/1.2 var(--font-display)}
.country+.schools{margin-top:12px}
.mark{color:var(--accent-ink);font-weight:600}
.add-note{margin:20px 0 0;padding:10px 14px;border:1px dashed var(--line);border-radius:12px;color:#33424d;font-size:.9375rem}
.add-note a{color:#0b4f7c}
.schools>li.lit{border-color:var(--accent)}
body.wide main{max-width:84rem}
body.wide .lead,body.wide .notice,body.wide #about{max-width:46rem}
.explorer{display:flex;flex-direction:column;gap:8px;margin-top:24px}
.explorer #globe{order:-1}
.explorer .country:first-child{margin-top:8px}
#globe{margin:0}
#globe[hidden]{display:none}
@media (min-width:900px){
.explorer:has(#globe:not([hidden])){display:grid;grid-template-columns:minmax(300px,25rem) 1fr;gap:24px;height:min(82vh,820px)}
.explorer:has(#globe:not([hidden])) #worlds{min-height:0;overflow-y:auto;padding:0 10px 16px 2px;scrollbar-width:thin}
.explorer:has(#globe:not([hidden])) #globe{order:0;display:flex;flex-direction:column;min-height:0}
.explorer:has(#globe:not([hidden])) .globe-stage{flex:1;height:auto}
.explorer:has(#globe:not([hidden])) .schools>li{padding:12px 40px 12px 14px}
.explorer:has(#globe:not([hidden])) .schools h3{font-size:1.125rem}
}
.globe-stage{position:relative;height:440px;border:1px solid var(--line);border-radius:16px;background:radial-gradient(circle at 50% 45%,#ffffff 0%,#eaf1f4 55%,#dbe6eb 100%);overflow:hidden;cursor:grab}
.globe-stage canvas{display:block;width:100%;height:100%}
.globe-tip{position:absolute;max-width:220px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);box-shadow:0 6px 20px rgba(15,27,37,.15);pointer-events:none}
.globe-tip .site{margin:0}
.globe-tip .name{margin:0;font:600 1rem/1.3 var(--font-display)}
.globe-tip .name a{color:inherit}
.globe-tip.open{pointer-events:auto}
.globe-tip ul{margin:4px 0 0;padding:0;list-style:none}
.globe-tip li+li{margin-top:6px}
.globe-tip .lineage{margin:6px 0 0;color:#4a5a66;font-size:.8125rem}
.globe-tour{position:absolute;left:12px;bottom:12px;min-height:40px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--ink);font:600 .875rem/1 var(--font);cursor:pointer;box-shadow:0 2px 8px rgba(15,27,37,.08)}
.globe-tour:hover{border-color:var(--accent)}
.globe-tour:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
#globe figcaption{margin:6px 0 0;color:#4a5a66;font-size:.875rem}
@media (max-width:560px){.globe-stage{height:320px}}
.reo{margin:-2px 0 6px;color:#33424d;font:1rem/1.3 var(--font-display);overflow-wrap:anywhere}
.facts{display:flex;flex-wrap:wrap;gap:2px 16px;margin:0;color:#4a5a66;font-size:.9375rem}
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
    `<h3>${e(word(shared, "about.inspirationTitle"))}</h3>`,
    `<p id="inspiration">${e(word(shared, "about.inspiration"))} <a id="inspired-by" href="${e(INSPIRED_BY.url)}" rel="noopener noreferrer">${e(word(shared, `travel.worlds.${INSPIRED_BY.id}.name`))}</a></p>`,
    `<p id="inspiration-list">${e(word(shared, "picker.worlds.inspirationList"))} <a href="${e(INSPIRED_LIST.url)}" rel="noopener noreferrer">${e(INSPIRED_LIST.name)}</a></p>`,
    `<h3>${e(word(shared, "picker.aboutSchools"))}</h3>`,
    ...schools.map((s) => schoolAboutHtml(s.id, word(s.words, "app.title"), s.words, s.about, links)),
    `</section>`,
  ].join("\n");
}

/**
 * The keys of the site's questions and answers, picker.faq.<key>, in their order. Since 2026-11-21 (the maintainer)
 * the page no longer shows them; llms.txt still gives them to AI assistants.
 */
export const FAQ_KEYS = ["what", "shows", "add", "room", "sources", "official", "mistake"] as const;

/** The site's questions, each with its answer, as plain text. */
export function faq(shared: Words): { q: string; a: string }[] {
  return FAQ_KEYS.map((k) => ({ q: word(shared, `picker.faq.${k}.q`), a: word(shared, `picker.faq.${k}.a`) }));
}

/**
 * The picker's structured data (scripts/lib/seo.ts): the site and the list of its campus worlds, in the words the
 * page shows.
 */
function pickerJsonLd(shared: Words, entries: ListEntry[]): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: siteUrl(),
        description: word(shared, "picker.description"),
        inLanguage: lookupWords(shared, "_meta.intl") ?? "en-NZ",
      },
      {
        "@type": "ItemList",
        name: word(shared, "picker.listLabel"),
        itemListElement: entries.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: `${x.site}: ${x.name}`, url: siteUrl(x.href.slice(1)) })),
      },
    ],
  };
}

/** What the page gives the globe (src/globe/data.ts): a point for each line of the list that has a place, and its words. */
export function globeData(schools: PickerSchool[], worlds: World[], shared: Words, land: string): GlobeData {
  const where = new Map<string, { lat: number; lon: number }>();
  for (const s of schools) if (s.origin) where.set(s.id, s.origin);
  for (const w of worlds) if (w.place) where.set(w.id, { lat: w.place.lat, lon: w.place.lon });
  const points = listEntries(schools, worlds, shared).flatMap((x) => {
    const at = where.get(x.id);
    return at ? [{ id: x.id, site: x.site, name: x.name, href: x.href, lat: at.lat, lon: at.lon, own: x.kind === "own", added: x.added }] : [];
  });
  // Lineage, only where a project says so in public: this site's own (OWN_LINEAGE), and each world's inspiredBy.
  const on = new Set(points.map((p) => p.id));
  const arcs = [
    { from: INSPIRED_BY.id, to: OWN_LINEAGE.to, quote: OWN_LINEAGE.quote, url: OWN_LINEAGE.url },
    ...worlds.flatMap((w) => (w.inspiredBy ? [{ from: w.inspiredBy.id, to: w.id, quote: w.inspiredBy.quote, url: w.inspiredBy.url }] : [])),
  ].filter((a) => on.has(a.from) && on.has(a.to));
  const g = (k: string) => word(shared, `picker.worlds.globe.${k}`);
  return { points, arcs, land, words: { label: g("label"), tour: g("tour"), stop: g("stop"), group: g("group"), inspired: g("inspired") } };
}

/** The globe above the list, hidden until its script shows it, with its data as JSON that no browser runs. */
function globe(shared: Words, data: GlobeData, script: string): { figure: string; scripts: string } {
  const e = escapeHtml;
  return {
    figure: [
      `<figure id="globe" hidden aria-label="${e(data.words.label)}">`,
      `<div class="globe-stage"><div class="globe-tip" hidden></div><button class="globe-tour" type="button" hidden>${e(data.words.tour)}</button></div>`,
      `<figcaption>${e(word(shared, "picker.worlds.globe.caption"))}</figcaption>`,
      `</figure>`,
    ].join("\n"),
    scripts: [
      `<script type="application/json" id="globe-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`,
      `<script type="module" src="${e(script)}"></script>`,
    ].join("\n"),
  };
}

/**
 * One page: the heading with, on its line, the links to About and the source code, its lead, the notice, the list of
 * schools, and on the picker the questions with their answers, the Tsinghua World Model's card and About below it,
 * hidden until asked for (the page for an unknown path links to the picker's). The picker's head names its one
 * address, its picture and its structured data; the page for an unknown path asks not to be indexed.
 */
function page(shared: Words, schools: PickerSchool[], worlds: World[], words: { documentTitle: string; heading: string; lead: string }, withAbout: boolean, files?: GlobeFiles): string {
  const e = escapeHtml;
  const entries = listEntries(schools, worlds, shared);
  const seo = withAbout
    ? `${headTags({ url: siteUrl(), image: siteUrl("og.jpg"), imageAlt: word(shared, "picker.imageAlt") })}\n${jsonLd(pickerJsonLd(shared, entries))}`
    : `<meta name="robots" content="noindex">`;
  const item = (x: ListEntry) =>
    [
      `<li data-${x.kind === "own" ? "school" : "world"}="${e(x.id)}">`,
      `<p class="site">${e(x.site)}</p>`,
      `<h3><a href="${e(x.href)}">${e(x.name)}</a></h3>`,
      x.native ? `<p class="reo" lang="${e(x.native.lang)}">${e(x.native.text)}</p>` : "",
      `<p class="facts">${x.facts.map((f) => `<span>${e(f)}</span>`).join("")}${x.kind === "own" ? `<span class="mark">${e(word(shared, "picker.worlds.ownMark"))}</span>` : ""}</p>`,
      `</li>`,
    ].join("");
  // The globe, on the picker: beside the list on a wide screen, above it on a narrow one (STYLE, .explorer).
  const g = withAbout && files ? globe(shared, globeData(schools, worlds, shared, files.land), files.script) : undefined;
  const lists = byCountry(entries).map(([country, xs]) =>
    [`<h2 class="country">${e(country)}</h2>`, `<ul class="schools" aria-label="${e(country)}">`, ...xs.map(item), `</ul>`].join("\n"),
  );
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#dfe8ec">
<meta name="description" content="${e(word(shared, "picker.description"))}">
<meta property="og:title" content="${e(words.documentTitle)}">
<meta property="og:description" content="${e(word(shared, "picker.description"))}">
<meta property="og:type" content="website">
${seo}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>${e(words.documentTitle)}</title>
<style>${STYLE}</style>
</head>
<body${g ? ' class="wide"' : ""}>
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
<div class="explorer">
<section id="worlds" aria-label="${e(word(shared, "picker.listLabel"))}">
${lists.join("\n")}
${withAbout ? `<p class="add-note">${e(word(shared, "picker.worlds.addNote"))} <a href="${e(REPO)}/issues/new" rel="noopener noreferrer">${e(word(shared, "picker.worlds.addLink"))}</a></p>` : ""}
</section>
${g ? g.figure : ""}
</div>
${withAbout ? about(shared, schools) : ""}${g ? `\n${g.scripts}` : ""}
</main>
</body>
</html>
`;
}

/**
 * The pages of the sitemap: the picker, dated by the newest school's data, then each school's page and the pages
 * under it, its building list and its buildings' pages (buildingPagePaths in scripts/lib/building-pages.ts), dated
 * by its meta.json's generatedAt.
 */
export function sitemapEntries(schools: PickerSchool[], pagesUnder: Record<string, string[]>, worlds: World[] = []): SitemapEntry[] {
  const pages = schools.flatMap((s) => {
    const lastmod = isoDate(s.meta.generatedAt);
    const under = pagesUnder[s.id];
    if (!under) throw new Error(`no pages given under ${s.id}`);
    return [`${s.id}/`, ...under.map((p) => `${s.id}/${p}`)].map((p) => ({ url: siteUrl(p), lastmod }));
  });
  const worldPages = worlds.map((w) => ({ url: siteUrl(`worlds/${w.id}/`), lastmod: [w.added, w.screenshot?.date, w.place?.date].filter(Boolean).sort().at(-1) }));
  const newest = [...pages, ...worldPages].map((p) => p.lastmod).filter(Boolean).sort().at(-1);
  return [{ url: siteUrl(), lastmod: newest }, ...pages, ...worldPages];
}

/**
 * llms.txt (llmstxt.org): the site in Markdown for AI assistants. What it is, each school's map with its line
 * from the picker, the worlds made by others, the site's questions with their answers (which the page itself no
 * longer shows), the addresses that open a place on a map, and the links to About and the source code. Every text
 * comes from the picker.* words.
 */
export function llmsTxt(schools: PickerSchool[], shared: Words, worlds: World[] = []): string {
  const maps = schools.map((school) => {
    const s = schoolLine(school, shared);
    const name = s.reo ? `${s.name} (${s.reo})` : s.name;
    return `- [${s.site}](${siteUrl(`${s.id}/`)}): ${name}, ${s.city}. ${s.form}. ${s.snapshot}. [${word(shared, "picker.llms.buildings")}](${siteUrl(`${s.id}/buildings/`)})`;
  });
  const others = listEntries([], worlds, shared).map((x) => {
    const name = x.native ? `${x.name} (${x.native.text})` : x.name;
    return `- [${x.site}](${siteUrl(x.href.slice(1))}): ${name}, ${x.country}. ${x.facts.join(". ")}.`;
  });
  const [what, ...rest] = faq(shared);
  return [
    `# ${word(shared, "picker.heading")}`,
    "",
    `> ${word(shared, "picker.description")}`,
    "",
    what!.a,
    "",
    `## ${word(shared, "picker.llms.mapsTitle")}`,
    "",
    ...maps,
    "",
    ...(others.length ? [`## ${word(shared, "picker.worlds.othersTitle")}`, "", ...others, ""] : []),
    `## ${word(shared, "picker.faqTitle")}`,
    "",
    ...rest.flatMap(({ q, a }) => [`### ${q}`, "", a, ""]),
    `## ${word(shared, "picker.llms.linksTitle")}`,
    "",
    ...["linkBuilding", "linkFloor", "linkRoom"].map((k) => `- ${word(shared, `picker.llms.${k}`)}`),
    "",
    `## ${word(shared, "picker.llms.moreTitle")}`,
    "",
    `- [${word(shared, "picker.llms.about")}](${siteUrl("#about")})`,
    `- [${word(shared, "picker.llms.repo")}](${REPO})`,
    "",
  ].join("\n");
}

/** The picker, index.html, and the page for an unknown path, 404.html, for the schools on the list in its order. */
export function pickerPages(schools: PickerSchool[], shared: Words, worlds: World[] = [], files?: GlobeFiles): { index: string; notFound: string } {
  if (schools.length === 0) throw new Error("the picker needs one school or more");
  return {
    index: page(shared, schools, worlds, {
      documentTitle: word(shared, "picker.documentTitle"),
      heading: word(shared, "picker.heading"),
      lead: word(shared, "picker.lead"),
    }, true, files),
    notFound: page(shared, schools, worlds, {
      documentTitle: word(shared, "picker.notFound.documentTitle"),
      heading: word(shared, "picker.notFound.heading"),
      lead: word(shared, "picker.notFound.lead"),
    }, false),
  };
}
