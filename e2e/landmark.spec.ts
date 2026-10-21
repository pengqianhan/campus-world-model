// A landmark: a building drawn in detail from code (landmarks/), in place of its blocks where the
// camera comes near it. The Clock Tower draws building 105 and its south range, 105S.
import { expect, test, type Page } from "@playwright/test";
import { expectRealRender, open, settle, shot } from "./helpers.ts";

const T = "light=day&time=preview&date=2026-03-20&t=15:00";
const clockTower = (page: Page) => page.evaluate(() => window.__scene!.landmarkState()[0]!);

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
