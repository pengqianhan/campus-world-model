# Old Choral Hall — art bible

Target: the south-west range of Old Choral Hall, with a pavilion at each end, drawn in code so that it
reads as the same building as in the Street View panoramas of 2022-09, before the building works, with
its sizes from the LiDAR. Look at the photographs yourself, at full size: `nAxE…_*.jpg` (the range and
its north-west pavilion), `Uype…_*.jpg` (the range and the corner pavilion at Grafton Road),
`e8T_…_*.jpg`, and `C1kG…` (2024-10: the corner pavilion restored, out of its scaffold) for the corner. This page says what matters most, and only what they
show. The rest of the building is drawn plainly: no photograph shows it as it stands (README.md, "The
sources: works in progress").

## The south-west range (what nAxE and Uype show)
- **Two storeys of red brick with cream dressings**, Edwardian classical. A long range of about a dozen
  bays between two end pavilions, on a footpath that rises about 2 m from Grafton Road to the back.
- **Ground floor**: tall windows in eared cream architraves with cream sills, each window of several
  panes (white-grey frames, glazing bars in a grid). A cream plinth band at the foot of the wall, with
  small vents.
- **First floor**: windows of the same width over the ground-floor ones, standing on a continuous cream
  sill band; a cream band runs through the brick at the level of their upper panes.
- **The top**: a deep cream cornice with dentils and small modillions, and a plain cream parapet above
  it. The roof behind is low and not seen from the street.
- **The end pavilions** (the north-west one is clearest in nAxE, the corner one in Uype): cream, a
  little forward of the range. Two giant columns in antis (plain round shafts, simple bases and capitals)
  between rusticated pilasters (banded with deep horizontal joints); a segmental (arched) pediment with
  modillions and dentils over a radiating panel with keystones; a three-light window in the upper
  storey; a doorway with a cornice below it (double doors at the north-west pavilion). Brick shows
  between the columns and the pilasters.
- Plane trees stand along the footpath and hide parts of the range: they are not part of the model.

## The rest (drawn plainly)
- The middle ranges, the north-east wing and the blocks behind: walls and gabled roofs at the LiDAR's
  sizes, in plain cream render and pale grey roofs, with no windows or ornament: no reference shows
  their faces as they are (2024-08: wrapped and scaffolded; the 2023 aerial shows grey hipped roofs).

## The light (match the 2022-09 photographs)
- A spring morning, the sun high in the north-east (in nAxE it stands almost straight beyond the
  building, about bearing 45°, 35 to 40° up), so the south-west face is in open shade under a bright,
  hazy sky: the brick a warm red-brown, the cream dressings pale but not white, the glass grey with the
  sky in it. Measure, don't guess: compare luma and colour of brick, cream and glass between a
  strip's reference and its render (crop the same region of both).

## Materials (all generated in code)
- `brick`: red brick with pale joints (the kit's, a shader: 76 mm courses, half-brick bond).
- `render`: cream painted render for columns, pilasters, bands, architraves, cornices and parapets.
- `paint`: the white-grey window frames and glazing bars; `glassPale` for the panes.
- `roofPale`: the low roofs, light grey; `void` for dark openings and doorways.

## Never
- Nothing traced or sampled from the photographs (no projected textures, no image files).
- No people, cars, trees, signs, scaffolds, wraps, banners or text on the building.
