/* Every static part, computed once: the plinth, the wall and its zigzag, the
   screw lift's frame, the return channel and the bell gantry, the catapult's
   stand and the gutter, the spiral tower, the stairs, the domino table. Each
   group is a list of drawing items in painter's order; the live component puts
   the moving parts and the marbles into the slots between them. */
import { circleRing, cylinder, extrude, roundedPlan, onTop, pathOf, ring, sideArc, sideSeam, slabOf, topTicks, knurl, type Flat, type Plane, type SolidPaths, type Tone } from "../iso/iso-kit";
import {
  BACK_Y,
  BELL_X,
  DECK,
  DECK_H,
  DOM_N,
  DOM_T,
  DOM_W,
  FACE_X,
  GUTTER_END,
  GUTTER_X,
  LEVER_Y,
  LIFT,
  LIFT_BALL,
  P,
  PEDESTAL,
  PED_TOP,
  PIVOT,
  PLATE_BACK,
  PLATE_FRONT,
  POST_R,
  POST_TOP,
  RAIL_R,
  RAMPS,
  ROW_X,
  RX,
  SCREW_Z0,
  SCREW_Z1,
  SEAT,
  SHAFT_R,
  SKIRT_H,
  SKIRT_IN,
  SPIRAL,
  SPIRAL_R,
  STAIR_TOP,
  STAIR_X0,
  STAIR_Y,
  STEPS,
  STEP_LEN,
  STEP_RISE,
  TABLE,
  TABLE_TOP,
  TURN_C,
  WALL,
  WALL_TOP,
  at,
  domBack,
} from "./view";
import { TRACK, pointAt, type Track } from "./tracks";
import { X, Y, Z, bar, block, railsOf, tiesOf, turned, type RailRun } from "./solids";
import { add, mul, type V3 } from "./vec";

export type Item =
  | { k: "solid"; p: SolidPaths; tone?: Tone; crease?: Tone | "none"; inner?: string }
  | { k: "line"; d: string; tone?: Tone; free?: boolean }
  | { k: "dots"; pts: Flat[]; size?: number; tone?: Tone }
  | { k: "rail"; d: string; tone?: Tone }
  | { k: "halo"; d: string };

const S = (p: SolidPaths, tone: Tone = "mid", crease: Tone | "none" = "faint", inner?: string): Item => ({ k: "solid", p, tone, crease, inner });
const L = (d: string, tone: Tone = "lo", free = false): Item => ({ k: "line", d, tone, free });
const D = (pts: Flat[], size = 0.55, tone: Tone = "mid"): Item => ({ k: "dots", pts, size, tone });
const RL = (d: string, tone: Tone = "hi"): Item => ({ k: "rail", d, tone });

const seg = (a: V3, b: V3) => pathOf([at(a), at(b)]);
const post = (x: number, y: number, z0: number, z1: number, r = 1.6, steps = 16) => cylinder(x, y, r, z0, z1 - z0, P, steps);

/* --------------------------------------------------------------- polygons */
function insetRing(ring: Plane[], by: number): Plane[] {
  const n = ring.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += ring[i]![0] * ring[(i + 1) % n]![1] - ring[(i + 1) % n]![0] * ring[i]![1];
  const sign = area > 0 ? 1 : -1;
  const lines = ring.map((a, i) => {
    const b = ring[(i + 1) % n]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy);
    const nx = (-dy / l) * sign;
    const ny = (dx / l) * sign;
    return { p: [a[0] + nx * by, a[1] + ny * by] as Plane, d: [dx / l, dy / l] as Plane };
  });
  return lines.map((cur, i) => {
    const prev = lines[(i + n - 1) % n]!;
    const den = prev.d[0] * cur.d[1] - prev.d[1] * cur.d[0];
    const t = ((cur.p[0] - prev.p[0]) * cur.d[1] - (cur.p[1] - prev.p[1]) * cur.d[0]) / den;
    return [prev.p[0] + prev.d[0] * t, prev.p[1] + prev.d[1] * t] as Plane;
  });
}

/* ------------------------------------------------------------------- deck */
const SKIRT_RING = insetRing(DECK, SKIRT_IN);
const DECK_SLAB = extrude(DECK, -DECK_H, DECK_H, P, { bevel: 1.4 });
const GROOVE = insetRing(DECK, 6.5);
const SCREWS = insetRing(DECK, 11);
const LABEL = { x: 16, y: 26, w: 42, d: 15, r: 1.6 };
const RULER = { x: 103, y: -98, w: 6, d: 96, r: 1 };
const rulerTicks = topTicks(RULER.y + 3, RULER.y + RULER.d - 3, 4, 5, RULER.x + 0.6, 0.7, [2, 3.6], P, "y");
const CONTROL = { x: 26, y: 50, w: 22, d: 14, r: 2.5 };

export const DECK_ART: Item[] = [
  { k: "halo", d: extrude(SKIRT_RING, -DECK_H - SKIRT_H, SKIRT_H, P).fill },
  S(extrude(SKIRT_RING, -DECK_H - SKIRT_H, SKIRT_H, P), "lo"),
  S(DECK_SLAB, "mid", "faint"),
  L(onTop(GROOVE, 0, P, true), "faint"),
  L(SCREWS.map(([x, y]) => ring(x, y, 2.2, 0, P, 16)).join(""), "lo"),
  D(SCREWS.map(([x, y]) => at([x, y, 0])), 0.6),
  // ruler strip on the right edge
  S(slabOf(RULER, 0, 0.7, P, 2), "lo", "none"),
  L(rulerTicks.minor, "lo"),
  L(rulerTicks.major, "mid"),
  // label plate
  S(slabOf(LABEL, 0, 0.9, P, 3), "lo", "none"),
  L(onTop([[LABEL.x + 1.8, LABEL.y + 1.8], [LABEL.x + LABEL.w - 1.8, LABEL.y + 1.8], [LABEL.x + LABEL.w - 1.8, LABEL.y + LABEL.d - 1.8], [LABEL.x + 1.8, LABEL.y + LABEL.d - 1.8]], 0.9, P, true), "faint"),
  L([0, 1, 2].map((r) => onTop([[LABEL.x + 8, LABEL.y + 4.6 + r * 2.9], [LABEL.x + (r === 1 ? 26 : 34), LABEL.y + 4.6 + r * 2.9]], 0.9, P)).join(""), "lo", true),
  D([at([LABEL.x + 4, LABEL.y + LABEL.d / 2, 0.9]), at([LABEL.x + LABEL.w - 4, LABEL.y + LABEL.d / 2, 0.9])], 0.5),
  // the control box: a run switch and its lamp
  S(slabOf(CONTROL, 0, 7, P, 4, 0.8), "mid"),
  L(onTop(circleRing(CONTROL.x + 7, CONTROL.y + 7, 3.6, 28), 7, P, true), "faint"),
  S(cylinder(CONTROL.x + 7, CONTROL.y + 7, 2.8, 7, 4, P, 24, 0.5), "hi"),
  L(knurl(CONTROL.x + 7, CONTROL.y + 7, 2.8, 7, 11, 22, P), "lo"),
  L(onTop([[CONTROL.x + 5.4, CONTROL.y + 7], [CONTROL.x + 9.4, CONTROL.y + 7]], 11, P), "hi"),
  S(cylinder(CONTROL.x + 16, CONTROL.y + 7, 2, 7, 2.2, P, 20), "mid"),
  L(ring(CONTROL.x + 16, CONTROL.y + 7, 1.1, 9.2, P, 16), "lo"),
  D([at([CONTROL.x + 2.2, CONTROL.y + 2.2, 7]), at([CONTROL.x + CONTROL.w - 2.2, CONTROL.y + 2.2, 7]), at([CONTROL.x + 2.2, CONTROL.y + CONTROL.d - 2.2, 7]), at([CONTROL.x + CONTROL.w - 2.2, CONTROL.y + CONTROL.d - 2.2, 7])], 0.45),
];

/* ------------------------------------------- the reset drive on the deck */
const DRIVE = { x: -122, y: -34, w: 30, d: 20, r: 2.5 };
const WHEEL: Plane = [DRIVE.x + 10, DRIVE.y + 10];
export const DRIVE_ART: Item[] = [
  S(slabOf(DRIVE, 0, 12, P, 4, 0.8), "mid", "faint", [4, 8].map((z) => sideSeam(DRIVE, z, P, 4)).join("")),
  L(onTop(roundedPlan({ x: DRIVE.x + 19, y: DRIVE.y + 4, w: 7, d: 12, r: 1.2 }), 12, P, true), "faint"),
  ...[0, 1, 2].map((k) => L(onTop(roundedPlan({ x: DRIVE.x + 20 + k * 2, y: DRIVE.y + 5.5, w: 0.9, d: 9, r: 0.45 }, 2), 12, P, true), "lo")),
  S(cylinder(WHEEL[0], WHEEL[1], 3, 12, 2.5, P, 20), "mid"),
  S(cylinder(WHEEL[0], WHEEL[1], 8, 14.5, 3, P, 40, 0.6), "hi", "lo"),
  L(knurl(WHEEL[0], WHEEL[1], 8, 14.5, 17.5, 40, P), "lo"),
  L(ring(WHEEL[0], WHEEL[1], 2.4, 17.5, P, 20), "lo"),
  D([at([WHEEL[0] + 5, WHEEL[1], 17.5])], 0.8, "hi"),
  D([at([DRIVE.x + 2.5, DRIVE.y + 2.5, 12]), at([DRIVE.x + DRIVE.w - 2.5, DRIVE.y + 2.5, 12]), at([DRIVE.x + 2.5, DRIVE.y + DRIVE.d - 2.5, 12]), at([DRIVE.x + DRIVE.w - 2.5, DRIVE.y + DRIVE.d - 2.5, 12])], 0.45),
];

/* --------------------------------------------------------------- the wall */
const WALL_SLAB = slabOf(WALL, 0, WALL_TOP, P, 3, 1);
const CAP = { x: WALL.x - 2, y: WALL.y - 2, w: WALL.w + 4, d: WALL.d + 4, r: 2 };
const SEAMS_Y = [-64, -8, 48];
const GUSSETS_Y = [-112, -36, 30, 58];
export const WALL_ART: Item[] = [
  S(WALL_SLAB, "mid", "faint", SEAMS_Y.map((y) => seg([FACE_X, y, 0], [FACE_X, y, WALL_TOP])).join("")),
  S(slabOf(CAP, WALL_TOP, 4, P, 3, 0.8), "mid"),
  D(
    SEAMS_Y.flatMap((y) => [at([FACE_X, y - 3, WALL_TOP - 6]), at([FACE_X, y + 3, WALL_TOP - 6]), at([FACE_X, y - 3, 6]), at([FACE_X, y + 3, 6])]),
    0.5,
  ),
  ...GUSSETS_Y.map((y) => S(block(FACE_X, y - 1.2, 0, FACE_X + 7, y + 1.2, 9), "mid")),
];

/* ------------------------------------------------------- lift: frame */
// two guide rods in front of the rising marble, wide enough apart for it to roll out between them at the top
const ROD_A: Plane = [LIFT_BALL[0] + 8, LIFT_BALL[1] + 4];
const ROD_B: Plane = [LIFT_BALL[0] - 8, LIFT_BALL[1] + 4];
export const GUIDE_RODS: Plane[] = [ROD_B, ROD_A];
const HEAD = { x: FACE_X, y: LIFT[1] - 10, w: ROD_A[0] + 4 - FACE_X, d: 26, r: 2 };
const MOTOR = { x: -120, y: -116, w: 12, d: 13, r: 2 };
const MOTOR_P: Plane = [MOTOR.x + MOTOR.w / 2, MOTOR.y + MOTOR.d / 2];
const PULLEY_Z = PED_TOP + 13;

function belt(a: Plane, ra: number, b: Plane, rb: number, z: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  const nx = -dy / l;
  const ny = dx / l;
  return [1, -1].map((s) => seg([a[0] + nx * ra * s, a[1] + ny * ra * s, z], [b[0] + nx * rb * s, b[1] + ny * rb * s, z])).join("");
}

export const PEDESTAL_ART: Item[] = [
  S(slabOf(PEDESTAL, 0, PED_TOP, P, 3, 1), "mid", "faint", sideSeam(PEDESTAL, 4, P, 3)),
  L(onTop(circleRing(LIFT_BALL[0], LIFT_BALL[1], 7.5, 32), PED_TOP, P, true), "faint"),
  D([at([PEDESTAL.x + 3, PEDESTAL.y + PEDESTAL.d - 3, PED_TOP]), at([PEDESTAL.x + PEDESTAL.w - 3, PEDESTAL.y + PEDESTAL.d - 3, PED_TOP]), at([PEDESTAL.x + PEDESTAL.w - 3, PEDESTAL.y + 3, PED_TOP])], 0.5),
  // the motor that turns the screw, and its belt
  S(slabOf(MOTOR, PED_TOP, 10, P, 3, 0.6), "mid", "faint", [3, 6].map((z) => sideSeam(MOTOR, PED_TOP + z, P, 3)).join("")),
  S(cylinder(MOTOR_P[0], MOTOR_P[1], 2, PED_TOP + 10, 2, P, 16), "mid"),
  S(cylinder(MOTOR_P[0], MOTOR_P[1], 3.4, PULLEY_Z - 1, 2.6, P, 24), "hi"),
  S(cylinder(LIFT[0], LIFT[1], 6, PULLEY_Z - 1, 2.6, P, 28), "hi"),
  L(belt(MOTOR_P, 3.4, LIFT, 6, PULLEY_Z + 1.6), "mid"),
  S(cylinder(LIFT[0], LIFT[1], 6.5, PED_TOP, 3, P, 28, 0.5), "mid"),
];

/* drawn behind the marble in the lift: the shaft and the far rod */
export const LIFT_BACK: Item[] = [S(cylinder(LIFT[0], LIFT[1], SHAFT_R, SCREW_Z0, SCREW_Z1 - SCREW_Z0, P, 24), "mid", "faint", [40, 80, 120].map((z) => sideArc(LIFT[0], LIFT[1], SHAFT_R, z, P, 12)).join(""))];
/* drawn after it: the guide rods, the head plate with its bearing */
export const LIFT_FRONT: Item[] = [
  ...GUIDE_RODS.map(([x, y]) => S(post(x, y, PED_TOP, SCREW_Z1, 1.4), "mid", "none")),
  ...GUIDE_RODS.map(([x, y]) => S(cylinder(x, y, 2.6, PED_TOP, 2.4, P, 16), "mid")),
  S(slabOf(HEAD, SCREW_Z1, 6, P, 3, 0.8), "mid", "faint"),
  S(cylinder(LIFT[0], LIFT[1], 5, SCREW_Z1 + 6, 3, P, 24, 0.5), "hi"),
  L(ring(LIFT[0], LIFT[1], 2.2, SCREW_Z1 + 9, P, 16), "lo"),
  D([at([HEAD.x + 3, HEAD.y + 3, SCREW_Z1 + 6]), at([HEAD.x + HEAD.w - 3, HEAD.y + 3, SCREW_Z1 + 6]), at([HEAD.x + 3, HEAD.y + HEAD.d - 3, SCREW_Z1 + 6]), at([HEAD.x + HEAD.w - 3, HEAD.y + HEAD.d - 3, SCREW_Z1 + 6])], 0.5),
];

/* ---------------------------------------------------------- rails helper */
interface TrackArt {
  far: Item[];
  near: Item[];
  ties: Item[];
}
function trackArt(track: Track, o: { ties?: number; trim?: [number, number]; reach?: [number, number]; tone?: Tone; tieDrop?: number } = {}): TrackArt {
  const runs: RailRun[] = railsOf(track, o.trim);
  const ties = o.ties ? tiesOf(track, o.ties, { reach: o.reach, drop: o.tieDrop }).map((t) => S(t.paths, "mid")) : [];
  return {
    far: runs.filter((r) => !r.near).map((r) => RL(r.d, o.tone)),
    near: runs.filter((r) => r.near).map((r) => RL(r.d, o.tone)),
    ties,
  };
}

/* ---------------------------------------------------------- ramps */
function brackets(): Item[] {
  const items: Item[] = [];
  RAMPS.forEach((ramp) => {
    const n = 4;
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n;
      const p = add(ramp.from, mul([ramp.to[0] - ramp.from[0], ramp.to[1] - ramp.from[1], ramp.to[2] - ramp.from[2]], f));
      const z = p[2] - SEAT - RAIL_R - 0.9;
      items.push(S(block(FACE_X, p[1] - 3, z - 4, FACE_X + 1.4, p[1] + 3, z + 3), "mid"));
      items.push(S(bar([FACE_X + 1.4, p[1], z], [RX + 8, p[1], z], 2.6, 1.8), "mid"));
      items.push(D([at([FACE_X + 1.4, p[1], z - 2.4])], 0.5));
    }
  });
  return items;
}

const RAMP_TRACKS = [TRACK.ramp1!, TRACK.ramp2!, TRACK.ramp3!];
const rampArts = RAMP_TRACKS.map((t, i) => trackArt(t, { trim: i === 0 ? [2, 0] : [0, 0] }));
const chuteArt = trackArt(TRACK.chute!, { ties: 7, reach: [8, 8] });
const CHUTE_END = TRACK.chute!.pts[TRACK.chute!.pts.length - 1]!;
const CHUTE_POST: Plane = [CHUTE_END[0] - 6, CHUTE_END[1] - 6];

export const RAMPS_BACK: Item[] = [
  // the bumper plate by the lift sits behind the marble that bounces off it
  S(block(FACE_X + 1.4, PLATE_BACK - 2, RAMPS[2]!.from[2] - SEAT - 3, RX + 6, PLATE_BACK, RAMPS[1]!.to[2] + 9), "mid", "faint"),
  ...brackets(),
  ...rampArts.flatMap((a) => a.far),
  ...chuteArt.ties,
  S(post(CHUTE_POST[0], CHUTE_POST[1], 0, CHUTE_END[2] - SEAT - RAIL_R - 1.8, 1.8), "mid", "none"),
  S(cylinder(CHUTE_POST[0], CHUTE_POST[1], 3.4, 0, 1.6, P, 20), "mid"),
  S(bar([TURN_C[0] - 18, TURN_C[1], 72], [FACE_X + 1.4, TURN_C[1], 72], 2.6, 1.8), "mid"),
  ...chuteArt.far,
];
export const RAMPS_FRONT: Item[] = [
  ...rampArts.flatMap((a) => a.near),
  ...chuteArt.near,
  // bumper plates at the switchbacks
  S(block(FACE_X + 1.4, PLATE_FRONT, RAMPS[1]!.from[2] - SEAT - 3, RX + 8, PLATE_FRONT + 2, RAMPS[0]!.to[2] + 9), "mid", "faint"),
  D([at([RX + 4, PLATE_FRONT + 2, RAMPS[0]!.to[2] + 6]), at([RX - 8, PLATE_FRONT + 2, RAMPS[0]!.to[2] + 6])], 0.5),
];

/* ------------------------------------------- exit straight, channel, bell */
const exitArt = trackArt(TRACK.exit!, { ties: 10 });
const channelArt = trackArt(TRACK.channel!, { ties: 12, trim: [0, 11] });
function trestles(track: Track, every: number, from: number, to: number): Item[] {
  const items: Item[] = [];
  for (let s = from; s <= to; s += every) {
    const { p } = pointAt(track, s);
    const top = p[2] - SEAT - RAIL_R - 1.8;
    items.push(S(post(p[0], p[1], 0, top, 1.3, 14), "mid", "none"));
    items.push(S(cylinder(p[0], p[1], 2.8, 0, 1.2, P, 18), "mid"));
  }
  return items;
}
export const GANTRY = { far: [BELL_X + 9, BACK_Y - 10] as Plane, near: [BELL_X + 9, BACK_Y + 10] as Plane, z: 50 };
export const BELL: V3 = [BELL_X - 14, BACK_Y, 33];
export const CHANNEL_BACK: Item[] = [
  S(post(GANTRY.far[0], GANTRY.far[1], 0, GANTRY.z, 1.8), "mid", "none"),
  S(cylinder(GANTRY.far[0], GANTRY.far[1], 3.4, 0, 1.6, P, 20), "mid"),
  ...trestles(TRACK.exit!, 26, 8, TRACK.exit!.len - 4),
  ...trestles(TRACK.channel!, 34, 14, TRACK.channel!.len - 30),
  ...exitArt.ties,
  ...channelArt.ties,
  ...exitArt.far,
  ...channelArt.far,
];
export const BELL_ART: Item[] = [
  S(turned([BELL[0], BELL[1], BELL[2]], Z, 5.6, 3.4, 8, 32), "hi", "lo"),
  S(turned([BELL[0], BELL[1], BELL[2] + 8], Z, 1.6, 1.6, GANTRY.z - 1 - (BELL[2] + 8), 14), "mid", "none"),
];
export const CHANNEL_FRONT: Item[] = [
  ...exitArt.near,
  ...channelArt.near,
  S(post(GANTRY.near[0], GANTRY.near[1], 0, GANTRY.z, 1.8), "mid", "none"),
  S(cylinder(GANTRY.near[0], GANTRY.near[1], 3.4, 0, 1.6, P, 20), "mid"),
  S(bar([GANTRY.far[0], GANTRY.far[1] - 2, GANTRY.z + 1.2], [GANTRY.near[0], GANTRY.near[1] + 2, GANTRY.z + 1.2], 3.4, 2.4, Z), "mid"),
  S(bar([GANTRY.far[0], BACK_Y, GANTRY.z - 0.6], [BELL[0] - 2, BACK_Y, GANTRY.z - 0.6], 2.6, 2, Z), "mid"),
  S(block(BELL_X - 1.6, BACK_Y - 4.2, 46, BELL_X + 1.6, BACK_Y - 2.6, GANTRY.z - 1.6), "mid"),
  S(turned([BELL_X, BACK_Y - 3, 46], Y, 1.1, 1.1, 6, 14), "mid", "none"),
  D([at([GANTRY.far[0], GANTRY.far[1], GANTRY.z + 2.4]), at([GANTRY.near[0], GANTRY.near[1], GANTRY.z + 2.4])], 0.5),
];

/* ------------------------------------------------------- catapult stand */
const gutterArt = trackArt(TRACK.gutter!, { ties: 12 });
const STAND = { x: PIVOT[0] - 7, y: LEVER_Y - 9, w: 14, d: 18, r: 1.5 };
export const LEVER_BACK: Item[] = [
  // rest pad under the cup end and the stop under the struck end
  S(block(-56, LEVER_Y - 3.5, 0, -50, LEVER_Y + 3.5, 11.4), "lo"),
  S(block(-24, LEVER_Y - 4, 0, -16, LEVER_Y + 4, 8.2), "lo"),
  S(slabOf(STAND, 0, 3, P, 2, 0.6), "mid"),
  S(block(PIVOT[0] - 2.5, LEVER_Y - 7, 3, PIVOT[0] + 2.5, LEVER_Y - 4.5, PIVOT[2] + 3), "mid"),
  ...trestles(TRACK.gutter!, 30, 8, TRACK.gutter!.len - 4),
  ...gutterArt.ties,
  ...gutterArt.far,
];
export const GATE_HOUSING: Item[] = [S(block(GUTTER_X - 5.5, GUTTER_END - 9.2, 0, GUTTER_X + 5.5, GUTTER_END - 6.2, 8.2), "mid")];
export const LEVER_PIN: Item[] = [S(turned([PIVOT[0], LEVER_Y - 7, PIVOT[2]], Y, 1.5, 1.5, 14, 16), "hi", "lo")];
export const LEVER_FRONT: Item[] = [
  ...gutterArt.near,
  S(block(PIVOT[0] - 2.5, LEVER_Y + 4.5, 3, PIVOT[0] + 2.5, LEVER_Y + 7, PIVOT[2] + 3), "mid"),
  D([at([PIVOT[0], LEVER_Y + 7, PIVOT[2]])], 0.9, "hi"),
];

/* ---------------------------------------------------------------- spiral */
const spiral = TRACK.spiral!;
const spiralRuns = railsOf(spiral);
function spokes(): { back: Item[]; front: Item[] } {
  const back: Item[] = [];
  const front: Item[] = [];
  const startS = 34; // after the straight scoop
  for (let s = startS; s <= spiral.len - 6; s += 15) {
    const { p } = pointAt(spiral, s);
    const nx = p[0] - SPIRAL[0];
    const ny = p[1] - SPIRAL[1];
    const l = Math.hypot(nx, ny);
    const z = p[2] - SEAT - RAIL_R - 0.9;
    const a: V3 = [SPIRAL[0] + (nx / l) * (POST_R - 0.2), SPIRAL[1] + (ny / l) * (POST_R - 0.2), z];
    const b: V3 = [SPIRAL[0] + (nx / l) * (SPIRAL_R + 8), SPIRAL[1] + (ny / l) * (SPIRAL_R + 8), z];
    const item = S(bar(a, b, 2.6, 1.8), "mid");
    ((nx * 0.707 + ny * 0.707 > 0 ? front : back) as Item[]).push(item);
  }
  return { back, front };
}
const SPOKES = spokes();
const scoopTies = tiesOf(spiral, 8, { from: 4, to: 30 }).map((t) => S(t.paths, "mid"));
const SCOOP_Z = spiral.pts[0]![2];
export const SPIRAL_BACK: Item[] = [
  S(cylinder(SPIRAL[0], SPIRAL[1], 36, 0, 4, P, 72, 0.8), "mid", "faint"),
  L(ring(SPIRAL[0], SPIRAL[1], 31, 4, P, 64), "faint"),
  S(cylinder(SPIRAL[0], SPIRAL[1], POST_R + 3, 4, 4, P, 28, 0.5), "mid"),
  ...SPOKES.back,
  // the scoop's strut from the post and its back wall
  S(bar([SPIRAL[0], SPIRAL[1], SCOOP_Z - 10], [SPIRAL[0] - 26, SPIRAL[1] - SPIRAL_R, SCOOP_Z - 10], 2.4, 2.2), "mid"),
  S(bar([SPIRAL[0] - 26, SPIRAL[1] - SPIRAL_R, SCOOP_Z - 10], [SPIRAL[0] - 26, SPIRAL[1] - SPIRAL_R, SCOOP_Z - SEAT - RAIL_R - 1.6], 2, 2, X), "mid"),
  ...scoopTies,
  S(block(SPIRAL[0] - 31, SPIRAL[1] - SPIRAL_R - 8.6, SCOOP_Z - SEAT - 2, SPIRAL[0] - 2, SPIRAL[1] - SPIRAL_R - 7.4, SCOOP_Z + 5), "mid"),
  ...spiralRuns.filter((r) => r.side === 1 && !r.near).map((r) => RL(r.d)),
];
export const SPIRAL_MID: Item[] = [
  ...spiralRuns.filter((r) => r.side === -1 && r.near).map((r) => RL(r.d)),
  S(cylinder(SPIRAL[0], SPIRAL[1], POST_R, 8, POST_TOP - 8, P, 28), "mid", "faint", [30, 56, 82].map((z) => sideArc(SPIRAL[0], SPIRAL[1], POST_R, z, P, 16)).join("")),
  S(cylinder(SPIRAL[0], SPIRAL[1], POST_R + 1.6, POST_TOP, 3, P, 28, 0.6), "hi"),
  L(ring(SPIRAL[0], SPIRAL[1], 2, POST_TOP + 3, P, 16), "lo"),
  ...SPOKES.front,
  ...spiralRuns.filter((r) => r.side === -1 && !r.near).map((r) => RL(r.d)),
];
export const SPIRAL_FRONT: Item[] = [...spiralRuns.filter((r) => r.side === 1 && r.near).map((r) => RL(r.d))];

/* ---------------------------------------------------------------- stairs */
const STAIR_Y0 = STAIR_Y - 9;
const STAIR_Y1 = STAIR_Y + 9;
export const STAIRS_ART: Item[] = [
  ...Array.from({ length: STEPS }, (_, k) => {
    const x0 = STAIR_X0 + k * STEP_LEN;
    return S(block(x0, STAIR_Y0 - 2, 0, x0 + STEP_LEN, STAIR_Y0, STAIR_TOP - k * STEP_RISE + 4), "mid");
  }),
  ...Array.from({ length: STEPS }, (_, k) => {
    const x0 = STAIR_X0 + k * STEP_LEN;
    const z = STAIR_TOP - k * STEP_RISE;
    return S(block(x0, STAIR_Y0, 0, x0 + STEP_LEN, STAIR_Y1, z), "hi", "faint");
  }),
  L(Array.from({ length: STEPS }, (_, k) => onTop([[STAIR_X0 + k * STEP_LEN, STAIR_Y], [STAIR_X0 + (k + 1) * STEP_LEN, STAIR_Y]], STAIR_TOP - k * STEP_RISE, P)).join(""), "faint"),
  D(Array.from({ length: STEPS }, (_, k) => at([STAIR_X0 + k * STEP_LEN + STEP_LEN - 2.5, STAIR_Y1 - 2.5, STAIR_TOP - k * STEP_RISE])), 0.45),
];

/* ----------------------------------------------------------------- table */
const runArt = trackArt(TRACK.runout!, {});
const sideArt = trackArt(TRACK.side!, { ties: 9, trim: [8, 0] });
const ROW = { x: ROW_X - DOM_W / 2 - 2, y: domBack(DOM_N - 1) - DOM_T - 3, w: DOM_W + 4, d: domBack(0) - domBack(DOM_N - 1) + DOM_T + 4, r: 1 };
const TRULER = { x: TABLE.x + TABLE.w - 9, y: -40, w: 5, d: 80, r: 0.8 };
const tableTicks = topTicks(TRULER.y + 2, TRULER.y + TRULER.d - 2, 4, 5, TRULER.x + 0.6, TABLE_TOP + 0.6, [1.6, 3], P, "y");
export const TABLE_ART: Item[] = [
  S(slabOf(TABLE, 0, TABLE_TOP, P, 4, 1), "mid", "faint", sideSeam(TABLE, 4, P, 4)),
  L(onTop(roundedRing(TABLE, 4.5), TABLE_TOP, P, true), "faint"),
  D([at([TABLE.x + 3, TABLE.y + 3, TABLE_TOP]), at([TABLE.x + TABLE.w - 3, TABLE.y + 3, TABLE_TOP]), at([TABLE.x + 3, TABLE.y + TABLE.d - 3, TABLE_TOP]), at([TABLE.x + TABLE.w - 3, TABLE.y + TABLE.d - 3, TABLE_TOP])], 0.55),
  S(slabOf(ROW, TABLE_TOP, 0.9, P, 2), "lo", "none"),
  S(slabOf(TRULER, TABLE_TOP, 0.6, P, 2), "lo", "none"),
  L(tableTicks.minor, "lo"),
  L(tableTicks.major, "mid"),
  ...Array.from({ length: DOM_N }, (_, i) => S(turned([ROW_X - DOM_W / 2, domBack(i) - DOM_T - 0.2, TABLE_TOP + 1.3], X, 0.9, 0.9, DOM_W, 12), "mid", "none")),
  ...runArt.far,
  ...sideArt.ties,
  ...sideArt.far,
];
export const TABLE_FRONT: Item[] = [...runArt.near, ...sideArt.near];

function roundedRing(plan: { x: number; y: number; w: number; d: number; r: number }, inset: number): Plane[] {
  const p = { x: plan.x + inset, y: plan.y + inset, w: plan.w - inset * 2, d: plan.d - inset * 2, r: Math.max(0, plan.r - inset) };
  return [
    [p.x, p.y],
    [p.x + p.w, p.y],
    [p.x + p.w, p.y + p.d],
    [p.x, p.y + p.d],
  ];
}

