// Verify the encodes and make covers from their actual frames.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const here = path.dirname(fileURLToPath(import.meta.url));
const ffmpeg = process.env.HYPERFRAMES_FFMPEG_PATH ?? 'ffmpeg';
const ffprobe = process.env.HYPERFRAMES_FFPROBE_PATH ?? 'ffprobe';
const output = path.join(here, 'renders');
fs.mkdirSync(output, { recursive: true });
const manifest = [];
for (const format of ['portrait', 'landscape']) {
  const name = `Campus-World-Model-${format}.mp4`;
  const movie = path.join(output, name);
  const staged = path.join(here, '.hyperframes/landscape/renders', name);
  if (!fs.existsSync(movie) && fs.existsSync(staged)) fs.copyFileSync(staged, movie);
  const probe = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', movie], { encoding: 'utf8', windowsHide: true }));
  const video = probe.streams.find((s) => s.codec_type === 'video');
  const audio = probe.streams.find((s) => s.codec_type === 'audio');
  const expected = format === 'portrait' ? [1080, 1920] : [1920, 1080];
  if (video.width !== expected[0] || video.height !== expected[1] || video.r_frame_rate !== '30/1' || video.nb_frames !== '1380' || Number(probe.format.duration) !== 46 || !audio) throw new Error('Unexpected encode: ' + name);
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '1.8', '-i', movie, '-frames:v', '1', path.join(output, `cover-${format}.jpg`)], { windowsHide: true });
  const times = [1.8, 6.5, 10.5, 13.5, 17.5, 21.8, 26, 30, 34, 38, 43, 45.75];
  const select = times.map((t) => 'eq(n\\,' + Math.round(t * 30) + ')').join('+');
  const sheet = 'select=' + select + (format === 'portrait' ? ',scale=270:480,tile=4x3' : ',scale=480:270,tile=3x4');
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', movie, '-vf', sheet, '-frames:v', '1', path.join(output, `review-${format}.jpg`)], { windowsHide: true });
  if (process.argv.includes('--save-previews')) {
    fs.mkdirSync(path.join(here, 'previews'), { recursive: true });
    for (const kind of ['cover', 'review']) fs.copyFileSync(path.join(output, `${kind}-${format}.jpg`), path.join(here, 'previews', `${kind}-${format}.jpg`));
  }
  manifest.push({ file: name, sha256: createHash('sha256').update(fs.readFileSync(movie)).digest('hex'), bytes: Number(probe.format.size), seconds: 46, width: video.width, height: video.height, fps: 30, frames: Number(video.nb_frames), video: video.codec_name, audio: audio.codec_name });
}
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({ exports: manifest, source: 'See README.md and assets/provenance.json for the film source and credits.' }, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
