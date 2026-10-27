# Landmark: 9 Eden Crescent, drawn from code

9 Eden Crescent (building 801 of the University of Auckland's campus map), a white four-storey
building in the city centre, drawn in three.js from code alone and sized by the LINZ 2024 LiDAR, checked
against three Street View photographs of its street end (October 2026). The kit it is built with, the
pipeline, the viewer and how to run them are shared by every landmark: [`../README.md`](../README.md).

- Look at it: `http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=nine-eden-crescent&view=orbit`
  with the repository root served on port 8765. The site draws it in place of block 801 (below, "On
  the site").
- Run its pipeline: `landmarks/pipeline/run.sh nine-eden-crescent [stage ...]`.
- The rules: [`docs/CONTRACT.md`](docs/CONTRACT.md) and [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## The frame

`config/nine-eden-crescent.json`, `frame`: x along the building, its street end toward -x, where it
meets Eden Crescent (the axis points at bearing 44.5° and x is minus it, so the street end faces
north-east); y up from 17.6 m NZVD2016, the LiDAR ground's median round the building, which is also
the ground at the street end's north-west corner, the door (17.54 m); z across the building, +z to the right as
seen from the street; the middle of its roof at x = z = 0. The axis is the bearing of most of its walls.

## References

Three Google panoramas of August 2024 on Eden Crescent, 31 to 33 m from the middle of the building and
about 12 m off its street end, which a sight-line test over the LiDAR finds the most open to it
(429 tiles, bought through the ledger on 2026-10-27). Each sees the whole street end square on; the
long sides stand against their neighbours and no photograph shows them. The 70 m tower behind and the
lower buildings either side stand in the wide views.

All three panoramas record their cameras about 1 m to the right of where the LiDAR puts the street
end, the same way: an offset between Street View's positions and the LiDAR. Round 1 fitted `v8ia…`'s
camera to its photograph's own edges (residuals 0.08 m or less) and the other two to the street end's
openings (rms 10 and 8 px, `mdk1…`'s and `MH15…`'s); `streetview.camera_fixes` puts each camera there. The camera search
(`refine`) then corrects none: the neighbours stand next to the silhouette, so too little of it is
against the sky to trust.

## Rounds 0 to 2 (October 2026, the lead alone and two builders)

Round 0 is the rough model: the block at the LiDAR's sizes, the street end's openings placed by eye.
Round 1 measures every opening of the street end in the photographs, against a camera fitted to them:
the top storey's face coming down over three bays set back between two white piers, its corner raked
on the south-east; a band of glazing on each of the two storeys below it, the right bay's lower one
taller; downstairs a vehicle way, the glazed entrance with its doors, and a glazed corner under a
glazed canopy. Round 2 corrects the cameras, keeps the shaded white cladding out of the photographs'
sky (`sky_mask.pale_tint`), gives the panes the kit's `glassPale` and the viewer the light of the
photographs (open shade, exposure 2.2), and measures the south-east side and the roof again in finer
bands of the LiDAR: a terrace at 10.45 m with the top storey standing back behind it, where round 1
had a slope, and the plant on the roof.

Against the photographs (`run.sh nine-eden-crescent compare`), round 2, every camera corrected by
`camera_fixes`: silhouette IoU inside the model's own screen box (the likeness limits are read there,
maintainer, 2026-10-27) 0.905, 1.000 and 1.000 over `v8ia…`'s wide, upper and door views, 0.867,
1.000 and 1.000 over `mdk1…`'s and 0.812, 0.865 and 0.964 over `MH15…`'s, mean 0.935; over the whole
frame 0.805 (round 1: 0.442). That passes tier 1's limit (0.65), but for this building the IoU in the
box tells little: 2% of the boxes' counted pixels are sky on the mean (0-8% in each view,
`sky_in_box`), and a plain block filling each box would score 0.980 on the mean (1 minus that share), as
much as the model in v8ia's and mdk1's upper and door views and more in the other five.
Most of the rise from round 1 comes from `sky_mask.pale_tint`, which stopped the photographs' shaded
white cladding being read as sky, not from the model; and two of the three `camera_fixes` (mdk1's and
MH15's) were fitted to the street end's drawn openings. v8ia's and mdk1's upper and door views see no sky
round the building, so their 1.000 says only that the model fills them. The likeness rests on the
heights and the top view below, and on the strips. The building's luma median 241-242 in the
renders, 237-253 in the photographs (248 on the mean; limit 12). From above (`run.sh
nine-eden-crescent topview`): footprint IoU 0.906 against the LiDAR, 82% of cells within 0.5 m of its
height, the model 0.04 m below it at the median, 99.6% of block 801 under the model. The model is
1,548 triangles in 6 meshes, one a material.

## Heights against the LiDAR

Building points of `data/nine-eden-crescent_pts.npy` in the view frame; model / LiDAR (median, or
the percentile said): the flat roof 14.0 / 14.00; its parapet 14.2 / 14.11 at the far end and 14.33
on the north-west side; the street end's crest 14.8 / 14.83 (p95), falling at its raked south-east
corner to 12.8 / 12.80 (the highest point there); the terrace along the south-east side 10.45 /
10.46, its parapet 11.1 / 11.30; the plant room on the roof 15.6 / 15.35, its taller part 16.6 /
16.55 (the building's highest point: 16.69 m), the two low units 15.0 / 14.99 and 15.05 / 14.88.
Every one within 0.25 m (limit 0.5 m). The LiDAR's highest point inside the block, 19.66 m (p99.9),
is the wall of the taller building next door, along the north-west edge from x 12.7 to 21.7; the
storeys of the street end (its bands, bays and doors) come from the photographs, as the LiDAR does not
see them.

## On the site (October 2026)

The model covers 99.6% of block 801 and 1.7% of block 802 (15 Eden Crescent), no other block within
80 m by half, so `building.also` is empty. The door is the foot of the street end's north-west corner
on Eden Crescent's footway, where the LiDAR ground is 17.54 m (-0.09 to -0.03 m from `ground` within a
metre of it): there the model's y is 0 and the map's ground meets it. The street falls south-east along
the end, to -0.6 m at the entrance and -1.0 m at the south-east corner, and the ground rises to +4.3 m
at the far end: the walls go down to `FOOT`, -1.3 m.

## Limits

- What no photograph shows is plain white wall: the long sides, which stand against their
  neighbours, and the far end. The plant on the roof is drawn as plain grey boxes at the LiDAR's sizes.
- The street end's cladding is drawn as smooth paint, without its panels' joints.
- The ribbons' panes are the kit's pale glass, which reflects the sky (the glazed canopy is the kit's
  glass); the photographs' glass reflects the sunlit buildings across the street.
