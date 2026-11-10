// About, on the page at the site's root: the maintainer moved it there from each school's page on 2026-11-10,
// with the Tsinghua World Model. Each school has a section of its own, in its own words (its overlay laid
// over src/i18n/locales/en.json), made from the files its site publishes, as src/ui/AboutPanel.tsx made
// it inside the school's page until then: the unofficial notice, what the site shows and how, every
// source with its link, snapshot date and licence, the buildings drawn in detail, the coverage, the known
// limitations, privacy, and when its data was built. Static HTML: no script.
import fs from "node:fs";
import path from "node:path";
import type { Words } from "../../src/shared/school.ts";
import { type Building, type Layer, type Meta, buildingCode } from "../../src/shared/types.ts";
import { lookupWords } from "../../src/shared/words.ts";

/** What a school's About is made from, besides its words. */
export interface SchoolAbout {
  meta: Meta;
  /** Whether the school's timetable is loaded (its schedule.json), and the date of its snapshot. */
  schedule: { available: boolean; snapshotDate?: string };
  /** The height of a storey on its map (campus.json). */
  floorHeight: number;
  /** True when none of its buildings has a code: its buildings come from OpenStreetMap with no ref, as VUW's do. */
  noCodes: boolean;
  /** Its buildings drawn in detail and those measured, each "<code> <name>", and the other sources that measure some. */
  landmarks: { detailed: string[]; measured: string[]; credits: { credit: string; buildings: string[] }[] };
}

/** The layers in the order the site names them when they are absent (ABSENT_ORDER of src/ui/common.tsx). */
const ABSENT_ORDER: Layer[] = ["indoor", "timetable", "calendar", "subjects"];

/** The layers a school's data says it cannot show (Meta.layers). The University of Auckland gives none. */
export function absentLayers(meta: Meta): Layer[] {
  const layers = meta.layers ?? {};
  return ABSENT_ORDER.filter((layer) => layers[layer] && layers[layer] !== "usable");
}

const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8")) as T;

/** A building as About names it: its code and, unless its name only repeats the number, its name. */
function named(byId: Map<string, Building>, id: string): string {
  const b = byId.get(id);
  const name = b ? (b.name as Record<string, string>).en ?? Object.values(b.name)[0] ?? "" : "";
  return [id, /^Building \d/.test(name) ? "" : name].filter(Boolean).join(" ");
}

/**
 * A school's About inputs, from the folder its site publishes its data in (`<site>/<id>/data`, or
 * public/data/<id> before a build) and, for its landmarks, the repository's landmarks/ folder: the
 * placements that say `site: true` and the measured massings' data files, each of this school (a
 * placement without `school` is the University of Auckland's), as src/app/landmarks.ts finds them.
 */
export function loadSchoolAbout(root: string, dataDir: string, id: string): SchoolAbout {
  const meta = readJson<Meta>(path.join(dataDir, "meta.json"));
  const schedule = readJson<{ available: boolean; snapshotDate?: string }>(path.join(dataDir, "schedule.json"));
  const campus = readJson<{ floorHeight: number; buildings: Building[] }>(path.join(dataDir, "campus.json"));
  const byId = new Map(campus.buildings.map((b) => [b.id, b]));
  const dir = path.join(root, "landmarks");
  type Placement = { site?: boolean; school?: string; building: string; also?: string[]; credit?: string };
  const placed = fs
    .readdirSync(dir)
    .filter((name) => fs.existsSync(path.join(dir, name, "placement.json")))
    .sort()
    .map((name) => readJson<Placement>(path.join(dir, name, "placement.json")))
    .filter((p) => p.site === true && (p.school ?? "uoa") === id);
  const buildingsOf = (p: Placement) => [p.building, ...(p.also ?? [])];
  const measuredDir = path.join(dir, "measured", "buildings");
  const measured = (fs.existsSync(measuredDir) ? fs.readdirSync(measuredDir) : [])
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<{ place: { school?: string; building: string } }>(path.join(measuredDir, f)).place)
    .filter((p) => (p.school ?? "uoa") === id)
    .map((p) => p.building)
    .sort((a, b) => (`measured/${a}` < `measured/${b}` ? -1 : 1));
  const credits = [...new Set(placed.map((p) => p.credit).filter((c): c is string => !!c))].map((credit) => ({
    credit,
    buildings: placed.filter((p) => p.credit === credit).flatMap(buildingsOf).map((b) => named(byId, b)),
  }));
  return {
    meta,
    schedule: { available: schedule.available, snapshotDate: schedule.snapshotDate },
    floorHeight: campus.floorHeight,
    noCodes: campus.buildings.length > 0 && campus.buildings.every((b) => !buildingCode(b)),
    landmarks: { detailed: placed.flatMap(buildingsOf).map((b) => named(byId, b)), measured: measured.map((b) => named(byId, b)), credits },
  };
}

/** Text made safe for HTML, in an element or in a quoted attribute. */
const e = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** The text of a key, which must exist, with each {name} filled in. */
function word(words: Words, key: string, params: Record<string, string | number> = {}): string {
  const text = lookupWords(words, key);
  if (text === undefined) throw new Error(`src/i18n/locales/en.json has no text for "${key}"`);
  return text.replace(/\{(\w+)\}/g, (all, name: string) => (params[name] !== undefined ? String(params[name]) : all));
}

const locale = (words: Words) => lookupWords(words, "_meta.intl") ?? "en-NZ";

/** A date such as 2026-10-13 in long form, "13 October 2026", as About shows it. */
export function longDate(date: string, words: Words): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat(locale(words), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** The date, in Auckland, that an ISO time falls on (aucklandWallTime of src/shared/time.ts). */
function aucklandDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

const list = (words: Words, items: string[]) => new Intl.ListFormat(locale(words), { type: "conjunction" }).format(items);
const link = (href: string, text: string) => `<a href="${e(href)}" rel="noopener noreferrer">${e(text)}</a>`;
const section = (title: string, body: string) => `<section><h4>${e(title)}</h4>${body}</section>`;

/** The links of the LiDAR the landmarks are measured from and of LINZ's credit page (src/app/links.ts). */
export interface AboutLinks {
  repo: string;
  landmarkLidar: string;
  linzElevationCredit: string;
}

/** One school's About, as an article headed by its site's name, its id the anchor its page links to (#about-<id>). */
export function schoolAboutHtml(id: string, site: string, words: Words, a: SchoolAbout, links: AboutLinks): string {
  const c = a.meta.coverage;
  const n = (x: number) => x.toLocaleString(locale(words));
  const pct = (x: number) => (c.sessions ? ` (${Math.round((x / c.sessions) * 100)}%)` : "");
  const absent = new Set(absentLayers(a.meta));
  const buildingsOnly = absent.has("indoor");
  const available = a.schedule.available;
  const what = buildingsOnly ? word(words, a.noCodes ? "about.whatBuildingsNames" : "about.whatBuildings") : available ? word(words, "about.what") : word(words, "about.whatNoTimetable");
  const how = buildingsOnly ? word(words, a.noCodes ? "about.howBuildingsNames" : "about.howBuildings") : word(words, "about.how");
  const sources = a.meta.sources
    .map(
      (s) =>
        `<li>${link(s.url, s.name)}<dl><dt>${e(word(words, "about.sourceProvides"))}</dt><dd>${e(s.provides)}</dd>` +
        `<dt>${e(word(words, "about.sourceSnapshot"))}</dt><dd><time datetime="${e(s.snapshotDate)}">${e(longDate(s.snapshotDate, words))}</time></dd>` +
        `<dt>${e(word(words, "about.sourceLicence"))}</dt><dd>${e(s.licence)}</dd></dl></li>`,
    )
    .join("");
  const L = a.landmarks;
  const landmarks =
    L.detailed.length + L.measured.length > 0
      ? section(
          word(words, "about.landmarksTitle"),
          `<p class="landmarks">${e(word(words, "about.landmarks", { buildings: list(words, L.detailed) }))}</p>` +
            L.credits.map((x) => `<p class="landmark-credit">${e(word(words, "about.landmarksOtherSource", { buildings: list(words, x.buildings), credit: x.credit }))}</p>`).join("") +
            (L.measured.length ? `<p class="measured">${e(word(words, "about.measured", { buildings: list(words, L.measured) }))}</p>` : "") +
            `<p class="landmark-links">${link(links.landmarkLidar, word(words, "about.landmarksLidar"))} · ${link(links.linzElevationCredit, word(words, "about.landmarksCredit"))} · ${link(`${links.repo}/tree/main/landmarks`, word(words, "about.landmarksLink"))}</p>`,
        )
      : "";
  const row = (key: string, value: string, sub = false) => `<tr${sub ? ' class="sub"' : ""}><th>${e(word(words, key))}</th><td>${e(value)}</td></tr>`;
  const coverage = [
    row("about.coverage.buildings", n(c.buildings)),
    row("about.coverage.buildingsOnMap", n(c.buildingsOnMap), true),
    c.buildingsExcluded !== undefined
      ? row(a.meta.sources.some((x) => x.id === "campus-map") ? "about.coverage.buildingsExcludedByMap" : "about.coverage.buildingsExcluded", n(c.buildingsExcluded), true)
      : "",
    ...(absent.has("indoor") ? [] : [row("about.coverage.rooms", n(c.rooms)), row("about.coverage.indexedRooms", n(c.indexedRooms)), row("about.coverage.planShapes", n(c.planShapes))]),
    absent.has("subjects") ? "" : row("about.coverage.subjects", n(c.subjects)),
    ...(absent.has("timetable") ? [] : [row("about.coverage.courses", n(c.courses)), row("about.coverage.sessions", n(c.sessions))]),
    ...(available
      ? [
          row("about.coverage.sessionsRoom", n(c.sessionsLocatedToRoom) + pct(c.sessionsLocatedToRoom), true),
          row("about.coverage.sessionsFloor", n(c.sessionsLocatedToFloor) + pct(c.sessionsLocatedToFloor), true),
          row("about.coverage.sessionsBuilding", n(c.sessionsLocatedToBuilding) + pct(c.sessionsLocatedToBuilding), true),
          row("about.coverage.sessionsExcluded", n(c.sessionsExcluded), true),
        ]
      : []),
  ].join("");
  const limit = (text: string, layer?: Layer) => `<li${layer ? ` data-layer="${layer}"` : ""}>${e(text)}</li>`;
  const limits = [
    limit(
      available ? word(words, "about.limits.timetableLoaded", { date: longDate(a.schedule.snapshotDate ?? "", words) }) : word(words, "about.limits.timetable"),
      absent.has("timetable") ? "timetable" : undefined,
    ),
    absent.has("timetable") ? "" : limit(word(words, "about.limits.scheduled")),
    limit(word(words, "about.limits.rooms"), absent.has("indoor") ? "indoor" : undefined),
    limit(word(words, "about.limits.heights", { height: a.floorHeight })),
    limit(word(words, "about.limits.campuses")),
    limit(word(words, "about.limits.context")),
    limit(word(words, "about.limits.walker")),
    limit(word(words, "about.limits.calendar"), absent.has("calendar") ? "calendar" : undefined),
    absent.has("subjects") ? limit(word(words, "about.limits.subjects"), "subjects") : "",
    limit(word(words, "about.limits.daylight")),
  ].join("");
  return [
    `<article class="about-school" id="about-${e(id)}" data-school="${e(id)}">`,
    `<h3>${e(site)}</h3>`,
    `<div class="callout unofficial"><strong>${e(word(words, "about.unofficialTitle"))}</strong><p>${e(word(words, "about.unofficial"))}</p></div>`,
    section(word(words, "about.whatTitle"), `<p>${e(what)}</p>`),
    section(word(words, "about.howTitle"), `<p>${e(how)}</p>`),
    section(
      word(words, "about.sourcesTitle"),
      `<ul class="sources">${sources}</ul><p class="osm-attribution">${e(word(words, "about.osm"))} ${link("https://www.openstreetmap.org/copyright", word(words, "about.osmLink"))}</p>`,
    ),
    landmarks,
    section(word(words, "about.coverageTitle"), `<table class="coverage"><tbody>${coverage}</tbody></table>`),
    section(word(words, "about.limitsTitle"), `<ul class="limits">${limits}</ul>`),
    section(word(words, "about.privacyTitle"), `<p>${e(word(words, "about.privacy"))}</p>`),
    `<p class="built">${e(word(words, "about.built", { date: longDate(aucklandDate(a.meta.generatedAt), words) }))}</p>`,
    `</article>`,
  ].join("\n");
}
