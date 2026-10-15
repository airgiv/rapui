/* The idle life of ControlModules as pure functions of time, so the drawing,
   the readout and the still frame all come from the same numbers. A 7.2 s
   loop: every knob turns to a new position once per loop (eased, 1.4 s), the
   buttons press in a slow sequence (down fast, back up on a light spring), each
   press sends a ripple through the speaker grille, and once per loop the lit
   accent crossfades from one coloured cap to the next. */
import { CAPPED, KNOBS, PRESSABLE } from "./view";

export const LOOP = 7.2;
export const CALM = 1.6; // calm runs this much slower, with smaller sweeps
export const TURN = 1.4; // seconds a knob takes to turn to its next position
export const FADE = 0.9; // seconds the accent takes to move to the next cap

/* each knob's stops in the loop: [time, angle in degrees on the table, 0 = +x, 90 = +y] */
const STOPS: Record<string, [number, number][]> = {
  k1: [[0.4, 205], [4.0, 285]],
  ka: [[1.7, 165], [5.2, 255]],
  k2: [[2.6, 300], [6.1, 215]],
  kb: [[0.9, 245], [4.6, 150]],
  k3: [[3.2, 185], [6.6, 275]],
};
/* presses: [time in the loop, id, loop parity (0 even, 1 odd, 2 both)] */
const PRESSES: [number, string, number][] = [
  [1.25, "p1", 2],
  [2.85, "sl", 0],
  [2.85, "sw", 1],
  [4.35, "d1", 0],
  [4.35, "d2", 1],
  [5.75, "st", 2],
];

const smooth = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const easeInOut = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * u));

/* one press as a closed form: down in 70 ms, held, then up on an underdamped spring that stops at the top */
export function pressEnvelope(s: number) {
  if (s < 0) return 0;
  const down = 0.07;
  const hold = 0.14;
  if (s < down) return smooth(s / down);
  if (s < down + hold) return 1;
  const r = s - down - hold;
  const w = 2 * Math.PI * 4;
  const z = 0.55;
  const wd = w * Math.sqrt(1 - z * z);
  const v = Math.exp(-z * w * r) * (Math.cos(wd * r) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * r));
  return r > 0.6 ? 0 : Math.max(0, v);
}

export interface Idle {
  angles: number[]; // per knob (KNOBS order), degrees
  presses: number[]; // per pressable control (PRESSABLE order), 0..1
  tones: number[][]; // per capped knob (CAPPED order): weights of [lit, cap A, cap B]
  active: number; // the capped knob that holds the accent (CAPPED order)
  ripple: (r: number) => number; // the grille's darkening at a distance r from its centre (world units), 0..1
}

function knobAngle(stops: [number, number][], lt: number, sweep: number) {
  // the most recent stop (wrapping into the loop before), and the angle it turned from
  let j = stops.length - 1;
  let since = lt - stops[j]![0] + LOOP;
  for (let k = 0; k < stops.length; k++) if (stops[k]![0] <= lt) (j = k), (since = lt - stops[k]![0]);
  const from = stops[(j + stops.length - 1) % stops.length]![1];
  const to = stops[j]![1];
  const mid = (stops[0]![1] + stops[1]![1]) / 2;
  const a = from + (to - from) * easeInOut(since / TURN);
  return mid + (a - mid) * sweep;
}

export function idleAt(t: number, calm: boolean): Idle {
  const tt = calm ? t / CALM : t;
  const loop = Math.floor(tt / LOOP);
  const lt = tt - loop * LOOP;
  const sweep = calm ? 0.6 : 1;
  const angles = KNOBS.map((k) => knobAngle(STOPS[k.id]!, lt, sweep));
  // presses from this loop and the tail of the one before
  const events: { at: number; i: number }[] = [];
  for (const back of [1, 0]) {
    const n = loop - back;
    for (const [time, id, parity] of PRESSES) {
      if (parity !== 2 && ((n % 2) + 2) % 2 !== parity) continue;
      events.push({ at: n * LOOP + time, i: PRESSABLE.findIndex((p) => p.id === id) });
    }
  }
  const presses = PRESSABLE.map(() => 0);
  for (const e of events) presses[e.i] = Math.max(presses[e.i]!, pressEnvelope(tt - e.at) * (calm ? 0.8 : 1));
  // the accent: moves to the next cap during the last FADE seconds of each loop
  const fade = smooth((lt - (LOOP - FADE)) / FADE);
  const phase = loop + fade;
  const n0 = Math.floor(phase);
  const f = phase - n0;
  const tones = CAPPED.map((_, j) => {
    const w = [0, 0, 0];
    w[(((j - n0) % 3) + 3) % 3] += 1 - f;
    w[(((j - n0 - 1) % 3) + 3) % 3] += f;
    return w;
  });
  const active = (((Math.round(phase) % 3) + 3) % 3) % CAPPED.length;
  // the grille: each press sends a ring out from the centre, fading as it goes
  const recent = events.filter((e) => tt - e.at > 0 && tt - e.at < 1.6);
  const strength = calm ? 0.6 : 1;
  const ripple = (r: number) => {
    let v = 0;
    for (const e of recent) {
      const s = tt - e.at;
      const front = s * 46;
      const d = (r - front) / 7;
      v += Math.exp(-d * d) * Math.exp(-s / 0.55);
    }
    return Math.min(1, v * strength);
  };
  return { angles, presses, tones, active, ripple };
}

/* a composed still: the pill key down, the ripple leaving the grille's centre */
export const STILL_T = 1.25 + 0.16;
