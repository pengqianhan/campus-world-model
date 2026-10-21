# Old Government House — art bible

Target: Old Government House, drawn in code so that it reads as the same building as in the two
Street View photographs in `refs/streetview/`, with its proportions from the LiDAR. Look at the
photographs yourself, at full size (`hRE5…_upper.jpg` above all); this page only says what matters
most, and only what they show.

## The building (what `hRE5…_upper.jpg` shows of the south-east end)
- **Two storeys of painted timber.** Horizontal boards, painted a pale cream-yellow, with the window
  surrounds and the ochre quoins at the front range's corners in a deeper yellow-ochre. The south-east
  wing has no band between its floors, and plain white corner boards.
- **Sash windows**, tall and narrow, with white glazing bars and pale glass that reflects the sky, in
  ochre surrounds. On the south-east wing they stand in two tiers of their own: short six-over-six
  windows under the eaves, and below them a tall staircase window on the end and windows onto the
  balcony on the front.
- **A single-storey balcony bay** in the corner between the south-east wing and the front range, with
  a flat roof that is a balcony: white vase balusters, with broad ochre pedestals at the ends and the
  corner, under a heavy ochre coping. A fire-escape stair, painted pale grey, runs from a landing under
  the wing's eave down to the balcony.
- **The roof**: low hipped roofs, pale grey (white in the photograph's light), over deep eaves carried
  on pairs of tall brackets above a plain frieze; the soffits are ochre. White chimney stacks with
  moulded caps rise above them (the LiDAR's spikes at 13.3–14.6 m).
- **The garden front** (north-east, to the lawn) is seen only at its south-east end, very obliquely:
  its two nearest upper windows have triangular pediments on consoles, so the front's other upper
  windows are drawn the same; the front is otherwise drawn with the same boards, windows and eaves at
  the LiDAR's sizes, and plainly. The porch is in no photograph: plain, at the LiDAR's sizes.
- Around it: a lawn and large trees, a tarmac path; these are not part of the model.

## The light (match the photographs)
- Taken in May 2025 at about half past one, the sun in the north-north-west (bearing about 335°,
  33° up; it shows in `hRE5…_wide.jpg`). So the south-east end is in open shade, its boards a cool
  cream under the blue sky, and the garden front catches the sun at a grazing angle. The ochre
  surrounds stay warm in the shade; the shade under the eaves is deep. The viewer takes this light
  from the config's `light`.
- Measure, don't guess: compare the luminance of the lit boards and of the eave shadows between a
  strip's reference and its render (crop the same region of both).

## Materials (all generated in code)
- Painted weatherboards: pale cream-yellow, a fine horizontal line every board (about 0.2 m), little
  weathering (paint, not stone).
- Painted trim: yellow-ochre, smooth.
- Glass: dark and reflective, white glazing bars; never flat black.
- Roof: light grey, smooth; the ridges and hips a little darker.

## Never
- Nothing traced or sampled from the photographs (no projected textures, no image files).
- No people, cars, signs or text on the building.
