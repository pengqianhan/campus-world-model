// Addresses outside this site that the interface links to.
export const REPO = "https://github.com/pengqianhan/campus-world-model";

/** The point cloud the landmarks are measured from: Auckland Part 1, New Zealand 2024, on OpenTopography. */
export const LANDMARK_LIDAR = "https://doi.org/10.5069/G9HH6H8T";
/** LINZ's page on attributing elevation data, which its short credit ("Sourced from LINZ. CC BY 4.0") asks a web page to link to. */
export const LINZ_ELEVATION_CREDIT = "https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-elevation-or-aerial-imagery-data";

/**
 * The project this one was inspired by, an independent student project (PROGRESS.md, "Decisions", Other worlds):
 * its campus view with live classes. The page at the site's root links to it (scripts/lib/picker.ts); its name is
 * under `travel.worlds.<id>` in the locale files.
 */
export const INSPIRED_BY = { id: "tsinghua", url: "https://tsinghua-world-model.pages.dev/?campus=1&classMode=live" };

/** The site whose root carries About, one section a school (scripts/lib/about.ts). */
export const SITE = "https://campusworldmodel.com/";

/**
 * The address of a school's section of About. Served at /<id>/, as on the Cloudflare site and its
 * previews, the page links to the root it is served from; any other copy (the GitHub Pages one at
 * /campus-world-model/) has no such root, so it links to SITE's.
 */
export function aboutHref(base: string, id: string): string {
  return `${homeHref(base, id)}#about-${id}`;
}

/** The page that lists every school's map, at the site's root: as `aboutHref`, the root this page is served from, or SITE. */
export function homeHref(base: string, id: string): string {
  return base === `/${id}/` ? "/" : SITE;
}
