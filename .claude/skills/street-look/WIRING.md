# Wiring

Reference for step 2 of [SKILL.md](SKILL.md): where the look joins the scene, and the contract the
two keep so that the map stays bit-identical. In a fork of UoA World Model these are the seams to
re-apply after copying `src/scene/street/`; in another three.js world model they are what to build
the look's hooks to. The reference is pull request #50 of UoA World Model.

## The renderer is made for the look

`outputBufferType` is fixed when the renderer is constructed, so the tier is decided first.
`streetTier(lite)` (`tier.ts`) opens a scratch WebGL2 context, asks whether it can draw into half
floats (`EXT_color_buffer_float` or `EXT_color_buffer_half_float`) and whether the renderer's name
says software (`/swiftshader|llvmpipe|softpipe|basic render|software/i`), lets the context go, and
answers `full` or `basic`; `lite` (the phone media query in `SceneHost.tsx`) is `basic` outright,
and so is any exception. The renderer then takes
`outputBufferType: tier === "full" ? HalfFloatType : UnsignedByteType`, with `antialias` and
`stencil` on. With `NoToneMapping` and no effects, three's `WebGLOutput` steps aside and the map
draws straight to the canvas as it always did; with tone mapping set, a half-float renderer draws
into its own 4x multisampled target and tone-maps on the way out. That is the whole trick that
keeps the map untouched.

| | full | basic |
| --- | --- | --- |
| Output | half-float, 4x MSAA target, ACES on the way out | bytes; ACES applied in each material |
| Pixel ratio in a walker view | capped at 1.25 | unchanged |
| Effects | `GTAOPass` and `UnrealBloomPass` through `renderer.setEffects` | never loaded |
| Sky light | `PMREMGenerator` environment map, hemisphere light off | hemisphere light = the sky's radiance x pi, no environment map |
| Depth first | walls and leaves into depth alone, then shaded once | drawn once |
| Ground | anisotropy up to 8, asphalt read twice | `GD_LITE`: up to 2, read once |
| Tree cards | within 160 m | within 80 m |
| Governor | on | off |

Shadows follow `lite`, not the tier: a software renderer keeps them, a phone has none.

## `StreetLook`: on with the view, off with it

`CampusScene` owns one `StreetLook` (`look.ts`), given the renderer, the scene, the perspective
camera, the three lights (`sun`, `hemi`, `ambient`), the tier, a `redraw` callback and a `dress`
callback. Everything in it is on only while a walker view is.

- **`enter()`** saves the pixel ratio, the shadow radius, the exposure and the ambient colour; sets
  the ambient to the sky's blue, caps the pixel ratio (full tier), sets ACES tone mapping and a
  softer shadow; installs the kit if loaded, else loads it; then applies the light.
- **`exit()`** removes the sky dome and the night group, drops the environment and the haze, clears
  the effects, and puts tone mapping, exposure, shadow radius, ambient colour and pixel ratio back.
  It does not restore the sun's colour and strength, the hemisphere light or the map's own fog:
  `CampusScene.applyPalette()` runs straight after and does, which is why `setWalkerView` calls
  `exit()` or `enter()` before `applyPalette()` ("the street look goes on before the palette,
  which then lights it").
- **The kit loads lazily** on the first walker view: `sky.ts`, `night.ts`, `facade.ts`,
  `ground.ts` and `trees.ts` by dynamic import, and `effects.ts` on the full tier only. Until it
  arrives the `facades`, `ground` and `trees` getters are undefined, so the map's materials stay in
  place and `state().sky` is false; on arrival it installs, applies, and calls `dress`, and the
  scene swaps its materials.
- **`setLight({ sun, night, weather })`** stores the inputs and applies them when on;
  `CampusScene.lightStreet()` passes its sun direction, night amount and weather from `setSun`,
  `setNight`, `setWeather` and `applyPalette`. **`setSeason(month)`** reaches the trees.
- **`render()`** moves the sky, the stars, the effects' clip box and the tree layout with the
  camera; ticks the three clocks (minutes for the lit windows, seconds for ripples and sway, all
  from `performance.now()`); refreshes the environment map when the sun has turned a degree; sets
  the clear colour to the haze (the sky low down where the camera looks, tone-mapped first on the
  basic tier); renders; governs.
- **The governor** runs once per `StreetLook`: it collects the gaps between the first 20 frames
  drawn one after another (a gap over 250 ms is the view standing still) and, if their median
  passes 40 ms, drops to `basic` by clearing the effects. The output buffer, environment map and
  depth-first passes stay as they were, and `state()` reports `tier: "basic"` from then on.
- **`state()`** is what `streetState()` and the e2e spec read: `active`, `tier` (`off` when not
  on), `passes`, `sky`, `exposure`.
- **`dispose()`** exits and disposes every kit object; the scene calls it before the renderer's.

## Every material swaps; none is edited

The map's materials are the mesh's own and are never edited for the look. Each mesh the look
dresses keeps the map's material in `userData.mapMaterial`, and three `dress*` methods in
`CampusScene` swap in either direction, called from `setWalkerView`, from the kit's arrival and from
every rebuild (`setCampus`, `setContext`, `setTerrain`, `rebuildDetail`):

- `dressBuildings()`: University buildings take one `StreetFacades.material("university")` each
  (cached by building id in `streetMaterials`, so a building keeps its tint and its sinking beside
  an open one), the city's one mesh takes the shared `city` material, and an open building's
  "below" and "cut" walls take `openMaterials`. `restyle()` keeps editing the colours of the
  `mapMaterial` while a walker view is open, so the map is current the moment the view closes.
- `dressGround()`: each paint layer takes `StreetGround.paint(kind, lift - GROUND_PAINT)` (one
  material per kind, cached), and the terrain meshes and the 9,000 m plane take `StreetGround.open`
  in place of the shared `groundMaterial`; the terrain is lifted by `GROUND_PAINT`, the plane too
  with its map height saved in `userData.mapY`, and both go back exactly where the map had them.
- `dressTrees()`: the map's tree meshes stay; the `StreetTrees` group is added into the map's
  `trees` group and shown or hidden by name, with a shadow refresh when that changes.

Street materials are created once and disposed only with the kit.

## Geometry carries what the look reads, and nothing moves

`MeshBuilder(withColor, withUV, withFacade, withRibbon)` (`geometry.ts`) adds, when asked, the
per-vertex attributes the look reads: `facade` and `facadeStoreys` from a `FacadeSpec` set on the
builder before extruding (`extrude` marks walls along their face via `faceRuns`, caps as roofs,
bottoms and parapets as plain, `face` as pitched); `ribbon` from `ribbon()`; and
`drape(geometry, height, maxEdge, slopeAt)` carries them through its splits and adds `slope` from
`Terrain.normal`, or `levelSlope()` gives a level one. Neither adds a vertex or moves one, which
`tests/facade.test.ts` and `tests/ground.test.ts` assert ("changes nothing the map draws"); the
map's materials ignore the attributes, at the cost of about 24 MB they never read and a slower
`setContext`. Builders in use: University and open-building walls `(true, true, true)`, the city
`(true, false, true)`, roads, kerbs and rails `(false, false, false, true)`, areas `()` with
`slope` alone. `Terrain.normal(x, y, out)` interpolates the grid's vertex normals and is
`(0, 1, 0)` off every grid.

## Drawing hands over, and what refreshes

`draw()` begins `if (this.street.active) { this.street.render(); return; }`, so a walker view skips
the map's second pass that shows the floor below the ground through a veil: from a walker's height
the ground hides what lies under it. `setWalkerView` sets the eyes' or the follow camera's field
and near plane (64 degrees and 0.2 m; 55 degrees and 0.3 m), takes the `mood` before switching,
enters or exits, dresses, applies the palette, restyles if the mood changed, and asks for a shadow
refresh. `mood` is `street.active ? 0 : night`: a walker view keeps the day palette's colours and
makes the night with its light, while `placeSun` still uses the night palette's moon. The map's
inked building edges show only on the map ("from a walker's height a corner shows by its light").
The shadow map does not update itself; walker views ask for it on entering, when the trees'
visibility or the season changes, when the walker has moved 70 m from the shadow's centre
(`fitShadow`), and on `setSun`, `setNight` and `setWeather`. A frame is drawn only when the camera
moved or a second passed, so the sway, the ripples and the lit-window clock advance only when
something draws.

## Order, depth, stencil and occlusion

On the full tier `CampusScene.depthFirst(mesh, on)` gives each wall mesh (the University's, the
city's, an open building's "below") and each terrain mesh a twin at `renderOrder -1`, with a
colour-less material and a small polygon offset, so that walls go into the depth buffer alone and
the facade shader runs once per pixel: a street of buildings drawn in no particular order would
otherwise shade the walls behind as well. A landmark's full form has twins of its own
(`src/scene/landmarks.ts`). A block that a landmark stands in place of goes to layer 1 with its
twin, so that no camera draws it and a click still finds it. The leaves have depth cards of their own at -0.2 and are
coloured with `EqualDepth`. Render order in a walker view: twins -1; open ground -0.9 on the basic
tier; paint from -0.63 (rail) to -0.51 (park), top layer first; open ground colour -0.3 on the
full tier; leaf depth -0.2; everything else 0; the sky dome 1. On the map every order goes back to
0. Stencil bit 1 is the walker figure's (its shape shows through what hides it) and bit 2
(`PAINT_STENCIL`) the paint's. Ambient occlusion leaves out points, lines and anything with
`userData.noAO`: the paint, whose triangles stay where the map lifted them while the shader lowers
them, and the trees' cards and far crowns.

## Where the shaders hook into three

Every injection into three's shader chunks (`onBeforeCompile` in `facade.ts`, `ground.ts` and
`trees.ts`; the final-line replacement in `sky.ts`; the two private methods `effects.ts` overrides
on `GTAOPass`) first checks that its anchor is where three 0.186 puts it, and throws, naming the
file, if not. An upgrade of three therefore fails at the first walker view with a message that
says what moved, instead of drawing wrongly.

## The look's account of itself

`CampusScene.streetState()` returns `StreetLook.state()` plus the counts the e2e spec asserts on:
`facades` (University meshes wearing a `StreetFacade` material, and whether the city's mesh does),
`ground` (meshes wearing a `StreetGround` material, and whether one is the water) and `trees`
(trees drawn again, and cards of leaves). `e2e/helpers.ts` types it on `window.__scene`, beside
`setWalkerLook(yaw, pitch)`. `about.limits.context` in `en.json` is the sentence that says what
the walker views draw by rule and what is absent because it is not mapped.
