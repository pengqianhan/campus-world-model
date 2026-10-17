---
name: street-look
description: "Give a campus world model's walker views the street look: sky, light, facades, ground and trees drawn by rule from the map's own data, with the map view unchanged. Use to bring the look to a world model that lacks it, tune it for another city, or change or check it where it is."
argument-hint: "[bring | tune | check]"
---

# The street look

A campus world model's **walker** is seen from above on the map, from behind, and through its
eyes. The two views from the ground are the **walker views**, and the **street look** is what they
draw: a sky lit from the real sun; every building with storeys, windows and walls; the ground as
asphalt, kerbs, paving, grass and water; trees of bark and leaves; all **by rule** from what the
map's data already holds, and with the **map view unchanged**. UoA World Model built it in
`src/scene/street/` (pull request #50, October 2026), and this skill treats that code as the
reference: in a fork the module drops in, and in another three.js world model each layer is built
again from its page of [LAYERS.md](LAYERS.md), in the same order.

## What binds the look

The "Rules" of [AGENTS.md](../../../AGENTS.md) bind the look as they bind the site. Four carry
most of the weight here:

- **By rule, nothing placed.** Every storey, bay, wall material, lit room, lane line, kerb, leaf and
  bough comes from an outline, a height, a class or a position already in `public/data/`, seeded
  by position so it is the same on every visit, and About says what is drawn by rule. What no
  source maps is absent: doors, crossings, arrows, signs, lamps, benches, cars, people. Fetching
  any of them (OpenStreetMap maps some) is a gate.
- **The map is unchanged.** The map's palette and lighting are settled decisions. Every street
  material goes on when a walker view opens and the map's own comes back when it closes; the
  renderer's output path draws the map straight to the screen as before; and a pixel diff of the
  map against the previous commit, at threshold 0, is part of every check.
- **No new dependency.** three's own modules do it all: the renderer's `outputBufferType` and
  `setEffects` for the HDR path, `Sky`, `PMREMGenerator`, `GTAOPass`, `UnrealBloomPass`. Textures
  are drawn on canvases at start-up, never fetched.
- **Tiers within a budget.** A graphics card gets the full tier; a software renderer (CI), a phone,
  and a machine whose frames run long get the basic tier: the same sky and light, no effects, no
  environment map. The budget is the maintainer's, measured on their machine before and after
  every layer ([CHECKS.md](CHECKS.md), "Frame time").

Windows split into lights and mullions on curtain walls, drawn by rule, extend how the maintainer
decided a University building looks from outside. In another world model that decision is its
maintainer's: a **gate**, put to them once, written under Decisions before any code.

## Steps

Bringing the look is steps 1 to 5. Tuning it for another city is steps 3 to 5. Changing or checking
it where it already is: steps 4 and 5, against the previous commit.

1. **Decide.** Read the world model's Decisions on how its buildings look and what the map draws by
   rule. Put the gate and the frame budget to the person you work for, once, and write the answer
   under Decisions.
   Done when Decisions names what the walker views may draw by rule, the frame budget, and the
   machine it is measured on.

2. **Bring.** In a fork, copy `src/scene/street/` and apply every hook in [WIRING.md](WIRING.md).
   Elsewhere, build the layers of [LAYERS.md](LAYERS.md) in their order, sky and light first, on
   the same hooks. One commit per layer, each checked (step 4) before the next, because each
   layer's screenshots are compared with the one before.
   Done when `npm run typecheck` passes; `streetState()` reports `tier: "off"` on the map and
   `active: true` with `sky: true` in a walker view; and the map's pixel diff after the first layer
   is zero.

3. **Feed.** Each layer reads the map through the seams in LAYERS.md ("Auckland in it" under each
   layer): building kinds, floors and heights; road, path, rail and water kinds; trees and the
   months of the deciduous; the ground; the sun, the weather and the season. Point each at this
   school's data, and leave absent what it lacks.
   Done when every count in `streetState()` (facades, ground surfaces, water, trees) is above zero
   where the data holds the thing and zero where it does not, and the About sentence on what the
   walker views draw by rule (`about.limits.context` in `en.json`) is true of this school.

4. **Check.** Follow [CHECKS.md](CHECKS.md): screenshots opened and read on both tiers, by day, at
   dusk and by night, in rain and in fog, close to a wall, a kerb and a trunk, and from a slope;
   the map's pixel diff; the frame time against the budget on both tiers; `npm test` with the look's
   unit tests re-pointed at this school's buildings; e2e test 21 re-pointed at a street, a lawn with
   trees and water here.
   Done when every screenshot has been opened and nothing in it is placed, the map diff is zero,
   the frame time is within budget on both tiers, and typecheck, unit tests and e2e are green on
   the commit.

5. **Record.** About says what the walker views draw by rule and what is absent because it is not
   mapped; CHANGELOG and the README's "What's new" carry the change, with a README picture from
   behind the walker and one through its eyes at night; PROGRESS.md's Decisions hold the gate, each
   tier with its measured frame time and machine, and what was left for later with its cost.
   Done when a reader of PROGRESS.md alone can say what the look draws, what it never draws and
   why, and what each tier costs on which machine.
