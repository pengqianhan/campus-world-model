// A school's words over the shared ones (docs/schools/DESIGN.md, section 5). src/i18n/locales/
// holds every key, in the University of Auckland's words; another school's overlay,
// src/schools/<id>/locales/<lang>.json, replaces the keys that name a school, its place or its
// verdicts. The app (src/app/i18n.ts) and the page's head (vite.config.ts) both lay the overlay over
// the shared words with `overlayWords`.
import type { Words } from "./school.ts";

/**
 * The keys every school other than the University of Auckland replaces in its overlay: the site's
 * name and the page's head, the unofficial notice, the known limits, the credit line, why no
 * timetable is shown, the weather's place (in the weather line and in Privacy), the room-code
 * examples, and leaving the school's city.
 * A key ending in ".*" stands for every key under it. tests/schools.test.ts checks the list.
 */
export const SCHOOL_KEYS: readonly string[] = [
  "app.*",
  "about.unofficial",
  "about.limits.*",
  "about.privacy",
  "attribution.short",
  "room.noTimetableWhy",
  "search.placeholder",
  "search.hint",
  "search.noResultsHint",
  "weather.label",
  "travel.go",
  "travel.leaving",
  "travel.stay",
];

/**
 * The keys that name a school's teaching periods where its dates are not shown: the status line
 * and the strip say "semester dates". A school that teaches in semesters, as the University of
 * Auckland and AUT do, keeps them; a school that teaches in trimesters, as VUW does, replaces them.
 * tests/schools.test.ts checks that each school's words give its teaching periods one name.
 */
export const TERM_KEYS: readonly string[] = ["time.noCalendar", "status.layer.calendar"];

/** A copy of `base` with every string of `overlay` in its place; keys only in `overlay` are added. */
export function overlayWords(base: Words, overlay: Words | undefined): Words {
  if (!overlay) return base;
  const out: Words = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const under = out[key];
    out[key] = typeof value === "object" && typeof under === "object" ? overlayWords(under, value) : value;
  }
  return out;
}

/** The text of a key such as "app.title", if there is one. */
export function lookupWords(words: Words | undefined, key: string): string | undefined {
  let node: string | Words | undefined = words;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Every key with a text, as "group.key", in the order of the file. */
export function wordKeys(words: Words, prefix = ""): string[] {
  return Object.entries(words).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" ? wordKeys(value, path) : [path];
  });
}
