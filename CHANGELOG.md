# Changelog

What changed on the site, newest first. Every merge into `main` is published straight away, so
entries are dated (New Zealand time) rather than numbered as versions. Numbers in brackets are pull
requests.

A change to what the site does or shows adds its line here, and the README's
[What's new](README.md#whats-new) says it in a few words (see [docs/standards.md](docs/standards.md)).

## Held back

- **Course catalogue.** Search for all 6,982 courses of the 2026 Curriculum Catalogue by code or
  title, with the terms and campuses each is offered in (#24). Built, and kept out of `main` until
  the Classes API key arrives, so that what the timetable and the catalogue each supply can be
  settled with both in hand.

## 2026-10-28

### Added

- **15 Eden Crescent drawn in detail.** Near the camera the map draws 15 Eden Crescent (802), next to
  9 Eden Crescent, from code in place of its block: a long white two-storey building on Eden
  Crescent, its windows set deep in square openings with red frames, in two rows over a base of
  brownish-grey tiles, a band of windows under the canopy at its top and, near its north-west end, two
  doors with steps and a louvre; its roof slopes up from the street and from the back to a top storey
  under a curved roof. Its heights are measured from the LINZ 2024 LiDAR, but for two parts of its
  roofs, over a well at its south-east end and by the street at its north-west end, which are
  estimated, and the street face's openings and doors from a Street View photograph of it. On the map
  it has the map's colours; from a walker's height on a computer with a graphics card, its own white
  paint, glass, timber and red frames. Its back and ends, which no photograph shows, are drawn
  plainly. A click still opens its floors (#116).
- **Four more measured massings.** Near the camera, Building 240, 103 Alfred Nathan House, 305
  Science Centre and 619 67 Symonds Street are drawn from the LINZ 2024 LiDAR in place of their
  blocks, as the five plain buildings already are: their layers and roofs measured, their walls,
  storeys and windows drawn by rule. Building 240's two hip roofs are measured now, as the program
  stands roofs that meet in a valley on a plinth at their eaves. The other three are buildings that
  the landmark queue means to draw in detail one day; each stands in until its landmark comes. The
  other buildings of the queue in the LiDAR keep their blocks, every place where people live among
  them (Carlaw Park's blocks too, which OpenStreetMap tags as student housing), each with its reason
  (`landmarks/measured/exclusions.json`) (#108).

## 2026-10-27

### Added

- **Otago World Model, at /otago/.** Another school on the site: the University of Otago | Ōtākou
  Whakaihu Waka, in 3D on the LINZ ground among the streets and buildings round it. The Dunedin
  campus has 94 buildings; "Other campuses" in the campus list takes the map to the Christchurch
  campus round Christchurch Hospital, where three buildings are tagged as Otago's. The 97 buildings
  come from OpenStreetMap, picked by their `operator` and `building=university` tags and their
  names, each one block at its OpenStreetMap height (21 from their number of levels), else at a
  default, and labelled by name. Otago Polytechnic's buildings, the students' association's, the
  School of Medicine on Christchurch Hospital's grounds (no tag the site reads says whose it is)
  and those with no name are left out, each with its reason. The Wellington and Invercargill
  campuses are not shown: OpenStreetMap names no university building at either and gives none
  Otago as its operator. Rooms, class times, semester dates and the paper list are not shown, and
  the status strip, the time panel, the card and About say why in Otago's own case. Residential
  colleges and childcare centres stay unnamed. Unofficial, with the project's own colours; nothing
  is taken from Otago (#111).
- **VUW's Pipitea and Te Aro campuses.** /vuw/ adds two campuses to Kelburn, each chosen from
  "Other campuses" in the campus list and standing in its own patch of Wellington from
  OpenStreetMap, on the LINZ ground. Pipitea has three buildings: Old Government Buildings,
  Rutherford House and the Law School Lecture Theatres. Te Aro has one, 139 Vivian Street, which
  OpenStreetMap names the Faculty of Architecture & Design; its unnamed neighbour on Wigan Street,
  and Te Auaha and NEC House, which OpenStreetMap does not tag as VUW's, stand among the
  surroundings. Halls of residence and flats stay unnamed, even where OpenStreetMap names VUW as
  their operator. Rutherford House stands at a default height: its card says the height is
  estimated, and About says why (#106).
- **VUW World Model, at /vuw/.** A third school on the site: the Kelburn Campus of Te Herenga
  Waka—Victoria University of Wellington, in 3D on the LINZ ground among Kelburn's houses and
  streets. Its 52 buildings come from OpenStreetMap, picked by their `operator` and
  `building=university` tags and their names, each one block at its OpenStreetMap height (43 from
  their number of levels), else at a default, and labelled by name: OpenStreetMap gives none of
  them a code. A building's card gives its name and height, says how the height was found, and
  links to its OpenStreetMap element. Rooms, class times, trimester dates and the course list are
  not shown, and the status strip, the time panel, the card and About say why in VUW's own case.
  Halls of residence and the childcare centre stay unnamed. Unofficial, with the project's own
  colours; nothing is taken from VUW (#101).
- **AUT's North and South campuses, at /aut/.** "Other campuses" in the campus list now takes the
  map to AUT's North Campus on Akoranga Drive, Northcote (15 buildings) and its South Campus on
  Great South Road, Manukau (8 buildings), each in its own patch of OpenStreetMap surroundings on
  the LINZ ground, as the University of Auckland's campuses away from the city are. Their buildings are
  picked by AUT's building code (a campus letter and a building letter) in their `ref` or as their
  whole name, and labelled by it; every South Campus building, and AY and AZ on the North Campus,
  has the code only as its name. North's AE Building is not shown as one of AUT's buildings:
  OpenStreetMap draws it as 15 separate outlines, which stand among the surroundings. AUT now
  shows 41 buildings, and About says which campuses are modelled (#103).
- **The Clock Tower East Wing drawn in detail.** Near the camera the map draws the Clock Tower East
  Wing (119) from code in place of its block: two storeys of rock-faced cream stone, two gabled
  pavilions toward the lawn and the car park, a plain stair tower rising between them,
  segmental-headed windows upstairs and narrow ones below, all white-framed, and a red tile roof,
  every height measured from the LINZ 2024 LiDAR. On the map it has the map's colours; from a
  walker's height on a computer with a graphics card, its own stone, glass and red clay tiles. Its
  back, its ends and the low link toward the Clock Tower, which no photograph shows, are drawn
  plainly. A click still opens its floors (#102).
- **9 Eden Crescent drawn in detail.** Near the camera the map draws 9 Eden Crescent (801) from code
  in place of its block: a white four-storey building whose street end on Eden Crescent shows a
  white top storey raked at one corner over three bays between two white piers, bands of windows,
  a vehicle way, a glazed entrance and a glazed corner under a canopy; along one side the top storey
  stands back behind a terrace, and plant stands on the flat roof. Every height is measured from the
  LINZ 2024 LiDAR, and the street end's openings from two Street View photographs of it. On the map
  it has the map's colours; from a walker's height on a computer with a graphics card, its own white
  paint, glass and aluminium. Its long sides and far end, which no photograph shows, are drawn
  plainly. A click still opens its floors (#107).

### Changed

- **The site's root lists the schools.** https://campusworldmodel.com/ is now a page of its own,
  in the project's colours: for each school on the site, its name, its city, how much of it the
  site shows, the date of its campus snapshot and a link to its map. It says that the project is
  unofficial and not affiliated with any of these universities, and it runs no script and no
  WebGL. Before, the root sent every visitor to /uoa/. An address that is not on the site now gets
  "No page at this address", with the same list, and status 404 (#99).

### Fixed

- **Bridges between buildings no longer stand on the street.** The surroundings drew every
  OpenStreetMap building from the ground up, so a bridge between two buildings was a solid block
  across the street under it, 4.3 to 17.5 m high. A building now starts at the height its tags
  give (`min_height`, else `building:min_level` storeys of 3.3 m), as a part of a building already
  did. Near the University of Auckland, 6 bridges and 3 other buildings now stand on that base with
  the ground open under them; AUT's map has one more, the University's Overbridge. 5 bridges whose
  tags give no base stay in the data, marked as bridges, and are not drawn or walked round, AUT's
  skybridge among them: a gap, not a guess. In the map's first view the Customhouse tower now
  starts 13.2 m up and AUT's skybridge is gone; near Grafton two bridges at the hospital are gone.
  Every other building keeps its look (#100).
- **VUW's status strip and time panel say trimester.** Where no dates are shown, the status strip
  and the time panel said "No semester dates are shown", and the strip listed "semester dates"
  among what is not shown, at every school: the words were shared, and a school could not replace
  them. VUW teaches in trimesters, and its About already said so. A school's words can now replace
  these two texts: at /vuw/ they say "No trimester dates are shown" and "trimester dates". The
  University of Auckland's and AUT's words do not change (#104).
- **Search on Tai Tokerau and Ardmore** no longer lists buildings under "Buildings with the most
  learning spaces": neither campus has any, so the list is empty again, as it was before #97 (#98).

## 2026-10-26

### Added

- **AUT World Model, at /aut/.** A second school on the site: the City Campus of Auckland
  University of Technology, in 3D on the LINZ ground among the city's buildings. Its 18 buildings
  come from OpenStreetMap, picked by their `operator` and `ref` tags, each one block at its
  OpenStreetMap height, else at a default, and labelled by its code and name. A building's card
  gives its code, name and height, says how the height was found, and links to its OpenStreetMap
  element. Floors, rooms, class times, semester dates and the course list are not shown: AUT
  publishes them, and the site shows them only with AUT's permission (its floor plans need a
  written agreement with MazeMap). The status strip, the time panel, the card and About say so in
  AUT's own words. Unofficial, with the project's own colours; nothing is taken from AUT (#97).

- **Old Choral Hall's range on Symonds Street drawn in detail.** Near Old Choral Hall (building
  104) the map now draws its south-west range from code, to sizes measured from the LiDAR survey:
  ten bays of red brick with cream dressings between two pavilions with giant columns in antis,
  rusticated pilasters and arched pediments, and the corner pavilion's face on Grafton Road. Every
  source shows the rest of the building during building works, so the rest keeps the map's
  estimated block: two storeys, flat-topped, plain walls. On the map it all has the map's colours.
  From a walker's height the range is drawn in brick and cream render, with glass and grey roofs, on
  a computer with a graphics card, and in the map's colours on phones and on computers without one.
  Its block still answers a click and opens on its floors. About now names brick and painted render
  among the landmarks' materials, and says that a building under works is drawn in detail only
  where the photographs show it as it stands (#88).

- **The General Library drawn in detail.** Near the General Library (building 109) the map now
  draws it from code, to sizes measured from the LiDAR survey: the tower slab with its ribbon
  windows floor by floor, the core and stair tower, the podium with its screens of white fins under
  a crown of folded hoods, the brick plinth on Alfred Street, the grey piers of the south-east end,
  and the glass canopy. On the map it has the map's colours. From a walker's height it is drawn in
  white concrete, brick, grey and glass on a computer with a graphics card, and in the map's colours
  on phones and on computers without one. It was checked against the LiDAR from above and against
  twelve Street View panoramas, which see its front, its two ends and its back wing's north-east
  side; the faces they do not show are drawn plain or after the faces they do show, and the south-east end is simpler than in the photographs. Its
  block still answers a click and opens on its floors. About now names brick and concrete among the
  landmarks' materials, and says that what no photograph shows is drawn plainly or after the parts that are shown (#80).

- **Maclaurin Chapel drawn in detail.** Near the camera the map draws Maclaurin Chapel (107) from
  code in place of its block: the white hexagonal chapel with its great corner window, its low green
  roof and slender spire, the bay beside it and the hall behind it, every height measured from the
  LINZ 2024 LiDAR. On the map it has the map's colours; from a walker's height on a computer with a
  graphics card, its own white walls, glass and light green metal roof. The small room beyond the
  bay, which a tree hides in the LiDAR and in every photograph, is drawn plainly, and so are the
  faces that the Street View photographs from Princes Street do not show. A click still opens its
  floors (#92).

### Fixed

- **Rooms on blank floors could be found in the search.** Floors where people live and childcare
  centres are left blank, but 95 codes of unnamed rooms on them were still in the search and put a
  pin on the blank floor: 59 on floors where people live, in 12 buildings, and 36 in the four childcare
  centres. The data build now leaves them out of the search, and a code typed for such a floor is
  placed in its building only, with no pin and no floor, and the search and the room card say why
  (#84).

## 2026-10-23

### Added

- **Measured massings.** Near the camera, five plain buildings of the City Campus are drawn from
  the LINZ 2024 LiDAR in place of their blocks: 113, 114 Building 114, 409 Security, 433 Fine Arts
  Studio Block 433 and 435 58 Symonds Street.
  A program measures their layers and roofs (flat, or sloping planes); their walls, storeys and
  windows are drawn by rule in their blocks' own colours, and a click still opens their floors.
  The building card and About name them. The other 43 small buildings in the LiDAR keep their
  blocks, among them every place where people live and every childcare centre, each with its
  reason (`landmarks/measured/exclusions.json`) (#79).

- **Old Government House drawn in detail.** Near Old Government House (building 102) the map now
  draws it from code, to sizes measured from the LiDAR survey: its two storeys and the ranges
  behind, the low hipped roofs on bracketed eaves, the chimneys, the bay, the balconies and the
  porch. On the map it has the map's colours. From a walker's height it is drawn in painted
  weatherboards with ochre trim, glass and pale roofs on a computer with a graphics card, and in the
  map's colours on phones and on computers without one. Trees hide it from all but two Street View
  panoramas, which see the upper storey of its south-east end, so its shape was checked against the
  LiDAR from above. Its block still answers a click and opens on its floors, and
  the two floors where people live stay blank. About now says the landmarks are drawn in their own
  materials (#75).

## 2026-10-22

### Changed

- **The Clock Tower on older Firefox.** Firefox 93 to 113 now show the blocks of buildings 105 and
  105S in place of the Clock Tower drawn in detail: the code that draws it now runs as a module
  worker, which Firefox has since version 114; the page itself already needs Chrome 94, Safari 16.4
  and Firefox 93 (#68).

### Fixed

- **A childcare centre's floor was drawn.** The ground floor of building 841, Nicholls Lane ECE
  (an early childhood education centre), showed 22 shapes of its spaces, unnamed. Childcare centres
  are left blank, and the data build now knows them by "ECE" as well as by "Early Childhood" and
  "Kōhanga Reo": its floor is blank, and its bar says it is a childcare centre (#69).

## 2026-10-21

### Added

- **The Clock Tower drawn in detail.** Near the Clock Tower the map now draws the building as it
  is, from code: the tower with its clock and pinnacles, the gabled pavilions, the windows and the
  long ranges either side, to sizes measured from a LiDAR survey. On the map it has the map's
  colours, and it lights up under the pointer and after dark as every other building does. From a
  walker's height it is drawn in stone, glass and slate on a computer with a graphics card, and in
  the map's colours on phones and on computers without one. It stands in place of the blocks of
  buildings 105 and 105S (its south range), which still answer a click and open on their floors.
  Further away nothing changes, and nothing of it is loaded. About and the building bar say which
  buildings are drawn in detail, and that the heights of the others are estimated from their
  floors (#66).

## 2026-10-19

### Fixed

- **On a slow screen a still walker view was drawn again and again.** Where a frame of the walker
  view took a second or more to draw, as with a software renderer, the view was drawn about once a
  second while nothing in it moved, and the computer was kept busy for nothing. It is now drawn
  once, as on a fast screen (#62).

## 2026-10-18

### Added

- **The walker's views at street level.** Seen from behind a walker or through its eyes, the
  campus is now drawn to look as near the real thing as the map allows, all by rule from what the
  sources already give: a sky lit from the real sun, with stars and a moon by night, haze, an
  exposure that follows the sun and the weather, ambient occlusion and a gentle bloom; every
  building, the University's and the city's, with storeys, windows in a recess, glass that reflects
  the sky, walls of plaster, brick, concrete, stone, glass or weatherboard chosen by where it
  stands, and a slowly changing pattern of lit rooms after dark; the ground as asphalt with lane
  lines, kerbs, paved footpaths, steps, rails, lawn and bare earth, and water with a reflection, all
  wet and glossy in rain; and trees with bark, leaves and a sway in the breeze. No doors, crossings,
  signs or lamps: none are mapped. The map view is unchanged. A software renderer
  or a phone gets the same sky and light without the effects. About says what is drawn by rule (#50).

### Fixed

- **On a slow screen the view stayed where a finger had turned it.** Walked on with the stick or
  the keys, the view comes back round behind the walker, as in a game. Where a frame of the walker
  view took a second or more to draw, as with a software renderer, it did not come round at all. It
  now comes round by the clock, however long a frame takes (#61).

### Documents

- The street-look skill, for giving the walker views their street look in another school's world
  model, or tuning or checking it here: what each layer draws and from what, the contract that
  keeps the map unchanged, and the checks (#57).

## 2026-10-17

### Added

- **A walker on the map.** "Take a walk" puts a small made-up person near the Clock Tower, to walk
  with the keyboard or the arrows on a phone. Its body, which walks, runs and stands at ease, is
  Quaternius's "Animated Human", given to the public domain (CC0). Its walks keep round the
  buildings, water and tree trunks and to OpenStreetMap's paths and streets, and end beside a
  building's nearest wall, as doors are not mapped. It goes into a building at street level, takes
  the nearest stairs or lift, and walks to a room keeping to corridors where it can, the building
  view following it. It can wander on its own from building to building. It is seen from above, from
  behind or through its eyes, says things in a bubble that other walkers near it hear, and opens an
  umbrella when Open-Meteo reports rain. Every walker looks the same: a student in a long-sleeved
  top and trainers, with a backpack on both shoulders, with nothing meant to mark a sex or a gender.
  Behind it, the camera stops in front of a wall, and where a building or a tree hides it, its shape
  shows through. Claude Code and other agents steer it with `npm run walker`, an MCP server or the
  `campus-walker` skill, all on the user's own computer (#40).

### Changed

- **The map has the screen.** The panel in the bottom-left corner (the term, the campuses, Take a
  walk and Other worlds) starts shut, as a small button with the campus's name, and opens when it
  is clicked or tapped; choosing a campus, opening a building, taking a walk or Escape shuts it
  again. On a phone or tablet a walk is steered as in a game: a stick in the bottom-left corner
  walks and turns the walker under the left thumb, the other thumb drags the view round, and as it
  walks the view comes back round behind it. The walk starts from behind the walker there; its
  panel is a slim bar under the top bar, with walking to a place and wandering behind a "⋯" button,
  and the ways into and out of a building are buttons in the bottom-right corner, above the
  building's card. Before, on a phone, the panel and its arrows covered half the screen and the
  floor list. A phone held sideways gets the same, and the top bar, the stick and the buttons keep
  clear of a notch (#47).
- **The walk folds away on a phone too.** On a touch screen the walker's bar (where it is, Map,
  Behind and Eyes) starts folded into a small "Walker" button under the top bar, and opens when
  tapped; its ⌃ folds it again. Each walk starts folded, and the panel opens by itself to say what
  went wrong when a way in or out fails (#49).

### Fixed

- **A link to a walk could open without the walker.** Opened in a tab in the background, or
  wherever the page was slow to draw its first frame, a link with `walk=1` showed the map with no
  walker, and the address lost `walk=1` and `view=`. The walk now starts once the map and its data
  are both in, in whichever order they come, and until then the address goes on asking for it (#48).
- **A walker's name stayed on the map after the walk.** Closing the walk, or an agent taking the
  last walker away, left the walker's name, and anything it was saying, where it had stood, over the
  building names round it, until something else redrew the labels. They now go with the last
  walker (#46).
- **About said the site has no analytics.** At campusworldmodel.com, Cloudflare, which serves the
  site, has counted page views and visits with its Web Analytics since the domain was set up. About
  now says so, and what it does not record (#45).

## 2026-10-15

### Added

- **Every campus on the map.** 55 more buildings, at Tai Tokerau, Tai Tonga, Leigh, Waiheke, Ardmore
  and 18 Carrick Place, each standing in OpenStreetMap surroundings of its own: 194 buildings in
  all, up from 139. Pick one from "Other campuses…" and the camera jumps there (#23).
- **The ground's real heights,** from the LINZ 8 m elevation model. The City Campus stands on its
  ridge above Grafton Gully, and buildings, streets, parks and trees stand on the ground. The
  attribution line credits LINZ (#27).
- **The real sun, the current weather and the seasons.** The sun stands where it does at the date
  and time shown. In Now mode the cloud, rain and fog follow Open-Meteo's current weather. The 21
  trees that OpenStreetMap tags as deciduous turn in autumn and stand bare in winter (#22).
- **Floors under the ground, seen through it.** In a building, the floors below the one at street
  level lie under the ground, and the floor list draws the ground as a dashed line between them.
  Open one and the ground turns see-through over it (#32).
- **Signs on the floor plan** for stairs, lifts, toilets, accessible toilets and showers. A room
  found by its code outlines the shape it stands on, and its card shows that shape's type (#21).

### Changed

- **A building opens on the floor at street level,** the one a visitor walks in on, and that floor
  stands on the ground. Before, a building opened on its lowest floor with learning spaces, and the
  whole building was lifted so that its lowest floor stood on the ground (#32).

### Fixed

- **The Southern Underpass stood on Symonds Street.** Building 331 runs under the street, but the
  campus map draws its ground floor as its two stairways joined by a strip about 0.1 m wide, and
  that strip stood across the road as a storey with windows, over a footing as long as the passage.
  A strip of floor no thicker than a wall is no longer drawn as a storey (13 buildings, under 5 m²
  from any one floor), and a footing goes only under what stands on the ground (#31).
- **Opened, the Southern Underpass's ground floor still had its strip,** running down Symonds
  Street as a slab, and no outer walls, not even round its stairways. Building view now leaves
  such strips out too (15 floors in 13 buildings). In all, 40 floors had no outer walls when opened:
  their outline could not be inset, and the thin walls meant to stand in were never drawn. 14 now
  have walls with windows and 26 the thin ones (#33).
- **About had the far campuses' error the wrong way round.** Shapes at Tai Tokerau are drawn about
  1.4% narrower east to west than they are, not 1% wider (#30).

### Documents

- The porting skill and `PROGRESS.md` caught up with the work of 14 and 15 October (#28).
- This changelog, and a "What's new" section at the top of the README, which is also laid out
  afresh with its text unchanged (#29).
- The README's pictures retaken from the live site, on the ground's heights and with every campus,
  and its counts brought up to date: 14,862 other spaces, 98 bare floors and 35 partly drawn
  (#30).
- Every pull request says how it was made: the model, the harness with its version and the
  thinking effort. The form asks for them and CI checks they are given (#34).
- Ready for other contributors and their agents: only the maintainer rebuilds `public/data/`, and
  a fresh clone is told why; `PROGRESS.md` says who "the user" is; the end-to-end tests suit macOS
  and Linux; the research browser keeps to one request a second and the hosts being studied (#37).

## 2026-10-14

### Added

- **Every space on a floor shows its type.** The shapes a floor plan draws without a name take the
  campus map's type, tinted by group: office, other lab, toilet or shower, stairs or lift, service,
  learning space not listed, other area. A legend lists the groups on the open floor, and pointing
  at a shape shows the type in the campus map's own words (#20).
- **Rooms stand as walls on their outlines.** In building view the facade, with its windows, stays
  below the open floor, and the camera frames the floor to fill the screen (#17, #18, which reached
  `main` through #19).
- **Floors the campus map leaves bare are marked.** 96 floors with nothing drawn and 34 with only a
  few spaces are marked in the floor list, and the building bar says so (#16).
- **Other worlds.** A link to the Tsinghua World Model, the project that inspired this one, with a
  2.2-second flight through space on the way. About and the README credit it (#8, #9).
- A GitHub button beside About, linking to the source code (#7).

### Changed

- **Buildings read as buildings:**
  - roofs have a colour of their own (#10);
  - floors that are alike are drawn as one block, 471 blocks down to 303 (#11);
  - a rim runs round every roof in the open, and edges are firmer (#12);
  - walls have storeys and windows, with a darker ground storey (#13);
  - trees have a crown and a trunk, and streets have an edge; the README pictures are new (#14).

### Documents

- The porting skill caught up with the look, the other worlds and what CI taught (#15).

## 2026-10-13

### Added

- **First release.** It has:
  - a 3D City, Grafton and Newmarket campus from the University's public campus map and
    OpenStreetMap;
  - a cut-away view of each building, floor by floor, with its learning spaces;
  - search for room codes, buildings and subject codes;
  - "Now" and "Preview" with the 2026 academic calendar;
  - day and night lighting, with the current temperature from Open-Meteo;
  - About with every source and its licence, and a phone layout;
  - unit and end-to-end tests, and publishing to GitHub Pages.
- **The rest of each floor** is drawn as plain shapes without names: 14,508 shapes on 490 floors
  (#3).
- **Each building is stacked floor by floor** from the campus map's outlines, so podiums, towers,
  setbacks and courtyards show (#4).
- **The city round the campus** is drawn with OpenStreetMap's building parts and roof shapes, with
  the Sky Tower at its full height (#5).
- A second copy of the site at <https://campusworldmodel.com/uoa/>. The repository is renamed
  `campus-world-model`.
- The porting skill, for taking the project to another university.

### Fixed

- Nine floors whose outline on the campus map belongs to another building are now drawn over their
  own building's footprint, and the building bar says so (#2).

### Documents

- `AGENTS.md`, `docs/standards.md`, `CONTRIBUTING.md` and the issue and pull-request forms: the rules
  and checks every change follows. A deploy now waits for the end-to-end tests (#1).
- The porting skill caught up, and the decision that a University building takes its shape from the
  campus map alone is recorded (#6).
