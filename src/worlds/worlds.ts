// Campus worlds made by others (src/worlds/worlds.json), shown with this site's own schools on the page at the
// site's root (PROGRESS.md, "Decisions", A global collection of campus worlds). This file gives their shape and
// the rules an entry keeps; scripts/build-root.ts reads them through readWorlds(), which throws at the first
// entry that breaks one, so a build never publishes it.

/** A name in English, and in the place's own language where it has one. */
export interface Named {
  en: string;
  /** As the school writes it, with its BCP 47 language tag. */
  native?: { lang: string; text: string };
}

/** Where a campus stands: one OpenStreetMap Nominatim search, as scripts/worlds/geocode.ts wrote it. */
export interface Place {
  lat: number;
  lon: number;
  /** The OpenStreetMap object found, such as "way/123456". */
  osm: string;
  /** The snapshot under data/raw/ that holds the answer. */
  file: string;
  /** The day of the search, YYYY-MM-DD. */
  date: string;
}

/** A screenshot of the world, taken by scripts/worlds/screenshot.ts. */
export interface Screenshot {
  /** Under src/worlds/screenshots/. */
  file: string;
  /** The page it shows. */
  url: string;
  /** The day it was taken, YYYY-MM-DD. */
  date: string;
}

/** What a world is or has, shown on its page as a short label (worlds.flags.<flag> in the locale files). */
export const FLAGS = ["game", "multiplayer", "classes", "wip", "heavy"] as const;
export type Flag = (typeof FLAGS)[number];

/** One campus world made by others. */
export interface World {
  /** Its address on this site: /worlds/<id>/. */
  id: string;
  /** Its own name for itself. */
  title: string;
  school: Named;
  /** The campus, where the school has more than one and the world shows one of them. */
  campus?: Named;
  city: string;
  country: string;
  /** What scripts/worlds/geocode.ts asks Nominatim for. */
  placeQuery: string;
  place?: Place;
  /** Where to play it, without signing in. */
  play?: string;
  /** Its public source code. */
  source?: string;
  /** Its makers, as the project itself credits them: a team or an account, never a private person's details. */
  by?: { name: string; url?: string };
  /** What it is, in a sentence or two, from its own description. */
  about: string;
  flags: Flag[];
  /** Where a project says in public that another one inspired it: the other's id, its own words and where they are. */
  inspiredBy?: { id: string; quote: string; url: string };
  screenshot?: Screenshot;
  /** Why it has no screenshot, in plain words. An entry with neither is not ready to publish. */
  noScreenshot?: string;
  /** The day it joined the list, YYYY-MM-DD. */
  added: string;
}

const ID = /^[a-z][a-z0-9-]*$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The problems of the list, one line each; none when every entry keeps the rules. `ownIds` are this site's schools' ids. */
export function worldProblems(worlds: World[], ownIds: readonly string[] = []): string[] {
  const out: string[] = [];
  const seen = new Set<string>(ownIds);
  const https = (v: string | undefined) => v === undefined || /^https:\/\/[^\s]+$/.test(v);
  for (const w of worlds) {
    const at = `world "${w.id}"`;
    if (!ID.test(w.id)) out.push(`${at}: an id is lower case letters, digits and hyphens, starting with a letter`);
    if (w.id === "worlds" || seen.has(w.id)) out.push(`${at}: the id is taken`);
    seen.add(w.id);
    for (const k of ["title", "city", "country", "placeQuery", "about"] as const) if (!w[k]?.trim()) out.push(`${at}: no ${k}`);
    if (!w.school?.en) out.push(`${at}: a school, with its English name`);
    if (w.campus && !w.campus.en) out.push(`${at}: a campus has its English name`);
    if (!w.play && !w.source) out.push(`${at}: a link to play it or to its source code, or both`);
    for (const k of ["play", "source"] as const) if (!https(w[k])) out.push(`${at}: ${k} is an https address`);
    if (w.by && !https(w.by.url)) out.push(`${at}: by.url is an https address`);
    for (const f of w.flags ?? []) if (!(FLAGS as readonly string[]).includes(f)) out.push(`${at}: no flag "${f}"; the flags are ${FLAGS.join(", ")}`);
    if (!DAY.test(w.added ?? "")) out.push(`${at}: added is a day, YYYY-MM-DD`);
    if (!w.screenshot && !w.noScreenshot?.trim()) out.push(`${at}: a screenshot, or noScreenshot saying why there is none`);
    if (w.screenshot && !DAY.test(w.screenshot.date)) out.push(`${at}: screenshot.date is a day, YYYY-MM-DD`);
    if (w.place && !(Math.abs(w.place.lat) <= 90 && Math.abs(w.place.lon) <= 180)) out.push(`${at}: place is out of range`);
    if (w.inspiredBy && !(w.inspiredBy.quote?.trim() && https(w.inspiredBy.url))) out.push(`${at}: inspiredBy quotes the project's own words and links to them`);
  }
  for (const w of worlds) {
    if (w.inspiredBy && !seen.has(w.inspiredBy.id)) out.push(`world "${w.id}": inspiredBy names "${w.inspiredBy.id}", which is not on the list`);
  }
  return out;
}
