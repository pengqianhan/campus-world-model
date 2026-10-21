// Renders the prototype in Chrome and saves a screenshot: node tools/shot.mjs [out.png] [query]
import { chromium } from "playwright";
import { PAGE } from "./page.mjs";
const out = process.argv[2] ?? "out/shot.png";
const query = process.argv[3] ?? "";
const [vw, vh] = (process.argv[4] ?? "1536x1024").split("x").map(Number);
const browser = await chromium.launch({
  channel: process.env.CHROME_CHANNEL ?? "chrome",
  args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu"],
});
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
page.on("console", (m) => console.log("[page]", m.text()));
page.on("pageerror", (e) => console.log("[page error]", e.message));
await page.goto(`${PAGE}index.html${query}`);
await page.waitForFunction(() => window.__ready === true, undefined, { timeout: 120000 });
const info = await page.evaluate(() => window.__info);
console.log(JSON.stringify(info));
await page.screenshot({ path: out });
await browser.close();
