# Development

How to run, test and deploy the site, how the code is laid out, and how its data, class
timetable and languages are added to. The checks a change passes before it merges are in
[standards.md](standards.md).

## Run it locally

Requires Node 22.18 or newer, which runs TypeScript files directly (developed and built in CI on
Node 24).

```bash
npm ci
npm run dev        # http://localhost:5273/campus-world-model/
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests (room codes, floors, Auckland time and daylight saving, calendar, search, data checks) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve `dist/` at http://localhost:4273/campus-world-model/ |
| `npm run e2e` | Playwright tests against the preview build: run `npm run build` first, and `npx playwright install chromium` once (on Linux, `npx playwright install --with-deps chromium`) |
| `npm run data:fetch` | Download any data snapshot that is not cached yet (maintainer; see below) |
| `npm run data:build` | Rebuild `public/data/uoa/*.json` from the cached snapshots (maintainer; see below) |

The end-to-end tests draw with WebGL. On Windows they use the real GPU; on macOS and Linux they use
the SwiftShader software renderer, as CI does, with CI's longer timeouts and two workers. That is
slower but sees what CI sees; `E2E_GL=swiftshader` does the same on Windows.

To test a deployed copy instead of a local build:

```bash
E2E_BASE_URL=https://pengqianhan.github.io/campus-world-model/ npm run e2e
```

In Windows PowerShell, set the variable first: `$env:E2E_BASE_URL = "https://…"; npm run e2e`. The
same goes for every `NAME=value command` line on this page.

The site is static. A merge into `main` runs `.github/workflows/deploy.yml`, which type-checks, runs
the unit and end-to-end tests, builds, and publishes to GitHub Pages only if the University of
Auckland's build and tests passed (the Cloudflare copy waits for every school's, below). The
Vite `base` is `/campus-world-model/`; set `BASE_PATH=/` to host at a domain root.

The schools that the site holds are listed in `.github/schools.json`; today it holds `uoa`, the
University of Auckland, and `aut`, Auckland University of Technology (see
[docs/schools/DESIGN.md](schools/DESIGN.md)). The `build` job
builds the University of Auckland into `dist/`, the GitHub Pages copy, and each other school on the
list with `SCHOOL=<id>` into `dist-<id>/`. Each other school also gets an end-to-end job of its own,
`e2e, <id>`, which runs only `e2e/schools/common.spec.ts` and `e2e/schools/<id>/`
(`SCHOOL=<id> npm run e2e` does the same on your machine, after `SCHOOL=<id> npm run build`). The
`schools` check passes when each of them passed, or when the list holds no other school.

The same workflow publishes a second copy to Cloudflare Pages, with each school on the list under
its own path (`/uoa/`, `/<id>/`) and the files in `cloudflare/` at the site root. It waits for
`build`, `e2e` and `schools`, so one school that fails holds back every school's Cloudflare copy.
That job runs only when the repository variable `CLOUDFLARE_PROJECT` names a Pages project and the
secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set, so a fork deploys to GitHub
Pages alone until it has them. Only the steps that run `wrangler` get the two secrets.

The root of the Cloudflare site is the school picker, `index.html`, and an unknown path gets
`404.html` with status 404. After the schools are laid out in `site/`, `scripts/build-root.ts`
writes both: static pages with no script, which list each school on the list with its name, its
city, its form and the date of its campus snapshot, from its `meta.json` and the `picker.*` words
of `src/i18n/locales/en.json`. To make them on your machine after the same layout:
`node scripts/build-root.ts .github/schools.json site`. The root does not redirect.

A pull request from a branch of this repository also gets a preview on the same Pages project, at
`https://<branch>.<project>.pages.dev/uoa/` (the picker at `/`), once its checks pass; the pull request's "View
deployment" opens it, and each push updates it. A preview holds only the schools on `main`'s list,
built from the branch's code: a school that a branch adds is not online before the merge, and if
`main`'s list cannot be read, the preview fails. A pull request from a fork gets no preview, because
GitHub gives it no secrets.

## How it is put together

```text
scripts/            data pipeline (Node + TypeScript, run with tsx)
  lib/snapshot.ts     polite, cache-first fetcher
  lib/context.ts      the surroundings of each area, from OpenStreetMap (every school)
  lib/terrain.ts      the ground under each area, from the elevation tiles (every school)
  fetch-osm.ts, fetch-terrain.ts   the shared fetches, over the school's areas
  schools/uoa/        the University of Auckland's own fetch scripts (campus map, Calendar,
                      classes), its campus adapter (mapsindoors.ts) and its subject list
  build-data.ts       snapshots -> public/data/uoa/*.json
  check-pr-form.ts    CI: a pull request says how it was made
  school-list.ts      CI: reads and checks .github/schools.json, the schools the site holds
  walker/             the walker's controller, CLI and MCP server (npm run walker), and the
                      script that makes its figure
data/
  sources.json        provenance of every snapshot
  uoa/academic-calendar.json   hand-transcribed key dates
  raw/                snapshots (gitignored except OpenStreetMap and the elevation tiles)
public/data/uoa/    published data: campus, context, rooms-index, subjects, calendar, schedule, meta,
                    and plans/ with one floor-plan file per building
public/models/      the walker's figure (CC0)
src/shared/         pure logic shared by pipeline and app: geometry, room codes, Auckland time,
                    calendar, schedule, search
src/scene/          three.js scene
src/app/            state, URL, data loading, translations
src/ui/             Preact components and styles
src/i18n/locales/   interface text
tests/              unit tests (Vitest)
e2e/                browser tests (Playwright), numbered after the acceptance criteria
```

Accuracy is labelled wherever it matters. A room drawn with an outline comes from the campus map. A
room shown as a pin is known to the campus map by its code; the pin stands on the shape that the
floor plan draws for it, which is outlined. The shapes carry the campus map's type for each, in its
own words, and no code or name. A room that the map does not know is placed on a floor inferred from
its number and marked as inferred. A building's shape comes from the campus map's outline of each
floor, with floors that are alike within a twentieth of their area drawn as one block; its height is
an estimate of 3.6 m a floor, and its windows and roof rims are drawn by rule.

## Updating the data snapshot

Data is fetched once, cached as raw snapshots under `data/raw/`, and every later build reads the cache.
`data/sources.json` records the URL, fetch time, size and SHA-256 of each snapshot.

The campus map's snapshots are not in the repository (see below), so a fresh clone cannot run
`npm run data:build`, and a contributor does not fetch new ones: that would ask the University's map
for data the project already holds, and give a `public/data/uoa/` that differs from the published one.
The maintainer rebuilds the data. A pull request that needs a rebuild changes the pipeline's code and
says so in its first line (see [CONTRIBUTING.md](../CONTRIBUTING.md)).

```bash
npm run data:fetch                                          # fetches only what is missing
npx tsx scripts/schools/uoa/fetch-mapsindoors.ts --refresh  # re-download the campus map (4 requests)
npx tsx scripts/fetch-osm.ts --refresh                      # re-download OpenStreetMap context (1 request per area, 7)
npx tsx scripts/fetch-terrain.ts --refresh                  # re-download the elevation tiles (29 at zoom 14)
npx tsx scripts/schools/uoa/fetch-calendar.ts --refresh     # re-download the Calendar pages (3 requests)
npm run data:build                                          # rebuild public/data/uoa from the snapshots
npm test                                                    # the data consistency tests must still pass
```

Then commit `public/data/uoa/`, `data/sources.json` and, if refreshed, `data/raw/osm/` and
`data/raw/terrain/`.

Rules the fetch scripts follow, and that any new one should too (`scripts/lib/snapshot.ts` enforces
them): only public pages that need no login; at most one request per second; each URL fetched once and
cached; an honest User-Agent that links to this repository. Raw snapshots of University data stay out
of the repository (`data/raw/` is gitignored); OpenStreetMap data and the LINZ elevation tiles are
openly licensed and are committed.

When a new academic year starts, `data/uoa/academic-calendar.json` has to be re-transcribed by hand from
the University Calendar's key-dates page (the source URL is in the file).

## Adding the class timetable

The official source is the University's **Classes API v2**
(<https://developer.auckland.ac.nz/prd/documentation/api-classes-v2>). It returns, for each class, the
meeting patterns with day, start and end time, date range and room: exactly what this site needs. It
requires credentials that only someone with a University account can obtain, so this step is yours:

1. Get an **API key** for "Classes Api V2". Keys are not self-service: the Developer Portal dashboard
   (<https://developer.auckland.ac.nz/prd/dashboard>) sends you to the University's internal Athena
   tool, where the team that owns the API (the API document names Student Recruitment) approves the
   request. Say in the request that the class times will be republished on a public site.
   The portal's self-service OAuth credentials do not work for this API: a token is issued, but the
   class search still answers 401 (checked 2026-10-13).
2. Fetch and rebuild, with the key in the environment (never in a file that gets committed):

   ```bash
   UOA_API_KEY=... npx tsx scripts/schools/uoa/fetch-classes.ts
   npm run data:build
   npm test && npm run build
   ```

3. Commit `public/data/uoa/` and push. Rooms then show what is timetabled at the selected time, buildings
   show a count of classes in progress, and courses become searchable.

> [!WARNING]
> `scripts/schools/uoa/fetch-classes.ts` was written from the published OpenAPI document and has **not** been run
> against the live API (the project was built without a key), so the key header (`apikey`, which the
> API document does not spell out) or the paging parameters may need a small adjustment on first use.
> The part that turns API records into the published timetable (`scripts/lib/classes.ts`) is
> unit-tested, and the interface is tested end to end with a fixture timetable that exists only inside
> the test browser.

What the pipeline keeps for every class: course code and title, class type and section, day, times,
date range, the original location text, and how precisely it could be located (room, floor or
building). Records it cannot use are kept in an `exclusions` list with the reason. Staff names are
never read or published.

## Adding a language

1. Copy `src/i18n/locales/en.json` to `src/i18n/locales/<code>.json` (for example `mi.json`,
   `zh.json`).
2. Translate the values. Keep the keys and the `{placeholders}`. Set `_meta.name` to the language's own
   name; that is what the language menu shows.
3. That is all. The file is picked up automatically, the language appears in a menu in the top bar, and
   `?lang=<code>` selects it. Missing keys fall back to English.

Names in the data are language-keyed too (`"name": { "en": "…" }`), so a translation of a building or
term name is one more key next to `en` (the calendar already carries a few `mi` names). The pipeline
writes only `en` today because that is all the sources provide.

`npm test` checks that every key used in the code exists in `en.json` and that components contain no
hard-coded interface text.
