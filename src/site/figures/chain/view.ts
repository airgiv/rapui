/* The world of the chain reaction: one compact marble machine on a chamfered
   plinth, in world units (x, y on the floor, z up; 1 unit ≈ 4.1 mm, so the
   wooden marble is 49 mm across and g = 9.81 m/s² is 2400 units/s²), the
   camera, and the projection every drawing and every moving part shares. */
import { iso, type Flat, type Plane, type Point3, type Projection } from "../iso/iso-kit";
import type { V3 } from "./vec";

export const WIDTH = 640;
export const HEIGHT = 560;

/* physics */
export const G = 2400; // units / s²
export const MM = 9.81 / G; // metres per unit (≈ 4.09 mm)
export const R = 6; // marble radius
export const RAIL_GAP = 5; // rails sit ±5 either side of the ball's line
export const RAIL_R = 1.3; // rail bar radius
export const SEAT = Math.sqrt((R + RAIL_R) ** 2 - RAIL_GAP ** 2); // ball centre above the rail centres

/* the plinth: a chamfered polygon, deck top at z = 0 */
export const DECK: Plane[] = [
  [-150, -128],
  [92, -128],
  [114, -106],
  [114, 6],
  [40, 84],
  [-126, 84],
  [-168, 42],
  [-168, -110],
];
export const DECK_H = 9;
export const SKIRT_H = 8;
export const SKIRT_IN = 5;

/* the wall the zigzag hangs on (its +x face is the one you see) */
export const WALL = { x: -158, y: -120, w: 12, d: 184, r: 1.5 };
export const WALL_TOP = 198;
export const FACE_X = WALL.x + WALL.w; // -146

/* the screw lift in front of the wall's back end */
export const LIFT: Plane = [-131, -92];
export const LIFT_BALL: Plane = [-131, -80]; // where the marble rides up, on the flight's front
export const PEDESTAL = { x: -144, y: -118, w: 38, d: 54, r: 3 };
export const PED_TOP = 14;
export const Z_IN = PED_TOP + R; // marble centre waiting in the intake pocket
export const Z_OUT = 174; // marble centre where the flight hands it to ramp 1
export const PITCH = 24; // flight pitch
export const V_LIFT = 50; // rise speed, units/s
export const SCREW_R = 11; // flight (wire) radius
export const SHAFT_R = 3.4;
export const SCREW_Z0 = PED_TOP + 1;
export const SCREW_Z1 = 184;

/* ramps on the wall: the marble's line is x = -131 */
export const RX = -131;
export const RAMP_Y0 = -80; // ramp 1 starts at the lift
export const RAMP_YE = 46; // far end, near the wall's front
export const RAMP_YB = -70; // near end, by the lift
export const PLATE_FRONT = 56; // the bumper plate at the wall's front end (marble stops at 50)
export const PLATE_BACK = -76; // the bumper plate by the lift (marble stops at -70)
export const RAMPS: { from: V3; to: V3 }[] = [
  { from: [RX, RAMP_Y0, Z_OUT], to: [RX, RAMP_YE, 154] },
  { from: [RX, 50, 136], to: [RX, RAMP_YB, 116] },
  { from: [RX, RAMP_YB, 98], to: [RX, 50, 79] },
];

/* the quarter-turn chute that brings the marble off the wall onto the stairs */
export const TURN_C: Plane = [-113, 50];
export const TURN_R = 18;
export const STAIR_Y = 68;
export const CHUTE_END_X = -106;

/* the stairs: treads descending along +x */
export const STEP_LEN = 14;
export const STEP_RISE = 11;
export const STEPS = 4;
export const STAIR_X0 = -106; // back of the top tread
export const STAIR_TOP = 60; // top tread surface
export const STAIR_W = 18; // across (y)

/* the domino table, the run-out and the domino row */
export const TABLE = { x: -50, y: -48, w: 54, d: 128, r: 3 };
export const TABLE_TOP = 14;
export const ROW_X = -18;
export const DOM_T = 4; // thickness (y)
export const DOM_W = 14; // width (x)
export const DOM_H = 24; // height
export const DOM_N = 7;
export const DOM_GAP = 13; // pitch along the row
export const DOM_BACK0 = 40; // back face of the first domino (the marble hits it here)
export const domBack = (i: number) => DOM_BACK0 - DOM_GAP * i;
export const RUN_C: Plane = [-38, 48];
export const RUN_R = 20;

/* the catapult behind the row */
export const LEVER_Y = -62;
export const PIVOT: V3 = [-36, LEVER_Y, 22];
export const ARM_CUP = 26; // pivot to cup
export const ARM_HIT = 18; // pivot to the struck paddle
export const LEVER_REST = -20; // cup arm angle at rest (degrees, + is up)
export const LEVER_SHOT = 30; // cup arm angle at the stop
export const CUP_R = 6.5;

/* the gutter that takes the striking marble back to the cup */
export const GUTTER_X = -62;
export const GUTTER_END = -51; // the gate, just short of the cup

/* the spiral */
export const SPIRAL: Plane = [60, -36];
export const SPIRAL_R = 26;
export const SPIRAL_TOP = 92;
export const SPIRAL_BOT = 22;
export const SPIRAL_TURNS = 1.75;
export const POST_R = 4.5;
export const POST_TOP = 104;

/* the exit straight, the bell and the return channel */
export const EXIT_X = SPIRAL[0] - SPIRAL_R; // 34
export const BACK_Y = -80; // the return channel's line
export const BELL_Y = -52;

/* camera */
export const AZIMUTH = 45;
const extremes: Point3[] = [
  ...DECK.map(([x, y]) => [x, y, -DECK_H - SKIRT_H] as Point3),
  ...DECK.map(([x, y]) => [x, y, 0] as Point3),
  [WALL.x, WALL.y, WALL_TOP],
  [WALL.x, WALL.y + WALL.d, WALL_TOP],
  [WALL.x + WALL.w, WALL.y, WALL_TOP],
];

function fit(points: Point3[], pad: number): Projection {
  const unitP: Projection = { origin: [0, 0], scale: 1, azimuth: AZIMUTH };
  const flat = points.map((p) => iso(p, unitP));
  const xs = flat.map(([x]) => x);
  const ys = flat.map(([, y]) => y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const up = Math.min(...ys);
  const down = Math.max(...ys);
  const scale = Math.min((WIDTH - pad * 2) / (right - left), (HEIGHT - pad * 2) / (down - up));
  return { origin: [WIDTH / 2 - ((left + right) / 2) * scale, HEIGHT / 2 - ((up + down) / 2) * scale + 4], scale, azimuth: AZIMUTH };
}

export const P = fit(extremes, 22);
export const at = (p: V3 | Point3): Flat => iso(p as Point3, P);
export const K = P.scale * Math.sqrt(1.6); // screen units per world unit

const A = AZIMUTH * (Math.PI / 180);
const E = 30 * (Math.PI / 180);
export const VIEW: V3 = [Math.cos(A) * Math.cos(E), Math.sin(A) * Math.cos(E), Math.sin(E)]; // toward the viewer
export const LIGHT: [number, number] = [-Math.sin(A), Math.cos(A)]; // the kit's floor light
export const depth = (p: V3) => p[0] * VIEW[0] + p[1] * VIEW[1] + p[2] * VIEW[2];
