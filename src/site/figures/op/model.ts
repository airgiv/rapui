/* The idle pattern of the rapui OP, as pure functions of time: a six-step
   sequencer at a walking tempo. Each step presses its key (down fast, back up on
   a light spring), the tempo encoder breathes, the fader glides, and the switch
   flips every second loop. The screen shows the tempo and a trace that kicks on
   every step. Same numbers for the drawing, the readout and the still. */
import { KEY_N, KNOB_SPAN } from "./view";

export const STEP = 0.8; // seconds per step
export const LOOP = STEP * KEY_N; // 4.8 s
export const CALM = 1.6; // calm runs this much slower, with smaller sweeps

/* one key press as a closed form: down in 70 ms, held, then up on an underdamped spring */
export function pressEnvelope(s: number) {
  if (s < 0) return 0;
  const down = 0.07;
  const hold = 0.12;
  if (s < down) {
    const u = s / down;
    return u * u * (3 - 2 * u);
  }
  if (s < down + hold) return 1;
  const r = s - down - hold;
  const w = 2 * Math.PI * 4.2;
  const z = 0.5;
  const decay = Math.exp(-z * w * r);
  const v = decay * (Math.cos(w * Math.sqrt(1 - z * z) * r) + (z / Math.sqrt(1 - z * z)) * Math.sin(w * Math.sqrt(1 - z * z) * r));
  // the cap stops at the top of its travel, so the spring's swing past rest is cut off there
  return Math.abs(v) < 1e-3 && r > 0.3 ? 0 : Math.max(0, v);
}

export interface Idle {
  step: number; // the step playing (0..5)
  keys: number[]; // press of each key
  knob: number; // the tempo encoder, 0..1
  fader: number; // 0..1
  on: boolean; // the switch
  kick: number; // the trace's kick from the latest step, 1 → 0
}

export function idleAt(t: number, calm: boolean): Idle {
  const tt = calm ? t / CALM : t;
  const loop = Math.floor(tt / LOOP);
  const lt = tt - loop * LOOP;
  const step = Math.min(KEY_N - 1, Math.floor(lt / STEP));
  const keys = Array.from({ length: KEY_N }, (_, i) => {
    // this key's press in this loop, and the tail of the one from the loop before
    const s = lt - i * STEP;
    const prev = s + LOOP;
    return Math.max(pressEnvelope(s), s < 0 ? pressEnvelope(prev) : 0) * (calm ? 0.8 : 1);
  });
  const sweep = calm ? 0.16 : 0.26;
  const knob = 0.5 + sweep * Math.sin((2 * Math.PI * tt) / (LOOP * 2));
  const fader = 0.5 + (calm ? 0.2 : 0.34) * Math.sin((2 * Math.PI * tt) / (LOOP * 2) + 1.9);
  const on = Math.floor(tt / (LOOP * 2)) % 2 === 0;
  const since = lt - step * STEP;
  const kick = Math.exp(-since / 0.22);
  return { step, keys, knob, fader, on, kick };
}

/* the encoder's value as an angle: 0..1 over 270°, 0.5 pointing to the back */
export const knobDeg = (v: number) => (v - 0.5) * KNOB_SPAN;
export const bpmOf = (v: number) => Math.round(80 + v * 80);

/* a composed still: the third key half way down, the switch on */
export const STILL_T = 2 * STEP + 0.035;
