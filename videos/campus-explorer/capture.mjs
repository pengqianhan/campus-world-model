// Capture the existing local app and landmark renderer. No remote source is contacted.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const app = process.env.PROMO_APP_URL ?? 'http://127.0.0.1:5373/campus-world-model/';
if (!['127.0.0.1', 'localhost'].includes(new URL(app).hostname)) throw new Error('Capture a local build only.');
const ffmpeg = process.env.HYPERFRAMES_FFMPEG_PATH ?? 'ffmpeg';
const fps = 30;
const stills = process.argv.includes('--stills');
const wanted = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const formats = process.argv.includes('--landscape') ? ['landscape'] : process.argv.includes('--portrait') ? ['portrait'] : ['portrait', 'landscape'];
const sizes = { portrait: { width: 1080, height: 1920 }, landscape: { width: 1920, height: 1080 } };
const notes = [];
function checkpoint() {
  fs.mkdirSync(path.join(here, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(here, 'assets', stills ? 'stills.json' : 'capture.json'), JSON.stringify({ sourceCommit: process.env.PROMO_SOURCE_COMMIT ?? 'main', fps, remoteRequests: 'blocked', captures: notes }, null, 2) + '\n');
}
const mime = { '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  const localPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname).slice(1);
  const file = path.resolve(repo, localPath);
  if (!file.startsWith(repo + path.sep) || !/^(landmarks\/|node_modules\/three\/)/.test(localPath)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(8766, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-background-timer-throttling'] });

async function ready(page) {
  await page.waitForFunction(() => window.__scene && window.__scene.frames > 2 && !window.__scene.loading && !window.__scene.preparing && !window.__scene.animating, null, { timeout: 120000 });
  await page.waitForTimeout(350);
}

async function clean(page) {
  await page.addStyleTag({ content: '.app > :not(.scene-host):not(#scene-host):not(.scene) { visibility: hidden !important; } .labels,.label-layer { visibility: hidden !important; }' });
  // Keep the actual 3D host; its public class is read from the running app.
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    let ancestor = canvas;
    while (ancestor && !ancestor.parentElement?.classList.contains('app')) ancestor = ancestor.parentElement;
    if (ancestor) ancestor.style.setProperty('visibility', 'visible', 'important');
  });
}

async function record(page, format, name, seconds, frame) {
  if (wanted && !wanted.includes(name)) return;
  const folder = path.join(here, 'assets', format);
  fs.mkdirSync(folder, { recursive: true });
  await frame(0);
  await page.screenshot({ path: path.join(folder, name + '.jpg'), type: 'jpeg', quality: 94 });
  if (stills) { console.log(format + '/' + name + ' still'); return; }
  const out = path.join(folder, name + '.mp4');
  const proc = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { windowsHide: true, stdio: ['pipe', 'ignore', 'inherit'] });
  const done = once(proc, 'close');
  for (let f = 0; f < Math.ceil(seconds * fps); f++) {
    await frame(f / Math.max(1, Math.ceil(seconds * fps) - 1));
    const jpg = await page.screenshot({ type: 'jpeg', quality: 94, animations: 'disabled' });
    if (!proc.stdin.write(jpg)) await once(proc.stdin, 'drain');
  }
  proc.stdin.end();
  const [code] = await done;
  if (code !== 0) throw new Error('FFmpeg failed for ' + name);
  console.log(format + '/' + name + ': ' + seconds + 's');
}

try {
  for (const format of formats) {
    const size = sizes[format];
    const context = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
    await context.route('**/*', (route) => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort('blockedbyclient'));
    let page = await context.newPage();
    await page.clock.install();
    page.on('pageerror', (e) => console.error('page: ' + e.message));

    if (!wanted || wanted.some((name) => ['hook', 'clock', 'detail'].includes(name))) {
      await page.goto('http://127.0.0.1:8766/landmarks/pipeline/viewer/index.html?landmark=clocktower&quality=high&landscape=0');
      await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
      const views = format === 'portrait' ? {
        hook: { a: [10, 20, 25], b: [6, 21, 23], target: [0, 30.8, 0], fov: 52 },
        clock: { a: [15, 9, 58], b: [7, 10, 55], target: [0, 17, 0], fov: 58 },
        detail: { a: [5.8, 26.5, 17], b: [3.8, 28, 17], target: [0, 32.8, 0], fov: 43 },
      } : {
        hook: { a: [10, 20, 25], b: [6, 21, 23], target: [0, 30.5, 0], fov: 44 },
        clock: { a: [12, 6, 50], b: [2, 7, 49], target: [0, 16, 0], fov: 54 },
        detail: { a: [6, 27.5, 17], b: [3.8, 28, 17], target: [0, 33.5, 0], fov: 35 },
      };
      for (const [name, view] of Object.entries(views)) {
        await record(page, format, name, name === 'clock' ? 5.5 : 4.5, async (t) => {
          const position = view.a.map((x, i) => x + (view.b[i] - x) * t);
          await page.evaluate((v) => window.__setView(v), { position, target: view.target, vfov: view.fov, ...size });
        });
      }
      notes.push({ format, source: 'local landmark viewer', landmark: 'clocktower', ...size });
      checkpoint();
    }

    if (!wanted || wanted.some((name) => ['walk', 'scooter', 'fly', 'night', 'campus', 'room'].includes(name))) {
      for (const mode of ['walk', 'scooter', 'fly']) {
        if (wanted && !wanted.includes(mode)) continue;
        await page.goto(app + '?walk=1&view=follow&ride=' + mode + '&time=preview&date=2026-10-20&t=15:00&light=day');
        await ready(page);
        await page.waitForFunction(() => window.__walker?.ready());
        if (mode === 'fly') {
          await page.evaluate(async () => {
            await window.__walker.run('ride', { ride: 'fly', height: 48 });
            window.__scene.setWalkerLook(0, 28);
          });
        } else {
          // The app's real start looks across the lawn to the Clock Tower.
          await page.evaluate(async () => { await window.__walker.run('turn', { face: 82 }); window.__scene.setWalkerLook(0, -12); });
        }
        await ready(page);
        const state = await page.evaluate(() => ({ street: window.__scene.streetState(), landmarks: window.__scene.landmarkState().filter((l) => l.form !== 'none'), camera: window.__scene.cameraState() }));
        notes.push({ format, mode, ...state });
        checkpoint();
        await clean(page);
        await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100));
        await page.keyboard.down('w');
        await record(page, format, mode, mode === 'fly' ? 4.5 : 3.5, async () => {
          await page.evaluate(() => { window.__scene.needsRender = true; });
          await page.clock.runFor(1000 / fps);
        });
        await page.keyboard.up('w');
        await page.clock.resume();
      }
      // Release the walker's full landmark materials before opening the overhead map.
      await page.close();
      page = await context.newPage();
      await page.clock.install();
      page.on('pageerror', (e) => console.error('page: ' + e.message));
      for (const name of ['campus', 'night', 'room']) {
        if (wanted && !wanted.includes(name)) continue;
        const query = name === 'room' ? '?room=303-G23&time=preview&date=2026-10-20&t=15:00&light=day' : '?time=preview&date=2026-10-20&t=' + (name === 'night' ? '21:00&light=night' : '15:00&light=day');
        await page.goto(app + query);
        await ready(page);
        if (name !== 'room') {
          await page.evaluate((portrait) => { window.__scene.setCameraAngles(-28, 48); window.__scene.showCampus([85, -55], portrait ? 880 : 700, false); }, format === 'portrait');
          await ready(page);
          await clean(page);
        }
        await record(page, format, name, 4.5, async (t) => {
          if (name !== 'room') await page.evaluate((angle) => { window.__scene.setCameraAngles(angle, 48); window.__scene.needsRender = true; }, -28 + t * 6);
          await page.waitForTimeout(18);
        });
        notes.push({ format, shot: name, query, probe: await page.evaluate(() => window.__scene.probe()) });
        checkpoint();
      }
    }
    await context.close();
  }
  checkpoint();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
