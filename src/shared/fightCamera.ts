// The camera behind a walker in a fight: how far back it stands and how far down it looks, so
// that the walker and the foe it fights are both whole in the picture. Pure, so that it can be
// tested without a browser.

/**
 * What a fight's camera frames. Heights are metres above sea level; the camera stands at `base`
 * metres plus `tanUp` of its distance back; the foe is `ahead` metres beyond the walker along the
 * view and `foeHalf` metres either side of its middle. `halfFov` is half the picture's height in
 * radians, `tanHalfWide` the tangent of half its width. The camera stands `minReach` to `maxReach`
 * metres back from the walker over the ground.
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
}

/** What frameFight finds: metres back from the walker over the ground, and radians the view looks down (negative) or up. */
export interface FightFrame {
  reach: number;
  pitch: number;
}

/** Metres between the distances frameFight tries. */
const STEP = 0.5;

/**
 * The nearest distance back at which the walker (feet to head) and the foe (feet to top) both fit
 * in `fill` of the picture's height and the foe in `fill` of its width, and the pitch that centres
 * them, looking `lift` of half the picture lower so that they stand a little above its middle,
 * clear of the bars along its foot; `maxReach` when none fits. Writes into `out`, which it returns.
 */
export function frameFight(shot: FightShot, out: FightFrame, fill = 0.7, lift = 0.16): FightFrame {
  const room = 2 * shot.halfFov * fill;
  const s = Math.max(0, shot.ahead);
  for (let r = shot.minReach; ; r += STEP) {
    const last = r >= shot.maxReach;
    const R = Math.min(r, shot.maxReach);
    const h = shot.base + R * shot.tanUp;
    const a0 = Math.atan2(shot.walkerFoot - h, R);
    const a1 = Math.atan2(shot.walkerTop - h, R);
    const b0 = Math.atan2(shot.foeFoot - h, R + s);
    const b1 = Math.atan2(shot.foeTop - h, R + s);
    const lo = Math.min(a0, a1, b0, b1);
    const hi = Math.max(a0, a1, b0, b1);
    const wide = (R + s) * shot.tanHalfWide * fill >= shot.foeHalf;
    if ((hi - lo <= room && wide) || last) {
      out.reach = R;
      out.pitch = (hi + lo) / 2 - lift * shot.halfFov;
      return out;
    }
  }
}
