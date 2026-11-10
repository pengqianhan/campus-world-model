// The walkers on the map: made-up figures that a visitor steers with the keyboard, or that an
// agent steers through the page (src/app/walker.ts). Each walks on the ground, round buildings,
// along the ways planned by the walking map, and can say things that other walkers near it hear.
// It can ride a scooter the same ways, faster, or fly a drone in its place over the roofs
// (rides.ts). Nothing here is about a real person or where one is.
import { Group } from "three";
import type { Pt } from "../shared/geo.ts";
import type { RoofMap } from "../shared/roofmap.ts";
import { WalkMap, type WalkPlan } from "../shared/walkmap.ts";
import type { WalkGrid } from "../shared/walkpath.ts";
import { cellOf } from "../shared/walkpath.ts";
import { EYE_HEIGHT, Figure } from "./figure.ts";
import type { LabelSpec } from "./labels.ts";
import { DECK, DRONE_MIDDLE, DRONE_REACH, Drone, type Ride } from "./rides.ts";

export type { Ride } from "./rides.ts";

/** Metres a second: an easy walk. */
export const WALK_SPEED = 1.4;
/** The fastest an agent may ask for, metres a second: time sped up, not a run. */
export const MAX_SPEED = 40;
/** Degrees a second a walker turns towards where it is going. */
const TURN_RATE = 400;
/** Metres within which a walker hears what another says, out of doors. */
export const HEAR_RANGE = 25;
/**
 * Metres the paint of paths and streets lies over the ground (see CampusScene.setContext), where a
 * walker's feet stand. The walker views lay all of the ground there (street/ground.ts).
 */
export const GROUND_PAINT = 0.25;
/** Box of walkable ground kept round a walker steered by hand, metres; rebuilt near its edge. */
const LOCAL_BOX = 160;
/** Metres a second at most on the scooter: 25 km/h, the speed electric scooters are commonly held to. */
export const SCOOTER_TOP = 25 / 3.6;
/** Metres a second each second the scooter speeds up, slows when it brakes, and slows when let go. */
const SCOOTER_ACCEL = 2.6;
const SCOOTER_BRAKE = 5;
const SCOOTER_COAST = 1.8;
/**
 * Metres above the ground a drone flies at most: 120 m, the most New Zealand's rules for small
 * drones allow without an approval (Civil Aviation Rules, Part 101).
 */
export const DRONE_CEILING = 120;
/** Metres above the ground a drone rises to when it takes off. */
export const TAKE_OFF = 12;
/** Metres a second the drone flies at most, flown by hand or flying itself: about 58 km/h. */
export const DRONE_TOP = 16;
/** Metres a second the drone climbs or comes down at most, and how fast its speeds change. */
export const DRONE_CLIMB = 5;
const DRONE_ACCEL = 7;
/** Metres the drone's skids keep above whatever is under them. */
const DRONE_CLEAR = 0.25;
/** Metres a flight to a place keeps over the highest roof on its way. */
const CRUISE_OVER = 10;

/** What the scene lends the walkers: the ground, the walking map, and the open floor. */
export interface WalkerHost {
  groundAt(x: number, y: number): number;
  walkMap(): WalkMap | undefined;
  /** Height to stand at inside a building, on a floor; undefined when unknown. */
  floorTop(building: string, floor: number): number | undefined;
  /** Whether a point is on a floor of a building, for a walker steered by hand indoors. */
  insideFloor(building: string, floor: number, p: Pt): boolean;
  /** How high the buildings reach, for a drone; undefined until the map has them. */
  roofs(): RoofMap | undefined;
  /** 0-1: how hard it is raining where the walkers are. */
  rain(): number;
  ringColour(): number;
}

export interface Speech {
  from: string;
  text: string;
  /** ms since the page loaded, as performance.now gives it. */
  at: number;
  where: Pt;
  indoor?: { building: string; floor: number };
}

/** Where a walk ends and how it went. */
export interface WalkResult {
  arrived: boolean;
  /** Why it stopped short: another command, or no way on foot. */
  reason?: string;
  metres: number;
  seconds: number;
}

interface Walk {
  points: Pt[];
  leg: number;
  speed: number;
  metres: number;
  startedAt: number;
  resolve: (r: WalkResult) => void;
}

interface Flight {
  /** Where it flies, metres east and north; none to rise or come down where it is. */
  to?: Pt;
  /** The height it flies at, metres above sea level. */
  alt: number;
  /**
   * Rising or coming down where it is: metres above the ground to stop at. The ground may arrive
   * after the flight starts (a walk the address asks for), so `alt` follows it.
   */
  above?: number;
  speed: number;
  metres: number;
  startedAt: number;
  resolve?: (r: WalkResult) => void;
}

export interface WalkerState {
  name: string;
  at: Pt;
  /** Height of the feet above sea level, metres; flying, of the drone's skids. */
  height: number;
  heading: number;
  indoor?: { building: string; floor: number };
  walking: boolean;
  saying?: string;
  /** On foot, on a scooter, or flying a drone in its place. */
  ride: Ride;
  /** Metres a second it goes, over the ground. */
  speed: number;
  /** Flying: metres the drone is above the ground under it. */
  altitude?: number;
}

class Walker {
  figure: Figure;
  at: Pt;
  heading: number;
  height = 0;
  indoor?: { building: string; floor: number };
  walk?: Walk;
  moving = 0;
  /** Metres a second it is going at, smoothed, for the figure's walk or run. */
  pace = 0;
  /** What it says, for `ms` from the first frame that shows it (`until` is set then). */
  speech?: { text: string; ms: number; until?: number };
  heardUpTo = 0;
  /** Steering by hand: metres a second forward, degrees a second of turn, and flying, metres a second up. */
  drive = { forward: 0, turn: 0, climb: 0 };
  ride: Ride = "walk";
  /** On the scooter and flying: metres a second it goes on, which it keeps for a while when let go. */
  speed = 0;
  /** Flying: metres a second it climbs (negative: comes down). */
  climb = 0;
  /** Flying: the height of the drone's skids, metres above sea level. */
  alt = 0;
  drone?: Drone;
  /** A flight it makes by itself: to a height, or to a place. Steering by hand ends it. */
  flight?: Flight;
  /**
   * Taking off: metres above the ground it rises to, while it can be steered round by hand all the
   * same; and who waits for it to get there. Climbing or coming down by hand ends it.
   */
  lift?: { above: number; done: (() => void)[] };
  /** Degrees a second it turns, smoothed: the scooter leans into it, the drone banks. */
  turnRate = 0;
  /** The ground under it when it was last placed, metres: a drone keeps its height over the ground when the ground arrives. */
  groundRef = 0;
  /** When the steering by hand was last added up, ms (performance.now). */
  driveFrom = 0;
  nameLabel: LabelSpec;
  sayLabel: LabelSpec;

  constructor(
    readonly name: string,
    at: Pt,
    heading: number,
    ring: number,
  ) {
    this.at = at;
    this.heading = heading;
    this.figure = new Figure(ring);
    this.nameLabel = { id: `walker:${name}`, x: 0, y: 0, z: 0, text: name, priority: 9e6, className: "lbl-walker" };
    this.sayLabel = { id: `say:${name}`, x: 0, y: 0, z: 0, text: "", priority: 1e7, className: "lbl-say" };
  }
}

export class WalkerWorld {
  readonly group = new Group();
  private walkers = new Map<string, Walker>();
  private said: Speech[] = [];
  private local?: { grid: WalkGrid; box: [number, number, number, number] };
  private now = 0;
  /** Bumped when labels must be rebuilt (a walker came, went, or spoke). */
  labelsVersion = 0;

  constructor(private host: WalkerHost) {
    this.group.userData.noPick = true;
  }

  get size(): number {
    return this.walkers.size;
  }

  names(): string[] {
    return [...this.walkers.keys()];
  }

  has(name: string): boolean {
    return this.walkers.has(name);
  }

  /** Puts a walker on the map, facing `heading`. Replaces one of the same name. */
  spawn(name: string, at: Pt, heading: number): WalkerState {
    this.remove(name);
    const w = new Walker(name, at, heading, this.host.ringColour());
    w.heardUpTo = this.now;
    this.walkers.set(name, w);
    this.group.add(w.figure.root);
    this.place(w);
    this.labelsVersion++;
    return this.state(name)!;
  }

  remove(name: string): boolean {
    const w = this.walkers.get(name);
    if (!w) return false;
    this.cancel(w, "removed");
    this.endLift(w);
    this.group.remove(w.figure.root);
    w.figure.dispose();
    if (w.drone) {
      this.group.remove(w.drone.root);
      w.drone.dispose();
    }
    this.walkers.delete(name);
    this.labelsVersion++;
    return true;
  }

  state(name: string): WalkerState | undefined {
    const w = this.walkers.get(name);
    if (!w) return undefined;
    return {
      name: w.name,
      at: [Math.round(w.at[0] * 10) / 10, Math.round(w.at[1] * 10) / 10],
      height: Math.round(w.height * 10) / 10,
      heading: Math.round(w.heading),
      indoor: w.indoor ? { ...w.indoor } : undefined,
      walking: !!w.walk || !!w.flight?.to,
      saying: w.speech && (w.speech.until === undefined || w.speech.until > this.now) ? w.speech.text : undefined,
      ride: w.ride,
      speed: Math.round(w.pace * 10) / 10,
      altitude: w.ride === "fly" ? Math.round((w.alt - this.host.groundAt(w.at[0], w.at[1])) * 10) / 10 : undefined,
    };
  }

  /**
   * The point, heading and height a camera follows: `eye`, where it sees from (the walker's eyes,
   * or the drone's camera), and `aim`, the height a camera behind it looks at.
   */
  pose(name: string): { at: Pt; heading: number; height: number; indoor: boolean; ride: Ride; eye: number; aim: number } | undefined {
    const w = this.walkers.get(name);
    if (!w) return undefined;
    const lift = w.ride === "scooter" ? DECK : 0;
    const flying = w.ride === "fly";
    return {
      at: w.at,
      heading: w.heading,
      height: w.height,
      indoor: !!w.indoor,
      ride: w.ride,
      eye: flying ? w.alt + DRONE_MIDDLE - 0.1 : w.height + lift + EYE_HEIGHT,
      aim: flying ? w.alt + DRONE_MIDDLE : w.height + lift + 1.35,
    };
  }

  /** How the walker gets about. */
  rideOf(name: string): Ride | undefined {
    return this.walkers.get(name)?.ride;
  }

  /** The drone flown in a walker's place, while it flies. */
  droneOf(name: string): Drone | undefined {
    const w = this.walkers.get(name);
    return w?.ride === "fly" ? w.drone : undefined;
  }

  /**
   * Gets about another way: on foot, on the scooter, or flying a drone in its place, which takes
   * off from where it stands and rises to TAKE_OFF. Out of the air it lands: the walker stands on
   * the free ground nearest the point under it. Out of doors only (walker.ts takes it out first).
   */
  setRide(name: string, ride: Ride): WalkerState | undefined {
    const w = this.walkers.get(name);
    if (!w) return undefined;
    if (ride === w.ride) return this.state(name);
    this.cancel(w, "changed how it goes");
    w.drive = { forward: 0, turn: 0, climb: 0 };
    w.speed = 0;
    w.climb = 0;
    const was = w.ride;
    w.ride = ride;
    if (ride === "fly") {
      if (!w.drone) {
        w.drone = new Drone();
        this.group.add(w.drone.root);
      }
      w.drone.root.visible = true;
      w.alt = w.height;
      w.lift = { above: TAKE_OFF, done: [] };
    } else if (was === "fly") {
      if (w.drone) w.drone.root.visible = false;
      this.endLift(w);
      // It lands where there is room round the walker, facing the way that is open furthest.
      const open = this.host.walkMap()?.openNear(w.at, 60);
      if (open) {
        w.at = open.at;
        w.heading = open.heading;
      }
    }
    w.figure.setRide(ride);
    this.place(w);
    this.labelsVersion++;
    return this.state(name);
  }

  /** Resolves when a drone taking off has got to its height (at once when it is not taking off). */
  airborne(name: string): Promise<void> {
    const w = this.walkers.get(name);
    if (!w?.lift) return Promise.resolve();
    const lift = w.lift;
    return new Promise((done) => lift.done.push(done));
  }

  /** Flies the drone up or down to `metres` above the ground where it is. Resolves when it gets there or is stopped. */
  climbTo(name: string, metres: number): Promise<WalkResult> {
    const w = this.walkers.get(name);
    if (!w || w.ride !== "fly") return Promise.resolve({ arrived: false, reason: !w ? "no such walker" : "it is not flying", metres: 0, seconds: 0 });
    this.cancel(w, "another command");
    this.endLift(w);
    w.drive = { forward: 0, turn: 0, climb: 0 };
    w.speed = 0;
    const above = Math.min(DRONE_CEILING, Math.max(0, metres));
    return new Promise((resolve) => {
      w.flight = { alt: this.host.groundAt(w.at[0], w.at[1]) + above, above, speed: 0, metres: 0, startedAt: this.now, resolve };
    });
  }

  /**
   * Flies the drone straight to a point: up to a height over every roof on the way, across, and
   * there it hovers. Resolves when it gets there or is stopped.
   */
  flyTo(name: string, to: Pt, speed: number): Promise<WalkResult> {
    const w = this.walkers.get(name);
    if (!w || w.ride !== "fly") return Promise.resolve({ arrived: false, reason: !w ? "no such walker" : "it is not flying", metres: 0, seconds: 0 });
    this.cancel(w, "another command");
    this.endLift(w);
    w.drive = { forward: 0, turn: 0, climb: 0 };
    const roofs = this.host.roofs();
    const ground = (p: Pt) => this.host.groundAt(p[0], p[1]);
    const over = Math.max(ground(w.at), ground(to), roofs?.along(w.at, to) ?? -Infinity) + CRUISE_OVER;
    const ceiling = Math.min(ground(w.at), ground(to)) + DRONE_CEILING;
    const alt = Math.min(ceiling, Math.max(w.alt, over));
    return new Promise((resolve) => {
      w.flight = { to: [to[0], to[1]], alt, speed: Math.max(0.5, Math.min(DRONE_TOP, speed)), metres: 0, startedAt: this.now, resolve };
    });
  }

  figure(name: string): Figure | undefined {
    return this.walkers.get(name)?.figure;
  }

  /** Walks along a planned way. Resolves when the walker gets there or is stopped. */
  follow(name: string, plan: WalkPlan, speed: number): Promise<WalkResult> {
    const w = this.walkers.get(name);
    if (!w) return Promise.resolve({ arrived: false, reason: "no such walker", metres: 0, seconds: 0 });
    // A drone does not keep to the ground: it flies to the end of the way.
    if (w.ride === "fly") return this.flyTo(name, plan.points[plan.points.length - 1] ?? w.at, speed);
    this.cancel(w, "another command");
    w.drive = { forward: 0, turn: 0, climb: 0 };
    w.speed = 0;
    return new Promise((resolve) => {
      w.walk = {
        points: plan.points.slice(),
        leg: 1,
        speed: Math.max(0.3, Math.min(w.ride === "scooter" ? SCOOTER_TOP : MAX_SPEED, speed)),
        metres: 0,
        startedAt: this.now,
        resolve,
      };
      if (plan.points.length < 2) this.finish(w, true);
    });
  }

  /** Plans and walks to a point out of doors. */
  walkTo(name: string, to: Pt, speed: number): Promise<WalkResult> {
    const w = this.walkers.get(name);
    const map = this.host.walkMap();
    if (!w || !map) return Promise.resolve({ arrived: false, reason: !w ? "no such walker" : "the map is still loading", metres: 0, seconds: 0 });
    const plan = map.planTo(w.at, to);
    if (!plan) return Promise.resolve({ arrived: false, reason: "there is no way there on foot", metres: 0, seconds: 0 });
    return this.follow(name, plan, speed);
  }

  /** Plans and walks to the ground beside a University building. */
  walkToBuilding(name: string, building: string, speed: number): Promise<WalkResult> {
    const w = this.walkers.get(name);
    const map = this.host.walkMap();
    if (!w || !map) return Promise.resolve({ arrived: false, reason: !w ? "no such walker" : "the map is still loading", metres: 0, seconds: 0 });
    const plan = map.planToBuilding(w.at, building);
    if (!plan) return Promise.resolve({ arrived: false, reason: "there is no way there on foot", metres: 0, seconds: 0 });
    return this.follow(name, plan, speed);
  }

  /** Stops a walk in progress, and a scooter or a drone where it is. */
  stop(name: string): void {
    const w = this.walkers.get(name);
    if (w) {
      this.cancel(w, "stopped");
      this.endLift(w);
      w.drive = { forward: 0, turn: 0, climb: 0 };
      w.speed = 0;
      w.climb = 0;
    }
  }

  /** Turns on the spot, by degrees (positive to the right), or to face a bearing. */
  turn(name: string, by: number, absolute = false): void {
    const w = this.walkers.get(name);
    if (!w) return;
    w.heading = (((absolute ? by : w.heading + by) % 360) + 360) % 360;
    w.figure.setHeading(w.heading);
  }

  /** Metres a second a walker is steered forward by hand (negative back); 0 when it is not. */
  handForward(name: string): number {
    return this.walkers.get(name)?.drive.forward ?? 0;
  }

  /**
   * Steering by hand, for the keyboard and the thumb stick: metres a second forward (negative back),
   * degrees a second of turn, and flying, metres a second up (negative down). On the scooter and in
   * the air these are what it speeds up or slows to.
   */
  steer(name: string, forward: number, turn: number, climb = 0): void {
    const w = this.walkers.get(name);
    if (!w) return;
    // A key held until now counts for all the time it was held, though no frame was drawn meanwhile.
    this.driveUntil(w, performance.now());
    if (forward || turn || climb) this.cancel(w, "steered by hand");
    // Climbing or coming down by hand takes over from a take-off; going round does not.
    if (climb) this.endLift(w);
    w.drive = { forward, turn, climb: w.ride === "fly" ? climb : 0 };
  }

  /** Whether steering by hand still moves it: held, or let go of a scooter or a drone still going. */
  private driven(w: Walker): boolean {
    return !!(w.drive.forward || w.drive.turn || w.drive.climb || w.speed || w.climb || w.lift);
  }

  /** A take-off ends: at its height, taken over, or landed. Whoever waited for it goes on. */
  private endLift(w: Walker): void {
    const lift = w.lift;
    if (!lift) return;
    w.lift = undefined;
    for (const done of lift.done) done();
  }

  /**
   * Adds up the steering by hand from when it was last added up to `t` (ms), in steps of a tenth
   * of a second at most, so that a slow frame cannot carry the walker through a wall or a tree.
   */
  private driveUntil(w: Walker, t: number): number {
    const span = w.driveFrom && this.driven(w) ? Math.min(2, Math.max(0, (t - w.driveFrom) / 1000)) : 0;
    w.driveFrom = Math.max(w.driveFrom, t);
    let travelled = 0;
    const rose = w.alt;
    for (let left = span; left > 1e-6; left -= 0.1) travelled += this.drive(w, Math.min(0.1, left));
    if (travelled > 0 || w.alt !== rose) this.place(w);
    return travelled;
  }

  /** Moves a walker straight to a point, without walking: into or out of a building. */
  teleport(name: string, at: Pt, indoor?: { building: string; floor: number }): void {
    const w = this.walkers.get(name);
    if (!w) return;
    this.cancel(w, "moved");
    w.at = [at[0], at[1]];
    w.indoor = indoor ? { ...indoor } : undefined;
    w.speed = 0;
    if (w.ride === "fly") w.alt = Math.max(w.alt, this.floorUnder(w.at));
    this.place(w);
  }

  /** Puts a walker on a floor of the building it is in, at the same spot. */
  setIndoor(name: string, indoor: { building: string; floor: number } | undefined): void {
    const w = this.walkers.get(name);
    if (!w) return;
    w.indoor = indoor ? { ...indoor } : undefined;
    this.place(w);
  }

  /** Says something: shown over the walker's head, and heard by walkers near it. */
  say(name: string, text: string): Speech | undefined {
    const w = this.walkers.get(name);
    const clean = text.replace(/\s+/g, " ").trim().slice(0, 200);
    if (!w || !clean) return undefined;
    // Shown for its time from the first frame that draws it, which on a slow screen may be a while.
    w.speech = { text: clean, ms: Math.min(15000, 3500 + clean.length * 70) };
    w.sayLabel.text = clean;
    const s: Speech = { from: name, text: clean, at: this.now, where: [w.at[0], w.at[1]], indoor: w.indoor ? { ...w.indoor } : undefined };
    this.said.push(s);
    if (this.said.length > 500) this.said.splice(0, this.said.length - 500);
    this.labelsVersion++;
    return s;
  }

  /** What other walkers said near this one since it last listened. */
  listen(name: string): Speech[] {
    const w = this.walkers.get(name);
    if (!w) return [];
    const heard = this.said.filter((s) => {
      if (s.from === name || s.at <= w.heardUpTo) return false;
      const sameFloor = !!s.indoor && !!w.indoor && s.indoor.building === w.indoor.building && s.indoor.floor === w.indoor.floor;
      const bothOut = !s.indoor && !w.indoor;
      return (bothOut || sameFloor) && Math.hypot(s.where[0] - w.at[0], s.where[1] - w.at[1]) <= HEAR_RANGE;
    });
    w.heardUpTo = this.now;
    return heard;
  }

  /** Name and speech labels, at the walkers' heads. */
  labels(): LabelSpec[] {
    const out: LabelSpec[] = [];
    for (const w of this.walkers.values()) {
      out.push(w.nameLabel);
      if (w.speech && (w.speech.until === undefined || w.speech.until > this.now)) out.push(w.sayLabel);
    }
    return out;
  }

  /**
   * Moves every walker on by `dt` seconds. Returns true when anything moved or changed, so that
   * the scene draws a frame.
   */
  step(dt: number, now: number): boolean {
    this.now = now;
    let changed = false;
    const rain = this.host.rain();
    for (const w of this.walkers.values()) {
      const was = { x: w.at[0], y: w.at[1], h: w.heading, m: w.moving, a: w.alt };
      let travelled = 0;
      if (w.walk || w.flight) {
        travelled = w.walk ? this.advance(w, dt) : this.flyOn(w, dt);
        // Steered by hand after it, it goes on from now, not from before it.
        w.driveFrom = now;
      } else travelled = this.driveUntil(w, now);
      const target = travelled > 0 ? 1 : 0;
      w.moving += (target - w.moving) * Math.min(1, dt * 6);
      if (Math.abs(w.moving) < 0.01) w.moving = 0;
      if (dt > 0) w.pace += (travelled / dt - w.pace) * Math.min(1, dt * 8);
      if (travelled === 0 && w.moving === 0) w.pace = 0;
      if (dt > 0) w.turnRate += ((((w.heading - was.h + 540) % 360) - 180) / dt - w.turnRate) * Math.min(1, dt * 6);
      // Come to rest, it is at rest: a rate dwindling for ever would lean the rider or bank the drone a hair each frame.
      if (Math.abs(w.turnRate) < 0.5) w.turnRate = 0;
      w.figure.setUmbrella(rain > 0 && !w.indoor && w.ride === "walk");
      if (travelled > 0 || w.moving > 0 || w.alt !== was.a) this.place(w);
      w.figure.pose(w.moving, w.pace, now / 1000);
      w.figure.rideOn(travelled, w.pace, w.turnRate, dt);
      if (w.ride === "fly" && w.drone) {
        // It turns on the spot as well as on the way.
        w.drone.root.rotation.y = (-w.heading * Math.PI) / 180;
        // Leaning and banking draw a frame; a drone hovering still is drawn once.
        if (w.drone.fly(dt, w.pace * Math.sign(w.speed || 1), w.turnRate)) changed = true;
      }
      if (w.figure.takeChanged()) changed = true;
      if (w.speech && w.speech.until === undefined) w.speech.until = now + w.speech.ms;
      else if (w.speech && w.speech.until! <= now) {
        w.speech = undefined;
        this.labelsVersion++;
      }
      if (was.x !== w.at[0] || was.y !== w.at[1] || was.h !== w.heading || was.m !== w.moving || was.a !== w.alt) changed = true;
    }
    return changed;
  }

  /**
   * Puts every walker back on the ground, after the ground or the buildings changed. One that now
   * stands inside something (the surroundings arrived after it) steps out to the nearest free ground.
   */
  refresh(): void {
    this.local = undefined;
    const map = this.host.walkMap();
    for (const w of this.walkers.values()) {
      if (w.ride === "fly") {
        // The ground came in (or changed) under a drone in the air: it keeps its height over it.
        const rise = this.host.groundAt(w.at[0], w.at[1]) - w.groundRef;
        w.alt = Math.max(w.alt + rise, this.floorUnder(w.at));
        if (w.flight && w.flight.above === undefined) w.flight.alt += rise;
      } else if (!w.indoor && !w.walk && map && !this.walkable(w, w.at)) {
        const free = map.freeNear(w.at, 40);
        if (free) w.at = free;
      }
      this.place(w);
    }
  }

  /** Takes every walker off the map. */
  clear(): void {
    for (const name of this.names()) this.remove(name);
  }

  /** Whether any walker is on the move. */
  get busy(): boolean {
    for (const w of this.walkers.values()) if (w.walk || w.flight || this.driven(w) || w.moving > 0 || w.ride === "fly") return true;
    return false;
  }

  private advance(w: Walker, dt: number): number {
    const walk = w.walk!;
    let budget = walk.speed * dt;
    let travelled = 0;
    while (budget > 0 && walk.leg < walk.points.length) {
      const [tx, ty] = walk.points[walk.leg]!;
      const dx = tx - w.at[0];
      const dy = ty - w.at[1];
      const d = Math.hypot(dx, dy);
      if (d > 1e-6) this.faceTowards(w, (Math.atan2(dx, dy) * 180) / Math.PI, dt, walk.speed);
      if (d <= budget) {
        w.at = [tx, ty];
        budget -= d;
        travelled += d;
        walk.leg++;
      } else {
        w.at = [w.at[0] + (dx / d) * budget, w.at[1] + (dy / d) * budget];
        travelled += budget;
        budget = 0;
      }
    }
    walk.metres += travelled;
    if (walk.leg >= walk.points.length) this.finish(w, true);
    return travelled;
  }

  /**
   * Steers by hand for `dt` seconds. On foot the walker goes at once at the pace it is given; the
   * scooter speeds up to it and slows down, and rolls on a while when let go; the drone speeds up
   * and slows the same way, and climbs and comes down too.
   */
  private drive(w: Walker, dt: number): number {
    if (w.drive.turn) {
      w.heading = (((w.heading + w.drive.turn * dt) % 360) + 360) % 360;
      w.figure.setHeading(w.heading);
    }
    let pace = w.drive.forward;
    if (w.ride === "scooter") {
      const want = w.drive.forward;
      const rate = !want ? SCOOTER_COAST : want * w.speed < 0 || Math.abs(want) < Math.abs(w.speed) ? SCOOTER_BRAKE : SCOOTER_ACCEL;
      w.speed = approach(w.speed, want, rate * dt);
      pace = w.speed;
    } else if (w.ride === "fly") {
      w.speed = approach(w.speed, w.drive.forward, DRONE_ACCEL * dt);
      if (w.lift) {
        // Taking off: up to its height over the ground, slowing as it comes to it. Beside a roof
        // that stands higher (it took off by a wall), it is up already, at the roof.
        const want = this.host.groundAt(w.at[0], w.at[1]) + w.lift.above;
        const dz = want - w.alt;
        w.climb = Math.max(-DRONE_CLIMB, Math.min(DRONE_CLIMB, dz * 2));
        if (this.floorUnder(w.at) >= want - 0.02) {
          this.rise(w, 0);
          w.climb = 0;
          this.endLift(w);
        } else if (Math.abs(dz) <= Math.max(0.02, Math.abs(w.climb) * dt)) {
          this.rise(w, dz);
          w.climb = 0;
          this.endLift(w);
        } else this.rise(w, w.climb * dt);
      } else {
        w.climb = approach(w.climb, w.drive.climb, DRONE_ACCEL * dt);
        this.rise(w, w.climb * dt);
      }
      pace = w.speed;
    }
    if (!pace) return 0;
    const rad = (w.heading * Math.PI) / 180;
    const d = pace * dt;
    const next: Pt = [w.at[0] + Math.sin(rad) * d, w.at[1] + Math.cos(rad) * d];
    if (!this.passable(w, next)) {
      // Slide along the wall: try the two directions either side.
      for (const off of [35, -35, 70, -70]) {
        const r2 = ((w.heading + off) * Math.PI) / 180;
        const alt: Pt = [w.at[0] + Math.sin(r2) * d * 0.6, w.at[1] + Math.cos(r2) * d * 0.6];
        if (this.passable(w, alt)) {
          w.at = alt;
          return Math.abs(d) * 0.6;
        }
      }
      // Into a wall head on, a scooter or a drone stops dead.
      w.speed = 0;
      return 0;
    }
    w.at = next;
    return Math.abs(d);
  }

  /** Whether a walker can go onto a point: on foot or on the scooter, free ground; flying, any point it clears. */
  private passable(w: Walker, p: Pt): boolean {
    return w.ride === "fly" ? this.floorUnder(p) <= w.alt + 0.05 : this.walkable(w, p);
  }

  /**
   * The lowest the drone's skids may be over a point, metres above sea level: clear of the ground
   * and of every roof within the reach of its rotors.
   */
  private floorUnder(p: Pt): number {
    const roof = this.host.roofs()?.near(p, DRONE_REACH);
    return Math.max(this.host.groundAt(p[0], p[1]), roof ?? -Infinity) + DRONE_CLEAR;
  }

  /** Raises the drone by `dz` metres (negative: lowers it), between what is under it and the ceiling. */
  private rise(w: Walker, dz: number): void {
    const floor = this.floorUnder(w.at);
    const ceiling = this.host.groundAt(w.at[0], w.at[1]) + DRONE_CEILING;
    const alt = Math.min(Math.max(floor, ceiling), Math.max(floor, w.alt + dz));
    // Held at the floor or the ceiling, it stops climbing or coming down.
    if ((alt === floor && w.climb < 0) || (alt <= ceiling && w.alt + dz > ceiling && w.climb > 0)) w.climb = 0;
    w.alt = alt;
  }

  /**
   * A flight the drone makes by itself for `dt` seconds: up or down to its height first, then
   * straight across, slowing as it comes in. Returns the metres it went over the ground.
   */
  private flyOn(w: Walker, dt: number): number {
    const f = w.flight!;
    if (f.above !== undefined) f.alt = Math.max(this.floorUnder(w.at), this.host.groundAt(w.at[0], w.at[1]) + f.above);
    const dz = f.alt - w.alt;
    w.climb = Math.max(-DRONE_CLIMB, Math.min(DRONE_CLIMB, dz * 2));
    const before = w.alt;
    // Close to its height it comes to it exactly, rather than ever more slowly.
    const there = Math.abs(dz) <= Math.max(0.02, Math.abs(w.climb) * dt);
    this.rise(w, there ? dz : w.climb * dt);
    // Held under its height by a roof or the ceiling, it goes on from where it is.
    const held = dt > 0 && Math.abs(dz) > 1e-3 && Math.abs(w.alt - before) < 1e-4;
    const level = Math.abs(f.alt - w.alt) < 1 || held;
    if (!f.to) {
      w.speed = 0;
      if (Math.abs(f.alt - w.alt) < 0.03 || held) this.finishFlight(w, true);
      return 0;
    }
    // A roof on the way that came in after the flight was planned (a landmark's model) raises it.
    const roof = this.host.roofs()?.along(w.at, f.to);
    if (roof !== undefined && roof + CRUISE_OVER > f.alt) {
      const ceiling = Math.min(this.host.groundAt(w.at[0], w.at[1]), this.host.groundAt(f.to[0], f.to[1])) + DRONE_CEILING;
      f.alt = Math.max(f.alt, Math.min(ceiling, roof + CRUISE_OVER));
    }
    if (!level) return 0;
    const dx = f.to[0] - w.at[0];
    const dy = f.to[1] - w.at[1];
    const d = Math.hypot(dx, dy);
    if (d < 0.3) {
      w.speed = 0;
      w.climb = 0;
      this.finishFlight(w, true);
      return 0;
    }
    this.faceTowards(w, (Math.atan2(dx, dy) * 180) / Math.PI, dt, f.speed);
    w.speed = approach(w.speed, Math.min(f.speed, d * 1.2 + 0.5), DRONE_ACCEL * dt);
    const step = Math.min(d, w.speed * dt);
    const next: Pt = [w.at[0] + (dx / d) * step, w.at[1] + (dy / d) * step];
    if (!this.passable(w, next)) {
      w.speed = 0;
      this.finishFlight(w, false, "something stands in the way higher than it can fly");
      return 0;
    }
    w.at = next;
    f.metres += step;
    return step;
  }

  private finishFlight(w: Walker, arrived: boolean, reason?: string): void {
    const f = w.flight;
    if (!f) return;
    w.flight = undefined;
    w.climb = 0;
    f.resolve?.({ arrived, reason, metres: Math.round(f.metres), seconds: Math.round((this.now - f.startedAt) / 100) / 10 });
  }

  /** Whether a walker steered by hand may step onto a point: free ground out of doors, the floor indoors. */
  private walkable(w: Walker, p: Pt): boolean {
    if (w.indoor) return this.host.insideFloor(w.indoor.building, w.indoor.floor, p);
    const map = this.host.walkMap();
    if (!map) return true;
    const box = this.local?.box;
    const margin = 30;
    if (!box || p[0] < box[0] + margin || p[1] < box[1] + margin || p[0] > box[2] - margin || p[1] > box[3] - margin) {
      const half = LOCAL_BOX / 2;
      const b: [number, number, number, number] = [p[0] - half, p[1] - half, p[0] + half, p[1] + half];
      this.local = { grid: map.grid(b, 1), box: b };
    }
    const g = this.local!.grid;
    const [c, r] = cellOf(g, p);
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return false;
    return g.cost[r * g.cols + c]! !== Infinity;
  }

  private faceTowards(w: Walker, target: number, dt: number, speed: number): void {
    const diff = ((target - w.heading + 540) % 360) - 180;
    // A walker sped up turns faster too, so it never cuts a corner wide.
    const max = TURN_RATE * dt * Math.max(1, speed / WALK_SPEED);
    w.heading = (w.heading + Math.max(-max, Math.min(max, diff)) + 360) % 360;
    w.figure.setHeading(w.heading);
  }

  private finish(w: Walker, arrived: boolean, reason?: string): void {
    const walk = w.walk;
    if (!walk) return;
    w.walk = undefined;
    walk.resolve({ arrived, reason, metres: Math.round(walk.metres), seconds: Math.round((this.now - walk.startedAt) / 100) / 10 });
  }

  private cancel(w: Walker, reason: string): void {
    if (w.walk) this.finish(w, false, reason);
    if (w.flight) this.finishFlight(w, false, reason);
  }

  /** Puts the figure where the walker is: on the ground, or on the floor it is on; flying, the drone where it flies. */
  private place(w: Walker): void {
    const inside = w.indoor ? this.host.floorTop(w.indoor.building, w.indoor.floor) : undefined;
    // Out of doors the feet stand on the paint of paths and streets, which lies a little over the ground.
    w.groundRef = this.host.groundAt(w.at[0], w.at[1]);
    w.height = inside ?? w.groundRef + GROUND_PAINT;
    w.figure.root.position.set(w.at[0], w.height, -w.at[1]);
    w.figure.setHeading(w.heading);
    if (w.ride === "fly" && w.drone) {
      w.height = w.alt;
      w.drone.root.position.set(w.at[0], w.alt, -w.at[1]);
      w.drone.root.rotation.y = (-w.heading * Math.PI) / 180;
    }
    const over = w.ride === "fly" ? -1.4 : w.ride === "scooter" ? DECK : 0;
    for (const [label, up] of [
      [w.nameLabel, 2.25],
      [w.sayLabel, 2.9],
    ] as const) {
      label.x = w.at[0];
      label.y = w.height + up + over;
      label.z = -w.at[1];
    }
  }
}

/** `v` moved towards `to` by at most `step`. */
function approach(v: number, to: number, step: number): number {
  return v < to ? Math.min(to, v + step) : Math.max(to, v - step);
}
