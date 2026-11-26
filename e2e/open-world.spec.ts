// Open-world Study Quest (Round 2 GTA campus overhaul):
// ?walk=1&view=follow&game=1 auto-launch, Harbour-Night circular radar, vehicle driving & radio,
// [T] Campus Phone (Order Slice Co. / Call E-Scooter / Story Jobs), melee brawl & pizza drops,
// 5-star Campus Security Wanted heat, and clean exit.
import { expect, test, type Page } from "@playwright/test";
import { expectRealRender, open } from "./helpers.ts";

const QUERY = "light=day&time=preview&date=2026-03-20&t=15:00";

test.use({ viewport: { width: 1280, height: 800 } });

type OpenWorldGame = {
  phase: string;
  books: [number, number][];
  pizzas: [number, number][];
  items: { kind: string; at: [number, number]; dropped?: boolean }[];
  focus: number;
  energy: number;
  slices: number;
  weapon: "fists" | "textbook";
  cash: number;
  cred: number;
  wanted: number;
  heat: number;
  pizzaBuff: number;
  pizzasEaten: number;
  kmDriven: number;
  rivalsBeat: number;
  radioStation: number;
  inVehicle?: { id: number; kind: string; speed: number; kmh: number };
  vehicles: { id: number; kind: string; at: [number, number]; speed: number; driver: string }[];
  humans: { id: number; role: string; name: string; at: [number, number]; hp: number; state: string; target: boolean }[];
  openWorld: {
    spots: { id: string; kind: string; missionId?: string; at: [number, number]; cooldown: number }[];
    active?: { id: string; stage: string; got: number; need: number; timer?: number };
    completedJobs: string[];
    students: number;
  };
};

type GameScene = {
  game?: {
    state(): OpenWorldGame | undefined;
    quest?: { seconds: number; focus: number; wanted: number; addWanted?(n: number): void };
  };
  walkers: {
    teleport(name: string, at: [number, number]): void;
    turn(name: string, by: number, absolute?: boolean): void;
  };
};

function readGame(page: Page): Promise<OpenWorldGame | undefined> {
  return page.evaluate(() => (window.__scene as unknown as GameScene).game?.state());
}

function moveWalker(page: Page, at: [number, number], heading?: number): Promise<void> {
  return page.evaluate(
    ([p, h]) => {
      const s = window.__scene as unknown as GameScene;
      s.walkers.teleport("Walker", p as [number, number]);
      if (h !== undefined && h !== null) s.walkers.turn("Walker", h as number, true);
    },
    [at, heading ?? null] as const,
  );
}

function until(page: Page, expr: string, timeout = 90_000) {
  return page.waitForFunction(
    (code) => new Function("g", `return !!g && (${code})`)((window.__scene as unknown as GameScene).game?.state()),
    expr,
    { timeout, polling: 100 },
  );
}

test("plain ?walk=1&view=follow without game=1 does not auto-start Study Quest", async ({ page }) => {
  await open(page, `?walk=1&view=follow&${QUERY}`);
  await expect(page.locator("#walker-panel")).toBeVisible();
  await expect(page.locator("#walker-game")).toHaveAttribute("title", /made up/);
  await expect(page.locator("#game-panel")).toHaveCount(0);
  expect(await page.evaluate(() => (window.__scene as unknown as GameScene).game)).toBeUndefined();
});

test("?walk=1&view=follow&game=1 drops straight into open-campus GTA play: drive vehicle, use phone, brawl rivals, eat pizza, trigger wanted stars, and exit cleanly", async ({ page }) => {
  test.slow();

  await open(page, `?walk=1&view=follow&game=1&${QUERY}`);
  await expect(page.locator("#walker-panel")).toBeVisible();
  await expect(page.locator("#game-panel")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#game-title")).toHaveCount(0);

  // Harbour-Night circular radar, 5-star Wanted meter, cash, weapon, phone, and real WebGL render.
  await expect(page.locator("#game-radar")).toBeVisible();
  await expect(page.locator("#game-cred")).toBeVisible();
  await expect(page.locator("#game-heat")).toBeVisible();
  await expect(page.locator(".g-weapon")).toBeVisible();
  await expect(page.locator("#game-phone-btn")).toBeVisible();
  await expectRealRender(page);

  let g = (await readGame(page))!;
  expect(g.books).toHaveLength(0);
  expect(g.vehicles.length).toBeGreaterThan(0);
  expect(g.humans.length).toBeGreaterThanOrEqual(24);
  expect(g.openWorld.spots.length).toBeGreaterThanOrEqual(4);

  // [T] Campus Phone opens, and "Call E-Scooter" spawns a scooter nearby.
  const vehCount0 = g.vehicles.length;
  await page.keyboard.press("t");
  await expect(page.locator("#game-phone")).toBeVisible();
  await page.locator("#game-phone button").filter({ hasText: /Call E-Scooter/i }).click();
  await until(page, `g.vehicles.length >= ${vehCount0 + 1} || g.vehicles.some(v => v.kind === "scooter")`);

  // Ride the E-Scooter with [F] and verify Figure grips handlebars & dismounts cleanly.
  g = (await readGame(page))!;
  const scooter = g.vehicles.find((v) => v.kind === "scooter" && v.driver === "none")!;
  expect(scooter).toBeDefined();
  await moveWalker(page, [scooter.at[0] + 1.1, scooter.at[1]], 0);
  await expect(page.locator("#game-prompt")).toBeVisible();
  await page.locator("canvas").first().focus();
  await page.keyboard.press("f");
  await until(page, `g.inVehicle?.kind === "scooter"`);
  await page.waitForFunction(() => {
    const s = window.__scene as unknown as {
      walkers: { figure(n: string): { isGameScooter: boolean; ready: boolean; root: { getObjectByName(n: string): unknown } } | undefined };
    };
    const fig = s.walkers.figure("Walker");
    if (!fig || !fig.ready || !fig.isGameScooter) return false;
    return !!fig.root.getObjectByName("RightHand") && !!fig.root.getObjectByName("LeftHand");
  });
  const scooterGrip = await page.evaluate(() => {
    const s = window.__scene as unknown as {
      walkers: {
        figure(n: string): {
          isGameScooter: boolean;
          root: {
            position: { clone(): { x: number; y: number; z: number } };
            getObjectByName(n: string): { getWorldPosition(v: unknown): unknown } | undefined;
            worldToLocal(v: unknown): { x: number; y: number; z: number };
          };
        };
      };
    };
    const fig = s.walkers.figure("Walker");
    const sample = (bone: string) => {
      const b = fig.root.getObjectByName(bone)!;
      const v = fig.root.position.clone();
      b.getWorldPosition(v);
      return fig.root.worldToLocal(v);
    };
    return { isGameScooter: fig.isGameScooter, r: sample("RightHand"), l: sample("LeftHand") };
  });
  expect(scooterGrip.isGameScooter).toBe(true);
  expect(scooterGrip.r.y).toBeGreaterThan(1.0);
  expect(scooterGrip.l.y).toBeGreaterThan(1.0);
  expect(scooterGrip.r.z).toBeLessThan(-0.2);
  expect(scooterGrip.l.z).toBeLessThan(-0.2);
  await page.keyboard.press("f");
  await until(page, `!g.inVehicle`);

  // Walk beside a car (sedan/hatchback/suv/van), press [F] to enter, drive with [W], cycle radio [R], then [F] to exit.
  g = (await readGame(page))!;
  const car = g.vehicles.find((v) => v.kind !== "scooter" && v.driver === "none") ?? g.vehicles[0]!;
  expect(car).toBeDefined();
  await moveWalker(page, [car.at[0] + 1.4, car.at[1]], 0);
  await expect(page.locator("#game-prompt")).toBeVisible();
  await page.locator("canvas").first().focus();
  await page.keyboard.press("f");
  await until(page, `!!g.inVehicle`);
  await expect(page.locator("#game-speedo")).toBeVisible();

  await page.keyboard.press("r");
  await until(page, `g.radioStation === 1`);

  await page.keyboard.down("w");
  await until(page, `(g.inVehicle?.kmh ?? 0) > 2 && g.kmDriven > 0`);
  await page.keyboard.up("w");

  await page.keyboard.press("f");
  await until(page, `!g.inVehicle`);
  await expect(page.locator("#game-speedo")).toHaveCount(0);

  // Start the Courtyard Brawl side hustle ("sideCourtyardBrawl") or Group Project job, defeat rivals, eat pizza, and see MISSION PASSED.
  const brawlSpot = g.openWorld.spots.find((s) => s.missionId === "sideCourtyardBrawl") ?? g.openWorld.spots.find((s) => s.kind === "jobGiver")!;
  expect(brawlSpot).toBeDefined();
  await moveWalker(page, brawlSpot.at, 0);
  await page.keyboard.press("g");
  await until(page, `!!g.openWorld.active`);

  // Lower focus slightly to verify pizza slice heals & adds blue energy/armour.
  await page.evaluate(() => {
    const q = (window.__scene as unknown as GameScene).game?.quest;
    if (q) q.focus = 60;
  });
  await page.keyboard.press("g");
  await until(page, `g.pizzasEaten >= 1 && g.energy > 0 && g.focus > 60`);

  // Switch to Textbook [Q] and knock out the spawned rival NPCs.
  await page.keyboard.press("q");
  await until(page, `g.weapon === "textbook"`);
  for (let step = 0; step < 90; step++) {
    g = (await readGame(page))!;
    if (!g.openWorld.active || g.openWorld.active.stage !== "fight") break;
    const target = g.humans.find((h) => h.target && h.state !== "down" && h.state !== "dead");
    if (!target) {
      await page.waitForTimeout(100);
      continue;
    }
    await moveWalker(page, [target.at[0], target.at[1] - 1.5], 0);
    await page.keyboard.press("j");
    await page.waitForTimeout(220);
  }
  await until(page, `!g.openWorld.active || g.openWorld.active.stage !== "fight"`);
  g = (await readGame(page))!;
  expect(g.rivalsBeat).toBeGreaterThan(0);

  // Wanted stars highlight #game-heat when Campus Security alert triggers.
  await page.evaluate(() => (window.__scene as unknown as GameScene).game?.quest?.addWanted?.(2));
  await until(page, `g.wanted >= 2`);
  await expect(page.locator("#game-heat .g-star.is-on")).toHaveCount(2);

  // Exit cleanly back to walker, then back to map.
  await page.keyboard.press("p");
  await expect(page.locator("#game-menu")).toBeVisible();
  await page.locator("#game-quit").click();
  await expect(page.locator("#game-panel")).toHaveCount(0);
  expect(await readGame(page)).toBeUndefined();
});
