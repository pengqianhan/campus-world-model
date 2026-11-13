// An original, seeded electronic cue. No samples or third-party recordings.
import fs from 'node:fs';
export function soundtrack(file) {
  const rate = 48000, seconds = 46, count = rate * seconds;
  const left = new Float64Array(count), right = new Float64Array(count);
  let seed = 9173;
  const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
  const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);
  const mix = (at, duration, gain, pan, wave) => {
    const start = Math.round(at * rate), length = Math.min(Math.round(duration * rate), count - start);
    for (let i = 0; i < length; i++) {
      const v = wave(i / rate) * gain;
      left[start + i] += v * Math.sqrt((1 - pan) / 2);
      right[start + i] += v * Math.sqrt((1 + pan) / 2);
    }
  };
  const note = (at, midi, duration, gain, pan = 0, kind = 'pluck') => {
    const hz = freq(midi);
    mix(at, duration, gain, pan, (t) => {
      const attack = Math.min(1, t / (kind === 'pad' ? 0.2 : 0.006));
      const release = Math.min(1, (duration - t) / (kind === 'pad' ? 0.5 : 0.09));
      const env = attack * Math.max(0, release) * (kind === 'pad' ? 0.65 : Math.exp(-t * 4));
      return env * (Math.sin(2 * Math.PI * hz * t) + 0.24 * Math.sin(2 * Math.PI * hz * 2.002 * t) + 0.1 * Math.sin(2 * Math.PI * hz * 3 * t));
    });
  };
  const kick = (at, gain) => mix(at, 0.4, gain, 0, (t) => Math.sin(2 * Math.PI * (48 * t + 8 * (1 - Math.exp(-t * 32)))) * Math.exp(-t * 13));
  const hat = (at, gain, open = false) => mix(at, open ? 0.22 : 0.07, gain, at % 1 ? 0.3 : -0.3, (t) => noise() * Math.exp(-t * (open ? 25 : 70)));
  const clap = (at) => mix(at, 0.17, 0.12, 0, (t) => noise() * Math.exp(-t * 25) * (0.5 + 0.5 * Math.sin(t * 500)));
  const chords = [[50, 57, 62, 65], [46, 53, 58, 62], [53, 60, 65, 69], [48, 55, 60, 64]];
  for (let bar = 0; bar < 23; bar++) {
    const at = bar * 2, chord = chords[bar % chords.length];
    chord.forEach((midi, i) => note(at, midi + 12, 2.8, 0.043, (i - 1.5) * 0.4, 'pad'));
    if (at < 4 || at >= 44) continue;
    const hero = at >= 18 && at < 28;
    for (let step = 0; step < 8; step++) {
      const t = at + step * 0.25;
      if (!hero || step % 4 === 0) note(t, chord[[0, 2, 1, 3, 2, 1, 3, 2][step]] + 12, 0.7, hero ? 0.08 : 0.062, step % 2 ? 0.45 : -0.45);
      if (!hero || step % 2 === 0) hat(t, hero ? 0.017 : 0.026, step === 7);
    }
    for (let beat = 0; beat < 4; beat++) {
      if (hero && beat % 2) continue;
      kick(at + beat * 0.5, hero ? 0.3 : 0.43);
      note(at + beat * 0.5 + 0.03, chord[0] - 12, 0.38, 0.14);
      if (!hero && beat % 2) clap(at + beat * 0.5);
    }
  }
  [0, 4, 9, 12, 15, 19, 24, 28, 32, 36, 40].forEach((at) => {
    kick(at, at === 19 ? 0.6 : 0.32);
    note(at, at === 19 ? 86 : 81, 1.4, 0.1, -0.2);
    if (at > 0) mix(at - 0.33, 0.48, 0.07, 0.15, (t) => noise() * Math.sin(Math.PI * t / 0.48) ** 2 * Math.sin(t * t * 18000));
  });
  [0, 0.4, 1.05, 2].forEach((at, i) => note(at, [74, 77, 81, 86][i], 2.5, 0.12, i % 2 ? 0.3 : -0.3));
  [0, 0.28, 0.7, 1.4].forEach((at, i) => note(40 + at, [74, 77, 81, 86][i], 3, 0.11, i % 2 ? -0.3 : 0.3));
  let peak = 0;
  for (let i = 0; i < count; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const data = Buffer.alloc(44 + count * 4);
  data.write('RIFF', 0); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22); data.writeUInt32LE(rate, 24);
  data.writeUInt32LE(rate * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(count * 4, 40);
  for (let i = 0; i < count; i++) {
    const t = i / rate, fade = Math.min(1, t / 0.04, Math.max(0, (seconds - t) / 1.3));
    const gain = 0.86 / peak * fade;
    data.writeInt16LE(Math.round(Math.tanh(left[i] * gain) * 32767), 44 + i * 4);
    data.writeInt16LE(Math.round(Math.tanh(right[i] * gain) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, data);
}
