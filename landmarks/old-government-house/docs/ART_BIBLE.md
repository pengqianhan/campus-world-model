# Old Government House — art bible

Target: Old Government House, drawn in code so that it reads as the same building as in the two
Street View photographs in `refs/streetview/`, with its proportions from the LiDAR. Look at the
photographs yourself, at full size (`hRE5…_upper.jpg` above all); this page only says what matters
most, and only what they show.

## The building (what `hRE5…_upper.jpg` shows of the south-east end)
- **Two storeys of painted timber.** Horizontal boards, painted a pale cream-yellow, with the window
  surrounds, the corner pilasters and the bands between the floors in a deeper yellow-ochre.
- **Sash windows**, tall and narrow, with white glazing bars and dark glass, in ochre surrounds; those
  of the ground floor taller than those above.
- **A single-storey bay** stands out from the south-east end, with a flat roof that is a balcony: a
  balustrade of white balusters between ochre posts.
- **The roof**: low hipped roofs, light grey, over deep eaves carried on brackets above a plain frieze.
  White chimney stacks with moulded caps rise above them (the LiDAR's spikes at 13.3–14.6 m).
- The garden front (north-east, to the lawn) and its porch are not seen in any photograph. Draw them
  with the same boards, windows and eaves at the LiDAR's sizes, and plainly.
- Around it: a lawn and large trees, a tarmac path; these are not part of the model.

## The light (match the photographs)
- Taken in May 2025 by day, with the sun on the south-east end. The lit boards read
  cream-white, the ochre surrounds warm; the shade under the eaves is deep.
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
