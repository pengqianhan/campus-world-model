// The walker: a made-up figure a visitor or an agent walks round the campus, and its views.
import { devices, expect, test, type Page } from "@playwright/test";
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
  // At the City Campus's start, on the lawn across the road west of the Clock Tower, facing it (its model's middle at
  // (31, 229)).
  const toTower = (Math.atan2(31 - start.at[0], 229 - start.at[1]) * 180) / Math.PI;
  expect(Math.abs(((start.heading - toTower + 540) % 360) - 180)).toBeLessThan(1);
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

  // The menu at the top right is shut as the walk starts, on a wide screen too. Go to opens it: a walk
  // to a place, wandering, how to steer, and that the walker, its scooter and its drone are made up;
  // and folds it away.
  await expect(page.locator("#walker-more")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#walker-menu")).toBeHidden();
  await page.locator("#walker-more").click();
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
  // Every landmark made so far brings its roofs as drawn, one at a time, before the drone is sent over them.
  await page.waitForFunction(() => window.__scene!.loading === 0, undefined, { timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => window.__scene!.roofsReady()), { timeout: 60_000 }).toBe(true);
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
  // And any made on the way.
  await page.waitForFunction(() => window.__scene!.loading === 0, undefined, { timeout: 60_000 });
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

test("Study Quest is off until asked for; its title says it is made up; the first minute is taught by prompts that come once; books lead to the DDL, a strike lands, the pause stops its clock; burnt out, a retry starts the quest again, the debrief grades the run by its factors, and a game played again starts at once; ending it clears the map", async ({ page }) => {
  type Game = {
    phase: string;
    books: [number, number][];
    foes: { id: number; kind: string; at: [number, number]; hp: number; state: string }[];
    quests: { key: string; need: number; got: number }[];
    focus: number;
    xp: number;
    rank: number;
    main: number;
  };
  type GameScene = {
    game: { state(): Game | undefined; quest?: { seconds: number; focus: number; grace: number; iframes: number; deaths: number; practice?: number; taught: Set<string> } };
    walkers: { teleport(name: string, at: [number, number]): void; turn(name: string, by: number, absolute?: boolean): void };
  };
  const game = () => page.evaluate(() => (window.__scene as unknown as GameScene).game.state());
  const put = (at: [number, number], heading?: number) =>
    page.evaluate(
      ([p, h]) => {
        const s = window.__scene as unknown as GameScene;
        s.walkers.teleport("Walker", p as [number, number]);
        if (h !== undefined && h !== null) s.walkers.turn("Walker", h as number, true);
      },
      [at, heading ?? null] as const,
    );
  const until = (test: string) => page.waitForFunction((t) => new Function("g", `return !!g && (${t})`)((window.__scene as unknown as GameScene).game.state()), test, { timeout: 60_000 });

  await open(page, "?walk=1");
  await ready(page);
  // Nothing of the game is on the map until the visitor starts it.
  expect(await game()).toBeUndefined();
  await expect(page.locator("#game-panel")).toHaveCount(0);
  await expect(page.locator(".gx")).toBeHidden();

  // Its button says that it is made up.
  await expect(page.locator("#walker-game")).toHaveAttribute("title", /made up/);
  await page.locator("#walker-game").click();
  // The title card, between letterbox bars, says so again; a tap lets the game begin.
  await expect(page.locator("#game-title")).toBeVisible();
  await expect(page.locator("#game-title")).toContainText(/made up/);
  // The game is seen from behind the walker, and the buildings' names wait until it ends.
  await expect(page.locator('#walker-panel button[data-view="follow"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-label^="game:"]')).toHaveCount(0);
  // The walker's own name is left off too: it would sit on the villain it faces.
  await expect(page.locator('[data-label="walker:Walker"]')).toHaveCount(0);
  await shot(page, "32-study-quest");
  await page.locator("#game-title").click();
  await expect(page.locator("#game-title")).toHaveCount(0);
  let g = (await game())!;
  expect(g.books).toHaveLength(40);
  expect(g.quests.map((q) => q.key)).toEqual(["orientation"]);
  await expect(page.locator("#game-quests")).toContainText("Orientation");
  await expect(page.locator("#game-rank")).toHaveText("Fresher");
  await expect(page.locator(".gx-compass")).toBeVisible();
  // No words to read: the title card lists no controls. The first book glows a few steps ahead,
  // and the one prompt is its keys to move.
  await expect(page.locator(".sq-legend")).toHaveCount(0);
  await expect(page.locator("#game-prompt")).toHaveAttribute("data-lesson", "move");
  await expect(page.locator("#game-prompt kbd")).toHaveCount(4);
  const start = await page.evaluate(() => (window.__scene as unknown as { walkers: { state(n: string): { at: [number, number] } } }).walkers.state("Walker").at.slice());
  expect(Math.hypot(g.books[0]![0] - start[0]!, g.books[0]![1] - start[1]!)).toBeLessThan(12);

  // The first book taken: the prompt to move goes, and a lone weak Procrastination comes; near it,
  // the prompt to strike.
  await put(g.books[0]!);
  await until("g.xp >= 10");
  await expect(page.locator("#game-prompt")).toHaveCount(0);
  await page.waitForFunction(() => {
    const q = (window.__scene as unknown as GameScene).game.quest!;
    return q.practice !== undefined && (window.__scene as unknown as GameScene).game.state()!.foes.some((f) => f.id === q.practice && f.state !== "rise");
  });
  const tutor = (await game())!.foes.find((f) => f.kind === "procrastination")!;
  await put([tutor.at[0], tutor.at[1] - 5], 0);
  await expect(page.locator("#game-prompt")).toHaveAttribute("data-lesson", "strike");
  await expect(page.locator("#game-prompt")).toContainText("Strike");
  // J strikes: the prompt goes for good, here and in this browser's storage.
  await put([tutor.at[0], tutor.at[1] - 2.2], 0);
  await page.keyboard.press("j");
  await expect(page.locator('#game-prompt[data-lesson="strike"]')).toHaveCount(0);
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem("studyQuest.settings") ?? "{}").seen ?? []).includes("strike"));

  // The orientation's books finish the first quest: the DDL comes with its name card.
  for (let k = 0; k < 8; k++) {
    g = (await game())!;
    if (g.main >= 1) break;
    const got = g.quests[0]!.got;
    await put(g.books[0]!);
    await until(`g.main >= 1 || g.quests[0].got > ${got}`);
  }
  await until("g.main === 1 && g.foes.some((f) => f.kind === 'ddl')");
  await expect(page.locator("#game-namecard")).toContainText("DDL");
  await expect(page.locator("#game-quests")).toContainText("The DDL");

  // Beside the DDL and facing it, J strikes, and the blow lands.
  g = (await game())!;
  const ddl = g.foes.find((f) => f.kind === "ddl")!;
  const ddlHp = ddl.hp;
  await page.waitForFunction((id) => (window.__scene as unknown as GameScene).game.state()!.foes.find((f) => f.id === id)?.state !== "rise", ddl.id);
  for (let k = 0; k < 6; k++) {
    const d = (await game())!.foes.find((f) => f.kind === "ddl")!;
    await put([d.at[0], d.at[1] - 2.2], 0);
    await page.keyboard.press("j");
    await page.waitForTimeout(350);
    if ((await game())!.foes.find((f) => f.kind === "ddl")!.hp < ddlHp) break;
  }
  await until(`g.foes.some((f) => f.kind === 'ddl' && f.hp < ${ddlHp})`);
  await expect(page.locator(".gx-plate.elite").first()).toContainText("DDL");

  // P pauses: the menu opens and the game's clock stops; Resume goes on. A key still held when the
  // menu opens does not walk the walker on under it.
  const walkerAt = () => page.evaluate(() => (window.__scene as unknown as { walkers: { state(n: string): { at: [number, number] } } }).walkers.state("Walker").at.slice());
  await page.keyboard.down("w");
  await page.waitForTimeout(300);
  await page.keyboard.press("p");
  await expect(page.locator("#game-menu")).toBeVisible();
  const held0 = await walkerAt();
  await page.waitForTimeout(600);
  const held1 = await walkerAt();
  await page.keyboard.up("w");
  expect(Math.hypot(held1[0]! - held0[0]!, held1[1]! - held0[1]!)).toBeLessThan(0.05);
  const t0 = await page.evaluate(() => (window.__scene as unknown as GameScene).game.quest!.seconds);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window.__scene as unknown as GameScene).game.quest!.seconds)).toBe(t0);
  await page.locator("#game-resume").click();
  await expect(page.locator("#game-menu")).toHaveCount(0);

  // With its Focus at one, the next blow burns the walker out: a choice, to retry, to see the
  // debrief, or to end the game.
  const burn = () =>
    page.evaluate(() => {
      const q = (window.__scene as unknown as GameScene).game.quest! as unknown as { focus: number; grace: number; iframes: number; cineT: number; hurt(n: number, p: [number, number]): void };
      q.focus = 1;
      q.grace = 0;
      q.iframes = 0;
      q.cineT = 0;
      q.hurt(10, [0, 0]);
    });
  await burn();
  await until("g.phase === 'over'");
  await expect(page.locator("#game-over")).toBeVisible();
  await expect(page.locator("#game-over")).toContainText("Burnt out");
  await expect(page.locator("#game-over")).toContainText(/made up/);
  await expect(page.locator("#game-retry")).toBeFocused();
  // Retry: at once, the DDL's quest from where it began, Focus whole, the defeat counted.
  const retried = Date.now();
  await page.locator("#game-retry").click();
  await until("g.phase === 'play' && g.main === 1 && g.focus >= 100 && g.foes.some((f) => f.kind === 'ddl')");
  expect(Date.now() - retried).toBeLessThan(1500);
  await expect(page.locator("#game-over")).toHaveCount(0);
  expect(await page.evaluate(() => (window.__scene as unknown as GameScene).game.quest!.deaths)).toBe(1);
  await expect(page.locator("#game-quests")).toContainText("The DDL");

  // Burnt out again, the debrief: its grade, and a line for each of the factors that make it.
  await burn();
  await page.locator("#game-debrief").click();
  await expect(page.locator("#game-grade")).toHaveText(/^[A-DF][+-]?$/);
  const factors = page.locator("#game-factors dd");
  await expect(factors).toHaveCount(5);
  await expect(page.locator('#game-factors dd[data-factor="deaths"]')).toContainText("2");
  for (const k of ["time", "deaths", "combo", "knowledge"]) await expect(page.locator(`#game-factors dd[data-factor="${k}"] .sq-pts`)).toHaveText(/^\d+\/\d+$/);

  // Play again: a fresh game at once, with no reload and no title card; the prompts taught stay away.
  const again = Date.now();
  await page.locator("#game-again").click();
  await until("g.phase === 'play' && g.xp === 0 && g.main === 0");
  expect(Date.now() - again).toBeLessThan(1500);
  await expect(page.locator("#game-title")).toHaveCount(0);
  await expect(page.locator("#game-over")).toHaveCount(0);
  await page.waitForTimeout(400);
  await expect(page.locator('#game-prompt[data-lesson="strike"]')).toHaveCount(0);

  // Ending the game takes everything of it off the map; the walk goes on.
  await page.keyboard.press("p");
  await page.locator("#game-quit").click();
  await expect(page.locator("#game-panel")).toHaveCount(0);
  await expect(page.locator(".gx")).toBeHidden();
  expect(await game()).toBeUndefined();
  await expect(page.locator("#walker-panel")).toBeVisible();
  await expect(page.locator('[data-label="walker:Walker"]')).toHaveCount(1);
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
  // A link to the campus's start opens as Take a walk does: the view behind the walker 12 degrees lower than usual,
  // so that it takes in the whole Clock Tower.
  expect((await page.evaluate(() => window.__scene!.walkerLook())).pitch).toBeCloseTo(-12, 5);
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
  // (landmark.spec.ts), which the page's clock does not hold back, so they are waited for as well;
  // with the file's other tests drawing on the same graphics card that can take longer than the
  // default wait, which says nothing about a still view.
  await expect
    .poll(
      async () => {
        const before = await page.evaluate(() => window.__scene!.frames);
        await page.clock.fastForward(1500);
        const drawn = (await page.evaluate(() => window.__scene!.frames)) - before;
        return drawn + (await page.evaluate(() => window.__scene!.loading + window.__scene!.preparing));
      },
      { timeout: 40_000 },
    )
    .toBe(0);
  const before = await page.evaluate(() => window.__scene!.frames);
  for (let i = 0; i < 4; i++) await page.clock.fastForward(1500);
  expect(await page.evaluate(() => window.__scene!.frames), "frames drawn of a still view").toBe(before);
});

test.describe("on a phone", () => {
  // A phone held upright (390 by 844, as an iPhone 13), touch and all; drawn at one pixel to the
  // point, as the other tests in this file share the graphics card with it.
  const { defaultBrowserType: _browser, ...phone } = devices["Pixel 7"];
  test.use({ ...phone, viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });

  test("Study Quest on a phone: the title card, the prompt by the stick, the first fight's strike by the button that pulses, and a pause menu with no stick or buttons through it", async ({ page }) => {
    type GameScene = {
      game: { state(): { phase: string; xp: number; books: [number, number][]; foes: { id: number; kind: string; at: [number, number]; hp: number; state: string }[] } | undefined; quest?: { practice?: number; seconds: number } };
      walkers: { teleport(name: string, at: [number, number]): void; turn(name: string, by: number, absolute?: boolean): void };
    };
    const game = () => page.evaluate(() => (window.__scene as unknown as GameScene).game.state());
    const put = (at: [number, number], heading = 0) =>
      page.evaluate(
        ([p, h]) => {
          const s = window.__scene as unknown as GameScene;
          s.walkers.teleport("Walker", p as [number, number]);
          s.walkers.turn("Walker", h as number, true);
        },
        [at, heading] as const,
      );
    await open(page, `?walk=1&${QUERY}`);
    await ready(page);
    await page.locator("#walker-game").tap();
    await expect(page.locator("#game-title")).toBeVisible();
    await expect(page.locator("#game-title")).toContainText("Tap to begin");
    await page.locator("#game-title").tap();
    await expect(page.locator("#game-title")).toHaveCount(0);

    // The prompt to move stands by the stick, which pulses; no key glyphs on a phone.
    const prompt = page.locator("#game-prompt");
    await expect(prompt).toHaveAttribute("data-lesson", "move");
    await expect(prompt).toHaveClass(/at-stick/);
    await expect(page.locator("#game-prompt kbd")).toHaveCount(0);
    await expect(page.locator("#game-panel")).toHaveClass(/cue-move/);
    const box = (await prompt.boundingBox())!;
    const stick = (await page.locator("#walker-stick").boundingBox())!;
    // Above the stick, not over it, and clear of the middle of the picture.
    expect(box.y + box.height).toBeLessThanOrEqual(stick.y + 2);
    expect(box.y).toBeGreaterThan(844 * 0.55);

    // The first book, then the first fight's lone foe: by it, the strike's prompt over the buttons.
    let g = (await game())!;
    await put(g.books[0]!);
    await page.waitForFunction(() => {
      const s = window.__scene as unknown as GameScene;
      const id = s.game.quest!.practice;
      return id !== undefined && s.game.state()!.foes.some((f) => f.id === id && f.state !== "rise");
    });
    g = (await game())!;
    const tutor = g.foes.find((f) => f.kind === "procrastination")!;
    await put([tutor.at[0], tutor.at[1] - 2.2], 0);
    await expect(prompt).toHaveAttribute("data-lesson", "strike");
    await expect(prompt).toHaveClass(/at-pad/);
    await expect(page.locator("#game-panel")).toHaveClass(/cue-strike/);
    await shot(page, "33-study-quest-phone-prompt");
    // The first strike, from its button: it lands, and the prompt goes.
    await page.locator("#game-strike").dispatchEvent("pointerdown");
    await page.waitForFunction((id) => (window.__scene as unknown as GameScene).game.state()!.foes.some((f) => f.id === id && f.hp < 85), tutor.id);
    await expect(page.locator('#game-prompt[data-lesson="strike"]')).toHaveCount(0);

    // The pause menu has the screen: no stick, no buttons, no marks over the picture under it; the clock stops.
    await page.locator("#game-pause").tap();
    await expect(page.locator("#game-menu")).toBeVisible();
    await expect(page.locator("#walker-stick")).toHaveCount(0);
    await expect(page.locator(".sq-pad")).toHaveCount(0);
    await expect(page.locator("#game-prompt")).toHaveCount(0);
    await expect(page.locator(".gx")).toHaveClass(/menu/);
    const t0 = await page.evaluate(() => (window.__scene as unknown as GameScene).game.quest!.seconds);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window.__scene as unknown as GameScene).game.quest!.seconds)).toBe(t0);
    await page.locator("#game-resume").tap();
    await expect(page.locator("#game-menu")).toHaveCount(0);
    await expect(page.locator("#walker-stick")).toBeVisible();
    await expect(page.locator(".sq-pad")).toBeVisible();
  });
});
