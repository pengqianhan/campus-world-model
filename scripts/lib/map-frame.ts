// The local metric frame of a school's published data, and the areas of its map in that frame
// (docs/schools/DESIGN.md, section 4). The driver, scripts/build-data.ts, makes one for the school
// being built and gives it to the campus adapter, buildContext and buildTerrain, which hold no
// state of their own.
import { makeProjector, type Pt } from "../../src/shared/geo.ts";
import type { SceneArea } from "../../src/shared/school.ts";

/** An area of the map with its box in the local frame, metres. */
export interface AreaBox {
  area: SceneArea;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface MapFrame {
  /** Origin of the local frame: every published coordinate is metres east and north of it. */
  origin: { lat: number; lon: number };
  /** Longitude and latitude to metres east and north of the origin. */
  project: (lon: number, lat: number) => Pt;
  /** The central area, whose surroundings load with the map. */
  central: SceneArea;
  /** The areas the map draws, each with its box. */
  boxes: AreaBox[];
}

/** The frame round `origin`, with a box for each of `areas`. */
export function mapFrame(origin: MapFrame["origin"], central: SceneArea, areas: readonly SceneArea[]): MapFrame {
  const project = makeProjector(origin);
  const boxes = areas.map((area) => {
    const [x0, y0] = project(area.bbox[1], area.bbox[0]);
    const [x1, y1] = project(area.bbox[3], area.bbox[2]);
    return { area, x0, y0, x1, y1 };
  });
  return { origin, project, central, boxes };
}

export const inBox = (b: AreaBox, p: Pt, margin = 0) => p[0] >= b.x0 - margin && p[0] <= b.x1 + margin && p[1] >= b.y0 - margin && p[1] <= b.y1 + margin;

/** Where a building or campus centred here stands: in the central area, in another one, or off the map. */
export function placeOnMap(frame: MapFrame, center: Pt): { area?: string; offMap?: true } {
  const area = frame.boxes.find((b) => inBox(b, center))?.area;
  return !area ? { offMap: true } : area === frame.central ? {} : { area: area.id };
}
