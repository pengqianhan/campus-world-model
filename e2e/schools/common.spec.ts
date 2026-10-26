// Every school's acceptance but the University of Auckland's (docs/schools/DESIGN.md, section 8):
// run with SCHOOL=<id>, which serves the school's own build at /<id>/. The tests read what to
// expect from the school's own files: its published data (data/meta.json, data/campus.json, from
// the page's own address) and its words (src/schools/<id>/locales/en.json).
import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import type { Building, CampusData, Layer, Meta } from "../../src/shared/types.ts";
import { expectRealRender, open, openStrip, shot } from "../helpers.ts";

const SCHOOL = process.env.SCHOOL || "uoa";
const DAY = "?light=day&time=preview&date=2026-03-20&t=15:00";

/** The school's words, src/schools/<id>/locales/en.json. */
const words = JSON.parse(fs.readFileSync(`src/schools/${SCHOOL}/locales/en.json`, "utf8")) as {
  app: { title: string; documentTitle: string };
  about: { unofficial: string; limits: Record<string, string> };
};

/** The limit in About that says why each layer is absent (src/ui/AboutPanel.tsx). */
const LIMIT: Partial<Record<Layer, string>> = { indoor: "rooms", timetable: "timetable", calendar: "calendar", subjects: "subjects" };

async function published<T>(page: Page, file: string): Promise<T> {
  return page.evaluate((f) => fetch(`data/${f}`).then((r) => r.json()), file) as Promise<T>;
}

const code = (b: Building) => b.ref ?? b.id;

test.beforeEach(() => {
  test.skip(SCHOOL === "uoa", "the University of Auckland has its own specs");
});

test(`${SCHOOL}: the page loads at /${SCHOOL}/ and the canvas is a real picture`, async ({ page }) => {
  await open(page, DAY);
  expect(new URL(page.url()).pathname).toBe(`/${SCHOOL}/`);
  await expect(page).toHaveTitle(words.app.documentTitle);
  await expect(page.locator(".brand-name")).toHaveText(words.app.title);
  await expectRealRender(page, 12);
  await shot(page, `schools-${SCHOOL}-day`);
});

test(`${SCHOOL}: the main buildings carry labels with their codes`, async ({ page }) => {
  await open(page, DAY);
  const campus = await published<CampusData>(page, "campus.json");
  const onMap = campus.buildings.filter((b) => !b.offMap);
  // The labels laid out on screen ("on"), by the code each shows first.
  const labels = await page.locator(".lbl-building.on").evaluateAll((els) => els.map((el) => el.querySelector("b")?.textContent ?? ""));
  const labelled = onMap.filter((b) => labels.includes(code(b)));
  // Labels give way to each other where they would overlap, so not every one shows at once.
  expect(labelled.length, `labelled: ${labelled.map(code).join(", ")}`).toBeGreaterThan(onMap.length / 2);
  // The tallest buildings stand above the rest, so their labels show.
  for (const b of [...onMap].sort((a, z) => z.height - a.height).slice(0, 3)) expect(labelled.map(code), `${code(b)}`).toContain(code(b));
});

test(`${SCHOOL}: About has the unofficial notice with the school's full name, and every source with its link and snapshot date`, async ({ page }) => {
  await open(page, `${DAY}&panel=about`);
  const about = page.locator(".about-panel");
  const notice = about.locator("#unofficial-notice");
  await expect(notice).toContainText(words.about.unofficial);
  // The school's full name, in the words that say the site is not the school's.
  expect(words.about.unofficial).toMatch(/not affiliated with, endorsed by or maintained by [A-Z][\w ]+[a-z]/);
  const meta = await published<Meta>(page, "meta.json");
  const sources = about.locator("#data-sources > li");
  await expect(sources).toHaveCount(meta.sources.length);
  for (const [k, s] of meta.sources.entries()) {
    await expect(sources.nth(k).locator("a")).toHaveAttribute("href", s.url);
    await expect(sources.nth(k).locator("a")).toHaveText(s.name);
    await expect(sources.nth(k).locator("time")).toHaveAttribute("datetime", s.snapshotDate);
    await expect(sources.nth(k)).toContainText(s.licence);
  }
  await expect(about.locator("#osm-attribution a")).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
  await shot(page, `schools-${SCHOOL}-about`);
});

test(`${SCHOOL}: each absent layer says why, in About, the status strip and the time panel`, async ({ page }) => {
  await open(page, DAY);
  const meta = await published<Meta>(page, "meta.json");
  const absent = (Object.entries(meta.layers ?? {}) as [Layer, string][]).filter(([, v]) => v !== "usable").map(([l]) => l);
  test.skip(absent.length === 0, "every layer is usable");

  await openStrip(page);
  const strip = page.locator("#status-absent");
  await expect(strip).toBeVisible();
  for (const layer of absent) await expect(strip).toContainText(["floors and rooms", "class times", "semester dates", "the course list"][["indoor", "timetable", "calendar", "subjects"].indexOf(layer)]!);
  await expect(strip.getByRole("button", { name: "Why?" })).toBeVisible();

  await page.getByRole("button", { name: "About", exact: true }).click();
  for (const layer of absent) {
    const key = LIMIT[layer];
    if (!key) continue;
    await expect(page.locator(`#limitations li[data-layer="${layer}"]`)).toHaveText(words.about.limits[key]!);
  }
  await page.keyboard.press("Escape");

  if (absent.includes("calendar")) {
    await page.locator(".topbar .chip").click();
    await expect(page.locator("#no-calendar-note")).toHaveText(words.about.limits.calendar!);
    await expect(page.locator(".time-panel .status-line")).toHaveText("No semester dates are shown");
    // No term, break or teaching day is named, and none is offered.
    await expect(page.locator("#preview-teaching-day")).toHaveCount(0);
    await shot(page, `schools-${SCHOOL}-time`);
  }
});

test(`${SCHOOL}: a building opens on its card, framed, with how its height was found and its source`, async ({ page }) => {
  await open(page, DAY);
  const campus = await published<CampusData>(page, "campus.json");
  const meta = await published<Meta>(page, "meta.json");
  const b = [...campus.buildings].filter((x) => !x.offMap).sort((a, z) => z.height - a.height)[0]!;
  await open(page, `${DAY}&building=${encodeURIComponent(b.id)}`);
  const bar = page.locator("#building-bar");
  await expect(bar.locator(".building-id b")).toHaveText(code(b));
  await expect(bar).toContainText(b.name.en);
  if (b.floors.length === 0) {
    await expect(page.locator(".floors")).toHaveCount(0);
    await expect(bar).toContainText(`${b.height} m high`);
    await expect(page.locator("#height-note")).toContainText({ "floor-count": "floors", "osm-height": "height tag", "osm-levels": "number of levels", estimated: "Height estimated" }[b.heightSource]);
  }
  if (b.osm) await expect(page.locator("#building-source a")).toHaveAttribute("href", `https://www.openstreetmap.org/${b.osm}`);
  if (meta.layers?.indoor && meta.layers.indoor !== "usable") await expect(page.locator("#no-indoor-note")).toHaveText(words.about.limits.rooms!);
  await shot(page, `schools-${SCHOOL}-building`);
  // Framed: the building stands on screen, closer than in the campus view.
  const point = await page.evaluate((id) => window.__scene!.screenPoint("building", id), b.id);
  expect(point, "a point of the building on screen").toBeDefined();
  const zoom = (await page.evaluate(() => window.__scene!.cameraState())).zoom;
  await open(page, DAY);
  expect(zoom).toBeGreaterThan((await page.evaluate(() => window.__scene!.cameraState())).zoom);
});

test(`${SCHOOL}: search finds a building by its name and by its code`, async ({ page }) => {
  await open(page, DAY);
  const campus = await published<CampusData>(page, "campus.json");
  const b = campus.buildings.find((x) => !x.offMap && x.name.en !== code(x) && !x.name.en.startsWith(code(x)))!;
  await page.locator("#search-button").click();
  const input = page.locator("#search-input");
  for (const query of [b.name.en, code(b)]) {
    await input.fill(query);
    await expect(page.locator(".results li.type-building", { hasText: b.name.en }).first(), query).toBeVisible();
  }
  await page.locator(".results li.type-building", { hasText: b.name.en }).first().locator("button.result-main").click();
  await expect(page).toHaveURL(new RegExp(`[?&]building=${encodeURIComponent(b.id)}(&|$)`));
  await expect(page.locator("#building-bar .building-id b")).toHaveText(code(b));
});

test(`${SCHOOL}: ?lang= falls back to English, in the school's words`, async ({ page }) => {
  await open(page, "?lang=zz");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".brand-name")).toHaveText(words.app.title);
  await expect(page).toHaveTitle(words.app.documentTitle);
});

test(`${SCHOOL}: on a phone the top bar holds the name, the source link, About, Search and the time side by side, down to 360 px`, async ({ page }) => {
  const campus = { buildings: [] as Building[] };
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 780 });
    await open(page, "?light=day");
    if (!campus.buildings.length) campus.buildings = (await published<CampusData>(page, "campus.json")).buildings;
    const b = campus.buildings.find((x) => !x.offMap)!;
    for (const query of ["?light=day", `?light=day&building=${encodeURIComponent(b.id)}`]) {
      await open(page, query);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const boxes = await page.locator(".topbar > *:not(.topbar-spacer)").evaluateAll((els) =>
        els
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.width > 0)
          .map((r) => ({ left: r.left, right: r.right, width: r.width })),
      );
      expect(boxes.length).toBe(5);
      expect(boxes[0]!.left).toBeGreaterThanOrEqual(0);
      expect(boxes.at(-1)!.right, `${width} px, ${query}`).toBeLessThanOrEqual(width);
      for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.left, `${width} px, ${query}, item ${i}`).toBeGreaterThanOrEqual(boxes[i - 1]!.right);
      for (const box of boxes) expect(box.width).toBeGreaterThanOrEqual(36);
    }
  }
  await open(page, "?light=day");
  await shot(page, `schools-${SCHOOL}-phone-360`);
});
