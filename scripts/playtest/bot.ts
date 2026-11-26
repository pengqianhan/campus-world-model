// A headless playtest bot for Study Quest (Round 2 grounded open-world): it plays through the
// 4 story jobs (groupProject -> pizzaExpress -> turfTable -> lateSubmission), fights rival humans,
// dodges windups, eats pizza for blue energy/health, rides E-Scooters for timed deliveries, and
// evades Campus Security on a flat made-up campus.
import {
  PLAYER,
  RANKS,
  STORY_JOBS,
  StudyQuest,
  bearingTo,
  type GameEvent,
  type HumanNpc,
  type JobId,
  type QuestHost,
  type QuestKey,
  type RoadInput,
} from "../../src/shared/game.ts";
import { encodeRing, type Pt } from "../../src/shared/geo.ts";

export interface Profile {
  id: string;
  react: number;
  jitter: number;
  dodge: number;
  learn: number;
  dodgeMax: number;
  strikeGap: number;
  speed: number;
  detour: number;
  card: number;
  eureka: number;
  coffee: boolean;
  side: boolean;
}

export const PROFILES = {
  novice: { id: "novice", react: 0.65, jitter: 0.22, dodge: 0.25, learn: 0.08, dodgeMax: 0.6, strikeGap: 0.48, speed: 2.3, detour: 1.4, card: 0.15, eureka: 0.3, coffee: false, side: false },
  average: { id: "average", react: 0.35, jitter: 0.1, dodge: 0.65, learn: 0.03, dodgeMax: 0.8, strikeGap: 0.3, speed: 3.1, detour: 1.2, card: 0.6, eureka: 0.8, coffee: true, side: true },
  expert: { id: "expert", react: 0.18, jitter: 0.05, dodge: 0.92, learn: 0, dodgeMax: 0.92, strikeGap: 0.25, speed: 3.5, detour: 1.1, card: 1.4, eureka: 1, coffee: true, side: false },
} satisfies Record<string, Profile>;
export type ProfileId = keyof typeof PROFILES;

export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLOSE_REACH = 75;
const CLOSE_ITEMS = 10;
const GAP = 8;

const TEST_ROADS: RoadInput[] = [
  { k: "major", p: encodeRing([[-180, 35], [0, 35], [180, 35]]) },
  { k: "street", p: encodeRing([[0, -160], [0, 35], [0, 160]]) },
];

export function openHost(random: () => number): QuestHost {
  const around = (c: Pt, lo: number, hi: number): Pt => {
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(lo * lo + random() * (hi * hi - lo * lo));
    return [c[0] + Math.sin(a) * r, c[1] + Math.cos(a) * r];
  };
  return {
    spot(near, taken, place) {
      for (let k = 0; k < 40; k++) {
        let p: Pt;
        if (place) p = around(place, 0, 45);
        else {
          const close = taken.filter((t) => Math.hypot(t[0] - near[0], t[1] - near[1]) <= CLOSE_REACH).length;
          p = close < CLOSE_ITEMS ? around(near, GAP, CLOSE_REACH) : around(near, 20, 200);
        }
        if (Math.hypot(p[0] - near[0], p[1] - near[1]) < GAP) continue;
        if (taken.some((t) => Math.hypot(t[0] - p[0], t[1] - p[1]) < GAP)) continue;
        return p;
      }
      return undefined;
    },
    place(near, avoid) {
      for (let k = 0; k < 30; k++) {
        const centre = around(near, 70, 140);
        if (!avoid.every((a) => Math.hypot(a[0] - centre[0], a[1] - centre[1]) > 40)) continue;
        return { name: "Quad", at: centre };
      }
      return { name: "Quad", at: around(near, 70, 140) };
    },
    random,
    roads: TEST_ROADS,
  };
}

export interface RunResult {
  profile: string;
  seed: number;
  bossAt?: number;
  victory: boolean;
  seconds: number;
  rankAt: (number | undefined)[];
  deaths: Partial<Record<QuestKey, number>>;
  deathCount: number;
  focusAfter: number[];
  bossFight?: number;
  bossTries: number;
  maxQuiet: number;
  maxIdle: number;
  questAt: Partial<Record<QuestKey, number>>;
  grade?: string;
  xp: number;
  cash: number;
  jobsDone: number;
  pizzasEaten: number;
}

const D2R = Math.PI / 180;
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function gauss(r: () => number): number {
  return (r() + r() + r() - 1.5) * 1.15;
}

/** Plays one full Round 2 story run (`groupProject` -> `pizzaExpress` -> `turfTable` -> `lateSubmission`). */
export function play(p: Profile, seed: number, opts: { maxSeconds?: number; maxDeaths?: number; dt?: number; seen?: readonly string[] } = {}): RunResult {
  const maxSeconds = opts.maxSeconds ?? 600;
  const maxDeaths = opts.maxDeaths ?? 10;
  const dt = opts.dt ?? 0.05;
  const rnd = seeded(seed * 7919 + 13);
  const host = openHost(seeded(seed));
  let me: Pt = [0, 0];
  let heading = 0;
  const g = new StudyQuest(host, me, heading, opts.seen);

  const res: RunResult = {
    profile: p.id,
    seed,
    victory: false,
    seconds: 0,
    rankAt: [0],
    deaths: {},
    deathCount: 0,
    focusAfter: [],
    bossTries: 0,
    maxQuiet: 0,
    maxIdle: 0,
    questAt: {},
    xp: 0,
    cash: g.cash,
    jobsDone: 0,
    pizzasEaten: 0,
  };

  let lastBeat = 0;
  let lastBusy = 0;
  let dodge = p.dodge;
  let nextStrike = 0;
  let dodgeAt = Infinity;
  const seenWindup = new Set<number>();
  let inFight = false;
  let calmFor = 0;
  let fightLen = 0;
  let clock = 0;

  const beat = () => {
    res.maxQuiet = Math.max(res.maxQuiet, g.seconds - lastBeat);
    lastBeat = g.seconds;
    busy();
  };
  const busy = () => {
    res.maxIdle = Math.max(res.maxIdle, g.seconds - lastBusy);
    lastBusy = g.seconds;
  };

  const nextStoryJob = (): JobId | undefined =>
    STORY_JOBS.find((j) => !g.openWorld.completedJobs.has(j.id) && g.openWorld.isJobAvailable(j.id))?.id;

  while (g.seconds < maxSeconds && clock < maxSeconds * 1.5) {
    clock += dt;

    // 1. Eat stored slice or order pizza if hurt
    if (g.focus < g.stats.maxFocus * 0.5 && g.stamina > 0) {
      if (g.slices > 0) g.eatSlice();
      else if (g.cash >= 12) {
        g.phoneAction({ type: "orderPizza" });
        g.eatSlice();
      }
    }

    // 2. React to enemy windups with dodge
    const liveEnemies = g.openWorld.humans.filter(
      (h) => h.state !== "dead" && h.state !== "down" && (h.isMissionTarget || h.role === "security" || h.role === "freeRider" || h.role === "debateRival" || h.role === "allNighter"),
    );
    for (const h of liveEnemies) {
      if (h.state === "windup" && !seenWindup.has(h.id)) {
        seenWindup.add(h.id);
        if (dist(h.at, me) < 3.2 && rnd() < dodge) {
          dodgeAt = Math.min(dodgeAt, clock + Math.max(0.04, p.react + gauss(rnd) * p.jitter));
        }
      } else if (h.state !== "windup") {
        seenWindup.delete(h.id);
      }
    }
    if (clock >= dodgeAt && g.stamina >= PLAYER.dodgeCost && !g.vehicles.current) {
      dodgeAt = Infinity;
      g.act("dodge");
    }

    // 3. Determine navigation target
    const active = g.openWorld.active;
    let fightTarget: HumanNpc | undefined;
    if (active?.stage === "fight") {
      const targets = liveEnemies.filter((h) => active.targets.includes(h.id));
      if (targets.length) fightTarget = targets.reduce((a, b) => (dist(a.at, me) < dist(b.at, me) ? a : b));
    }

    let navTarget: Pt | undefined;
    let useScooter = false;

    if (fightTarget) {
      navTarget = fightTarget.at;
    } else if (active?.stage === "collect") {
      const pkg = g.items.find((i) => i.kind === "package" && (!i.jobId || i.jobId === active.id));
      const pza = g.items.find((i) => i.kind === "pizza");
      if (pkg && !active.gotPackage) navTarget = pkg.at;
      else if (pza && !active.gotPizza) navTarget = pza.at;
      else if (active.id === "groupProject" && !active.gotPizza) {
        if (g.slices > 0) g.eatSlice();
        else if (g.cash >= 12) {
          g.phoneAction({ type: "orderPizza" });
          g.eatSlice();
        }
      }
    } else if (active?.stage === "checkpoints" && active.checkpoints) {
      navTarget = active.checkpoints[active.got];
      useScooter = true;
    } else if (active?.stage === "goto" && active.targetAt) {
      navTarget = active.targetAt;
      useScooter = true;
    } else {
      const nj = nextStoryJob();
      if (nj) {
        navTarget = g.openWorld.spots.find((s) => s.missionId === nj)?.at;
      }
    }

    // Use E-Scooter for checkpoint/getaway runs if not already driving
    if (useScooter && !g.vehicles.current && navTarget && dist(me, navTarget) > 14) {
      const nearSc = g.vehicles.nearestEnterable(me);
      if (nearSc) g.toggleVehicle();
      else {
        g.phoneAction({ type: "shuttle" });
        const sc = g.vehicles.nearestEnterable(me);
        if (sc) g.toggleVehicle();
      }
    } else if (!useScooter && g.vehicles.current && (!navTarget || dist(me, navTarget) < 12)) {
      g.toggleVehicle();
    }

    // 4. Move or Drive toward navTarget
    let vehCtrl = { throttle: 0, brake: 0, steer: 0, handbrake: false };
    if (g.vehicles.current && navTarget) {
      const desired = bearingTo(me, navTarget);
      const diff = ((((desired - g.vehicles.current.heading) % 360) + 540) % 360) - 180;
      vehCtrl = {
        throttle: dist(me, navTarget) > 6 ? 1 : 0,
        brake: dist(me, navTarget) <= 6 ? 1 : 0,
        steer: Math.max(-1, Math.min(1, diff / 35)),
        handbrake: Math.abs(diff) > 95 && g.vehicles.current.speed > 7,
      };
    } else if (navTarget && g.dodgeT <= 0) {
      const d = dist(navTarget, me);
      const stop = fightTarget ? 1.8 : 0.6;
      if (d > 0.25) heading = bearingTo(me, navTarget);
      if (d > stop) {
        const v = (fightTarget ? p.speed : p.speed / p.detour) * g.orders.slow;
        const go = Math.min(d - stop, v * dt);
        me = [me[0] + Math.sin(heading * D2R) * go, me[1] + Math.cos(heading * D2R) * go];
      }
      if (fightTarget && d <= PLAYER.strikeReach && clock >= nextStrike) {
        g.act(g.combo === 2 ? "heavy" : "strike");
        nextStrike = clock + p.strikeGap * (0.85 + rnd() * 0.3);
      }
    }

    const evs: GameEvent[] = g.step(dt, { at: me, heading, active: true, pace: 1 }, vehCtrl);
    if (g.vehicles.current) {
      me = [g.vehicles.current.at[0], g.vehicles.current.at[1]];
      heading = g.vehicles.current.heading;
    } else {
      me = [me[0] + g.orders.shove[0], me[1] + g.orders.shove[1]];
      if (g.orders.face !== undefined) heading = g.orders.face;
    }

    for (const e of evs) {
      if (e.type === "rank") {
        res.rankAt[e.rank] = g.seconds;
        beat();
      } else if (e.type === "job" || e.type === "checkpoint") {
        beat();
      }
    }

    const near = liveEnemies.some((h) => dist(h.at, me) < 12);
    if (near) {
      busy();
      calmFor = 0;
      fightLen += dt;
      inFight = true;
    } else if (inFight && (calmFor += dt) > 2) {
      if (fightLen > 2) res.focusAfter.push(g.focus / g.stats.maxFocus);
      inFight = false;
      fightLen = 0;
    }

    // Victory when all 4 story jobs are completed
    if (g.openWorld.completedJobs.size >= STORY_JOBS.length) {
      res.victory = true;
      res.bossAt = g.seconds;
      res.bossFight = 0;
      res.bossTries = 1;
      res.grade = g.deaths === 0 && g.seconds < 240 ? "A+" : g.deaths === 0 ? "A" : "B";
      break;
    }

    if (g.phase === "over" && !g.victory) {
      res.deathCount++;
      if (res.deathCount > maxDeaths) break;
      dodge = Math.min(p.dodgeMax, dodge + p.learn);
      seenWindup.clear();
      dodgeAt = Infinity;
      for (const e of g.retry()) {
        if (e.type === "retry") {
          me = [e.at[0], e.at[1]];
          heading = e.heading;
        }
      }
    }
  }

  res.seconds = g.seconds;
  res.xp = g.xp;
  res.cash = g.cash;
  res.jobsDone = g.openWorld.completedJobs.size;
  res.pizzasEaten = g.pizzasEaten;
  res.maxQuiet = Math.max(res.maxQuiet, g.seconds - lastBeat);
  res.maxIdle = Math.max(res.maxIdle, g.seconds - lastBusy);
  return res;
}

export function quantile(xs: readonly number[], q: number): number | undefined {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const i = (s.length - 1) * q;
  const lo = Math.floor(i);
  return s[lo]! + (s[Math.min(s.length - 1, lo + 1)]! - s[lo]!) * (i - lo);
}

export interface Summary {
  profile: string;
  runs: number;
  reachBoss: number;
  victory: number;
  bossMin?: [number, number, number];
  rankMin: (number | undefined)[];
  deaths: Partial<Record<QuestKey, number>>;
  deathsTotal: number;
  focusAfter: [number, number];
  bossFightMin?: number;
  quiet: [number, number];
  idle: [number, number];
  grades: Record<string, number>;
  aPlusClean?: number;
  aPlusDefeated?: number;
}

export function summarise(rs: readonly RunResult[]): Summary {
  const n = rs.length;
  const reached = rs.filter((r) => r.bossAt !== undefined);
  const won = rs.filter((r) => r.victory);
  const deaths: Partial<Record<QuestKey, number>> = {};
  for (const r of rs) for (const [k, v] of Object.entries(r.deaths)) deaths[k as QuestKey] = (deaths[k as QuestKey] ?? 0) + v / n;
  const focus = rs.flatMap((r) => r.focusAfter);
  const grades: Record<string, number> = {};
  for (const r of won) grades[r.grade!] = (grades[r.grade!] ?? 0) + 1;
  const clean = won.filter((r) => r.deathCount === 0);
  const dirty = won.filter((r) => r.deathCount > 0);
  const boss = reached.map((r) => r.bossAt! / 60);
  return {
    profile: rs[0]?.profile ?? "",
    runs: n,
    reachBoss: reached.length / n,
    victory: won.length / n,
    bossMin: boss.length ? [quantile(boss, 0.5)!, quantile(boss, 0.25)!, quantile(boss, 0.75)!] : undefined,
    rankMin: RANKS.map((_, k) => quantile(rs.flatMap((r) => (r.rankAt[k] !== undefined ? [r.rankAt[k]! / 60] : [])), 0.5)),
    deaths,
    deathsTotal: rs.reduce((s, r) => s + r.deathCount, 0) / n,
    focusAfter: [focus.reduce((s, x) => s + x, 0) / Math.max(1, focus.length), quantile(focus, 0.1) ?? 0],
    bossFightMin: quantile(
      won.flatMap((r) => (r.bossFight !== undefined ? [r.bossFight / 60] : [])),
      0.5,
    ),
    quiet: [quantile(rs.map((r) => r.maxQuiet), 0.5)!, Math.max(...rs.map((r) => r.maxQuiet))],
    idle: [quantile(rs.map((r) => r.maxIdle), 0.5)!, Math.max(...rs.map((r) => r.maxIdle))],
    grades,
    aPlusClean: clean.length ? clean.filter((r) => r.grade === "A+").length / clean.length : undefined,
    aPlusDefeated: dirty.length ? dirty.filter((r) => r.grade === "A+").length / dirty.length : undefined,
  };
}

export function playMany(id: ProfileId, runs: number, opts: Parameters<typeof play>[2] = {}, firstSeed = 1): RunResult[] {
  const out: RunResult[] = [];
  for (let s = 0; s < runs; s++) out.push(play(PROFILES[id], firstSeed + s, opts));
  return out;
}
