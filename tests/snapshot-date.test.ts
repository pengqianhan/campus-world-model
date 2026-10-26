// Snapshot dates for each school (docs/schools/DESIGN.md, section 4, and risk 4 in section 10):
// another school's OpenStreetMap or terrain fetch must not move the dates that About shows for the
// University of Auckland.
import { describe, expect, it } from "vitest";
import type { SceneArea } from "../src/shared/school.ts";
import { school } from "../src/schools/uoa/school.ts";
import type { SnapshotRecord } from "../scripts/lib/snapshot.ts";
import { sharedFilesOf, snapshotDate } from "../scripts/lib/snapshot-date.ts";
import { TERRAIN_ZOOM, terrainBox, terrainFile, tilesFor } from "../scripts/lib/terrain.ts";

const record = (source: string, file: string, fetchedAt: string): SnapshotRecord => ({ source, file, fetchedAt, url: "", bytes: 0, sha256: "" });

const uoaAreas: SceneArea[] = [school.areas.central, ...school.areas.remote];
const uoaFiles = sharedFilesOf(uoaAreas);
const [tx, ty] = tilesFor(terrainBox(school.areas.central), TERRAIN_ZOOM)[0]!;
const uoaTile = terrainFile(TERRAIN_ZOOM, tx, ty);

/** Another school's area, in Wellington, with its own OpenStreetMap file. */
const kelburn: SceneArea = { id: "kelburn", bbox: [-41.292, 174.765, -41.286, 174.772], osm: "osm/context-vuw-kelburn.json" };
const [kx, ky] = tilesFor(terrainBox(kelburn), TERRAIN_ZOOM)[0]!;
const kelburnTile = terrainFile(TERRAIN_ZOOM, kx, ky);

// The University of Auckland's own records, at the times of the committed data/sources.json, and
// later records of another school's files under the same two shared sources.
const records: SnapshotRecord[] = [
  record("osm", "osm/context.json", "2026-10-12T11:27:35.460Z"),
  record("osm", "osm/context-carrick-place.json", "2026-10-14T12:20:15.678Z"),
  record("terrain", uoaTile, "2026-10-14T12:38:35.277Z"),
  record("mapsindoors", "mapsindoors/venues.json", "2026-10-12T11:11:28.412Z"),
  record("uoa-calendar", "uoa-calendar/courses.html", "2026-10-12T11:28:56.966Z"),
  record("osm", kelburn.osm, "2026-11-20T01:00:00.000Z"),
  record("terrain", kelburnTile, "2026-11-20T01:05:00.000Z"),
];

describe("snapshot dates for each school", () => {
  it("counts the school's own areas' OpenStreetMap files and the tiles under them", () => {
    expect(uoaFiles.has("osm/context.json")).toBe(true);
    for (const area of school.areas.remote) expect(uoaFiles.has(area.osm)).toBe(true);
    expect(uoaFiles.has(uoaTile)).toBe(true);
    expect(uoaFiles.has(kelburn.osm)).toBe(false);
    expect(uoaFiles.has(kelburnTile)).toBe(false);
  });

  it("does not let another school's OpenStreetMap or terrain fetch move the University of Auckland's dates", () => {
    // In New Zealand time: 2026-10-14T12:20Z is 01:20 on 15 October.
    expect(snapshotDate(records, "osm", uoaFiles)).toBe("2026-10-15");
    expect(snapshotDate(records, "terrain", uoaFiles)).toBe("2026-10-15");
  });

  it("gives the other school the dates of its own files", () => {
    const kelburnFiles = sharedFilesOf([kelburn]);
    expect(snapshotDate(records, "osm", kelburnFiles)).toBe("2026-11-20");
    expect(snapshotDate(records, "terrain", kelburnFiles)).toBe("2026-11-20");
  });

  it("takes a school's own source from its latest record, whatever the file", () => {
    expect(snapshotDate(records, "mapsindoors", uoaFiles)).toBe("2026-10-13");
    expect(snapshotDate([...records, record("mapsindoors", "mapsindoors/new.json", "2026-12-01T00:00:00.000Z")], "mapsindoors", uoaFiles)).toBe("2026-12-01");
    expect(snapshotDate(records, "uoa-calendar", new Set())).toBe("2026-10-13");
  });

  it("gives no date for a source without a record", () => {
    expect(snapshotDate(records, "uoa-classes", uoaFiles)).toBe("");
    expect(snapshotDate(records, "osm", new Set())).toBe("");
  });
});
