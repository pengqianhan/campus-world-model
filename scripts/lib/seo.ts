// What search engines and AI assistants read of the site, beside what people see: the head tags that
// name a page's one address and its picture, structured data (schema.org, as JSON-LD), the sitemap
// and robots.txt. The pages that use them are the school picker at the site's root
// (scripts/lib/picker.ts) and each school's page (scripts/lib/school-page.ts, from vite.config.ts).
// Every address here is on SITE, campusworldmodel.com: the same pages are also served from
// campus-world-model.pages.dev and, for the University of Auckland, from GitHub Pages, and each copy
// names SITE's address as the one to index.
import { SITE } from "../../src/app/links.ts";

/** The name of the site as a whole, as the picker's heading gives it. */
export const SITE_NAME = "Campus World Model";

/** The size of each page's picture for link previews (docs/og/), in pixels. */
export const OG_IMAGE = { width: 1200, height: 630 } as const;

/** The full address of a page of the site, from its path under the root, such as "uoa/". */
export function siteUrl(path = ""): string {
  return new URL(path, SITE).href;
}

/** Text made safe for HTML, in an element or in a quoted attribute. */
function e(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** What a page's head says of it beside its title and description. */
export interface PageHead {
  /** The page's one address, on SITE. */
  url: string;
  /** Its picture for link previews, on SITE. */
  image: string;
  /** What the picture shows, for those who cannot see it. */
  imageAlt: string;
}

/** The head tags of a page: its canonical address, and its address and picture for link previews. */
export function headTags(h: PageHead): string {
  return [
    `<link rel="canonical" href="${e(h.url)}">`,
    `<meta property="og:site_name" content="${e(SITE_NAME)}">`,
    `<meta property="og:url" content="${e(h.url)}">`,
    `<meta property="og:image" content="${e(h.image)}">`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}">`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}">`,
    `<meta property="og:image:alt" content="${e(h.imageAlt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].join("\n");
}

/**
 * Structured data as a script element of type application/ld+json, which no browser runs. Each "<" is
 * written as \u003c, so no text in it can end the element.
 */
export function jsonLd(data: object): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

/** The date part, YYYY-MM-DD, of an ISO time such as meta.json's generatedAt. */
export function isoDate(iso: string): string {
  const date = /^\d{4}-\d{2}-\d{2}/.exec(iso)?.[0];
  if (!date) throw new Error(`not an ISO time: ${JSON.stringify(iso)}`);
  return date;
}

/** One page in the sitemap: its full address, and the date its content last changed. */
export interface SitemapEntry {
  url: string;
  lastmod?: string;
}

/** The sitemap (sitemaps.org, version 0.9) of the given pages, in the order given. */
export function sitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map((x) => `<url><loc>${e(x.url)}</loc>${x.lastmod ? `<lastmod>${e(x.lastmod)}</lastmod>` : ""}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

/**
 * robots.txt: every crawler may read every page, and the sitemap is named. The content signals
 * (contentsignals.org) say the pages may be used for search results and as input to AI answers, and
 * not to train AI models: much of what the maps show is other people's data under their own terms
 * (OpenStreetMap, LINZ, a university's campus map), which this site cannot grant for training (the
 * maintainer, 2026-11-14). Cloudflare may put its own lines above these on campusworldmodel.com.
 */
export function robotsTxt(): string {
  return [
    `# ${SITE_NAME}: unofficial, student-made 3D maps of university campuses in New Zealand.`,
    "User-agent: *",
    "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    "Allow: /",
    "",
    `Sitemap: ${siteUrl("sitemap.xml")}`,
    "",
  ].join("\n");
}
