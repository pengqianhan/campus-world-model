// Each school's descriptor and words (docs/schools/DESIGN.md, sections 5 and 9).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { School, Words } from "../src/shared/school.ts";
import type { CampusData } from "../src/shared/types.ts";
import { SCHOOL_KEYS, TERM_KEYS, lookupWords, overlayWords, wordKeys } from "../src/shared/words.ts";

const descriptors = import.meta.glob<School>("../src/schools/*/school.ts", { eager: true, import: "school" });
const schools = Object.entries(descriptors).map(([file, school]) => ({ folder: file.split("/").at(-2)!, school }));
const en = JSON.parse(fs.readFileSync("src/i18n/locales/en.json", "utf8")) as Words;
const languages = fs.readdirSync("src/i18n/locales").map((f) => f.replace(/\.json$/, ""));

/** The keys of en.json that SCHOOL_KEYS names, with each "group.*" spread out. */
function schoolKeys(): string[] {
  const all = wordKeys(en);
  return SCHOOL_KEYS.flatMap((k) => (k.endsWith(".*") ? all.filter((x) => x.startsWith(k.slice(0, -1))) : [k]));
}

describe("the schools", () => {
  it("include the University of Auckland, each in a folder named by its id", () => {
    expect(schools.map((s) => s.folder)).toContain("uoa");
    for (const { folder, school } of schools) {
      expect(school.id, folder).toBe(folder);
      expect(school.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(fs.existsSync(path.join("public", "data", school.id)), `public/data/${school.id}/`).toBe(true);
    }
  });

  it("give every field of the descriptor", () => {
    for (const { school } of schools) {
      // New Zealand: every school keeps Pacific/Auckland time and is in the southern hemisphere.
      for (const at of [school.origin, school.sun]) {
        expect(at.lat, school.id).toBeGreaterThan(-48);
        expect(at.lat, school.id).toBeLessThan(-34);
        expect(at.lon, school.id).toBeGreaterThan(166);
        expect(at.lon, school.id).toBeLessThan(179);
      }
      const weather = new URL(school.weather);
      expect(weather.origin, school.id).toBe("https://api.open-meteo.com");
      expect(Number(weather.searchParams.get("latitude")), school.id).toBeCloseTo(school.sun.lat, 2);
      expect(Number(weather.searchParams.get("longitude")), school.id).toBeCloseTo(school.sun.lon, 2);
      expect(weather.searchParams.get("timezone"), school.id).toBe("Pacific/Auckland");
      for (const [campus, span] of Object.entries(school.campusSpan)) expect(span, `${school.id} ${campus}`).toBeGreaterThan(0);

      const areas = [school.areas.central, ...school.areas.remote];
      expect(new Set(areas.map((a) => a.id)).size, school.id).toBe(areas.length);
      for (const a of areas) {
        const [south, west, north, east] = a.bbox;
        expect(south, a.id).toBeLessThan(north);
        expect(west, a.id).toBeLessThan(east);
        expect(a.osm, a.id).toMatch(/^osm\/[\w-]+\.json$/);
      }

      const g = school.roomCode;
      for (const re of [g.building, g.wing, g.room]) expect(re.flags, school.id).toBe("");
      for (const group of g.equivalentFloors) expect(group.length, school.id).toBeGreaterThan(1);

      for (const lang of Object.keys(school.words)) expect(languages, `${school.id}: words in ${lang}`).toContain(lang);
    }
  });

  it("keep the University of Auckland's origin, the one its published data is drawn in", () => {
    const uoa = descriptors["../src/schools/uoa/school.ts"]!;
    const campus = JSON.parse(fs.readFileSync("public/data/uoa/campus.json", "utf8")) as CampusData & { origin: unknown };
    expect(campus.origin).toEqual(uoa.origin);
  });
});

describe("the school's words", () => {
  it("name keys that exist in en.json", () => {
    const all = new Set(wordKeys(en));
    for (const k of SCHOOL_KEYS) {
      if (k.endsWith(".*")) expect(wordKeys(en).some((x) => x.startsWith(k.slice(0, -1))), k).toBe(true);
      else expect(all.has(k), k).toBe(true);
    }
    for (const k of TERM_KEYS) expect(all.has(k), k).toBe(true);
  });

  it("cover every English text that names the University, its site, its place or its room codes", () => {
    const named = new Set(schoolKeys());
    // Shared by every school: the time zone is named after Auckland (every university in New
    // Zealand keeps Pacific/Auckland time), and the landmarks' LiDAR survey is Auckland's; the
    // landmarks line shows only where a school has landmarks.
    // The picker at the site's root names each school under its own id, picker.schools.<id>, and no
    // school's app shows those words (tests/picker.test.ts).
    const shared = new Set(["time.nowHelp", "time.auckland", "about.landmarks"]);
    const names = /University of Auckland|\bUoA\b|Auckland|the University\b|City Campus|303-G23/;
    const missing = wordKeys(en).filter((key) => names.test(lookupWords(en, key)!) && !shared.has(key) && !named.has(key) && !key.startsWith("picker.schools."));
    expect(missing).toEqual([]);
  });

  it("are replaced by every school but the University of Auckland, which has no overlay", () => {
    for (const { school } of schools) {
      if (school.id === "uoa") {
        expect(school.words).toEqual({});
        continue;
      }
      const words = overlayWords(en, school.words.en);
      for (const key of schoolKeys()) {
        expect(lookupWords(school.words.en, key), `${school.id}: ${key}`).toBeDefined();
        expect(lookupWords(words, key), `${school.id}: ${key}`).not.toBe(lookupWords(en, key));
      }
    }
  });

  it("give each school's teaching periods one name, semester or trimester, in every text the school shows", () => {
    for (const { school } of schools) {
      const words = overlayWords(en, school.words.en);
      // The picker's words (picker.*) are on the site's root page, not in any school's app.
      const shown = wordKeys(words).filter((key) => !key.startsWith("picker."));
      const names = new Set(shown.flatMap((key) => [...lookupWords(words, key)!.matchAll(/\b(semester|trimester)s?\b/gi)].map((m) => m[1]!.toLowerCase())));
      expect([...names], school.id).toHaveLength(1);
    }
  });

  it("say trimester dates at VUW, and keep the University of Auckland's and AUT's semester dates as they were", () => {
    const expected: Record<string, Record<string, string>> = {
      uoa: { "time.noCalendar": "No semester dates are shown", "status.layer.calendar": "semester dates" },
      aut: { "time.noCalendar": "No semester dates are shown", "status.layer.calendar": "semester dates" },
      vuw: { "time.noCalendar": "No trimester dates are shown", "status.layer.calendar": "trimester dates" },
    };
    for (const [id, texts] of Object.entries(expected)) {
      const school = schools.find((s) => s.school.id === id)!.school;
      const words = overlayWords(en, school.words.en);
      for (const key of TERM_KEYS) expect(lookupWords(words, key), `${id}: ${key}`).toBe(texts[key]);
    }
  });

  it("replace only the keys SCHOOL_KEYS and TERM_KEYS name", () => {
    const allowed = new Set([...schoolKeys(), ...TERM_KEYS]);
    for (const { school } of schools) {
      for (const [lang, words] of Object.entries(school.words)) {
        for (const key of wordKeys(words)) expect(allowed.has(key), `${school.id} (${lang}): ${key}`).toBe(true);
      }
    }
  });

  it("are the files the page's head is filled from, src/schools/<id>/locales/", () => {
    for (const { folder, school } of schools) {
      const dir = path.join("src", "schools", folder, "locales");
      const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
      expect(Object.keys(school.words).sort(), school.id).toEqual(files.map((f) => f.replace(/\.json$/, "")).sort());
      for (const f of files) {
        expect(school.words[f.replace(/\.json$/, "")], `${school.id}: ${f}`).toEqual(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
      }
    }
  });

  it("give every text that index.html names", () => {
    const html = fs.readFileSync("index.html", "utf8");
    const keys = [...html.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]!);
    expect(keys.sort()).toEqual(["app.description", "app.documentTitle", "app.documentTitle", "app.noscript", "app.ogDescription"]);
    for (const key of keys) expect(lookupWords(en, key), key).toBeDefined();
  });
});

describe("landmarks", () => {
  it("name a school that has a descriptor, where they name one", () => {
    const ids = new Set(schools.map((s) => s.school.id));
    const files = [
      ...fs.readdirSync("landmarks").map((d) => path.join("landmarks", d, "placement.json")),
      ...fs.readdirSync(path.join("landmarks", "measured", "buildings")).map((f) => path.join("landmarks", "measured", "buildings", f)),
    ].filter((f) => f.endsWith(".json") && fs.existsSync(f));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const json = JSON.parse(fs.readFileSync(file, "utf8")) as { school?: string; place?: { school?: string } };
      const school = json.school ?? json.place?.school ?? "uoa";
      expect(ids.has(school), file).toBe(true);
    }
  });
});
