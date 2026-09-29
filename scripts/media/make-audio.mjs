/* Demo audio for the docs site's Media group (AudioPlayer, Playlist,
   VoiceNote). The preview is hosted where only bundled assets load, so
   the music is synthesised here instead of fetched: sine/triangle chords,
   a plucked arpeggio, a soft kick and a whisper of hat, written as 16-bit
   mono WAV at 22.05 kHz (small, and every browser decodes it).

   Each track is a whole number of bars, so `loop` is seamless: the pad
   tails are faded inside the last beat and the first bar starts clean.

     node scripts/media/make-audio.mjs   → src/site/media/*.wav            */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../../src/site/media");
mkdirSync(OUT, { recursive: true });

/* tiny deterministic PRNG, so a rebuild writes the same bytes */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const tri = (p) => 1 - 4 * Math.abs(((p + 0.25) % 1) - 0.5);

function wav(samples, rate) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return buf;
}

/* ── a loop: chords per bar, arpeggio in eighths, kick on 1 and 3 ── */
function song({ bpm, bars, chords, arp = true, kick = true, hat = true, seed = 1, rate = 22050, bright = 1 }) {
  const beat = 60 / bpm;
  const bar = beat * 4;
  const len = Math.round(bar * bars * rate);
  const out = new Float32Array(len);
  const rand = rng(seed);

  const add = (t0, dur, fn) => {
    const a = Math.max(0, Math.floor(t0 * rate));
    const b = Math.min(len, Math.floor((t0 + dur) * rate));
    for (let i = a; i < b; i++) out[i] += fn((i - a) / rate);
  };

  for (let b = 0; b < bars; b++) {
    const ch = chords[b % chords.length];
    const t0 = b * bar;
    /* the pad: each chord tone as a soft sine + a quieter triangle an
       octave up, 120 ms attack, released inside the bar so the next
       chord never smears into it (and the loop point is clean) */
    for (const n of ch) {
      const f = midi(n);
      const ph = rand();
      add(t0, bar, (t) => {
        const env = Math.min(1, t / 0.12) * Math.min(1, (bar - t) / 0.35);
        const wob = 1 + 0.002 * Math.sin(2 * Math.PI * 5 * t);
        return env * (0.05 * Math.sin(2 * Math.PI * (f * wob * t + ph)) + 0.018 * bright * tri(f * 2 * t + ph));
      });
    }
    /* the bass: root two octaves down, on the beat */
    const root = midi(ch[0] - 12);
    for (let k = 0; k < 4; k++) {
      add(t0 + k * beat, beat * 0.95, (t) => {
        const env = Math.min(1, t / 0.01) * Math.exp(-t * 3.2);
        return 0.12 * env * Math.sin(2 * Math.PI * root * t);
      });
    }
    /* the pluck: chord tones up and down in eighths, an octave up */
    if (arp) {
      const seq = [0, 1, 2, 3, 2, 1, 3, 2];
      for (let k = 0; k < 8; k++) {
        const n = ch[seq[k] % ch.length] + 12;
        const f = midi(n);
        add(t0 + (k * beat) / 2, beat * 1.2, (t) => {
          const env = Math.min(1, t / 0.004) * Math.exp(-t * 7);
          return 0.07 * env * (Math.sin(2 * Math.PI * f * t) + 0.35 * bright * tri(f * 2 * t));
        });
      }
    }
    /* the kick: a sine dropping 120→45 Hz, soft, on 1 and 3 */
    if (kick) {
      for (const k of [0, 2]) {
        add(t0 + k * beat, 0.35, (t) => {
          const f = 45 + 75 * Math.exp(-t * 28);
          const ph = 45 * t + (75 / 28) * (1 - Math.exp(-t * 28));
          return 0.42 * Math.exp(-t * 9) * Math.sin(2 * Math.PI * ph) * (f > 0 ? 1 : 0);
        });
      }
    }
    /* the hat: filtered-ish noise on the offbeats, very quiet */
    if (hat) {
      for (let k = 0; k < 4; k++) {
        let prev = 0;
        add(t0 + k * beat + beat / 2, 0.06, (t) => {
          const n = rand() * 2 - 1;
          const hp = n - prev;
          prev = n;
          return 0.02 * Math.exp(-t * 60) * hp;
        });
      }
    }
  }
  /* gentle limiter */
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const g = 0.85 / peak;
  for (let i = 0; i < len; i++) out[i] = Math.tanh(out[i] * g * 1.1) / Math.tanh(1.1);
  return wav(out, rate);
}

/* ── a "voice": a glottal buzz through two formants, in syllables ── */
function voice({ seconds = 7, rate = 16000, seed = 7 }) {
  const len = Math.round(seconds * rate);
  const out = new Float32Array(len);
  const rand = rng(seed);
  /* syllables: [start, dur, formant1, formant2, pitch] with pauses between phrases */
  const syl = [];
  let t = 0.25;
  while (t < seconds - 0.5) {
    const words = 3 + Math.floor(rand() * 4);
    for (let w = 0; w < words && t < seconds - 0.4; w++) {
      const d = 0.12 + rand() * 0.22;
      const vowels = [[730, 1090], [270, 2290], [300, 870], [530, 1840], [640, 1190]];
      const [f1, f2] = vowels[Math.floor(rand() * vowels.length)];
      syl.push([t, d, f1, f2, 130 + rand() * 50]);
      t += d + 0.03 + rand() * 0.06;
    }
    t += 0.3 + rand() * 0.35;
  }
  for (const [t0, d, f1, f2, p] of syl) {
    const a = Math.floor(t0 * rate);
    const b = Math.min(len, Math.floor((t0 + d) * rate));
    for (let i = a; i < b; i++) {
      const tt = (i - a) / rate;
      const env = Math.sin(Math.PI * Math.min(1, tt / d)) ** 0.7;
      const f0 = p * (1 + 0.08 * Math.sin((Math.PI * tt) / d));
      let s = 0;
      /* harmonics of f0 weighted by closeness to the formants */
      for (let h = 1; h * f0 < 3500; h++) {
        const fh = h * f0;
        const w = Math.exp(-(((fh - f1) / 110) ** 2)) + 0.6 * Math.exp(-(((fh - f2) / 160) ** 2)) + 0.25 / h;
        s += w * Math.sin(2 * Math.PI * fh * tt);
      }
      out[i] += 0.12 * env * s + 0.01 * env * (rand() * 2 - 1);
    }
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  for (let i = 0; i < len; i++) out[i] = (out[i] / peak) * 0.8;
  return wav(out, rate);
}

const tracks = {
  /* F maj7 – A m7 – D m9 – B♭ maj7, 100 bpm, 10 bars = 24 s */
  "grid-lines.wav": song({ bpm: 100, bars: 10, seed: 3, chords: [[53, 57, 60, 64], [57, 60, 64, 67], [50, 53, 57, 64], [46, 50, 53, 57]] }),
  /* slower, no hat: C maj9 – E m7 – A m7 – F maj7, 84 bpm, 4 bars ≈ 11.4 s */
  "soft-kerning.wav": song({ bpm: 84, bars: 4, seed: 11, hat: false, bright: 0.6, chords: [[48, 52, 55, 62], [52, 55, 59, 62], [57, 60, 64, 67], [53, 57, 60, 64]] }),
  /* brighter: G – D/F♯ – E m7 – C maj7, 120 bpm, 6 bars = 12 s */
  "paper-weight.wav": song({ bpm: 120, bars: 6, seed: 29, bright: 1.3, chords: [[55, 59, 62, 67], [54, 57, 62, 66], [52, 55, 59, 62], [48, 52, 55, 59]] }),
  "voice-note.wav": voice({ seconds: 7 }),
};

for (const [name, buf] of Object.entries(tracks)) {
  writeFileSync(join(OUT, name), buf);
  console.log(`${name.padEnd(18)} ${(buf.length / 1024).toFixed(0)} KB`);
}
