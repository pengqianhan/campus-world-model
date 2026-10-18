# Checks

Reference for step 4 of [SKILL.md](SKILL.md), and for the first pixel diff of step 2. The street
look is checked the way it was built: by looking at it, by proving the map did not move, and by
measuring the frame. A green run over a black canvas is a failure (docs/standards.md).

## Opening a walker view

The address opens a walker view directly, with the time fixed so that two shots compare:
`?walk=1&view=eyes&light=day&time=preview&date=2026-03-20&t=15:00`. `view=follow` is the view from
behind; `light=night&t=21:00` the night; `walk=<east>,<north>` in metres puts the walker there
(`walk=-12,214` is Princes Street by Auckland's Clock Tower). Wait for `window.__walker.ready()`
and then for `window.__scene.streetState().sky`, which comes in a chunk of its own.

From the page, `window.__walker.run("list")` gives the walker's `heading`,
`await window.__walker.run("walk", { to, speed: 40 })` walks it to a building number or an
`"east,north"`, and `window.__scene.setWalkerLook(bearing - heading, pitch)` aims the view. The
e2e spec does all three (`e2e/street.spec.ts`).

`window.__scene.streetState()` is the look's own account of itself: `active`, `tier` (`full`,
`basic`, `off`), `passes`, `sky`, `exposure`, and the counts `facades` (University buildings and
the city's one mesh), `ground` (surfaces and whether one is water) and `trees` (trees drawn again
and cards of leaves round the camera). On the map every count is zero and the tier is `off`.
`window.__scene.lightState().fog` says whether the haze is on.

Weather is Open-Meteo's in Now mode, so rain and fog are checked the way `e2e/sky.spec.ts` checks
the sky: an Open-Meteo answer with rain or fog served inside the test browser, and `time=now`.

## Looking

Screenshots come from Playwright on a real GPU after `npm run build` and `vite preview`: the dev
server keeps stale optimised dependencies for `three/examples/jsm` modules imported for the first
time, and the picture it serves is not the one that ships. On Windows,
`--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist` give the graphics card, and
`--force_low_power_gpu` the integrated one on a machine with both; `E2E_GL=swiftshader` gives the
software renderer and so the basic tier, as CI sees it.

Open every screenshot and read it. Vantages that showed each layer's faults: a street at eye level
looking down it (kerbs on both edges, the lane line, the footpath strip); a lawn with trees (cards
of leaves without pale edges, bark on the trunk, a leafy shadow); water (a reflection of the sky,
ripples, a glint); a slope (paint that stays on the ground, with nothing fighting through it); a
wall from two metres (storeys that meet the roof, a whole number of bays, the recess of the windows,
the mullions of a curtain wall); the view from behind the walker; the same places at dusk and by
night (lit rooms in a pattern that changes slowly, the moon and stars, a city glow on the ground,
bloom that stays gentle), in rain (gloss on the ground) and in fog. Before and after every layer,
the same shots from the same addresses, side by side.

Before blaming the app for a faded or shifted picture, read the screenshot script: one of the
reference's own scripts dimmed the interface with a style tag it had added itself.

## The map's pixel diff

The map must be the same picture as before the change. Build the commit under test and its parent
(a scratch `git worktree` with a junction or link to `node_modules`), serve both with `vite preview`
on two ports, and from each take canvas-only shots (the interface and the walkers hidden) of the
same map vantages: by day, by night, with a building open, with a floor below the ground open, and
the map after leaving each walker view. Diff at threshold 0, and repeat three times. Through the
reference's sky, facade and ground layers the diff was 0 pixels; after its trees two of eight
vantages differed now and then by at most 8 of 255 on a few pixels, cause not found (issue #51 of
UoA World Model). A difference that comes and goes is that issue; a steady one is the change.

## Frame time

Measure GPU time a frame with `EXT_disjoint_timer_query_webgl2` round the draw, in a walker view,
at the maintainer's window size and the look's pixel ratio, before and after every layer, on the
slowest machine to hand as well as the fastest. The reference's numbers, 1800 x 1125 at pixel
ratio 1.25, all four layers on:

| Renderer | GPU time a frame |
| --- | --- |
| NVIDIA Quadro P600 (full tier) | 12-15 ms |
| Intel UHD 770 (full tier) | 21-26 ms |
| SwiftShader, as CI (basic tier) | about 600 ms |

Chromium takes the discrete GPU unless told `--force_low_power_gpu`, so a machine with two GPUs
gives two numbers. The governor runs once per visit to the look: when the median gap between the
first 20 frames drawn one after another passes 40 ms, it drops the effects, so a slow machine
shows `tier: "basic"` in `streetState()` after a second or two rather than a low frame rate; check
the tier a shot was taken on. The map pays for the look too: attributes the
map never reads (about 24 MB in the reference) and a slower `setContext` (about 70 ms); measure
both when the data is bigger than Auckland's.

## Tests

The look's unit tests are `tests/street.test.ts` (the sky's colours and its sun by day and by
night, the light, the bloom's thresholds, the haze, ACES, and which renderer names mean software),
`tests/facade.test.ts` (storeys from floors or height, bays on a face, the style by seed and
place, the lit-window hash, which gives the same answer in TypeScript and GLSL, the grain, and that
the attributes change nothing the map draws), `tests/ground.test.ts` (a surface for every kind,
lines by road kind, the kerb strip, the ribbon's coordinates, the slope, the grain, wet and glow)
and `tests/trees.test.ts` (the same cards every time, ten to sixteen by size, inside the crown,
broad and small leaves, a southern year, the atlas's mipmaps). Assertions that name an Auckland building
or a count are re-pointed at the new school's data, as the porting skill's SEAMS.md says for every
test.

`e2e/street.spec.ts` is test 21, in two parts: a walker view by day and by night with a sky, a
haze, surfaces, water and trees, and the map lit as before after Escape; and every building in
facades, a wall close up, and the map's materials back after Escape. It opens the view by address,
aims with `setWalkerLook`, takes the screenshots `21-street-eyes-day`, `21-street-ground`,
`21-street-trees`, `21-street-facade` and `21-street-eyes-night`, and asserts on `streetState()`.
Re-point its addresses at a street, a lawn with trees and water of the new campus, and its one walk
at a building beside the start. On CI's software renderer a walk costs two to four times its 20 s
on a desktop against a 180 s limit per test, and the look doubled the e2e job's time (15 of its 20
minutes in the reference, issue #53), so a new street test waits on `expect.poll` rather than
walking, and takes its shots from where the walker starts.

Straight after a deploy the live run (`E2E_BASE_URL=<public URL> npm run e2e`) tends to fail a test
or two on page-load timeouts and pass when run again; a test that fails twice is a failure.

## Faults met while building, and their cures

- **The map's shadows differed from shot to shot** while the tree layer was built: the shadow map
  does not update itself, and a refresh was landing a frame late. The scene now asks for one
  (`needsShadow`) on entering a view, when the trees' visibility or the season changes, when the
  walker has moved 70 m, and on every change of sun, night or weather, so the first frame after a
  change is the settled one.
- **Pale specks round every leaf** came from alpha to coverage over a canvas texture, whose alpha
  the page keeps: the leaves are cut out at a plain alpha test instead.
- **The bloom flooded the picture white** wherever glass or water mirrored the sun: the sun is a
  light of no size, so a pane reflects it thousands of times brighter than the sky draws its disc.
  The specular of glass (`GLINT`) and water (`WATER_GLINT`) is capped a little over the bloom's
  threshold; a white flood is this fault, not the bloom's strength.
- **A new `three/examples/jsm` import drew nothing on the dev server** until its optimised
  dependencies were rebuilt; `vite preview` of a build is what to look at.
- **The output buffer's type is fixed at construction** (`outputBufferType`), so the tier is
  decided before the renderer is made, from the renderer string and the `lite` option, and a
  machine that turns out slow drops to the basic tier by turning the effects off, not by changing
  the buffer.
- **A walker view redraws while anything in it moves** (the sway, the water), so a settled frame is
  never waited for; the e2e spec polls the counts and shoots when they hold.
