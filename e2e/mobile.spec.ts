// Criterion 6: on a 390 px wide phone the campus is visible and search leads to building and room details.
import { expect, test, type Page } from "@playwright/test";
import { expectRealRender, open, openRoot, params, settle, shot } from "./helpers.ts";

test("6. phone: search for a room and see the building and class information", async ({ page }) => {
  await open(page, "?light=day");
  expect(page.viewportSize()?.width).toBe(390);
  await expectRealRender(page);
  // Nothing may overflow the viewport horizontally.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.locator(".brand-name")).toBeVisible();
  // The campus panel waits as a button, so the campus has the screen.
  await expect(page.locator("#status-toggle")).toBeVisible();
  await expect(page.locator("#status-strip")).toBeHidden();
  await shot(page, "06-mobile-campus");

  await page.locator("#search-button").tap();
  const input = page.locator("#search-input");
  await input.fill("260-098");
  await shot(page, "06-mobile-search");
  await page.locator(".result-main").first().tap();
  await settle(page);

  expect(params(page).get("room")).toBe("260-098");
  await expect(page.locator(".search-panel")).toHaveCount(0);
  const bar = page.locator("#building-bar");
  await expect(bar).toBeVisible();
  await expect(bar).toContainText("260");
  await expect(bar).toContainText("Sir Owen G Glenn Building");
  const card = page.locator("#room-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText("260-098");
  await expect(card).toContainText("Floor 0");
  await expect(card.locator("#no-timetable")).toBeVisible();
  // The floor strip is usable on a phone.
  await expect(page.locator(".floor.on")).toHaveAttribute("data-floor", "0");
  await expectRealRender(page);
  await shot(page, "06-mobile-room");

  await page.locator('.floor[data-floor="1"]').tap();
  await settle(page);
  expect(params(page).get("floor")).toBe("1");
  // The open floor fills most of the phone's width, between the floor strip and the building bar.
  const box = (await page.evaluate(() => window.__scene!.openFloorBox()))!;
  expect(box.right - box.left).toBeGreaterThan(390 * 0.6);
  const strip = (await page.locator(".floors").boundingBox())!;
  const dock = (await bar.boundingBox())!;
  expect(box.top).toBeGreaterThan(strip.y + strip.height - 10);
  expect(box.bottom).toBeLessThan(dock.y + 10);
  await shot(page, "06-mobile-floor");
  // Every floor of a tall building must be reachable by scrolling the strip, not just the first few.
  const top = page.locator('.floor[data-floor="7"]');
  await top.scrollIntoViewIfNeeded();
  await expect(top).toBeInViewport();
  await top.tap();
  await settle(page);
  expect(params(page).get("floor")).toBe("7");
  await expect(page.locator(".floor.on")).toBeInViewport();

  // Building search works too.
  await page.locator("#search-button").tap();
  await input.fill("engineering");
  await expect(page.locator(".result-main").first()).toContainText("Engineering");
  await page.locator(".result-main").first().tap();
  await settle(page);
  await expect(bar).toContainText("Engineering");

  // About is reachable and readable: on the page at the site's root since 2026-11-10, from its bar.
  // The page shows the schools and, under them, the Tsinghua World Model's card; About is hidden until asked for.
  await openRoot(page);
  await expect(page.locator("#about")).toBeHidden();
  await expect(page.locator("#inspired-by")).toBeVisible();
  await page.locator("#about-link").tap();
  await expect(page.locator("#about")).toBeInViewport();
  await expect(page.locator("#about-uoa .unofficial")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await shot(page, "06-mobile-about");
  // Close hides it again.
  await page.locator("#about-close").tap();
  await expect(page.locator("#about")).toBeHidden();
});

test("phone: a tap on an unnamed space says its type on the campus map, inside the screen, and selects nothing", async ({ page }) => {
  await open(page, "?building=405&floor=8&light=day");
  const pt = (await page.evaluate(() => window.__scene!.planPoint()))!;
  const type = (await page.evaluate(({ x, y }) => window.__scene!.spaceAt(x, y), pt))!;
  await page.touchscreen.tap(pt.x, pt.y);
  const tip = page.locator("#space-tip");
  await expect(tip).toContainText(`Campus map type: ${type.text}`);
  await expect(tip).toBeInViewport({ ratio: 1 });
  expect(params(page).get("room")).toBeNull();
  expect(params(page).get("building")).toBe("405");
  await shot(page, "06-mobile-space");
  // Another floor takes the tip away with the shapes.
  await page.locator('.floor[data-floor="7"]').tap();
  await settle(page);
  await expect(tip).toHaveCount(0);
});

test("phone: the top bar holds the site name, the source link, Search and the time side by side, down to a 360 px screen", async ({ page }) => {
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 780 });
    for (const query of ["?light=day", "?light=day&building=260"]) {
      await open(page, query);
      await expect(page.locator("#repo-link")).toBeVisible();
      const boxes = await page.locator(".topbar > *:not(.topbar-spacer)").evaluateAll((els) =>
        els
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.width > 0)
          .map((r) => ({ left: r.left, right: r.right, width: r.width })),
      );
      expect(boxes.length).toBe(4);
      expect(boxes[0]!.left).toBeGreaterThanOrEqual(0);
      expect(boxes.at(-1)!.right, `${width} px, ${query}`).toBeLessThanOrEqual(width);
      for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.left, `${width} px, ${query}, item ${i}`).toBeGreaterThanOrEqual(boxes[i - 1]!.right);
      // Nothing is squeezed below a size a finger can hit.
      for (const b of boxes) expect(b.width).toBeGreaterThanOrEqual(36);
    }
  }
});

/**
 * Fingers on the screen through the browser itself, so that two can be down at once, as two thumbs
 * are. The browser lifts them all together: it has no way to lift one and leave the other down.
 */
async function fingers(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  const down = new Map<number, { x: number; y: number }>();
  const send = (type: "touchStart" | "touchMove" | "touchEnd") =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [...down].map(([id, p]) => ({ id, ...p })) });
  return {
    async down(id: number, x: number, y: number) {
      down.set(id, { x, y });
      await send("touchStart");
    },
    async move(id: number, x: number, y: number, steps = 1) {
      const from = down.get(id)!;
      for (let i = 1; i <= steps; i++) {
        down.set(id, { x: from.x + ((x - from.x) * i) / steps, y: from.y + ((y - from.y) * i) / steps });
        await send("touchMove");
        await page.waitForTimeout(30);
      }
    },
    async lift() {
      down.clear();
      await send("touchEnd");
    },
  };
}

async function walkerAt(page: Page): Promise<[number, number]> {
  const r = (await page.evaluate(() => window.__walker!.run("list"))) as { walkers: { at: [number, number] }[] };
  return r.walkers[0]!.at;
}

/** A look's turn from straight ahead, -180 to 180 degrees. */
const offAhead = (yaw: number) => ((((yaw + 180) % 360) + 360) % 360) - 180;

test("phone: a walk is steered with two thumbs, as in a game: a stick walks and turns the walker while the other thumb drags the view round", async ({ page }) => {
  // Some twenty touches and taps in a walker view, which CI draws in software at a frame a second
  // or less: about three minutes there, the whole of the usual time, so it gets three times that.
  test.slow();
  await open(page, "?light=day&time=preview&date=2026-03-20&t=15:00");
  await page.locator("#walk-start").click();
  await page.waitForFunction(() => window.__walker?.ready(), undefined, { timeout: 30_000 });
  // The walk has the screen, as in a game: the top bar steps aside for its panels in the corners.
  const panel = page.locator("#walker-panel");
  await expect(panel).toHaveClass(/touch/);
  await expect(page.locator(".topbar")).toHaveCount(0);
  // It starts from behind the walker.
  await expect(panel.locator('button[data-view="follow"]')).toHaveAttribute("aria-pressed", "true");
  // How it gets about, across the foot of the screen; the speed and the view under the top right.
  const rides = (await page.locator(".hud-rides").boundingBox())!;
  expect(rides.x).toBeGreaterThanOrEqual(0);
  expect(rides.x + rides.width).toBeLessThanOrEqual(390);
  expect(rides.y + rides.height).toBeGreaterThan(844 - 70);
  const toolbar = (await page.locator(".hud-toolbar").boundingBox())!;
  const cluster = (await page.locator(".hud-cluster").boundingBox())!;
  expect(cluster.y).toBeGreaterThanOrEqual(toolbar.y + toolbar.height);
  expect(cluster.y + cluster.height).toBeLessThan(844 * 0.3);
  await expect(page.locator("#walker-to")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await shot(page, "20-walker-phone-bar");
  // The stick in the bottom left corner, for the left thumb, above the ways of getting about.
  const stick = (await page.locator("#walker-stick").boundingBox())!;
  expect(stick.x).toBeLessThan(24);
  expect(stick.y).toBeGreaterThan(844 * 0.6);
  expect(stick.y + stick.height).toBeLessThanOrEqual(rides.y);

  // Two thumbs at once: the left pushes the stick forward while the right drags the view round.
  // Each step waits for what it does, not for a time: on CI's software renderer a frame of the
  // walker view takes a second or two, and the page handles a touch seconds after it was sent.
  const touch = await fingers(page);
  const from = await walkerAt(page);
  const walked = async () => {
    const at = await walkerAt(page);
    return Math.hypot(at[0] - from[0], at[1] - from[1]);
  };
  const look = async () => offAhead((await page.evaluate(() => window.__scene!.walkerLook())).yaw);
  const sx = stick.x + stick.width / 2;
  const sy = stick.y + stick.height / 2;
  await touch.down(1, sx, sy);
  await touch.move(1, sx, sy - stick.height / 2, 4);
  await touch.down(2, 300, 450);
  await touch.move(2, 180, 450, 6);
  let turned = 0;
  await expect.poll(async () => Math.abs((turned = await look())), { message: "the right thumb turns the view" }).toBeGreaterThan(15);
  await expect.poll(walked, { message: "the left thumb walks it meanwhile" }).toBeGreaterThan(1);
  await touch.lift();
  // Walked on again, the view comes back round behind the walker, as in a game.
  await touch.down(1, sx, sy);
  await touch.move(1, sx, sy - stick.height / 2, 4);
  await expect.poll(async () => Math.abs(await look()), { message: "the view comes round" }).toBeLessThan(Math.abs(turned) * 0.7);
  await touch.lift();
  await expectRealRender(page);
  await shot(page, "20-walker-phone");

  // Pushed to the side, the stick turns the walker on the spot. Half way, so that it turns slowly:
  // reads of its heading seconds apart cannot miss half a turn and read it the other way round.
  const heading = async () => ((await page.evaluate(() => window.__walker!.run("list"))) as { walkers: { heading: number }[] }).walkers[0]!.heading;
  const before = await heading();
  let turn = 0;
  await touch.down(1, sx, sy);
  await touch.move(1, sx + stick.width / 4, sy, 3);
  await expect.poll(async () => Math.abs((turn = offAhead((await heading()) - before))), { message: "the stick turns the walker" }).toBeGreaterThan(20);
  await touch.lift();
  expect(turn, "to the right, the way the stick was pushed").toBeGreaterThan(0);

  // The rest waits behind its button at the top right: a walk to a place, wandering, and how to steer.
  await page.locator("#walker-more").tap();
  await expect(page.locator("#walker-to")).toBeVisible();
  await expect(page.locator("#walker-menu")).toContainText("Push the stick");
  await shot(page, "20-walker-phone-menu");
  await page.locator("#walker-more").tap();
  await expect(page.locator("#walker-to")).toBeHidden();

  // Beside a building, the way in is under the right thumb.
  expect(((await page.evaluate(() => window.__walker!.run("walk", { to: "109", speed: 40 }))) as { arrived: boolean }).arrived).toBe(true);
  const enter = page.locator("#walker-enter");
  await expect(enter).toBeVisible();
  const e = (await enter.boundingBox())!;
  expect(e.x + e.width).toBeGreaterThan(390 - 30);
  expect(e.y).toBeGreaterThan(844 * 0.6);
  expect(e.y + e.height).toBeLessThanOrEqual(rides.y);
  await enter.tap();
  await expect.poll(() => params(page).get("building")).toBe("109");
  await settle(page);
  // Inside, the floor strip stays in sight below the top row and above the speed and the view, and
  // the thumbs' controls stand above the building's card.
  const floors = (await page.locator(".floors").boundingBox())!;
  expect(floors.y).toBeGreaterThanOrEqual(toolbar.y + toolbar.height);
  expect((await page.locator(".hud-cluster").boundingBox())!.y).toBeGreaterThanOrEqual(floors.y + floors.height);
  const dock = (await page.locator("#building-bar").boundingBox())!;
  const lifted = (await page.locator("#walker-stick").boundingBox())!;
  expect(lifted.y + lifted.height).toBeLessThanOrEqual(dock.y);
  for (const id of ["#walker-up", "#walker-down", "#walker-exit"]) {
    const b = (await page.locator(id).boundingBox())!;
    expect(b.y + b.height, id).toBeLessThanOrEqual(dock.y);
  }
  await expectRealRender(page);
  await shot(page, "20-walker-phone-inside");
});

test("phone on its side: the map keeps the screen, and a walk puts the stick under the left thumb, clear of the bar", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await open(page, "?light=day&time=preview&date=2026-03-20&t=15:00");
  await expect(page.locator("#status-strip")).toBeHidden();
  const toggle = (await page.locator("#status-toggle").boundingBox())!;
  expect(toggle.height).toBeLessThanOrEqual(44);
  expect(toggle.y + toggle.height).toBeGreaterThan(390 - 30);
  await shot(page, "06-mobile-landscape");

  await page.locator("#walk-start").click();
  await page.waitForFunction(() => window.__walker?.ready(), undefined, { timeout: 30_000 });
  const panel = page.locator("#walker-panel");
  await expect(panel).toHaveClass(/touch/);
  // The stick under the left thumb, clear of the sign above it and of the ways of getting about at
  // the foot; the speed and the view clear of the top row.
  const stick = (await page.locator("#walker-stick").boundingBox())!;
  const boxes = {
    sign: (await page.locator(".hud-sign").boundingBox())!,
    rides: (await page.locator(".hud-rides").boundingBox())!,
    cluster: (await page.locator(".hud-cluster").boundingBox())!,
    toolbar: (await page.locator(".hud-toolbar").boundingBox())!,
    brand: (await page.locator(".hud-brand").boundingBox())!,
  };
  const apart = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
    a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
  for (const [name, b] of Object.entries(boxes)) expect(apart(stick, b), `the stick and ${name}`).toBe(true);
  expect(apart(boxes.cluster, boxes.toolbar), "the speed and the top row").toBe(true);
  expect(apart(boxes.rides, boxes.cluster), "the ways of getting about and the speed").toBe(true);
  await shot(page, "20-walker-phone-landscape");
  expect(stick.x).toBeLessThan(30);
  expect(stick.y + stick.height).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(844);

  const touch = await fingers(page);
  const from = await walkerAt(page);
  const sx = stick.x + stick.width / 2;
  const sy = stick.y + stick.height / 2;
  await touch.down(1, sx, sy);
  await touch.move(1, sx, sy - stick.height / 2, 3);
  await page.waitForTimeout(900);
  await touch.lift();
  const to = await walkerAt(page);
  expect(Math.hypot(to[0] - from[0], to[1] - from[1])).toBeGreaterThan(1);
  await expectRealRender(page);
});

test("phone: flying, Up is held under the right thumb to climb, and Walk lands the drone", async ({ page }) => {
  // On the map, which CI draws faster: the buttons are the same in every view.
  await open(page, "?walk=1&ride=fly&light=day&time=preview&date=2026-03-20&t=15:00");
  await page.waitForFunction(() => window.__walker?.ready(), undefined, { timeout: 30_000 });
  const state = async () => ((await page.evaluate(() => window.__walker!.run("list"))) as { walkers: { ride: string; altitude?: number }[] }).walkers[0]!;
  await expect.poll(async () => (await state()).altitude ?? 0, { message: "the drone takes off" }).toBeGreaterThan(10);
  // Up and Down under the right thumb, above the ways of getting about.
  const up = (await page.locator("#walker-climb").boundingBox())!;
  const rides = (await page.locator(".hud-rides").boundingBox())!;
  await expect(page.locator("#walker-descend")).toBeVisible();
  expect(up.x + up.width).toBeGreaterThan(390 / 2);
  expect(up.y + up.height).toBeLessThanOrEqual(rides.y);
  // Held, Up climbs; let go, it stops.
  await expect.poll(async () => (await state()).altitude ?? 0).toBeLessThan(13);
  const before = (await state()).altitude!;
  const touch = await fingers(page);
  await touch.down(1, up.x + up.width / 2, up.y + up.height / 2);
  await expect.poll(async () => (await state()).altitude ?? 0, { message: "held, Up climbs" }).toBeGreaterThan(before + 3);
  await touch.lift();
  await shot(page, "20-walker-phone-drone");
  // Walk lands it, and the buttons go.
  await page.locator('#walker-panel [data-ride="walk"]').tap();
  await expect.poll(async () => (await state()).ride).toBe("walk");
  await expect(page.locator("#walker-climb")).toHaveCount(0);
});

test("phone on its side: in the passage under the Clock Tower East Wing's link, the view from behind still sees the walker", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await open(page, "?light=day&time=preview&date=2026-03-20&t=15:00");
  await page.locator("#walk-start").click();
  await page.waitForFunction(() => window.__walker?.ready(), undefined, { timeout: 30_000 });
  // OpenStreetMap's footway through the passage under 119's link, where the campus map has no ground
  // storey: the walk map lets a walker through, so the landmark must too. The default start faces it.
  expect(((await page.evaluate(() => window.__walker!.run("walk", { to: "45.2,204.3", speed: 40 }))) as { arrived: boolean }).arrived).toBe(true);
  await page.evaluate(() => window.__walker!.run("turn", { face: "60" }));
  await page.evaluate(() => window.__walker!.run("view", { view: "follow", yaw: 0, pitch: 0 }));
  await settle(page);
  await expectRealRender(page);
});
