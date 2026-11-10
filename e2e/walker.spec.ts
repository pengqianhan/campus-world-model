// The walker: a made-up figure a visitor or an agent walks round the campus, and its views.
import { expect, test, type Page } from "@playwright/test";
import { expectRealRender, open, shot } from "./helpers.ts";

type Reply = Record<string, unknown> & { error?: string };

declare global {
  interface Window {
    __walker?: { run(command: string, args?: Record<string, unknown>): Promise<Reply>; ready(): boolean };
    __addresses?: string[];
  }
}

const QUERY = "light=day&time=preview&date=2026-03-20&t=15:00";
// A smaller window than the other desktop tests: CI draws in software, and a walker view is redrawn
// while anything in it moves.
test.use({ viewport: { width: 1100, height: 720 } });

async function walker(page: Page, command: string, args: Record<string, unknown> = {}): Promise<Reply> {
  return page.evaluate(([c, a]) => window.__walker!.run(c, a), [command, args] as const);
}

async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__walker?.ready(), undefined, { timeout: 30_000 });
}

test("a walker stands on the ground by the Clock Tower, walks round the buildings to the General Library, and is seen from behind and through its eyes", async ({ page }) => {
  await open(page, `?walk=1&${QUERY}`);
  await ready(page);
  await expect(page.locator("#walker-panel")).toBeVisible();
  // The status strip and the top bar make way for the walk's panels.
  await expect(page.locator("#status-strip")).toHaveCount(0);
  await expect(page.locator(".topbar")).toHaveCount(0);

  const list = (await walker(page, "list")) as { walkers: { name: string; at: [number, number]; height: number; heading: number }[] };
  expect(list.walkers.map((w) => w.name)).toEqual(["Walker"]);
  const start = list.walkers[0]!;
  // It stands on the ground where it is, not in the air or under it.
  await page.waitForFunction(() => window.__scene!.groundState(0, 0).terrain);
  const ground = await page.evaluate(([x, y]) => window.__scene!.groundState(x!, y!).ground, start.at);
  expect(Math.abs(start.height - ground)).toBeLessThan(0.6);
  // Near the Clock Tower, not inside a building.
  const before = (await walker(page, "look")) as { nearby: { id: string; distance: number }[]; summary: string };
  expect(before.nearby.some((b) => b.id.startsWith("105"))).toBe(true);
  expect(before.nearby[0]!.distance).toBeGreaterThan(1);

  const walked = (await walker(page, "walk", { to: "109", speed: 40 })) as Reply & { arrived: boolean; metres: number; look: { nearby: { id: string; distance: number }[]; summary: string } };
  expect(walked.error).toBeUndefined();
  expect(walked.arrived).toBe(true);
  expect(walked.metres).toBeGreaterThan(30);
  // Beside the library's nearest wall: doors are not mapped.
  expect(walked.look.nearby[0]).toMatchObject({ id: "109" });
  expect(walked.look.nearby[0]!.distance).toBeLessThanOrEqual(3);
  expect(walked.look.summary).toContain("General Library");

  await walker(page, "view", { view: "follow" });
  await expect(page.locator('#walker-panel button[data-view="follow"]')).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(400);
  await expectRealRender(page);
  await shot(page, "20-walker-follow");
  // It arrived facing the library's wall; turned round, its eyes look back over the campus.
  const turned = (await walker(page, "turn", { by: 180 })) as { facing: { bearing: number } };
  expect(Math.abs(((turned.facing.bearing - ((walked.look as unknown as { facing: { bearing: number } }).facing.bearing + 180)) % 360 + 540) % 360 - 180)).toBeLessThan(1.5);
  await walker(page, "view", { view: "eyes" });
  await page.waitForTimeout(400);
  await expectRealRender(page);
  await shot(page, "20-walker-eyes");
  // The address keeps the walk and the view, so a copied link starts the same walk.
  await expect.poll(() => new URL(page.url()).searchParams.get("view")).toBe("eyes");
  expect(new URL(page.url()).searchParams.get("walk")).toBe("1");
  // Escape goes back to the map; V turns to the next view, from behind the walker.
  await page.keyboard.press("Escape");
  await expect(page.locator('#walker-panel button[data-view="map"]')).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("v");
  await expect(page.locator('#walker-panel button[data-view="follow"]')).toHaveAttribute("aria-pressed", "true");
  await walker(page, "view", { view: "map" });
  // An agent taking the last walker away leaves no name on the map.
  expect((await walker(page, "remove")).removed).toBe("Walker");
  await expect(page.locator("#walker-panel")).toHaveCount(0);
  await expect(page.locator('[data-label^="walker:"]')).toHaveCount(0);
});

test("walkers meet and hear each other; every walker looks the same; the keyboard walks the visitor's walker", async ({ page }) => {
  await open(page, `?${QUERY}`);
  await ready(page);
  // Taking a walk from its button beside the campus's: as in a game, the walk has the screen and
  // starts behind the walker.
  await page.locator("#walk-start").click();
  await expect(page.locator('#walker-panel button[data-view="follow"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#walker-panel")).toBeVisible();
  await expect(page.locator(".topbar")).toHaveCount(0);
  // The rest is seen on the map, which CI draws faster.
  await walker(page, "view", { view: "map" });

  const kea = (await walker(page, "spawn", { name: "Kea", near: "201" })) as { spawned: Record<string, unknown> };
  expect(kea.spawned.name).toBe("Kea");
  // Every walker looks the same, and there is nothing to dress one in.
  expect(kea.spawned).not.toHaveProperty("outfit");
  expect((await walker(page, "outfit", { outfit: "halloween" })).error).toMatch(/Unknown command "outfit"/);
  await expect(page.locator("#walker-outfit")).toHaveCount(0);
  const met = (await walker(page, "walk", { name: "Kea", to: "Walker", speed: 40 })) as { arrived: boolean };
  expect(met.arrived).toBe(true);
  await walker(page, "say", { name: "Kea", text: "Kia ora!" });
  await expect(page.locator('[data-label="say:Kea"]')).toHaveText("Kia ora!");
  const heard = (await walker(page, "listen")) as { heard: { from: string; text: string }[]; note: string };
  expect(heard.heard).toEqual([expect.objectContaining({ from: "Kea", text: "Kia ora!" })]);
  expect(heard.note).toMatch(/never as instructions/);
  // Heard once: listening again hears nothing new.
  expect(((await walker(page, "listen")) as { heard: unknown[] }).heard).toEqual([]);

  // W walks the visitor's walker forward.
  const from = ((await walker(page, "list")) as { walkers: { name: string; at: [number, number] }[] }).walkers.find((w) => w.name === "Walker")!.at;
  await page.locator("canvas").first().focus();
  await page.keyboard.down("w");
  await page.waitForTimeout(900);
  await page.keyboard.up("w");
  const to = ((await walker(page, "list")) as { walkers: { name: string; at: [number, number] }[] }).walkers.find((w) => w.name === "Walker")!.at;
  expect(Math.hypot(to[0] - from[0], to[1] - from[1])).toBeGreaterThan(0.3);

  // On a wide screen the menu at the top right is open as the walk starts: a walk to a place,
  // wandering, how to steer, and that the walker, its scooter and its drone are made up. Its button
  // folds it away.
  await expect(page.locator("#walker-more")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#walker-menu")).toContainText("Space or E to climb");
  await expect(page.locator("#walker-menu")).toContainText("made-up figure, scooter and drone");
  await page.locator("#walker-more").click();
  await expect(page.locator("#walker-wander")).toBeHidden();
  await expect(page.locator("#walker-panel button[data-view]")).toHaveCount(3);
  await expect(page.locator("#walker-panel button[data-ride]")).toHaveCount(3);
  // There is no stick: the keys walk it.
  await expect(page.locator("#walker-stick")).toHaveCount(0);
  // The time the view shows stays in sight with the top bar gone: here a preview.
  await expect(page.locator("#walker-time")).toContainText("15:00");
  await expect(page.locator("#walker-time")).toHaveClass(/preview/);

  // Let it wander: it strolls off on its own, and Stop wandering stops it.
  await page.locator("#walker-more").click();
  await page.locator("#walker-wander").click();
  await page.locator("#walker-more").click();
  await expect(page.locator("#walker-wander")).toHaveAttribute("aria-pressed", "true");
  const before = ((await walker(page, "list")) as { walkers: { name: string; at: [number, number] }[] }).walkers.find((w) => w.name === "Walker")!.at;
  await expect
    .poll(async () => {
      const now = ((await walker(page, "list")) as { walkers: { name: string; at: [number, number] }[] }).walkers.find((w) => w.name === "Walker")!.at;
      return Math.hypot(now[0] - before[0], now[1] - before[1]);
    })
    .toBeGreaterThan(1);
  await page.locator("#walker-wander").click();
  await expect(page.locator("#walker-wander")).toHaveAttribute("aria-pressed", "false");

  // Stopping the walk takes every walker away, and their names and words with them; the top bar comes back.
  await page.locator("#walker-close").click();
  await expect(page.locator("#walker-panel")).toHaveCount(0);
  await expect(page.locator(".topbar")).toBeVisible();
  // The campus panel comes back as its button, shut.
  await expect(page.locator("#status-toggle")).toBeVisible();
  await expect(page.locator("#status-strip")).toBeHidden();
  await expect(page.locator('[data-label^="walker:"], [data-label^="say:"]')).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("walk")).toBeNull();
});

test("a walk to a room goes into its building, up to its floor and into the room; the building view follows it, and back out", async ({ page }) => {
  await open(page, `?walk=1&${QUERY}`);
  await ready(page);
  const walked = (await walker(page, "walk", { to: "109-305", speed: 30 })) as Reply & { arrived: boolean; to: string; look: { summary: string; indoor: { building: string; floor: string; in: { room: string } } } };
  expect(walked.error).toBeUndefined();
  expect(walked.arrived).toBe(true);
  expect(walked.look.indoor).toMatchObject({ building: "109", floor: "3", in: { room: "109-305" } });
  expect(walked.look.summary).toMatch(/inside 109 General Library, on floor 3, in 109-305/);
  // The building view opened with it, on its floor, with the room's card.
  await expect.poll(() => new URL(page.url()).searchParams.get("building")).toBe("109");
  expect(new URL(page.url()).searchParams.get("floor")).toBe("3");
  expect(new URL(page.url()).searchParams.get("room")).toBe("109-305");
  await expect(page.locator("#walker-where")).toContainText("Inside 109");
  // On the floor, not in the air or under it.
  const st = ((await walker(page, "list")) as { walkers: { height: number; indoor: { floor: number } }[] }).walkers[0]!;
  expect(st.indoor.floor).toBe(30);
  // The walk's panels keep clear of the floor list and the building's dock; inside, only a walk goes
  // on, so the ways of getting about step aside, and the menu shuts.
  await expect(page.locator(".hud-rides")).toBeHidden();
  await expect(page.locator("#walker-menu")).toBeHidden();
  for (const part of [".hud-brand", ".hud-toolbar", ".hud-sign", ".hud-cluster", ".walker-moves"]) {
    const panel = (await page.locator(part).boundingBox())!;
    for (const other of [".floors", ".dock"]) {
      const box = await page.locator(other).first().boundingBox();
      if (!box) continue;
      const overlap = Math.max(0, Math.min(panel.x + panel.width, box.x + box.width) - Math.max(panel.x, box.x)) * Math.max(0, Math.min(panel.y + panel.height, box.y + box.height) - Math.max(panel.y, box.y));
      expect(overlap, `${part} and ${other}`).toBe(0);
    }
  }
  await walker(page, "view", { view: "follow" });
  await page.waitForTimeout(400);
  await expectRealRender(page);
  await shot(page, "20-walker-inside");

  // Down by the stairs or lift, then out of doors: the map goes back to the campus.
  const down = (await walker(page, "floor", { to: "down" })) as { floor: string; via: string };
  expect(down.floor).toBe("2");
  expect(down.via).toMatch(/stairs|lift/);
  await expect.poll(() => new URL(page.url()).searchParams.get("floor")).toBe("2");
  await page.locator("#walker-exit").click();
  await expect.poll(() => new URL(page.url()).searchParams.get("building")).toBeNull();
  const out = (await walker(page, "look")) as { indoor?: unknown; nearby: { id: string; distance: number }[] };
  expect(out.indoor).toBeUndefined();
  expect(out.nearby[0]).toMatchObject({ id: "109" });
  expect(out.nearby[0]!.distance).toBeLessThan(3);
});

test("on a scooter the walker goes faster on the same ways; a drone flies in its place, over the roofs and no higher than 120 m, and lands it again", async ({ page }) => {
  // Three flights and two climbs, each taking the seconds a drone takes.
  test.slow();
  await open(page, `?walk=1&${QUERY}`);
  await ready(page);
  const state = async () => ((await walker(page, "list")) as { walkers: { at: [number, number]; height: number; ride: string; speed: number; altitude?: number; indoor?: unknown }[] }).walkers[0]!;
  await expect(page.locator('#walker-panel [data-ride="walk"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator("canvas").first().focus();

  // 2 rides the scooter: held, W speeds it up past a walk, on the ground, and the address keeps it.
  await page.keyboard.press("2");
  await expect(page.locator('#walker-panel [data-ride="scooter"]')).toHaveAttribute("aria-pressed", "true");
  expect((await state()).ride).toBe("scooter");
  await expect.poll(() => new URL(page.url()).searchParams.get("ride")).toBe("scooter");
  await page.keyboard.down("w");
  await expect.poll(async () => (await state()).speed, { message: "the scooter goes faster than a walk" }).toBeGreaterThan(2.5);
  await page.keyboard.up("w");
  await expect(page.locator("#walker-speed")).not.toHaveText("");
  const rode = await state();
  const ground = await page.evaluate(([x, y]) => window.__scene!.groundState(x!, y!).ground, rode.at);
  expect(Math.abs(rode.height - ground)).toBeLessThan(0.6);

  // 3 flies a drone in its place: it takes off and rises to 12 m.
  await page.keyboard.press("3");
  await expect(page.locator('#walker-panel [data-ride="fly"]')).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await state()).altitude ?? 0, { message: "the drone takes off" }).toBeGreaterThan(10);
  await expect(page.locator("#walker-altitude")).toContainText("m up");
  // Sent to the General Library, it flies over it, clear of its roof.
  const flown = (await walker(page, "walk", { to: "109", speed: 40 })) as Reply & { arrived: boolean };
  expect(flown.arrived).toBe(true);
  const over = await state();
  const roof = await page.evaluate(([x, y]) => window.__scene!.roofAt(x!, y!), over.at);
  expect(roof, "the library's roof under the drone").toBeGreaterThan(ground + 10);
  expect(over.height).toBeGreaterThan(roof!);
  // Held down, Q brings it down no lower than the roof under it.
  await page.keyboard.down("q");
  await expect.poll(async () => (await state()).height, { message: "Q brings it down to the roof" }).toBeLessThan(roof! + 1);
  await page.keyboard.up("q");
  expect((await state()).height).toBeGreaterThanOrEqual(roof!);
  // Over the Clock Tower's wings it keeps over their roofs as the model draws them, below the
  // tower's top, and it does not come down into them.
  await page.waitForFunction(() => window.__scene!.loading === 0, undefined, { timeout: 60_000 });
  // Each landmark made so far brings its roofs as drawn, one at a time.
  await expect.poll(() => page.evaluate(() => window.__scene!.roofsReady()), { timeout: 60_000 }).toBe(true);
  const clock = await page.evaluate(() => {
    const points: { at: [number, number]; roof: number }[] = [];
    for (let n = 205; n <= 255; n += 2) for (let e = 0; e <= 60; e += 2) points.push({ at: [e, n], roof: window.__scene!.roofAt(e, n) ?? -Infinity });
    const top = Math.max(...points.map((p) => p.roof));
    // A point of a wing well clear of the tower: its roof well below the tower's top, and the same all round it.
    const wing = points.find((p) => p.roof < top - 8 && p.roof > top - 20 && [-3, 3].every((d) => (window.__scene!.roofAt(p.at[0] + d, p.at[1]) ?? 0) === p.roof && (window.__scene!.roofAt(p.at[0], p.at[1] + d) ?? 0) === p.roof));
    return { top, wing };
  });
  expect(clock.wing, "a wing of the Clock Tower lower than its tower").toBeDefined();
  expect(((await walker(page, "walk", { to: `${clock.wing!.at[0]},${clock.wing!.at[1]}`, speed: 40 })) as Reply & { arrived: boolean }).arrived).toBe(true);
  await page.keyboard.down("q");
  await expect.poll(async () => (await state()).height, { message: "Q brings it down over the wing, below the tower's top" }).toBeLessThan(clock.wing!.roof + 1);
  await page.keyboard.up("q");
  expect((await state()).height).toBeGreaterThanOrEqual(clock.wing!.roof);
  expect((await state()).height).toBeLessThan(clock.top - 5);
  // An agent sends it as high as it may go, and no higher.
  const climbed = (await walker(page, "ride", { ride: "fly", height: 500 })) as Reply;
  expect(climbed.error).toMatch(/0 to 120/);
  await walker(page, "ride", { ride: "fly", height: 120 });
  expect((await state()).altitude).toBeLessThanOrEqual(120.5);
  expect((await state()).altitude).toBeGreaterThan(110);
  await shot(page, "20-walker-drone");

  // 1 lands it: the walker stands on the ground again, beside the library, not on it.
  await page.keyboard.press("1");
  await expect(page.locator('#walker-panel [data-ride="walk"]')).toHaveAttribute("aria-pressed", "true");
  const landed = await state();
  expect(landed.ride).toBe("walk");
  expect(landed.altitude).toBeUndefined();
  const there = await page.evaluate(([x, y]) => window.__scene!.groundState(x!, y!).ground, landed.at);
  expect(Math.abs(landed.height - there)).toBeLessThan(0.6);
  const look = (await walker(page, "look")) as { nearby: { id: string; distance: number }[] };
  expect(look.nearby[0]!.distance).toBeGreaterThan(0);
  expect(new URL(page.url()).searchParams.get("ride")).toBeNull();

  // Hidden, the panels leave only the eye that brings them back.
  await page.keyboard.press("h");
  await expect(page.locator(".hud-rides")).toBeHidden();
  await expect(page.locator("#walker-hud")).toBeVisible();
  await page.locator("#walker-hud").click();
  await expect(page.locator(".hud-rides")).toBeVisible();
  // Esc on the map ends the walk.
  await walker(page, "view", { view: "map" });
  await page.keyboard.press("Escape");
  await expect(page.locator("#walker-panel")).toHaveCount(0);
  await expect(page.locator(".topbar")).toBeVisible();
});

test("in a narrower window with a mouse the walk's panels keep apart, out of doors and inside", async ({ page }) => {
  for (const [width, height, to] of [
    [760, 600, "105"],
    [900, 680, "105"],
    [900, 680, "109-305"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await open(page, `?walk=1&${QUERY}`);
    await ready(page);
    // Beside a building, so that its way in shows above the speed; or inside one, with its card and its floors.
    expect(((await walker(page, "walk", { to, speed: 40 })) as Reply & { arrived: boolean }).arrived).toBe(true);
    await expect(page.locator(to === "105" ? "#walker-enter" : "#walker-exit")).toBeVisible();
    const parts = [".hud-brand", "#walker-close", ".hud-toolbar", ".hud-menu", ".hud-sign", ".hud-rides", ".hud-cluster", ".walker-moves", ".dock", ".floors"];
    const boxes: { name: string; x: number; y: number; width: number; height: number }[] = [];
    for (const name of parts) {
      const l = page.locator(name).first();
      if (await l.isVisible()) boxes.push({ name, ...(await l.boundingBox())! });
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const [a, b] = [boxes[i]!, boxes[j]!];
        const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
        expect(apart, `${a.name} and ${b.name} at ${width} x ${height}`).toBe(true);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("a walk the address asks for starts when the data comes in before the scene, as in a tab opened in the background", async ({ page }) => {
  // A tab opened behind others draws no frames and runs its timers late, so the data comes in
  // before the scene, which is made after the first frame. Here the page's clock stands still, as
  // it does there, until the tab comes to the front; the data still loads.
  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 1000);
  // Every address the page writes, to see that none of them lets go of the walk.
  await page.addInitScript(() => {
    const replace = history.replaceState.bind(history);
    window.__addresses = [];
    history.replaceState = (state, unused, url) => {
      window.__addresses!.push(String(url));
      replace(state, unused, url);
    };
  });
  const keptWalk = async () => {
    for (const url of [...(await page.evaluate(() => window.__addresses!)), page.url()]) {
      const q = new URL(url, page.url()).searchParams;
      expect([q.get("walk"), q.get("view")], url).toEqual(["1", "follow"]);
    }
  };
  await page.goto(`./?walk=1&view=follow&${QUERY}`);
  await expect(page.locator(".splash")).toHaveCount(0);
  // The data is in, and not a frame has been drawn.
  expect(await page.evaluate(() => window.__scene?.frames ?? 0)).toBe(0);
  await keptWalk();

  // The tab comes to the front: one walker, seen from behind, and the address keeps it. The clock
  // runs on a set time rather than resuming: resumed, it would run every frame it fell behind on,
  // and a frame drawn in software takes longer than a frame's time, so it would never catch up.
  await page.clock.runFor(500);
  await expect(page.locator("#walker-panel")).toBeVisible();
  await expect(page.locator('#walker-panel button[data-view="follow"]')).toHaveAttribute("aria-pressed", "true");
  const list = (await walker(page, "list")) as { walkers: { name: string }[]; view: string; viewing: string };
  expect(list.walkers.map((w) => w.name)).toEqual(["Walker"]);
  expect(list).toMatchObject({ view: "follow", viewing: "Walker" });
  await keptWalk();
  await page.waitForFunction(() => window.__scene!.loading === 0);
  await page.clock.runFor(500);
  await expectRealRender(page);
  await shot(page, "20-walker-background-tab");
});

test("walked on by hand, the view comes round behind the walker, however long a frame takes", async ({ page }) => {
  // On CI's software renderer a frame of a walker view takes a second or two, and the view must
  // still come round by the clock. Here the page's clock stands still, and one frame is let
  // through a second and a half after the last.
  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 1000);
  await page.goto(`./?walk=1&view=follow&${QUERY}`);
  await expect(page.locator(".splash")).toHaveCount(0);
  // Frame by frame until the walker stands in its view, seen from behind.
  await expect
    .poll(async () => {
      await page.clock.fastForward(100);
      return ((await walker(page, "list")) as { view?: string }).view;
    })
    .toBe("follow");
  await page.evaluate(() => window.__scene!.setWalkerLook(90));
  await page.locator("canvas").first().focus();
  await page.keyboard.down("w");
  await page.clock.fastForward(1500);
  const yaw = await page.evaluate(() => window.__scene!.walkerLook().yaw);
  await page.keyboard.up("w");
  expect(Math.abs(((yaw + 180) % 360) - 180), "degrees the view is still turned from behind the walker").toBeLessThan(10);
});

test("a walker view that stands still is drawn once, however long a frame takes", async ({ page }) => {
  // On CI's software renderer a frame of a walker view takes a second or more. A still view must
  // not be drawn again because the last frame was long: that kept a still view drawing for ever
  // (#53). Here the page's clock stands still, and frames are let through a second and a half apart.
  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 1000);
  await page.goto(`./?walk=1&view=eyes&${QUERY}`);
  await expect(page.locator(".splash")).toHaveCount(0);
  await expect
    .poll(async () => {
      await page.clock.fastForward(100);
      const { view } = (await walker(page, "list")) as { view?: string };
      return view === "eyes" && (await page.evaluate(() => window.__scene!.streetState().sky));
    })
    .toBe(true);
  // Until a long frame draws nothing more: the walker, its view, the sky and the Clock Tower have
  // come in. The Clock Tower is made in a worker and its shaders on the graphics driver's threads
  // (landmark.spec.ts), which the page's clock does not hold back, so they are waited for as well.
  await expect
    .poll(async () => {
      const before = await page.evaluate(() => window.__scene!.frames);
      await page.clock.fastForward(1500);
      const drawn = (await page.evaluate(() => window.__scene!.frames)) - before;
      return drawn + (await page.evaluate(() => window.__scene!.loading + window.__scene!.preparing));
    })
    .toBe(0);
  const before = await page.evaluate(() => window.__scene!.frames);
  for (let i = 0; i < 4; i++) await page.clock.fastForward(1500);
  expect(await page.evaluate(() => window.__scene!.frames), "frames drawn of a still view").toBe(before);
});
