// What a school's page at /<id>/ (index.html, built by vite.config.ts) says to search engines and AI
// assistants. The map itself is drawn by script on a canvas, which they cannot read, so the page also
// carries, in its HTML:
// - head tags with its one address on campusworldmodel.com and its picture for link previews
//   (docs/og/<id>.jpg, which vite.config.ts copies to the build as og.jpg);
// - structured data: the map as a free web application about the school;
// - a short summary of the map, after the app's element, for screen readers and for any reader that
//   does not run script. It is hidden on screen (.sr-only, src/ui/styles.css), where the map shows
//   the same things. Every text in it comes from the school's words, its meta.json and campus.json.
import { homeHref } from "../../src/app/links.ts";
import type { Words } from "../../src/shared/school.ts";
import type { Campus, Meta } from "../../src/shared/types.ts";
import { lookupWords } from "../../src/shared/words.ts";
import { longDate } from "./about.ts";
import { campusSnapshot, escapeHtml as e, schoolForm, word } from "./picker.ts";
import { SITE_NAME, headTags, isoDate, jsonLd, siteUrl } from "./seo.ts";

/** What a school's page is made from. */
export interface SchoolPageInput {
  id: string;
  /** The school's words: src/i18n/locales/en.json with its overlay laid over it, as vite.config.ts reads them. */
  words: Words;
  /** Its published meta.json. */
  meta: Meta;
  /** The campuses of its published campus.json. */
  campuses: Campus[];
  /** The path the page is served from: /<id>/ on the Cloudflare site, /campus-world-model/ on GitHub Pages. */
  base: string;
}

/** The facts of a school's map that its page states, as plain text. */
export function schoolFacts(s: SchoolPageInput) {
  const site = word(s.words, "app.title");
  const school = word(s.words, `picker.schools.${s.id}.name`);
  const campuses = s.campuses.filter((c) => c.onMap && c.buildingCount > 0).map((c) => c.name.en);
  const list = new Intl.ListFormat(lookupWords(s.words, "_meta.intl") ?? "en-NZ", { type: "conjunction" }).format(campuses);
  return {
    site,
    school,
    reo: lookupWords(s.words, `picker.schools.${s.id}.reo`),
    url: siteUrl(`${s.id}/`),
    image: siteUrl(`${s.id}/og.jpg`),
    imageAlt: word(s.words, "picker.schoolPage.imageAlt", { site, school }),
    heading: word(s.words, "picker.schoolPage.heading", { site, school }),
    description: word(s.words, "app.description"),
    form: word(s.words, `picker.form.${schoolForm(s.meta)}`),
    buildings: word(s.words, "picker.schoolPage.buildings", { count: s.meta.coverage.buildingsOnMap.toLocaleString("en-NZ") }),
    campuses: campuses.length ? word(s.words, "picker.schoolPage.campuses", { campuses: list }) : undefined,
    snapshot: word(s.words, "picker.snapshot", { date: longDate(campusSnapshot(s.meta), s.words) }),
    updated: isoDate(s.meta.generatedAt),
  };
}

/** The head tags and the summary a school's page carries, as HTML. */
export function schoolPage(s: SchoolPageInput): { head: string; body: string } {
  const f = schoolFacts(s);
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: f.site,
    url: f.url,
    description: f.description,
    image: f.image,
    applicationCategory: "ReferenceApplication",
    operatingSystem: "Any",
    browserRequirements: word(s.words, "picker.schoolPage.requirements"),
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "NZD" },
    inLanguage: lookupWords(s.words, "_meta.intl") ?? "en-NZ",
    dateModified: f.updated,
    about: { "@type": "CollegeOrUniversity", name: f.school, ...(f.reo ? { alternateName: f.reo } : {}) },
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: siteUrl() },
  };
  const head = `${headTags({ url: f.url, image: f.image, imageAlt: f.imageAlt })}\n${jsonLd(data)}`;
  const body = [
    `<section id="summary" class="sr-only" aria-labelledby="summary-title">`,
    `<h2 id="summary-title">${e(f.heading)}</h2>`,
    `<p>${e(f.description)}</p>`,
    `<p>${e(`${f.form}.`)} ${e(f.buildings)}${f.campuses ? ` ${e(f.campuses)}` : ""} ${e(`${f.snapshot}.`)}</p>`,
    `<p><a href="${e(homeHref(s.base, s.id))}">${e(word(s.words, "picker.schoolPage.allSchools"))}</a></p>`,
    `</section>`,
  ].join("\n");
  return { head, body };
}
