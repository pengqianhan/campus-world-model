# Method: a lead and a team of agents

This page says how the Clock Tower was made, so that the next building can be made the same way.
The work is done by Claude Code: one **lead** session that talks to the person, and a few **agents**
it starts, each owning one part of the model. Code alone, sized by LiDAR, checked against photographs.

## What is automatic and what is not

| Step | Who | Automatic? |
| --- | --- | --- |
| Measure the building from LiDAR | `landmarks/pipeline/run.sh <name> data` | yes |
| Fetch the Street View references and the camera of each view | `landmarks/pipeline/run.sh <name> refs` | yes (tiles billed once) |
| Correct each reference camera against the model's silhouette | `landmarks/pipeline/run.sh <name> refine` | yes |
| Render every reference view, side-by-side strips, metrics | `landmarks/pipeline/run.sh <name> compare` | yes |
| Place the model on the campus map (`placement.json`) | `landmarks/pipeline/run.sh <name> place` | yes |
| **Write the model** (`parts/*.js`): what the building is made of | the agents | no: agents write it by looking at the strips and measuring |

The pipeline is the scaffolding that lets the agents see what they are doing and measure how close
they are. The model itself is code that agents write and rewrite in rounds. A new building needs a
new round of agents, not just a new config.

## The steps

### 0. Groundwork (the lead, alone)
Before any agent starts, the lead builds what they all share (`briefs/lead.md`):

1. **Sizes** from the LiDAR: the frame (where the building stands, which way it faces), plan
   extents and heights, in `parts/common.js`.
2. **References**: 12 Street View panoramas round the building, three views each (whole front,
   tower, door), each with the camera that took it in the model's frame.
3. **A rough first model, split into parts**: one file per part (`tower`, `centre`, `pavilion`,
   `ranges`), assembled by `model.js`; a part that throws is left out, not fatal.
4. **Two documents** every agent reads first:
   - `docs/CONTRACT.md` (in the landmark's folder): the frame, who owns which file, how to render and compare, the budget, the rules;
   - `docs/ART_BIBLE.md`: what the building looks like, what the light is, what must never happen.
5. **A compare tool** and a committed baseline, so that every agent starts from the same code and
   can show before and after.

### 1. The round (agents in parallel)
The lead starts all agents at once, each with a brief (`briefs/*.md`). Round 1 had five:

| Agent | Owns | Did |
| --- | --- | --- |
| pipeline | `tools/`, `run.sh`, `README.md`, `data/`, `config/` (now `landmarks/pipeline/`, shared) | turned one-off scripts into the stages above; camera refinement; metrics |
| tower | `parts/tower*.js` | the tower: 28 pinnacles, octagonal shaft turned 2.5°, clock stage, crown (60k triangles) |
| centre | `parts/centre*.js` | the recessed entrance bay: doorway, steps, porch, oriel turrets (18k triangles) |
| facade | `parts/pavilion.js`, `ranges.js`, `gothic.js` (now in `landmarks/kit/`) | the gabled pavilions and side ranges; the shared window kit (bars, cusps, hoods) |
| look | the viewer (now `landmarks/pipeline/viewer/`), `textures.js` and `materials.js` (now in `landmarks/kit/`), `landscape.js` | sun, sky, tone, stone with weathering, glass, street, 60 trees from the LiDAR |

### How many agents
Not fixed. One agent per part that can be owned alone: as many agents as the model splits into files
that nobody else needs to edit. Two agents on one file get in each other's way. Then cut to what the
usage allowance can carry (it grows with the number of agents running at once), and decide again each
round: a later round that only has the tower's detail and the backlit views left needs two agents, not
five. For scale: one building here took 5 agents in one round; Athenaion's whole ancient city took 55
agents over 9 rounds, at most 12 at a time.

Each agent works in a loop, 6–10 times: **change → render the reference views → look at the strips
(reference | render | overlay) and measure → change again**. Each judges only its own concern: the
shape agents judge shape, the look agent judges light and colour.

### 2. The lead during the round
The agents do not talk to each other. The lead reads their progress and carries facts between them
(the notes it sent are at the end of `briefs/lead.md`), for example:
- a measurement one agent made that changes another's part (the centre agent found the pavilions'
  inner walls 0.8 m off, and the facade agent was told);
- a change in the shared kit another agent must follow (window bars now drawn by the kit, so the
  glass shader drops its own);
- the budget: the whole scene was over, so each agent got its share back to keep to.

### 3. Closing the round (the lead)
The lead moves the measured sizes into `common.js`, runs `landmarks/pipeline/run.sh <name> refine compare`, looks at the
strips, commits, and reports to the person what improved and what is left for the next round.

## The rules (from `landmarks/clocktower/docs/CONTRACT.md`)
1. **One writer per file.** Each agent edits only the files it owns and reads anything. This is what
   lets five agents edit one model at the same time without breaking each other.
2. **Shared code stays compatible.** The shared kit (`landmarks/kit/`, used by every landmark) has
   one owner, who may add options and exports but never rename, remove or change what an existing
   call produces.
3. **Measure, don't guess.** LiDAR is the truth for positions and heights; photographs for what the
   surfaces look like. Where they disagree, the agent says so, with numbers.
4. **References only.** Nothing traced or sampled from the photographs: every mesh and texture is
   generated in code. No people, no cars.
5. **Determinism.** Seeded randomness only; same code, same picture.
6. **A budget.** It must run in a browser, on phones too: whole building ≤ ~400k triangles,
   ≤ ~60 draw calls; each part has its share.
7. **Agents do not commit.** The lead reviews and commits.
8. **Every agent ends with a report**: what it built, files, numbers (triangles, build time), before
   and after strips, what still differs from the photographs, and what it would do next.

## Why a team works better than one agent here
The first version of the Clock Tower was made by one agent alone, against a single AI-edited picture.
The team version is much closer, and not only because there are more agents:
- **Focus**: each agent gives its one part 6–10 rounds of close comparison; one agent drawing the
  whole building gave each part one or two.
- **Better references**: 36 real Street View views with known cameras, instead of one edited image.
- **Measurement**: camera refinement and silhouette IoU tell an agent how far off it is, in numbers.
- **Ownership** keeps parallel work from colliding.

## Results of round 1 (Clock Tower)
Silhouette IoU against the refined front views: whole front 0.68–0.72, tower 0.89–0.95, door
0.88–0.98; luma median of the building within ~5 of the photographs. About 129k triangles in 9 draw
calls for the building, 125k for the street and trees. Eight panoramas (backlit, behind trees, or
the back) could not be refined and still match poorly (IoU 0.06–0.5).

## Cost and time
Round 1 took under 3 hours from start to commit, with five agents on Claude Opus, pause included. Running five at once used up the
Claude plan's usage window part-way through; all five stopped and were resumed after it reset, with
nothing lost (the lead told each to re-read its files first). Start a round right after the usage
window resets, or run three agents instead of five. Street View: the 12 panoramas used 1,526 tiles,
inside the 100,000 free per month.

## A new building
1. A folder `landmarks/<name>/` with a config (`config/<name>.json`; `landmarks/README.md`,
   "Another building"), and `landmarks/pipeline/run.sh <name> data refs` with `ALLOW_FETCH=1`.
   The kit and the pipeline are shared: nothing is copied.
2. The groundwork above: a rough model split into parts, a contract and an art bible for it.
3. Briefs for its agents: start from `briefs/*.md` and change the building, the parts and the views.
   Keep the rules and the report format.
4. Run the round, close it, look, and run another if it is still getting better.

## Credits
The way of working (references, no assets, everything in code, a contract and an art bible,
specialist agents in parallel comparing renders against references) follows
[Athenaion](https://github.com/Leonxlnx/athenaion) by Leon Lin (MIT), which built an ancient Greek
city this way. The code here is written for this project; the contract's structure follows
Athenaion's `docs/CONTRACT.md`.
