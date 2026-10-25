import { defineConfig, devices } from "@playwright/test";

// By default the tests run against a local production build (`npm run build && npm run preview`).
// Set E2E_BASE_URL to check a deployed copy instead, e.g. the GitHub Pages site:
//   E2E_BASE_URL=https://pengqianhan.github.io/campus-world-model/ npm run e2e
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:4273/campus-world-model/";
const local = baseURL.startsWith("http://localhost");

// Headless Chromium needs to be told how to get a WebGL context. On Windows the real GPU is
// available through D3D11; elsewhere (CI, macOS, Linux) fall back to the SwiftShader software
// renderer. E2E_GL=swiftshader forces the software renderer, to reproduce what CI sees.
const software = process.platform !== "win32" || process.env.E2E_GL === "swiftshader";
const glArgs = software
  ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
  : ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"];

// CI runs the suite in two halves at once, on two machines (.github/workflows/deploy.yml).
// E2E_HALF=1 runs the specs FIRST_HALF names; E2E_HALF=2 runs every other one, so a new spec file
// runs in the second half without being listed here. Measured on CI (2026-10-26), the two take
// about as long. Without E2E_HALF, every spec runs.
const FIRST_HALF = /[\\/](site|sky|travel|mobile)\.spec\.ts$/;
const half = process.env.E2E_HALF || undefined;
if (half !== undefined && half !== "1" && half !== "2") throw new Error(`E2E_HALF is "1" or "2", not "${half}"`);
const secondHalf = half === "2" ? [FIRST_HALF] : [];

export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results",
  // Software rendering, in CI or on a laptop, is slow, so it gets more room and fewer workers.
  timeout: software ? 180_000 : 60_000,
  expect: { timeout: software ? 30_000 : 15_000 },
  fullyParallel: true,
  workers: software ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: { args: glArgs },
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      testIgnore: [/mobile\.spec\.ts/, ...secondHalf],
      ...(half === "1" ? { testMatch: FIRST_HALF } : {}),
    },
    {
      name: "mobile",
      // Software rendering gets a 1x screen; on the real GPU the phone's own pixel density is used.
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, ...(software ? { deviceScaleFactor: 1 } : {}) },
      testMatch: /mobile\.spec\.ts/,
      testIgnore: secondHalf,
    },
  ],
  webServer: local
    ? {
        command: "npm run preview",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      }
    : undefined,
});
