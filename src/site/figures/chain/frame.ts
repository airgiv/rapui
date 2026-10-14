/* The parts that move or change shape, rebuilt for one instant of the run:
   the screw's wire, the seven dominoes, the catapult (arm, cup, paddle, spring,
   gate), the hammer and the bell's shiver. Everything else is static art. */
import { pathOf, type Flat, type SolidPaths } from "../iso/iso-kit";
import { DOM_H, DOM_N, DOM_T, DOM_W, ROW_X, TABLE_TOP, domBack, LIFT, SCREW_R, SCREW_Z0, SCREW_Z1, PITCH, Z_IN, PIVOT, ARM_CUP, ARM_HIT, LEVER_REST, LEVER_SHOT, CUP_R, GUTTER_X, GUTTER_END, BELL_X, BACK_Y, VIEW, at, K } from "./view";
import { RAD, add, dot, mul, rotate, sub, type V3 } from "./vec";
import { X, Y, Z, bar, box, turned } from "./solids";
import { dominoAt, hammerAt, leverAt, ringAt, screwAt } from "./model";

/* ------------------------------------------------------------ screw wire */
const WIRE_STEPS = 18; // per turn
/* the flight's height at world angle a (radians from +x), for the screw turned by s */
const PHASE0 = Z_IN - 5.2 - PITCH / 4;
export function screwWire(turn: number): { back: string; front: string } {
  const back: Flat[][] = [];
  const front: Flat[][] = [];
  const lo = SCREW_Z0 + 2;
  const hi = SCREW_Z1 - 3;
  // angle range so the wire spans lo..hi
  const zAt = (a: number) => PHASE0 + (PITCH * (a + turn)) / (Math.PI * 2);
  let a = ((lo - PHASE0) / PITCH) * Math.PI * 2 - turn;
  const end = ((hi - PHASE0) / PITCH) * Math.PI * 2 - turn;
  let run: Flat[] = [];
  let near: boolean | null = null;
  const step = (Math.PI * 2) / WIRE_STEPS;
  for (; a <= end + 1e-9; a += step) {
    const p: V3 = [LIFT[0] + SCREW_R * Math.cos(a), LIFT[1] + SCREW_R * Math.sin(a), zAt(a)];
    const isNear = Math.cos(a) * VIEW[0] + Math.sin(a) * VIEW[1] > 0;
    const f = at(p);
    if (near === null) near = isNear;
    if (isNear !== near) {
      run.push(f);
      (near ? front : back).push(run);
      run = [f];
      near = isNear;
      continue;
    }
    run.push(f);
  }
  if (run.length > 1) (near ? front : back).push(run);
  return { back: back.map((r) => pathOf(r)).join(""), front: front.map((r) => pathOf(r)).join("") };
}

/* ------------------------------------------------------------- dominoes */
export function domino(i: number, angle: number): SolidPaths {
  const hinge: V3 = [ROW_X, domBack(i) - DOM_T, TABLE_TOP + 0.9];
  const rest: V3 = [ROW_X, domBack(i) - DOM_T / 2, TABLE_TOP + 0.9 + DOM_H / 2];
  const c = add(hinge, rotate(sub(rest, hinge), X, angle));
  return box(c, [X, rotate(Y, X, angle), rotate(Z, X, angle)], [DOM_W / 2, DOM_T / 2, DOM_H / 2]);
}
export const dominoesAt = (t: number, calm: boolean) => Array.from({ length: DOM_N }, (_, i) => domino(i, dominoAt(t, i, calm)));

/* ------------------------------------------------------------- catapult */
export interface Lever {
  beam: SolidPaths;
  paddle: SolidPaths;
  cup: SolidPaths;
  lip: string;
  spring: string;
  gate: SolidPaths;
}
const BEAM_W = 5;
const BEAM_H = 3;
export function leverParts(angle: number): Lever {
  const a = angle * RAD;
  const along: V3 = [-Math.cos(a), 0, Math.sin(a)]; // pivot → cup
  const up: V3 = [Math.sin(a), 0, Math.cos(a)];
  const cupEnd = add(PIVOT, mul(along, ARM_CUP));
  const hitEnd = add(PIVOT, mul(along, -ARM_HIT));
  const beam = bar(add(hitEnd, mul(along, -3)), add(cupEnd, mul(along, 3)), BEAM_W, BEAM_H, up);
  const paddleC = add(add(PIVOT, mul(along, -(ARM_HIT - 1))), mul(up, BEAM_H / 2 + 0.8));
  const paddle = box(paddleC, [along, Y, up], [6, 7.5, 0.8]);
  const cupBase = add(cupEnd, mul(up, BEAM_H / 2));
  const cup = turned(cupBase, up, CUP_R - 2, CUP_R, 3.6, 28);
  // the near half of the cup's rim, drawn over a marble sitting in it
  const rimC = add(cupBase, mul(up, 3.6));
  const u = Y;
  const v: V3 = [Math.cos(a), 0, -Math.sin(a)];
  const lip: Flat[] = [];
  const facing = Math.atan2(dot(VIEW, v), dot(VIEW, u));
  for (let k = 0; k <= 24; k++) {
    const t = facing - Math.PI / 2 + (k / 24) * Math.PI;
    lip.push(at(add(rimC, add(mul(u, CUP_R * Math.cos(t)), mul(v, CUP_R * Math.sin(t))))));
  }
  // the spring that yanks the struck end down, from its deck anchor to the arm
  const top = add(add(PIVOT, mul(along, -(ARM_HIT - 6))), mul(up, -BEAM_H / 2));
  const anchor: V3 = [top[0], top[1], 2.2];
  const turns = 7;
  const coil: Flat[] = [];
  for (let k = 0; k <= turns * 14; k++) {
    const f = k / (turns * 14);
    const t = f * turns * Math.PI * 2;
    coil.push(at([anchor[0] + 1.9 * Math.cos(t), anchor[1] + 1.9 * Math.sin(t), anchor[2] + (top[2] - anchor[2]) * f]));
  }
  // the gate: lifted out of its housing while the arm is up
  const lift = ((angle - LEVER_REST) / (LEVER_SHOT - LEVER_REST)) * 7.5;
  const gate = box([GUTTER_X, GUTTER_END - 7.3, 4 + lift], [X, Y, Z], [4.4, 0.6, 4.6]);
  return { beam, paddle, cup, lip: pathOf(lip), spring: pathOf(coil), gate };
}
export const leverAtTime = (t: number) => leverParts(leverAt(t));

/* -------------------------------------------------------------- hammer */
export const HAMMER_PIVOT: V3 = [BELL_X, BACK_Y, 46];
export const HAMMER_LEN = 16;
export const STRIKE = 36 * RAD;
export function hammerParts(swing: number): { rod: SolidPaths; head: SolidPaths } {
  const a = swing * STRIKE;
  const down: V3 = rotate([0, 0, -1], Y, a); // swings toward -x, into the bell
  const rod = bar(add(HAMMER_PIVOT, mul(down, -1)), add(HAMMER_PIVOT, mul(down, HAMMER_LEN)), 1.4, 1.4, X);
  const headC = add(HAMMER_PIVOT, mul(down, 11));
  const side = rotate(X, Y, a);
  const head = turned(add(headC, mul(side, -2.2)), side, 2.1, 2.1, 4.4, 20);
  return { rod, head };
}
export const hammerAtTime = (t: number, calm: boolean) => hammerParts(hammerAt(t, calm));
export const bellShiver = (t: number, calm: boolean) => {
  const d = ringAt(t, calm) * 0.45 * K;
  return d ? `translate(${(-d * 0.7).toFixed(2)} ${(d * 0.35).toFixed(2)})` : "";
};

export const screwAtTime = (t: number) => screwWire(screwAt(t));
