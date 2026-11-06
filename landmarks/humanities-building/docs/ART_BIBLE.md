# Humanities Building — art bible

Target: the Humanities Building, drawn in code so that it reads as the same building as in the reference in
`refs/photos/` (kept locally, not in git), with its proportions from the LiDAR. Look at it yourself, at full size;
this page says only what the building shows. What it does not show is drawn plainly at the LiDAR's sizes.

## From the courtyard (south-west), looking north-east at the street wing
- **Five floors** under a deep eave: four bands of buff brick, laid in courses with pale joints, between ribbons
  of windows. The windows' frames are dark; most panes are behind film in vertical stripes of red, orange and
  yellow, some clear, dark with the rooms behind.
- **The part to the left** (north-west of the stair) stands a little forward, its bands' corners cut where it meets
  the stair's slot; **the part to the right** runs on to the picture's edge, its eave a little lower.
- **The stair's slot** near the middle: a narrow glazed strip from the ground to the eave in dark red frames, the
  glass patterned in white.
- **The entrance** at its foot: glass doors in a frame of the same striped film, a white sign over it.
- **The eave**: a dark red fascia, the soffit dark under it; the red roof above it is not seen from here.
- Before it, trees at both ends, a low brick planter, bicycle stands, paving (none drawn).

## From above (the 2023 aerial, the LiDAR)
- An L of red clay-tiled roofs with hips: a higher middle along each wing and a lower roof round their outer sides,
  a raised roof on eight sides over the corner, flat at its top, two flat roofs in the angle of the L, grey in the
  aerial, and a low block at the street wing's south-east end (its roof's colour estimated: grey).

## Light
- A bright day with white cloud and blue sky; the face in soft light, no shadow under its bands, the trees on the
  left lit from behind: the config's `light` puts the viewer's sun behind the building from the courtyard
  (estimated: the photograph does not show where it is) and sets the exposure by the luma. Round 0 drew the walls in
  the kit's cream render under the shared default light: the building's luma median 130 against the photograph's
  133 (its p10-p90 127-132 against 95-184: plain walls, none of the windows' dark and the brick's light). Round 1,
  with the bands, the windows and the film: 141 against 133 (p10-p90 45-153 against 95-184); the buff brick warmed
  until it read as the photograph's under the sky's blue light.
