/* Every static path of the component factory, built once at module load.
   Layers are SVG strings in painter's order (back to front); the live
   component places them around the parts that move. */
import {
  cameraOf,
  corners,
  cylinder,
  depthOf,
  dotsSvg,
  extrude,
  faceTextSvg,
  haloOf,
  insetPlan,
  knurl,
  lineOnTop,
  lineSvg,
  onTop,
  pathOf,
  planOutline,
  ring,
  segment,
  sideMatrix,
  sideRing,
  sideSeam,
  slabOf,
  solidSvg,
  topTicks,
  type Flat,
  type LineStyle,
  type Plan,
  type Plane,
  type Point3,
  type SolidPaths,
  type SolidStyle,
} from "../iso/iso-kit";
import { PRESETS, DIAL_FIRST, DIAL_STEP, RADIUS_PX, radiusOf } from "./model";
import type { RapPreset } from "../../../rapui";
import {
  ARM,
  ARM_TOP,
  ARM_Z,
  BEZEL_H,
  BEZEL_R,
  BEZEL_TOP,
  BELT_HALF,
  BELT_TOP,
  BELT_X0,
  BELT_X1,
  BELT_Z0,
  BLANK,
  BLANK_H,
  BRACE_H,
  BRACE_Z,
  CAP_Z,
  COLUMN,
  CRATE,
  CRATE_FLOOR,
  CRATE_TOP,
  DIAL,
  DIE_H,
  DIE_REST,
  DRUM_R,
  DRUM_Z,
  FOOT_H,
  HOPPER_X,
  HOP_POST,
  HOP_TOP_Z,
  KNOB_H,
  KNOB_R,
  KNOB_TOP,
  LEG,
  LEG_XS,
  LEG_Y,
  P,
  PRESS_BASE,
  PRESS_BASE_H,
  PRESS_X,
  RAIL_D,
  RAIL_TOP,
  RAIL_X0,
  RAIL_X1,
  RAIL_Z0,
  RAM,
  RAM_LEN,
  ROLLER_XS,
  SHOE_H,
  STACK_COUNT,
  STACK_Z,
  WALL,
  at,
} from "./view";

const S = (paths: SolidPaths, style: SolidStyle = {}) => solidSvg(paths, style);
const L = (d: string, style: LineStyle = {}) => lineSvg(d, style);
const D = (points: Flat[], size = 0.9, tone: "hi" | "mid" | "lo" | "faint" = "mid") => dotsSvg(points, { size, tone });
const slab = (plan: Plan, z: number, h: number, steps = 6, bevel = 0) => slabOf(plan, z, h, P, steps, bevel);
const post = (cx: number, cy: number, r: number, z: number, h: number, steps = 40, bevel = 0) => cylinder(cx, cy, r, z, h, P, steps, bevel);
const centred = (cx: number, cy: number, w: number, d: number, r = 1.5): Plan => ({ x: cx - w / 2, y: cy - d / 2, w, d, r });
const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${haloOf(plan, z, h, P)}"/>`;
const join = (parts: string[]) => parts.join("");
const byDepth = <T extends { at: Point3 }>(list: T[]) => [...list].sort((a, b) => depthOf(a.at, P) - depthOf(b.at, P));

/* ── a cylinder lying along y: rollers, drum, motor ─────────────────── */
const VIEW: Point3 = [depthOf([1, 0, 0], P), depthOf([0, 1, 0], P), depthOf([0, 0, 1], P)];
const LIGHT = (() => {
  const { sinA, cosA } = cameraOf(P);
  const v: Point3 = [-sinA, cosA, 1.1];
  const n = Math.hypot(...v);
  return v.map((c) => c / n) as Point3;
})();

function hull(points: Flat[]): Flat[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Flat[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Flat[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

export function barrelY(cx: number, cz: number, r: number, y0: number, y1: number, steps = 56): SolidPaths {
  const angles = Array.from({ length: steps }, (_, i) => (i / steps) * Math.PI * 2);
  const rim = (y: number) => angles.map((a) => at([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]));
  const near = rim(y1);
  const far = rim(y0);
  const shades: string[][] = [[], [], [], []];
  for (let i = 0; i < steps; i++) {
    const j = (i + 1) % steps;
    const mid = (angles[i]! + angles[i]! + (Math.PI * 2) / steps) / 2;
    const n: Point3 = [Math.cos(mid), 0, Math.sin(mid)];
    if (n[0] * VIEW[0] + n[2] * VIEW[2] <= 1e-6) continue;
    const lit = (n[0] * LIGHT[0] + n[2] * LIGHT[2] + 1) / 2;
    const shade = Math.min(3, Math.max(0, Math.floor(lit * 4)));
    shades[shade]!.push(pathOf([far[i]!, far[j]!, near[j]!, near[i]!], true));
  }
  const outline = hull([...near, ...far]);
  return {
    fill: pathOf(outline, true),
    outline: pathOf(outline, true),
    crease: pathOf(near, true),
    top: pathOf(near, true),
    shades: shades.map((list) => list.join("")),
  };
}

/* the visible axial lines on a barrel, ending on its two rims */
function barrelRibs(cx: number, cz: number, r: number, y0: number, y1: number, count: number, least = 0.2) {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const facing = Math.cos(a) * VIEW[0] + Math.sin(a) * VIEW[2];
    if (facing < least) continue;
    out.push(segment([cx + r * Math.cos(a), y0, cz + r * Math.sin(a)], [cx + r * Math.cos(a), y1, cz + r * Math.sin(a)], P));
  }
  return join(out);
}

/* a plate standing proud of a vertical face that faces +y, with screws and rule lines */
function facePlate(x0: number, x1: number, y: number, z0: number, z1: number, rules = 3) {
  const plate = slab({ x: x0, y, w: x1 - x0, d: 1, r: 0.6 }, z0, z1 - z0, 3);
  const lines: string[] = [];
  const span = z1 - z0;
  for (let i = 0; i < rules; i++) {
    const z = z1 - span * (0.32 + (0.5 * i) / Math.max(1, rules - 1)) * 0.86;
    const end = x0 + (x1 - x0) * (i === 1 ? 0.62 : 0.8);
    lines.push(segment([x0 + 4.5, y + 1, z], [end, y + 1, z], P));
  }
  return (
    S(plate, { tone: "mid", crease: "faint" }) +
    L(lines.join(""), { tone: "lo", free: true }) +
    D([at([x0 + 2.2, y + 1, (z0 + z1) / 2]), at([x1 - 2.2, y + 1, (z0 + z1) / 2])], 0.75)
  );
}

/* ── floor shadows ─────────────────────────────────────────────────── */
export const HALOS = join([
  halo(PRESS_BASE, -2, 4),
  halo({ x: RAIL_X0 + 10, y: -LEG_Y - 6, w: LEG_XS[1]! - RAIL_X0, d: 2 * LEG_Y + 12, r: 8 }, -2, 3),
  halo(insetPlan(CRATE, 2), -2, 4),
]);

/* ── press frame: base, column, label plate ────────────────────────── */
const COLUMN_FRONT = COLUMN.y + COLUMN.d;
export const PRESS_BACK = join([
  S(slab(PRESS_BASE, 0, PRESS_BASE_H, 8, 1.4), { tone: "lo" }),
  L(planOutline(insetPlan(PRESS_BASE, 5), PRESS_BASE_H, P), { tone: "faint" }),
  ...corners(PRESS_BASE, 9).map(([x, y]) => L(ring(x, y, 3.2, PRESS_BASE_H, P, 24), { tone: "lo" })),
  D(corners(PRESS_BASE, 9).map(([x, y]) => at([x, y, PRESS_BASE_H])), 1.1),
  S(slab(insetPlan(COLUMN, -4), PRESS_BASE_H, 5, 6, 0.8), { tone: "mid" }),
  S(slab(COLUMN, PRESS_BASE_H + 5, ARM_Z - PRESS_BASE_H - 5, 6, 0), { tone: "mid", inner: L(sideSeam(COLUMN, 62, P, 6), { tone: "faint" }) }),
  facePlate(COLUMN.x + 8, COLUMN.x + COLUMN.w - 8, COLUMN_FRONT, 74, 98),
]);

/* ── under the belt: back legs, braces, motor, back rail ───────────── */
function legAt(x: number, y: number) {
  return [
    S(post(x, y, 7, 0, FOOT_H, 40, 0.6), { tone: "lo" }),
    S(slab(centred(x, y, LEG, LEG, 1.2), FOOT_H, RAIL_Z0 - FOOT_H, 3, 0.5), { tone: "mid", inner: L(sideSeam(centred(x, y, LEG, LEG, 1.2), BRACE_Z - 4, P, 3), { tone: "faint" }) }),
  ];
}

const MOTOR_X = 106;
const MOTOR_Z = 22.5;
const MOTOR_R = 10.5;
const MOTOR_Y0 = -20;
const MOTOR_Y1 = 16;
const BRACKET: Plan = { x: MOTOR_X - 12, y: -12, w: 24, d: 22, r: 2 };

const motor = join([
  S(slab(BRACKET, MOTOR_Z + MOTOR_R - 0.5, BELT_Z0 - MOTOR_Z - MOTOR_R + 0.5, 3, 0.5), { tone: "mid" }),
  S(barrelY(MOTOR_X, MOTOR_Z, MOTOR_R, MOTOR_Y0, MOTOR_Y1), { tone: "mid", inner: L(barrelRibs(MOTOR_X, MOTOR_Z, MOTOR_R, MOTOR_Y0, MOTOR_Y1, 28, 0.25), { tone: "faint" }) }),
  S(barrelY(MOTOR_X, MOTOR_Z, MOTOR_R - 2, MOTOR_Y1, MOTOR_Y1 + 5), { tone: "mid" }),
  L(sideRing([MOTOR_X, MOTOR_Y1 + 5, MOTOR_Z], 4.6, "y", P, 36), { tone: "lo" }),
  D([0, 1, 2, 3].map((i) => at([MOTOR_X + 6 * Math.cos(Math.PI / 4 + (i * Math.PI) / 2), MOTOR_Y1 + 5, MOTOR_Z + 6 * Math.sin(Math.PI / 4 + (i * Math.PI) / 2)])), 0.8),
  D([at([MOTOR_X, MOTOR_Y1 + 5, MOTOR_Z])], 1.1, "hi"),
]);

const RAIL_BACK: Plan = { x: RAIL_X0, y: -BELT_HALF - RAIL_D, w: RAIL_X1 - RAIL_X0, d: RAIL_D, r: 1.5 };
const RAIL_FRONT: Plan = { x: RAIL_X0, y: BELT_HALF, w: RAIL_X1 - RAIL_X0, d: RAIL_D, r: 1.5 };
const BRACE_X0 = LEG_XS[0]! + LEG / 2;
const BRACE_W = LEG_XS[1]! - LEG_XS[0]! - LEG;

export const UNDER = join([
  ...LEG_XS.flatMap((x) => legAt(x, -LEG_Y)),
  S(slab({ x: BRACE_X0, y: -LEG_Y - 2, w: BRACE_W, d: 4, r: 0.8 }, BRACE_Z, BRACE_H, 3, 0.4), { tone: "mid" }),
  motor,
  ...LEG_XS.map((x) => S(slab({ x: x - 2, y: -LEG_Y + LEG / 2, w: 4, d: 2 * LEG_Y - LEG, r: 0.8 }, BRACE_Z, BRACE_H, 3, 0.4), { tone: "mid" })),
  S(slab(RAIL_BACK, RAIL_Z0, RAIL_TOP - RAIL_Z0, 4, 0.8), { tone: "mid" }),
]);

/* ── the crate: skids, floor, back and left walls, two parts already in it ── */
const CRATE_BACK: Plan = { x: CRATE.x, y: CRATE.y, w: CRATE.w, d: WALL, r: 1 };
const CRATE_LEFT: Plan = { x: CRATE.x, y: CRATE.y + WALL, w: WALL, d: CRATE.d - 2 * WALL, r: 1 };
const CRATE_RIGHT: Plan = { x: CRATE.x + CRATE.w - WALL, y: CRATE.y + WALL, w: WALL, d: CRATE.d - 2 * WALL, r: 1 };
const CRATE_FRONT: Plan = { x: CRATE.x, y: CRATE.y + CRATE.d - WALL, w: CRATE.w, d: WALL, r: 1 };
const SLATS = [CRATE_FLOOR + 8, CRATE_FLOOR + 16];
const wall = (plan: Plan) => S(slab(plan, CRATE_FLOOR, CRATE_TOP - CRATE_FLOOR, 3, 0.6), { tone: "mid", inner: L(SLATS.map((z) => sideSeam(plan, z, P, 3)).join(""), { tone: "faint" }) });

export const CRATE_BACK_ART = join([
  ...[CRATE.x + 10, CRATE.x + CRATE.w - 18].map((x) => S(slab({ x, y: CRATE.y + 2, w: 8, d: CRATE.d - 4, r: 1 }, 0, 3, 3, 0.4), { tone: "lo" })),
  S(slab(CRATE, 3, CRATE_FLOOR - 3, 4, 0.6), { tone: "lo" }),
  wall(CRATE_BACK),
  wall(CRATE_LEFT),
]);

export const CRATE_FRONT_ART = join([
  wall(CRATE_RIGHT),
  wall(CRATE_FRONT),
  facePlate(CRATE.x + 24, CRATE.x + 52, CRATE.y + CRATE.d, CRATE_FLOOR + 2, CRATE_FLOOR + 14, 2),
]);

/* ── belt, drum and the hopper's back half ─────────────────────────── */
const BELT: Plan = { x: BELT_X0, y: -BELT_HALF, w: BELT_X1 - BELT_X0, d: 2 * BELT_HALF, r: 0 };
const HOP_XS = [HOPPER_X - 24, HOPPER_X + 19];
const HOP_GUIDES = (y0: number) => [HOPPER_X - BLANK.w / 2 - 3, HOPPER_X + BLANK.w / 2].map((x) => ({ x, y: y0, w: 3, d: 3, r: 0.5 }));
const GUIDE_Z = STACK_Z - 2;

export const BELT_ART = join([
  S(slab(BELT, BELT_Z0, BELT_TOP - BELT_Z0, 2, 0), { tone: "lo" }),
]);

export const DRUM_ART = join([
  S(barrelY(BELT_X1, DRUM_Z, DRUM_R, -BELT_HALF, BELT_HALF), { tone: "lo" }),
]);

export const HOPPER_BACK = join([
  ...HOP_XS.map((x) => S(slab({ x, y: -BELT_HALF - RAIL_D + 1, w: HOP_POST, d: 4, r: 0.8 }, RAIL_TOP, HOP_TOP_Z - RAIL_TOP, 3, 0.4), { tone: "mid" })),
  ...HOP_GUIDES(BLANK.y - 3).map((plan) => S(slab(plan, GUIDE_Z, HOP_TOP_Z - GUIDE_Z, 2), { tone: "mid", crease: "none" })),
]);

/* stack of blanks in the hopper (moves up and down by one blank) */
const STACK_PLAN: Plan = { x: HOPPER_X + BLANK.x, y: BLANK.y, w: BLANK.w, d: BLANK.d, r: BLANK.r };
const STACK_TOP = STACK_Z + STACK_COUNT * BLANK_H;
export const STACK_ART = S(slab(STACK_PLAN, STACK_Z, STACK_TOP - STACK_Z, 2, 0), {
  tone: "mid",
  inner: L(Array.from({ length: STACK_COUNT - 1 }, (_, i) => sideSeam(STACK_PLAN, STACK_Z + BLANK_H * (i + 1), P, 2)).join(""), { tone: "lo" }),
});

const HOP_TOP: Plan = { x: HOP_XS[0]! - 3, y: -BELT_HALF - RAIL_D + 0.5, w: HOP_XS[1]! - HOP_XS[0]! + HOP_POST + 6, d: 2 * (BELT_HALF + RAIL_D) - 1, r: 2 };
export const HOPPER_FRONT = join([
  ...HOP_GUIDES(BLANK.y + BLANK.d).map((plan) => S(slab(plan, GUIDE_Z, HOP_TOP_Z - GUIDE_Z, 2), { tone: "mid", crease: "none" })),
  ...HOP_XS.map((x) => S(slab({ x, y: BELT_HALF + 1, w: HOP_POST, d: 4, r: 0.8 }, RAIL_TOP, HOP_TOP_Z - RAIL_TOP, 3, 0.4), { tone: "mid" })),
  S(slab(HOP_TOP, HOP_TOP_Z, 5, 4, 0.8), { tone: "mid" }),
  L(planOutline(centred(HOPPER_X, 0, BLANK.w + 3, BLANK.d + 3, 1), HOP_TOP_Z + 5, P, 2), { tone: "lo" }),
  D(corners(HOP_TOP, 4).map(([x, y]) => at([x, y, HOP_TOP_Z + 5])), 1),
]);

/* ── the ram and its dies (one per preset; the dial picks which) ───── */
const SHOE: Plan = centred(PRESS_X, 0, 34, 32, 3);
export const RAM_ART = join([
  S(slab(RAM, DIE_REST + DIE_H + SHOE_H, RAM_LEN, 4, 0), {
    tone: "mid",
    inner: L([0.3, 0.55].map((f) => sideSeam(RAM, DIE_REST + DIE_H + SHOE_H + RAM_LEN * f, P, 4)).join(""), { tone: "faint" }),
  }),
  S(slab(SHOE, DIE_REST + DIE_H, SHOE_H, 4, 0.8), { tone: "mid" }),
  D(corners(SHOE, 4).map(([x, y]) => at([x, y, DIE_REST + DIE_H + SHOE_H])), 1),
]);

export const DIE_ART: Record<RapPreset, string> = Object.fromEntries(
  PRESETS.map((preset) => {
    const plan = centred(PRESS_X, 0, BLANK.w + 2, BLANK.d + 2, radiusOf(preset, BLANK.d + 2));
    return [preset, S(slab(plan, DIE_REST, DIE_H, 8, 0.6), { tone: "hi", crease: "lo" })];
  }),
) as Record<RapPreset, string>;

/* ── arm and the style dial ────────────────────────────────────────── */
const ARM_FRONT = ARM.y + ARM.d;
export const ARM_ART = join([
  S(slab(ARM, ARM_Z, ARM_TOP - ARM_Z, 6, 1.2), { tone: "mid", inner: L(sideSeam(ARM, ARM_Z + 7, P, 6), { tone: "faint" }) }),
  D(corners(ARM, 6).map(([x, y]) => at([x, y, ARM_TOP])), 1.1),
  faceTextSvg(sideMatrix([ARM.x + 8, ARM_FRONT], ARM_Z + 13, P, "left"), "STYLE PRESS", { size: 5.4, tone: "lo" }),
]);

const angleVector = (deg: number): Plane => [Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180)];
const onDial = (deg: number, r: number): Plane => {
  const [sx, sy] = angleVector(deg);
  return [DIAL[0] + sx * r, DIAL[1] + sy * r];
};
const ARC_R = 19;
const TICK_R = 23.5;
const GLYPH_R = 27;
const LAST = DIAL_FIRST + DIAL_STEP * (PRESETS.length - 1);
const arc = (from: number, to: number, r: number, steps = 48) => onTop(Array.from({ length: steps + 1 }, (_, i) => onDial(from + ((to - from) * i) / steps, r)), BEZEL_TOP, P);

export const tickOf = (preset: RapPreset) => {
  const deg = DIAL_FIRST + DIAL_STEP * PRESETS.indexOf(preset);
  return lineOnTop(onDial(deg, ARC_R), onDial(deg, TICK_R), BEZEL_TOP, P);
};

/* each position wears the button it stamps: a little plate with that corner */
export const glyphOf = (preset: RapPreset) => {
  const deg = DIAL_FIRST + DIAL_STEP * PRESETS.indexOf(preset);
  const [gx, gy] = onDial(deg, GLYPH_R);
  /* 3.8 units deep stands for a 40 px button, so the corner scales with it */
  return planOutline(centred(gx, gy, 6.6, 3.8, Math.min((RADIUS_PX[preset] * 3.8) / 40, 1.9)), BEZEL_TOP, P, 6);
};

export const DIAL_ART = join([
  S(post(DIAL[0], DIAL[1], BEZEL_R, ARM_TOP, BEZEL_H, 72, 1), { tone: "mid" }),
  L(arc(DIAL_FIRST, LAST, ARC_R), { tone: "lo" }),
  L(PRESETS.map(tickOf).join(""), { tone: "mid" }),
  L(join(PRESETS.map((preset) => {
    const deg = DIAL_FIRST + DIAL_STEP * PRESETS.indexOf(preset);
    return join([deg - DIAL_STEP / 2, deg + DIAL_STEP / 2].filter((d) => d > Math.min(DIAL_FIRST, LAST) && d < Math.max(DIAL_FIRST, LAST)).map((d) => lineOnTop(onDial(d, ARC_R), onDial(d, ARC_R + 2), BEZEL_TOP, P)));
  })), { tone: "lo" }),
  L(PRESETS.map(glyphOf).join(""), { tone: "mid" }),
  S(post(DIAL[0], DIAL[1], KNOB_R, BEZEL_TOP, KNOB_H, 64, 0.8), { tone: "hi", crease: "lo" }),
  L(knurl(DIAL[0], DIAL[1], KNOB_R, BEZEL_TOP, KNOB_TOP - 2.6, 40, P, 0.4), { tone: "lo" }),
  L(ring(DIAL[0], DIAL[1], KNOB_R - 3, KNOB_TOP, P, 56), { tone: "faint" }),
]);

/* the grip bar on the knob, pointed at one end: rebuilt as the knob turns */
const GRIP: Plane[] = [
  [-11.5, -3],
  [7.5, -3],
  [12.5, 0],
  [7.5, 3],
  [-11.5, 3],
];
export function gripAt(deg: number) {
  const [ux, uy] = angleVector(deg);
  const [vx, vy] = [-uy, ux];
  const ringPts = GRIP.map(([u, v]) => [DIAL[0] + ux * u + vx * v, DIAL[1] + uy * u + vy * v] as Plane);
  const ccw = ringPts.slice().reverse();
  const paths = extrude(ccw, KNOB_TOP, 4, P, { convex: true, bevel: 0.6 });
  const index = lineOnTop(DIAL, [DIAL[0] + ux * 12.5, DIAL[1] + uy * 12.5], KNOB_TOP + 4, P);
  return (
    S(paths, { tone: "hi", crease: "lo" }) +
    L(index, { tone: "mid" }) +
    D([at([DIAL[0], DIAL[1], KNOB_TOP + 4])], 1.2, "hi")
  );
}

/* ── the front of the line: rail, ruler, roller caps, legs ─────────── */
const RULE = topTicks(BELT_X0 + 2, BELT_X1 - 4, 8, 8, BELT_HALF, RAIL_TOP, [2.2, 4], P);
export const FRONT_RAIL = join([
  S(slab(RAIL_FRONT, RAIL_Z0, RAIL_TOP - RAIL_Z0, 4, 0.8), { tone: "mid" }),
  L(RULE.minor, { tone: "lo" }),
  L(RULE.major, { tone: "mid" }),
]);

export const CAP_R = 3.6;
export const DRUM_CAP_R = 4.6;
const CAP_Y0 = BELT_HALF + RAIL_D;
export const CAP_Y1 = CAP_Y0 + 3;
export const CAPS: { x: number; z: number; r: number }[] = [...ROLLER_XS.map((x) => ({ x, z: CAP_Z, r: CAP_R })), { x: BELT_X1, z: DRUM_Z, r: DRUM_CAP_R }];

export const FRONT = join([
  ...CAPS.map(({ x, z, r }) => S(barrelY(x, z, r, CAP_Y0, CAP_Y1, 40), { tone: "mid", crease: "lo" })),
  D(CAPS.map(({ x, z }) => at([x, CAP_Y1, z])), 1.1, "hi"),
  ...byDepth(LEG_XS.map((x) => ({ at: [x, LEG_Y, 0] as Point3, x }))).flatMap(({ x }) => legAt(x, LEG_Y)),
  S(slab({ x: BRACE_X0, y: LEG_Y - 2, w: BRACE_W, d: 4, r: 0.8 }, BRACE_Z, BRACE_H, 3, 0.4), { tone: "mid" }),
  D(LEG_XS.flatMap((x) => [at([x - 2, LEG_Y + LEG / 2, RAIL_Z0 - 4]), at([x + 2, LEG_Y + LEG / 2, RAIL_Z0 - 4])]), 0.8),
]);

/* the spoke on each roller cap turns with the belt */
export function spokesAt(travel: number) {
  return join(
    CAPS.map(({ x, z, r }) => {
      const a = -travel / (r * 1.6);
      return segment([x, CAP_Y1, z], [x + (r - 0.9) * Math.cos(a), CAP_Y1, z + (r - 0.9) * Math.sin(a)], P);
    }),
  );
}

/* cleats on the belt, carried along with it */
const CLEAT = 16;
export function cleatsAt(travel: number) {
  const out: string[] = [];
  const offset = ((travel % CLEAT) + CLEAT) % CLEAT;
  for (let x = BELT_X0 + offset; x < BELT_X1 - 0.5; x += CLEAT) {
    if (x < BELT_X0 + 0.5) continue;
    out.push(lineOnTop([x, -BELT_HALF], [x, BELT_HALF], BELT_TOP, P));
  }
  return join(out);
}

