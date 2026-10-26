// The University of Auckland's descriptor (docs/schools/DESIGN.md, section 5): data only. Each
// value was a constant of the module named beside it, and is copied unchanged.
import type { SceneArea, School } from "../../shared/school.ts";

/** The City, Grafton and Newmarket campuses, with roughly 150 m of margin. */
const CENTRAL: SceneArea = { id: "central", bbox: [-36.8689, 174.7608, -36.8441, 174.7797], osm: "osm/context.json" };

const remote = (id: string, bbox: SceneArea["bbox"]): SceneArea => ({ id, bbox, osm: `osm/context-${id}.json` });

export const school: School = {
  id: "uoa",
  /** Roughly the middle of the City Campus (the origin of the pipeline's local frame, scripts/lib/map-frame.ts). */
  origin: { lat: -36.8523, lon: 174.7691 },
  /** The City Campus, where the sun is computed for every campus on the map (LAT and LON of src/shared/daylight.ts). */
  sun: { lat: -36.8523, lon: 174.7691 },
  /** WEATHER_URL of src/ui/weather.ts. */
  weather:
    "https://api.open-meteo.com/v1/forecast?latitude=-36.8523&longitude=174.7691" +
    "&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m&timezone=Pacific%2FAuckland",
  /** Approximate width in metres to show for each central campus (CAMPUS_SPAN of src/ui/SceneHost.tsx). */
  campusSpan: { city: 1250, grafton: 520, newmarket: 620 },
  areas: {
    central: CENTRAL,
    /**
     * Campuses and buildings away from the centre: the extent of their buildings on the campus map
     * of 2026-10-13 with 400 m of margin. "carrick-place" is building 581 of Grafton Campus, 3 km
     * from the rest of it.
     */
    remote: [
      remote("tai-tokerau", [-35.7258, 174.3131, -35.7176, 174.3231]),
      remote("ardmore", [-37.0391, 174.9793, -37.0292, 174.9913]),
      remote("leigh", [-36.2735, 174.7931, -36.2653, 174.8035]),
      remote("waiheke", [-36.8044, 175.0276, -36.7926, 175.0406]),
      remote("tai-tonga", [-36.9959, 174.8744, -36.9883, 174.8838]),
      remote("carrick-place", [-36.8793, 174.748, -36.8718, 174.7573]),
    ],
  },
  /**
   * Room codes look like "<building>-<room>": 303-G23, 260-098, 105S-039. The building part is
   * three digits with an optional wing letter. The room part usually starts with the floor: a
   * letter for ground and basement levels (G, B, SB, LG) or the leading digits
   * (src/shared/roomcode.ts).
   */
  roomCode: {
    building: /\d{3}/,
    wing: /[A-Z]/,
    room: /[A-Z]{0,3}\d{1,4}[A-Z0-9]{0,3}/,
    floorLetters: ["G", "B", "M", "L", "P"],
    equivalentFloors: [
      ["G", "0"],
      ["B", "B1", "-1"],
      ["SB", "B2", "-2"],
      ["LG", "M-1"],
    ],
  },
  words: {},
};
