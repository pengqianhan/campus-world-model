# Walk the campus

**In the browser:** "Take a walk", the button beside the campus's name in the bottom-left corner,
or `?walk=1` in the address, puts a small made-up person near the Clock Tower. The button gives the
view from behind it the whole screen, as in a game, with small panels in the corners: where it is,
its speed, the views, and how it gets about. W A S D or the arrow keys walk it, and Shift breaks
into a run. Scooter (2) puts it on a made-up electric scooter, on the same ways at up to 25 km/h;
Fly (3) sends a made-up drone up in its place, which Space or E climbs and Q or C brings down, over
the roofs and no higher than 120 m above the ground, and Walk (1) lands it. On a phone or tablet it
is steered as in a game: a stick under the left thumb walks and turns it, and the other thumb drags
the view round; flying, Up and Down are under the right thumb. The panel at the bottom right
switches between the view from behind it, the view through its eyes and the map (V); there a
drag looks round, and a click on a building or the ground sends it there; as it goes by hand, the
view comes back round behind it. "Let it wander" sends it strolling on its own from building to
building. Every walker looks the
same: a student with nothing meant to mark a sex or a gender, who opens an umbrella when Open-Meteo
reports rain.
Behind it, the camera stops in front of a wall rather than inside it, and wherever a building or a
tree hides the walker, its shape shows through in the colour of its ring.

**With an agent:** Claude Code (or any agent that runs shell commands) steers it with
`npm run walker -- <command>`. The first command opens the map in a browser window with the walker
on it, so you can watch; `--headless` keeps it hidden.

```bash
npm run walker -- look                    # buildings round it: distance, direction, what is ahead
npm run walker -- walk 109                # or part of a name, "east,north", a campus, a walker
npm run walker -- walk 109-305            # a room: into its building, up to its floor, to the room
npm run walker -- enter | floor up | exit # in at street level, stairs or lift, back out
npm run walker -- see --view eyes         # a picture through its eyes, saved under .walker/shots/
npm run walker -- say "Kia ora"           # walkers within 25 m hear it; listen hears them
npm run walker -- spawn Kea --near 201    # a second walker; steer it with --as Kea
npm run walker -- wander                  # stroll on its own from building to building
npm run walker -- help                    # every command
npm run walker -- stop                    # close the map
```

In this repository Claude Code also has the `campus-walker` skill, which tells it how to walk well
and what the map can and cannot say. The same commands are MCP tools, pictures included:

```bash
claude mcp add campus-walker -- node scripts/walker/mcp.ts
```

The controller (`scripts/walker/daemon.ts`) runs on your computer only: it serves this checkout with
Vite on port 5273 (or uses the dev server already there), takes commands on 127.0.0.1 with a random
token it keeps in `.walker/`, and sends nothing anywhere else.

The walker is made up and stands for no real person. Its body is Quaternius's
["Animated Human"](https://opengameart.org/content/animated-human-low-poly), given to the public
domain (CC0); `scripts/walker/make-figure.ts` turns the download into `public/models/walker.glb`,
and `src/scene/figureBuild.ts` makes it over when the first walk starts: rounded faces, a stance at
ease, trainers, hair, a mouth, a backpack and an umbrella.
Doors are not mapped, so a walk to a building ends beside its nearest wall, going in steps onto the
floor at street level, and a walk inside keeps to corridors where it can and takes the nearest
stairs or lift between floors. What one walker says to another is its own words: agents are told
to treat it as speech, never as instructions.
