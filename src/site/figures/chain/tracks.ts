/* Every path a marble rolls along, as the line its centre follows. The model
   rolls the marbles on these and the drawing hangs its rails, ties and treads
   under the very same lines, so a marble can never leave its rails. */
import {
  CHUTE_END_X,
  GUTTER_END,
  GUTTER_X,
  RAMPS,
  RUN_C,
  RUN_R,
  SPIRAL,
  SPIRAL_BOT,
  SPIRAL_R,
  SPIRAL_TOP,
  SPIRAL_TURNS,
  STAIR_TOP,
  STAIR_X0,
  STAIR_Y,
  STEP_LEN,
  STEP_RISE,
  STEPS,
  R,
  TURN_C,
  TURN_R,
  BACK_Y,
  EXIT_X,
  LIFT_BALL,
  Z_IN,
  ROW_X,
  DOM_BACK0,
  LEVER_Y,
  PIVOT,
  ARM_CUP,
  LEVER_REST,
} from "./view";
import { RAD, add, len, sub, unit, type V3 } from "./vec";

/* a ball on two rails rolls on a smaller circle than its own: it feels less of g than 5/7 */
const RAIL_K = 0.57;

export type Slot = "back" | "lift" | "wall" | "stairs" | "table" | "gutter" | "spiralBack" | "spiralFront" | "exitA" | "exitB" | "top";

export interface Track {
  id: string;
  pts: V3[];
  cum: number[];
  len: number;
  mu: number; // rolling resistance, units/s²
  drag: number; // speed-proportional loss, 1/s
  slot: Slot;
  rails: boolean;
  k: number; // share of g a rolling marble feels (5/7 on a flat, less on two rails)
  wall: number; // rubbing on the outside of a bend: loss = wall * v²
  next?: string;
  startStop?: number; // restitution against a stop at s = 0
  endStop?: number; // restitution against a stop at the end
}

function line(a: V3, b: V3, step = 4): V3[] {
  const n = Math.max(1, Math.ceil(len(sub(b, a)) / step));
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, a[2] + ((b[2] - a[2]) * i) / n] as V3);
}

/* an arc round (cx, cy) from angle a0 to a1 (degrees), its height going z0 → z1 */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, z0: number, z1: number, stepDeg = 6): V3[] {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / stepDeg));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (a0 + ((a1 - a0) * i) / n) * RAD;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), z0 + ((z1 - z0) * i) / n] as V3;
  });
}

function joined(...parts: V3[][]): V3[] {
  const out: V3[] = [];
  for (const part of parts) for (const p of part) if (!out.length || len(sub(p, out[out.length - 1]!)) > 1e-6) out.push(p);
  return out;
}

function track(id: string, pts: V3[], o: Partial<Track> & { slot: Slot }): Track {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1]! + len(sub(pts[i]!, pts[i - 1]!)));
  return { id, pts, cum, len: cum[cum.length - 1]!, mu: 8, drag: 0.1, rails: true, k: RAIL_K, wall: 0, ...o };
}

/* where the cup holds a marble, for a cup-arm angle in degrees */
export function cupBall(angle: number): V3 {
  const a = angle * RAD;
  const cup: V3 = [PIVOT[0] - ARM_CUP * Math.cos(a), LEVER_Y, PIVOT[2] + ARM_CUP * Math.sin(a)];
  return add(cup, [0, 0, 5.4]);
}

const treads = Array.from({ length: STEPS }, (_, i) => {
  const x0 = STAIR_X0 + i * STEP_LEN;
  const z = STAIR_TOP - i * STEP_RISE + R;
  return track(`tread${i}`, line([x0, STAIR_Y, z], [x0 + STEP_LEN, STAIR_Y, z], 2), { slot: "stairs", rails: false, mu: 30, drag: 0.4, k: 5 / 7 });
});

export const STAIRS_END_X = STAIR_X0 + STEPS * STEP_LEN;
const REST_CUP = cupBall(LEVER_REST);

export const TRACKS: Track[] = [
  track("ramp1", line(RAMPS[0]!.from, RAMPS[0]!.to), { slot: "wall" }),
  track("ramp2", line(RAMPS[1]!.from, RAMPS[1]!.to), { slot: "wall", startStop: 0.3 }),
  track("ramp3", line(RAMPS[2]!.from, RAMPS[2]!.to), { slot: "wall", startStop: 0.3, next: "chute" }),
  track("chute", joined(arc(TURN_C[0], TURN_C[1], TURN_R, 180, 90, 76.2, 75.9), line([TURN_C[0], TURN_C[1] + TURN_R, 75.9], [CHUTE_END_X, STAIR_Y, 75.6], 2)), { slot: "wall", wall: 0.36 / TURN_R }),
  ...treads,
  track(
    "runout",
    joined(line([STAIRS_END_X, STAIR_Y, 22.2], [RUN_C[0], STAIR_Y, 21.6], 2), arc(RUN_C[0], RUN_C[1], RUN_R, 90, 0, 21.6, 20.8), line([ROW_X, RUN_C[1], 20.8], [ROW_X, DOM_BACK0 + R, 20.7], 1)),
    { slot: "table", mu: 6, wall: 0.3 / RUN_R },
  ),
  track("side", joined(line([ROW_X, DOM_BACK0 + R, 20.7], [-50, DOM_BACK0 + R, 20.3], 2), arc(-50, DOM_BACK0 + R - 12, 12, 90, 180, 20.3, 20.0)), { slot: "table", next: "gutter", mu: 4, wall: 0.3 / 12 }),
  track("gutter", line([GUTTER_X, DOM_BACK0 + R - 12, 20.0], [GUTTER_X, GUTTER_END, 16.2], 3), { slot: "gutter", endStop: 0.2, mu: 4 }),
  track("load", line([GUTTER_X, GUTTER_END, 16.2], REST_CUP, 1), { slot: "gutter", endStop: 0.1, rails: false, mu: 3, k: 5 / 7 }),
  track(
    "spiral",
    joined(
      line([SPIRAL[0] - 30, SPIRAL[1] - SPIRAL_R, SPIRAL_TOP + 1.6], [SPIRAL[0], SPIRAL[1] - SPIRAL_R, SPIRAL_TOP], 2),
      arc(SPIRAL[0], SPIRAL[1], SPIRAL_R, -90, -90 + 360 * SPIRAL_TURNS, SPIRAL_TOP, SPIRAL_BOT, 5),
    ),
    { slot: "spiralBack", next: "exit", mu: 10, drag: 0.1, wall: 0.36 / SPIRAL_R },
  ),
  track(
    "exit",
    joined(line([EXIT_X, SPIRAL[1], SPIRAL_BOT], [EXIT_X, BACK_Y + 14, SPIRAL_BOT - 0.5], 2), arc(EXIT_X - 14, BACK_Y + 14, 14, 0, -90, SPIRAL_BOT - 0.5, SPIRAL_BOT - 0.8)),
    { slot: "exitA", next: "channel", mu: 6, drag: 0.1, wall: 0.1 / 14 },
  ),
  track("channel", line([EXIT_X - 14, BACK_Y, SPIRAL_BOT - 0.8], [LIFT_BALL[0], LIFT_BALL[1], Z_IN], 4), { slot: "back", endStop: 0, mu: 5, drag: 0.1 }),
];

export const TRACK: Record<string, Track> = Object.fromEntries(TRACKS.map((t) => [t.id, t]));
export const TREADS = treads;

/* position and unit tangent at arc length s */
export function pointAt(t: Track, s: number): { p: V3; d: V3; i: number } {
  const c = Math.min(Math.max(s, 0), t.len);
  let lo = 0;
  let hi = t.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t.cum[mid]! <= c) lo = mid;
    else hi = mid;
  }
  const a = t.pts[lo]!;
  const b = t.pts[hi]!;
  const seg = t.cum[hi]! - t.cum[lo]! || 1;
  const f = (c - t.cum[lo]!) / seg;
  return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f], d: unit(sub(b, a)), i: lo };
}

