// Real photographs of buildings, shown at the top of a building's card. One entry a building:
// to add another, put the file in public/photos/<school id>/<building id>.jpg and add one line
// below under that school. A building with no entry shows no photo and no placeholder.
// A photo is a photograph someone took of the building as it stands; say who in `credit`.
import { school } from "@school";

export interface BuildingPhoto {
  /** File name inside public/photos/<school id>/. */
  file: string;
  /** Who took it, shown under the photo. Left out, no caption is shown. */
  credit?: string;
}

const PHOTOS: Record<string, Record<string, BuildingPhoto>> = {
  uoa: {
    "405": {
      file: "405.jpg",
    },
  },
};

/** The photo of a building of the site's school, with the address to load it from, if there is one. */
export function photoOf(buildingId: string): (BuildingPhoto & { src: string }) | undefined {
  const p = PHOTOS[school.id]?.[buildingId];
  return p && { ...p, src: `${import.meta.env.BASE_URL}photos/${school.id}/${p.file}` };
}
