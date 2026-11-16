// A headless playtest bot for Study Quest: it plays whole runs over the rules in src/shared/game.ts,
// with nothing drawn, on a flat made-up campus, as a novice, an average or an expert player would.
// It sees what a player sees (the warnings on the ground, what flies, the rings), reacts after its
// profile's reaction time, and dodges, strikes and throws as often as its profile does. What it
// measures (time to each rank, defeats per quest, Focus left after fights, time to the boss and to
// beat it, the longest stretch without a new beat) is what the curve is tuned by
// (scripts/playtest/report.ts) and what tests/playtest.test.ts guards.
import { FOES, PLAYER, QUEST, RANKS, StudyQuest, bearingTo, type Foe, type GameEvent, type QuestHost, type QuestKey } from "../../src/shared/game.ts";
import type { Pt } from "../../src/shared/geo.ts";

export interface Profile {
  id: string;
  /** Seconds from seeing a warning to acting on it, and the spread of its timing. */
  react: number;
  jitter: number;
  /** Chance that it dodges an attack it sees coming, and how much that grows with each defeat (it learns), to at most `dodgeMax`. */
  dodge: number;
  learn: number;
  dodgeMax: number;
  /** Seconds between presses of the strike. */
  strikeGap: number;
  /** Metres a second on foot (a mix of walking and running), and how much longer its ways are than a straight line. */
  speed: number;
  detour: number;
  /** Chance a second that it throws a flashcard at a foe out of reach, and that it lets the Eureka go when it can. */
  card: number;
  eureka: number;
  /** Whether it fetches coffee when its Focus is low, and does side quests near its way. */
  coffee: boolean;
  side: boolean;
}

export const PROFILES = {
  novice: { id: "novice", react: 0.65, jitter: 0.22, dodge: 0.25, learn: 0.07, dodgeMax: 0.55, strikeGap: 0.5, speed: 2.1, detour: 1.5, card: 0.15, eureka: 0.3, coffee: false, side: false },
  average: { id: "average", react: 0.38, jitter: 0.12, dodge: 0.6, learn: 0.03, dodgeMax: 0.75, strikeGap: 0.32, speed: 2.9, detour: 1.3, card: 0.6, eureka: 0.8, coffee: true, side: true },
  expert: { id: "expert", react: 0.2, jitter: 0.05, dodge: 0.93, learn: 0, dodgeMax: 0.93, strikeGap: 0.27, speed: 3.4, detour: 1.15, card: 1.5, eureka: 1, coffee: true, side: false },
} satisfies Record<string, Profile>;
export type ProfileId = keyof typeof PROFILES;

/** A repeatable Math.random (mulberry32). */
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

/** Metres from the walker within which the scene lays pick-ups first (scene/game.ts CLOSE_REACH), and how many. */
const CLOSE_REACH = 75;
const CLOSE_ITEMS = 12;
const BOOK_GAP = 8;
/** Metres round its building within which a quest's place or note lies (scene/game.ts, DRAW_REACH). */
const DRAW_REACH = 70;

/**
 * A flat, open made-up campus that lays pick-ups and quest places as the scene does: books first
 * near the walker, then round buildings further off; places a building's distance away, as the
 * scene's QUEST.placeRange gives (or its old 50 to 260 m).
 */
export function openHost(random: () => number): QuestHost {
  const range = (QUEST as { placeRange?: readonly [number, number] }).placeRange ?? [50, 260];
  const noteReach = (QUEST as { noteReach?: number }).noteReach ?? DRAW_REACH;
  const around = (c: Pt, lo: number, hi: number): Pt => {
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(lo * lo + random() * (hi * hi - lo * lo));
    return [c[0] + Math.sin(a) * r, c[1] + Math.cos(a) * r];
  };
  return {
    spot(near, taken, place) {
      for (let k = 0; k < 40; k++) {
        let p: Pt;
        if (place) p = around(place, 0, noteReach);
        else {
          const close = taken.filter((t) => Math.hypot(t[0] - near[0], t[1] - near[1]) <= CLOSE_REACH).length;
          p = close < CLOSE_ITEMS ? around(near, BOOK_GAP, CLOSE_REACH) : around(near, 20, 220);
        }
        if (Math.hypot(p[0] - near[0], p[1] - near[1]) < BOOK_GAP) continue;
        if (taken.some((t) => Math.hypot(t[0] - p[0], t[1] - p[1]) < BOOK_GAP)) continue;
        return p;
      }
      return undefined;
    },
    place(near, avoid) {
      for (let k = 0; k < 30; k++) {
        const centre = around(near, range[0], range[1]);
        if (!avoid.every((a) => Math.hypot(a[0] - centre[0], a[1] - centre[1]) > 60)) continue;
        // The place itself is reachable ground beside the building.
        return { name: "Hall", at: around(centre, 0, 25) };
      }
      return { name: "Hall", at: around(near, range[0], range[1]) };
    },
    random,
  };
}

export interface RunResult {
  profile: string;
  seed: number;
  /** Seconds of play when it first stood in the boss's arena; undefined when it never did. */
  bossAt?: number;
  victory: boolean;
  /** Seconds of play in all. */
  seconds: number;
  /** Seconds of play at which it reached each rank (index: the rank). */
  rankAt: (number | undefined)[];
  /** Times it was burnt out, by the main quest it was on. */
  deaths: Partial<Record<QuestKey, number>>;
  deathCount: number;
  /** Focus left after each fight, as a share of the most it can have. */
  focusAfter: number[];
  /** Seconds from first standing in the arena to beating the boss, retries and all; and the attempts. */
  bossFight?: number;
  bossTries: number;
  /** The longest stretch, seconds, with no new beat: a quest begun, furthered or done, a rank, a wave, a new villain, a phase. */
  maxQuiet: number;
  /** The longest stretch with no beat and no fight. */
  maxIdle: number;
  /** Seconds at which each main quest began. */
  questAt: Partial<Record<QuestKey, number>>;
  grade?: string;
  xp: number;
}

type Threat = { at: number; kind: "circle" | "line" | "shot" | "wave" | "melee"; ref: number };

const D2R = Math.PI / 180;
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Keeps a whole copy of a game, for rules that have no retry of their own (the rules before the retry). */
function copyGame(g: StudyQuest): StudyQuest {
  const c = Object.create(Object.getPrototypeOf(g)) as Record<string, unknown>;
  for (const [k, v] of Object.entries(g)) c[k] = k === "host" ? v : structuredClone(v);
  return c as unknown as StudyQuest;
}

type Retryable = StudyQuest & { retry?: () => GameEvent[] };

/**
 * Plays one run: from the start to the Final Exam beaten, or until `maxSeconds` of play or
 * `maxDeaths` defeats. On a defeat it retries from the last checkpoint, with the rules' own retry
 * when they have one, or from a copy kept at the start of each main quest when they do not.
 */
export function play(p: Profile, seed: number, opts: { maxSeconds?: number; maxDeaths?: number; dt?: number; seen?: readonly string[] } = {}): RunResult {
  const maxSeconds = opts.maxSeconds ?? 1800;
  const maxDeaths = opts.maxDeaths ?? 15;
  const dt = opts.dt ?? 0.05;
  const rnd = seeded(seed * 7919 + 13);
  const host = openHost(seeded(seed));
  let me: Pt = [0, 0];
  let heading = 0;
  const Ctor = StudyQuest as unknown as new (h: QuestHost, at: Pt, heading?: number, seen?: readonly string[]) => StudyQuest;
  let g = new Ctor(host, me, heading, opts.seen) as Retryable;
  const native = typeof g.retry === "function";
  let saved = native ? undefined : { game: copyGame(g), me: [0, 0] as Pt };
  let savedStep = g.mainStep;

  const res: RunResult = { profile: p.id, seed, victory: false, seconds: 0, rankAt: [0], deaths: {}, deathCount: 0, focusAfter: [], bossTries: 0, maxQuiet: 0, maxIdle: 0, questAt: { orientation: 0 }, xp: 0 };
  const decided = new Set<string>();
  const threats: Threat[] = [];
  let lockHeadingUntil = -1;
  let nextStrike = 0;
  let slow = 1;
  let lastBeat = 0;
  let lastBusy = 0;
  let dodge = p.dodge;
  let progress = "";
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
  const mainQuest = () => g.quests.find((q) => q.main);

  /** Where its quest leads, as the scene's compass does (scene/game.ts questTarget). */
  const questTarget = (): Pt | undefined => {
    const q = mainQuest();
    const sides = p.side ? g.quests.filter((x) => !x.main) : [];
    const targetOf = (q: NonNullable<ReturnType<typeof mainQuest>>): Pt | undefined => {
      if (q.goal === "defeat" && q.started) {
        const fs = g.foes.filter((f) => f.quest === q.id && f.state !== "dead");
        if (fs.length) return fs.reduce((a, b) => (dist(a.at, me) < dist(b.at, me) ? a : b)).at;
      }
      if (q.goal === "collect" && q.started) {
        const ns = g.items.filter((i) => i.quest === q.id);
        if (ns.length) return ns.reduce((a, b) => (dist(a.at, me) < dist(b.at, me) ? a : b)).at;
      }
      if (q.goal === "boss" && g.boss) return g.boss.at;
      if (q.key === "orientation") {
        const bs = g.items.filter((i) => i.kind === "book");
        if (bs.length) return bs.reduce((a, b) => (dist(a.at, me) < dist(b.at, me) ? a : b)).at;
      }
      return q.place?.at;
    };
    const main = q ? targetOf(q) : undefined;
    // A side quest near the way is done on the way.
    for (const s of sides) {
      const t = targetOf(s);
      if (t && main && dist(t, me) < 60 && dist(t, me) < dist(main, me)) return t;
    }
    return main;
  };

  while (g.seconds < maxSeconds && clock < maxSeconds * 1.5) {
    clock += dt;
    const live = g.foes.filter((f) => f.state !== "dead" && f.state !== "rise");
    // What it sees coming, and whether it will dodge it.
    for (const t of g.tells) {
      const key = `t${t.id}`;
      if (decided.has(key)) continue;
      decided.add(key);
      const hits = t.shape === "circle" ? dist(t.at, me) <= t.radius + 0.8 : lineGap(me, t.at, t.dir, t.length) <= t.width / 2 + 1.2;
      // Too slow, and the dodge comes after the attack has landed.
      if (hits && rnd() < dodge) threats.push({ at: clock + Math.max(0.05, p.react + gauss(rnd) * p.jitter), kind: t.shape, ref: t.id });
    }
    for (const f of live) {
      if (f.state !== "tell" || f.move?.type !== "melee") continue;
      const key = `m${f.id}:${Math.round(f.cool * 10)}`;
      if (decided.has(key)) continue;
      decided.add(key);
      if (dist(f.at, me) <= FOES[f.kind].reach + FOES[f.kind].radius + 0.6 && rnd() < dodge * 0.7) threats.push({ at: clock + p.react + gauss(rnd) * p.jitter, kind: "melee", ref: f.id });
    }
    for (const s of g.shots) {
      if (s.mine) continue;
      const key = `s${s.id}`;
      if (decided.has(key)) continue;
      // An answer thrown at it: it sees it once it is on its way, if it will pass close.
      const rel: Pt = [me[0] - s.at[0], me[1] - s.at[1]];
      const v = Math.hypot(s.vel[0], s.vel[1]);
      const along = (rel[0] * s.vel[0] + rel[1] * s.vel[1]) / v;
      if (along < 0) continue;
      const miss = Math.abs(rel[0] * s.vel[1] - rel[1] * s.vel[0]) / v;
      decided.add(key);
      if (miss < 1.3 && rnd() < dodge) threats.push({ at: clock + Math.max(0.05, p.react + gauss(rnd) * p.jitter), kind: "shot", ref: s.id });
    }
    for (const w of g.waves) {
      const key = `w${w.id}`;
      if (decided.has(key)) continue;
      decided.add(key);
      // A ring over the ground: the dodge's moment of no harm must be on it as it passes.
      const when = (dist(w.at, me) - w.r) / w.speed - 0.12;
      if (rnd() < dodge) threats.push({ at: clock + Math.max(0.02, when + gauss(rnd) * p.jitter * 1.4), kind: "wave", ref: w.id });
    }

    // A dodge that is due.
    threats.sort((a, b) => a.at - b.at);
    if (threats.length && threats[0]!.at <= clock) {
      const th = threats.shift()!;
      const dir = escape(g, th, me, heading);
      if (dir !== undefined && g.stamina >= PLAYER.dodgeCost) {
        heading = dir;
        lockHeadingUntil = clock + 0.35;
        g.act("dodge");
      }
    }

    // What it goes for: a foe close by, then coffee when low, then its quest.
    const boss = g.boss;
    let foe: Foe | undefined = boss && g.arena?.active ? boss : undefined;
    if (!foe) {
      let best = Infinity;
      for (const f of live) {
        const d = dist(f.at, me);
        const engage = f.quest && f.quest === mainQuest()?.id ? 40 : 9;
        if (d < engage && d < best) (best = d), (foe = f);
      }
    }
    let target: Pt | undefined;
    let travel = false;
    if (foe) target = foe.at;
    else {
      const s = g.stats;
      const coffee = p.coffee && g.focus < s.maxFocus * 0.45 ? g.items.filter((i) => i.kind === "coffee" && dist(i.at, me) < 60).sort((a, b) => dist(a.at, me) - dist(b.at, me))[0] : undefined;
      target = coffee?.at ?? questTarget();
      travel = true;
    }
    if (target && clock >= lockHeadingUntil && g.dodgeT <= 0) {
      const d = dist(target, me);
      const stop = foe ? PLAYER.strikeReach + FOES[foe.kind].radius - 0.7 : 0.5;
      if (d > 0.3) heading = bearingTo(me, target);
      if (d > stop) {
        const v = (travel ? p.speed / p.detour : p.speed) * slow;
        const go = Math.min(d - stop, v * dt);
        me = [me[0] + Math.sin(heading * D2R) * go, me[1] + Math.cos(heading * D2R) * go];
      }
      if (foe) {
        if (d <= stop + 0.6 && clock >= nextStrike) {
          g.act("strike");
          nextStrike = clock + p.strikeGap * (0.85 + rnd() * 0.3);
        } else if (d > 7 && d < 26 && g.has("flashcard") && g.stamina >= PLAYER.cardCost + PLAYER.dodgeCost && rnd() < p.card * dt) g.act("card");
        if (g.has("eureka") && g.eurekaMeter >= PLAYER.eurekaCharge) {
          const near = live.filter((f) => dist(f.at, me) < PLAYER.eurekaRadius + FOES[f.kind].radius).length;
          if ((near >= 2 || (foe.kind === "exam" && d < 9) || foe.kind === "ddl") && rnd() < p.eureka * dt * 4) g.act("eureka");
        }
      }
    }

    const wasArena = !!g.arena?.active;
    const wasStep = g.mainStep;
    const evs: GameEvent[] = g.step(dt, { at: me, heading, active: true, pace: 1 });
    const o = g.orders;
    me = [me[0] + o.shove[0], me[1] + o.shove[1]];
    if (o.face !== undefined && clock >= lockHeadingUntil) heading = o.face;
    slow = o.slow;
    if (!wasArena && g.arena?.active) {
      res.bossTries++;
      if (res.bossAt === undefined) res.bossAt = g.seconds;
    }
    for (const e of evs) {
      if (e.type === "rank") {
        res.rankAt[e.rank] = g.seconds;
        beat();
      } else if (e.type === "quest") {
        if (!e.done && e.quest.main && res.questAt[e.quest.key] === undefined) res.questAt[e.quest.key] = g.seconds;
        if (e.quest.main) beat();
      } else if (e.type === "wave" || e.type === "phase") beat();
      else if (e.type === "arrive" && (e.first || e.kind === "ddl" || e.kind === "exam")) beat();
    }
    // The main quest furthered is a beat: a note found, one of its foes beaten.
    const mq = mainQuest();
    const now = mq ? `${mq.id}:${mq.got}` : "";
    if (mq && now !== progress && progress.startsWith(mq.id + ":")) beat();
    progress = now;
    // A fight is foes about; when they have gone for two seconds, the Focus it kept.
    const near = live.some((f) => dist(f.at, me) < 15);
    if (near) busy();
    if (near) {
      calmFor = 0;
      fightLen += dt;
      inFight = true;
    } else if (inFight && (calmFor += dt) > 2) {
      if (fightLen > 2) res.focusAfter.push(g.focus / g.stats.maxFocus);
      inFight = false;
      fightLen = 0;
    }
    // A new main quest is a checkpoint, for rules that keep none.
    if (!native && g.mainStep !== savedStep && g.phase === "play") {
      saved = { game: copyGame(g), me: [me[0], me[1]] };
      savedStep = g.mainStep;
    }
    if (g.phase === "over") {
      if (g.victory) {
        res.victory = true;
        const d = g.debrief();
        res.grade = d.grade;
        if (res.bossAt !== undefined) res.bossFight = g.seconds - res.bossAt;
        break;
      }
      const key = (mainQuest()?.key ?? "orientation") as QuestKey;
      res.deaths[key] = (res.deaths[key] ?? 0) + 1;
      res.deathCount++;
      if (res.deathCount > maxDeaths) break;
      dodge = Math.min(p.dodgeMax, dodge + p.learn);
      threats.length = 0;
      if (native) {
        for (const e of g.retry!()) if (e.type === "retry") ((me = [e.at[0], e.at[1]]), (heading = e.heading));
      } else if (saved) {
        const seconds = g.seconds;
        g = copyGame(saved.game) as Retryable;
        // The clock goes on through a retry: the time lost counts.
        g.seconds = seconds;
        me = [saved.me[0], saved.me[1]];
      }
      slow = 1;
      void wasStep;
    }
  }
  res.seconds = g.seconds;
  res.xp = g.xp;
  res.maxQuiet = Math.max(res.maxQuiet, g.seconds - lastBeat);
  res.maxIdle = Math.max(res.maxIdle, g.seconds - lastBusy);
  return res;
}

/** Which way to dodge out of a threat: out of a circle, across a line or a shot's path, any way through a ring. */
function escape(g: StudyQuest, th: Threat, me: Pt, heading: number): number | undefined {
  if (th.kind === "circle" || th.kind === "line") {
    const t = g.tells.find((x) => x.id === th.ref);
    if (!t) return undefined;
    if (t.shape === "circle") return dist(t.at, me) < 0.3 ? heading + 90 : bearingTo(t.at, me);
    // Across the line, to the side it stands on.
    const side = Math.sin((bearingTo(t.at, me) - t.dir) * D2R) >= 0 ? 90 : -90;
    return t.dir + side;
  }
  if (th.kind === "shot") {
    const s = g.shots.find((x) => x.id === th.ref);
    if (!s) return undefined;
    const dir = bearingTo([0, 0], s.vel);
    const side = Math.sin((bearingTo(s.at, me) - dir) * D2R) >= 0 ? 90 : -90;
    return dir + side;
  }
  if (th.kind === "melee") {
    const f = g.foes.find((x) => x.id === th.ref);
    return f ? bearingTo(f.at, me) : undefined;
  }
  return g.waves.some((w) => w.id === th.ref) ? heading : undefined;
}

function lineGap(p: Pt, a: Pt, dir: number, length: number): number {
  const ux = Math.sin(dir * D2R);
  const uy = Math.cos(dir * D2R);
  const t = Math.max(0, Math.min(length, (p[0] - a[0]) * ux + (p[1] - a[1]) * uy));
  return Math.hypot(p[0] - (a[0] + ux * t), p[1] - (a[1] + uy * t));
}

function gauss(r: () => number): number {
  return (r() + r() + r() - 1.5) * 1.15;
}

// ---------------------------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------------------------

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
  /** Share of runs that reached the boss's arena, and of runs that beat it. */
  reachBoss: number;
  victory: number;
  /** Minutes to the arena: median, and the 25th and 75th centiles. */
  bossMin?: [number, number, number];
  /** Median minutes at which each rank was reached. */
  rankMin: (number | undefined)[];
  /** Mean defeats per main quest, and in all. */
  deaths: Partial<Record<QuestKey, number>>;
  deathsTotal: number;
  /** Focus kept after fights: mean, and the 10th centile. */
  focusAfter: [number, number];
  /** Median minutes from the arena to the boss beaten. */
  bossFightMin?: number;
  /** Median and worst of each run's longest stretch with no new beat, and with no beat and no fight, seconds. */
  quiet: [number, number];
  idle: [number, number];
  grades: Record<string, number>;
  /** Of the won runs with no defeat, and with some, the share graded A+. */
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

/** Plays `runs` seeded runs of a profile. */
export function playMany(id: ProfileId, runs: number, opts: Parameters<typeof play>[2] = {}, firstSeed = 1): RunResult[] {
  const out: RunResult[] = [];
  for (let s = 0; s < runs; s++) out.push(play(PROFILES[id], firstSeed + s, opts));
  return out;
}
