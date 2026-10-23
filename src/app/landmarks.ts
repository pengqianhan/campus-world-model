// The buildings drawn in detail from code in landmarks/ (the landmark-from-code skill) that the
// site draws in place of their blocks: PROGRESS.md, "Decisions", one source for a University
// building. A landmark joins the site by its own folder alone: the site finds every
// landmarks/<name>/placement.json that says `site: true` (its config's `site`, written there by
// place.py), and the worker loads landmarks/<name>/model.js by the same name (landmarkWorker.ts).
const placements = import.meta.glob<Placement>("../../landmarks/*/placement.json", { eager: true, import: "default" });

/** Where a landmark stands on the map, as landmarks/pipeline/tools/data/place.py writes it. */
export interface Placement {
  /** Whether the site draws it: its config's `site`. */
  site?: boolean;
  /** The University building it draws. */
  building: string;
  /** Other buildings of the campus map whose blocks it draws too: the Clock Tower's south range is 105S. */
  also?: string[];
  /** Map metres east and north of the campus origin: where the model's x = z = 0 stands. */
  centre: number[];
  /** Radians the model turns about the vertical. */
  rotationY: number;
  scale: number;
  /** The foot of its entrance: model x and z, and map metres east and north. The model's y = 0 is the ground there. */
  door: { model: number[]; map: number[] };
  /**
   * When only a part of the building is drawn in detail, the words for that part (its config's `part`):
   * the rest keeps the map's estimated block, and the building's card says so.
   */
  part?: string;
}

export interface LandmarkEntry {
  /** Its folder in landmarks/, or measured/<building> for a measured massing. */
  name: string;
  placement: Placement;
  /**
   * A measured massing (landmarks/MASSING.md): a plain building drawn by the shared model
   * landmarks/measured/model.js from its data file, in its block's own materials.
   */
  measured?: true;
}

/** The landmarks on the site, by the name of their folder. */
export const LANDMARKS: LandmarkEntry[] = Object.entries(placements)
  .filter(([, placement]) => placement.site === true)
  .map(([path, placement]) => ({ name: path.split("/").at(-2)!, placement }))
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

/** Where a measured massing stands, as landmarks/pipeline/tools/massing.py writes it in its data file's `place`. */
interface MeasuredPlace {
  building: string;
  /** Map metres east and north: the building's centre on the campus map, the model's x = z = 0. */
  centre: number[];
  /** Map metres east and north: the lowest point of its outline, where the model's y = 0 stands on the map's ground. */
  door: number[];
}

// Each measured massing joins the site by its data file alone, landmarks/measured/buildings/<id>.json.
// Only its `place` goes into the page's code; the worker loads the files whole (landmarkWorker.ts).
const measuredPlaces = import.meta.glob<MeasuredPlace>("../../landmarks/measured/buildings/*.json", { eager: true, import: "place" });

/** The measured massings on the site, by building. Each stands in place of its building's block as a landmark does. */
export const MEASURED: LandmarkEntry[] = Object.values(measuredPlaces)
  .map(({ building, centre, door }) => ({
    name: `measured/${building}`,
    measured: true as const,
    placement: {
      site: true,
      building,
      centre,
      rotationY: 0,
      scale: 1,
      // The model's frame is the map's about the centre, with z to the south.
      door: { model: [door[0]! - centre[0]!, centre[1]! - door[1]!], map: door },
    },
  }))
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

/** The measured massing that draws a University building, if one does. */
export function measuredOf(building: string): LandmarkEntry | undefined {
  return MEASURED.find((l) => l.placement.building === building);
}

/** The buildings whose blocks a landmark stands in place of: its own first. */
export function landmarkBuildings(entry: LandmarkEntry): string[] {
  return [entry.placement.building, ...(entry.placement.also ?? [])];
}

/** The landmark that draws a University building, if one does. */
export function landmarkOf(building: string): LandmarkEntry | undefined {
  return LANDMARKS.find((l) => landmarkBuildings(l).includes(building));
}
