// The checker takes index.html. Stage the landscape entry as an independent local project.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const stage = path.join(here, '.hyperframes', 'landscape');
fs.mkdirSync(path.join(stage, 'assets'), { recursive: true });
fs.writeFileSync(path.join(stage, 'index.html'), fs.readFileSync(path.join(here, 'versions/landscape.html'), 'utf8').replaceAll('src="../assets/', 'src="assets/'));
for (const entry of fs.readdirSync(path.join(here, 'assets'), { withFileTypes: true })) {
  if (entry.isFile()) fs.copyFileSync(path.join(here, 'assets', entry.name), path.join(stage, 'assets', entry.name));
}
fs.cpSync(path.join(here, 'assets/landscape'), path.join(stage, 'assets/landscape'), { recursive: true });
fs.writeFileSync(path.join(stage, 'meta.json'), JSON.stringify({ id: 'campus-explorer-landscape', name: 'Campus World Model · Landscape' }, null, 2) + '\n');
fs.copyFileSync(path.join(here, 'hyperframes.json'), path.join(stage, 'hyperframes.json'));
console.log('Staged the landscape source and its local assets.');
