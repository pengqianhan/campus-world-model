// Builds the globe of the page at the site's root (src/globe/) into <site>/globe/: its script, bundled by Vite
// with three.js, its file names carrying a hash of their content, and the land it draws, from Natural Earth's
// 1:110m land (data/raw/naturalearth/, committed; scripts/worlds/fetch-land.ts) cut to a tenth of a degree.
// scripts/build-root.ts calls it, in the deploy jobs after `npm ci`, so the deploy needs no step of its own.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { build } from "vite";
import { landFromGeoJson } from "../../src/globe/data.ts";
import type { GlobeFiles } from "./picker.ts";

/** Builds the globe into <site>/globe/ and returns the paths the page names, from the site's root. */
export async function buildGlobe(root: string, site: string): Promise<GlobeFiles> {
  const out = path.join(site, "globe");
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const geo = JSON.parse(fs.readFileSync(path.join(root, "data", "raw", "naturalearth", "ne_110m_land.geojson"), "utf8"));
  const land = JSON.stringify(landFromGeoJson(geo));
  const landName = `land-${createHash("sha256").update(land).digest("hex").slice(0, 10)}.json`;
  fs.writeFileSync(path.join(out, landName), land);

  const result = await build({
    configFile: false,
    root,
    logLevel: "warn",
    publicDir: false,
    build: {
      outDir: out,
      emptyOutDir: false,
      copyPublicDir: false,
      target: "es2022",
      // three.js, loaded only where WebGL can draw: about 130 kB over the wire.
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        input: path.join(root, "src", "globe", "main.ts"),
        output: { entryFileNames: "globe-[hash].js", chunkFileNames: "globe-[name]-[hash].js", assetFileNames: "globe-[name]-[hash][extname]" },
      },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => ("output" in r ? r.output : []));
  const entry = outputs.find((o) => o.type === "chunk" && o.isEntry);
  if (!entry) throw new Error("the globe's build wrote no entry script");
  return { script: `/globe/${entry.fileName}`, land: `/globe/${landName}` };
}
