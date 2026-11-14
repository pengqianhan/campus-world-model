// The camera behind a walker in a fight: how far back it stands and how far down it looks, so
// that the walker and the foe it fights are both whole in the clear part of the picture, between
// the panels along its top and the thumbs' buttons along its foot. Pure, so that it can be tested
// without a browser.

/**
 * What a fight's camera frames. Heights are metres above sea level; the camera stands at `base`
 * metres plus `tanUp` of its distance back; the foe is `ahead` metres beyond the walker along the
 * view and `foeHalf` metres either side of its middle. `halfFov` is half the picture's height in
 * radians, `tanHalfWide` the tangent of half its width. The camera stands `minReach` to `maxReach`
 * metres back from the walker over the ground. The clear band, as shares of the picture's height
 * from its top: everything below `top`, the walker above `bottom`, the foe above `foeBottom`; the
 * foe within `wide` of its width.
 */
export interface FightShot {
  walkerFoot: number;
  walkerTop: number;
  base: number;
  tanUp: number;
  ahead: number;
  foeFoot: number;
  foeTop: number;
  foeHalf: number;
  halfFov: number;
  tanHalfWide: number;
  minReach: number;
  maxReach: number;
  top: number;
  bottom: number;
  foeBottom: number;
  wide: number;
}

/**
 * What frameFight finds: metres back from the walker over the ground, radians the view looks down
 * (negative) or up, and whether the two fit at all (a foe high on a roof, or under the camera, may not).
 */
export interface FightFrame {
  reach: number;
  pitch: number;
  fits?: boolean;
}

/** Metres between the distances frameFight tries. */
const STEP = 0.5;

/** Radians above the middle of the picture at which a share `y` of its height from the top lies. */
function above(y: number, halfFov: number): number {
  return Math.atan(Math.tan(halfFov) * (1 - 2 * y));
}

/**
 * The pitch that sets the highest point (`hi`, radians up from level) below the band's top and the
 * walker's feet (`walkerLo`) and the foe's (`foeLo`) above their bottoms, in the middle of the room
 * there is; and how much room is left (negative when they do not fit).
 */
export function bandPitch(hi: number, walkerLo: number, foeLo: number, shot: FightShot): { pitch: number; room: number } {
  const least = hi - above(shot.top, shot.halfFov);
  const most = Math.min(walkerLo - above(shot.bottom, shot.halfFov), foeLo - above(shot.foeBottom, shot.halfFov));
  // When they do not fit (a wall has brought the camera in), the feet stay in the band and the top
  // of the foe goes: the walker is never lost under the buttons along the foot of the picture.
  return { pitch: most >= least ? (least + most) / 2 : most, room: most - least };
}

/**
 * The nearest distance back at which the walker (feet to head) and the foe (feet to top) both fit
 * in the clear band of the picture and the foe across `wide` of its width, and the pitch that
 * centres them in the band; `maxReach` when none fits. Writes into `out`, which it returns.
 */
export function frameFight(shot: FightShot, out: FightFrame): FightFrame {
  const s = Math.max(0, shot.ahead);
  for (let r = shot.minReach; ; r += STEP) {
    const last = r >= shot.maxReach;
    const R = Math.min(r, shot.maxReach);
    const h = shot.base + R * shot.tanUp;
    const a0 = Math.atan2(shot.walkerFoot - h, R);
    const a1 = Math.atan2(shot.walkerTop - h, R);
    const b0 = Math.atan2(shot.foeFoot - h, R + s);
    const b1 = Math.atan2(shot.foeTop - h, R + s);
    const band = bandPitch(Math.max(a1, b1), Math.min(a0, a1), Math.min(b0, b1), shot);
    const wide = (R + s) * shot.tanHalfWide * shot.wide >= shot.foeHalf;
    if ((band.room >= 0 && wide) || last) {
      out.reach = R;
      out.pitch = band.pitch;
      out.fits = band.room >= 0 && wide;
      return out;
    }
  }
}

/** Degrees the fight's camera stands off the line of a charge, on the side it is already on. */
export const LANE_DODGE = 50;

/** Degrees from `a` to `b` the short way round, -180 to 180. */
function turn(a: number, b: number): number {
  return ((((b - a) % 360) + 540) % 360) - 180;
}

/**
 * The bearing the fight's camera looks along while its foe charges at the walker along `lane`
 * (degrees, the way the charge runs): behind the walker on the line from the foe, the camera would
 * stand at the end of the charge, and the foe would run into it and hide the walker. It stands off
 * that line by LANE_DODGE instead, on the side it is on now (`now`, the bearing it looks along), so
 * that it does not swing across the charge to get there. `want` when there is no charge.
 */
export function dodgeLane(want: number, lane: number | undefined, now: number): number {
  if (lane === undefined) return want;
  // Looking back up the charge, towards where it comes from.
  const up = lane + 180;
  const side = turn(up, now) < 0 ? -1 : 1;
  return (((up + side * LANE_DODGE) % 360) + 360) % 360;
}

/**
 * The camera's place over the ground (metres east and north) moved straight out from a foe's
 * middle to `min` metres from it, when it is nearer: never inside or against a big foe. Writes
 * into `out`, which it returns; the camera as it was when it is far enough.
 */
export function clearOf(cam: readonly [number, number], foe: readonly [number, number], min: number, out: [number, number]): [number, number] {
  const dx = cam[0] - foe[0];
  const dy = cam[1] - foe[1];
  const d = Math.hypot(dx, dy);
  if (d >= min) {
    out[0] = cam[0];
    out[1] = cam[1];
  } else if (d < 1e-6) {
    out[0] = foe[0];
    out[1] = foe[1] - min;
  } else {
    out[0] = foe[0] + (dx / d) * min;
    out[1] = foe[1] + (dy / d) * min;
  }
  return out;
}
