// The school picker and the 404 page at the Cloudflare site's root (docs/schools/DESIGN.md,
// section 7), as scripts/build-root.ts writes them from the list, each school's meta.json and words;
// and, since 2026-11-10, About under the picker, with each school's section (scripts/lib/about.ts).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "../src/app/i18n.ts";
import type { Words } from "../src/shared/school.ts";
import type { Meta } from "../src/shared/types.ts";
import { INSPIRED_BY, LANDMARK_LIDAR, LINZ_ELEVATION_CREDIT, REPO, SITE, aboutHref } from "../src/app/links.ts";
import { lookupWords, wordKeys } from "../src/shared/words.ts";
import { absentLayers, loadSchoolAbout, longDate } from "../scripts/lib/about.ts";
import { type PickerSchool, escapeHtml, pickerPages, schoolForm, schoolLine, schoolWords } from "../scripts/lib/picker.ts";
import { parseSchoolList } from "../scripts/lib/school-list.ts";

const root = process.cwd();
const shared = JSON.parse(fs.readFileSync("src/i18n/locales/en.json", "utf8")) as Words;
const ids = parseSchoolList(fs.readFileSync(".github/schools.json", "utf8"));
const meta = (id: string) => JSON.parse(fs.readFileSync(path.join("public", "data", id, "meta.json"), "utf8")) as Meta;
const aboutOf = (id: string) => loadSchoolAbout(root, path.join("public", "data", id), id);
const schools: PickerSchool[] = ids.map((id) => ({ id, words: schoolWords(root, id, shared), meta: meta(id), about: aboutOf(id) }));
const pages = pickerPages(schools, shared);

/** The links of the list, in order. */
const links = (html: string) => [...html.matchAll(/<li data-school="([^"]*)">.*?<a href="([^"]*)">/g)].map((m) => [m[1], m[2]]);

/** Undoes escapeHtml. */
const unescape = (text: string) =>
  text.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");

/**
 * Every text a page shows: the text between its tags (its style left out) and the words of its
 * description, title and list label. Text that sits next to other text with no tag between is one.
 */
function shownTexts(html: string): string[] {
  const body = html.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/<section id="about"[\s\S]*?<\/section>\n<\/main>/, "</main>");
  const between = [...body.matchAll(/>([^<]+)</g)].map((m) => unescape(m[1]!).trim()).filter(Boolean);
  const attrs = [...body.matchAll(/(?:name="description"|property="og:(?:title|description)") content="([^"]*)"|aria-label="([^"]*)"/g)].map((m) => unescape(m[1] ?? m[2]!));
  return [...between, ...attrs];
}

/** Every text the page may show: each picker.* text, and each school's facts from its meta.json and words. */
function allowedTexts(): Set<string> {
  const picker = [...wordKeys(shared).filter((k) => k.startsWith("picker.")), "nav.about", "about.repo"].map((k) => lookupWords(shared, k)!);
  const facts = schools.flatMap((s) => {
    const line = schoolLine(s, shared);
    return [line.site, line.name, line.city, line.form, line.snapshot];
  });
  return new Set([...picker, ...facts]);
}

describe("the school picker at the site's root", () => {
  for (const [page, html] of Object.entries({ "index.html": pages.index, "404.html": pages.notFound })) {
    it(`${page} lists every school on the list, in its order, each linking to its path`, () => {
      expect(ids.length).toBeGreaterThan(1);
      expect(links(html)).toEqual(ids.map((id) => [id, `/${id}/`]));
    });

    it(`${page} has no script and starts no WebGL`, () => {
      expect(html).not.toMatch(/<script|javascript:|\bon[a-z]+=|<canvas|<iframe|<object|<embed/i);
    });

    it(`${page} shows, above About, only texts from picker.*, each school's words or its meta.json`, () => {
      const allowed = allowedTexts();
      const texts = shownTexts(html);
      expect(texts.length).toBeGreaterThan(5);
      for (const text of texts) expect(allowed.has(text), text).toBe(true);
    });

    it(`${page} says it is unofficial, in its title and in the notice`, () => {
      expect(html).toContain(`<title>${escapeHtml(lookupWords(shared, page === "404.html" ? "picker.notFound.documentTitle" : "picker.documentTitle")!)}</title>`);
      expect(html).toMatch(/<title>[^<]*unofficial[^<]*<\/title>/);
      expect(html).toContain("An unofficial student project. Not affiliated with any of these universities.");
    });
  }

  it("names each school with its full name, its city, its form, its campus snapshot and its site", () => {
    const uoa = schoolLine(schools.find((s) => s.id === "uoa")!, shared);
    expect(uoa).toMatchObject({ site: "UoA World Model", name: "University of Auckland", reo: "Waipapa Taumata Rau", city: "Auckland", form: "Buildings, floors and rooms" });
    expect(uoa.snapshot).toBe(`Campus snapshot: ${new Intl.DateTimeFormat("en-NZ", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${meta("uoa").sources[0]!.snapshotDate}T00:00:00Z`))}`);
    const aut = schools.find((s) => s.id === "aut");
    if (aut) expect(schoolLine(aut, shared)).toMatchObject({ site: "AUT World Model", name: "Auckland University of Technology", reo: "Te Wānanga Aronui o Tāmaki Makau Rau", form: "Buildings only" });
    const vuw = schools.find((s) => s.id === "vuw");
    if (vuw) expect(schoolLine(vuw, shared)).toMatchObject({ name: "Victoria University of Wellington", reo: "Te Herenga Waka" });
    // Otago's bilingual name, as its recon gives it ("University of Otago | Ōtākou Whakaihu Waka"), split as VUW's is
    const otago = schools.find((s) => s.id === "otago");
    if (otago) expect(schoolLine(otago, shared)).toMatchObject({ name: "University of Otago", reo: "Ōtākou Whakaihu Waka" });
    const uc = schools.find((s) => s.id === "uc");
    if (uc) expect(schoolLine(uc, shared)).toMatchObject({ name: "University of Canterbury", reo: "Te Whare Wānanga o Waitaha" });
    const massey = schools.find((s) => s.id === "massey");
    if (massey) expect(schoolLine(massey, shared)).toMatchObject({ name: "Massey University", reo: "Te Kunenga ki Pūrehuroa" });
    // Waikato's line has no name in te reo Māori: its recon gives none, and its own site is closed to this project.
    const waikato = schools.find((s) => s.id === "waikato");
    if (waikato) expect(schoolLine(waikato, shared)).toMatchObject({ site: "Waikato World Model", name: "The University of Waikato", reo: undefined, city: "Hamilton", form: "Buildings only" });
    // Lincoln's line has no name in te reo Māori either: its recon gives none, and its own site is closed to this project.
    const lincoln = schools.find((s) => s.id === "lincoln");
    if (lincoln) expect(schoolLine(lincoln, shared)).toMatchObject({ site: "Lincoln World Model", name: "Lincoln University", reo: undefined, city: "Lincoln", form: "Buildings only" });
    // each school's name in te reo Māori stands under its English name, marked as te reo Māori
    expect(pages.index).toContain('<p class="reo" lang="mi">Waipapa Taumata Rau</p>');
    expect(pages.index).toContain("<h1>Campus World Model</h1>");
    expect(pages.notFound).toContain("<h1>No page at this address</h1>");
  });

  it("reads the form from meta.json's layers and coverage", () => {
    const base = meta("uoa");
    expect(schoolForm(base)).toBe("floors");
    expect(schoolForm({ ...base, layers: { indoor: "needs-permission" } })).toBe("buildings");
    expect(schoolForm({ ...base, coverage: { ...base.coverage, planShapes: 0 } })).toBe("roomCodes");
    expect(schoolForm({ ...base, coverage: { ...base.coverage, planShapes: 0, rooms: 0 } })).toBe("buildings");
  });

  it("escapes every text", () => {
    const evil = '<script>alert("x")</script> & \'';
    const words = JSON.parse(JSON.stringify(shared)) as { picker: { schools: Record<string, { name: string }> }; app: { title: string } };
    words.picker.schools.uoa!.name = evil;
    (words.picker.schools.uoa as { reo?: string }).reo = evil;
    const html = pickerPages([{ id: "uoa", words: { ...shared, app: { title: evil } }, meta: meta("uoa"), about: aboutOf("uoa") }], words as unknown as Words).index;
    expect(html).not.toContain("<script");
    expect(html).toContain(escapeHtml(evil));
  });

  it("stops on a school with no words or no campus snapshot", () => {
    expect(() => pickerPages([{ id: "nowhere", words: shared, meta: meta("uoa"), about: aboutOf("uoa") }], shared)).toThrow(/picker\.schools\.nowhere\.name/);
    expect(() => pickerPages([{ id: "uoa", words: shared, meta: { ...meta("uoa"), sources: [] }, about: aboutOf("uoa") }], shared)).toThrow(/snapshot/);
    expect(() => pickerPages([], shared)).toThrow();
  });

  it("leaves its words out of the app, which never shows them", () => {
    expect(lookupWords(shared, "picker.heading")).toBeDefined();
    expect((locales.en as Record<string, unknown>).picker).toBeUndefined();
    expect(Object.keys(locales.en!)).toEqual(Object.keys(shared).filter((k) => k !== "picker"));
  });

  it("is written by the workflow's script next to the schools laid out in the site", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "build-root-"));
    try {
      for (const id of ids) {
        fs.mkdirSync(path.join(dir, id, "data"), { recursive: true });
        for (const f of ["meta.json", "schedule.json", "campus.json"]) fs.copyFileSync(path.join("public", "data", id, f), path.join(dir, id, "data", f));
      }
      execFileSync(process.execPath, ["scripts/build-root.ts", ".github/schools.json", dir], { stdio: "pipe" });
      expect(fs.readFileSync(path.join(dir, "index.html"), "utf8")).toBe(pages.index);
      expect(fs.readFileSync(path.join(dir, "404.html"), "utf8")).toBe(pages.notFound);
      expect(fs.readFileSync(path.join(dir, "favicon.svg"))).toEqual(fs.readFileSync(path.join("public", "favicon.svg")));

      // A school on the list that was not laid out stops it.
      fs.rmSync(path.join(dir, ids.at(-1)!), { recursive: true });
      expect(() => execFileSync(process.execPath, ["scripts/build-root.ts", ".github/schools.json", dir], { stdio: "pipe" })).toThrow();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("About, at the site's root since 2026-11-10", () => {
  /** A school's section of About, as the picker shows it. */
  const article = (id: string) => {
    const m = pages.index.match(new RegExp(`<article class="about-school" id="about-${id}" data-school="${id}">[\\s\\S]*?</article>`));
    expect(m, id).not.toBeNull();
    return m![0];
  };
  const words = (id: string) => schools.find((s) => s.id === id)!.words;

  it("the bar of each page links to the source code on GitHub, with its mark, and to About", () => {
    for (const html of [pages.index, pages.notFound]) {
      expect(html).toContain(`<a id="repo-link" href="${escapeHtml(REPO)}" rel="noopener noreferrer" aria-label="Source code on GitHub"`);
      expect(html).toMatch(/<a id="repo-link"[^>]*><svg viewBox="-2 -2 28 28"[^>]*><path d="M12 \.297/);
    }
    expect(pages.index).toContain('<a id="about-link" href="#about">About</a>');
    // the page for an unknown path has no About of its own, and sends to the picker's
    expect(pages.notFound).toContain('<a id="about-link" href="/#about">About</a>');
    expect(pages.notFound).not.toContain('<section id="about"');
  });

  it("names the Tsinghua World Model, which inspired the site, and links to it", () => {
    expect(INSPIRED_BY.url).toBe("https://tsinghua-world-model.pages.dev/?campus=1&classMode=live");
    expect(pages.index).toContain(`<p id="inspiration">${escapeHtml(lookupWords(shared, "about.inspiration")!)}</p>`);
    expect(pages.index).toContain(`<a id="inspired-by" href="${escapeHtml(INSPIRED_BY.url)}" rel="noopener noreferrer">Tsinghua World Model</a>`);
    expect(pages.index).toContain(`${escapeHtml(lookupWords(shared, "about.code")!)} <a href="${escapeHtml(REPO)}"`);
  });

  for (const id of ids) {
    it(`${id}: its section has its unofficial notice, every source with its link, snapshot date and licence, and OpenStreetMap's credit`, () => {
      const a = article(id);
      const w = words(id);
      expect(a).toContain(`<h3>${escapeHtml(lookupWords(w, "app.title")!)}</h3>`);
      expect(a).toContain(escapeHtml(lookupWords(w, "about.unofficial")!));
      expect(lookupWords(w, "about.unofficial")).toMatch(/not affiliated with, endorsed by or maintained by (the )?[A-Z][\w ]+[a-z]/);
      const sources = meta(id).sources;
      expect(sources.length).toBeGreaterThan(0);
      for (const src of sources) {
        expect(src.url).toMatch(/^https:\/\//);
        expect(a).toContain(`<a href="${escapeHtml(src.url)}" rel="noopener noreferrer">${escapeHtml(src.name)}</a>`);
        expect(a).toContain(`<time datetime="${src.snapshotDate}">${escapeHtml(longDate(src.snapshotDate, w))}</time>`);
        expect(a).toContain(`<dd>${escapeHtml(src.licence)}</dd>`);
      }
      expect(a).toContain('<a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">');
      expect(a).toContain('<table class="coverage">');
    });

    it(`${id}: each layer its data says it cannot show has its reason among the limits`, () => {
      const a = article(id);
      const key = { indoor: "rooms", timetable: "timetable", calendar: "calendar", subjects: "subjects" } as Record<string, string>;
      for (const layer of absentLayers(meta(id))) {
        expect(a).toContain(`<li data-layer="${layer}">${escapeHtml(lookupWords(words(id), `about.limits.${key[layer]}`)!)}</li>`);
      }
    });
  }

  it("the University of Auckland's section names the buildings drawn in detail and credits the LiDAR as LINZ asks", () => {
    const a = article("uoa");
    const about = aboutOf("uoa");
    expect(about.landmarks.detailed).toContain("105 The Clock Tower");
    expect(about.landmarks.detailed.length).toBeGreaterThan(30);
    expect(a).toContain('<p class="landmarks">Drawn in detail from code: ');
    expect(a).toContain("105 The Clock Tower");
    expect(a).toContain(`<a href="${escapeHtml(LANDMARK_LIDAR)}" rel="noopener noreferrer">`);
    expect(a).toContain(`<a href="${escapeHtml(LINZ_ELEVATION_CREDIT)}" rel="noopener noreferrer">`);
    expect(a).toContain("licensed by Regional Software Holdings Limited");
    expect(a).toContain("Creative Commons Attribution 4.0");
    for (const b of about.landmarks.detailed) expect(a).toContain(escapeHtml(b));
    // Sizes measured by something besides the LiDAR (the Kenneth Myers Centre's west part) credit that source.
    expect(about.landmarks.credits.flatMap((c) => c.buildings)).toContain("820 Kenneth Myers Centre");
    const credits = [...a.matchAll(/<p class="landmark-credit">(.*?)<\/p>/g)].map((m) => m[1]!);
    expect(credits).toHaveLength(about.landmarks.credits.length);
    for (const [k, c] of about.landmarks.credits.entries()) {
      expect(credits[k]).toContain(escapeHtml(c.credit));
      for (const b of c.buildings) expect(credits[k]).toContain(escapeHtml(b));
    }
    expect(about.landmarks.measured.length).toBeGreaterThan(10);
    for (const b of about.landmarks.measured) expect(a).toContain(escapeHtml(b));
  });

  it("the University of Auckland's section names its sources, the ground's licence, its coverage and the limits of its data", () => {
    const a = article("uoa");
    for (const text of ["OpenStreetMap", "maps.auckland.ac.nz", "Land Information New Zealand", "CC BY 3.0 NZ", "© OpenStreetMap contributors", "No class times yet", "not surveyed", "Learning spaces with an outline"]) {
      expect(a, text).toContain(escapeHtml(text));
    }
  });

  it("no other school's section names a landmark: each is drawn only on its own school's site", () => {
    for (const id of ids.filter((x) => x !== "uoa")) expect(article(id)).not.toContain('<p class="landmarks">');
  });

  it("a date that is not one is shown as it is, and does not stop the page", () => {
    expect(longDate("2026-10-13", shared)).toBe("13 October 2026");
    expect(longDate("", shared)).toBe("");
    expect(longDate("soon", shared)).toBe("soon");
  });

  it("a school's page links to its section on the root it is served from, or on campusworldmodel.com from any other copy", () => {
    expect(aboutHref("/uoa/", "uoa")).toBe("/#about-uoa");
    expect(aboutHref("/aut/", "aut")).toBe("/#about-aut");
    // The GitHub Pages copy, at /campus-world-model/, has no page at its root.
    expect(aboutHref("/campus-world-model/", "uoa")).toBe(`${SITE}#about-uoa`);
    expect(SITE).toBe("https://campusworldmodel.com/");
    for (const id of ids) expect(pages.index).toContain(`id="about-${id}"`);
  });
});
