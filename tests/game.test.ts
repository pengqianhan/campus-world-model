import { describe, expect, it } from "vitest";
import type { Pt } from "../src/shared/geo.ts";
import {
  FOES,
  FOE_TIME,
  PLAYER,
  QUEST,
  RANKS,
  StudyQuest,
  bearingTo,
  bookSpot,
  gradeFor,
  openSpot,
  rankFor,
  reachable,
  statsFor,
  turnBetween,
  type Foe,
  type GameEvent,
  type PlayerInput,
  type QuestHost,
} from "../src/shared/game.ts";
import { blockPolygon, cellOf, makeGrid } from "../src/shared/walkpath.ts";

/** A repeatable Math.random. */
function seeded(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * A host that lays pick-ups in a row to the east of the walker, 20 m apart and far from it, and
 * puts each quest's place 100 m to the north. Its random numbers are fixed, or seeded.
 */
function rowHost(random: () => number = () => 0.5): QuestHost {
  let places = 0;
  return {
    spot: (near, taken, place) => (place ? [place[0] + 3 + taken.length, place[1]] : [near[0] + 500 + taken.length * 20, near[1]]),
    place: (near) => ({ name: `Hall ${++places}`, at: [near[0], near[1] + 100 + places] }),
    random,
  };
}

const HERE: Pt = [0, 0];
const at = (p: Pt, heading = 0): PlayerInput => ({ at: p, heading, active: true, pace: 1 });

/** A game past its first seconds of grace, with nothing out but what a test puts there. */
function quiet(random?: () => number): StudyQuest {
  const g = new StudyQuest(rowHost(random), HERE);
  g.grace = 0;
  g.foes = [];
  return g;
}

/** Runs `seconds` of the game in steps of a twentieth, with the walker standing at `p`. */
function run(g: StudyQuest, seconds: number, p: Pt = HERE, heading = 0): GameEvent[] {
  const out: GameEvent[] = [];
  for (let t = 0; t < seconds - 1e-9; t += 0.05) out.push(...g.step(0.05, at(p, heading)));
  return out;
}

/** A foe of a kind, out and chasing, `metres` in front of the walker (north). */
function foe(g: StudyQuest, kind: Foe["kind"], metres: number, east = 0): Foe {
  const f = g.spawn(kind, [east, metres]);
  f.state = "chase";
  f.t = 0;
  f.cool = 99;
  return f;
}

describe("study ranks and growth", () => {
  it("raises the rank with knowledge, and each rank makes the walker stronger", () => {
    expect(rankFor(0)).toBe(0);
    expect(rankFor(RANKS[1]!.xp - 1)).toBe(0);
    expect(rankFor(RANKS[1]!.xp)).toBe(1);
    expect(rankFor(1e6)).toBe(RANKS.length - 1);
    for (let r = 1; r < RANKS.length; r++) {
      const [a, b] = [statsFor(r - 1), statsFor(r)];
      expect(b.maxFocus).toBeGreaterThan(a.maxFocus);
      expect(b.insight).toBeGreaterThan(a.insight);
      expect(b.maxStamina).toBeGreaterThan(a.maxStamina);
    }
  });

  it("starts as a Fresher with its first quest: books to gather, laid out on the map", () => {
    const g = new StudyQuest(rowHost(), HERE);
    expect(g.rank).toBe(0);
    expect(g.focus).toBe(statsFor(0).maxFocus);
    expect(g.items.filter((i) => i.kind === "book")).toHaveLength(QUEST.booksOut);
    expect(g.items.filter((i) => i.kind === "coffee")).toHaveLength(QUEST.coffeeOut);
    expect(g.quests.map((q) => q.key)).toEqual(["orientation"]);
    expect(g.has("flashcard")).toBe(false);
  });

  it("takes a book the walker stands on for knowledge, counts it for the quest, and lays another", () => {
    const g = quiet();
    const book = g.items.find((i) => i.kind === "book")!;
    const events = g.step(0.05, at(book.at));
    expect(events).toContainEqual(expect.objectContaining({ type: "take", kind: "book", xp: QUEST.bookXp }));
    expect(g.xp).toBe(QUEST.bookXp);
    expect(g.quests[0]!.got).toBe(1);
    expect(g.items.filter((i) => i.kind === "book")).toHaveLength(QUEST.booksOut);
  });

  it("finishes the first quest, rises a rank, opens the flashcard and sends the DDL", () => {
    const g = quiet();
    const events: GameEvent[] = [];
    for (let k = 0; k < 5; k++) {
      const book = g.items.find((i) => i.kind === "book")!;
      events.push(...g.step(0.05, at(book.at)));
    }
    expect(events).toContainEqual(expect.objectContaining({ type: "quest", done: true }));
    expect(g.xp).toBe(5 * QUEST.bookXp + 20);
    expect(events).toContainEqual({ type: "rank", rank: 1, skill: "flashcard" });
    expect(g.has("flashcard")).toBe(true);
    expect(g.quests.map((q) => q.key)).toEqual(["ddl1"]);
    const ddl = g.foes.find((f) => f.kind === "ddl")!;
    expect(ddl).toBeDefined();
    expect(events).toContainEqual(expect.objectContaining({ type: "arrive", kind: "ddl", first: true }));
  });

  it("refills Focus and Stamina on a new rank", () => {
    const g = quiet();
    g.focus = 10;
    g.stamina = 0;
    g.xp = RANKS[2]!.xp - 1;
    g.rank = 1;
    const book = g.items.find((i) => i.kind === "book")!;
    g.step(0.05, at(book.at));
    expect(g.rank).toBe(2);
    expect(g.focus).toBe(statsFor(2).maxFocus);
    expect(g.has("sprint")).toBe(true);
  });
});

describe("blows", () => {
  it("strikes a foe in front for the walker's Insight, pushes it and stops the world a moment", () => {
    const g = quiet(() => 0.5);
    const f = foe(g, "procrastination", 2);
    g.act("strike");
    const events = g.step(PLAYER.strikeContact[0]!, at(HERE));
    expect(events.find((e) => e.type === "hit")).toBeDefined();
    // 0.5 random: no critical blow, and the middle of the spread.
    expect(f.hp).toBe(FOES.procrastination.hp - statsFor(0).insight);
    expect(f.push[1]).toBeGreaterThan(0);
    expect(g.hitStop).toBeGreaterThan(0);
    expect(g.chain).toBe(1);
  });

  it("misses a foe behind the walker, and one out of reach", () => {
    const g = quiet(() => 0.5);
    const behind = foe(g, "procrastination", -2.8);
    const far = foe(g, "procrastination", 12, 3);
    g.act("strike");
    g.step(PLAYER.strikeContact[0]!, at(HERE));
    expect(behind.hp).toBe(behind.maxHp);
    expect(far.hp).toBe(far.maxHp);
  });

  it("turns a blow to a foe a little off to the side (soft aim)", () => {
    const g = quiet(() => 0.5);
    const f = foe(g, "procrastination", 3, 3);
    g.act("strike");
    g.step(PLAYER.strikeContact[0]!, at(HERE, 0));
    expect(f.hp).toBeLessThan(f.maxHp);
    expect(g.orders.face).toBeCloseTo(45, 0);
  });

  it("chains three blows into a combo whose last hits hardest", () => {
    const g = quiet(() => 0.5);
    const f = foe(g, "ddl", 2);
    const dealt: number[] = [];
    for (let k = 0; k < 3; k++) {
      const before = f.hp;
      g.act("strike");
      run(g, PLAYER.strikeContact[k]! + 0.01);
      dealt.push(before - f.hp);
      f.at = [0, 2];
      run(g, PLAYER.strikeTime[k]!);
      f.at = [0, 2];
    }
    expect(dealt[2]!).toBeGreaterThan(dealt[0]! * 1.5);
    expect(g.maxChain).toBe(3);
  });

  it("beats a foe at no health: knowledge for it, and its death", () => {
    const g = quiet(() => 0.5);
    const f = foe(g, "distraction", 2);
    f.hp = 1;
    g.act("strike");
    const events = g.step(PLAYER.strikeContact[0]!, at(HERE));
    expect(events).toContainEqual(expect.objectContaining({ type: "kill", kind: "distraction", xp: FOES.distraction.xp }));
    expect(g.xp).toBe(FOES.distraction.xp);
    expect(g.defeated).toBe(1);
    run(g, 1);
    expect(g.foes).toHaveLength(0);
  });

  it("dodges: a dash that costs stamina, and an attack that lands meanwhile does no harm", () => {
    const g = quiet(() => 0.5);
    const stamina = g.stamina;
    g.act("dodge");
    g.step(0.05, at(HERE, 90));
    expect(g.stamina).toBeLessThan(stamina);
    expect(g.orders.shove[0]).toBeGreaterThan(0);
    const f = foe(g, "distraction", 1);
    f.state = "tell";
    f.t = 0.01;
    f.move = { type: "melee" };
    const events = g.step(0.05, at(HERE, 90));
    expect(events).toContainEqual(expect.objectContaining({ type: "evade" }));
    expect(g.focus).toBe(statsFor(0).maxFocus);
  });

  it("throws a flashcard that flies and hurts the first foe it meets, from a Sophomore on", () => {
    const g = quiet(() => 0.5);
    expect(g.act("card")).toBe(false);
    g.rank = 1;
    const f = foe(g, "anxiety", 15);
    expect(g.act("card")).toBe(true);
    // The arm draws back; the card leaves the hand after its release.
    g.step(0.05, at(HERE));
    expect(g.shots).toHaveLength(0);
    g.step(PLAYER.cardRelease, at(HERE));
    expect(g.shots).toHaveLength(1);
    run(g, 0.8);
    expect(f.hp).toBeLessThan(f.maxHp);
    expect(g.shots).toHaveLength(0);
  });

  it("charges the Eureka with blows and lets it go all round the walker", () => {
    const g = quiet(() => 0.5);
    g.rank = 3;
    const a = foe(g, "procrastination", 5);
    const b = foe(g, "procrastination", -5);
    g.act("eureka");
    g.step(0.05, at(HERE));
    expect(a.hp).toBe(a.maxHp);
    g.eurekaMeter = PLAYER.eurekaCharge;
    g.act("eureka");
    const events = g.step(0.05, at(HERE));
    expect(events).toContainEqual(expect.objectContaining({ type: "eureka" }));
    expect(a.hp).toBeLessThan(a.maxHp);
    expect(b.hp).toBeLessThan(b.maxHp);
    expect(g.eurekaMeter).toBe(0);
  });

  it("holds the world longer for a finisher than a light blow, and longest for a critical one", () => {
    const hs = PLAYER.hitStop;
    expect(hs.light).toBeLessThan(hs.heavy);
    expect(hs.heavy).toBeLessThan(hs.crit);
    expect(hs.crit).toBeLessThan(hs.critHeavy);
    // A light blow at 0.5 random is not critical: the light hold.
    const g = quiet(() => 0.5);
    foe(g, "procrastination", 2);
    g.act("strike");
    g.step(PLAYER.strikeContact[0]!, at(HERE));
    expect(g.hitStop).toBeCloseTo(hs.light, 5);
    // At 0 random every blow is critical.
    const c = quiet(() => 0);
    foe(c, "procrastination", 2);
    c.act("strike");
    c.step(PLAYER.strikeContact[0]!, at(HERE));
    expect(c.hitStop).toBeCloseTo(hs.crit, 5);
  });
});

describe("hit reactions", () => {
  /** The combo's finisher, landed on `f` 2 m in front: two blows first, each let finish. */
  function finisher(g: StudyQuest, f: Foe): GameEvent[] {
    for (let k = 0; k < 2; k++) {
      g.act("strike");
      run(g, PLAYER.strikeTime[k]!);
      f.at = [0, 2];
    }
    g.act("strike");
    return run(g, PLAYER.strikeContact[2]! + 0.01);
  }

  /** Seconds left of a state begun in the step just run: its length, less up to that step. */
  function justBegun(t: number, length: number): void {
    expect(t).toBeLessThanOrEqual(length);
    expect(t).toBeGreaterThan(length - 0.1);
  }

  it("staggers a small foe for longer after the finisher than after a light blow", () => {
    const g = quiet(() => 0.5);
    const f = foe(g, "plagiarism", 2);
    g.act("strike");
    const light = g.step(PLAYER.strikeContact[0]!, at(HERE));
    expect(f.state).toBe("stagger");
    justBegun(f.t, FOE_TIME.stagger);
    expect(light).toContainEqual(expect.objectContaining({ type: "hit", heavy: false, stagger: true }));
    run(g, PLAYER.strikeTime[0]!);
    f.at = [0, 2];
    f.hp = f.maxHp;
    g.act("strike");
    run(g, PLAYER.strikeTime[1]! + 0.05);
    f.at = [0, 2];
    f.hp = f.maxHp;
    g.act("strike");
    const heavy = run(g, PLAYER.strikeContact[2]! + 0.01);
    expect(heavy).toContainEqual(expect.objectContaining({ type: "hit", heavy: true, stagger: true }));
    expect(f.state).toBe("stagger");
    expect(f.t).toBeGreaterThan(FOE_TIME.stagger);
    justBegun(f.t, FOE_TIME.heavyStagger);
    // It is let go after the stagger.
    run(g, FOE_TIME.heavyStagger + 0.05);
    expect(f.state).toBe("chase");
  });

  it("gives the blow's bearing with each hit, for the recoil away from it", () => {
    const g = quiet(() => 0.5);
    foe(g, "procrastination", 2);
    g.act("strike");
    const hit = g.step(PLAYER.strikeContact[0]!, at(HERE)).find((e) => e.type === "hit");
    expect(hit && hit.type === "hit" && Math.abs(turnBetween(hit.dir, 0))).toBeLessThan(1);
  });

  it("lets the DDL shrug off a finisher while it chases, and staggers it in its recovery", () => {
    const g = quiet(() => 0.5);
    const f = foe(g, "ddl", 2);
    finisher(g, f);
    expect(f.state).toBe("chase");
    const h = quiet(() => 0.5);
    const d = foe(h, "ddl", 2);
    d.state = "recover";
    d.t = 99;
    // Its recovery lasts through the first two blows here.
    const events = finisher(h, d);
    expect(events).toContainEqual(expect.objectContaining({ type: "hit", heavy: true, stagger: true }));
    expect(d.state).toBe("stagger");
    justBegun(d.t, FOE_TIME.heavyStagger);
  });

  it("tells where an attack lands as it lands", () => {
    const g = quiet(() => 0.5);
    const f = g.spawn("procrastination", [0, 2]);
    run(g, 0.85 + FOES.procrastination.cooldown * 0.6);
    expect(f.state).toBe("tell");
    const events = run(g, FOES.procrastination.tell + 0.1);
    expect(events).toContainEqual(expect.objectContaining({ type: "lash", foe: f.id, move: "yawn" }));
  });
});

describe("villains", () => {
  it("shows an attack before it lands, and it hurts a walker that stays", () => {
    const g = quiet(() => 0.5);
    const f = g.spawn("procrastination", [0, 2]);
    // It rises, waits out its first cooldown, then shows its yawn.
    run(g, 0.85 + FOES.procrastination.cooldown * 0.6);
    expect(f.state).toBe("tell");
    expect(g.tells).toHaveLength(1);
    const events = run(g, FOES.procrastination.tell + 0.1);
    expect(events).toContainEqual(expect.objectContaining({ type: "hurt" }));
    expect(g.focus).toBeLessThan(statsFor(0).maxFocus);
    // The yawn slows.
    expect(g.slowT).toBeGreaterThan(0);
    expect(g.orders.slow).toBeLessThan(1);
  });

  it("does not hurt a walker that steps out of the warning before it lands", () => {
    const g = quiet(() => 0.5);
    g.spawn("procrastination", [0, 2]);
    run(g, 0.85 + FOES.procrastination.cooldown * 0.6);
    const events = run(g, FOES.procrastination.tell + 0.1, [0, -20]);
    expect(events.some((e) => e.type === "hurt")).toBe(false);
  });

  it("the DDL shows its charge along a line and runs it", () => {
    const g = quiet(() => 0.5);
    const d = g.spawn("ddl", [0, 12]);
    run(g, 0.85 + FOES.ddl.cooldown * 0.6);
    expect(d.state).toBe("tell");
    expect(d.move?.type).toBe("charge");
    expect(g.tells[0]!.shape).toBe("line");
    run(g, FOES.ddl.tell + 0.05);
    expect(d.state).toBe("attack");
    // It runs through where the walker stood.
    const events = run(g, 1);
    expect(events).toContainEqual(expect.objectContaining({ type: "hurt" }));
    expect(d.at[1]).toBeLessThan(0);
  });

  it("goes faster after a walker on the scooter", () => {
    const [foot, wheels] = [quiet(() => 0.5), quiet(() => 0.5)];
    const a = foe(foot, "distraction", 30);
    const b = foe(wheels, "distraction", 30);
    foot.step(0.05, at(HERE));
    wheels.step(0.05, { ...at(HERE), pace: QUEST.scooterPace });
    expect(30 - b.at[1]).toBeCloseTo((30 - a.at[1]) * QUEST.scooterPace);
  });

  it("burns the walker out at no Focus, and a game that is over stays as it ended", () => {
    const g = quiet(() => 0.5);
    g.focus = 1;
    const f = g.spawn("distraction", [0, 1]);
    f.state = "tell";
    f.t = 0.01;
    f.move = { type: "melee" };
    const events = g.step(0.05, at(HERE));
    expect(events).toContainEqual({ type: "over", victory: false });
    expect(g.phase).toBe("over");
    expect(g.step(1, at(HERE))).toEqual([]);
    expect(g.debrief().victory).toBe(false);
  });

  it("stops the clock while the walker cannot play", () => {
    const g = quiet();
    g.spawn("distraction", [0, 1]);
    expect(g.step(1, { ...at(HERE), active: false })).toEqual([]);
    expect(g.seconds).toBe(0);
    expect(g.focus).toBe(statsFor(0).maxFocus);
  });

  it("sends wanderers after the first quest, never more than the cap", () => {
    const g = quiet(seeded(4));
    g.mainStep = 1;
    g.focus = 1e9;
    let most = 0;
    for (let k = 0; k < 120; k++) {
      run(g, 1, [k * 0.1, 0]);
      most = Math.max(most, g.foes.filter((f) => f.wander && f.state !== "dead").length);
    }
    expect(most).toBeGreaterThan(0);
    expect(most).toBeLessThanOrEqual(QUEST.foeCap);
  });
});

describe("the Final Exam", () => {
  /** A game at its last quest, with the walker in the arena and the boss out. */
  function exam(random: () => number = () => 0.3): { g: StudyQuest; boss: Foe; place: Pt } {
    const g = quiet(random);
    g.quests = [];
    g.mainStep = 5;
    (g as unknown as { beginMain(p: Pt): void }).beginMain(HERE);
    const place = g.quests[0]!.place!.at;
    g.step(0.05, at(place));
    return { g, boss: g.boss!, place };
  }

  it("rises in its arena when the walker reaches the place", () => {
    const { g, boss } = exam();
    expect(boss.kind).toBe("exam");
    expect(g.arena?.active).toBe(true);
    expect(boss.state).toBe("rise");
  });

  it("changes phase at two thirds and one third, each with a pause in which it cannot be hurt", () => {
    const { g, boss, place } = exam();
    g.focus = 1e9;
    boss.state = "chase";
    boss.t = 0;
    boss.cool = 99;
    const hurtTo = (share: number) => {
      boss.hp = Math.ceil(boss.maxHp * share) + 1;
      boss.at = [place[0], place[1] + 2];
      g.act("strike");
      return g.step(PLAYER.strikeContact[0]!, at(place));
    };
    let events = hurtTo(0.66);
    expect(events).toContainEqual({ type: "phase", phase: 2 });
    expect(boss.phase).toBe(2);
    expect(boss.state).toBe("phase");
    const hp = boss.hp;
    run(g, 0.5, place);
    g.act("strike");
    run(g, 0.3, place);
    expect(boss.hp).toBe(hp);
    run(g, 3, place);
    boss.cool = 99;
    run(g, 0.5, place);
    events = hurtTo(0.33);
    expect(events).toContainEqual({ type: "phase", phase: 3 });
  });

  it("changes phase in a pause of its own length, in which nothing hurts the walker and what it threw is gone", () => {
    const { g, boss, place } = exam();
    boss.state = "chase";
    boss.t = 0;
    boss.cool = 99;
    boss.hp = Math.ceil(boss.maxHp * 0.66) + 1;
    boss.at = [place[0], place[1] + 2];
    // An answer on its way, and a ring over the ground.
    g.shots.push({ id: 999, mine: false, at: [place[0], place[1] + 5], vel: [0, -10], life: 3, damage: 13, radius: 0.7 });
    g.waves.push({ id: 998, at: [place[0], place[1] + 2], r: 1, speed: 13, max: 32, hit: false });
    g.act("strike");
    g.step(PLAYER.strikeContact[0]!, at(place));
    expect(boss.state).toBe("phase");
    // Begun in the step just run, it has a step's worth less left than its length.
    expect(boss.t).toBeGreaterThan(FOE_TIME.phase - 0.1);
    expect(g.cineT).toBeCloseTo(FOE_TIME.phase, 5);
    expect(g.shots.filter((s) => !s.mine)).toHaveLength(0);
    expect(g.waves).toHaveLength(0);
    // A foe's blow in the pause does no harm, and is not even an evade.
    const minion = foe(g, "distraction", 1);
    const focus = g.focus;
    minion.state = "tell";
    minion.t = 0.01;
    minion.move = { type: "melee" };
    minion.at = [place[0], place[1] + 1];
    const during = run(g, 0.2, place);
    expect(g.focus).toBe(focus);
    expect(during.some((e) => e.type === "hurt" || e.type === "evade")).toBe(false);
    // It ends with the pause.
    run(g, FOE_TIME.phase, place);
    expect(g.cineT).toBe(0);
    expect(boss.state).not.toBe("phase");
    minion.state = "tell";
    minion.t = 0.01;
    minion.move = { type: "melee" };
    minion.at = [place[0], place[1] + 1];
    g.iframes = 0;
    const after = run(g, 0.1, place);
    expect(after).toContainEqual(expect.objectContaining({ type: "hurt" }));
  });

  it("breaks up more slowly than a small foe when beaten", () => {
    const { g, boss, place } = exam();
    boss.state = "chase";
    boss.phase = 3;
    boss.hp = 1;
    boss.at = [place[0], place[1] + 2];
    g.act("strike");
    g.step(PLAYER.strikeContact[0]!, at(place));
    expect(boss.state).toBe("dead");
    expect(boss.t).toBeGreaterThan(FOE_TIME.bossDeath - 0.1);
    expect(boss.t).toBeLessThanOrEqual(FOE_TIME.bossDeath);
    expect(FOE_TIME.bossDeath).toBeGreaterThan(FOE_TIME.death);
  });

  it("throws a fan of four answers in its first phase, and sends rings over the ground in its last", () => {
    const { g, boss, place } = exam();
    g.focus = 1e9;
    boss.state = "chase";
    boss.t = 0;
    boss.cool = 0;
    boss.at = [place[0], place[1] + 12];
    g.step(0.05, at(place));
    expect(boss.move?.type).toBe("orb");
    run(g, 1, place);
    expect(g.shots.filter((s) => !s.mine)).toHaveLength(4);
    g.shots = [];
    boss.phase = 3;
    boss.state = "chase";
    boss.cool = 0;
    g.step(0.05, at(place));
    expect(boss.move?.type).toBe("wave");
    run(g, 1, place);
    expect(g.waves.length).toBeGreaterThan(0);
  });

  it("ends the game in victory when it is beaten, with a grade", () => {
    const { g, boss, place } = exam();
    boss.state = "chase";
    boss.phase = 3;
    boss.hp = 1;
    boss.at = [place[0], place[1] + 2];
    g.act("strike");
    const events = g.step(PLAYER.strikeContact[0]!, at(place));
    expect(events).toContainEqual({ type: "over", victory: true });
    expect(g.victory).toBe(true);
    const d = g.debrief();
    expect(d.victory).toBe(true);
    expect(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]).toContain(d.grade);
  });
});

describe("grades", () => {
  const order = ["F", "D", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];
  it("gives an F to a run that did nothing, and an A+ to a clean victory at a high rank", () => {
    expect(gradeFor({ victory: false, seconds: 60, xp: 0, rank: 0, defeated: 0, maxChain: 0, focusLost: 400, quests: 0 })).toBe("F");
    expect(gradeFor({ victory: true, seconds: 900, xp: 2000, rank: 7, defeated: 40, maxChain: 25, focusLost: 0, quests: 8 })).toBe("A+");
  });
  it("grades the same run better for less Focus lost", () => {
    const base = { victory: true, seconds: 600, xp: 900, rank: 4, defeated: 20, maxChain: 10, quests: 6 };
    expect(order.indexOf(gradeFor({ ...base, focusLost: 0 }))).toBeGreaterThan(order.indexOf(gradeFor({ ...base, focusLost: 600 })));
  });
});

describe("turnBetween", () => {
  it("gives the short way round", () => {
    expect(turnBetween(350, 10)).toBeCloseTo(20);
    expect(turnBetween(10, 350)).toBeCloseTo(-20);
    expect(Math.abs(turnBetween(0, 180))).toBeCloseTo(180);
  });
});

describe("where the pick-ups lie", () => {
  // A walled yard in the middle of open ground: the walker stands outside it.
  const grid = () => {
    const g = makeGrid([-100, -100, 100, 100], 2);
    const wall = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ];
    blockPolygon(g, [wall(-30, -30, 30, 30), wall(-20, -20, 20, 20)]);
    return g;
  };

  it("reaches the open ground and not a yard shut in by walls", () => {
    const g = grid();
    const reached = reachable(g, [-80, -80]);
    const at = (p: Pt) => {
      const [c, r] = cellOf(g, p);
      return reached[r * g.cols + c];
    };
    expect(at([80, 80])).toBe(1);
    expect(at([0, 0])).toBe(0);
    expect(at([-25, 0])).toBe(0);
  });

  it("lays books beside the building that draws them, apart from each other and from the walker", () => {
    const g = grid();
    const near: Pt = [-80, -80];
    const reached = reachable(g, near);
    const random = seeded(7);
    const taken: Pt[] = [];
    for (let k = 0; k < 12; k++) {
      const at = bookSpot(g, reached, [{ center: [0, 0], weight: 1 }], near, taken, random);
      expect(at).toBeDefined();
      const [c, r] = cellOf(g, at!);
      expect(reached[r * g.cols + c]).toBe(1);
      expect(Math.hypot(...at!)).toBeLessThan(72);
      for (const t of taken) expect(Math.hypot(at![0] - t[0], at![1] - t[1])).toBeGreaterThanOrEqual(8);
      expect(Math.hypot(at![0] - near[0], at![1] - near[1])).toBeGreaterThanOrEqual(8);
      taken.push(at!);
    }
  });

  it("lays books round the walker where no building draws them, and none where nothing is reached", () => {
    const g = grid();
    const near: Pt = [-80, -80];
    expect(bookSpot(g, reachable(g, near), [], near, [], seeded(3))).toBeDefined();
    expect(bookSpot(g, new Uint8Array(g.cols * g.rows), [], near, [], seeded(3))).toBeUndefined();
  });
});

describe("openSpot", () => {
  it("puts the last fight on the most open ground near its building, clear of walls and trunks", () => {
    const g = makeGrid([-120, -120, 120, 120], 2);
    const box = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ];
    // The building, a wing to its east, and a grove of trunks to its south.
    blockPolygon(g, [box(-15, -15, 15, 15)]);
    blockPolygon(g, [box(15, -60, 60, 60)]);
    for (let x = -40; x <= 10; x += 6) for (let y = -60; y <= -20; y += 6) blockPolygon(g, [box(x - 0.45, y - 0.45, x + 0.45, y + 0.45)]);
    const near: Pt = [-100, -100];
    const reached = reachable(g, near);
    const at = openSpot(g, reached, [0, 0], 75, 18, near, seeded(5), 160)!;
    expect(at).toBeDefined();
    const [c, r] = cellOf(g, at);
    expect(reached[r * g.cols + c]).toBe(1);
    expect(Math.hypot(...at)).toBeLessThanOrEqual(77);
    // Nothing in the way within 18 m.
    const k = Math.ceil(18 / g.cell);
    let blocked = 0;
    for (let dr = -k; dr <= k; dr++)
      for (let dc = -k; dc <= k; dc++) if (Math.hypot(dc, dr) * g.cell <= 18 && g.cost[(r + dr) * g.cols + c + dc] === Infinity) blocked++;
    expect(blocked).toBe(0);
  });

  it("finds nothing where nothing is reached", () => {
    const g = makeGrid([-50, -50, 50, 50], 2);
    expect(openSpot(g, new Uint8Array(g.cols * g.rows), [0, 0], 40, 18, [-40, -40], seeded(2))).toBeUndefined();
  });
});

describe("bearingTo", () => {
  it("gives compass degrees", () => {
    expect(bearingTo([0, 0], [0, 10])).toBeCloseTo(0);
    expect(bearingTo([0, 0], [10, 0])).toBeCloseTo(90);
    expect(bearingTo([0, 0], [-10, 0])).toBeCloseTo(270);
  });
});
