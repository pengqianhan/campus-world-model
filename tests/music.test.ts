import { describe, expect, it } from "vitest";
import {
  CUES,
  FIGHT_HOLD,
  LAYERS,
  MUSIC,
  MusicDirector,
  PHRASE,
  STEPS,
  STINGERS,
  VoiceClock,
  dbToGain,
  gainToDb,
  hitAt,
  midiHz,
  nextBoundary,
  parseNotes,
  resumeAt,
  sameGrid,
  sliderGain,
  stepSeconds,
  stepsDue,
  stepsToSwitch,
  stingerSeconds,
  vary,
  type MusicInput,
} from "../src/shared/music.ts";

const at = (t: number, more: Partial<MusicInput> = {}): MusicInput => ({ t, title: false, over: false, near: 0, ddl: false, ...more });

describe("the music's state machine", () => {
  it("plays the title until the game begins, then explores", () => {
    const d = new MusicDirector();
    expect(d.update(at(0, { title: true }))).toBe("title");
    expect(d.update(at(1))).toBe("explore");
  });

  it("brings the fight in at once and holds it a while after the last foe goes", () => {
    const d = new MusicDirector();
    expect(d.update(at(10, { near: 2 }))).toBe("combat");
    expect(d.update(at(10 + FIGHT_HOLD - 0.1))).toBe("combat");
    expect(d.update(at(10 + FIGHT_HOLD + 0.1))).toBe("explore");
  });

  it("puts the DDL's clock over a fight, and holds it as long", () => {
    const d = new MusicDirector();
    expect(d.update(at(0, { near: 3, ddl: true }))).toBe("ddl");
    // The DDL beaten, small foes still near: the clock holds, then the plain fight.
    expect(d.update(at(2, { near: 2 }))).toBe("ddl");
    expect(d.update(at(2 + FIGHT_HOLD, { near: 2 }))).toBe("combat");
  });

  it("gives the boss's three phases their own cues, over any fight", () => {
    const d = new MusicDirector();
    expect(d.update(at(0, { boss: 1, near: 3, ddl: true }))).toBe("boss1");
    expect(d.update(at(1, { boss: 2 }))).toBe("boss2");
    expect(d.update(at(2, { boss: 3 }))).toBe("boss3");
  });

  it("is silent once the game is over (the stinger plays), and starts afresh when reset", () => {
    const d = new MusicDirector();
    d.update(at(0, { near: 1 }));
    expect(d.update(at(1, { over: true, boss: 3 }))).toBe("none");
    d.reset();
    expect(d.update(at(1.5))).toBe("explore");
  });
});

describe("the scheduler's sums", () => {
  it("has a sixteenth of a quarter's length", () => {
    expect(stepSeconds(120)).toBeCloseTo(0.125, 9);
    expect(stepSeconds(100) * 4).toBeCloseTo(0.6, 9);
  });

  it("lands a change on the next beat when tempo and chords match, else on the next bar", () => {
    expect(sameGrid("explore", "combat")).toBe(true);
    expect(sameGrid("combat", "ddl")).toBe(true);
    expect(sameGrid("explore", "boss1")).toBe(false);
    expect(sameGrid("boss1", "boss2")).toBe(false); // tempo rises
    expect(stepsToSwitch(0, "explore", "combat")).toBe(0);
    expect(stepsToSwitch(5, "explore", "combat")).toBe(3);
    expect(stepsToSwitch(8, "explore", "combat")).toBe(0);
    expect(stepsToSwitch(5, "explore", "boss1")).toBe(11);
    expect(stepsToSwitch(16, "explore", "boss1")).toBe(0);
    expect(stepsToSwitch(63, "boss2", "boss3")).toBe(1);
    // The title's slow bar is not waited out.
    expect(stepsToSwitch(5, "title", "explore")).toBe(3);
  });

  it("finds the next point on a grid", () => {
    expect(nextBoundary(0.5, 1, 0.25)).toBe(1);
    expect(nextBoundary(1, 1, 0.25)).toBe(1);
    expect(nextBoundary(1.01, 1, 0.25)).toBeCloseTo(1.25, 9);
    expect(nextBoundary(1.25, 1, 0.25)).toBeCloseTo(1.25, 9);
    // Float error on the grid does not skip a point.
    expect(nextBoundary(1 + 3 * 0.1, 1, 0.1)).toBeCloseTo(1.3, 9);
  });

  it("drops what it missed after a stall rather than playing it all at once", () => {
    expect(resumeAt(5.2, 5)).toBe(5.2);
    expect(resumeAt(3, 5)).toBeCloseTo(5.03, 9);
  });

  it("counts the steps due in the look-ahead window", () => {
    expect(stepsDue(1.2, 1, 0.1, 0.15)).toBe(0);
    expect(stepsDue(1.0, 1, 0.12, 0.15)).toBe(1);
    expect(stepsDue(1.0, 1, 0.12, 0.05)).toBe(3);
  });
});

describe("the cues as written", () => {
  it("has every cue's patterns the right length, and notes in range", () => {
    for (const c of CUES) {
      if (c === "none") continue;
      const m = MUSIC[c];
      expect(m.chords.length).toBe(4);
      expect(m.roots.length).toBe(4);
      expect(m.lead.length).toBe(PHRASE);
      for (const p of [m.bass, m.kick, m.snare, m.hat, m.tick, m.arp]) expect(p.length).toBe(STEPS);
      for (const n of m.lead) if (n >= 0) expect(n).toBeGreaterThanOrEqual(48), expect(n).toBeLessThanOrEqual(96);
      for (const l of Object.keys(m.mix)) expect(LAYERS).toContain(l);
    }
  });

  it("speeds up through the boss's phases, and brings drums and bass into the fight", () => {
    expect(MUSIC.boss1.bpm).toBeLessThan(MUSIC.boss2.bpm);
    expect(MUSIC.boss2.bpm).toBeLessThan(MUSIC.boss3.bpm);
    expect(MUSIC.explore.mix.kick ?? 0).toBe(0);
    expect(MUSIC.combat.mix.kick).toBeGreaterThan(0);
    expect(MUSIC.combat.mix.bass!).toBeGreaterThan(MUSIC.explore.mix.bass!);
    expect(MUSIC.ddl.mix.tick).toBeGreaterThan(0);
    expect(MUSIC.ddl.tick).toMatch(/t.*k/);
  });

  it("parses notes and rests, and reads patterns past their end as rests", () => {
    expect(Array.from(parseNotes(" 60 . 62 \n . "))).toEqual([60, -1, 62, -1]);
    expect(hitAt("x...", 0)).toBe("x");
    expect(hitAt("x...", 17)).toBe(".");
  });

  it("times its stingers whole", () => {
    expect(stingerSeconds(STINGERS.victory)).toBeCloseTo((5 * 60) / 120 + 0.4, 6);
    expect(stingerSeconds(STINGERS.rank)).toBeLessThan(1.6);
    expect(stingerSeconds(STINGERS.defeat)).toBeGreaterThan(4);
  });
});

describe("voices, levels and variety", () => {
  it("counts voices still sounding and keeps a cap", () => {
    const v = new VoiceClock(8);
    for (let i = 0; i < 5; i++) v.add(1 + i);
    expect(v.live(0)).toBe(5);
    expect(v.live(3)).toBe(2);
    expect(v.room(0, 3, 8)).toBe(true);
    expect(v.room(0, 4, 8)).toBe(false);
    // The ring overwrites the oldest past its size.
    for (let i = 0; i < 10; i++) v.add(100);
    expect(v.live(50)).toBe(8);
    v.clear();
    expect(v.live(0)).toBe(0);
  });

  it("maps the sliders on a square law, clamped", () => {
    expect(sliderGain(0)).toBe(0);
    expect(sliderGain(1)).toBe(1);
    expect(sliderGain(0.5)).toBeCloseTo(0.25, 9);
    expect(sliderGain(2)).toBe(1);
    expect(sliderGain(-1)).toBe(0);
  });

  it("converts decibels and pitches", () => {
    expect(dbToGain(-6)).toBeCloseTo(0.501, 3);
    expect(gainToDb(dbToGain(-1))).toBeCloseTo(-1, 9);
    expect(midiHz(69)).toBe(440);
    expect(midiHz(81)).toBeCloseTo(880, 9);
  });

  it("varies a sound within its bounds", () => {
    const lo = vary(0, 0, 60, 1.5);
    const hi = vary(1, 1, 60, 1.5);
    expect(lo.pitch).toBeCloseTo(Math.pow(2, -60 / 1200), 9);
    expect(hi.pitch).toBeCloseTo(Math.pow(2, 60 / 1200), 9);
    expect(gainToDb(lo.gain)).toBeCloseTo(-1.5, 9);
    expect(gainToDb(hi.gain)).toBeCloseTo(1.5, 9);
    expect(vary(0.5, 0.5).pitch).toBeCloseTo(1, 9);
  });
});
