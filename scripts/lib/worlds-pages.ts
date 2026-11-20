// The page of each campus world made by others, at /worlds/<id>/ (PROGRESS.md, "Decisions", A global collection
// of campus worlds): a static page, with no script and no WebGL, in the picker's style. It says what the world
// is in its makers' own description, shows our screenshot of it with where and when it was taken (or says why
// there is none), gives its school in English and in the school's own language, its facts and flags, the words
// in which it names what inspired it, and links to play it and to its source. It says plainly that the world is
// not this site's. scripts/build-root.ts writes it beside the picker; the sitemap and llms.txt list it.
import fs from "node:fs";
import path from "node:path";
import type { Words } from "../../src/shared/school.ts";
import { type World, worldProblems } from "../../src/worlds/worlds.ts";
import { longDate } from "./about.ts";
import { type PageFile, breadcrumbList, crumbs, shell } from "./building-pages.ts";
import { escapeHtml as e, word, worldNative, worldPlace } from "./picker.ts";
import { siteUrl } from "./seo.ts";

const WORLD_STYLE = `
.shot{display:block;width:100%;height:auto;aspect-ratio:16/9;margin:16px 0 4px;border-radius:12px;background:var(--panel);box-shadow:0 10px 34px rgba(5,12,18,.18)}
.credit,.why{margin:0;color:#4a5a66;font-size:.875rem}
.why{margin-top:16px}
.about{margin:16px 0 0;font-size:1.0625rem}
.actions{display:flex;flex-wrap:wrap;gap:8px}
.flags{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;padding:0;list-style:none}
.flags li{padding:2px 10px;border-radius:999px;background:var(--panel);color:var(--accent);font-size:.8125rem;font-weight:600}
.facts-list{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;margin:0}
.facts-list dt{color:#4a5a66}
.facts-list dd{margin:0;overflow-wrap:anywhere}
.facts-list a,.credit a,blockquote a{color:#0b4f7c}
blockquote{margin:8px 0 0;padding:8px 14px;border-left:4px solid var(--accent);border-radius:8px;background:rgba(255,255,255,.6)}
.notours{margin:24px 0 0;padding:10px 14px;border-left:4px solid var(--accent);border-radius:8px;background:rgba(255,255,255,.6);font-size:.9375rem}
`.trim();

/** The list of worlds made by others, as src/worlds/worlds.json gives it, checked: throws at the first problem. */
export function readWorlds(root: string, ownIds: readonly string[]): World[] {
  const list = JSON.parse(fs.readFileSync(path.join(root, "src", "worlds", "worlds.json"), "utf8")) as { worlds: World[] };
  const problems = worldProblems(list.worlds, ownIds);
  for (const w of list.worlds) {
    if (!w.place) problems.push(`world "${w.id}": no place; run node scripts/worlds/geocode.ts`);
    if (w.screenshot && !fs.existsSync(path.join(root, "src", "worlds", "screenshots", w.screenshot.file))) problems.push(`world "${w.id}": no file src/worlds/screenshots/${w.screenshot.file}`);
  }
  if (problems.length) throw new Error(`src/worlds/worlds.json:\n${problems.join("\n")}`);
  return list.worlds;
}

/** The page of one world, worlds/<id>/index.html, and the screenshot it shows, worlds/<id>/screenshot.jpg, if it has one. */
export function worldPageFile(w: World, all: World[], shared: Words): PageFile {
  const place = worldPlace(w);
  const native = worldNative(w);
  const url = siteUrl(`worlds/${w.id}/`);
  const crumb = word(shared, "picker.worlds.page.crumb");
  const title = word(shared, "picker.worlds.page.documentTitle", { title: w.title, place });
  const description = word(shared, "picker.worlds.page.description", { title: w.title, about: w.about });
  const p = (key: string, params: Record<string, string> = {}) => word(shared, `picker.worlds.page.${key}`, params);
  const link = (href: string, text: string) => `<a href="${e(href)}" rel="noopener noreferrer">${e(text)}</a>`;
  const inspiredBy = w.inspiredBy && all.find((o) => o.id === w.inspiredBy!.id);
  const facts: [string, string][] = [
    [p("school"), e(w.school.en) + (w.school.native ? ` <span lang="${e(w.school.native.lang)}">(${e(w.school.native.text)})</span>` : "")],
    ...(w.campus ? [[p("campus"), e(w.campus.en) + (w.campus.native ? ` <span lang="${e(w.campus.native.lang)}">(${e(w.campus.native.text)})</span>` : "")] as [string, string]] : []),
    [p("city"), e(w.city)],
    [p("country"), e(w.country)],
    ...(w.by ? [[p("by"), w.by.url ? link(w.by.url, w.by.name) : e(w.by.name)] as [string, string]] : []),
    [p("added"), e(longDate(w.added, shared))],
  ];
  const body = [
    crumbs(shared, [{ name: crumb, href: "/" }, { name: w.title }]),
    `<p class="site">${e(place)}</p>`,
    `<h1>${e(w.title)}</h1>`,
    native ? `<p class="reo" lang="${e(native.lang)}">${e(native.text)}</p>` : "",
    w.screenshot
      ? `<img class="shot" src="screenshot.jpg" width="960" height="540" alt="${e(p("screenshotAlt", { title: w.title }))}">\n<p class="credit">${e(p("screenshotCredit", { url: w.screenshot.url, date: longDate(w.screenshot.date, shared) }))}</p>`
      : `<p class="why">${e(p("noScreenshot", { why: w.noScreenshot ?? "" }))}</p>`,
    `<p class="about">${e(w.about)}</p>`,
    w.flags.length ? `<ul class="flags">${w.flags.map((f) => `<li>${e(word(shared, `picker.worlds.flags.${f}`))}</li>`).join("")}</ul>` : "",
    `<p class="actions">${[
      w.play ? `<a class="open" href="${e(w.play)}" rel="noopener noreferrer">${e(p("play", { title: w.title }))}</a>` : "",
      w.source ? `<a class="open" href="${e(w.source)}" rel="noopener noreferrer">${e(p("source"))}</a>` : "",
    ].join("")}</p>`,
    `<section aria-labelledby="facts-title">`,
    `<h2 id="facts-title">${e(p("factsTitle"))}</h2>`,
    `<dl class="facts-list">${facts.map(([k, v]) => `<dt>${e(k)}</dt><dd>${v}</dd>`).join("")}</dl>`,
    w.inspiredBy
      ? `<p class="why">${e(p("inspiredBy", { name: inspiredBy?.title ?? w.inspiredBy.id }))}</p>\n<blockquote>${e(w.inspiredBy.quote)} ${link(w.inspiredBy.url, w.inspiredBy.url)}</blockquote>`
      : "",
    w.place ? `<p class="credit">${e(p("placeCredit", { date: longDate(w.place.date, shared) }))}</p>` : "",
    `</section>`,
    `<p class="notours">${e(p("notOurs", { title: w.title, school: w.school.en }))}</p>`,
  ].filter(Boolean).join("\n");
  const html = shell({
    title,
    description,
    url,
    image: w.screenshot ? siteUrl(`worlds/${w.id}/screenshot.jpg`) : siteUrl("og.jpg"),
    imageAlt: w.screenshot ? p("screenshotAlt", { title: w.title }) : p("imageAlt"),
    favicon: "/favicon.svg",
    data: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "CreativeWork", name: w.title, description: w.about, url: w.play ?? w.source, ...(w.by ? { creator: { "@type": "Organization", name: w.by.name, ...(w.by.url ? { url: w.by.url } : {}) } } : {}), about: { "@type": "CollegeOrUniversity", name: w.school.en } },
        breadcrumbList([{ name: crumb, url: siteUrl() }, { name: w.title, url }]),
      ],
    },
    body,
  }).replace("</style>", `\n${WORLD_STYLE}</style>`);
  return { path: `worlds/${w.id}/index.html`, html };
}
