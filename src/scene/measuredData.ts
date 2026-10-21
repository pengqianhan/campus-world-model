// The data of every measured massing (landmarks/MASSING.md), by building: the files that
// landmarks/pipeline/tools/massing.py writes in landmarks/measured/buildings/. The landmark worker
// loads this module the first time it is asked for a measured massing, so all of them come in one
// chunk, and the page's own code holds only where each stands (src/app/landmarks.ts).
const files = import.meta.glob<unknown>("../../landmarks/measured/buildings/*.json", { eager: true, import: "default" });

export const MEASURED_DATA: Record<string, unknown> = Object.fromEntries(
  Object.entries(files).map(([path, data]) => [path.split("/").at(-1)!.replace(/\.json$/, ""), data]),
);
