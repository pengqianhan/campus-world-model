// A landmark: a building drawn in detail from code (landmarks/), in place of its blocks where the
// camera comes near it. The Clock Tower draws building 105 and its south range, 105S. The site finds
// every landmark whose landmarks/<name>/placement.json says `site: true`; each is tested at the end.
// A measured massing (landmarks/MASSING.md) is drawn the same way from its data file in
// landmarks/measured/buildings/; the site finds them all, and a few are tested at the end.
import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { expectRealRender, open, params, settle, shot } from "./helpers.ts";

const T = "light=day&time=preview&date=2026-03-20&t=15:00";
const landmark = (page: Page, name: string) => page.evaluate((name) => window.__scene!.landmarkState().find((l) => l.name === name)!, name);
const clockTower = (page: Page) => landmark(page, "clocktower");

/** The landmarks on the site, as their folders say: name, the buildings they draw, and where they stand. */
const ON_SITE = fs
  .readdirSync("landmarks", { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(`landmarks/${d.name}/placement.json`))
  .map((d) => ({ name: d.name, placement: JSON.parse(fs.readFileSync(`landmarks/${d.name}/placement.json`, "utf8")) }))
  .filter((l) => l.placement.site === true)
  .map(({ name, placement: p }) => ({ name, buildings: [p.building, ...(p.also ?? [])] as string[], centre: p.centre as [number, number] }))
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

/** The measured massings, as their data files say: one building each, and where it stands. */
const MEASURED = fs
  .readdirSync("landmarks/measured/buildings")
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(`landmarks/measured/buildings/${f}`, "utf8")).place as { building: string; centre: [number, number] })
  .map((p) => ({ name: `measured/${p.building}`, buildings: [p.building], centre: p.centre }))
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
/** The measured massings tested one by one: the first three. */
const MEASURED_TESTED = MEASURED.slice(0, 3);

test("near it, the map draws the Clock Tower from code in its own colours, in place of its blocks, which still open on their floors", async ({ page }) => {
  await open(page, `?${T}`);
  // From the campus view its blocks are drawn as before, and the landmark is not even made.
  expect(await clockTower(page)).toMatchObject({ buildings: ["105", "105S"], form: "none", made: [] });

  // Near it: the next frame asks for it, and it stands in place of its blocks once it is made.
  await page.evaluate(() => window.__scene!.showCampus([30.96, 229.14], 160, false));
  await expect.poll(async () => (await clockTower(page)).form).toBe("light");
  await settle(page);
  expect(await clockTower(page)).toMatchObject({ form: "light", made: ["light"] });
  await expectRealRender(page);
  await shot(page, "30-landmark-map");

  // The pointer on the Clock Tower lights its part only, as it lights a block.
  const before = (await clockTower(page)).walls;
  const at = (await page.evaluate(() => window.__scene!.screenPoint("building", "105")))!;
  await page.mouse.move(at.x, at.y);
  await expect.poll(async () => (await clockTower(page)).walls["105"]).not.toBe(before["105"]);
  expect((await clockTower(page)).walls["105S"]).toBe(before["105S"]);

  // A click finds the block and opens the building on its floors; the landmark gives way to them.
  await page.mouse.click(at.x, at.y);
  await expect(page.locator("#building-bar")).toContainText("The Clock Tower");
  await settle(page);
  expect((await clockTower(page)).form).toBe("none");
  await expect(page.locator(".floors")).toBeVisible();
  await expect(page.locator("#height-note")).toContainText("measured by LiDAR");

  // Any other building says that its height is estimated.
  await open(page, `?building=303&${T}`);
  await expect(page.locator("#height-note")).toContainText("estimated from the number of floors");

  // About names the buildings drawn in detail, and credits the LiDAR as LINZ asks: its licensor, the
  // licence, and a link to LINZ's page on attributing elevation data.
  await page.getByRole("button", { name: "About", exact: true }).click();
  await expect(page.locator("#landmarks")).toContainText("105 The Clock Tower");
  await expect(page.locator("#landmarks")).toContainText("licensed by Regional Software Holdings Limited");
  await expect(page.locator("#landmarks")).toContainText("Creative Commons Attribution 4.0");
  await expect(page.locator("#landmark-links a").nth(1)).toHaveAttribute("href", /linz\.govt\.nz\/.*attributing-elevation/);
});

test("from a walker's height the Clock Tower is drawn in its own stone on a graphics card, and in the map's colours in software", async ({ page }) => {
  // On Princes Street, in front of it.
  await open(page, `?walk=-12,214&view=eyes&${T}`);
  await page.waitForFunction(() => (window as unknown as { __walker?: { ready(): boolean } }).__walker?.ready(), undefined, { timeout: 30_000 });
  await page.waitForFunction(() => window.__scene!.streetState().sky, undefined, { timeout: 30_000 });
  const { tier } = await page.evaluate(() => window.__scene!.streetState());
  await expect.poll(async () => (await clockTower(page)).form).toBe(tier === "full" ? "full" : "light");
  // Up at the tower.
  await page.evaluate(async () => {
    const walker = (window as unknown as { __walker: { run(c: string): Promise<{ walkers: { heading: number }[] }> } }).__walker;
    const { heading } = (await walker.run("list")).walkers[0]!;
    window.__scene!.setWalkerLook(75 - heading, 12);
  });
  await page.waitForTimeout(400);
  await expectRealRender(page);
  await shot(page, "30-landmark-eyes");
});

test("the site finds every landmark whose folder puts it on the site, and every measured massing, and no other", async ({ page }) => {
  expect(ON_SITE.map((l) => l.name)).toContain("clocktower");
  expect(MEASURED.length).toBeGreaterThan(0);
  await open(page, `?${T}`);
  const found = await page.evaluate(() => window.__scene!.landmarkState().map((l) => ({ name: l.name, buildings: l.buildings })));
  expect(found).toEqual([...ON_SITE, ...MEASURED].map(({ name, buildings }) => ({ name, buildings })));
});

test("a measured massing is drawn only nearer than a landmark, in its block's colours, and gives way while a building is open", async ({ page }) => {
  const { name, buildings, centre } = MEASURED[0]!;
  await open(page, `?${T}`);
  // 500 m across: near enough for a landmark, not for a measured massing.
  await page.evaluate((c) => window.__scene!.showCampus(c, 500, false), centre);
  await settle(page);
  expect(await landmark(page, name)).toMatchObject({ form: "none", made: [] });
  await page.evaluate((c) => window.__scene!.showCampus(c, 160, false), centre);
  await expect.poll(async () => (await landmark(page, name)).form).toBe("light");
  await settle(page);
  // Its walls are its block's own: the pointer on it lights them as it lights a block.
  const before = (await landmark(page, name)).walls[buildings[0]!];
  const at = (await page.evaluate((id) => window.__scene!.screenPoint("building", id), buildings[0]!))!;
  await page.mouse.move(at.x, at.y);
  await expect.poll(async () => (await landmark(page, name)).walls[buildings[0]!]).not.toBe(before);
  await shot(page, "31-measured-map");
});

test("while a building is open, a measured massing near it gives way to its block", async ({ page }) => {
  // Building 409 stands beside 405; 405 open is one of the views that must not change.
  test.skip(!MEASURED.some((m) => m.name === "measured/409"), "409 is not a measured massing");
  await open(page, `?building=405&${T}`);
  expect(await landmark(page, "measured/409")).toMatchObject({ form: "none", made: [] });
});

test("from a walker's height a measured massing takes the facades drawn by rule", async ({ page }) => {
  const { name, centre } = MEASURED[0]!;
  await open(page, `?walk=${centre[0] - 25},${centre[1] - 25}&view=eyes&${T}`);
  await page.waitForFunction(() => (window as unknown as { __walker?: { ready(): boolean } }).__walker?.ready(), undefined, { timeout: 30_000 });
  await page.waitForFunction(() => window.__scene!.streetState().sky, undefined, { timeout: 30_000 });
  // One form only, in its block's materials, on either tier.
  await expect.poll(async () => (await landmark(page, name)).form, { timeout: 30_000 }).toBe("light");
  // Facing it: it stands to the north-east, 35 m off.
  await page.evaluate(async () => {
    const walker = (window as unknown as { __walker: { run(c: string): Promise<{ walkers: { heading: number }[] }> } }).__walker;
    const { heading } = (await walker.run("list")).walkers[0]!;
    window.__scene!.setWalkerLook(45 - heading, 8);
  });
  await page.waitForTimeout(400);
  await expectRealRender(page);
  await shot(page, "31-measured-eyes");
});

for (const { name, buildings, centre } of [...ON_SITE, ...MEASURED_TESTED]) {
  test(`near ${name}, the map draws it in its light form in place of its blocks, and a click opens its building`, async ({ page }) => {
    await open(page, `?${T}`);
    // From the campus view its blocks are drawn, and it is not even made.
    expect(await landmark(page, name)).toMatchObject({ buildings, form: "none", made: [] });
    await page.evaluate((c) => window.__scene!.showCampus(c, 160, false), centre);
    await expect.poll(async () => (await landmark(page, name)).form).toBe("light");
    await settle(page);
    expect(await landmark(page, name)).toMatchObject({ form: "light", made: ["light"] });
    await expectRealRender(page);
    // A click on it finds its block and opens the building on its floors; the landmark gives way.
    const at = (await page.evaluate((id) => window.__scene!.screenPoint("building", id), buildings[0]!))!;
    expect(at, `${buildings[0]} on screen`).toBeDefined();
    await page.mouse.click(at.x, at.y);
    await expect.poll(() => params(page).get("building")).toBe(buildings[0]);
    await expect(page.locator("#building-bar")).toBeVisible();
    await settle(page);
    expect((await landmark(page, name)).form).toBe("none");
    await expect(page.locator(".floors")).toBeVisible();
    await expect(page.locator("#height-note")).toContainText("measured by LiDAR");
    if (name.startsWith("measured/")) {
      await expect(page.locator("#height-note")).toContainText("walls and windows drawn by rule");
      await page.getByRole("button", { name: "About", exact: true }).click();
      await expect(page.locator("#measured")).toContainText(buildings[0]!);
    }
  });
}
