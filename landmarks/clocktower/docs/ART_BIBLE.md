# Clock Tower — art bible

Target: the University of Auckland Clock Tower building, seen from Princes St, drawn in code so that a
side-by-side with the Street View photographs in `refs/streetview/` reads as the same building, with
the same proportions, the same parts in the same places, and stone, glass and light that look real.
Look at the photographs yourself, at full size; this page only says what matters most.

## The building (front to Princes St, facing west-north-west)
- **Two gabled pavilions** stand forward to the street, left and right. Rock-faced (pitched) ashlar of a
  cream-white limestone, courses about 0.4 m, blocks of varied length; a plain plinth to about 1.1 m
  with a moulded string course. Shallow gables with a moulded coping, small kneelers, a finial.
  On each front: three tall rectangular ground-floor windows of three lights with a transom;
  above them a group of tall pointed lancets (a wider central one of two lights, narrower ones each
  side) under a large moulded hood; two slender shafts that rise into the gable and end in small
  pinnacles; blind panels with upright fillets between the floors. Windows have light stone
  mullions and dark glass with reflections and glimpses of the interior.
- **The recessed centre** between them: smooth, finely jointed white stone, far richer in carving.
  A pointed doorway with a deep moulded arch and carved timber tracery over open timber doors; a
  flight of steps between cheek walls that end in square pedestals at the street; a flat-roofed porch
  on slender posts to one side. Above the door, an ornate canopied panel and an oriel-like upper
  window; two- and three-light pointed windows on three floors; slim buttress-shafts that rise past a
  pierced parapet into crocketed pinnacles.
- **The tower** behind the doorway: a lower stage ringed with turrets and a crowd of crocketed
  pinnacles at the roofline; an octagonal shaft with deep pointed openings, blind tracery and long
  vertical ribs; a clock face (white dial, black numerals, gold-black hands) on each main face; the
  crown a lacework of pinnacles and flying ribs round a short spirelet. This is the most intricate
  part: the eye goes to its silhouette against the sky.
- **Long ranges** run away either side behind the pavilions (seen at the frame edges, under trees).
- Around it: a planting bed of low shrubs and flax along the base, wet paving, the kerb and asphalt of
  Princes St, a strip of lawn on the far side, tall trees (a large bare plane tree on the right, dark
  conifers on the left), a lamp post and parking signs.

## The light (match the photographs)
- The Street View photographs were taken on a clear winter morning (July 2024): the low sun stands
  **behind the building, in the east**, so the street front is in soft open shade lit by the blue sky,
  the tower's silhouette and pinnacles are rim-lit, and views looking up Princes St toward the sun
  (e.g. `hyoe8...`, `Wqs3...`) are backlit with flare. Stone in that shade still reads cream-white with
  cool grey-blue shadows (never black); deep blue sky at the zenith fading to pale near the horizon.
- High contrast: deep shadows in window reveals, under the string courses and in the doorway; bright
  highlights on the lit faces of pinnacles and mouldings. Colours natural, not grey and not saturated.
- Measure, don't guess: compare luminance percentiles (p02/p10/p50/p90/p98) and the colour of lit and
  shaded stone between a strip's reference and render (crop the same region of both).

## Materials (all generated in code)
- Limestone: cream-white (lit sRGB around #e6dccb), with weathering: darker grime in joints and under
  ledges, faint drip streaks below sills and copings, lichen speckles low down. Pavilions rock-faced;
  centre and tower smooth with fine joints; mouldings, mullions and tracery smooth dressed stone.
- Glass: dark, reflective (sky and the opposite trees), with subtle glazing bars and hints of
  interior; never flat black.
- Timber doors: warm brown, carved tracery panels. Roofs: dark grey slate, barely seen from the street.

## Never
- Nothing traced or sampled from the photographs (no projected textures, no image files).
- No people, cars, logos or text on the building beyond what the photographs show as fixed parts
  (the clock numerals are fine).
