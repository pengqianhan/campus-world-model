// What a school brings to the site (docs/schools/DESIGN.md, section 5): its descriptor,
// src/schools/<id>/school.ts, is data only. The app reads it through the `@school` alias, which
// vite.config.ts points at the school being built; the pipeline loads it by its path
// (scripts/lib/school.ts). Modules shared by both (src/shared/) take it as an argument and never
// import `@school`.

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
}
