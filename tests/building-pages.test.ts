// A school's building list and its buildings' pages (scripts/lib/building-pages.ts), as vite.config.ts
// writes them into each school's build from its published data.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SITE } from "../src/app/links.ts";
import type { Words } from "../src/shared/school.ts";
import type { Building, CampusData, Meta } from "../src/shared/types.ts";
import { lookupWords } from "../src/shared/words.ts";
import { type BuildingPagesInput, buildingCode, buildingPageFiles, buildingPagePaths, buildingSlug, buildingTitle } from "../scripts/lib/building-pages.ts";
import { schoolForm, schoolWords } from "../scripts/lib/picker.ts";
import { parseSchoolList } from "../scripts/lib/school-list.ts";

const root = process.cwd();
const shared = JSON.parse(fs.readFileSync("src/i18n/locales/en.json", "utf8")) as Words;
const ids = parseSchoolList(fs.readFileSync(".github/schools.json", "utf8"));
const read = <T>(id: string, file: string) => JSON.parse(fs.readFileSync(path.join("public", "data", id, file), "utf8")) as T;
const input = (id: string, base = `/${id}/`): BuildingPagesInput => ({ id, words: schoolWords(root, id, shared), meta: read<Meta>(id, "meta.json"), campus: read<CampusData>(id, "campus.json"), base });
const filesOf = (id: string, base?: string) => new Map(buildingPageFiles(input(id, base)).map((f) => [f.path, f.html]));

const canonical = (html: string) => /<link rel="canonical" href="([^"]*)">/.exec(html)?.[1];
const ld = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((m) => JSON.parse(m[1]!) as { "@graph": Record<string, unknown>[] });
const hrefs = (html: string) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));
/** Every text between tags, the style and structured data left out. */
const texts = (html: string) =>
  [...html.replace(/<style>[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, "").matchAll(/>([^<]+)</g)]
    .map((m) => m[1]!.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").trim())
    .filter(Boolean);

describe("the building list and the building pages", () => {
  for (const id of ids) {
    it(`${id}: list every building on campus.json under its campus, each linked to the 3D map`, () => {
      const campus = read<CampusData>(id, "campus.json");
      const html = filesOf(id).get("buildings/index.html")!;
      expect(canonical(html)).toBe(`${SITE}${id}/buildings/`);
      expect(html).toMatch(/<title>[^<]*unofficial[^<]*<\/title>/);
      expect(html).toContain(lookupWords(schoolWords(root, id, shared), "about.unofficial")!.replace(/'/g, "&#39;"));
      const links = hrefs(html);
      for (const b of campus.buildings) {
        expect(links, b.id).toContain(`../?building=${encodeURIComponent(b.id)}`);
        expect(texts(html), b.id).toContain(buildingTitle(b));
      }
      // each campus with buildings is a heading, in campus.json's order
      const shown = campus.campuses.filter((c) => campus.buildings.some((b) => b.campus === c.id)).map((c) => c.name.en);
      expect([...html.matchAll(/<h2 id="campus-[^"]*">([^<]*)<\/h2>/g)].map((m) => m[1])).toEqual(shown);
      expect(html).not.toMatch(/<script(?! type="application\/ld\+json")|\bon[a-z]+=|<canvas/i);
    });

    it(`${id}: give a page to each building with learning spaces, and to no other`, () => {
      const campus = read<CampusData>(id, "campus.json");
      const files = filesOf(id);
      const withRooms = campus.buildings.filter((b) => b.roomCount > 0);
      const expected = schoolForm(read<Meta>(id, "meta.json")) === "buildings" ? [] : withRooms;
      expect([...files.keys()].sort()).toEqual(["buildings/index.html", ...expected.map((b) => `buildings/${buildingSlug(b)}/index.html`)].sort());
      expect(buildingPagePaths(input(id))).toEqual(["buildings/", ...withRooms.map((b) => `buildings/${buildingSlug(b)}/`)]);
    });
  }

  it("uoa: a building's page lists each floor and, under it, each learning space by code, linked to it on the 3D map", () => {
    const campus = read<CampusData>("uoa", "campus.json");
    const b = campus.buildings.find((x) => x.id === "303")!;
    const html = filesOf("uoa").get("buildings/303/index.html")!;
    expect(canonical(html)).toBe(`${SITE}uoa/buildings/303/`);
    expect(html).toContain("<h1>303 Science Centre - Faculty of Science</h1>");
    expect(html).toContain('<a class="open" href="../../?building=303">Open on the 3D map</a>');
    for (const f of b.floors) expect(html).toContain(`<h3 id="floor-${f.name}">Floor ${f.name}</h3>`);
    const rooms = campus.rooms.filter((r) => r.b === "303");
    expect(rooms.length).toBe(b.roomCount);
    for (const r of rooms) expect(html).toContain(`<li id="${r.code}"><a href="../../?room=${encodeURIComponent(r.code)}" aria-label="Open ${r.code} on the 3D map">${r.code}</a>`);
    expect(html).toContain(`Name in the source: ${b.sourceText}`);
    // rooms under their own floor: 303-G23 is on floor G
    const g = html.indexOf('<h3 id="floor-G">');
    const one = html.indexOf('<h3 id="floor-1">');
    expect(html.indexOf('id="303-G23"')).toBeGreaterThan(g);
    expect(html.indexOf('id="303-G23"')).toBeLessThan(one);
  });

  it("uoa: names no space but the learning spaces campus.json publishes (AGENTS.md, Places, not people)", () => {
    const campus = read<CampusData>("uoa", "campus.json");
    const published = new Set(campus.rooms.map((r) => r.code));
    // the codes in the room index name other spaces too, which the map marks but never names
    const index = new Map(Object.entries(read<Record<string, [string, ...unknown[]][]>>("uoa", "rooms-index.json")));
    expect(index.size).toBeGreaterThan(50);
    for (const [file, html] of filesOf("uoa")) {
      const codes = [...html.matchAll(/\?room=([^"&]*)/g)].map((m) => decodeURIComponent(m[1]!));
      for (const c of codes) expect(published.has(c), `${file}: ${c}`).toBe(true);
      const ids = [...html.matchAll(/<li id="([^"]*)"/g)].map((m) => m[1]!);
      for (const c of ids) expect(published.has(c), `${file}: ${c}`).toBe(true);
      const b = /^buildings\/([^/]+)\//.exec(file)?.[1];
      const building = b && campus.buildings.find((x) => buildingSlug(x) === b);
      if (!building) continue;
      for (const [room] of index.get(building.id) ?? []) {
        const code = `${building.id}-${room}`;
        const alone = new RegExp(`(^|[^\\w-])${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w])`);
        if (!published.has(code)) expect(alone.test(html), `${file}: ${code}`).toBe(false);
      }
    }
  });

  it("uoa: a floor the map leaves blank says why, in the map's own words", () => {
    const campus = read<CampusData>("uoa", "campus.json");
    const blank = campus.buildings.filter((b) => b.roomCount > 0).flatMap((b) => b.floors.filter((f) => f.noPlan).map((f) => ({ b, f })));
    expect(blank.length).toBeGreaterThan(0);
    const files = filesOf("uoa");
    for (const { b, f } of blank) {
      const html = files.get(`buildings/${buildingSlug(b)}/index.html`)!;
      const at = html.indexOf(`<h3 id="floor-${f.name}">`);
      expect(html.slice(at, html.indexOf("</h3>", at) + 200), `${b.id} ${f.name}`).toContain(lookupWords(shared, `building.noPlan.${f.noPlan}`)!);
    }
  });

  it("uoa: describes each page and the trail to it in structured data", () => {
    const files = filesOf("uoa");
    const [list] = ld(files.get("buildings/index.html")!);
    expect(list!["@graph"].map((x) => x["@type"])).toEqual(["CollectionPage", "BreadcrumbList"]);
    expect(list!["@graph"][0]).toMatchObject({ url: `${SITE}uoa/buildings/`, about: { "@type": "CollegeOrUniversity", name: "University of Auckland" } });
    const [page] = ld(files.get("buildings/303/index.html")!);
    expect(page!["@graph"][0]).toMatchObject({
      "@type": "WebPage",
      url: `${SITE}uoa/buildings/303/`,
      about: { "@type": "Place", name: "303 Science Centre - Faculty of Science", identifier: "303", containedInPlace: { name: "University of Auckland" } },
    });
    const trail = (page!["@graph"][1] as { itemListElement: { name: string; item: string }[] }).itemListElement;
    expect(trail.map((x) => x.item)).toEqual([SITE, `${SITE}uoa/`, `${SITE}uoa/buildings/`, `${SITE}uoa/buildings/303/`]);
  });

  it("links to the root and About it is served beside, or to campusworldmodel.com's from the GitHub Pages copy", () => {
    const here = filesOf("uoa").get("buildings/303/index.html")!;
    expect(hrefs(here)).toEqual(expect.arrayContaining(["/", "../../", "../", "/#about-uoa"]));
    const copy = filesOf("uoa", "/campus-world-model/").get("buildings/303/index.html")!;
    expect(hrefs(copy)).toEqual(expect.arrayContaining([SITE, `${SITE}#about-uoa`]));
    expect(canonical(copy)).toBe(`${SITE}uoa/buildings/303/`);
  });

  it("puts the code before a name that does not hold it, and makes ids into path segments", () => {
    const b = (x: Partial<Building>) => ({ id: "303", name: { en: "Science Centre" }, ...x }) as Building;
    expect(buildingTitle(b({}))).toBe("303 Science Centre");
    expect(buildingTitle(b({ id: "114", name: { en: "Building 114" } }))).toBe("Building 114");
    expect(buildingTitle(b({ id: "WAY-1", osm: "way/1", name: { en: "Hudson Hall" } }))).toBe("Hudson Hall");
    expect(buildingTitle(b({ id: "WAY-2", osm: "way/2", ref: "WA", name: { en: "AUT Library" } }))).toBe("WA AUT Library");
    expect(buildingCode(b({ id: "WAY-1", osm: "way/1" }))).toBe("");
    expect(buildingSlug(b({ id: "105S" }))).toBe("105s");
    expect(buildingSlug(b({ id: "607_A" }))).toBe("607_a");
    expect(() => buildingSlug(b({ id: "a/b" }))).toThrow();
  });

  it("escapes every text", () => {
    const evil = '<img src=x onerror=alert(1)> & "';
    const i = input("uoa");
    const campus = { ...i.campus, buildings: i.campus.buildings.map((b) => (b.id === "303" ? { ...b, name: { en: evil }, sourceText: evil } : b)) };
    const files = buildingPageFiles({ ...i, campus });
    for (const f of files) expect(f.html, f.path).not.toContain("<img");
    const page = files.find((f) => f.path === "buildings/303/index.html")!;
    expect(JSON.stringify(ld(page.html))).toContain("onerror");
  });
});
