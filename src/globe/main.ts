// The globe's entry on the page at the site's root (src/globe/data.ts). It stays small: it reads the page's data,
// and only where the browser can draw WebGL does it load three.js and the scene (src/globe/scene.ts). Without
// WebGL, or if anything fails, the figure stays hidden and the list below it is the page, as it was.
import type { GlobeData } from "./data.ts";

function webgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

async function start(): Promise<void> {
  const figure = document.getElementById("globe");
  const json = document.getElementById("globe-data");
  if (!figure || !json?.textContent || !webgl()) return;
  const data = JSON.parse(json.textContent) as GlobeData;
  const { mountGlobe } = await import("./scene.ts");
  await mountGlobe(figure, data, new URL(data.land, import.meta.url).href);
}

start().catch((e: unknown) => {
  document.getElementById("globe")?.setAttribute("hidden", "");
  console.warn("globe:", e);
});
