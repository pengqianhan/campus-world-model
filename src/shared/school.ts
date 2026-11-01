// What a school brings to the site (docs/schools/DESIGN.md, section 5): its descriptor,
// src/schools/<id>/school.ts, is data only. The app reads it through the `@school` alias, which
// vite.config.ts points at the school being built; the pipeline loads it by its path
// (scripts/lib/school.ts). Modules shared by both (src/shared/) take it as an argument and never
// import `@school`.
import type { Layer, LayerVerdict } from "./types.ts";

/** Interface words, by key, as in src/i18n/locales/<lang>.json. */
export type Words = { [key: string]: string | Words };

/** A part of the world the 3D map draws, with the OpenStreetMap snapshot of what surrounds it. */
export interface SceneArea {
  id: string;
  /** South, west, north, east, degrees. */
  bbox: readonly [number, number, number, number];
  /** Snapshot file under data/raw. */
  osm: string;
}

/** How a school writes a room code: "<building>-<room>", such as 303-G23 at the University of Auckland. */
export interface RoomCodeGrammar {
  /** The number that starts every building part. */
  building: RegExp;
  /** A wing letter that may follow the number: 105S, 421W. */
  wing: RegExp;
  /** The room part after the separator. */
  room: RegExp;
  /** Letters that start a room part because they name a floor, so "303G23" is 303 + G23, not 303G + 23. */
  floorLetters: readonly string[];
  /** Floor names that mean the same level in different buildings' numbering styles. */
  equivalentFloors: readonly (readonly string[])[];
}

/**
 * A test on an OpenStreetMap element's tags. It holds when every key's value matches its pattern;
 * a key given as null holds when the element does not carry that tag.
 */
export type TagTest = Readonly<Record<string, RegExp | null>>;

/**
 * How the osm-buildings campus adapter (scripts/lib/osm-buildings.ts) picks a school's buildings
 * from the OpenStreetMap snapshots of its areas: a rule written in the source's tags, never a list
 * of elements typed by hand (docs/schools/DESIGN.md, section 10, risk 8). The one exception is a
 * table read off the school's own campus map (`campusMap`), where the maintainer gives one.
 */
export interface OsmBuildingRule {
  /**
   * The school's campuses, one for each area of its map that holds one (`area`, an id in its
   * `areas`), with the name the school's own page gives it. A building belongs to the campus of
   * the area it stands in.
   */
  campuses: readonly { id: string; name: string; area: string }[];
  /**
   * An element is considered when it is a building or a building part and one of these holds for
   * its tags. Every other element is surroundings, which buildContext draws.
   */
  candidates: readonly TagTest[];
  /**
   * Steps in order. The first whose test holds decides: `take` puts the element on the campus, and
   * otherwise it goes to the exclusions with the step's reason. A candidate that no step decides is
   * left out too.
   */
  steps: readonly { when: TagTest; take: boolean; reason: string; map?: boolean }[];
  /** What the OpenStreetMap source line in About says it provides. */
  provides: string;
  /**
   * The school's own campus map, where the maintainer has given one to choose the school's
   * buildings with (Waikato): a table of the OpenStreetMap elements that stand where the map shows
   * one of the school's blocks. Each row is a candidate, whatever its tags. A step with `map: true`
   * holds only for a row of the table, and one with `map: false` only for any other candidate.
   */
  campusMap?: CampusMapTable;
}

/** One OpenStreetMap element that stands where the school's campus map shows one of its blocks. */
export interface CampusMapRow {
  /** The element, as `${type}/${id}`, e.g. "way/66210760". */
  osm: string;
  /** The block's code as the map gives it, e.g. "J" or "TRU". */
  block: string;
  /**
   * How the row was matched. "name": OpenStreetMap's name for the element is the map's name or code
   * for the block. "place": the element stands where the map draws the block.
   */
  by: "name" | "place";
}

/** The school's campus map and what it decides (OsmBuildingRule.campusMap). */
export interface CampusMapTable {
  /** The source line About shows for the map: never a copy of the map, which stays outside the repository. */
  source: { name: string; url: string; licence: string; received: string; provides: string };
  /** The elements taken, one row each. */
  rows: readonly CampusMapRow[];
  /**
   * Elements that stand where the map shows the school's buildings but are not taken, each with the
   * reason that goes to the exclusions. Homes and childcare centres are never listed: they stay
   * among the surroundings with nothing published about them.
   */
  left: readonly { osm: string; reason: string }[];
}

export interface School {
  /** The school's id: its folder in src/schools/ and public/data/, and its path on the site. */
  id: string;
  /** Origin of the local metric frame of its published data. */
  origin: { lat: number; lon: number };
  /** Where the sun is computed for every campus on its map. */
  sun: { lat: number; lon: number };
  /** The address the weather of Now mode is asked for. */
  weather: string;
  /** Width in metres to show for each campus in the central area, by campus id. */
  campusSpan: Readonly<Record<string, number>>;
  /** The parts of the world its map draws: the central area, and the areas away from it. */
  areas: { central: SceneArea; remote: readonly SceneArea[] };
  roomCode: RoomCodeGrammar;
  /**
   * Its words over the shared ones, by language: src/schools/<id>/locales/<lang>.json. Empty for
   * the University of Auckland, whose words are src/i18n/locales/ itself.
   */
  words: Readonly<Record<string, Words>>;
  /**
   * Its buildings from OpenStreetMap, by a rule on their tags (the Buildings form). Absent for a
   * school whose own campus map gives its buildings: the University of Auckland's.
   */
  osmBuildings?: OsmBuildingRule;
  /**
   * Each layer's verdict, from the school's research report (docs/schools/<id>.md); the pipeline
   * writes it into meta.json. Absent for the University of Auckland, whose meta.json has none.
   */
  layers?: Partial<Record<Layer, LayerVerdict>>;
}
