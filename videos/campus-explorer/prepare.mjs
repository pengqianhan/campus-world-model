import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { soundtrack } from './soundtrack.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const assets = path.join(here, 'assets');
fs.mkdirSync(assets, { recursive: true });
const images = {
  'old-government-house.jpg': 'docs/landmarks/old-government-house-front.jpg',
  'library.jpg': 'docs/landmarks/general-library-alfred.jpg',
  'clocktower-front.jpg': 'docs/landmarks/clocktower-front.jpg',
};
const sources = [];
for (const [name, source] of Object.entries(images)) {
  const bytes = fs.readFileSync(path.join(repo, source));
  fs.writeFileSync(path.join(assets, name), bytes);
  sources.push({ file: name, source, sha256: createHash('sha256').update(bytes).digest('hex') });
}
let gsap = process.env.PROMO_GSAP_PATH;
if (!gsap && process.env.LOCALAPPDATA) {
  const cache = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
  for (const entry of fs.existsSync(cache) ? fs.readdirSync(cache) : []) {
    const candidate = path.join(cache, entry, 'node_modules/hyperframes/dist/vendor/npm/gsap@3.15.0/dist/gsap.min.js');
    if (fs.existsSync(candidate)) { gsap = candidate; break; }
  }
}
if (!gsap || !fs.existsSync(gsap)) throw new Error('Run the pinned HyperFrames CLI once, or set PROMO_GSAP_PATH to a local gsap.min.js (3.15.0).');
fs.copyFileSync(gsap, path.join(assets, 'gsap.min.js'));
soundtrack(path.join(assets, 'soundtrack.wav'));
fs.writeFileSync(path.join(assets, 'provenance.json'), JSON.stringify({ images: sources, footage: 'capture.mjs: local application and local landmark viewer; remote requests blocked', music: 'Original procedural score; soundtrack.mjs; no samples', fonts: 'Microsoft YaHei and Consolas, installed system fonts; not redistributed', data: 'See README.md, NOTICE and docs/data-sources.md at the repository root' }, null, 2) + '\n');
console.log('Prepared repository images, local GSAP and the original 46-second score.');
