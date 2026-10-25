// The parts of the world the 3D map draws, each with the OpenStreetMap snapshot of what surrounds
// it. A University building is on the map when its centre lies in one of them. The areas are the
// school's (`areas` in its descriptor, src/schools/<id>/school.ts).
import type { SceneArea } from "../../src/shared/school.ts";
import { school } from "./school.ts";

export type { SceneArea };

/** The City, Grafton and Newmarket campuses, with roughly 150 m of margin. */
export const CENTRAL: SceneArea = school.areas.central;

/** Campuses and buildings away from the centre, each in an area of its own. */
export const REMOTE: SceneArea[] = [...school.areas.remote];

export const AREAS: SceneArea[] = [CENTRAL, ...REMOTE];
