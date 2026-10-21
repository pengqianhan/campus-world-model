# Brief: the lead

The lead works in `landmarks/<name>/`. It is the session that talks to the person, prepares the round and runs it. It writes no part
of the model during a round; it keeps the agents apart, carries facts between them, holds the budget
and closes the round. In round 1 the lead was the same Claude Code session the person was working in.

## Before the round
1. Measure the building from the LiDAR (`./run.sh data`): frame, plan extents, heights. Put the sizes
   every part shares in `src/parts/common.js`.
2. Collect the references (`./run.sh refs`): Street View views with the camera that took each one.
3. Draw a first, rough model yourself and split it into parts, one file per part, so that agents can
   work side by side without touching each other's files (`src/clocktower.js` assembles them, and a
   part that throws is logged and left out).
4. Write `docs/CONTRACT.md` (frame, ownership, how to render and compare, budget, rules) and
   `docs/ART_BIBLE.md` (what the building and the light look like; what must never happen).
5. Make the compare tool work (`tools/compare.mjs`) and keep a baseline render (`out/lead/baseline/`).
6. Commit: that commit is what every agent starts from and what their before strips show.

## During the round
- Send each agent its brief (`briefs/<name>.md`), all at once, in the background.
- Read their interim results and pass on what one agent finds that another needs. Keep each note
  short, factual and with numbers. The notes sent in round 1 are below, as examples.
- Hold the budget: measure the whole building and tell an agent when its share is over.
- If the run stops (a usage limit, a crash), resume each agent with a note to re-read its files first:
  other agents kept editing meanwhile.

## After the round
1. Read every report. Move measured sizes the agents reported into `common.js` (only the lead edits it).
2. `./run.sh refine compare`; check that no part fails and the metrics went the right way.
3. Look at the strips yourself, then commit with a message that says what changed.
4. Tell the person what got better, what did not, and what the next round should do.

## The notes the lead sent during round 1
- **to pipeline** (05:01 UTC): Resume your pipeline task from where you stopped: the API limit that interrupted you has reset. Re-check the current state of your files first (other agents kept editing src/ meanwhile), then carry on and finish with your report.
- **to tower** (05:01 UTC): Resume your tower task from where you stopped: the API limit that interrupted you has reset. Re-read src/parts/tower.js and src/gothic.js first (gothic.js may have changed meanwhile), then carry on and finish with your report.
- **to centre** (05:01 UTC): Resume your centre task from where you stopped: the API limit that interrupted you has reset. Re-read src/parts/centre.js and src/gothic.js first (gothic.js may have changed meanwhile), then carry on and finish with your report.
- **to facade** (05:01 UTC): Resume your facade task from where you stopped: the API limit that interrupted you has reset. Re-read src/gothic.js and your part files first, check that every part still builds (no "part <name> failed" in the console), then carry on and finish with your report.
- **to look** (05:01 UTC): Resume your look task from where you stopped: the API limit that interrupted you has reset. Re-read src/main.js and src/textures.js first, then carry on and finish with your report.
- **to look** (05:07 UTC): Lead note from the pipeline agent's final measurements, for your light work: render shadows are far darker than the photos (building-region p02 about 15–25 vs about 90 in the references), and the views from the west (ppNz, -qoa, EX9) render very dark (p50 27–103 vs ~150). `tools/metrics.py` now writes per-view luma percentiles in each compare folder (`metrics.md`), and `refs/streetview/views_refined.json` holds refined cameras that `compare.mjs` uses automatically; your `tools/look_measure.py` still reads `views.json`, so switch it to `views_refined.json` when present.
- **to tower** (05:07 UTC): Lead note: the whole building now renders about 1.07M triangles and 69 draw calls, well over the contract budget (~400k / ~60). Please check your part's share and bring the tower to ≤ ~150k triangles as the contract says (e.g. fewer segments on crockets and pinnacles, instancing repeated pieces), and give the final number in your report.
- **to centre** (05:07 UTC): Lead note: the whole building now renders about 1.07M triangles and 69 draw calls, well over the contract budget (~400k / ~60). Please check your part's share and keep the centre ≤ ~100k triangles as the contract says, and give the final number in your report.
- **to facade** (05:07 UTC): Lead note: the whole building now renders about 1.07M triangles and 69 draw calls, well over the contract budget (~400k / ~60). addWindow is called ~100 times, so its per-window cost multiplies: please check it and keep pavilions + ranges ≤ ~120k triangles, and give the final numbers (including addWindow's triangles per call) in your report.
- **to look** (05:09 UTC): Lead note, two things for you. (1) Please add a matte near-black material named `void` (no metalness, rough, very dark warm grey, not pure black) for the dark interiors behind openings; the tower agent uses `iron` there for now and will switch. (2) The building parts themselves are only ~145k triangles (tower 60k, centre 21k, pavilions 31k, ranges 33k, from `node tools/tower_count.mjs <part>`); the ~1.07M from renderer.info comes from shadow passes and the landscape/trees. Please bring the landscape within its budget (≤ ~150k triangles, ≤ ~20 draw calls) and keep the shadow caster set modest (e.g. trees and small props need not cast into the high-res map). Report final numbers.
- **to facade** (05:10 UTC): Lead note with the centre agent's LiDAR/photo measurements that touch your pavilions: (1) the right pavilion's inner side wall is at x ≈ +5.2 (common.js says 6.0), the left one's at −6.55; (2) pavilion fronts are at z ≈ 17.3 (left) and 17.9 (right), slightly off square, vs PAV_FRONT 17.0; (3) in the photos the pavilion plinth course sits about 2.6–2.8 m above the door's ground, not 1.1 m — please check. I will update common.js after you finish; meanwhile use local constants if you need the corrected values. Also: centre_kit.js has `tudor`, `loft`, `faceFrame`, `pendant` that could move into gothic.js — mention in your report whether you'd adopt them, don't do it now.
- **to look** (05:17 UTC): Lead note from the facade agent: the shared window kit (`addWindow` in gothic.js) now draws dark glazing bars aligned to each pane by default (`bars` option). Your glass shader also draws its own light-coloured bar grid in world space, which doesn't line up with the panes — please drop that grid (or make it optional, off by default) and keep the glass to reflections and interior hints. Also note `reveal` default is now 0.3 and glass is drawn pane by pane, set deeper.
