// The school picker and the 404 page at the Cloudflare site's root (docs/schools/DESIGN.md,
// section 7), as scripts/build-root.ts writes them from the list, each school's meta.json and words.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "../src/app/i18n.ts";
import type { Words } from "../src/shared/school.ts";
import type { Meta } from "../src/shared/types.ts";
import { lookupWords, wordKeys } from "../src/shared/words.ts";
import { type PickerSchool, escapeHtml, pickerPages, schoolForm, schoolLine, schoolWords } from "../scripts/lib/picker.ts";
import { parseSchoolList } from "../scripts/lib/school-list.ts";

const root = process.cwd();
const shared = JSON.parse(fs.readFileSync("src/i18n/locales/en.json", "utf8")) as Words;
const ids = parseSchoolList(fs.readFileSync(".github/schools.json", "utf8"));
const meta = (id: string) => JSON.parse(fs.readFileSync(path.join("public", "data", id, "meta.json"), "utf8")) as Meta;
const schools: PickerSchool[] = ids.map((id) => ({ id, words: schoolWords(root, id, shared), meta: meta(id) }));
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
  const body = html.replace(/<style>[\s\S]*?<\/style>/g, "");
  const between = [...body.matchAll(/>([^<]+)</g)].map((m) => unescape(m[1]!).trim()).filter(Boolean);
  const attrs = [...body.matchAll(/(?:name="description"|property="og:(?:title|description)") content="([^"]*)"|aria-label="([^"]*)"/g)].map((m) => unescape(m[1] ?? m[2]!));
  return [...between, ...attrs];
}

/** Every text the page may show: each picker.* text, and each school's facts from its meta.json and words. */
function allowedTexts(): Set<string> {
  const picker = wordKeys(shared).filter((k) => k.startsWith("picker.")).map((k) => lookupWords(shared, k)!);
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

    it(`${page} shows only texts from picker.*, each school's words or its meta.json`, () => {
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
    const html = pickerPages([{ id: "uoa", words: { ...shared, app: { title: evil } }, meta: meta("uoa") }], words as unknown as Words).index;
    expect(html).not.toContain("<script");
    expect(html).toContain(escapeHtml(evil));
  });

  it("stops on a school with no words or no campus snapshot", () => {
    expect(() => pickerPages([{ id: "nowhere", words: shared, meta: meta("uoa") }], shared)).toThrow(/picker\.schools\.nowhere\.name/);
    expect(() => pickerPages([{ id: "uoa", words: shared, meta: { ...meta("uoa"), sources: [] } }], shared)).toThrow(/snapshot/);
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
        fs.copyFileSync(path.join("public", "data", id, "meta.json"), path.join(dir, id, "data", "meta.json"));
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
