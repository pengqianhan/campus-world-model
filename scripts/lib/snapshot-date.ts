// The snapshot date that About shows for each source of a school (docs/schools/DESIGN.md,
// section 4). data/sources.json is one record for every school, and the shared fetch scripts
// (fetch-osm.ts, fetch-terrain.ts) record every school's files under the same two sources. So for
// those two only the school's own files count: another school's fetch never moves this school's
// date. A school's own sources take the latest record of the whole source, so a refetch of one
// file of it moves the date too.
import { aucklandWallTime } from "../../src/shared/time.ts";
import type { SceneArea } from "../../src/shared/school.ts";
import type { SnapshotRecord } from "./snapshot.ts";
import { TERRAIN_ZOOM, terrainBox, terrainFile, tilesFor } from "./terrain.ts";

/** Sources that the fetch scripts of every school record under one name. */
export const SHARED_SOURCES: ReadonlySet<string> = new Set(["osm", "terrain"]);

/** A school's own files of the shared sources: its areas' OpenStreetMap snapshots and the terrain tiles under them. */
export function sharedFilesOf(areas: readonly SceneArea[]): Set<string> {
  const files = new Set<string>();
  for (const area of areas) {
    files.add(area.osm);
    for (const [x, y] of tilesFor(terrainBox(area), TERRAIN_ZOOM)) files.add(terrainFile(TERRAIN_ZOOM, x, y));
  }
  return files;
}

/**
 * The date, in New Zealand time, of the latest snapshot of `source` for one school, or "" when it
 * has none. `ownFiles` is that school's own files of the shared sources (`sharedFilesOf`).
 */
export function snapshotDate(records: readonly SnapshotRecord[], source: string, ownFiles: ReadonlySet<string>): string {
  const times = records
    .filter((s) => s.source === source && (!SHARED_SOURCES.has(source) || ownFiles.has(s.file)))
    .map((s) => s.fetchedAt)
    .sort();
  const latest = times[times.length - 1];
  return latest ? aucklandWallTime(new Date(latest)).date : "";
}
