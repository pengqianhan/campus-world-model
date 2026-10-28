# Lincoln University (Lincoln): public campus data

Recon for a possible port, done on 2026-10-25 (New Zealand time) by the method in
[RECON.md](../../.claude/skills/campus-world-model/RECON.md). It records what Lincoln publishes
without a sign-in, and on what terms. Nothing here is on the site yet. No fetch script and no data
file comes with it.

Path name if the school is added: `/lincoln/` ("Decisions" in `PROGRESS.md`: each school's own
short name; Lincoln's web domain is `lincoln.ac.nz`). Time zone: Pacific/Auckland.

On 2026-10-28 the loop took the campus's OpenStreetMap snapshot and the ground under it ("The
OpenStreetMap check", below). Lincoln is not on the site: OpenStreetMap's tags do not pick out
enough of its buildings, and the maintainer chooses the next step.

## Verdicts

| Layer | Verdict | What decided it |
| --- | --- | --- |
| 1. Footprints and surroundings | needs the maintainer: not checked here | No Overpass request was made (the brief for this recon forbids it). RECON.md calls OpenStreetMap usable everywhere under ODbL. The repository's seven areas are all for the University of Auckland, so the Lincoln campus needs a new area, fetched by `scripts/fetch-osm.ts` ("Needs the maintainer", 6) |
| 2. Indoor: buildings, floors, rooms | needs the maintainer | The campus map page and the campus map PDFs are on `www.lincoln.ac.nz` (their addresses by web search only: not confirmed), which `robots.txt` closes to this reader (`User-agent: ClaudeBot`, `User-agent: anthropic-ai` and `User-agent: Claude-Web`, each with `Disallow: /`). None was requested. The Living Heritage host, which by web search only, not confirmed, keeps older campus maps, answered its `robots.txt` with 403 and was left alone. The timetable has a "Locations" view, but it opens only by a form post, which this recon did not send. The room booking app on the timetable host redirects to a sign-in. No source read gives a room code, a room outline or a room position |
| 3. Timetable | needs the maintainer | The Lincoln Timetable Viewer (`splus.lincoln.ac.nz/timetable/2026/`) is public: no sign-in, `robots.txt` 404. Its form lists 575 course offerings of 2026. A class's day, time and room come only after the form is posted ("View Timetable"), and this recon sent no form. The terms are on the closed host and were not read. Then the room booking app's sign-in redirect closed the host |
| 4. Academic calendar | needs the maintainer | The key-dates pages are on `www.lincoln.ac.nz` (closed). None was read. The timetable form gives the teaching weeks of Semester 1, Semester 2 and the January and November summer schools of 2026, as weeks with the date of each Monday. That is a partial calendar, not the key dates |
| 5. Subjects and courses | needs the maintainer | The course search is on `www.lincoln.ac.nz` (closed). The timetable form lists 575 offerings of 465 course codes under 45 subject prefixes, each offering with its teaching period, but no titles. The terms are not read |
| 6. Ground heights | needs the maintainer: not checked here | No layer-6 route was run. By web search only, not confirmed: LINZ lists "Canterbury - Selwyn LiDAR 1m DEM (2023)", and the open data catalogue has a 2015 DEM of the Christchurch and Selwyn survey (`catalogue.data.govt.nz/dataset/canterbury-christchurch-and-selwyn-lidar-1m-dem-20152`). Whether either covers the campus was not checked. The AWS Terrain Tiles were not tried ("Needs the maintainer", 7) |

One door decides most of this. Lincoln's main host, `www.lincoln.ac.nz`, holds its campus map, key
dates, course pages and legal page (their addresses by web search only: not confirmed). Its `robots.txt` has the groups `User-agent: ClaudeBot`,
`User-agent: anthropic-ai` and `User-agent: Claude-Web`, each with `Disallow: /`, in a section that
the file calls "Cloudflare Managed content". The research browser reads a group whose token is one
of Anthropic's agents as its own, and it blocked every path on the host. This recon sent that host
one request, its `robots.txt`, and nothing else. The timetable is on another host,
`splus.lincoln.ac.nz`, and answered openly. Its form lists 575 course offerings of 2026 (whether that is every one was not checked), but the
classes come only by a form post. So no layer is usable now. A port of Lincoln needs Lincoln's
answer first ("Needs the maintainer", 1).

## Campuses

No page that lists Lincoln's campuses was read: they are on the closed host. What the timetable
shows is marked "read"; the rest is by web search only, not confirmed.

| Place | Address (source) | Map or rooms seen | OpenStreetMap in the repo | LiDAR 1 m DEM |
| --- | --- | --- | --- | --- |
| Lincoln campus | By web search only, not confirmed: "Our 120ha campus environment is a lush, open environment located in the town of Lincoln, 20 kilometres from Christchurch" (a search result on the University's campus page); the international prospectus calls it the "Te Waihora campus"; the campus map PDF shows Ellesmere Junction Road and Springs Road at its edges | None read. The campus map page and PDFs are on the closed host | none: a new area | By web search only, not confirmed: "Canterbury - Selwyn LiDAR 1m DEM (2023)" |
| Online (read) | The timetable form: 38 of the 575 offerings have "Online", "online" or "ONLINE" in their name, for example `ACCT320_Semester_1_2026_Online` | not a place | — | — |
| Other teaching periods, read | The form names 3 offerings with `_Vintage`, for example `WINE398_Semester_1_2026_Vintage`. No page read says what it means or where those classes are | — | — | — |
| Telford, South Otago | By web search only, not confirmed: a news report says that Lincoln "intends transferring the operations of its Telford division" to another provider. Its status now was not found | not checked | — | — |

The timetable form has no campus field, so it does not say whether any class is away from the
Lincoln campus. Research farms and other sites were not checked.

Places to leave blank. By web search only, not confirmed: the campus map PDF shows accommodation,
and Living Heritage keeps a "Halls of Residence Campus Map" of 2008. Childcare was not checked. The
pages are on closed hosts, so this recon names none of these places. A build must find them in the
source and leave them blank.

## What the site could do

- **With the usable layers only:** nothing from Lincoln, because no layer is usable now. After the
  maintainer's Overpass run for a new area (layer 1), the site could show the Lincoln campus from
  OpenStreetMap, each building named only where OpenStreetMap names it. A building would be the
  finest place. No rooms, no classes, no calendar.
- **If Lincoln agrees to the use of its timetable (layer 3), and the maintainer accepts a fetch
  that posts the timetable form:** each class would have a course code and teaching period, an
  activity type and a stream number, a day, a time, its weeks, and a room. That is what the guide
  shows of a class: it names each activity by "Course code", "Session", "Activity Type" and
  "Activity number", and asks students to check the "times and room allocations". This recon did
  not see one class, so the form of a room name, and whether it names a building and a floor, is
  not known. The "Locations" view may list the rooms; it was not opened.
- **Floor and room outlines:** no source read publishes them. Whether the campus map page holds an
  interactive map with rooms is not known: a web search did not find one, and the page was not
  requested.

## The OpenStreetMap check (2026-10-28)

On 2026-10-27 the maintainer let the loop run `scripts/fetch-osm.ts` and `scripts/fetch-terrain.ts`
for every campus in the recon reports. The maintainer also decided that no request goes to any
Lincoln host. None went.

**How the box was set.** This report read no address. So the box was drawn before the fetch, about
1.3 km on every side of the point that two public pages give for "Lincoln University": LINZ's NZ
Topo Map entry (-43.6441, 172.4654) and Wikipedia (-43.6444, 172.4686), both found by web search.
No host was asked. The box is `[-43.6561, 172.4508, -43.6327, 172.4832]` (south, west, north, east),
2.6 km by 2.6 km. The snapshot's own data then placed the campus: west of Springs Road and south of
Ellesmere Junction Road, with Farm Road, Engineering Drive, South Drive and three service roads
named "Lincoln University service road" in it, and the meadow "Research Dairy Farm (Lincoln University)" north of
Ellesmere Junction Road. The campus buildings with a name or a tag that says Lincoln lie 463 m
(west) to 1,112 m (east) inside the box's edges. The box's west edge passes through a group of farm
buildings at the end of a "Lincoln University service road". The snapshot does not show what lies
west of it.

**What was fetched.** `osm/context-lincoln.json`: 4,029,505 bytes, 4,928 elements (1,780 building
ways, 3 building relations, 5 building parts), from `overpass-api.de`, OpenStreetMap base
2026-10-28 06:32 UTC, in **1 request**. The ground: 12 AWS terrain tiles at zoom 14, in **12
requests**. The `x-amz-meta-x-imagery-sources` header of each tile names LINZ's model only
(`nzlinz/lds-tile-qh.tif`).

**What the tags say,** counted in the snapshot:

- `operator=Lincoln University`: 2 buildings, the Recreation Centre (`building=university`) and a
  bicycle shed with no name.
- `building=university`: 12. 10 have a name: Ivey Hall, Memorial Hall (`disused=yes`, "closed
  following post-earthquake damage and assessment"), Hudson Hall, Forbes Building, James Stewart
  Building, Landscape Architecture Building, Young Farmers Club Hall, The Poplars, the Recreation
  Centre, and "AgResearch", another body's name ("Science building, replaced the earthquake-damaged
  Hilgendorf Wing").
- `amenity=university`: none. `fetch-osm.ts` does not ask Overpass for campus outlines, and no
  building has the tag.
- No other tag on a building names Lincoln University. Three service roads and the dairy farm's
  meadow do.
- 73 buildings have `operator=Bioeconomy Science Institute Maiangi Taiao`. They stand east of Springs
  Road, by Gerald Street: another body's buildings.

**The campus.** Here the campus is the buildings west of Springs Road, south of Ellesmere Junction
Road and north of latitude -43.6496, where the houses of the subdivisions to the south start. It
holds 163 buildings (144 `building=yes`, 12 `university`, 4 `greenhouse`, 1 `construction`, 1
`garages`, 1 `garage`). 41 have a name, with 29 different names. The tags above pick out 13 of the
163, and 10 of the 13 have a name. These have a name and no tag that says Lincoln: the Commerce
Building, Science South, the RFH Building ("Replacement For Hilgendorf"), Waimarie ("University
research building"), Te Kete Ika - Dining Hall, The Lodge, Orchard Hall, the Accomodation Office (so
written), the Field Research Centre (2 outlines), the New Zealand Cricket High Performance Centre,
The BHU Organics Trust and two sheds beside it, and the buildings named Colombo Hall (3), Stevens
Hall (4), Centennial Hall (5), Lowry Hall (3), Southland Hall and The Quarters round the
Accomodation Office. Their tags do not say whether people live in them. Many large buildings in the
middle of the campus have no name.

**Verdict.** The tags do not pick out enough of Lincoln's buildings for a campus map of the
University. They give 9 named University buildings (10 with "AgResearch"), and leave the Commerce
Building, Science South, the RFH Building and Waimarie as unnamed surroundings. So Lincoln is not
built yet. The snapshot and the ground are committed. The maintainer chooses how the University's
buildings are chosen, as for Waikato (#119).

## Layer 1: footprints and surroundings

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| The repository's areas | `scripts/lib/areas.ts` | read locally, no request | Seven areas, all for the University of Auckland. `central` is `[-36.8689, 174.7608, -36.8441, 174.7797]` (south, west, north, east). None covers Lincoln |
| Overpass | not requested | — | The brief forbids Overpass here. `scripts/fetch-osm.ts` is the route. The tags of Lincoln's buildings (`name`, `ref`, `building:levels`, `height`) were not read |
| Open data | web search for a Lincoln campus map on MazeMap, Concept3D or MapsIndoors | none found | — |

Licence for OpenStreetMap: ODbL, credit in About.

## Layer 2: indoor (buildings, floors, rooms)

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| Campus map page | `https://www.lincoln.ac.nz/life-at-lincoln/campus-map/map/` (web search) | not requested: `robots.txt`, `User-agent: ClaudeBot`, `Disallow: /` | Not seen. By web search only, not confirmed: it lists buildings and facilities by name; a search result did not show whether the map is interactive |
| Campus map PDFs | `https://www.lincoln.ac.nz/assets/LIN4419-Campus-Map-Update_Feb25-WEB.pdf` and `https://www.lincoln.ac.nz/assets/campus-map-update-june-25.pdf` (web search) | not requested: the same rule | Not seen. By web search only, not confirmed: buildings with grid references such as "C5", with accommodation, car parks, cafes, lecture rooms and sports grounds |
| A copy on another host | `https://kiwinet.org.nz/files/Events/Lincoln-University-Campus-Map.pdf` (web search) | not requested | By web search only, not confirmed: a copy of a file of the closed host. Reading it would go round that host's `robots.txt` |
| Older campus maps | `https://livingheritage.lincoln.ac.nz/nodes/view/10768` ("Maps and Plans", web search) | its `robots.txt` answered 403; `polite.mjs` closed the host, and the page was not requested | Not seen. By web search only, not confirmed: campus maps of 2014, 2018 and later years |
| Room directory: the timetable's "Locations" view | `https://splus.lincoln.ac.nz/timetable/2026/` | the view opens by `__doPostBack('LinkBtn_locations','')`, a post of the page's form: not sent | Not seen. By the tab's name, a list of teaching spaces |
| Room booking | `https://splus.lincoln.ac.nz/WRBEven/` (from the host's start page, below) | 302 to `/WRBEven/Login.aspx?ReturnUrl=%2fWRBEven%2fbook.aspx`; `polite.mjs` blocked that hop and closed the host ("closed: sign-in redirect") | Not seen: a sign-in |
| Floor-plan PDFs | none found | — | — |

Without a readable source of rooms, the building view could show only OpenStreetMap's buildings.

## Layer 3: timetable

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| Timetable host: start page | `https://splus.lincoln.ac.nz/` | 200 `text/html`, 1,288 bytes, `Last-Modified` 2021-05-07 | A script that sends the browser to `https://splus.lincoln.ac.nz/timetable/<this year>/`. It sends a visitor who came by `roombook.lincoln.ac.nz` to `/WRBEven/` in an even year and `/WRBOdd/` in an odd year |
| Lincoln Timetable Viewer, 2026 | `https://splus.lincoln.ac.nz/timetable/2026/` | 200 `text/html; charset=utf-8`, 109,964 bytes | Title "Lincoln University Timetables - 2.0.39". An ASP.NET form, `method="post"`, with hidden `__VIEWSTATE` and `__EVENTVALIDATION` fields and the button "View Timetable". The list `dlObject` holds 575 course offerings: value such as `ACCT101-S2_1_P_25`, text such as `ACCT101_Semester_2_2026` (33 values are opaque codes that begin `#SPLUS`). `lbWeeks`: 59 choices ("This Week", "Next Week", 5 named periods, and weeks 1 to 52, each with its Monday, from "Week  1 (w/c 29 Dec 2025)" to "Week  52 (w/c 21 Dec 2026)"). `lbDays`: 8 choices. `dlPeriod`: "Day (8am - 6pm)", "Evening (6pm - Midnight)", "Day and Evening (7am - Midnight)". `dlType`: "Grid Timetable" and "List Timetable". Tabs "Courses", "Locations" and "Staff" by form post. The page says: "Your timetable may change - check regularly, especially before Week 2 of the semester." and "Classes after 1pm start 10 minutes after the hour." No copyright or terms text |
| Classes of a course | the form above, posted with "View Timetable" | not sent: a form post | Not seen. The host name `splus` and the report names in `dlType` (`cyon_reports_calendar_url`, `cyon_reports_list_url`) suggest a Scientia Syllabus Plus web timetable. That is an inference, not read on a page |
| Timetable guide | `https://splus.lincoln.ac.nz/timetable/2025/docs/Timetable%20Viewer%20Guide%20v3.0.pdf` (linked from the 2026 page as "Timetable PDF") | 200 `application/pdf`, 1,565,361 bytes, `Last-Modified` 2025-10-24, 9 pages | "LINCOLN TIMETABLE A Guide for Students". The steps: choose courses, weeks, days and a report type, then "Click on `View Timetable'". "You will notice that course codes on this page may look slightly different than in the website or LUCAS." Each activity is named by "Course code", "Session", "Activity Type" and "Activity number"; a stream is one of several choices, for example "LabA/01" or "Lab/02". A timetable can be downloaded "in excel". "The timetable may change leading up to the beginning of each semester so we recommend that you check your timetable regularly before classes start through to week 2 of semester to ensure you have correct times and room allocations." The pictures of a timetable were not read |
| Staff view | the tab "Staff" | not sent: a form post | Staff names, by the tab's name. Not wanted: places, not people |
| Student system and learning system | LUCAS and LEARN, named in the guide | not requested | Not seen. The guide only names them. Whether they need a sign-in was not checked |
| Video guides | two `https://lincoln.ap.panopto.com/Panopto/Pages/Viewer.aspx?id=...` links on the 2026 page | not requested | Videos, not data |
| Timetable support page | `https://www.lincoln.ac.nz/student-support/manage-your-study/timetable-support/` (linked from the 2026 page) | not requested: `robots.txt` | Not seen |
| Published files: ICS, CSV | none found | — | The guide's Excel download comes after the form post |
| Official API documentation | web search | none found | — |
| Earlier student projects | four GitHub repository searches through the GitHub API ("lincoln university timetable", "splus.lincoln.ac.nz", "lincoln university nz course planner", "lincoln timetable nz": 0 results each) and one code search for `"splus.lincoln.ac.nz"` | 3 files in one repository, all templates named `*_dashboard.html` in a placement system | Not read. Their paths name dashboard templates; what they do with the host was not checked |

Precision, if Lincoln agrees: not known until one class is seen. The form's lists are multiple
choice, so one post can ask for several courses. How many posts a full build needs was not tested.

## Layer 4: academic calendar

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| 2026 academic key dates | `https://www.lincoln.ac.nz/study/key-dates-2/2026-academic-key-dates` (web search) | not requested: `robots.txt` | Not seen. By web search only, not confirmed: Semester 2 lectures start on Monday 13 July 2026 |
| Key dates | `https://www.lincoln.ac.nz/study/key-dates/` (web search) | not requested: `robots.txt` | Not seen |
| The timetable's teaching weeks | `https://splus.lincoln.ac.nz/timetable/2026/` (layer 3) | read | The named periods of `lbWeeks`, by week number: "Semester 1" weeks 8 to 13 and 17 to 22; "Semester 2" weeks 29 to 34 and 37 to 42; "January Summer School" weeks 2 to 6; "November Summer School" and "Full Summer School" weeks 46 to 50. By the week labels: week 8 is "w/c 16 Feb 2026", week 13 "w/c 23 Mar 2026", week 17 "w/c 20 Apr 2026", week 22 "w/c 25 May 2026", week 29 "w/c 13 Jul 2026", week 34 "w/c 17 Aug 2026", week 37 "w/c 07 Sep 2026", week 42 "w/c 12 Oct 2026", week 46 "w/c 09 Nov 2026" and week 50 "w/c 07 Dec 2026". These are teaching weeks, not the key dates: no exams, no holidays |

Transcribe the key-dates page by hand into `data/<id>/academic-calendar.json` only after Lincoln agrees
("Needs the maintainer", 1).

## Layer 5: subjects and courses

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| Course search | `https://www.lincoln.ac.nz/study/courses-2/course-search/` (web search) | not requested: `robots.txt` | Not seen. By web search only, not confirmed: a page for each course, with its title, semesters, credits and fees |
| Sitemap | `https://www.lincoln.ac.nz/sitemap.xml` (named in `robots.txt`) | not requested: `robots.txt` | Not seen |
| The timetable's course list | `https://splus.lincoln.ac.nz/timetable/2026/` (layer 3) | read | 575 offerings, 465 course codes (four letters and three digits, such as `ACCT101`; 10 offerings have the three letters `EAP` and three digits), 45 subject prefixes from `ACCT` to `WINE`. By the text after the code: 214 "Semester_1_2026", 224 "Semester_2_2026", 36 "Jan-Feb_2026", 26 "Nov-Dec_2026", 10 "2026", 19 "Semester_1_2026_Online", 16 "Semester_2_2026_Online", and the rest in other forms. No titles |

The timetable's codes would let Search know a course code. Without titles, they are a list of codes
only. The guide says these codes "may look slightly different than in the website or LUCAS".

## Layer 6: ground heights

| Route | URL | Answer (2026-10-25) | What it holds |
| --- | --- | --- | --- |
| AWS Terrain Tiles (the repository's own route) | not requested | — | This recon asked only Lincoln's hosts, besides five searches of GitHub's API (see layer 3). `scripts/fetch-terrain.ts` over the campus would show the tiles' source header |
| LINZ elevation catalogue | not requested | — | By web search only, not confirmed: "Canterbury - Selwyn LiDAR 1m DEM (2023)" (named on LINZ's page about crediting elevation data; captured between 24 March and 4 May 2023, by a search result), and a 2015 DEM of the Christchurch and Selwyn survey (`catalogue.data.govt.nz/dataset/canterbury-christchurch-and-selwyn-lidar-1m-dem-20152`) |

Not checked: whether these capture areas hold the campus; their licences; two known heights on the
campus; pits where land meets water (RECON.md, layer 6). A 1 m DEM needs a new dependency for
LERC-compressed GeoTIFFs, a gate (`PROGRESS.md`, "Ideas still open", 2).

## robots.txt and terms

| Host | robots.txt (2026-10-25) | Terms |
| --- | --- | --- |
| `www.lincoln.ac.nz` | 200, 2,851 bytes, 140 lines, read by `polite.mjs` (which does not record the content type). It begins "# As a condition of accessing this website, you agree to abide by the following" / "# content signals:". 35 groups (36 `User-agent:` lines). Between "# BEGIN Cloudflare Managed content" and "# END Cloudflare Managed Content": `User-agent: *` with `Content-Signal: search=yes,ai-train=no,use=reference` and `Allow: /`, then 31 groups under "# Training crawlers" with `Disallow: /`, among them `User-agent: ClaudeBot`, `User-agent: anthropic-ai` and `User-agent: Claude-Web`. After it: `User-agent: *` with `Disallow: /admin` and `Disallow: /Security/`; `Sitemap: https://www.lincoln.ac.nz/sitemap.xml`; `User-agent: AhrefsBot` with `Crawl-delay: 60`; `User-agent: Swiftbot` with `Crawl-delay: 2`. The file defines `ai-input` as "inputting content into one or more AI models (e.g., retrieval" / "augmented generation, grounding, or other real-time taking of content for" / "generative AI search answers)"; the `*` group gives no `ai-input` signal | `https://www.lincoln.ac.nz/about-us/legal-information/`: not requested, `robots.txt`. By web search only, not confirmed: a search result gives its sentence "Material on the Lincoln University website may not be copied, distributed, or used for commercial purposes without the prior, express written permission of Lincoln University." |
| `splus.lincoln.ac.nz` | 404: every path allowed | No terms page on the host, and no terms text on the timetable page. Its "Website" link goes to the timetable support page on the closed host |
| `livingheritage.lincoln.ac.nz` | 403: `polite.mjs` closed the host | Not read. By web search only, not confirmed: its pages say "This work is licensed under a Creative Commons Attribution 3.0 New Zealand License" |
| `roombook.lincoln.ac.nz`, `timetable.lincoln.ac.nz` | not requested | Named in the start page's script, which sends both to `splus.lincoln.ac.nz` |
| `lincoln.ap.panopto.com`, `kiwinet.org.nz`, `blogs.lincoln.ac.nz` | not requested | — |
| `overpass-api.de`, `s3.amazonaws.com`, `nz-elevation.s3.ap-southeast-2.amazonaws.com` | not requested | ODbL for OpenStreetMap; LINZ licences not checked |

The legal page could not be read before any content, as the brief asks, because it is on the closed
host. The timetable host has no terms of its own. By the web-search result, the legal page's
sentence covers "the Lincoln University website". Whether that covers the timetable host, and
whether the closed groups of `www.lincoln.ac.nz` express a wish that holds for Lincoln's other
hosts too, is for Lincoln to say. With the terms unread and, by web search, restrictive, this recon
kept no raw data: counts and conclusions only (see "Request log").

## Needs the maintainer

1. **Ask Lincoln whether the project may use its pages and data.** Lincoln's `robots.txt` closes
   `www.lincoln.ac.nz` to `ClaudeBot`, `anthropic-ai` and `Claude-Web`, and says "As a condition of
   accessing this website, you agree to abide by the following content signals". That host holds
   the campus map, the map PDFs, the key dates, the course pages and the legal page. The same
   message can ask about the timetable (layer 3): whether a fetch may post its form for each
   teaching period, and whether its "Locations" view may be read. It can also ask for the campus
   map's data (buildings and rooms, with outlines or points), with credit and not for profit. A
   port of Lincoln waits on that answer. Only Lincoln can give it. The file names no contact.
2. **Terms not read.** The legal page is on the closed host. By web search only, not confirmed, it
   asks for written permission to copy or distribute. No layer of Lincoln's own data can be called
   usable before it is read.
3. **The timetable's classes need a form post.** The form is public and lists 575 offerings, but
   this recon sent no form, by its brief. Whether a fetch script through `snapshot.ts` may post it
   is the maintainer's decision (a fetch script asking a host for something new is a gate), after
   Lincoln's answer.
4. **Closed hosts, recorded once and left alone.** `splus.lincoln.ac.nz`: at 22:36:42 UTC on
   2026-10-24 (11:36 on 2026-10-25 in New Zealand) `/WRBEven/`, the room booking app, answered 302
   to its sign-in page; `polite.mjs` closed the host, and this recon asked nothing more of it.
   `livingheritage.lincoln.ac.nz`: at 22:37:16 UTC the same day its `robots.txt` answered 403;
   the host was closed. Both routes are left alone.
5. **Student systems, not requested:** LUCAS and LEARN, which the guide names. Whether they need a
   sign-in was not checked.
6. **Overpass for a new area.** Run `scripts/fetch-osm.ts` for the Lincoln campus, in the town of
   Lincoln, 20 km from Christchurch (by web search only, not confirmed). Not requested here, by the
   brief.
7. **Ground heights.** Run `scripts/fetch-terrain.ts` over the campus and read the tiles' source
   header. Read the capture areas and licences of "Canterbury - Selwyn LiDAR 1m DEM (2023)" and of
   the 2015 Christchurch and Selwyn DEM (both by web search only, not confirmed).
8. **Places to leave blank.** Before any room is named, list Lincoln's halls of residence and
   childcare from the source, so the build leaves them blank. Not checked here: the pages are on
   closed hosts.
9. **Hosts not asked.** `kiwinet.org.nz` serves, by web search, a copy of a Lincoln campus map PDF.
   It was not asked, because reading it would go round the closed host's `robots.txt`.

## Request log

Every request went through `scripts/research/polite.mjs` as it is on `main` (commit b6e5172, pull
request #86), from one scratch reader in 4 runs. Each run started one browser with
`politeLaunch()` and opened one polite page. `polite.mjs` asked each origin's `robots.txt` itself
before anything else, and blocked each path it disallows. In each run the page let only documents
and fetches through, loaded the host's `robots.txt` as its document (on `www` and `livingheritage`
the gate blocked that load), and read each URL by an in-page `fetch()` with `redirect: "manual"`.
No run loaded a page's scripts, and no form was posted. Web searches and five GitHub searches
through the GitHub API did not send a request to Lincoln's hosts, and are not in the log. UTC
2026-10-24 22:34:15 to 22:37:17 (2026-10-25 11:34 to 11:37 in New Zealand).

- **Sent:** 10, all GET. `splus.lincoln.ac.nz` 8, `www.lincoln.ac.nz` 1 (its `robots.txt`),
  `livingheritage.lincoln.ac.nz` 1 (its `robots.txt`). By type: 4 `robots.txt` asked by
  `polite.mjs`, 2 documents (the reader's own load of `/robots.txt` on `splus`), 4 fetches (the
  start page, the 2026 timetable page, the guide PDF and `/WRBEven/`). Answers: 4 × 200, 4 × 404
  (the four `robots.txt` asks on `splus`), 1 × 302 (`/WRBEven/`), 1 × 403 (the `livingheritage`
  `robots.txt`). Nothing was signed in to.
- **Blocked before leaving the machine:** 5. 1 to `www.lincoln.ac.nz` by `robots.txt`
  (`Disallow: /`, group `ClaudeBot`), 2 browser icon requests on `splus`, 1 redirect hop to the
  sign-in page `/WRBEven/Login.aspx` (closed: sign-in redirect), 1 to `livingheritage` after its
  403 (closed: 403). No cookie banner was seen, so none had to be refused.
- **Rate:** the shortest gap between two requests was 1.108 s, and no second held more than one.
- **Order:** each host's `robots.txt` was asked for before anything else was sent to it.
- **Disallowed path:** none sent.
- **401, 403 and sign-in walls:** one 403 (the `livingheritage` `robots.txt`) and one sign-in
  redirect (`/WRBEven/`), each closed its host and is recorded once in "Needs the maintainer", 4.

The raw answers stayed outside the repository and are not committed. The terms are unread and, by
web search, restrictive, so every saved answer was deleted from the scratch folder once the counts
above had been taken and checked. Only the request log (URL, time, status, type) is kept there.
