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
  // The list beside the globe: a line under the pointer or the keyboard turns the globe to its campus, and the pins
  // the globe names light their lines.
  const lines = new Map<string, HTMLElement>();
  for (const li of document.querySelectorAll<HTMLElement>("#worlds li[data-school], #worlds li[data-world]")) lines.set(li.dataset.school ?? li.dataset.world!, li);
  // Lit lines are never scrolled to: the tour lights them by itself, and must not move the page under a reader.
  let lit: HTMLElement[] = [];
  const control = await mountGlobe(figure, data, new URL(data.land, import.meta.url).href, (ids) => {
    for (const li of lit) li.classList.remove("lit");
    lit = ids.flatMap((id) => lines.get(id) ?? []);
    for (const li of lit) li.classList.add("lit");
  });
  for (const [id, li] of lines) {
    li.addEventListener("mouseenter", () => control.focus(id));
    li.addEventListener("focusin", () => control.focus(id));
    li.addEventListener("mouseleave", () => control.release());
    li.addEventListener("focusout", () => control.release());
  }
}

start().catch((e: unknown) => {
  document.getElementById("globe")?.setAttribute("hidden", "");
  console.warn("globe:", e);
});
