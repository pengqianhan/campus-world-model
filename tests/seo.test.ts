// What search engines and AI assistants read of the site (scripts/lib/seo.ts): the head tags and the
// structured data of the picker at the site's root (scripts/lib/picker.ts) and of each school's page
// (scripts/lib/school-page.ts), the summary of the map on a school's page, the pictures for link
// previews (docs/og/), the sitemap, robots.txt and llms.txt.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REPO, SITE } from "../src/app/links.ts";
import type { Words } from "../src/shared/school.ts";
import type { Campus, Meta } from "../src/shared/types.ts";
import { lookupWords } from "../src/shared/words.ts";
import { loadSchoolAbout } from "../scripts/lib/about.ts";
import { type PickerSchool, faq, llmsTxt, pickerPages, schoolLine, schoolWords, sitemapEntries } from "../scripts/lib/picker.ts";
import { schoolPage } from "../scripts/lib/school-page.ts";
import { parseSchoolList } from "../scripts/lib/school-list.ts";
import { OG_IMAGE, headTags, isoDate, jsonLd, robotsTxt, sitemapXml, siteUrl } from "../scripts/lib/seo.ts";

const root = process.cwd();
const shared = JSON.parse(fs.readFileSync("src/i18n/locales/en.json", "utf8")) as Words;
const ids = parseSchoolList(fs.readFileSync(".github/schools.json", "utf8"));
const read = <T>(id: string, file: string) => JSON.parse(fs.readFileSync(path.join("public", "data", id, file), "utf8")) as T;
const schools: PickerSchool[] = ids.map((id) => ({ id, words: schoolWords(root, id, shared), meta: read<Meta>(id, "meta.json"), about: loadSchoolAbout(root, path.join("public", "data", id), id) }));
const pages = pickerPages(schools, shared);
const pageOf = (id: string, base = `/${id}/`) =>
  schoolPage({ id, words: schoolWords(root, id, shared), meta: read<Meta>(id, "meta.json"), campuses: read<{ campuses: Campus[] }>(id, "campus.json").campuses, base });

/** The content of a head tag, by its property or name. */
const meta = (html: string, key: string) => new RegExp(`<meta (?:property|name)="${key.replace(/[.:]/g, "\\$&")}" content="([^"]*)">`).exec(html)?.[1];
const canonical = (html: string) => /<link rel="canonical" href="([^"]*)">/.exec(html)?.[1];
/** Each structured data block of a page, parsed. */
const ld = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((m) => JSON.parse(m[1]!) as Record<string, unknown>);

/** The width and height of a JPEG, from its first start-of-frame marker. */
function jpegSize(file: string): { width: number; height: number } {
  const b = fs.readFileSync(file);
  expect(b.readUInt16BE(0), `${file} is a JPEG`).toBe(0xffd8);
  let i = 2;
  while (i < b.length) {
    const marker = b.readUInt16BE(i);
    if (marker >= 0xffc0 && marker <= 0xffc2) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`${file} has no start-of-frame marker`);
}

describe("the head tags and structured data", () => {
  it("name the page's one address on campusworldmodel.com and its picture", () => {
    const html = headTags({ url: siteUrl("uoa/"), image: siteUrl("uoa/og.jpg"), imageAlt: 'A "map" <of> & more' });
    expect(SITE).toBe("https://campusworldmodel.com/");
    expect(canonical(html)).toBe("https://campusworldmodel.com/uoa/");
    expect(meta(html, "og:url")).toBe("https://campusworldmodel.com/uoa/");
    expect(meta(html, "og:image")).toBe("https://campusworldmodel.com/uoa/og.jpg");
    expect(meta(html, "og:image:width")).toBe(String(OG_IMAGE.width));
    expect(meta(html, "og:image:height")).toBe(String(OG_IMAGE.height));
    expect(meta(html, "og:image:alt")).toBe("A &quot;map&quot; &lt;of&gt; &amp; more");
    expect(meta(html, "og:site_name")).toBe("Campus World Model");
    expect(meta(html, "twitter:card")).toBe("summary_large_image");
  });

  it("write structured data that no text in it can end", () => {
    const html = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(ld(html)[0]!.name).toBe("</script><script>alert(1)</script>");
  });

  it("take the date of an ISO time and stop on anything else", () => {
    expect(isoDate("2026-10-22T20:35:10.391Z")).toBe("2026-10-22");
    expect(() => isoDate("22 October")).toThrow();
  });
});

describe("the picker at the site's root", () => {
  it("names its one address, its picture and what the picture shows", () => {
    expect(canonical(pages.index)).toBe(SITE);
    expect(meta(pages.index, "og:url")).toBe(SITE);
    expect(meta(pages.index, "og:image")).toBe(`${SITE}og.jpg`);
    expect(meta(pages.index, "og:image:alt")).toBe(lookupWords(shared, "picker.imageAlt"));
  });

  it("describes the site, its schools' maps and its questions in structured data, in the words it shows", () => {
    const [data] = ld(pages.index);
    expect(ld(pages.index)).toHaveLength(1);
    const graph = data!["@graph"] as Record<string, unknown>[];
    expect(graph.map((x) => x["@type"])).toEqual(["WebSite", "ItemList", "FAQPage"]);
    expect(graph[0]).toMatchObject({ name: "Campus World Model", url: SITE, description: lookupWords(shared, "picker.description") });
    const items = graph[1]!.itemListElement as { position: number; name: string; url: string }[];
    expect(items.map((x) => x.url)).toEqual(ids.map((id) => `${SITE}${id}/`));
    expect(items.map((x) => x.position)).toEqual(ids.map((_, i) => i + 1));
    const questions = graph[2]!.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(questions.map((x) => ({ q: x.name, a: x.acceptedAnswer.text }))).toEqual(faq(shared));
    // each question and its answer is on the page, as people see it
    for (const { q, a } of faq(shared)) expect(pages.index).toContain(`<h3>${q.replace(/'/g, "&#39;")}</h3>\n<p>${a.replace(/'/g, "&#39;")}</p>`);
  });

  it("says it is not affiliated with any university, in its first answer", () => {
    expect(faq(shared)[0]!.a).toMatch(/not affiliated with any of these universities/);
    expect(faq(shared).find((x) => /official/.test(x.q))!.a).toMatch(/^No\./);
  });

  it("asks that the page for an unknown address is not indexed, and names no address for it", () => {
    expect(meta(pages.notFound, "robots")).toBe("noindex");
    expect(canonical(pages.notFound)).toBeUndefined();
    expect(ld(pages.notFound)).toEqual([]);
    expect(pages.notFound).not.toContain('class="faq"');
  });
});

describe("a school's page", () => {
  for (const id of ids) {
    it(`${id}: names its one address and picture, and describes the map in structured data`, () => {
      const { head } = pageOf(id);
      const words = schoolWords(root, id, shared);
      expect(canonical(head)).toBe(`${SITE}${id}/`);
      expect(meta(head, "og:url")).toBe(`${SITE}${id}/`);
      expect(meta(head, "og:image")).toBe(`${SITE}${id}/og.jpg`);
      const [data] = ld(head);
      expect(data).toMatchObject({
        "@type": "WebApplication",
        name: lookupWords(words, "app.title"),
        url: `${SITE}${id}/`,
        description: lookupWords(words, "app.description"),
        isAccessibleForFree: true,
        dateModified: isoDate(read<Meta>(id, "meta.json").generatedAt),
        isPartOf: { "@type": "WebSite", url: SITE },
        about: { "@type": "CollegeOrUniversity", name: lookupWords(shared, `picker.schools.${id}.name`) },
      });
      // the university is what the map is about, never its author or publisher: the map is unofficial
      expect(Object.keys(data!)).not.toContain("author");
      expect(Object.keys(data!)).not.toContain("publisher");
      expect(lookupWords(words, "app.description")).toMatch(/[Uu]nofficial/);
    });

    it(`${id}: carries a summary of the map from its own words and data, hidden on screen`, () => {
      const { body } = pageOf(id);
      const m = read<Meta>(id, "meta.json");
      const line = schoolLine(schools.find((s) => s.id === id)!, shared);
      expect(body).toMatch(/^<section id="summary" class="sr-only" aria-labelledby="summary-title">/);
      expect(body).toContain(`Buildings on the map: ${m.coverage.buildingsOnMap.toLocaleString("en-NZ")}.`);
      expect(body).toContain(`${line.form}.`);
      expect(body).toContain(`${line.snapshot}.`);
      for (const c of read<{ campuses: Campus[] }>(id, "campus.json").campuses.filter((c) => c.onMap && c.buildingCount > 0)) expect(body).toContain(c.name.en);
      // a link to every school's map: the root it is served from, or campusworldmodel.com from the GitHub Pages copy
      expect(body).toContain('<a href="/">');
      expect(pageOf(id, "/campus-world-model/").body).toContain(`<a href="${SITE}">`);
      expect(body).not.toMatch(/<script|\bon[a-z]+=/i);
    });
  }

  it("escapes every text", () => {
    const evil = '<img src=x onerror=alert(1)> & "';
    const words = JSON.parse(JSON.stringify(schoolWords(root, "uoa", shared))) as { app: { title: string; description: string } };
    words.app.title = evil;
    words.app.description = evil;
    const { head, body } = schoolPage({ id: "uoa", words: words as unknown as Words, meta: read<Meta>("uoa", "meta.json"), campuses: read<{ campuses: Campus[] }>("uoa", "campus.json").campuses, base: "/uoa/" });
    expect(`${head}${body}`).not.toContain("<img");
    expect(ld(head)[0]).toMatchObject({ name: evil, description: evil });
  });
});

describe("the pictures for link previews", () => {
  for (const name of ["home", ...ids]) {
    it(`docs/og/${name}.jpg is a JPEG of ${OG_IMAGE.width} by ${OG_IMAGE.height} pixels, under 300 kB`, () => {
      const file = path.join("docs", "og", `${name}.jpg`);
      expect(jpegSize(file)).toEqual(OG_IMAGE);
      expect(fs.statSync(file).size).toBeLessThan(300_000);
    });
  }
});

describe("the files at the site's root", () => {
  it("sitemap.xml lists the picker and each school's page, each dated", () => {
    const xml = sitemapXml(sitemapEntries(schools));
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual([SITE, ...ids.map((id) => `${SITE}${id}/`)]);
    const dates = [...xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((m) => m[1]!);
    expect(dates).toHaveLength(ids.length + 1);
    for (const d of dates) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dates[0]).toBe([...dates.slice(1)].sort().at(-1));
    expect(sitemapXml([{ url: `${SITE}?a=1&b=2` }])).toContain("<loc>https://campusworldmodel.com/?a=1&amp;b=2</loc>");
  });

  it("robots.txt lets every crawler read every page, names the sitemap and says nothing of AI training", () => {
    const txt = robotsTxt();
    expect(txt).toContain("User-agent: *\n");
    expect(txt).toContain("Allow: /\n");
    expect(txt).not.toMatch(/Disallow/);
    expect(txt).toContain("Content-Signal: search=yes, ai-input=yes\n");
    expect(txt).not.toMatch(/ai-train/);
    expect(txt).toContain(`Sitemap: ${SITE}sitemap.xml\n`);
  });

  it("llms.txt says what the site is, lists each school's map and links only to the site and its source code", () => {
    const txt = llmsTxt(schools, shared);
    expect(txt.startsWith(`# Campus World Model\n\n> ${lookupWords(shared, "picker.description")}\n`)).toBe(true);
    for (const school of schools) {
      const s = schoolLine(school, shared);
      expect(txt).toContain(`- [${s.site}](${SITE}${s.id}/): `);
    }
    for (const { q, a } of faq(shared).slice(1)) expect(txt).toContain(`### ${q}\n\n${a}\n`);
    const links = [...txt.matchAll(/\]\(([^)]*)\)/g)].map((m) => m[1]!);
    for (const link of links) expect(link === REPO || link.startsWith(SITE), link).toBe(true);
    // every address it gives as an example opens the University of Auckland's map
    const examples = [...txt.matchAll(/https:\/\/campusworldmodel\.com\/uoa\/\?\S+/g)].map((m) => new URL(m[0]));
    expect(examples).toHaveLength(3);
    const rooms = new Set(read<{ rooms: { code: string }[] }>("uoa", "campus.json").rooms.map((r) => r.code));
    const buildings = read<{ buildings: { id: string; floors: { name: string }[] }[] }>("uoa", "campus.json").buildings;
    for (const url of examples) {
      const b = url.searchParams.get("building");
      const room = url.searchParams.get("room");
      if (b) expect(buildings.some((x) => x.id === b), b).toBe(true);
      if (room) expect(rooms.has(room), room).toBe(true);
      const floor = url.searchParams.get("floor");
      if (floor) expect(buildings.find((x) => x.id === b)!.floors.map((f) => f.name)).toContain(floor);
    }
  });
});
