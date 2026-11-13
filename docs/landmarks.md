# Landmarks drawn from code

The map draws every building by rule from the campus map's outline. A **landmark** is one real
building drawn in detail instead, in three.js from code alone: no photograph, texture image or 3D
model is used. The LINZ 2024 LiDAR gives its sizes, and Street View photographs are the references
that each render is compared with (for the Kate Edger Information Commons, the Humanities Building, buildings 302, 303
and 303S of the Science Centre, Architecture - West, Architecture - East, Building 907, Auckland Bioengineering House,
the Sir Owen G Glenn Building, 49 Symonds Street, Okareta, buildings 501, 502, 505 and 507 of the M&HS Building, Te
Pūtahi Tangata, the George Mason Biology Building, 2-6 Park Ave, Building 114, 67 Symonds Street,
Fine Arts Studio Block 431, Fine Arts Studio Block 433, 58 Symonds Street, Security, Building 903 and Structures
Hall, another photograph of each). A lead agent and five
agents in parallel made the first one, the Clock Tower, each agent owning one part (the tower, the entrance bay, the
pavilions, the light and
materials, the pipeline). Seen from the three Street View panoramas in front of the building, the
outline of the model covers the outline of the building with an IoU of 0.68 to 0.72 for the whole
front, 0.89 to 0.95 for the tower and 0.88 to 0.98 for the entrance.

| | |
| --- | --- |
| ![The Clock Tower from Princes St, drawn from code](landmarks/clocktower-front.jpg) | ![The Clock Tower from along Princes St, with trees from the LiDAR](landmarks/clocktower-street.jpg) |
| ![The tower above the entrance bay, from the steps](landmarks/clocktower-tower.jpg) | ![The upper tower: clock stage, tracery and pinnacles](landmarks/clocktower-tower-close.jpg) |

The second is Old Government House (102), a building of painted timber in its garden. Trees hide it
from every Street View panorama near it but two, which see the upper storey of its south-east end,
so its model is
checked against the LiDAR from above: on a 0.5 m grid its outline covers the building's with an IoU
of 0.95, and in 95% of the cells its height is within 0.5 m of the LiDAR's.

| | |
| --- | --- |
| ![Old Government House from its lawn, the garden front, drawn from code](landmarks/old-government-house-front.jpg) | ![The south-east end and the garden front, drawn from code](landmarks/old-government-house-end.jpg) |
| ![Old Government House on the map, drawn from code in the map's colours](landmarks/old-government-house-map.jpg) | ![Old Government House from its lawn, through the walker's eyes](landmarks/old-government-house-eyes.jpg) |

The third is the General Library (109) on Alfred Street: a tower slab of ribbon windows over a podium
whose white fins stand on a brick plinth. Twelve Street View panoramas see its front on Alfred Street,
its two ends and its back wing's north-east side; the faces they do not show are drawn plain or
after the faces they do show (see [Known limitations](limitations.md)). Seen from them, the outline of the model covers the outline of the building with an IoU
of 0.80 on average over 35 views; from above, its footprint covers the LiDAR's with an IoU of 0.946, and its
highest point is 38.8 m, as the LiDAR's.

| | |
| --- | --- |
| ![The General Library from Alfred Street, drawn from code](landmarks/general-library-alfred.jpg) | ![The General Library's south-east end, its entrance between grey piers, drawn from code](landmarks/general-library-southeast.jpg) |
| ![The General Library on the map, drawn from code in the map's colours](landmarks/general-library-map.jpg) | ![The General Library from Alfred Street, through the walker's eyes](landmarks/general-library-eyes.jpg) |

The fourth is Old Choral Hall (104), at the corner of Symonds Street and Grafton Road. Every source
shows it during building works, so only its range on Symonds Street is drawn in detail: ten bays of
red brick with cream dressings between two pavilions with giant columns, as panoramas show it before
the works and after. Seen from the three panoramas of 2022-09, its outline covers the building's
with an IoU of 0.58 to 1.0. The rest of the building keeps the map's estimated block until the
works end.

| | |
| --- | --- |
| ![Old Choral Hall's range on Symonds Street, drawn from code](landmarks/old-choral-hall-corner.jpg) | ![Old Choral Hall from above: the range in detail, the rest as the map's estimated block](landmarks/old-choral-hall-above.jpg) |

The fifth is Maclaurin Chapel (107) on Princes Street: a white hexagonal chapel with a great window
round its street corner, a low green roof and a slender spire, and a low hall behind it. Every height
comes from the LiDAR, within 0.1 m. Five Street View panoramas see its street side, through bare
winter trees; against them the model's silhouette has a mean IoU of 0.45 over 15 views (0.55 over
the 9 views whose cameras could be corrected), and from above its outline covers the LiDAR's with an
IoU of 0.88. The small room beyond its bay, under a tree in the LiDAR and in every photograph, is
drawn plainly.

| | |
| --- | --- |
| ![Maclaurin Chapel from Princes Street, drawn from code](landmarks/maclaurin-chapel-front.jpg) | ![Maclaurin Chapel and its hall from above the street, drawn from code](landmarks/maclaurin-chapel-above.jpg) |
| ![Maclaurin Chapel on the map, drawn from code in the map's colours](landmarks/maclaurin-chapel-map.jpg) | ![Maclaurin Chapel from the lawn by Princes Street, through the walker's eyes](landmarks/maclaurin-chapel-eyes.jpg) |

The sixth is the Clock Tower East Wing (119), below the Clock Tower to the south-east: two storeys of
the same rock-faced cream stone, two gabled pavilions toward the lawn and the car park, a plain stair
tower rising between them, segmental-headed windows upstairs and narrow ones below, and a red tile
roof. Every height comes from the LiDAR, within 0.12 m, but the underside of the link toward the
Clock Tower, which stands at the campus map's storey height over a passage. One Street View panorama
sees its whole lawn side; against it the model's silhouette has an IoU of 0.63 to 0.96 over its
three views, and from above its outline covers the LiDAR's with an IoU of 0.83. Three more see it
over the old basalt wall of the Albert Barracks, which fills half their frames. Its back, its ends
and the low link toward the Clock Tower, which no photograph shows, are drawn plainly.

| | |
| --- | --- |
| ![The Clock Tower East Wing from the car park, drawn from code](landmarks/clock-tower-east-wing-front.jpg) | ![The Clock Tower East Wing from above the lawn, drawn from code](landmarks/clock-tower-east-wing-above.jpg) |
| ![The Clock Tower East Wing on the map, drawn from code in the map's colours](landmarks/clock-tower-east-wing-map.jpg) | ![The Clock Tower East Wing from the lawn, through the walker's eyes](landmarks/clock-tower-east-wing-eyes.jpg) |

The seventh is 9 Eden Crescent (801), a white four-storey building in the city centre. Its street
end on Eden Crescent has a white top storey, raked at its south-east corner, over three bays set back
between two white piers: bands of windows, a vehicle way, a glazed entrance and a glazed corner under a
canopy. Along its south-east side the top storey stands back behind a terrace, and plant stands on its
flat roof. Every height comes from the LiDAR, within 0.25 m. Three Street View panoramas see the
street end square on, with the neighbours either side and a 70 m tower behind it in their wide views;
counted inside the rectangle the model fills on the screen, so that the neighbours do not count,
the model's silhouette has an IoU of 0.81 to 1.00 over their nine views, though there those rectangles
hold so little sky that a plain block filling them would score as high; from above its outline covers
the LiDAR's with an IoU of 0.91. Its long sides, which stand against their neighbours, and its
far end, which no photograph shows, are drawn plainly.

| | |
| --- | --- |
| ![9 Eden Crescent from Eden Crescent, drawn from code](landmarks/nine-eden-crescent-front.jpg) | ![9 Eden Crescent from above the street, drawn from code](landmarks/nine-eden-crescent-above.jpg) |
| ![9 Eden Crescent on the map, drawn from code in the map's colours](landmarks/nine-eden-crescent-map.jpg) | ![9 Eden Crescent from Eden Crescent, through the walker's eyes](landmarks/nine-eden-crescent-eyes.jpg) |

The eighth is its neighbour, 15 Eden Crescent (802), a long white building of two storeys along the
street. Its windows sit deep in square openings, in two rows with red frames, over a base of
brownish-grey tiles; a band of windows runs under the canopy at its top, and near its north-west end
two doors with steps and a louvre stand among them. Its roof slopes up from the street face and from the back
to a top storey down the middle, under a curved roof. Its heights come from the LiDAR, within 0.1 m,
except on two parts of its roofs drawn on from the rest, estimated: over a well at its south-east end,
3.5 to 4.1 m above the LiDAR's, and by the street at its north-west end, about 1 m above it; the
openings and the doors are measured in a Street View photograph through its camera. Counted inside the rectangle the model fills on the screen, the model's silhouette has an IoU
of 0.58 to 1.00 over the nine views of three panoramas, 9 Eden Crescent's model left out where it
stands in front, though there those rectangles hold so little sky that a plain block filling them
would score higher; from above its outline covers the LiDAR's with an IoU of 0.87, and on
90% of the cells both cover it is within 0.5 m of the LiDAR's height. Its back and ends, which no photograph shows, are drawn
plainly; a glazed case on its street face is measured and not drawn.

| | |
| --- | --- |
| ![15 Eden Crescent from Eden Crescent, drawn from code](landmarks/fifteen-eden-crescent-front.jpg) | ![15 Eden Crescent from above the street, drawn from code](landmarks/fifteen-eden-crescent-above.jpg) |
| ![15 Eden Crescent on the map, drawn from code in the map's colours](landmarks/fifteen-eden-crescent-map.jpg) | ![15 Eden Crescent from Eden Crescent, through the walker's eyes](landmarks/fifteen-eden-crescent-eyes.jpg) |

The ninth is the Fisher Building (804), a tan brick tower on Waterloo Quadrant, its higher half a
shaft over its south-west side. A cream band runs round it at each floor, every 2.875 m, as the
LiDAR's wall returns peak; a slot of windows framed in white runs up the shaft's corner;
down its west side stand balconies with dark louvres; a red tile canopy covers its entrance, and a
ramp runs to it from the street over a car park. Its roofs, its parapet, the canopy and the ramp's
deck are within 0.15 m of the LiDAR's heights, and the floor bands within 0.18 m of where its wall
returns peak, the two lowest, behind trees, carrying the spacing on (estimated); the ramp's side
along the street is measured in the photographs, and the balconies' depth is estimated. Two
Street View panoramas on Waterloo Quadrant see its west and south faces, their cameras set by the
photographs' own edges against the LiDAR; counted inside the rectangle the model fills on the screen,
the model's silhouette has an IoU of 0.54 to 0.99 over their eight views, though only one of those
rectangles holds much sky, and there the model scores a little more than a plain block filling it;
from above its outline covers the LiDAR's with an IoU of 0.91. Its faces turned north, east and
south-east, which no photograph shows, are drawn plainly, and the parts of its outline under the trees
by its entrance, where the LiDAR sees no roof, are not drawn.

| | |
| --- | --- |
| ![The Fisher Building from Waterloo Quadrant, drawn from code](landmarks/fisher-building-front.jpg) | ![The Fisher Building from above, drawn from code](landmarks/fisher-building-above.jpg) |
| ![The Fisher Building on the map, drawn from code in the map's colours](landmarks/fisher-building-map.jpg) | ![The Fisher Building from Waterloo Quadrant, through the walker's eyes](landmarks/fisher-building-eyes.jpg) |

The tenth is the Thomas Building Extension (110N) on Symonds Street, a curved building joined to the
Thomas Building (110) by a glazed link. Round its curve three storeys of glass curtain wall stand over a
white rendered base, a dark beam between them, with service doors and small windows in the base; beside
the curve is a flat face of board-marked concrete, where a University banner hangs (not drawn). Its pale
metal roof rises from its edge to a raised middle with plant on it. Its roofs' heights come from the
LiDAR, within 0.12 m of the medians of their returns but in the outer 0.2 m of the main roof, where
the returns are of two heights (a fascia and a gutter behind it); the curtain wall's storeys, the doors and the
windows are measured in two Street View photographs through their cameras, which are set from the
photographs' own edges; how far the beam and the glass's fins stand out is estimated. Counted inside the
rectangle the model fills on the screen, the model's silhouette has an IoU of 0.62 to 0.96 over the six
views of the two panoramas, though in the upper and door views that rectangle spans the frame's width
and the glass's reflected sky counts as sky there; from above its outline covers the LiDAR's with an IoU of 0.96,
and on 92% of the cells both cover it is within 0.5 m of the LiDAR's height. What no photograph shows is
drawn plainly: the curve round its north, its north-west faces, the link's sides and its roofs.

| | |
| --- | --- |
| ![The Thomas Building Extension from Symonds Street, drawn from code](landmarks/thomas-building-extension-front.jpg) | ![The Thomas Building Extension from above, drawn from code](landmarks/thomas-building-extension-above.jpg) |
| ![The Thomas Building Extension on the map, drawn from code in the map's colours](landmarks/thomas-building-extension-map.jpg) | ![The Thomas Building Extension from Symonds Street, through the walker's eyes](landmarks/thomas-building-extension-eyes.jpg) |

The eleventh is the Kenneth Myers Centre (820) on Shortland Street, a brick building whose pilasters rise
past its parapet into pinnacles. Along its street face a cream coping with small merlons stands over a
corbel table of small arches and tall blind arches with cream springers; between its west and east parts
a porch stands forward, with an arched cream doorway up steps from the street, three arched windows over
it and four tall spires; a radio mast stands on its roof. Its roofs, its east part and its porch are
sized by the LiDAR, every height within 0.15 m of the medians of their returns, and what its street face
carries is measured in one Street View photograph through its camera, which is set from the photograph's
own edges. Over the part west of the porch the LiDAR of 2024 holds temporary works, scaffolding and a
temporary roof: that part's plan comes from the LINZ aerial photograph of 2023 and its heights from the
Street View photograph, at the aerial's plan. The campus map's outline for 820 does not follow the
building that the LiDAR and the aerial show: it lies 0.3 to 0.9 m north of its street face, its back is
turned across the building's, and it adds a tail over the lane to its west and a nub over the roofs to its
east. The model, drawn where they show the building, stands in place of the block. Counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.45
to 1.00 over the three views of the panorama, though glass towers fill the sky round it, so the IoU
there says little; the brightness of its brick is within 6 of the photograph's in each view. From above
its outline covers the LiDAR's with an IoU of 0.88, 0.95 leaving out the west part, where the LiDAR
holds the works. What no photograph shows is drawn plainly: its sides, its back and its roofs.

| | |
| --- | --- |
| ![The Kenneth Myers Centre from Shortland Street, drawn from code](landmarks/kenneth-myers-centre-front.jpg) | ![The Kenneth Myers Centre from above, drawn from code](landmarks/kenneth-myers-centre-above.jpg) |
| ![The Kenneth Myers Centre on the map, drawn from code in the map's colours](landmarks/kenneth-myers-centre-map.jpg) | ![The Kenneth Myers Centre from Shortland Street, through the walker's eyes](landmarks/kenneth-myers-centre-eyes.jpg) |

The twelfth is the Thomas Building (110) on Symonds Street, beside the Thomas Building Extension and
joined to it by its glazed link: four ranges of board-marked concrete round a courtyard. Along its face
to the road four storeys of red-framed window bands stand back behind deep concrete bands, between
square piers; toward its north-east end, where the ground falls, its ground storey steps down, with a
white door and a white-framed louvre beside a pier, and the bands run round the east corner onto its
end. Its heights come from the LiDAR, where its returns gather on the parapets' tops, the ledges, the
gutters and the roofs; the window rows, the frames, the piers, the corner and the ground storey are
measured in two Street View photographs through their cameras, which are set from the photographs' own
edges against the LiDAR's. What nothing measures is estimated, and its card names it: among other things
how far its frames stand out, and how far its ground storey's windows, doors and posts stand behind its
piers there. Where 110N's glazed link meets it, its north-east parapet is left out, so that the link's
roof covers that stretch. Counted inside the rectangle the model fills on
the screen, its silhouette has an IoU of 0.848 to 1.000 over the six views of the two panoramas, though
in five of them the face fills that rectangle (photographed sky is 0 to 10% of it), so the IoU there
says little; the brightness of its concrete and windows is within 4 of the photographs' in each view. From above its outline covers the LiDAR's with an IoU of 0.87, the LiDAR's
counting scattered returns in the courtyard, and on 76% of the cells both cover it is within 0.5 m of
the LiDAR's height. What no photograph shows is drawn plainly: its back, its south-west end, the
courtyard and the roofs.

| | |
| --- | --- |
| ![The Thomas Building from the road, drawn from code](landmarks/thomas-building-front.jpg) | ![The Thomas Building from above, drawn from code](landmarks/thomas-building-above.jpg) |
| ![The Thomas Building on the map, drawn from code in the map's colours](landmarks/thomas-building-map.jpg) | ![The Thomas Building from the road, through the walker's eyes](landmarks/thomas-building-eyes.jpg) |

The thirteenth is the Music School (250) on Symonds Street, beside a car park: a fan-shaped auditorium
under a grey roof of facets round one high point, and ranges of rendered walls round an open courtyard.
Along its face to the car park a long wall of pale render, with no window, carries a curved canopy of white
corrugated metal and steps up toward its north corner in rises of about 0.4 m; beyond it the auditorium's
ochre wall has a window of four tall lights in two rows and white downpipes at its corners. Its heights and
roofs come from the LiDAR, each roof fitted to its returns (70% to 94% of each roof's cells within 0.5 m
of the fit, but 42% for the low link at the courtyard's east corner); the parapet's upper steps, the canopy's lower edge and the window are measured in a Street View
photograph through its camera, which is set from the photograph's own edges against the LiDAR's. What
nothing measures is estimated, and its card names it: among other things how thick its canopy and roofs
are and where the parapet's lower steps begin. Counted inside the rectangle the model fills on the screen,
its silhouette has an IoU of 0.84 to 0.97 over the three views of the panorama, though in the door view the
face fills that rectangle (photographed sky is 6% of it), so the IoU there says little; the brightness of
its render is within 4 of the photograph's in each view. From above its outline covers the LiDAR's with
an IoU of 0.94, and on 88% of the cells both cover it is within 0.5 m of the LiDAR's height. What no
photograph shows is drawn plainly: its faces to the road and to the south and west, the courtyard and the
roofs.

| | |
| --- | --- |
| ![The Music School from the car park beside it, drawn from code](landmarks/music-school-front.jpg) | ![The Music School from above, drawn from code](landmarks/music-school-above.jpg) |
| ![The Music School on the map, drawn from code in the map's colours](landmarks/music-school-map.jpg) | ![The Music School from the car park beside it, through the walker's eyes](landmarks/music-school-eyes.jpg) |

The fourteenth is the Kate Edger Information Commons (315) on Alfred Street, over a sunken court: two long
ranges of pale grey cladding with a glass-roofed atrium between them, open to the court at its north-east
end. On the south-east range's end to the street pale silver metal screens hang from 3.7 m to the roof over
green-tinted glazing, its corner is glazed in green, and grey mesh panels hang over the atrium's open end;
the north-west range's end reaches out over the court, glazed, open beneath it, with a roof light along it and
a glass canopy under its tip. Its heights come from the LiDAR, with the parapets round its north-west range
and the screened plant on its south-east range's roof; the heights of its screens, glazing, mesh panels and
shopfront, and of the lower edge of its end over the court, are estimated in a photograph from Alfred Street,
through a camera fitted to points picked on it whose places the LiDAR measures. Its roofs are drawn flat at the
LiDAR's heights, without their falls. What nothing measures is estimated, and its card names it: among
other things the rest of the underside of its end over the court. Counted inside the rectangle the model fills on the
screen, its silhouette has an IoU of 0.64 in that photograph, where bare trees stand before much of the sky;
the brightness of the building is within 1 of the photograph's, though the green glass at its corner is
drawn brighter. From above its outline covers the LiDAR's with an IoU of 0.88, the LiDAR's counting the roof
of AUSA House (322) next to it beyond the campus map's outline of that building, and on 76% of the cells both
cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly: its faces
to the north-west and south-east, its south-west end and its roofs.

| | |
| --- | --- |
| ![The Kate Edger Information Commons from the north-east, drawn from code](landmarks/kate-edger-information-commons-front.jpg) | ![The Kate Edger Information Commons from above, drawn from code](landmarks/kate-edger-information-commons-above.jpg) |
| ![The Kate Edger Information Commons on the map, drawn from code in the map's colours](landmarks/kate-edger-information-commons-map.jpg) | ![The Kate Edger Information Commons from the north-east, by the Old Choral Hall, through the walker's eyes](landmarks/kate-edger-information-commons-eyes.jpg) |

The fifteenth is the Humanities Building (206), beside the CLL Building: an L of two wings of buff brick under
red clay-tiled roofs, a higher middle along each wing with a lower roof round its outer sides, a raised roof
on eight sides over the corner where the wings meet, rising to a flat top, and a low block at the street
wing's south-east end, where the ground is 8 m lower. On the street wing's face to the courtyard four bands of
brick run between ribbons of windows set back behind them, most of their panes behind film in vertical stripes
of red, orange and yellow, with a glazed slot for the stair in dark red frames and the entrance at its foot.
Its heights come from the LiDAR, the slopes of its corner's roof fitted to the returns on it; the upper edge
of its top band, which the eave hides from the LiDAR, the sill of its lowest windows and the sides of its
entrance are estimated in a photograph from the courtyard, through a camera fitted to points picked on it
whose places the LiDAR measures. What nothing measures is estimated, and its card names it: among other things
how far its windows stand back and which panes have the film, drawn two in every three. Counted inside the
rectangle the model fills on the screen, its silhouette has an IoU of 0.93 in that photograph; the brightness
of the building is within 8 of the photograph's. From above its outline covers the LiDAR's with an IoU of
0.90, and on 98% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does
not show is drawn in plain brick: its other faces.

| | |
| --- | --- |
| ![The Humanities Building from its courtyard, drawn from code](landmarks/humanities-building-front.jpg) | ![The Humanities Building from above, drawn from code](landmarks/humanities-building-above.jpg) |
| ![The Humanities Building on the map, drawn from code in the map's colours](landmarks/humanities-building-map.jpg) | ![The Humanities Building from its courtyard, through the walker's eyes](landmarks/humanities-building-eyes.jpg) |

The sixteenth is building 302 of the Science Centre, on Symonds Street: a tower over a lower block before its
south-west face. The tower's south-west face is in bands of pale
metal between ribbons of glass, one a storey, under a band of tall slats; its south-east face is clad in
brown, with a row of deep brown fins. Its roofs, square with its faces, fall gently to a band across their middle
where three sawtooth ramps rise toward the south-west, with plant in four boxes and lower roofs at its two ends,
each rising in a ramp to the parapet, and a lower wing along its north-east face. The lower block is wrapped in near-black screens of folded blades, which run
on round its ends along the tower's end faces, round a tall glazed corner at its south end. Its
heights come from the LiDAR, the ribbons' sills and heads from the LiDAR's returns on the face and the ramps fitted
to the returns on them; the edges of its glazed corner are estimated in a photograph from the street corner to
its south, through a camera fitted to points picked on it whose places the LiDAR measures. What nothing measures
is estimated, and its card names it: among other things the sizes and spacing of its slats, fins and blades.
Counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.92 in that photograph;
the brightness of the building is within 9 of the photograph's. From above its outline covers the LiDAR's with an
IoU of 0.89, and on 90% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph
does not show is drawn plainly: its faces to the north-east and north-west, the screen along its north-west
face and the lower wing along its north-east face.

| | |
| --- | --- |
| ![Building 302 of the Science Centre from the street corner to its south, drawn from code](landmarks/science-centre-302-front.jpg) | ![Building 302 of the Science Centre from above, drawn from code](landmarks/science-centre-302-above.jpg) |
| ![Building 302 of the Science Centre on the map, drawn from code in the map's colours](landmarks/science-centre-302-map.jpg) | ![Building 302 of the Science Centre from Symonds Street to its south, through the walker's eyes](landmarks/science-centre-302-eyes.jpg) |

The seventeenth is building 303 of the Science Centre: a range of four storeys along its street, faced in three
bands of mauve-grey precast panels with a shadowed gap under each, a canopy along the entrance over the glazed
ground storey; behind it, set back, a slab of ten storeys, its roof at 33.6 m with a raised part, a screened deck,
a round tank and a box of plant on it; behind the slab a block of ridged roofs with six round stacks rising to
42 m along the slab's back, and a wing with two troughs across its roof, a light well between it and the slab.
Every wall runs square with the face to the street, turned 3 degrees from the bearing its config measured from
the LiDAR's walls. Its heights
and plans come from the LiDAR, the gaps between the bands and the canopy at the LiDAR's returns on the face; the
roofs' colours come from the 2023 aerial. A large relief on the face is an artwork: it is not drawn after, and
the band there is plain. One photograph sees the lower part of the face close up through a wide lens; counted
inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.96 in it, and the brightness
of the building is within 4 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.85,
and on 86% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is
drawn plainly: every face but the one to the street.

| | |
| --- | --- |
| ![Building 303 of the Science Centre from its street, drawn from code](landmarks/science-centre-303-front.jpg) | ![Building 303 of the Science Centre from above, drawn from code](landmarks/science-centre-303-above.jpg) |
| ![Building 303 of the Science Centre on the map, drawn from code in the map's colours](landmarks/science-centre-303-map.jpg) | ![Building 303 of the Science Centre from its street, through the walker's eyes](landmarks/science-centre-303-eyes.jpg) |

The eighteenth is building 303S of the Science Centre, on Symonds Street: a block of eight storeys whose face to
the street is a curtain wall of mirror-like blue glass; toward its south-east end pale fins stand out of it, and
between the last of them and the pier at the corner a zigzag of pale braces climbs the face; its south-east end has
a pale spandrel band at each storey. On its roof, set back from the face, a top storey in pale grey panels behind a
parapet. Its heights and plans come from the LiDAR (the glass has almost no returns: the face's line comes from those
at its top); the fins' places and the storey's height are estimated with the photograph as a reference. One
photograph from the street about 95 m to the south-east, through a long lens; counted inside the rectangle the model
fills on the screen, its silhouette has an IoU of 0.97 in it, and the brightness of the building is within 1 of the
photograph's. From above its outline covers the LiDAR's with an IoU of 0.86, and on 86% of the cells both cover it
is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly: its back and its
north-west end.

| | |
| --- | --- |
| ![Building 303S of the Science Centre from Symonds Street to its south-east, drawn from code](landmarks/science-centre-303s-front.jpg) | ![Building 303S of the Science Centre from above, drawn from code](landmarks/science-centre-303s-above.jpg) |
| ![Building 303S of the Science Centre on the map, drawn from code in the map's colours](landmarks/science-centre-303s-map.jpg) | ![Building 303S of the Science Centre from Symonds Street to its south-east, through the walker's eyes](landmarks/science-centre-303s-eyes.jpg) |

The nineteenth is Architecture - West (421W), north-west of Architecture - East: a slab in pale grey concrete with, on
each floor of its north-east faces above its storey of doors, a pale louvred parapet under a band of windows, and that
storey glazed on a paved upper level; a grey hipped roof, with a tower in dark cladding on its ridge whose top falls to
the north-west; and two lower blocks at its north-west end. Its heights and plans come from the LiDAR; the storeys'
height, the parapets and the windows are estimated with the photograph as a reference. One photograph from the paved
upper level to its north, about 33 m from the tower; counted inside the rectangle the model fills on the screen, its
silhouette has an IoU of 0.97 in it, and the brightness of the building is within 1 of the photograph's. From above its
outline covers the LiDAR's with an IoU of 0.78, and on 82% of the cells both cover it is within 0.5 m of the LiDAR's
height (its south-east end, which joins Architecture - East and is left to that building's model, and lower parts before
its set-back face are not drawn). What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Architecture - West from the north, drawn from code](landmarks/architecture-west-front.jpg) | ![Architecture - West from above, drawn from code](landmarks/architecture-west-above.jpg) |
| ![Architecture - West on the map, drawn from code in the map's colours](landmarks/architecture-west-map.jpg) | ![Architecture - West from the paved level to its north, through the walker's eyes](landmarks/architecture-west-eyes.jpg) |

The twentieth is Architecture - East (421E), beside the Grafton Gully: a building in pale grey concrete whose main
block has, on each floor of its face to a raised terrace, a pale louvred parapet before a band of windows, and along its
top floor, under a grey hipped roof, a face in dark cladding with a row of dormers standing out of it; beside it a lower
wing with a band of windows on each floor. Two towers in the same dark cladding rise out of them, their tops sloping up:
a tall one out of the main block's roof and a lower one on the wing. Its walls run in two directions 45 degrees apart,
the wing's and the main block's, as the campus map's outline does. Its heights and plans come from the LiDAR; the
storeys' height, the parapets, the windows and the dormers are estimated with the photograph as a reference. One
photograph from a paved deck above the raised terrace, about 50 m from the tall tower; counted inside the rectangle the
model fills on the screen, its silhouette has an IoU of 0.94 in it, and the brightness of the building is within 1 of
the photograph's. From above its outline covers the LiDAR's with an IoU of 0.82, and on 63% of the cells both cover it
is within 0.5 m of the LiDAR's height (the storeys' edges stepping out on the main block's face to the terrace are not
drawn). What the photograph does not show is drawn plainly, the main block's faces turned away from the terrace and the
wing's walls below it, or after what it shows, the wing's other faces.

| | |
| --- | --- |
| ![Architecture - East from its raised terrace, drawn from code](landmarks/architecture-east-front.jpg) | ![Architecture - East from above, drawn from code](landmarks/architecture-east-above.jpg) |
| ![Architecture - East on the map, drawn from code in the map's colours](landmarks/architecture-east-map.jpg) | ![Architecture - East from its raised terrace, through the walker's eyes](landmarks/architecture-east-eyes.jpg) |

The twenty-first is Building 907 (907), on the Newmarket campus: a hall under a shallow barrel vault, clad in white
metal, with a band of glazing at the foot of its end toward the street, and beside it an annex of two storeys in orange
render, its windows in dark frames and its roof falling away from the hall. Its heights and plans come from the LiDAR;
the places and heights of the glazing and of the annex's windows and doors are estimated with the photograph as a
reference. One photograph from the street to its west-south-west, about 27 m from the annex's nearest corner; counted
inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.86 in it, and the brightness of the
building is within 2 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.96, and on 100% of
the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Building 907 from the street to its west-south-west, drawn from code](landmarks/building-907-front.jpg) | ![Building 907 from above, drawn from code](landmarks/building-907-above.jpg) |
| ![Building 907 on the map, drawn from code in the map's colours](landmarks/building-907-map.jpg) | ![Building 907 from the street to its west-south-west, through the walker's eyes](landmarks/building-907-eyes.jpg) |

The twenty-second is Auckland Bioengineering House (439), on Symonds Street: a tower clad all round in glass, its plan a
rectangle with its four corners cut, two stone fins on its north face rising a little above its top, and a plant room on
its roof; round its north and east sides a lower building, where the site falls steeply to the east. Its heights and
plans come from the LiDAR; the second fin's place is estimated with the photograph as a reference. One photograph from
Symonds Street to its north-west, about 32 m from the tower; counted inside the rectangle the model fills on the screen,
its silhouette has an IoU of 0.92 in it, and the brightness of the building is within 6 of the photograph's. From above
its outline covers the LiDAR's with an IoU of 0.92, and on 81% of the cells both cover it is within 0.5 m of the LiDAR's
height (the things on the tower's roof beside its plant room are not drawn). What the photograph does not show is drawn
plainly or after what it shows.

| | |
| --- | --- |
| ![Auckland Bioengineering House from the north-west, drawn from code](landmarks/auckland-bioengineering-house-front.jpg) | ![Auckland Bioengineering House from above, drawn from code](landmarks/auckland-bioengineering-house-above.jpg) |
| ![Auckland Bioengineering House on the map, drawn from code in the map's colours](landmarks/auckland-bioengineering-house-map.jpg) | ![Auckland Bioengineering House from Symonds Street to its north-west, through the walker's eyes](landmarks/auckland-bioengineering-house-eyes.jpg) |

The twenty-third is the Sir Owen G Glenn Building (260): a curved wing of several storeys over an open ground storey, its
glass behind bands of louvres between white spandrels and a crown of louvres along its top, a Y of three arms round a
raised plaza, with a sloping canopy in the curve's inner corner and a top storey along its west side; a lower west
wing along the road, a lower building on the plaza's north-east side, and under the plaza a deck of floors over the
gully to the east. Its heights and plans come from the LiDAR; the heights of the curved wing's bands are estimated
with the photograph as a reference. One photograph from the plaza's north edge, taken in December 2018, before the
building on the plaza's north-east side, which the comparison leaves out; counted inside the rectangle the model
fills on the screen, its silhouette has an IoU of 0.76 in it, and the brightness of the building is within 4 of the
photograph's. From above its outline covers the LiDAR's with an IoU of 0.93, and on 90% of the cells both cover it is
within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly or after what it shows.

| | |
| --- | --- |
| ![The Sir Owen G Glenn Building from the north-west, drawn from code](landmarks/owen-g-glenn-building-front.jpg) | ![The Sir Owen G Glenn Building from above, drawn from code](landmarks/owen-g-glenn-building-above.jpg) |
| ![The Sir Owen G Glenn Building on the map, drawn from code in the map's colours](landmarks/owen-g-glenn-building-map.jpg) | ![The Sir Owen G Glenn Building from the driveway to its north, through the walker's eyes](landmarks/owen-g-glenn-building-eyes.jpg) |

The twenty-fourth is 49 Symonds Street (620), on Symonds Street: an office tower of about thirteen storeys whose corners
step back, its bays under a gable in the middle of its faces clad in pale panels, each with a tall window arched at
its top, its steps in blue glass, with a white band along its top and a mansard on its roof; at its foot to the east a
podium in dark stone with a pointed gable over its entrance, and lower buildings behind it. Its heights and plans come
from the LiDAR; the heights of its white band, its dark base and its windows, and its windows' widths and places, are
estimated with the photograph as a reference. One photograph from Symonds Street to its east, about 48 m from the
tower; counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.89 in it, and the
brightness of the building is within 3 of the photograph's. From above its outline covers the LiDAR's with an IoU of
0.89, and on 83% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show
is drawn after what it shows.

| | |
| --- | --- |
| ![49 Symonds Street from the east, drawn from code](landmarks/49-symonds-street-front.jpg) | ![49 Symonds Street from above, drawn from code](landmarks/49-symonds-street-above.jpg) |
| ![49 Symonds Street on the map, drawn from code in the map's colours](landmarks/49-symonds-street-map.jpg) | ![49 Symonds Street from Symonds Street, through the walker's eyes](landmarks/49-symonds-street-eyes.jpg) |

The twenty-fifth is Okareta (215), beside Symonds Street: a villa of two storeys of the 1880s, rendered and painted a warm
yellow ochre under hipped roofs of grey iron, with a verandah across the left of its front and a canted bay of two
storeys on the right, its windows arched at their heads in moulded surrounds. Its heights and plans come from the
LiDAR; the places and heights of its windows, its door, its bay's face and its verandah are estimated with the
photograph as a reference. One photograph from the footpath before it, about 18 m from its front; counted inside the
rectangle the model fills on the screen, its silhouette has an IoU of 0.77 in it, and the brightness of the building
is within 4 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.90, and on 81% of the
cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Okareta from the north, drawn from code](landmarks/okareta-front.jpg) | ![Okareta from above, drawn from code](landmarks/okareta-above.jpg) |
| ![Okareta on the map, drawn from code in the map's colours](landmarks/okareta-map.jpg) | ![Okareta from the footpath before it, through the walker's eyes](landmarks/okareta-eyes.jpg) |

The twenty-sixth is building 501 of the M&HS Building, on the Grafton campus: a long block in board-marked concrete with,
at its east end toward a plaza, a tower under a dark crown of standing-seam metal, its foot flared out over the shaft
and its corners hipped up to a flat top; a strip of windows up the middle of the tower's face, a glazed box at its foot,
and a glazed link beside it to the north. Its heights and plans come from the LiDAR; the crown's eave and band, the
glazed link's top and floors and the strip of windows are estimated with the photograph as a reference. One
photograph from the plaza, about 67 m from the tower; counted inside the rectangle the model fills on the screen, its
silhouette has an IoU of 0.91 in it, and the brightness of the building is within 7 of the photograph's. From above
its outline covers the LiDAR's with an IoU of 0.83, and on 78% of the cells both cover it is within 0.5 m of the
LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Building 501 of the M&HS Building from its plaza, drawn from code](landmarks/mhs-building-501-front.jpg) | ![Building 501 of the M&HS Building from above, drawn from code](landmarks/mhs-building-501-above.jpg) |
| ![Building 501 of the M&HS Building on the map, drawn from code in the map's colours](landmarks/mhs-building-501-map.jpg) | ![Building 501 of the M&HS Building from its plaza, through the walker's eyes](landmarks/mhs-building-501-eyes.jpg) |

The twenty-seventh is building 502 of the M&HS Building, on the Grafton campus beside 501: a main block of seven storeys
in pale concrete, its north face to the street a row of tall fins with window bays between them, their spandrels in a
textured grey, its east end pale panels beside a near-black glazed strip, under a dark metal skirt and a low hipped
roof with a plant room at each end; and a lower part of five storeys at its west end. Its heights and plans come from
the LiDAR; the foot of the roof's skirt, which the photograph shows, from the LiDAR's outermost roof cells, and the
edge of the east end's glazed strip in the photograph are estimated. One photograph from the street to its
north-east, about 38 m from the main block's corner; counted inside the rectangle the model fills on the
screen, its silhouette has an IoU of 0.93 in it, and the brightness of the
building is within 1 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.91, and on 91% of
the cells both cover it is within 0.5 m of the LiDAR's height (the strip of its roof inside block 501's ring is drawn
by 501's model). What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Building 502 of the M&HS Building from the street to its north-east, drawn from code](landmarks/mhs-building-502-front.jpg) | ![Building 502 of the M&HS Building from above, drawn from code](landmarks/mhs-building-502-above.jpg) |
| ![Building 502 of the M&HS Building on the map, drawn from code in the map's colours](landmarks/mhs-building-502-map.jpg) | ![Building 502 of the M&HS Building from the street to its north-east, through the walker's eyes](landmarks/mhs-building-502-eyes.jpg) |


The twenty-eighth is building 507 of the M&HS Building, on the Grafton campus: along the street a block of five
storeys, its upper storeys clad in tall near-black fins over a glazed base two storeys high; north of it three glazed
bays stepping back one behind another, with a canopy over the entrance at their foot; behind them a block under flat
roofs at the same height, with raised parts and a lower part on its south side. Its heights and plans come from the
LiDAR; the underside of the finned storeys and the foot of the canopy's fascia are estimated with the photograph as a
reference. One photograph from across the street to its east-south-east at dusk, about 16 m from the street face;
counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.97 in it, and the brightness
of the building is within 5 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.89, and on 92% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn
plainly.

| | |
| --- | --- |
| ![Building 507 of the M&HS Building from across the street to its east-south-east, drawn from code](landmarks/mhs-building-507-front.jpg) | ![Building 507 of the M&HS Building from above, drawn from code](landmarks/mhs-building-507-above.jpg) |
| ![Building 507 of the M&HS Building on the map, drawn from code in the map's colours](landmarks/mhs-building-507-map.jpg) | ![Building 507 of the M&HS Building from across the street to its east-south-east, through the walker's eyes](landmarks/mhs-building-507-eyes.jpg) |


The twenty-ninth is Te Pūtahi Tangata (201), on the City campus between the Humanities Building and the Music School:
on the street a hall whose front is glass from the pavement to its roof, under a folded roof whose plates rise and fall
across the front, their ridges running back from the street; a canopy over its entrance; at its north-east end a taller
block clad in pale metal; and behind them, down the slope, a long block whose roofs stand about 25 m over the street,
with raised strips and parts. Its heights and plans come from the LiDAR; the depth of the folded roof's plates at the
front and of the canopy are estimated with the photograph as a reference, and that of two plates, along the hall's
south-west side and over a passage by the long block, without one. One photograph from the street to its north-west,
about 14 m from the glass, through three plane trees whose leaves hide all the sky over the roof: no silhouette can be
counted against the sky, so the model was checked by laying it over the photograph through the camera fitted to it (to
1.8 pixels), and the brightness of the building is within 11 of the photograph's. From above its outline covers the
LiDAR's with an IoU of 0.91, and on 80% of the cells both cover it is within 0.5 m of the LiDAR's height. What the
photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Te Pūtahi Tangata from the street to its north-west, drawn from code](landmarks/te-putahi-tangata-front.jpg) | ![Te Pūtahi Tangata from above, drawn from code](landmarks/te-putahi-tangata-above.jpg) |
| ![Te Pūtahi Tangata on the map, drawn from code in the map's colours](landmarks/te-putahi-tangata-map.jpg) | ![Te Pūtahi Tangata from the street to its north-west, through the walker's eyes](landmarks/te-putahi-tangata-eyes.jpg) |


The thirtieth is the George Mason Biology Building (106), on the City campus beside the Thomas Building: a long
block of three storeys in cream render, its walls up to a parapet and a grey attic set back behind it under a low hipped
roof; its middle wider, with two wings to the south-west and raised parts over the roof; at its south-east end, on the
street, three bays of red-framed windows between pilasters. Its heights and plans come from the LiDAR, and so does its
outline, which the campus map gives about 3.5 m short at each end; the windows of its south-east end and its pilasters'
width are estimated with the photograph as a reference. One photograph from the street to its south-east, square to that
end, through plane trees and under a hazy sky: the copy the project has is squeezed across, and was stretched back to
16:9 before its camera was fitted (to 1.4 pixels); its sky is too faint to count a silhouette against, so the model was
checked by laying it over the photograph through that camera, and the brightness of a plain stretch of the end wall is
the photograph's. From above its outline covers the LiDAR's with an IoU of 0.93, and on 85% of the cells both cover it
is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![The George Mason Biology Building from the south, drawn from code](landmarks/george-mason-biology-front.jpg) | ![The George Mason Biology Building from above, drawn from code](landmarks/george-mason-biology-above.jpg) |
| ![The George Mason Biology Building on the map, drawn from code in the map's colours](landmarks/george-mason-biology-map.jpg) | ![The George Mason Biology Building from the street to its south-east, through the walker's eyes](landmarks/george-mason-biology-eyes.jpg) |


The thirty-first is building 505 of the M&HS Building, on the Grafton campus: a long block of four storeys in white
concrete panels over a ground floor set back under its upper storeys, behind round columns on the north; on its north
face, toward a plaza, twelve bays of silver fins and louvres over set-back glazing between a white wall at each end,
glass at its north-east corner and a dark band round its cut south-east corner; over the parapet a higher middle of the
roof, and at its west end an atrium under a glass roof. Its heights and plans come from the LiDAR, and so does its
outline: the campus map's lies about 7 m north-north-east of it, over the plaza. The north face's storeys, how far its
glazing stands behind its fins and louvres, the fins' top and the louvres' spacing, where its end bay and the white wall
at its north-east corner stop, the ground floor's set-back and its columns there, the end bay's windows and their
frames, the east face's glass and its foot, and the glazed front and the link under their grey bands are estimated with
the photograph as a reference. One photograph from the main road north-east of it, about 42 m from its north-east
corner; counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.94 in it, and the
brightness of its white walls is within 3 of the photograph's. From above its outline covers the LiDAR's with an IoU of
0.93, and on 92% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is
drawn plainly.

| | |
| --- | --- |
| ![Building 505 of the M&HS Building from the main road to its north-east, drawn from code](landmarks/mhs-building-505-front.jpg) | ![Building 505 of the M&HS Building from above, drawn from code](landmarks/mhs-building-505-above.jpg) |
| ![Building 505 of the M&HS Building on the map, drawn from code in the map's colours](landmarks/mhs-building-505-map.jpg) | ![Building 505 of the M&HS Building from the main road to its north-east, through the walker's eyes](landmarks/mhs-building-505-eyes.jpg) |


The thirty-second is 2-6 Park Ave (529), on the Grafton campus: a long block of four storeys under a thin flat roof
with a dark eave; at each upper storey a balcony along every face on a pale slab with a light rail; on its east face, on
Park Avenue, the glazing behind them and a ground storey of pale grey brick; on its roof grey plant and a raised part
with a red roof. Its heights and plans come from the LiDAR, which also sees the balconies' slabs and rails all round,
and the ground under its eaves, where the walls are drawn set back, but for the part of a low wing south-west of it that
trees hide, drawn to the campus map's outline; the balconies' slabs' depth and their rails' bars and posts, the glazing
behind them on the east face and its ground storey's brick and windows are estimated with the photograph as a reference.
One photograph from the footpath of Park Avenue, looking along the east face; counted inside the rectangle the model
fills on the screen, its silhouette has an IoU of 0.96 in it, and the brightness of that face is within 8 of the
photograph's. From above its outline covers the LiDAR's with an IoU of 0.87, and on 89% of the cells both cover it is
within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![2-6 Park Ave from Park Avenue, drawn from code](landmarks/2-6-park-ave-front.jpg) | ![2-6 Park Ave from above, drawn from code](landmarks/2-6-park-ave-above.jpg) |
| ![2-6 Park Ave on the map, drawn from code in the map's colours](landmarks/2-6-park-ave-map.jpg) | ![2-6 Park Ave from Park Avenue, through the walker's eyes](landmarks/2-6-park-ave-eyes.jpg) |

The thirty-third is Building 114, on the City campus, until now a measured massing: a long block of two storeys under a
flat roof with a deep eave all round and a raised strip down the middle of its roof; on its south-west face, on a lawn
and a car park, a band of windows under the eave over white cladding, a floor band, a ground storey of windows between
dark posts, and a glass stair tower with red doors up four brick steps, and a second along it. Its heights and plans
come from the LiDAR,
which also sees the ground under its eaves, where the walls are drawn set back; the windows, the floor band, the
posts, the stair tower's frames, doors and steps and the eave's underside are estimated with the photograph as a
reference. One photograph from the car park, looking at the south-east half of the south-west face; counted inside
the rectangle the model fills on the screen, its silhouette has an IoU of 0.95 in it, and the brightness of its
cladding is within 8 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.94, and on 99% of
the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![Building 114 from the car park, drawn from code](landmarks/building-114-front.jpg) | ![Building 114 from above, drawn from code](landmarks/building-114-above.jpg) |
| ![Building 114 on the map, drawn from code in the map's colours](landmarks/building-114-map.jpg) | ![Building 114 from the car park, through the walker's eyes](landmarks/building-114-eyes.jpg) |

The thirty-fourth is 67 Symonds Street (619), on the City campus, until now a measured massing standing in for it: a
white office tower of about eight storeys over Symonds Street, with a block turned 45 degrees and plant over its roof,
on a podium that runs down the slope to the gully on its north and west; on its south face three columns of windows
and a curved bay of dark glass bands, on its east face louvred panels and windows; a glass porch over its entrance.
Its heights and plans come from the LiDAR, which also sees the ground under the porch's roof; the windows, the bay's
bands and the louvres are estimated with the photograph as a reference, and the porch's plan and the podium's walls
follow the campus map's outline. One photograph from the street south-east of the tower, under an overcast sky; counted
inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.95 in it, and the brightness of its
faces is within 8 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.93, and on 80% of the
cells both cover it is within 0.5 m of the LiDAR's height (the parapets and plant on its roofs make most of the rest).
What the photograph does not show is drawn plainly.

| | |
| --- | --- |
| ![67 Symonds Street from the street, drawn from code](landmarks/67-symonds-street-front.jpg) | ![67 Symonds Street from above, drawn from code](landmarks/67-symonds-street-above.jpg) |
| ![67 Symonds Street on the map, drawn from code in the map's colours](landmarks/67-symonds-street-map.jpg) | ![67 Symonds Street from the street before its walkway, through the walker's eyes](landmarks/67-symonds-street-eyes.jpg) |

The thirty-fifth is Fine Arts Studio Block 431, on the City campus, until now a measured massing: a long block of three
storeys under a roof of two pitches, the north one rising to a step over the middle and the south one falling to the
eave over the lane, with a lower annex on its north side; at its east end a glass stair tower beside the entrance; on
its south face, over the lane and its car park, columns every 4 to 5 m, three rows of windows of three lights a bay and
a ground storey of roller doors, and a low box with roller doors before it. Its heights and plans come from the LiDAR;
the columns, the windows and the roller doors are estimated with the photograph as a reference, and a second photograph,
of its east entrance, shows the stair tower and the canopy there to be glass. One photograph from the car park at the
lane's west end, looking along the south face; counted inside the rectangle the model fills on the screen, its
silhouette has an IoU of 0.95 in it, and the brightness over it is within 7 of the photograph's. From above its outline
covers the LiDAR's with an IoU of 0.93, and on 97% of the cells both cover it is within 0.5 m of the LiDAR's height.
What the photographs do not show is drawn plainly.

| | |
| --- | --- |
| ![Fine Arts Studio Block 431 from the lane, drawn from code](landmarks/fine-arts-studio-block-431-front.jpg) | ![Fine Arts Studio Block 431 from above, drawn from code](landmarks/fine-arts-studio-block-431-above.jpg) |
| ![Fine Arts Studio Block 431 on the map, drawn from code in the map's colours](landmarks/fine-arts-studio-block-431-map.jpg) | ![Fine Arts Studio Block 431 from the lane, through the walker's eyes](landmarks/fine-arts-studio-block-431-eyes.jpg) |

The thirty-sixth is Fine Arts Studio Block 433, on the City campus, until now a measured massing: a long block of four
storeys under a shallow vault whose ends bow out, its face to the lane it shares with 431 a wall of glazing, most of
its panes frosted and some red, yellow or blue, over a dark red ground storey; its west-south-west end clad in yellow
weatherboards, with a grey bay, two balconies with bowed fronts and an outside stair beside them; at its
east-north-east end a lower block rounded in plan. Its heights and plans come from the LiDAR but for the end wall's
place and the red ground storey's height; those, the glazing's mullions, floor bands and panels, the doors and
windows, the balconies' fronts and the stair are estimated with the photograph as a reference. One photograph from the road at the block's west-south-west end, looking along the face to the lane and at
the end; counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.92 in it, and the
brightness over it is within 4 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.94,
and on 99% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is
drawn plainly.

| | |
| --- | --- |
| ![Fine Arts Studio Block 433 from the road at its end, drawn from code](landmarks/fine-arts-studio-block-433-front.jpg) | ![Fine Arts Studio Block 433 from above, drawn from code](landmarks/fine-arts-studio-block-433-above.jpg) |
| ![Fine Arts Studio Block 433 on the map, drawn from code in the map's colours](landmarks/fine-arts-studio-block-433-map.jpg) | ![Fine Arts Studio Block 433 from the road at its end, through the walker's eyes](landmarks/fine-arts-studio-block-433-eyes.jpg) |

The thirty-seventh is 58 Symonds Street, on the City campus, until now a measured massing: a tower of eight storeys of
windows over a dark ground storey, on a slope that falls to the south-east; at every floor a deep pale grey band runs
round it with a row of louvres hung under it, over a band of windows set back behind it, a column at each corner and
piers between them; an upper roof stands in from its edge, and on its street side a core rises over it with a roof
that falls to the street. Its heights and plans come from the LiDAR; the bands' depth, the window wall, the louvres,
the columns and piers and the ground storey are estimated with the photograph as a reference. One photograph from the
ground north of the tower, looking up at its north-east and north-west faces; counted inside the rectangle the model
fills on the screen, its silhouette has an IoU of 0.97 in it, and the brightness over it is within 1 of the
photograph's. From above its outline covers the LiDAR's with an IoU of 0.91, and on 93% of the cells both cover it is
within 0.5 m of the LiDAR's height. What the photograph does not show is drawn plainly, on the same grid.

| | |
| --- | --- |
| ![58 Symonds Street from the ground to its north, drawn from code](landmarks/58-symonds-street-front.jpg) | ![58 Symonds Street from above, drawn from code](landmarks/58-symonds-street-above.jpg) |
| ![58 Symonds Street on the map, drawn from code in the map's colours](landmarks/58-symonds-street-map.jpg) | ![58 Symonds Street from the ground to its north, through the walker's eyes](landmarks/58-symonds-street-eyes.jpg) |

The thirty-eighth is Security (409), on the City campus, until now a measured massing: a low block of two storeys
whose upper storey is a deep band of pale concrete, its south corner cut by a chamfer that faces a paved court, over a
ground storey of glazing set back under it on columns; before the corner a deck with a railing and a flight of steps
down to the court, and on its flat roof, behind a low parapet, a box at its west corner and a lower block toward its
east end. Its heights and plans come from the LiDAR but for the chamfer's width; that, the band's underside, the
glazing's place behind it, the columns, the deck, its railing and the steps are estimated with the photograph as a
reference. One photograph from the court to its south, looking at the chamfered corner and its two faces; counted
inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.78 in it, where the trees round it
leave little sky, and the brightness over it is within 3 of the photograph's. From above its outline covers the
LiDAR's with an IoU of 0.94, and on 89% of the cells both cover it is within 0.5 m of the LiDAR's height, the rest
mostly under a tree's crown along its north side and a row of small units on its roof, neither drawn, and along the
roof blocks' edges. What the photograph does not show is drawn as what it does.

| | |
| --- | --- |
| ![Security from the court to its south, drawn from code](landmarks/security-409-front.jpg) | ![Security from above, drawn from code](landmarks/security-409-above.jpg) |
| ![Security on the map, drawn from code in the map's colours](landmarks/security-409-map.jpg) | ![Security from the court to its south, through the walker's eyes](landmarks/security-409-eyes.jpg) |

The thirty-ninth is Building 903 (903), on the Newmarket campus, until now a measured massing: a long block of four
storeys whose two upper storeys are a box clad in pale corrugated metal, with windows singly and in bands, over two
glazed storeys set back under it on piers; a canopy over the entrance at its south-east corner, its south face stepped
forward part of the way along, and a low roof of two slopes with plant on it, the east end a low gable. Its heights
and plans come from the LiDAR; its windows and their frames, the glazed storeys' plinth, piers and mullions and their
place behind the forward face, the canopies' depth and the depth of the roof under the step are estimated with the
photograph as a reference. One photograph from the road to its south-east, looking at its south face and east end;
counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.96 in it, and the
brightness over it is within 5 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.92, and
on 97% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn as
what it does.

| | |
| --- | --- |
| ![Building 903 from the road to its south-east, drawn from code](landmarks/building-903-front.jpg) | ![Building 903 from above, drawn from code](landmarks/building-903-above.jpg) |
| ![Building 903 on the map, drawn from code in the map's colours](landmarks/building-903-map.jpg) | ![Building 903 from the road to its south-east, through the walker's eyes](landmarks/building-903-eyes.jpg) |

The fortieth is Structures Hall (906), on the Newmarket campus, until now a measured massing: two long blocks side by
side, each under a roof of one slope that rises to the line between them, with three square stacks on that line and a
lower block against the east end; the south face three glazed storeys with light bands between them, under a light
fascia and between dark frames, over a ground storey set back behind piers and two Vs of braces. Its heights and plans
come from the LiDAR; the south face's glazing, bands, mullions, fascia and frames, its ground storey and the stacks'
bands are estimated with the photograph as a reference. One photograph of its south face, from an open lot to its
south; counted inside the rectangle the model fills on the screen, its silhouette has an IoU of 0.96 in it, and the
brightness over it is within 4 of the photograph's. From above its outline covers the LiDAR's with an IoU of 0.96, and
on 98% of the cells both cover it is within 0.5 m of the LiDAR's height. What the photograph does not show is drawn
plain.

| | |
| --- | --- |
| ![Structures Hall from the lot to its south, drawn from code](landmarks/structures-hall-front.jpg) | ![Structures Hall from above, drawn from code](landmarks/structures-hall-above.jpg) |
| ![Structures Hall on the map, drawn from code in the map's colours](landmarks/structures-hall-map.jpg) | ![Structures Hall from the lot to its south, through the walker's eyes](landmarks/structures-hall-eyes.jpg) |

The site draws each landmark in place of its buildings' blocks (the Clock Tower in place of buildings
105 and 105S, its south range; Old Government House in place of 102; the General Library in place
of 109; Old Choral Hall in place of 104; Maclaurin Chapel in place of 107; the Clock Tower East Wing
in place of 119; 9 Eden Crescent in place of 801; 15 Eden Crescent in place of 802; the Fisher Building in
place of 804; the Thomas Building Extension in place of 110N; the Kenneth Myers Centre in place of 820;
the Thomas Building in place of 110; the Music School in place of 250; the Kate Edger Information
Commons in place of 315; the Humanities Building in place of 206; building 302 of the Science Centre in place
of 302; building 303 of the Science Centre in place of 303; building 303S of the Science Centre in place of 303S;
Architecture - West in place of 421W; Architecture - East in place of 421E; Building 907 in place of 907; Auckland
Bioengineering House in place of 439; the Sir Owen G Glenn Building in place of 260; 49 Symonds Street in place of 620;
Okareta in place of 215; building 501 of the M&HS Building in place of 501; building 502 of the M&HS Building in place
of 502; building 505 of the M&HS Building in place of 505; building 507 of the M&HS Building in place of 507; Te Pūtahi
Tangata in place of 201; the George Mason Biology Building in place of 106; 2-6 Park Ave in place of 529; Building 114
in place of 114; 67 Symonds Street in place of 619; Fine Arts Studio Block 431 in place of 431;
Fine Arts Studio Block 433 in place of 433; 58 Symonds Street in place of 435; Security in place of 409; Building 903
in place of 903; Structures Hall in place of 906) when the
camera comes
near: on the map in the map's colours, and from a walker's height in its own materials on a
computer with a graphics card. The blocks still answer a click and open on their floors. The
geometry and the textures are made in a worker, the first time they are wanted, so that the page
does not stop for them ([`landmarks/README.md`](../landmarks/README.md), "On the site").

| On the map, near it | Through a walker's eyes on Princes Street |
| --- | --- |
| ![The Clock Tower on the map, drawn from code in the map's colours](landmarks/clocktower-map.jpg) | ![The Clock Tower from Princes Street, through the walker's eyes](landmarks/clocktower-eyes.jpg) |

The pipeline and the viewer stay beside the site. To look at the model alone, serve the repository
root (`python3 -m http.server 8765 --bind 127.0.0.1`) and open
`http://localhost:8765/landmarks/pipeline/viewer/index.html?landmark=clocktower&view=orbit`.

- The model and the rules the agents worked to: [`landmarks/clocktower/`](../landmarks/clocktower/).
- **Measured massings** ([`landmarks/MASSING.md`](../landmarks/MASSING.md)): plain buildings that a
  program draws from the same LiDAR, with no agent and no photograph: blocks and roofs at the
  measured heights, walls, storeys and windows by the street look's rules. Nineteen are on the site
  (`landmarks/measured/`): on the City campus five plain buildings, and seven of the buildings planned
  as landmarks, which they stand in for until their landmarks come; on the Grafton campus two, and on
  the Newmarket campus five. Building 114, Fine Arts Studio Block 431, Fine Arts Studio Block 433, 58 Symonds Street,
  Security, Building 903 and Structures Hall, seven of the plain buildings, and 67 Symonds Street, which a measured
  massing stood in for, are landmarks now. The other buildings it measures
  keep their blocks, each with its reason
  in `landmarks/measured/exclusions.json`.
- What every landmark shares ([`landmarks/`](../landmarks/README.md)): the kit the models are built
  with, the viewer, and the pipeline (`landmarks/pipeline/run.sh <name>`: measure from the LiDAR,
  collect the Street View references (or fit a photograph's camera), correct their cameras, render and
  score, and place the model
  on the campus map).
- How to make the next landmark: the `landmark-from-code` skill
  ([`.claude/skills/landmark-from-code/`](../.claude/skills/landmark-from-code/SKILL.md)), with the
  method and every agent's brief.
- Street View is used through Google's Map Tiles API with a key of your own; its imagery stays on
  the computer that fetched it and is in no commit. The way of working follows
  [Athenaion](https://github.com/Leonxlnx/athenaion) by Leon Lin.
