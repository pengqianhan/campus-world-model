---
name: landmark-from-code
description: "Draw one real campus building in three.js from code alone, sized by the LINZ LiDAR and checked against Street View photographs, by a lead agent and a team of agents in parallel. Use to make the next landmark like the Clock Tower in landmarks/clocktower/, to run another round on one, or to check one against its photographs."
argument-hint: "[new <building> | round <landmark> | check <landmark>]"
---

# A landmark drawn from code

A **landmark** is one real building drawn in detail, which the site draws in place of the building's
block once its config puts it on the site. Every mesh and texture is generated in code. The LiDAR gives its sizes. Street View photographs are the
references the model is compared with: they are never traced, sampled or published. The Clock Tower
(`landmarks/clocktower/`, October 2026) is the first one and the reference for this skill.

The work is done by a **lead** (you) and a team of **agents** that you start, each owning one part of
the model. [METHOD.md](METHOD.md) tells how the Clock Tower was made, with its numbers. The briefs
the agents were given are in [briefs/](briefs/).

## What binds the work

- **On the site once it says so.** A landmark lives in `landmarks/<name>/`. The site draws it in
  place of its buildings' blocks once its config says `"site": true` and `place` has written that
  into its `placement.json`; the site finds it there, with no list in `src/` to edit
  (`landmarks/README.md`, "On the site"). That pull request also adds a `CHANGELOG.md` line and a
  README "What's new" entry, checks About's words for the landmarks' materials (in
  `src/i18n/locales/`), and gives each new roof, pane or opening material its part in `LIGHT_ROLE`
  (`src/scene/landmarks.ts`), or the map draws it in the wall colour. It also names the building in
  the README's "Known limitations" and in the sources table's "Used for" for the LiDAR and Street
  View, and gives a look at it on the map and from a walker's height and the speed numbers
  (`docs/standards.md`, check 9). Taking one off the site changes the same lines. Every merge is a release, so
  set it when the person wants it shown, in a pull request of its own.
- **Fetches through `snapshot.ts`.** The `data` and `refs` stages fetch through
  `scripts/lib/snapshot.ts` (`landmarks/README.md`, "Fetching"): only the LINZ buckets and Street
  View calls it lets through, each cached once in `data/raw/landmarks/` and logged in
  `data/sources.json`. A LiDAR or aerial set it does not list is a new data source: ask first.
- **Shared kit and pipeline.** `landmarks/kit/` (what every model is built with) and
  `landmarks/pipeline/` (`run.sh`, the tools, the viewer) serve every landmark; a new landmark's
  model, config and placement are its own folder (what else going on the site needs: the first
  point above). A change to them adds options with defaults and leaves the other landmarks'
  pictures identical: compare the viewer's `?quality=low` and `?mask=1` screenshots before and after.
- **References only.** Street View imagery and metadata are Google's: they stay in the gitignored
  `data/raw/landmarks/streetview/` and the landmark's `refs/` and `out/`, and no picture of them
  goes into a commit, an issue or a pull request. People and cars in them are not part of the model.
- **Billed tiles.** Street View tiles cost money past the free monthly quota. The pipeline buys none
  unless `ALLOW_FETCH=1` is given and the ledger in `GMAPS_BUDGET` allows them; the key lives in
  `$GOOGLE_MAPS_KEY` or `~/.gmaps_key`.
- **One writer per file.** Each agent edits only the files it owns. The lead commits.
- **Measure, don't guess**, and **a budget**: the rules in the landmark's `docs/CONTRACT.md`.

## Steps

A new landmark is steps 1 to 5. Another round on a landmark is steps 3 to 5. A check is step 4.

1. **Measure and collect.** Make `landmarks/<name>/` with `config/<name>.json`
   (`landmarks/README.md`, "Another building"). Run `landmarks/pipeline/run.sh <name> data`, then
   `ALLOW_FETCH=1 landmarks/pipeline/run.sh <name> refs` once with the person's agreement on the
   cost. Pin the panoramas you keep in `streetview.pano_ids`.
   Done when the plan, elevation and heightmap figures in `data/` show the building where the aerial
   shows it, and `refs/streetview/views.json` has views of each face you will model.

2. **Prepare the round** (alone). Draw a rough model with `landmarks/kit/`, split into one file per
   part under `parts/`, assembled by `model.js` (it exports `build(materials, only)`), and give the
   viewer a first view in `config/default_camera.json`. Write `docs/CONTRACT.md` (frame, ownership,
   budget, rules) and `docs/ART_BIBLE.md` (what the building and the light look like) for this
   building. Check that `landmarks/pipeline/run.sh <name> refine compare` runs, and commit: this is
   the baseline.
   Done when every part builds, the strips in `out/` show the rough model over each photograph,
   and the baseline is committed.

3. **Run the round.** Write one brief per agent from [briefs/](briefs/): its files, its references,
   its budget, the loop (change, compare, look, measure) and the report it ends with. Choose the
   number of agents from the parts that can be owned alone and from the usage the person has
   (METHOD.md, "How many agents"). Start them all at once. While they work, carry facts between
   them and hold the budget, as in [briefs/lead.md](briefs/lead.md).
   Done when every agent has sent its report.

4. **Check.** Move the measured sizes the agents reported into `parts/common.js`. Run
   `landmarks/pipeline/run.sh <name> refine compare`. Open the strips and read `out/pipeline/compare/metrics.md`: the
   silhouette IoU of the views whose camera was refined, and the luma of the building in the render
   against the photograph.
   Done when no part fails to build, the triangle and draw-call counts are within the contract's
   budget, and you have looked at every strip.

5. **Record.** Set `door` in the config to the foot of the entrance, and `building.also` to every
   other building of the campus map whose block the model covers. Run
   `landmarks/pipeline/run.sh <name> place`, so that `placement.json` says where the model stands on
   the map, which blocks it stands in place of and, with `"site": true` in the config, that the
   site draws it. Commit with what changed. Put renders of the model only (no photograph) in
   `docs/landmarks/`. Tell the person what got better, what did not, and what the next round
   should do; if they want it in the repository, open a pull request as `AGENTS.md` says.
   Done when `placement.json` is written, the commit holds no Street View picture and the person
   has the result.
