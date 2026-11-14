// The walker's numbers in Study Quest (game.ts): what its blows, its dodge and its flashcard take
// and do. In a module of their own so that the walker's figure (scene/figureMoves.ts), which every
// walk draws, times its moves by them without bringing the game's rules into the page's main chunk.

export const PLAYER = {
  /** Metres a highlighter strike reaches, past the foe's edge. */
  strikeReach: 3.2,
  /** Degrees either side of the aim that a strike sweeps. */
  strikeArc: 75,
  /** Seconds each blow of the three-blow combo takes, and how hard it hits. */
  strikeTime: [0.26, 0.26, 0.42],
  strikeMult: [1, 1.15, 1.9],
  strikePush: [1.2, 1.4, 4.5],
  /**
   * Seconds from the start of each blow to when it lands: the wind-up the walker's arms make
   * before it (figure.ts), the overhead slam's the longest.
   */
  strikeContact: [0.09, 0.09, 0.17],
  /** Seconds after a blow in which the next one carries the combo on. */
  comboWindow: 0.7,
  dodgeTime: 0.3,
  dodgeMetres: 5,
  /** The Cram Sprint: a longer dash that strikes what it passes. */
  sprintMetres: 9,
  dodgeCost: 22,
  iframes: 0.38,
  cardCost: 12,
  cardCooldown: 0.45,
  cardSpeed: 26,
  cardLife: 1.1,
  /** Seconds from the start of a throw to when the card leaves the hand. */
  cardRelease: 0.1,
  eurekaRadius: 8.5,
  eurekaMult: 3.2,
  eurekaCharge: 100,
  staminaRegen: 30,
  /** Focus a second it gets back when nothing has hurt it for `calm` seconds. */
  focusRegen: 2.5,
  calm: 5,
  /** Soft aim: a strike turns to a foe this near and this far off the way the walker faces. */
  softReach: 9,
  softArc: 65,
  lockReach: 28,
  /** Seconds a hit chain lasts without another hit. */
  chainTime: 2.6,
  /**
   * Seconds the foes freeze when a blow lands (hit-stop): a light blow, the combo's finisher (or a
   * Eureka, or a heavy blow), a critical blow, and a critical finisher. Each harder blow holds longer.
   */
  hitStop: { light: 0.045, heavy: 0.085, crit: 0.11, critHeavy: 0.13 },
} as const;
