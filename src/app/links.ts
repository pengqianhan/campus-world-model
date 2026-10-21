// Addresses outside this site that the interface links to.
export const REPO = "https://github.com/pengqianhan/campus-world-model";

/** The point cloud the landmarks are measured from: Auckland Part 1, New Zealand 2024, on OpenTopography. */
export const LANDMARK_LIDAR = "https://doi.org/10.5069/G9HH6H8T";
/** LINZ's page on attributing elevation data, which its short credit ("Sourced from LINZ. CC BY 4.0") asks a web page to link to. */
export const LINZ_ELEVATION_CREDIT = "https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-elevation-or-aerial-imagery-data";

/** A campus map of another university, made by someone else, that this site links to. */
export interface World {
  /** Its name and place are under `travel.worlds.<id>` in the locale files. */
  id: string;
  url: string;
  /** Where that campus is, for the distance counted on the way there. */
  lat: number;
  lon: number;
}

/** The project this one was inspired by. The address is its campus view with live classes. */
export const INSPIRED_BY: World = { id: "tsinghua", url: "https://tsinghua-world-model.pages.dev/?campus=1&classMode=live", lat: 40.0, lon: 116.327 };

export const WORLDS: World[] = [INSPIRED_BY];
