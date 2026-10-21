import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

// The site is served from https://pengqianhan.github.io/campus-world-model/ so every
// asset URL has to be prefixed with the repository name. Override with BASE_PATH=/
// when hosting at a domain root.
const base = process.env.BASE_PATH ?? "/campus-world-model/";

export default defineConfig({
  base,
  plugins: [preact()],
  // Fixed, uncommon ports so the dev server, the preview server and the e2e tests agree,
  // and so they do not collide with other projects using Vite's default 5173.
  server: { port: 5273, strictPort: true },
  preview: { port: 4273, strictPort: true },
  build: {
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
