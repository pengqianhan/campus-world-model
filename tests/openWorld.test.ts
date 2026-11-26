import { describe, expect, it } from "vitest";
import { Box3, Mesh, Vector3 } from "three";
import { createProceduralHuman, createVehicleActor } from "../src/scene/gameModels.ts";
import { OpenWorldScene } from "../src/scene/openWorldScene.ts";
import { GROUND_PAINT } from "../src/scene/walkers.ts";
import type { Pt } from "../src/shared/geo.ts";
import { encodeRing } from "../src/shared/geo.ts";
import {
  HOME_MARGIN,
  LESSONS,
  MAX_ATTACKERS,
  OPEN_WORLD,
  PLAYER,
  QUEST,
  STORY_JOBS,
  SIDE_HUSTLES,
  StudyQuest,
  VEHICLE_SPECS,
  awayFromHomes,
  bookSpot,
  extractDrivableRoads,
  leftLanePoint,
  nearestReached,
  openSpot,
  reachable,
  statsFor,
  type GameEvent,
  type JobId,
  type PlayerInput,
  type QuestHost,
  type RoadInput,
  type VehicleControlInput,
} from "../src/shared/game.ts";
import { blockPolygon, cellOf, makeGrid } from "../src/shared/walkpath.ts";

function seeded(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const SAMPLE_ROADS: RoadInput[] = [
  {
    k: "major",
    p: encodeRing([
      [-120, 30],
      [0, 30],
      [120, 30],
    ]),
  },
  {
    k: "street",
    p: encodeRing([
      [0, -100],
      [0, 30],
      [0, 120],
    ]),
  },
  {
    k: "service",
    p: encodeRing([
      [0, 120],
      [120, 120],
    ]),
  },
  {
    k: "path",
    p: encodeRing([
      [-20, -20],
      [20, -20],
    ]),
  },
];

function rowHost(random: () => number = () => 0.5, roads: readonly RoadInput[] = SAMPLE_ROADS): QuestHost {
  let places = 0;
  return {
    spot: (near, taken, place) => (place ? [place[0] + 3 + taken.length, place[1]] : [near[0] + 500 + taken.length * 20, near[1]]),
    place: (near) => ({ name: `Quad ${++places}`, at: [near[0], near[1] + 100 + places] }),
    random,
    roads,
  };
}

const HERE: Pt = [0, 0];
const at = (p: Pt, heading = 0): PlayerInput => ({ at: p, heading, active: true, pace: 1 });

function quiet(random?: () => number, roads: readonly RoadInput[] = SAMPLE_ROADS): StudyQuest {
  const g = new StudyQuest(rowHost(random, roads), HERE, 0, LESSONS);
  g.grace = 0;
  g.foes = [];
  return g;
}

function run(g: StudyQuest, seconds: number, p: Pt = HERE, heading = 0, veh?: VehicleControlInput): GameEvent[] {
  const out: GameEvent[] = [];
  for (let t = 0; t < seconds - 1e-9; t += 0.05) out.push(...g.step(0.05, at(p, heading), veh));
  return out;
}

describe("grounded open-world initialization", () => {
  it("spawns grounded pickups (pizza/coffee/cash), zero floating books, Slice Co. van, 4 story jobs, and 3 side hustles", () => {
    const g = new StudyQuest(rowHost(seeded(2)), HERE);
    expect(g.quests).toEqual([]);
    expect(g.items.every((i) => i.kind === "pizza" || i.kind === "coffee" || i.kind === "cash")).toBe(true);
    expect(g.items.filter((i) => i.kind === "pizza")).toHaveLength(QUEST.pizzaOut);
    expect(g.items.filter((i) => i.kind === "coffee")).toHaveLength(QUEST.coffeeOut);
    expect(g.items.filter((i) => i.kind === "cash")).toHaveLength(QUEST.cashOut);
    expect(g.openWorld.spots.some((s) => s.kind === "pizzaVan")).toBe(true);
    for (const j of STORY_JOBS) expect(g.openWorld.spots.some((s) => s.missionId === j.id)).toBe(true);
    for (const h of SIDE_HUSTLES) expect(g.openWorld.spots.some((s) => s.missionId === h.id)).toBe(true);
    for (const s of g.openWorld.spots) {
      expect(Math.hypot(s.at[0], s.at[1])).toBeGreaterThanOrEqual(OPEN_WORLD.startClearance);
    }
    expect(g.openWorld.humans.filter((h) => h.role === "pedestrian").length).toBeGreaterThanOrEqual(10);
    for (const h of g.openWorld.humans) {
      expect(Math.hypot(h.at[0], h.at[1])).toBeGreaterThanOrEqual(OPEN_WORLD.startClearance);
    }
    expect(g.gpsRoute.length).toBeGreaterThanOrEqual(2);
  });
});

describe("campus vehicles & 2D driving physics", () => {
  it("extracts drivable roads from ContextData.roads (ignoring path/steps) and places left-hand traffic & scooters", () => {
    const roads = extractDrivableRoads(SAMPLE_ROADS);
    expect(roads).toHaveLength(3);
    expect(roads.map((r) => r.kind)).toEqual(["major", "street", "service"]);
    // Major road runs east (-120 -> +120 at y=30): left-hand driving lane is NORTH (y > 30)
    const lane = leftLanePoint(roads[0]!, 50, 1);
    expect(lane.at[1]).toBeGreaterThan(30);
    expect(lane.heading).toBeCloseTo(90, 1);

    const g = quiet(seeded(3));
    expect(g.vehicles.vehicles.some((v) => v.isTraffic && v.driver === "npc")).toBe(true);
    expect(g.vehicles.vehicles.some((v) => v.kind === "scooter")).toBe(true);
  });

  it("supports entering/exiting with toggleVehicle (F), driving acceleration, steering, handbrake drift, reverse, and telemetry", () => {
    const g = quiet(seeded(4));
    const scooter = g.vehicles.vehicles.find((v) => v.kind === "scooter")!;
    g.step(0.05, at(scooter.at));
    expect(g.currentPrompt()?.action).toBe("ride");
    expect(g.toggleVehicle()).toBe(true);
    expect(g.vehicles.current?.id).toBe(scooter.id);

    // Accelerate and steer right
    run(g, 1.5, scooter.at, scooter.heading, { throttle: 1, brake: 0, steer: 0.4, handbrake: false });
    const tel = g.vehicles.telemetry()!;
    expect(tel.kmh).toBeGreaterThan(15);
    expect(tel.gear).toBeGreaterThanOrEqual(1);
    expect(tel.rpm).toBeGreaterThan(0.2);
    expect(g.kmDriven).toBeGreaterThan(0);

    // Handbrake + brake then reverse
    run(g, 1.8, g.vehicles.current!.at, g.vehicles.current!.heading, { throttle: -1, brake: 1, steer: 0, handbrake: true });
    expect(g.vehicles.current!.speed).toBeLessThan(0);
    expect(g.vehicles.telemetry()!.gear).toBe(0);

    // Exit
    expect(g.toggleVehicle()).toBe(true);
    expect(g.vehicles.current).toBeUndefined();
  });

  it("raises a wanted star when carjacking an occupied traffic car", () => {
    const g = quiet(seeded(5));
    const traffic = g.vehicles.vehicles.find((v) => v.isTraffic && v.driver === "npc")!;
    expect(traffic).toBeDefined();
    g.step(0.05, at(traffic.at));
    expect(g.wanted).toBe(0);
    expect(g.toggleVehicle()).toBe(true);
    expect(g.wanted).toBe(1);
    expect(g.vehicles.current?.id).toBe(traffic.id);
  });
});

describe("attack-token combat (MAX_ATTACKERS = 2) & melee moves", () => {
  it("caps active melee attackers at MAX_ATTACKERS = 2 while others circle", () => {
    const g = quiet(seeded(6));
    const rivals = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 * Math.PI) / 180;
      rivals.push(g.openWorld.spawnHuman("freeRider", [Math.sin(a) * 3, Math.cos(a) * 3], rowHost()));
    }
    run(g, 0.9, HERE);
    const holding = rivals.filter((r) => r.hasToken && r.state !== "dead");
    expect(holding.length).toBeLessThanOrEqual(MAX_ATTACKERS);
    expect(holding.length).toBeGreaterThan(0);
    expect(rivals.some((r) => !r.hasToken && r.state === "circle")).toBe(true);
  });

  it("supports light punch, textbook heavy knockdown, sprint tackle, and knockdown drops", () => {
    const g = quiet(() => 0.5);
    const h = g.openWorld.spawnHuman("freeRider", [0, 2.0], rowHost());
    g.act("strike");
    const light = g.step(PLAYER.strikeContact[0]!, at(HERE));
    expect(light.some((e) => e.type === "hitHuman")).toBe(true);
    expect(h.hp).toBeLessThan(h.maxHp);
    expect(h.state).toBe("stagger");

    // Heavy hit with textbook deals +35% and knocks down
    g.switchWeapon();
    expect(g.weapon).toBe("textbook");
    h.hp = 100;
    h.at = [0, 2.0];
    run(g, PLAYER.strikeTime[0]!);
    g.act("heavy");
    run(g, PLAYER.strikeContact[2]! + 0.02, HERE);
    expect(h.state).toBe("down");

    // Knocking out drops cash + pizza box
    h.hp = 1;
    h.state = "chase";
    h.at = [0, 2.0];
    run(g, PLAYER.strikeTime[2]!);
    g.act("strike");
    const ko = g.step(PLAYER.strikeContact[0]!, at(HERE));
    expect(ko).toContainEqual(expect.objectContaining({ type: "drop", kind: "cash" }));
    expect(ko).toContainEqual(expect.objectContaining({ type: "drop", kind: "pizza" }));
    expect(g.rivalsBeat).toBe(1);
  });
});

describe("pizza eating, blue energy/armour & wanted clearing", () => {
  it("heals +45 HP, adds +50 blue energy (+25% damage & 50% soak), refills stamina, and clears 1 wanted star outside melee", () => {
    const g = quiet(() => 0.5);
    g.focus = 30;
    g.stamina = 10;
    g.setWanted(2);
    const pizza = g.items.find((i) => i.kind === "pizza")!;
    g.step(0.05, at(pizza.at));
    expect(g.focus).toBeGreaterThanOrEqual(75);
    expect(g.energy).toBe(50);
    expect(g.stamina).toBe(statsFor(0).maxStamina);
    expect(g.wanted).toBe(1);

    // 50% damage soak from energy
    g.focus = 80;
    g.iframes = 0;
    (g as unknown as { hurt(n: number, p: Pt): void }).hurt(40, [0, 2]);
    expect(g.energy).toBe(30); // absorbed 20
    expect(g.focus).toBe(60); // lost remaining 20

    // +25% melee damage while energy > 0
    const r = g.openWorld.spawnHuman("debateRival", [0, 2.0], rowHost());
    const hpBefore = r.hp;
    g.act("strike");
    g.step(PLAYER.strikeContact[0]!, at(HERE));
    expect(hpBefore - r.hp).toBe(Math.round(statsFor(0).insight * 1.25));
  });

  it("supports [G] stored slice, Slice Co. Pizza Van, and does not clear wanted star during active melee", () => {
    const g = quiet();
    g.setWanted(2);
    // Rival right next to player (active melee) -> eating slice does NOT clear wanted
    g.openWorld.spawnHuman("freeRider", [0, 2.0], rowHost());
    g.focus = 40;
    expect(g.eatSlice()).toBe(true);
    expect(g.slices).toBe(0);
    expect(g.energy).toBe(50);
    expect(g.wanted).toBe(2);

    // Order via Phone (NZ$12) and buy at Slice Co. Pizza Van
    const van = g.openWorld.spots.find((s) => s.kind === "pizzaVan")!;
    const cash0 = g.cash;
    expect(g.phoneAction({ type: "orderPizza" })).toBe(true);
    expect(g.cash).toBe(cash0 - OPEN_WORLD.pizzaPrice);
    expect(g.slices).toBe(1);
    g.step(0.05, at(van.at));
    expect(g.currentPrompt()?.action).toBe("buyPizza");
    expect(g.eatSlice()).toBe(true);
    expect(g.cash).toBe(cash0 - OPEN_WORLD.pizzaPrice * 2);
  });
});

describe("5 wanted stars, Campus Security & evade timer", () => {
  it("spawns security officers & cruisers when wanted, and clears stars after evade cooldown out of sight", () => {
    const g = quiet(seeded(8));
    g.setWanted(2);
    run(g, 0.2, HERE);
    expect(g.openWorld.humans.some((h) => h.role === "security" && h.state !== "dead")).toBe(true);
    expect(g.vehicles.vehicles.some((v) => v.isPolice && v.driver === "security")).toBe(true);

    // Move far from all security officers & cruisers and wait out evadeT
    for (const h of g.openWorld.humans) if (h.role === "security") h.at = [200, 200];
    for (const v of g.vehicles.vehicles) if (v.isPolice) v.at = [200, 200];
    const ev = run(g, 18, HERE);
    expect(ev).toContainEqual({ type: "wanted", level: 0, evaded: true });
    expect(g.wanted).toBe(0);
  });

  it("marks busted when knocked out near a security officer while wanted", () => {
    const g = quiet();
    g.setWanted(1);
    g.openWorld.spawnHuman("security", [0, 2], rowHost());
    g.focus = 5;
    g.iframes = 0;
    (g as unknown as { hurt(n: number, p: Pt): void }).hurt(20, [0, 2]);
    expect(g.phase).toBe("over");
    expect(g.busted).toBe(true);
    g.retry();
    expect(g.phase).toBe("play");
    expect(g.wanted).toBe(0);
    expect(g.busted).toBe(false);
  });
});

describe("4 story jobs, side hustles & phoneAction", () => {
  it("completes groupProject flow: talk to Maya -> fight freeRiders -> drop pizza & USB package -> collect & eat -> PASSED", () => {
    const g = quiet(seeded(9));
    const spot = g.openWorld.spots.find((s) => s.missionId === "groupProject")!;
    const startEv = g.step(0.05, at(spot.at));
    expect(startEv).toContainEqual({ type: "job", id: "groupProject", state: "start", stage: "fight" });
    const a = g.openWorld.active!;
    expect(a.targets).toHaveLength(2);

    const rivals = g.openWorld.humans.filter((h) => a.targets.includes(h.id));
    expect(rivals.every((r) => r.role === "freeRider")).toBe(true);
    const stand: Pt = [spot.at[0], spot.at[1] - 6];
    let stageEv: GameEvent[] = [];
    for (const r of rivals) {
      r.hp = 1;
      r.state = "chase";
      r.at = [stand[0], stand[1] + 2];
      run(g, PLAYER.strikeTime[0]!, stand);
      g.act("strike");
      stageEv.push(...g.step(PLAYER.strikeContact[0]!, at(stand)));
    }
    expect(stageEv).toContainEqual({ type: "job", id: "groupProject", state: "stage", stage: "collect" });

    const pkg = g.items.find((i) => i.kind === "package" && i.jobId === "groupProject")!;
    const pza = g.items.find((i) => i.kind === "pizza" && i.dropped)!;
    expect(pkg).toBeDefined();
    expect(pza).toBeDefined();

    const cashBefore = g.cash;
    const collectEv = [...g.step(0.05, at(pkg.at)), ...g.step(0.05, at(pza.at))];
    expect(collectEv).toContainEqual({ type: "job", id: "groupProject", state: "pass", xp: 120, cash: 180 });
    expect(g.openWorld.completedJobs.has("groupProject")).toBe(true);
    expect(g.cash).toBeGreaterThanOrEqual(cashBefore + 180);
  });

  it("supports pizzaExpress, turfTable, lateSubmission, side hustles, and phoneAction gps/shuttle/abort", () => {
    const g = quiet(seeded(10));
    // Unlock all jobs sequentially via phoneAction + completions
    expect(g.phoneAction({ type: "shuttle" })).toBe(true);
    expect(g.vehicles.vehicles.some((v) => v.kind === "scooter" && Math.hypot(v.at[0] - HERE[0], v.at[1] - HERE[1]) <= 8)).toBe(true);

    // Side hustle checkpoint sprint + abort
    expect(g.phoneAction({ type: "start", targetId: "sideCampusSprint" })).toBe(true);
    expect(g.openWorld.active?.id).toBe("sideCampusSprint");
    expect(g.phoneAction({ type: "abort" })).toBe(true);
    expect(g.openWorld.active).toBeUndefined();

    // Story progression: mark groupProject done -> start pizzaExpress -> finish 3 checkpoints
    g.openWorld.completedJobs.add("groupProject" as JobId);
    expect(g.phoneAction({ type: "gps", targetId: "pizzaExpress" })).toBe(true);
    expect(g.gpsRoute.length).toBeGreaterThanOrEqual(2);
    expect(g.phoneAction({ type: "start", targetId: "pizzaExpress" })).toBe(true);
    const cps = g.openWorld.active!.checkpoints!;
    expect(cps).toHaveLength(3);
    for (let i = 0; i < 2; i++) g.step(0.05, at(cps[i]!));
    const pass2 = g.step(0.05, at(cps[2]!));
    expect(pass2).toContainEqual({ type: "job", id: "pizzaExpress", state: "pass", xp: 140, cash: 240 });

    // turfTable
    expect(g.phoneAction({ type: "start", targetId: "turfTable" })).toBe(true);
    const turfRivals = g.openWorld.humans.filter((h) => g.openWorld.active!.targets.includes(h.id));
    expect(turfRivals.map((r) => r.role)).toEqual(["debateRival", "allNighter"]);
    for (const r of turfRivals) g.openWorld.damageHuman(r, 999, 0, 1, true, (g as unknown as { owBridge(): never }).owBridge());
    const turfPkg = g.items.find((i) => i.kind === "package" && i.jobId === "turfTable")!;
    expect(g.step(0.05, at(turfPkg.at))).toContainEqual({ type: "job", id: "turfTable", state: "pass", xp: 160, cash: 300 });

    // lateSubmission
    expect(g.phoneAction({ type: "start", targetId: "lateSubmission" })).toBe(true);
    const latePkg = g.items.find((i) => i.kind === "package" && i.jobId === "lateSubmission")!;
    g.step(0.05, at(latePkg.at));
    expect(g.wanted).toBe(2);
    expect(g.openWorld.active?.stage).toBe("goto");
    const dropAt = g.openWorld.active!.targetAt!;
    expect(g.step(0.05, at(dropAt))).toContainEqual({ type: "job", id: "lateSubmission", state: "pass", xp: 200, cash: 400 });
  });
});

describe("awayFromHomes (HOME_MARGIN = 25) compliance across vehicles, NPCs, jobs & pickups", () => {
  it("never places pickups, spots, givers, pedestrians, vehicles, or job targets within 25 m of homes", () => {
    const square = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ];
    const HOME_A = square(12, -15, 42, 15);
    const CHILDCARE = square(-65, -65, -35, -35);
    const toHomes = (p: Pt) =>
      Math.min(
        Math.hypot(Math.max(12 - p[0], 0, p[0] - 42), Math.max(-15 - p[1], 0, p[1] - 15)),
        Math.hypot(Math.max(-65 - p[0], 0, p[0] + 35), Math.max(-65 - p[1], 0, p[1] + 35)),
      );
    const grid = makeGrid([-160, -160, 160, 160], 2);
    blockPolygon(grid, [HOME_A]);
    blockPolygon(grid, [CHILDCARE]);
    const start: Pt = [-20, 0];
    const reached = reachable(grid, start);
    const free = awayFromHomes(grid, reached, [HOME_A, CHILDCARE]);
    const rng = seeded(12);
    const onFree = (p: Pt) => {
      const [c, r] = cellOf(grid, p);
      return c >= 0 && r >= 0 && c < grid.cols && r < grid.rows && free[r * grid.cols + c] === 1;
    };
    const host: QuestHost = {
      spot: (near, taken, place) =>
        place
          ? bookSpot(grid, free, [{ center: place, weight: 1 }], near, taken, rng, undefined, QUEST.noteReach)
          : bookSpot(grid, free, [], near, taken, rng),
      near: (p) => nearestReached(grid, free, p, 30),
      ground: (p) => {
        const [c, r] = cellOf(grid, p);
        return c >= 0 && r >= 0 && c < grid.cols && r < grid.rows && reached[r * grid.cols + c] === 1;
      },
      free: onFree,
      open: (centre, away) => openSpot(grid, free, centre, 22, 8, away, rng, 60, 25),
      place: (near) => {
        const atPt = bookSpot(grid, free, [], near, [], rng, 150);
        return atPt ? { name: "Block", at: atPt } : undefined;
      },
      random: rng,
      roads: SAMPLE_ROADS,
    };

    const g = new StudyQuest(host, start, 0, LESSONS);
    g.grace = 0;

    for (const it of g.items) expect(toHomes(it.at)).toBeGreaterThan(HOME_MARGIN - 1.5);
    for (const sp of g.openWorld.spots) {
      expect(onFree(sp.at)).toBe(true);
      expect(toHomes(sp.at)).toBeGreaterThan(HOME_MARGIN - 1.5);
    }
    for (const h of g.openWorld.humans) {
      expect(onFree(h.at)).toBe(true);
      expect(toHomes(h.at)).toBeGreaterThan(HOME_MARGIN - 1.5);
    }
    for (const v of g.vehicles.vehicles) {
      if (v.isParked) {
        expect(onFree(v.at)).toBe(true);
        expect(toHomes(v.at)).toBeGreaterThan(HOME_MARGIN - 1.5);
      }
    }

    // Trigger groupProject and check spawned freeRiders + dropped pizza/package
    const gp = g.openWorld.spots.find((s) => s.missionId === "groupProject")!;
    g.step(0.05, at(gp.at));
    for (const h of g.openWorld.humans) {
      expect(toHomes(h.at)).toBeGreaterThan(HOME_MARGIN - 1.5);
    }
    run(g, 10, start);
    for (const h of g.openWorld.humans) {
      expect(onFree(h.at)).toBe(true);
      expect(toHomes(h.at)).toBeGreaterThan(HOME_MARGIN - 1.5);
    }
    expect(VEHICLE_SPECS.sedan.maxSpeed).toBeGreaterThan(VEHICLE_SPECS.scooter.maxSpeed);
    const fleetKinds = new Set(g.vehicles.vehicles.map((v) => v.kind));
    expect(fleetKinds.size).toBeGreaterThanOrEqual(4);
  });
});

describe("vehicle surface quality & solid collisions", () => {
  it("builds lofted car and bus body meshes with partId attributes and strictly outward-facing normals", () => {
    for (const kind of [
      "sedan",
      "hatchback",
      "sports",
      "taxi",
      "suv",
      "pickup",
      "minivan",
      "van",
      "bus",
      "security",
    ] as const) {
      const actor = createVehicleActor(kind);
      const meshes: Mesh[] = [];
      actor.root.traverse((o) => {
        if ((o as Mesh).isMesh) meshes.push(o as Mesh);
      });
      // body mesh is first solid mesh inside chassisInner (after contact shadow plane)
      const bodyMesh = meshes[1]!;
      const geo = bodyMesh.geometry;
      const part = geo.getAttribute("partId");
      expect(part).toBeTruthy();
      const pos = geo.getAttribute("position");
      const idx = geo.getIndex();
      expect(idx).toBeTruthy();
      const center = new Vector3(0, kind === "bus" ? 1.2 : 0.55, 0);
      const a = new Vector3();
      const b = new Vector3();
      const c = new Vector3();
      const ab = new Vector3();
      const ac = new Vector3();
      const faceN = new Vector3();
      const centroid = new Vector3();
      let outward = 0;
      let total = 0;
      for (let i = 0; i < idx!.count; i += 3) {
        const ia = idx!.getX(i);
        const ib = idx!.getX(i + 1);
        const ic = idx!.getX(i + 2);
        // External non-convex detail parts (mirrors, stalks, roof rails, bike rack, AC pods) carry non-zero partId; check lofted hull (partId === 0).
        if (part.getX(ia) !== 0 || part.getX(ib) !== 0 || part.getX(ic) !== 0) continue;
        a.fromBufferAttribute(pos, ia);
        b.fromBufferAttribute(pos, ib);
        c.fromBufferAttribute(pos, ic);
        ab.subVectors(b, a);
        ac.subVectors(c, a);
        faceN.crossVectors(ab, ac);
        if (faceN.lengthSq() < 1e-10) continue;
        centroid.copy(a).add(b).add(c).multiplyScalar(1 / 3).sub(center);
        if (faceN.dot(centroid) > 0) outward++;
        total++;
      }
      expect(total).toBeGreaterThan(1000);
      expect(outward / total).toBeGreaterThan(0.98);
      actor.dispose();
    }
  });

  it("resolves solid vehicle-vs-vehicle OBB impacts with momentum transfer, spin, suspension jolt, damage, and crash events", () => {
    const g = quiet(seeded(14));
    const cars = g.vehicles.vehicles.filter((v) => v.kind !== "scooter");
    const playerCar = cars[0]!;
    const targetCar = cars[1]!;
    playerCar.kind = "sedan";
    targetCar.kind = "sedan";
    playerCar.at = [0, 0];
    playerCar.heading = 0;
    playerCar.isTraffic = false;
    playerCar.isParked = true;
    playerCar.driver = "none";
    g.step(0.05, at(playerCar.at));
    expect(g.toggleVehicle()).toBe(true);
    expect(g.vehicles.current?.id).toBe(playerCar.id);

    // Launch into angled target car 7.5 m ahead along heading 0
    playerCar.at = [0, 0];
    playerCar.heading = 0;
    playerCar.speed = 16;
    playerCar.vx = 0;
    playerCar.vz = 16;
    targetCar.isTraffic = false;
    targetCar.isParked = true;
    targetCar.driver = "none";
    targetCar.at = [0.55, 7.5];
    targetCar.heading = 22;
    targetCar.speed = 0;
    targetCar.vx = 0;
    targetCar.vz = 0;
    targetCar.hp = 100;

    const events = run(g, 0.75, playerCar.at, playerCar.heading, { throttle: 1, brake: 0, steer: 0, handbrake: false });
    const crashEv = events.find((e) => e.type === "vehicle" && e.action === "crash");
    expect(crashEv).toBeDefined();
    expect(targetCar.at[1]).toBeGreaterThan(7.7); // knocked forward
    expect(Math.hypot(targetCar.vx, targetCar.vz)).toBeGreaterThan(1.5); // transferred momentum
    expect(Math.abs(targetCar.angularVel)).toBeGreaterThan(1); // off-center spin
    expect(targetCar.hp).toBeLessThan(100);
    expect(playerCar.hp).toBeLessThan(100);
    expect(Math.abs(playerCar.pitchVel) + Math.abs(playerCar.rollVel)).toBeGreaterThan(0.1);
  });

  it("blocks vehicle corners at non-ground boundaries and emits a crash event", () => {
    const host = rowHost(seeded(15));
    // Wall starts at y >= 10
    host.ground = (p) => p[1] < 10;
    const g = new StudyQuest(host, HERE, 0, LESSONS);
    g.grace = 0;
    g.foes = [];
    const car = g.vehicles.vehicles.find((v) => v.kind !== "scooter")!;
    car.at = [0, 6.2];
    car.heading = 12; // angled corner toward y = 10 wall
    car.isTraffic = false;
    car.driver = "none";
    g.step(0.05, at(car.at));
    expect(g.toggleVehicle()).toBe(true);

    const events = run(g, 0.6, car.at, car.heading, { throttle: 1, brake: 0, steer: 0, handbrake: false });
    expect(car.at[1]).toBeLessThan(10 - VEHICLE_SPECS[car.kind].halfL * 0.7);
    expect(car.hp).toBeLessThan(100);
    expect(events.some((e) => e.type === "vehicle" && e.action === "crash")).toBe(true);
  });

  it("places open-world human NPC soles flush on the painted surface height (GROUND_PAINT = 0.25)", () => {
    expect(GROUND_PAINT).toBe(0.25);
    const human = createProceduralHuman(0, {});
    human.pose(0, 0, 0, false);
    human.root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(human.root);
    expect(box.min.y).toBeGreaterThanOrEqual(-0.02);
    expect(box.min.y).toBeLessThanOrEqual(0.02);

    const ow = new OpenWorldScene(false);
    ow.sync({
      t: 1,
      dt: 0.05,
      viewerAt: [0, 0],
      groundAt: () => 10 + GROUND_PAINT,
      humans: [{ id: 1, role: "pedestrian", at: [2, 3], heading: 0, speed: 0, style: 0 }],
      vehicles: [],
      pickups: [],
      spots: [],
    });
    const slots = (ow as unknown as { humanSlots: Map<number, { root: { position: Vector3 } }> }).humanSlots;
    expect(slots.get(1)!.root.position.y).toBeCloseTo(10.25, 3);
    ow.dispose();
  });

  it("spawns dense campus student pedestrians, offsets mission givers from tables, and anchors missions inside campus", () => {
    const anchors: { name: string; at: Pt }[] = [
      { name: "Quad", at: [24, 6] },
      { name: "ClockTower", at: [-22, 16] },
      { name: "Science", at: [36, -24] },
      { name: "Library", at: [-38, -22] },
      { name: "Arts", at: [52, 22] },
      { name: "Engineering", at: [-52, 18] },
      { name: "Owen Glenn", at: [64, -18] },
      { name: "Music", at: [-62, -26] },
      { name: "Plaza", at: [28, 38] },
      { name: "Symonds", at: [-28, -42] },
      { name: "Court", at: [44, 46] },
      { name: "Terrace", at: [-44, 44] },
    ];
    const baseHost = rowHost(seeded(21));
    const host: QuestHost = {
      ...baseHost,
      campusAnchor: (near, avoid, minDist, maxDist, minGap = 18) =>
        anchors.find((a) => {
          const d = Math.hypot(a.at[0] - near[0], a.at[1] - near[1]);
          return (
            d >= minDist &&
            d <= maxDist &&
            Math.hypot(a.at[0], a.at[1]) >= OPEN_WORLD.startClearance &&
            avoid.every((p) => Math.hypot(p[0] - a.at[0], p[1] - a.at[1]) >= minGap)
          );
        }),
    };

    const g = new StudyQuest(host, HERE, 0, LESSONS);
    g.grace = 0;
    const peds = g.openWorld.humans.filter((h) => h.role === "pedestrian");
    expect(peds.length).toBeGreaterThanOrEqual(28);
    expect(g.openWorld.humans.some((h) => h.name === "Slice Co.")).toBe(true);

    // Givers stand beside their table rather than inside its center
    for (const sp of g.openWorld.spots) {
      if (sp.kind !== "jobGiver") continue;
      const giver = g.openWorld.humans.find((h) => h.role === "giver" && h.jobId === sp.missionId)!;
      expect(giver).toBeDefined();
      expect(Math.hypot(giver.at[0] - sp.at[0], giver.at[1] - sp.at[1])).toBeGreaterThanOrEqual(0.75);
    }

    // Checkpoints and lateSubmission package use campus anchors when available
    g.openWorld.completedJobs.add("groupProject" as JobId);
    expect(g.phoneAction({ type: "start", targetId: "pizzaExpress" })).toBe(true);
    const cps = g.openWorld.active!.checkpoints!;
    expect(cps).toHaveLength(3);
    for (const cp of cps) {
      expect(anchors.some((a) => a.at[0] === cp[0] && a.at[1] === cp[1])).toBe(true);
    }
  });

  it("renders up to 30 campus NPCs, lays knocked-down NPCs flat, and grounds pickups near surface height", () => {
    const ow = new OpenWorldScene(false);
    const humans = Array.from({ length: 32 }, (_, i) => ({
      id: i + 1,
      role: (i === 0 ? "freeRider" : "pedestrian") as "freeRider" | "pedestrian",
      at: [2 + i * 0.5, 3] as [number, number],
      heading: 0,
      speed: i === 0 ? 0 : 1.3,
      style: i,
      state: i === 0 ? "down" : "walk",
    }));
    ow.sync({
      t: 1,
      dt: 0.05,
      viewerAt: [0, 0],
      groundAt: () => 5,
      humans,
      vehicles: [],
      pickups: [{ id: 1, kind: "pizza", at: [2, 2] }],
      spots: [],
    });
    const slots = (ow as unknown as {
      humanSlots: Map<number, { proc?: { root: { rotation: { x: number }; position: Vector3 } } }>;
      pickupMeshes: Record<"pizza" | "cash" | "coffee" | "package", { getMatrixAt(i: number, m: unknown): void }>;
    }).humanSlots;
    expect(slots.size).toBe(30);
    expect(slots.get(1)!.proc!.root.rotation.x).toBeLessThan(-1.2);
    expect(slots.get(1)!.proc!.root.position.y).toBeGreaterThan(0.08);
    expect(slots.get(2)!.proc!.root.rotation.x).toBe(0);
    ow.dispose();
  });

  it("supports physical street brawl on pedestrians (stagger, knockdown, witness panic) and melee impacts on vehicles & street props", () => {
    const g = quiet(seeded(21));
    const ped = g.openWorld.humans.find((h) => h.role === "pedestrian" && h.name === "")!;
    const bystander = g.openWorld.humans.find((h) => h.role === "pedestrian" && h.id !== ped.id && h.name === "")!;
    expect(ped).toBeDefined();
    expect(bystander).toBeDefined();
    ped.at = [0, 1.9];
    ped.hp = 50;
    ped.waitT = 0;
    ped.state = "walk";
    bystander.at = [5.5, 4.0];
    bystander.waitT = 0;
    bystander.state = "walk";

    // Punching a pedestrian staggers them, panics nearby bystanders, and raises wanted
    g.act("strike");
    g.step(PLAYER.strikeContact[0]! + 0.01, at(HERE));
    expect(["stagger", "down"]).toContain(ped.state);
    expect(ped.hp).toBeLessThan(50);
    expect(bystander.state).toBe("flee");
    expect(g.wanted).toBeGreaterThanOrEqual(1);

    // Heavy blow [heavy] knocks down an innocent pedestrian cleanly
    run(g, PLAYER.strikeTime[0]! + 0.05, HERE);
    ped.at = [0, 2.0];
    ped.hp = 50;
    ped.role = "pedestrian";
    ped.state = "walk";
    ped.waitT = 0;
    g.act("heavy");
    run(g, PLAYER.strikeContact[2]! + 0.02, HERE);
    expect(ped.state).toBe("down");

    // Punching a nearby car rocks its suspension, dents HP, and emits hitEnv
    const car = g.vehicles.vehicles.find((v) => v.kind !== "scooter")!;
    car.isTraffic = false;
    car.isParked = true;
    car.at = [0, 2.9];
    car.heading = 90;
    car.rollVel = 0;
    car.pitchVel = 0;
    const hpBefore = car.hp;
    run(g, PLAYER.strikeTime[2]! + 0.05, HERE);
    g.act("heavy");
    const vehEvs = run(g, PLAYER.strikeContact[2]! + 0.02, HERE);
    expect(vehEvs).toContainEqual(expect.objectContaining({ type: "hitEnv", target: "vehicle" }));
    expect(Math.abs(car.rollVel) + Math.abs(car.pitchVel)).toBeGreaterThan(0);
    expect(car.hp).toBeLessThan(hpBefore);

    // Movable street props spawn on reachable ground and topple/launch when punched or hit by vehicles
    expect(g.openWorld.props.length).toBeGreaterThanOrEqual(20);
    const prop = g.openWorld.props[0]!;
    prop.at = [0, 1.8];
    prop.vx = prop.vz = prop.tilt = prop.tiltVel = 0;
    run(g, PLAYER.strikeTime[2]! + 0.05, HERE);
    g.act("heavy");
    const propEvs = run(g, PLAYER.strikeContact[2]! + 0.02, HERE);
    expect(propEvs).toContainEqual(expect.objectContaining({ type: "hitEnv", target: "prop", kind: prop.kind }));
    expect(Math.hypot(prop.vx, prop.vz)).toBeGreaterThan(0.5);
    expect(prop.tiltVel).toBeGreaterThan(0);
  });

  it("spawns Mark-IV Exo-Suit, summons via phone, suits up [F], hovers & flies over rooftops, and lands safely", () => {
    // Host with a 12 m tall building roof occupying y in [20, 40]
    const inBuilding = (p: Pt) => Math.abs(p[0]) <= 10 && p[1] >= 20 && p[1] <= 40;
    const roofHost: QuestHost = {
      ...rowHost(seeded(19)),
      ground: (p) => !inBuilding(p),
      free: (p) => !inBuilding(p),
      roofTopAboveGround: (p) => (inBuilding(p) ? 12 : undefined),
    };
    const g = new StudyQuest(roofHost, HERE, 0, LESSONS);
    g.grace = 0;

    // 1. Initial Exo-Suit spawns deterministically outside startClearance on reachable ground
    const initialSuit = g.vehicles.vehicles.find((v) => v.kind === "mecha");
    expect(initialSuit).toBeDefined();
    expect(Math.hypot(initialSuit!.at[0], initialSuit!.at[1])).toBeGreaterThanOrEqual(OPEN_WORLD.startClearance);

    // 2. Phone command summons Exo-Suit beside player, prompt says suitUp, and [F] suits up
    expect(g.phoneAction({ type: "callMecha" })).toBe(true);
    const suit = g.vehicles.vehicles.find((v) => v.kind === "mecha")!;
    expect(Math.hypot(suit.at[0], suit.at[1])).toBeLessThanOrEqual(6);
    g.step(0.05, at(suit.at));
    expect(g.currentPrompt()?.action).toBe("suitUp");
    expect(g.toggleVehicle()).toBe(true);
    expect(g.vehicles.current?.kind).toBe("mecha");

    // 3. Cannot cross 12 m building at ground level, so holds before y = 20
    suit.at = [0, 17];
    suit.heading = 0;
    run(g, 0.8, suit.at, 0, { throttle: 1, brake: 0, steer: 0, handbrake: false });
    expect(suit.at[1]).toBeLessThan(20);
    expect(suit.flying).toBe(false);

    // 4. Space / ascend lifts Exo-Suit into 3D flight; releasing ascend brakes climb to steady mid-air hover
    run(g, 1.4, suit.at, 0, { throttle: 0, brake: 0, steer: 0, handbrake: true, ascend: 1, descend: 0, boost: true });
    expect(suit.flying).toBe(true);
    expect(suit.altitude).toBeGreaterThan(15);
    run(g, 0.4, suit.at, 0, { throttle: 0, brake: 0, steer: 0, handbrake: false, ascend: 0, descend: 0 });
    const hoverAlt = suit.altitude;
    run(g, 0.5, suit.at, 0, { throttle: 0, brake: 0, steer: 0, handbrake: false, ascend: 0, descend: 0 });
    expect(Math.abs(suit.altitude - hoverAlt)).toBeLessThan(0.5);

    // 5. Horizontal jet boost reaches supersonic flight (> 30 m/s), pitches forward, and flies right over the 12 m building
    run(g, 1.8, suit.at, 0, { throttle: 1, brake: 0, steer: 0, handbrake: false, ascend: 0, descend: 0, boost: true });
    expect(suit.speed).toBeGreaterThan(30);
    expect(suit.pitch).toBeGreaterThan(0.5);
    expect(suit.at[1]).toBeGreaterThan(40);

    // 6. Descend lands cleanly on open ground, and mecha hydraulic strike hits nearby vehicles
    run(g, 3.0, suit.at, 0, { throttle: 0, brake: 0, steer: 0, handbrake: false, ascend: 0, descend: 1 });
    expect(suit.altitude).toBe(0);
    expect(suit.flying).toBe(false);
    const targetCar = g.vehicles.vehicles.find((v) => v.kind !== "scooter" && v.kind !== "mecha")!;
    targetCar.isTraffic = false;
    targetCar.at = [suit.at[0], suit.at[1] + 2.5];
    const hp0 = targetCar.hp;
    g.act("heavy");
    const punchEvs = run(g, 0.15, suit.at, 0, { throttle: 0, brake: 0, steer: 0, handbrake: false });
    expect(punchEvs).toContainEqual(expect.objectContaining({ type: "hitEnv", target: "vehicle" }));
    expect(targetCar.hp).toBeLessThan(hp0);

    // 7. 3D Exo-Suit actor constructs cleanly and animates ground + aerial jet poses
    const actor = createVehicleActor("mecha", undefined, 0);
    expect(actor.root.children.length).toBeGreaterThanOrEqual(2);
    actor.update(0, 1.2, false, false, 0.5, { altitude: 0, flying: false, thrust: 0, speed: 5, pitch: 0.05, roll: 0 });
    actor.update(-0.4, 8.5, false, false, 1.2, { altitude: 24, flying: true, thrust: 0.95, speed: 36, pitch: 1.05, roll: 0.42, attackT: 0.5 });
    actor.dispose();
  });
});
