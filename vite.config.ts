import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import type { Plugin, ResolvedConfig } from "vite";

// The school whose data a build carries (docs/schools/DESIGN.md, section 3). Each school's published
// data is in public/data/<id>/, and the site reads it at <base>data/<file>. The University of
// Auckland, uoa, is the default and builds into dist/; any other school builds into dist-<id>/, so
// that it cannot empty or write into the University of Auckland's dist/.
const SCHOOL = process.env.SCHOOL || "uoa";
if (!/^[a-z][a-z0-9-]*$/.test(SCHOOL)) throw new Error(`SCHOOL is a school's id in lower case, such as uoa, not "${SCHOOL}"`);
const outDir = SCHOOL === "uoa" ? "dist" : `dist-${SCHOOL}`;

// The University of Auckland is served from https://pengqianhan.github.io/campus-world-model/, so
// every asset URL of its build is prefixed with the repository name; any other school's default is
// /<id>/ (PROGRESS.md, "Decisions"). Override with BASE_PATH=/ when hosting at a domain root.
const base = process.env.BASE_PATH ?? (SCHOOL === "uoa" ? "/campus-world-model/" : `/${SCHOOL}/`);

/**
 * Puts one school's data at data/: public/data/<SCHOOL>/ is served and built as <base>data/.
 * Vite's own copy of public/ is off (build.copyPublicDir: false), so this copies the rest of
 * public/ itself, after the bundle is written, into the build's own output folder.
 */
function schoolData(): Plugin {
  let config: ResolvedConfig;
  const dataDir = () => path.join(config.publicDir, "data");
  return {
    name: "school-data",
    configResolved(resolved) {
      config = resolved;
      if (!fs.existsSync(path.join(dataDir(), SCHOOL))) throw new Error(`no published data for SCHOOL=${SCHOOL} in ${path.join(dataDir(), SCHOOL)}`);
    },
    // Runs before Vite's own middlewares, which strip the base and serve public/: so a request for
    // <base>data/<file> is served from public/data/<SCHOOL>/<file>.
    configureServer(server) {
      const prefix = `${config.base}data/`;
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith(prefix)) req.url = `${prefix}${SCHOOL}/${req.url.slice(prefix.length)}`;
        next();
      });
    },
    writeBundle() {
      const out = path.resolve(config.root, config.build.outDir);
      fs.cpSync(config.publicDir, out, { recursive: true, filter: (src) => path.resolve(src) !== path.resolve(dataDir()) });
      fs.cpSync(path.join(dataDir(), SCHOOL), path.join(out, "data"), { recursive: true });
    },
  };
}

export default defineConfig({
  base,
  plugins: [preact(), schoolData()],
  // Fixed, uncommon ports so the dev server, the preview server and the e2e tests agree,
  // and so they do not collide with other projects using Vite's default 5173.
  server: { port: 5273, strictPort: true },
  preview: { port: 4273, strictPort: true },
  build: {
    outDir,
    // public/ is copied by schoolData(), without the other schools' data.
    copyPublicDir: false,
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  // The landmark worker (src/scene/landmarkWorker.ts) is an ES module, as the page already starts
  // it ({ type: "module" }), so that it can load each landmark's model as a chunk of its own, named
  // after the landmark's folder: assets/landmark-clocktower-<hash>.js. The files of the shared kit
  // (landmarks/kit/) count as having side effects, so that the worker's import of every one of them
  // keeps the kit inside the worker, and never in a chunk of its own, even where a kit file only
  // exports functions. Every other module is tree-shaken as before.
  worker: {
    format: "es",
    rolldownOptions: {
      treeshake: { moduleSideEffects: (id) => /landmarks[\\/]kit[\\/]/.test(id) || undefined },
      output: {
        chunkFileNames: (chunk) => {
          const landmark = /landmarks[\\/]([^\\/]+)[\\/]model\.js$/.exec(chunk.facadeModuleId ?? "")?.[1];
          return landmark ? `assets/landmark-${landmark}-[hash].js` : "assets/[name]-[hash].js";
        },
      },
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
