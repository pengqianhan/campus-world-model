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

/** What frameFight finds: metres back from the walker over the ground, and radians the view looks down (negative) or up. */
export interface FightFrame {
  reach: number;
  pitch: number;
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
  return { pitch: (least + most) / 2, room: most - least };
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
      return out;
    }
  }
}
