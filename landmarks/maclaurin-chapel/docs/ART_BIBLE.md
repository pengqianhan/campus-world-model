# Maclaurin Chapel — art bible

Target: Maclaurin Chapel, drawn in code so that it reads as the same building as in the five Street
View photographs in `refs/streetview/`, with its proportions from the LiDAR. Look at the photographs
yourself, at full size (`dsLb…_wide.jpg`, `dsLb…_upper.jpg` and `34Yw…_upper.jpg` above all); this page
says only what they and the aerial show. What none of them shows is drawn plainly at the LiDAR's sizes.

## The chapel (from Princes Street)
- **A white hexagon.** Smooth rendered walls, off-white to pale cream, plain and unbroken, rising
  straight to a level top at the eaves: from the street the roof is all but hidden, only a thin dark
  line of its edge above the walls. A corner of the hexagon points at the street, so the street sees
  two faces meeting at it, and two more at a grazing angle.
- **The great window wraps that corner**: about 4 m along the left street face and under 3 m along
  the right one (as seen from the street), from about half a metre above the ground to just under the
  eaves at the corner. It is a grid of white concrete frames, deep and
  square in section, holding tall narrow panes of dark glass in staggered rows, so that the vertical
  frames run long and the horizontal ones step up and down from one column to the next; its top steps
  up toward the corner with the line of the eaves. The rest of each face is blank wall.
- **The spire**: a slender square shaft, grey (weathered concrete or paint), rising from the roof's
  apex and tapering only a little, under a short pointed cap, with a small thin cross on its tip.
- **The bay** on the chapel's far side (to the left as seen from the street): a lower block of the same
  white walls under a low gable along its length (round 1, from the LiDAR: eaves 7.1 m, ridge 7.8 m).
  From the street its near slope shows as a thin band above the eave, so its top in the photographs
  is the ridge.
- **The small room** beyond the bay, toward the street: low, white, flat-roofed (3.4 m), rounded in
  plan as the floor outline is, a dark timber door at its foot facing the street. A tree hides it
  from above and from the street: it is drawn plainly.
- The roof, seen from above only (the 2023 LINZ aerial): six triangular faces of light green
  corrugated metal, the corrugations running down each face, a narrow rib along each hip. Drawn in
  `roofGreen` (round 1), the sunlit faces' colour in the aerial (median sRGB 170 181 172) a little
  greener, as the shaded faces show it.

## The hall
- Low and white, with flat roofs edged by deep plain white fascias, and a thin dark line where the
  roof meets them.
- At the near end, between the chapel and the hall, the entrance: a glazed front under the flat roof
  with a narrow dark timber fascia, glass doors, and a few steps down to the path.
- Along the street side of the middle, an open walk-way under the flat roof, on slender white posts,
  with glazed walls behind; the far end has a band of white-framed windows. The roofs are green
  corrugated metal from above (`roofGreen`), the far end's with a row of pale skylights (not drawn).

## The light (match the photographs)
- Taken in July 2024 on a winter morning: the sun low in the north-east, behind the building as seen
  from the street (it flares in `JYSz…_wide.jpg`). So the street side is in soft open shade, its white
  walls a cool pale grey-cream under the sky, with little contrast between the faces; the glass reads
  dark, with pale reflections of the sky.
- Measure, don't guess: compare the luminance of the blank walls and of the window between a strip's
  reference and its render (crop the same region of both). Round 1: exposure 0.65 puts the building
  region's luma median at 143-152 drawn against 132-154 in the photographs (JYSz's, toward the sun,
  111-117).

## Around it (not part of the model)
- Large trees on every side, in front of every photograph; a low hedge and shrubs along the path, a
  lawn strip and parked cars on Princes Street.
