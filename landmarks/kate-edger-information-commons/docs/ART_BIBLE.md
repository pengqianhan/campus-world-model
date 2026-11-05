# Kate Edger Information Commons — art bible

Target: the Kate Edger Information Commons, drawn in code so that it reads as the same building as in the
references in `refs/photos/` (kept locally, not in git), with its proportions from the LiDAR. Look at them
yourself, at full size; this page says only what the building shows. What none of them shows is drawn plainly
at the LiDAR's sizes.

## From Alfred Street (north-east), looking south across the sunken court
- **The south-east range's end** to the left: its upper floors behind a box of pale silver perforated metal
  screens, light grey in the light; under it green-tinted glazing and white columns down to the court, with a
  shopfront at the court's level.
- **The upper strip** behind and above it: a pale grey wall, its top cut on a slant against the sky; to the right
  of it, the range's face toward the atrium under a large screen of grey-brown metal over green-tinted glass.
- **The atrium's end** between the ranges: a glazed canopy and glass walls sloping down toward the court, and a
  white diagonal strut before the glazing.
- **The north-west range's end** to the right, near: dark glass in white frames on a curved face that stands out
  over the court and reaches up beyond the view's top; open under it.
- Before it all, a railing and steps down to the court, a kiosk with red and yellow umbrellas, a sign and young
  plane trees (none drawn).

## From above (the 2023 aerial, the LiDAR)
- Two long ranges with flat grey roofs and plant on them, the atrium's glazed roof between them, widest at the
  north-east end. The north-west range's roof within a parapet; at the south-west end of the south-east range's,
  the plant within screens; on the prow, a long glazed roof light (the LiDAR's heights: `docs/CONTRACT.md`).

## Light
- A bright day with white cloud: the north-east faces in soft light, the sky blue where it shows through the
  trees.
- The faces seen are in soft light, with no shadow cast on them or on the court: the config's `light` puts the
  viewer's sun behind the building from Alfred Street (estimated: the photograph does not show where it is) and
  sets the exposure by the luma. Round 0 drew the walls pale grey in the shared default light, the building's luma
  median 238 against the reference's 140; round 1, with the building's own materials, 138 against 140 (the
  screens 173 against 171, the mesh 119 against 115, the strip's wall 195 against 198; the corner's green glazing
  88 against about 60, the frames in front of it not drawn); after the check, 142 against 141.
