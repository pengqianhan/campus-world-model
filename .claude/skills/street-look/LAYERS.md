# Layers

Reference for steps 2 and 3 of [SKILL.md](SKILL.md). The look is four layers, built and committed in
this order, each on the hooks of [WIRING.md](WIRING.md) and each checked against the one before
([CHECKS.md](CHECKS.md)). Every layer draws **by rule** from what `public/data/` already holds and
is **seeded by position**, so a place looks the same on every visit, and every layer has a basic
tier. Under each: what it draws and from what; how the reference does it, by file; and **Auckland
in it**, the seams that step 3 points at the new school's data.

## 1. Sky and light (`light.ts`, `sky.ts`, `night.ts`, `effects.ts`; run by `look.ts`)

**What.** A sky lit from the real sun at the date and time shown; the sky's light on everything;
stars and a moon by night; haze in the colour of the sky low down where the camera looks; an
exposure that opens as the sun sinks and at night; ambient occlusion and a gentle bloom on the
full tier. Weather greys the sky, dims the sun and thickens the haze. Nothing is placed.

**How.** `light.ts` is the whole light in plain numbers, with no GPU: it repeats three's Preetham
sky (`Sky.js`) in TypeScript, so that the haze can take the colour of the sky behind it and a
device without an environment map is lit from the same sky, and `streetLighting(inputs)` gives one
object with the sun's colour and strength, the moon's, the exposure, the haze density, the bloom's
threshold and strength, the stars, the ambient, the window light and the ground glow. `sky.ts`
draws Sky.js on a box round the camera with its final line patched (night, dusk, overcast and haze
terms, kept in step with `light.ts`) and makes the environment map with `PMREMGenerator` from a
second, greyer sky over a ground hemisphere, without the sun's disc (the sun is a light of its own)
and without the clouds (their noise would blotch the light), redone when the sun has turned a
degree. `night.ts` is 2,600 points and one sprite. `effects.ts` runs `GTAOPass` at half the
picture's size each way (the denoising smooths the upscale) inside a clip box round the camera,
and `UnrealBloomPass` at a quarter; the bloom's threshold sits above a sunlit white wall by day and
just under a lit window by night, so that only lights bloom. A walker view keeps the day palette's
colours by night and makes the night with its light; the map's night keeps its own colours.

**Auckland in it.** Nothing of the city's, except through seams the porting skill already names:
the sun from `daylight.ts` (the descriptor's `sun`), the weather from `weather.ts`, and the palette's
`DAY` and `NIGHT` sun azimuth and elevation, which stand in for the sun when it is below the
horizon in a forced day and place the moon by night. The haze density is set so that the map's
edge is hidden by day and no more (`tests/street.test.ts`); a context box much larger or smaller
than Auckland's 1.7 km by 2.8 km wants it looked at.

## 2. Facades (`facade.ts`, `rules.ts`, `surfaces.ts`; attributes from `geometry.ts`)

**What.** Every building, the University's and the city's: storeys; a whole number of bays on every
face, so that no window is cut at a corner; windows in a recess with frames, bars and transoms,
sills and lintels; a plinth and rain streaks; walls of plaster, brick, concrete, stone, glass or
weatherboard chosen by where the building stands; glass that reflects the sky; a room behind each
pane with a blind; and after dark a pattern of lit rooms that changes a few at a time, each window
at a moment of its own. Flat roofs in a membrane, pitched roofs in sheet. No doors: none are mapped.

**How.** One `MeshStandardMaterial` per kind (`university`, `city`) with `onBeforeCompile`, every
style number in a uniform table rather than a shader constant. The geometry carries two per-vertex
vec4s that `MeshBuilder` adds without moving a vertex, so the map's materials, which ignore them,
draw the same picture: `facade` (along the face, up from the ground floor, bay width, style and
seed in one float) and `facadeStoreys` (storey height, ground storey, top, part). Storeys: the
University's from the data's floor height, block by block of its massing; the city's from height
with `cityStoreys` (about 3.3 m each, a taller ground storey from three storeys up, a parapet under
a flat roof). Bays: `faceRuns` walks each face and runs the bays on across edges that do not turn a
corner. Style and seed: `buildingSeed` from the building's middle, `facadeStyle` with weights by
kind, height and roof. Grain: eight small tileable layers (plaster, brick, concrete, stone, panel,
boards, roof, sheet) drawn on canvases at start-up and packed in one `DataArrayTexture` (tilt in R
and G, joints in B, tone in A), flat on average so that a far wall faces the way it is built. Lit
rooms: pcg4d in GLSL and in TypeScript, with a parity test against values read back from three
GPUs; a share per kind, redrawn every 12 minutes; far off a window fades to the average rather than
flicker. The sun is a light of no size, so a pane would mirror it thousands of times brighter than
the sky draws its disc: the specular is capped a little over the bloom's threshold. A building
beside an open one sinks to a flat tint (`setAway`).

**Auckland in it.** The University's storey is the data's `floorHeight` and its bay the map's
`WINDOW_BAY` (half of it on a curtain wall); keep `CITY_STOREY` in step with what the pipeline
takes an OpenStreetMap level to be (`OSM_LEVEL` in `build-data.ts`). The styles and their weights
are an Auckland mix: plaster, concrete and stone for the University, weatherboard on low pitched
city houses, glass on the tall. Re-weight `facadeStyle` and the colour lists in `STYLES` for the
new city's walls (a brick city, a rendered one, a stone one), with colours of your own and none the
school's. The kinds set the lit share (`LIT_SHARE`). Data each building needs: the campus's middle,
height, `offMap` and massing; the context's ring, height and roof shape. A city building with no
mapped height has the pipeline's default, and its storeys follow.

## 3. Ground (`ground.ts`, `roads.ts`, `water.ts`, `surfaces.ts`; the slope from `terrain.ts`)

**What.** Under the walker: bare earth and lawn with broad variation (thicker, lighter, lusher
where water lies, worn); asphalt with aged stone, repair patches, wheel tracks and a crown; a
broken centre line on streets and major roads (a 3 m line, a 7 m gap), edge lines on major roads
and motorways, no line on service lanes, paths or steps, and lines that stop short of either end
where roads meet; a kerb face, a kerb top and a footpath of slabs along every street; paving on
paths and treads on steps; sleepers, ballast and rails; water that reflects the sky, with ripples
and a glint. Wet and glossy in rain, lit by a city glow after dark. No crossings, arrows, signs or
lamps: none are mapped. One-way streets are not told apart, so every street has a centre line.

**How.** One shader program for every kind of ground (`GD_<KIND>` defines from `GROUND`), a water
variant, and a lite variant that reads the grain less sharply at a slant and the asphalt once. The
map's paint, flat polygons for areas and ribbons for roads, paths and rails, each lifted a little
above the ground on the map, is lowered in the shader to the walker's feet (`GROUND_PAINT`) in a
walker view while the terrain is lifted to the same, and the layers are told apart by the stencil,
not by depth: the paint does not write depth, is drawn top layer first (rail, then the roads,
paths, kerbs, water, pitches, woods, grass, parks), marks stencil bit 2 where it lands so that no
layer under it draws there, and is pulled a little towards the eye so that the ground's own mesh,
which does not quite follow the same triangles, cannot show through. The open ground draws only
where the bit is clear. Ribbons carry a per-vertex vec4 `ribbon` (metres along the line, metres
across it with left positive, half width, whole length) that the lines, kerbs and sleepers are
drawn from, and every piece of paint a `slope` (the terrain's normal), so paint on a hill is lit
as the hill lies. Grain: seven layers (turf, open ground, asphalt, paving, ballast, ripple, and the
broad variation) in a second `DataArrayTexture`. Water: the ground's vertex shader with a fragment
of its own, two drifting reads of the ripple layer, Schlick fresnel at 2% head on and a capped
glint; it reflects the sky alone, since anything else means drawing the scene again.

**Auckland in it.** The kinds come from the contract (`RoadClass`, `AreaClass` in
`src/shared/types.ts`) and carry over. The widths in `roads.ts` are Auckland's typical ones by
class, the lines are white (`COLOURS.paint`; some countries paint the centre yellow), and the rail
gauge is New Zealand's 1,067 mm (`GAUGE`): set the new country's widths, line colours and gauge.
The earth and lawn colours are Auckland's soil and grass, and `DEEP` its ponds; a drier or redder
city picks its own. The lifts of each layer on the map (`AREA_Y`, `ROAD_Y`, `RAIL_Y` in
`CampusScene.ts`) and the walker's foot height (`GROUND_PAINT`) are the map's, not the look's.
Without terrain every piece of paint is level, and the look still works.

## 4. Trees (`trees.ts`, `crowns.ts`; the bark from `surfaces.ts`)

**What.** Each tree where the map's stands, at the map's size and turn: a trunk with bark, three
boughs, and a crown of ten to sixteen cards of leaves shaded as one round mass, casting a leafy
shadow, swaying in a light breeze that is the same every day; broad or small leaves by seed, since
the data has no species; deciduous trees turn, stand bare with seven forked boughs, and come back
into leaf with the season the map already shows. Beyond 160 m (80 m on the basic tier) a rounded
crown and a plain trunk stand in.

**How.** Instanced meshes, re-laid when the camera has moved 30 m: near trees get the detailed
trunk and the cards, far ones collapse to their far crown in colour and in shadow. A card is two
crossed octagons (the clear corners of a square would be drawn only to be thrown away) reading a
leaf atlas drawn on a canvas, with mipmaps built so that each level keeps the share of covered
texels the largest has and a far crown does not thin away. A leaf's normal is 70% the crown's
volume and 30% the card's, the shadow is looked up out of the crown too, and the inside of the
crown is shaded darker. The leaves are cut out at an alpha test and never smoothed by alpha to
coverage: the page's canvas keeps the picture's alpha, and a part-clear edge lets the page show
through as pale specks. On the full tier the cards' depth goes in first, alone, and their colour
after it only where it is the nearest leaf; a software renderer, with no early depth test to gain,
draws them once. Cards and far crowns are left out of the ambient occlusion.

**Auckland in it.** The seasons are the southern hemisphere's (`leafState`: autumn in April and
May, bare June to August, spring September and October), the same months as the map's
`deciduousColour`: shift both by six months in the north, and re-point the test that turns a tree
through a southern year. The breeze blows towards the north-east, Auckland's south-westerly
(`WIND_TOWARD`): set the prevailing wind. Leaf colours by season (`LEAVES`) and the bark are the
look's own. Sizes come from the map's `buildTrees`, and the deciduous flag from OpenStreetMap's
`leaf_cycle`. With no trees in the data, nothing is planted.
