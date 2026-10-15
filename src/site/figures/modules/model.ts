/* The idle life of ControlModules as pure functions of time, so the drawing,
   the readout and the still frame all come from the same numbers. A 7.2 s
   loop: every knob turns to a new position once per loop (eased, 1.4 s), the
   buttons press in a slow sequence (down fast, back up on a light spring), each
   press sends a ripple through the speaker grille, and once per loop the lit
   accent crossfades from one coloured cap to the next. */
import type { World } from "./world";

export const LOOP = 7.2;
export const CALM = 1.6; // calm runs this much slower, with smaller sweeps
export const TURN = 1.4; // seconds a knob takes to turn to its next position
export const FADE = 0.9; // seconds the accent takes to move to the next cap

/* each knob's stops in the loop: [time, angle in degrees on the table, 0 = +x, 90 = +y]; the hero's are
   tuned by hand, any other knob gets two stops spread out by its place in the list */
const STOPS: Record<string, [number, number][]> = {
  k1: [[0.4, 205], [4.0, 285]],
  ka: [[1.7, 165], [5.2, 255]],
  k2: [[2.6, 300], [6.1, 215]],
  kb: [[0.9, 245], [4.6, 150]],
  k3: [[3.2, 185], [6.6, 275]],
};
const stopsOf = (id: string, i: number): [number, number][] =>
  STOPS[id] ?? [
    [(0.35 + i * 1.53) % LOOP, 150 + ((i * 67) % 120)],
    [(0.35 + i * 1.53 + LOOP / 2) % LOOP, 210 + ((i * 41) % 110)],
  ].sort((a, b) => a[0]! - b[0]!) as [number, number][];
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
  faders: number[]; // per fader, 0..1
  switches: boolean[]; // per switch, on or off
}

/* when each switch flips in the loop: the first twice a loop, the second once (so it alternates loop to loop) */
const FLIPS: Record<string, number[]> = { s1: [2.1, 5.3], s2: [3.9] };
const flipsOf = (id: string, i: number) => FLIPS[id] ?? [(1.7 + i * 2.3) % LOOP];
/* the presses of any layout: the hero's table, or for others one press per control spread over two loops */
function pressesOf(w: World): [number, string, number][] {
  if (w.layout === "hero") return PRESSES;
  return w.pressable.map((t, i) => [(0.6 + (i * LOOP * 2) / w.pressable.length) % LOOP, t.id, Math.floor((i * 2) / w.pressable.length)]);
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

export function idleAt(t: number, calm: boolean, w: World): Idle {
  const tt = calm ? t / CALM : t;
  const loop = Math.floor(tt / LOOP);
  const lt = tt - loop * LOOP;
  const sweep = calm ? 0.6 : 1;
  const angles = w.knobs.map((k, i) => knobAngle(stopsOf(k.id, i), lt, sweep));
  // presses from this loop and the tail of the one before
  const events: { at: number; i: number }[] = [];
  for (const back of [1, 0]) {
    const n = loop - back;
    for (const [time, id, parity] of pressesOf(w)) {
      if (parity !== 2 && ((n % 2) + 2) % 2 !== parity) continue;
      events.push({ at: n * LOOP + time, i: w.pressable.findIndex((p) => p.id === id) });
    }
  }
  const presses = w.pressable.map(() => 0);
  for (const e of events) presses[e.i] = Math.max(presses[e.i]!, pressEnvelope(tt - e.at) * (calm ? 0.8 : 1));
  // the accent: moves to the next cap during the last FADE seconds of each loop
  const fade = smooth((lt - (LOOP - FADE)) / FADE);
  const phase = loop + fade;
  const n0 = Math.floor(phase);
  const f = phase - n0;
  // the cap `phase` steps away from the lit one is lit; the others wear the two cap colours. With three caps
  // (the hero) the colours rotate with the accent, like the reference; with more, each keeps its own
  const C = Math.max(1, w.capped.length);
  const toneAt = (j: number, n: number) => {
    const o = (((j - n) % C) + C) % C;
    if (o === 0) return 0;
    if (C === 3) return o % 2 === 1 ? 1 : 2;
    return j % 2 === 0 ? 1 : 2;
  };
  const tones = w.capped.map((_, j) => {
    const wt = [0, 0, 0];
    wt[toneAt(j, n0)] += 1 - f;
    wt[toneAt(j, n0 + 1)] += f;
    return wt;
  });
  const active = (((Math.round(phase) % C) + C) % C);
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
  // the fader glides through a slow swell, twice as long as the loop
  const faders = w.faders.map((_, i) => 0.5 + (calm ? 0.22 : 0.36) * Math.sin((2 * Math.PI * tt) / (LOOP * 2) + 0.4 + i));
  const switches = w.switches.map((sw, i) => {
    const at = flipsOf(sw.id, i);
    const before = loop * at.length + at.filter((x) => x <= lt).length; // flips so far
    return (before + (sw.id === "s2" || i % 2 === 1 ? 1 : 0)) % 2 === 1; // the second starts on, so the still shows one of each
  });
  return { angles, presses, tones, active, ripple, faders, switches };
}

/* a composed still: the pill key down, the ripple leaving the grille's centre */
export const STILL_T = 1.25 + 0.16;
