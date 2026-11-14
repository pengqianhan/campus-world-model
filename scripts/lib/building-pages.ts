// A school's building list, at /<id>/buildings/, and a page for each building with learning spaces, at
// /<id>/buildings/<code>/: static pages, with no script and no WebGL, that search engines and AI
// assistants can read, and people too. vite.config.ts writes them into each school's build from its
// published data; the sitemap and llms.txt at the site's root list them (scripts/lib/picker.ts).
//
// They show only what the map shows (AGENTS.md, "Places, not people"): each building's name, code,
// campus and floors, and on a building's page its learning spaces, the rooms that campus.json names.
// No other space is named or given a code here, and a floor the map leaves blank says why, in the
// map's own words. A building without learning spaces has no page of its own: the list links it to
// the 3D map, so that no page is all but empty. Each building keeps its name as the source gives it.
import { aboutHref, homeHref } from "../../src/app/links.ts";
import type { Words } from "../../src/shared/school.ts";
import type { Building, Campus, Floor, Meta, Room } from "../../src/shared/types.ts";
import { lookupWords } from "../../src/shared/words.ts";
import { longDate } from "./about.ts";
import { STYLE, campusSnapshot, escapeHtml as e, schoolForm, word } from "./picker.ts";
import { SITE_NAME, headTags, jsonLd, siteUrl } from "./seo.ts";

/** What a school's building pages are made from. */
export interface BuildingPagesInput {
  id: string;
  /** The school's words: src/i18n/locales/en.json with its overlay laid over it. */
  words: Words;
  /** Its published meta.json. */
  meta: Meta;
  /** Its published campus.json. */
  campus: { campuses: Campus[]; buildings: Building[]; rooms: Room[] };
  /** The path the school's page is served from: /<id>/, or /campus-world-model/ on GitHub Pages. */
  base: string;
}

/** A page to write: its path under the school's build, and its HTML. */
export interface PageFile {
  path: string;
  html: string;
}

/** The code a building is known by, as its label shows it (buildingCode in src/ui/common.tsx): none for a building from OpenStreetMap with no ref. */
export function buildingCode(b: Building): string {
  return b.ref ?? (b.osm ? "" : b.id);
}

/** A building's name with its code before it, as the map's label shows them, unless the name already holds the code ("Building 114"). */
export function buildingTitle(b: Building): string {
  const code = buildingCode(b);
  const name = b.name.en;
  const holds = code && new RegExp(`(^|[^\\w])${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\w]|$)`, "i").test(name);
  return code && !holds ? `${code} ${name}` : name;
}

/** The path segment of a building's page: its id in lower case. */
export function buildingSlug(b: Building): string {
  const slug = b.id.toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(slug)) throw new Error(`building id ${JSON.stringify(b.id)} cannot be a path segment`);
  return slug;
}

/** Whether a building has a page of its own: when the map names a learning space in it. */
export function hasOwnPage(b: Building): boolean {
  return b.roomCount > 0;
}

/** The pages a school's build carries, as paths under its base: the list, then each building's page. */
export function buildingPagePaths(input: Pick<BuildingPagesInput, "campus">): string[] {
  const slugs = input.campus.buildings.filter(hasOwnPage).map(buildingSlug);
  if (new Set(slugs).size !== slugs.length) throw new Error("two buildings have the same id in lower case");
  return ["buildings/", ...slugs.map((s) => `buildings/${s}/`)];
}

/** A count in the map's words: building.floors_one or building.floors_other, as the language's plural rules choose. */
function counted(words: Words, key: string, n: number): string {
  const locale = lookupWords(words, "_meta.intl") ?? "en-NZ";
  const form = new Intl.PluralRules(locale).select(n);
  return word(words, lookupWords(words, `${key}_${form}`) === undefined ? `${key}_other` : `${key}_${form}`, { count: n.toLocaleString(locale) });
}

/** By code, numbers in order (303 before 1439), then by name. */
const byCode = (a: Building, b: Building) => buildingCode(a).localeCompare(buildingCode(b), "en", { numeric: true }) || a.name.en.localeCompare(b.name.en, "en");

const EXTRA_STYLE = `
.crumbs{margin:0 0 16px;font-size:.9375rem;color:#33424d}
.crumbs a{color:#0b4f7c}
.where{margin:0 0 4px;color:#33424d}
.open{display:inline-flex;align-items:center;min-height:44px;margin:16px 0 0;padding:0 16px;border-radius:10px;background:var(--panel);color:var(--text);font-weight:600;text-decoration:none}
.open:hover{box-shadow:0 0 0 2px var(--accent)}
.open:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
section{margin-top:32px}
section>h2{margin:0 0 8px;font:600 1.5rem/1.25 var(--font-display)}
section>h3{margin:24px 0 4px;font:600 1.125rem/1.3 var(--font)}
.list{margin:0;padding:0;list-style:none}
.list>li{padding:8px 0;border-bottom:1px solid rgba(15,27,37,.12);overflow-wrap:anywhere}
.list a{color:#0b4f7c;font-weight:600}
.meta{color:#4a5a66;font-size:.9375rem}
.list .map{margin-left:8px;font-weight:400;font-size:.9375rem}
.note{margin:4px 0 0;color:#4a5a66}
.built{margin-top:32px;font-size:.9375rem}
.built a{color:#0b4f7c}
`.trim();

/** One static page in the picker's style, with its head tags and structured data. */
function shell(p: { title: string; description: string; url: string; image: string; imageAlt: string; favicon: string; data: object; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0f1b25">
<meta name="description" content="${e(p.description)}">
<meta property="og:title" content="${e(p.title)}">
<meta property="og:description" content="${e(p.description)}">
<meta property="og:type" content="website">
${headTags({ url: p.url, image: p.image, imageAlt: p.imageAlt })}
${jsonLd(p.data)}
<link rel="icon" type="image/svg+xml" href="${e(p.favicon)}">
<title>${e(p.title)}</title>
<style>${STYLE}\n${EXTRA_STYLE}</style>
</head>
<body>
<main>
${p.body}
</main>
</body>
</html>
`;
}

/** The trail from the site's root to a page, each step a link but the last. */
function crumbs(words: Words, steps: { name: string; href?: string }[]): string {
  const parts = steps.map((s) => (s.href ? `<a href="${e(s.href)}">${e(s.name)}</a>` : `<span aria-current="page">${e(s.name)}</span>`));
  return `<nav class="crumbs" aria-label="${e(word(words, "picker.buildings.crumbsLabel"))}">${parts.join(" › ")}</nav>`;
}

/** The same trail as structured data. */
function breadcrumbList(steps: { name: string; url: string }[]): object {
  return { "@type": "BreadcrumbList", itemListElement: steps.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, item: s.url })) };
}

/** A school's building list and its buildings' pages, as files under its build: buildings/index.html and buildings/<code>/index.html. */
export function buildingPageFiles(input: BuildingPagesInput): PageFile[] {
  const { id, words, meta, campus, base } = input;
  const site = word(words, "app.title");
  const school = word(words, `picker.schools.${id}.name`);
  const university = { "@type": "CollegeOrUniversity", name: school };
  const description = word(words, "app.description");
  const image = siteUrl(`${id}/og.jpg`);
  const imageAlt = word(words, "picker.schoolPage.imageAlt", { site, school });
  const showsFloors = schoolForm(meta) !== "buildings";
  const listUrl = siteUrl(`${id}/buildings/`);
  const campusName = new Map(campus.campuses.map((c) => [c.id, c.name.en]));
  const roomsOf = new Map<string, Room[]>();
  for (const r of campus.rooms) roomsOf.set(r.b, [...(roomsOf.get(r.b) ?? []), r]);
  const snapshot = word(words, "picker.snapshot", { date: longDate(campusSnapshot(meta), words) });
  const notice = word(words, "about.unofficial");
  const open3d = word(words, "picker.buildings.open3d");
  const listName = word(words, "picker.buildings.crumb");
  const trail = [
    { name: SITE_NAME, url: siteUrl(), href: homeHref(base, id) },
    { name: site, url: siteUrl(`${id}/`) },
    { name: listName, url: listUrl },
  ];
  buildingPagePaths(input);

  const counts = (b: Building) => [counted(words, "building.floors", b.floors.length), ...(b.roomCount ? [counted(words, "building.rooms", b.roomCount)] : [])].join(" · ");

  // The list: each campus with buildings, in campus.json's order, its buildings by code.
  const groups = campus.campuses
    .map((c) => ({ c, buildings: campus.buildings.filter((b) => b.campus === c.id).sort(byCode) }))
    .filter((g) => g.buildings.length > 0);
  const listed = new Set(groups.flatMap((g) => g.buildings));
  if (listed.size !== campus.buildings.length) throw new Error(`campus.json has buildings on no campus it lists: ${campus.buildings.filter((b) => !listed.has(b)).map((b) => b.id).join(", ")}`);
  const listBody = [
    crumbs(words, [{ name: SITE_NAME, href: homeHref(base, id) }, { name: site, href: "../" }, { name: listName }]),
    `<h1>${e(word(words, "picker.buildings.heading"))}</h1>`,
    `<p class="lead">${e(word(words, showsFloors ? "picker.buildings.lead" : "picker.buildings.leadBuildings", { site }))}</p>`,
    `<p class="notice">${e(notice)}</p>`,
    ...groups.map(({ c, buildings }) =>
      [
        `<section aria-labelledby="campus-${e(c.id)}">`,
        `<h2 id="campus-${e(c.id)}">${e(c.name.en)}</h2>`,
        `<ul class="list">`,
        ...buildings.map((b) => {
          const map = `?building=${encodeURIComponent(b.id)}`;
          if (!showsFloors) return `<li><a href="../${e(map)}">${e(buildingTitle(b))}</a></li>`;
          const name = hasOwnPage(b) ? `<a href="${e(buildingSlug(b))}/">${e(buildingTitle(b))}</a>` : `<span>${e(buildingTitle(b))}</span>`;
          return `<li>${name} <span class="meta">${e(counts(b))}</span> <a class="map" href="../${e(map)}">${e(open3d)}</a></li>`;
        }),
        `</ul>`,
        `</section>`,
      ].join("\n"),
    ),
    `<p class="built">${e(snapshot)} · <a href="${e(aboutHref(base, id))}">${e(word(words, "picker.buildings.about"))}</a></p>`,
  ].join("\n");
  const list: PageFile = {
    path: "buildings/index.html",
    html: shell({
      title: word(words, "picker.buildings.documentTitle", { site }),
      description: word(words, "picker.buildings.description", { count: campus.buildings.length.toLocaleString("en-NZ"), description }),
      url: listUrl,
      image,
      imageAlt,
      favicon: "../favicon.svg",
      data: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CollectionPage",
            name: word(words, "picker.buildings.documentTitle", { site }),
            url: listUrl,
            about: university,
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: siteUrl() },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: groups
                .flatMap((g) => g.buildings)
                .map((b, i) => ({ "@type": "ListItem", position: i + 1, name: buildingTitle(b), ...(showsFloors && hasOwnPage(b) ? { url: siteUrl(`${id}/buildings/${buildingSlug(b)}/`) } : {}) })),
            },
          },
          breadcrumbList(trail),
        ],
      },
      body: listBody,
    }),
  };
  if (!showsFloors) return [list];

  // A page for each building with learning spaces: its floors in the map's order, each with its rooms by code.
  const pages = campus.buildings.filter(hasOwnPage).map((b): PageFile => {
    const title = buildingTitle(b);
    const where = campusName.get(b.campus) ?? "";
    const url = siteUrl(`${id}/buildings/${buildingSlug(b)}/`);
    const rooms = roomsOf.get(b.id) ?? [];
    const floor = (f: Floor) => {
      const here = rooms.filter((r) => r.f === f.i).sort((x, y) => x.code.localeCompare(y.code, "en", { numeric: true }));
      const notes = [
        ...(f.noPlan ? [word(words, `building.noPlan.${f.noPlan}`)] : []),
        ...(f.partialPlan ? [word(words, "building.partialPlan")] : []),
        ...(!here.length && !f.noPlan ? [word(words, "building.noRoomsOnFloor")] : []),
      ];
      return [
        `<h3 id="floor-${e(f.name)}">${e(word(words, "building.floor", { name: f.name }))}</h3>`,
        ...notes.map((n) => `<p class="note">${e(n)}</p>`),
        ...(here.length
          ? [
              `<ul class="list">`,
              ...here.map((r) => {
                const kind = word(words, `room.kind.${r.kind}`);
                const name = r.name.en;
                const label = word(words, "picker.buildings.roomLink", { code: r.code });
                return `<li id="${e(r.code)}"><a href="../../?room=${e(encodeURIComponent(r.code))}" aria-label="${e(label)}">${e(r.code)}</a> ${e(name)}${kind.toLowerCase() === name.toLowerCase() ? "" : ` <span class="meta">${e(kind)}</span>`}</li>`;
              }),
              `</ul>`,
            ]
          : []),
      ].join("\n");
    };
    const body = [
      crumbs(words, [{ name: SITE_NAME, href: homeHref(base, id) }, { name: site, href: "../../" }, { name: listName, href: "../" }, { name: title }]),
      `<h1>${e(title)}</h1>`,
      `<p class="where">${e(`${where} · ${school}`)}</p>`,
      `<p class="lead">${e(counts(b))}</p>`,
      `<p class="notice">${e(notice)}</p>`,
      `<p><a class="open" href="../../?building=${e(encodeURIComponent(b.id))}">${e(open3d)}</a></p>`,
      `<section aria-labelledby="floors-title">`,
      `<h2 id="floors-title">${e(word(words, "picker.buildings.floorsTitle"))}</h2>`,
      ...b.floors.map(floor),
      `</section>`,
      `<p class="built">${e(word(words, "picker.buildings.sourceText", { text: b.sourceText }))} · ${e(snapshot)} · <a href="${e(aboutHref(base, id))}">${e(word(words, "picker.buildings.about"))}</a></p>`,
    ].join("\n");
    const pageTitle = word(words, "picker.buildings.pageTitle", { name: title, site });
    return {
      path: `buildings/${buildingSlug(b)}/index.html`,
      html: shell({
        title: pageTitle,
        description: word(words, "picker.buildings.pageDescription", {
          name: title,
          campus: where,
          floors: counted(words, "building.floors", b.floors.length),
          rooms: counted(words, "building.rooms", b.roomCount),
          description,
        }),
        url,
        image,
        imageAlt,
        favicon: "../../favicon.svg",
        data: {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              name: pageTitle,
              url,
              isPartOf: { "@type": "WebSite", name: SITE_NAME, url: siteUrl() },
              about: { "@type": "Place", name: title, identifier: b.id, containedInPlace: university },
            },
            breadcrumbList([...trail, { name: title, url }]),
          ],
        },
        body,
      }),
    };
  });
  return [list, ...pages];
}
