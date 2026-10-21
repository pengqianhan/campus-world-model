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
}

export interface LandmarkEntry {
  /** Its folder in landmarks/. */
  name: string;
  placement: Placement;
}

/** The landmarks on the site, by the name of their folder. */
export const LANDMARKS: LandmarkEntry[] = Object.entries(placements)
  .filter(([, placement]) => placement.site === true)
  .map(([path, placement]) => ({ name: path.split("/").at(-2)!, placement }))
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

/** The buildings whose blocks a landmark stands in place of: its own first. */
export function landmarkBuildings(entry: LandmarkEntry): string[] {
  return [entry.placement.building, ...(entry.placement.also ?? [])];
}

/** The landmark that draws a University building, if one does. */
export function landmarkOf(building: string): LandmarkEntry | undefined {
  return LANDMARKS.find((l) => landmarkBuildings(l).includes(building));
}
