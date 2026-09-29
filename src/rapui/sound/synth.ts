/* ───────────────────────────────────────────────────────────
   rap/ui sound — a tiny Web Audio synth for interface sounds.

   No audio files: every sound is built from two ingredients,
   a short burst of filtered noise (the "click" of a material)
   and a small oscillator voice (the "body" — thump, pluck or
   bloop). That keeps the library asset-free and licence-free,
   and makes one knob possible: `fun`, 0..100.

     0    muted — a dull, low-passed tick with a soft thump,
          the kind of sound that is felt more than heard;
     50   wood/plastic — brighter, a short pitched pluck;
     100  toy — sine bloops that sweep upward, springy boings,
          a little random pitch so repeats do not sound canned.

   Everything interpolates between those, so any value in the
   middle is a real sound rather than a switch between three.
   ─────────────────────────────────────────────────────────── */

export type SoundName =
  | "tap" // a button press
  | "release" // lifting off a pressed control
  | "toggleOn"
  | "toggleOff"
  | "tick" // a checkbox or a small confirmation
  | "detent" // one notch of a slider, dial or scrubber
  | "pop" // something appears: dialog, popover, toast
  | "drop" // something goes away or lands
  | "whoosh" // a sheet or page slides
  | "success"
  | "error"
  | "type"; // a keystroke

export interface PlayOptions {
  /** 0..1 — how firm: a detent on the hour is firmer than on a minute. */
  strength?: number;
  /** Multiplies the pitch, e.g. 1.2 for a higher variant. */
  pitch?: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

/** The shared context, created on first use (browsers require a user gesture). */
export function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(c: AudioContext) {
  if (noise) return noise;
  noise = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

/** A filtered noise burst — the material click. */
function click(c: AudioContext, out: AudioNode, t: number, o: { freq: number; q: number; dur: number; gain: number; type?: BiquadFilterType }) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = o.type ?? "bandpass";
  f.frequency.value = o.freq;
  f.Q.value = o.q;
  const g = c.createGain();
  g.gain.setValueAtTime(o.gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
  src.stop(t + o.dur + 0.02);
}

/** An oscillator voice with a pitch glide — the body of the sound. */
function voice(
  c: AudioContext,
  out: AudioNode,
  t: number,
  o: { wave: OscillatorType; from: number; to: number; dur: number; gain: number; attack?: number },
) {
  const osc = c.createOscillator();
  osc.type = o.wave;
  osc.frequency.setValueAtTime(o.from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + o.dur);
  const g = c.createGain();
  const a = o.attack ?? 0.002;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + o.dur + 0.02);
}

/**
 * Play one sound. `fun` 0..100, `volume` 0..1.
 * Voices are tiny and self-stopping; nothing keeps running afterwards.
 */
export function synth(name: SoundName, fun: number, volume: number, opts: PlayOptions = {}) {
  const c = audio();
  if (!c || volume <= 0) return;
  const f = Math.min(1, Math.max(0, fun / 100));
  const s = opts.strength ?? 1;
  // toys are never exactly the same twice
  const wobble = 1 + (Math.random() - 0.5) * 0.12 * f;
  const p = (opts.pitch ?? 1) * wobble;
  const t = c.currentTime + 0.001;

  const master = c.createGain();
  master.gain.value = volume * lerp(0.9, 0.6, f); // toy sounds carry more, so sit lower
  // muted sounds live behind a gentle low-pass; it opens up as fun rises
  const tone = c.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = lerp(1600, 9000, f);
  tone.connect(master).connect(c.destination);
  const out = tone;

  switch (name) {
    case "detent": {
      click(c, out, t, { freq: lerp(900, 3200, f) * p, q: lerp(1.2, 4, f), dur: lerp(0.018, 0.012, f), gain: 0.5 * s });
      voice(c, out, t, { wave: f > 0.6 ? "sine" : "triangle", from: lerp(140, 900, f) * p, to: lerp(110, 1300, f) * p, dur: lerp(0.03, 0.05, f), gain: 0.35 * s });
      break;
    }
    case "tap": {
      click(c, out, t, { freq: lerp(700, 2400, f) * p, q: 1.4, dur: 0.025, gain: 0.45 * s });
      voice(c, out, t, { wave: f > 0.5 ? "sine" : "triangle", from: lerp(180, 520, f) * p, to: lerp(120, 780, f) * p, dur: lerp(0.05, 0.09, f), gain: 0.5 * s });
      break;
    }
    case "release": {
      click(c, out, t, { freq: lerp(1100, 3000, f) * p, q: 2, dur: 0.015, gain: 0.25 * s });
      break;
    }
    case "toggleOn":
    case "toggleOff": {
      const up = name === "toggleOn";
      click(c, out, t, { freq: lerp(800, 2600, f) * p, q: 1.6, dur: 0.02, gain: 0.4 * s });
      const base = lerp(200, 520, f) * p * (up ? 1.25 : 1);
      voice(c, out, t + 0.01, { wave: f > 0.5 ? "sine" : "triangle", from: base, to: base * (up ? lerp(1.05, 1.9, f) : lerp(0.95, 0.55, f)), dur: lerp(0.06, 0.13, f), gain: 0.45 * s });
      break;
    }
    case "tick": {
      click(c, out, t, { freq: lerp(1200, 3600, f) * p, q: 2.5, dur: 0.02, gain: 0.35 * s });
      voice(c, out, t, { wave: "sine", from: lerp(320, 880, f) * p, to: lerp(300, 1320, f) * p, dur: lerp(0.04, 0.1, f), gain: 0.4 * s });
      break;
    }
    case "pop": {
      voice(c, out, t, { wave: "sine", from: lerp(180, 300, f) * p, to: lerp(260, 1100, f) * p, dur: lerp(0.07, 0.14, f), gain: 0.55 * s, attack: 0.004 });
      click(c, out, t, { freq: lerp(600, 1800, f) * p, q: 1, dur: 0.02, gain: 0.25 * s });
      break;
    }
    case "drop": {
      voice(c, out, t, { wave: "sine", from: lerp(220, 700, f) * p, to: lerp(90, 160, f) * p, dur: lerp(0.09, 0.18, f), gain: 0.55 * s, attack: 0.003 });
      click(c, out, t + 0.02, { freq: lerp(400, 900, f), q: 0.8, dur: 0.05, gain: 0.3 * s, type: "lowpass" });
      break;
    }
    case "whoosh": {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c);
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = lerp(0.7, 2.5, f);
      bp.frequency.setValueAtTime(lerp(300, 600, f), t);
      bp.frequency.exponentialRampToValueAtTime(lerp(1200, 4200, f), t + 0.16);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35 * s, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      src.connect(bp).connect(g).connect(out);
      src.start(t);
      src.stop(t + 0.22);
      break;
    }
    case "success": {
      const notes = f > 0.5 ? [1, 1.26, 1.5, 2] : [1, 1.5];
      notes.forEach((n, i) =>
        voice(c, out, t + i * lerp(0.07, 0.06, f), { wave: f > 0.5 ? "sine" : "triangle", from: lerp(330, 520, f) * n * p, to: lerp(330, 540, f) * n * p, dur: 0.14, gain: 0.35 * s }),
      );
      break;
    }
    case "error": {
      voice(c, out, t, { wave: f > 0.5 ? "square" : "triangle", from: lerp(170, 300, f) * p, to: lerp(150, 180, f) * p, dur: lerp(0.12, 0.2, f), gain: lerp(0.4, 0.18, f) * s });
      voice(c, out, t + 0.1, { wave: f > 0.5 ? "square" : "triangle", from: lerp(150, 260, f) * p, to: lerp(120, 140, f) * p, dur: lerp(0.12, 0.2, f), gain: lerp(0.35, 0.16, f) * s });
      break;
    }
    case "type": {
      click(c, out, t, { freq: lerp(1500, 4200, f) * p, q: 3, dur: 0.012, gain: 0.22 * s });
      if (f > 0.3) voice(c, out, t, { wave: "sine", from: lerp(600, 1500, f) * p, to: lerp(600, 1700, f) * p, dur: 0.03, gain: 0.12 * s * f });
      break;
    }
  }
}
