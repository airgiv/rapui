/* Every path of ControlModules, built once from view.ts with the kit, plus the
   few builders the live loop calls for what moves: the dot texture and pointer
   of a turning knob, a button or key that goes down, the grille's rings. */
import {
  cylinder,
  iso,
  onTop,
  planOutline,
  pathOf,
  ring,
  ringOf,
  roundedPlan,
  sideArc,
  slabOf,
  topMatrix,
  translateAlong,
  type Flat,
  type Point3,
  type Plan,
  type Plane,
  type SolidPaths,
} from "../iso/iso-kit";
import {
  DISC,
  GRILLE,
  K,
  KNOB_BODY,
  KNOB_CAP,
  KNOB_H,
  KNOB_R,
  KNURL,
  P,
  PILL,
  RAD,
  RECESS_D,
  RECESS_R,
  SOCKET_R,
  SOFT,
  FADER,
  SWITCH,
  ROCKER,
  KEYS,
  PADS,
  LCD,
  STICK,
  LEDS,
  JOG,
  centreOf,
  topOf,
  type Tile,
} from "./view";

const VIEW: Plane = [Math.cos((P.azimuth ?? 45) * RAD), Math.sin((P.azimuth ?? 45) * RAD)];
const { cos, sin } = Math;
const COS_E = cos((P.elevation ?? 30) * RAD);

/* ---------------------------------------------------------------- round recesses */
export interface Recess {
  rim: string; // the opening, at the tile's face
  floor: string; // the floor, `depth` below
}
export const circleRecess = (cx: number, cy: number, r: number, z: number, depth: number): Recess => ({
  rim: ring(cx, cy, r, z, P, 72),
  floor: ring(cx, cy, r, z - depth, P, 72),
});
export const planRecess = (plan: Plan, z: number, depth: number): Recess => ({
  rim: onTop(ringOf(plan, 12), z, P, true),
  floor: onTop(ringOf(plan, 12), z - depth, P, true),
});

/* ---------------------------------------------------------------- knobs */
export interface KnobGeo {
  cx: number;
  cy: number;
  z0: number;
  big: boolean;
  socket: string; // the dark round hole a small tile's knob stands in
  recess: Recess | null; // the wide shallow recess on a 2×2 tile
  halo: string;
  body: SolidPaths;
  seams: string; // the two seam arcs that bound the dotted band
  cap: SolidPaths;
  capRing: string; // the soft edge round the cap's face
}

export function knobGeo(t: Tile): KnobGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const big = t.cell[2] > 1;
  return {
    cx,
    cy,
    z0,
    big,
    socket: big ? "" : ring(cx, cy, SOCKET_R, z0, P, 64),
    recess: big ? circleRecess(cx, cy, RECESS_R, z0, RECESS_D) : null,
    halo: cylinder(cx + 2.5, cy + 3, KNOB_R + 1.5, z0, 0.1, P, 48).fill,
    body: cylinder(cx, cy, KNOB_R, z0, KNOB_BODY, P, 72),
    seams: sideArc(cx, cy, KNOB_R, z0 + KNURL[0], P, 48) + sideArc(cx, cy, KNOB_R, z0 + KNURL[1], P, 48),
    cap: cylinder(cx, cy, KNOB_R, z0 + KNOB_BODY, KNOB_CAP, P, 72, 0.9),
    capRing: ring(cx, cy, KNOB_R - 2.8, z0 + KNOB_H, P, 56),
  };
}

/* a small dot on screen: an ellipse as a path (rx across, ry up) */
const dot = ([x, y]: Flat, rx: number, ry: number) =>
  `M${(x - rx).toFixed(2)} ${y.toFixed(2)}a${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 0 ${(2 * rx).toFixed(2)} 0a${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 0 ${(-2 * rx).toFixed(2)} 0`;

const KNURL_COLS = 60;
const KNURL_ROWS = 11;
const DOT_R = 0.72;
export const DOT_BUCKETS = 4;
/* the dot texture on a knob's band, turned by `deg`: a regular grid of small round dimples following the
   cylinder, foreshortened and fading toward the silhouette, the rows ending a little inside the two seams.
   Returns one path per opacity bucket (faint → full). */
export function knurlDots(g: KnobGeo, deg: number): string[] {
  const out: string[][] = Array.from({ length: DOT_BUCKETS }, () => []);
  const z0 = g.z0 + KNURL[0] + 1.5;
  const z1 = g.z0 + KNURL[1] - 1.5;
  const ry = DOT_R * K * COS_E;
  for (let c = 0; c < KNURL_COLS; c++) {
    const a = (deg + (c * 360) / KNURL_COLS) * RAD;
    const nx = cos(a);
    const ny = sin(a);
    const f = nx * VIEW[0] + ny * VIEW[1]; // how squarely this column faces the viewer
    if (f < 0.12) continue;
    const fadeIn = Math.min(1, (f - 0.12) / 0.5);
    const b = Math.min(DOT_BUCKETS - 1, Math.floor(fadeIn * DOT_BUCKETS));
    const rx = DOT_R * K * Math.max(0.35, f);
    const x = g.cx + KNOB_R * nx;
    const y = g.cy + KNOB_R * ny;
    for (let r = 0; r < KNURL_ROWS; r++) {
      // alternate rows sit half a pitch round, like the reference's staggered dimples
      if (r % 2 === 1) continue;
      const z = z0 + ((z1 - z0) * r) / (KNURL_ROWS - 1);
      out[b]!.push(dot(iso([x, y, z], P), rx, ry));
    }
    // the staggered rows
    const a2 = a + (Math.PI / KNURL_COLS);
    const f2 = cos(a2) * VIEW[0] + sin(a2) * VIEW[1];
    if (f2 < 0.12) continue;
    const b2 = Math.min(DOT_BUCKETS - 1, Math.floor(Math.min(1, (f2 - 0.12) / 0.5) * DOT_BUCKETS));
    const rx2 = DOT_R * K * Math.max(0.35, f2);
    const x2 = g.cx + KNOB_R * cos(a2);
    const y2 = g.cy + KNOB_R * sin(a2);
    for (let r = 1; r < KNURL_ROWS; r += 2) {
      const z = z0 + ((z1 - z0) * r) / (KNURL_ROWS - 1);
      out[b2]!.push(dot(iso([x2, y2, z], P), rx2, ry));
    }
  }
  return out.map((d) => d.join(""));
}

/* the pointer: a small dimple near the edge of the cap's face */
export function knobPointer(g: KnobGeo, deg: number) {
  const a = deg * RAD;
  const r = KNOB_R - 6.5;
  return ring(g.cx + r * cos(a), g.cy + r * sin(a), 1.9, g.z0 + KNOB_H, P, 20);
}

/* ---------------------------------------------------------------- dark round buttons */
export interface DiscGeo {
  cx: number;
  cy: number;
  z0: number;
  rim: SolidPaths;
  halo: string;
  well: string; // the opening in the rim's face
}
export function discGeo(t: Tile): DiscGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  return {
    cx,
    cy,
    z0,
    rim: cylinder(cx, cy, DISC.rim, z0, DISC.rimH, P, 72, 1.2),
    halo: cylinder(cx + 2, cy + 2.5, DISC.rim + 1, z0, 0.1, P, 48).fill,
    well: ring(cx, cy, DISC.well, z0 + DISC.rimH, P, 72),
  };
}
/* the dark disc's face, pressed by `p` */
export const discFace = (g: DiscGeo, p: number) => ring(g.cx, g.cy, DISC.disc, g.z0 + DISC.rimH - DISC.sink - p * DISC.travel, P, 72);
export const discShine = (g: DiscGeo, p: number) => {
  // a faint highlight arc on the disc's far edge, the way light catches a soft dark cap
  const z = g.z0 + DISC.rimH - DISC.sink - p * DISC.travel;
  const pts: Flat[] = [];
  for (let k = 0; k <= 24; k++) {
    const a = (180 + 45 - 52 + (k * 104) / 24) * RAD;
    pts.push(iso([g.cx + (DISC.disc - 3.2) * cos(a), g.cy + (DISC.disc - 3.2) * sin(a), z], P));
  }
  return pathOf(pts);
};

/* ---------------------------------------------------------------- soft icon buttons */
export interface SoftGeo {
  cx: number;
  cy: number;
  z0: number;
  halo: string;
  base: string; // a faint ring on the tile round the cushion's foot
}
export function softGeo(t: Tile): SoftGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  return { cx, cy, z0, halo: cylinder(cx + 2, cy + 2.5, SOFT.r + 1, z0, 0.1, P, 48).fill, base: ring(cx, cy, SOFT.r + 2.6, z0, P, 72) };
}
export const softCushion = (g: SoftGeo, p: number) => cylinder(g.cx, g.cy, SOFT.r, g.z0, SOFT.h - p * SOFT.travel, P, 72, 1.8);
export const softDome = (g: SoftGeo, p: number) => ring(g.cx, g.cy, SOFT.r - 4.2, g.z0 + SOFT.h - p * SOFT.travel, P, 64);
/* the printed icon's frame on the cushion's face at rest, and the drop that follows a press */
export const softIconAt = (g: SoftGeo) => topMatrix([g.cx, g.cy], g.z0 + SOFT.h, P, "x");
export const softDrop = (p: number) => translateAlong(P, [0, 0, -p * SOFT.travel]);

/* ---------------------------------------------------------------- pill keys */
export interface PillGeo {
  plan: Plan; // the key
  z0: number;
  recess: Recess;
}
export function pillGeo(t: Tile): PillGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  // r a hair under d/2: a stadium with a zero-length end segment would give the kit a face with no normal
  const plan: Plan = { x: cx - PILL.w / 2, y: cy - PILL.d / 2, w: PILL.w, d: PILL.d, r: PILL.d / 2 - 0.05 };
  const well: Plan = { x: plan.x - PILL.pad, y: plan.y - PILL.pad, w: plan.w + PILL.pad * 2, d: plan.d + PILL.pad * 2, r: plan.r + PILL.pad };
  return { plan, z0, recess: planRecess(well, z0, PILL.sink) };
}
export const pillKey = (g: PillGeo, p: number) => slabOf(g.plan, g.z0 - PILL.sink, PILL.sink + PILL.h - p * PILL.travel, P, 12, 1.4);
/* the key's soft top: a ring inset from its edge */
export const pillFace = (g: PillGeo, p: number) =>
  onTop(roundedPlan({ x: g.plan.x + 3.4, y: g.plan.y + 3.4, w: g.plan.w - 6.8, d: g.plan.d - 6.8, r: g.plan.r - 3.4 }, 12), g.z0 + PILL.h - p * PILL.travel, P, true);

/* ---------------------------------------------------------------- the speaker grille */
export interface GrilleGeo {
  rings: string[]; // holes grouped by distance from the centre
  radii: number[];
  lamp: string; // the sound lamp in the tile's front corner
  lampRing: string;
}
export function grilleGeo(t: Tile): GrilleGeo {
  const [cx, cy] = centreOf(t);
  const z = topOf(t);
  const half = ((GRILLE.n - 1) / 2) * GRILLE.pitch;
  const groups = new Map<number, string[]>();
  for (let i = 0; i < GRILLE.n; i++)
    for (let j = 0; j < GRILLE.n; j++) {
      const x = -half + i * GRILLE.pitch;
      const y = -half + j * GRILLE.pitch;
      // round the field's corners
      const ox = Math.max(0, Math.abs(x) - (half - GRILLE.corner));
      const oy = Math.max(0, Math.abs(y) - (half - GRILLE.corner));
      if (Math.hypot(ox, oy) > GRILLE.corner + 0.1) continue;
      const k = Math.round(Math.hypot(x, y) / GRILLE.pitch);
      const list = groups.get(k) ?? [];
      list.push(ring(cx + x, cy + y, GRILLE.hole, z, P, 14));
      groups.set(k, list);
    }
  const keys = [...groups.keys()].sort((a, b) => a - b);
  const c = half + 7.5; // the front corner, clear of the field's rounded corner
  return {
    rings: keys.map((k) => groups.get(k)!.join("")),
    radii: keys.map((k) => k * GRILLE.pitch),
    lamp: ring(cx + c, cy + c, 2.1, z, P, 24),
    lampRing: ring(cx + c, cy + c, 3.4, z, P, 28),
  };
}

/* ---------------------------------------------------------------- the faders */
export interface FaderGeo {
  cx: number;
  cy: number;
  z0: number;
  axis: "x" | "y";
  recess: Recess; // the long slot
  scale: Flat[]; // the printed dots beside the travel
  major: Flat[];
  halo: (v: number) => string;
}
/* a point `u` along a control's axis and `w` across it, on the table */
const at2 = (g: { cx: number; cy: number; axis: "x" | "y" }, u: number, w: number): [number, number] => (g.axis === "x" ? [g.cx + u, g.cy + w] : [g.cx + w, g.cy + u]);
export function faderGeo(t: Tile): FaderGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const axis = t.ctl.kind === "fader" && t.ctl.axis === "y" ? "y" : "x";
  const base = { cx, cy, axis } as const;
  const { len, slot, depth, scale } = FADER;
  const dots: Flat[] = [];
  const major: Flat[] = [];
  for (let k = 0; k <= 10; k++) {
    const [x, y] = at2(base, -len / 2 + (k * len) / 10, scale);
    (k % 5 === 0 ? major : dots).push(iso([x, y, z0], P));
  }
  return {
    cx,
    cy,
    z0,
    axis,
    recess: planRecess(along(base, 0, len + slot, slot, slot / 2 - 0.05), z0, depth),
    scale: dots,
    major,
    halo: (v) => {
      const p = capPlan(base, v);
      return slabOf({ ...p, x: p.x + 2.5, y: p.y + 3 }, z0, 0.1, P, 5).fill;
    },
  };
}
const capU = (v: number) => -FADER.len / 2 + v * FADER.len;
const capPlan = (g: { cx: number; cy: number; axis: "x" | "y" }, v: number): Plan => along(g, capU(v), FADER.cap.w, FADER.cap.d, FADER.cap.r);
export const faderCap = (g: FaderGeo, v: number) => slabOf(capPlan(g, v), g.z0, FADER.cap.h, P, 5, 0.8);
/* three grip lines across the cap's top, edge to edge (inside the corner rounding) */
export const faderGrip = (g: FaderGeo, v: number) =>
  [-3.2, 0, 3.2]
    .map((du) => onTop([at2(g, capU(v) + du, -FADER.cap.d / 2), at2(g, capU(v) + du, FADER.cap.d / 2)], g.z0 + FADER.cap.h, P))
    .join("");
/* the fader's value under a point on its tile's plane */
export const faderValueAt = (g: FaderGeo, wx: number, wy: number) => ((g.axis === "x" ? wx - g.cx : wy - g.cy) + FADER.len / 2) / FADER.len;
/* where a mark points at a fader: its cap's top in the middle of the travel */
export const faderTop = (g: FaderGeo, v: number): Point3 => [...at2(g, capU(v), 0), g.z0 + FADER.cap.h] as Point3;

/* ---------------------------------------------------------------- the sliding switches */
export interface SwitchGeo {
  cx: number;
  cy: number;
  z0: number;
  axis: "x" | "y";
  recess: Recess;
  lamp: string; // the small lamp beside the slot's "on" end
  lampRing: string;
}
/* a plan stretched along the switch's axis: `u` along it, `w` across it */
const along = (g: { cx: number; cy: number; axis: "x" | "y" }, u: number, len: number, w: number, r: number): Plan =>
  g.axis === "x" ? { x: g.cx + u - len / 2, y: g.cy - w / 2, w: len, d: w, r } : { x: g.cx - w / 2, y: g.cy + u - len / 2, w, d: len, r };
export function switchGeo(t: Tile): SwitchGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const axis = t.ctl.kind === "switch" ? t.ctl.axis : "x";
  const base = { cx, cy, axis };
  const slot = along(base, 0, SWITCH.len, SWITCH.d, SWITCH.d / 2 - 0.05);
  const [lx, ly] = axis === "x" ? [cx + SWITCH.lamp, cy] : [cx, cy + SWITCH.lamp];
  return {
    cx,
    cy,
    z0,
    axis,
    recess: planRecess(slot, z0, SWITCH.depth),
    lamp: ring(lx, ly, 2.1, z0, P, 24),
    lampRing: ring(lx, ly, 3.4, z0, P, 28),
  };
}
const thumbU = (v: number) => -SWITCH.len / 2 + 2.4 + SWITCH.thumb.len / 2 + v * (SWITCH.len - 4.8 - SWITCH.thumb.len);
const thumbPlan = (g: SwitchGeo, v: number) => along(g, thumbU(v), SWITCH.thumb.len, SWITCH.thumb.d, SWITCH.thumb.d / 2 - 0.05);
/* the thumb, standing up out of the slot's floor */
export const switchThumb = (g: SwitchGeo, v: number) => slabOf(thumbPlan(g, v), g.z0 - SWITCH.depth, SWITCH.depth + SWITCH.thumb.h, P, 10, 1.1);
/* two grip ridges across the thumb's top, edge to edge across its straight middle */
export const switchGrip = (g: SwitchGeo, v: number) => {
  const u = thumbU(v);
  const z = g.z0 + SWITCH.thumb.h;
  const h = SWITCH.thumb.d / 2;
  return [-2.4, 2.4]
    .map((du) =>
      g.axis === "x"
        ? onTop([[g.cx + u + du, g.cy - h], [g.cx + u + du, g.cy + h]], z, P)
        : onTop([[g.cx - h, g.cy + u + du], [g.cx + h, g.cy + u + du]], z, P),
    )
    .join("");
};

/* ---------------------------------------------------------------- the rocker */
export interface RockerGeo {
  cx: number;
  cy: number;
  z0: number;
  axis: "x" | "y";
  recess: Recess;
  lamp: string;
  lampRing: string;
}
export function rockerGeo(t: Tile): RockerGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const axis = t.ctl.kind === "switch" ? t.ctl.axis : "y";
  const base = { cx, cy, axis };
  const [lx, ly] = at2(base, ROCKER.lamp, 0);
  return {
    cx,
    cy,
    z0,
    axis,
    recess: planRecess(along(base, 0, ROCKER.len, ROCKER.w, 4), z0, ROCKER.depth),
    lamp: ring(lx, ly, 2.1, z0, P, 24),
    lampRing: ring(lx, ly, 3.4, z0, P, 28),
  };
}
/* the two halves, back one first; `v` 1 tips the front half down (on) */
export function rockerHalves(g: RockerGeo, v: number): [SolidPaths, SolidPaths] {
  const z = g.z0 - ROCKER.depth;
  const hBack = ROCKER.lo + (ROCKER.hi - ROCKER.lo) * v;
  const hFront = ROCKER.hi - (ROCKER.hi - ROCKER.lo) * v;
  const off = ROCKER.half / 2 + 0.3;
  return [
    slabOf(along(g, -off, ROCKER.half, ROCKER.hw, 3), z, ROCKER.depth + hBack, P, 6, 0.9),
    slabOf(along(g, off, ROCKER.half, ROCKER.hw, 3), z, ROCKER.depth + hFront, P, 6, 0.9),
  ];
}

/* ---------------------------------------------------------------- tiny keys and pads */
export interface MultiGeo {
  cx: number;
  cy: number;
  z0: number;
  plans: Plan[]; // back to front
  h: number;
  travel: number;
}
export function keysGeo(t: Tile): MultiGeo {
  const [cx, cy] = centreOf(t);
  const plans = Array.from({ length: KEYS.n }, (_, j) => ({ x: cx + (j - (KEYS.n - 1) / 2) * KEYS.pitch - KEYS.w / 2, y: cy - KEYS.d / 2, w: KEYS.w, d: KEYS.d, r: 3.2 }));
  return { cx, cy, z0: topOf(t), plans, h: KEYS.h, travel: KEYS.travel };
}
export function padsGeo(t: Tile): MultiGeo {
  const [cx, cy] = centreOf(t);
  const plans: Plan[] = [];
  // back to front: rows of equal x + y
  for (let sum = 0; sum <= 4; sum++)
    for (let i = 0; i < 3; i++) {
      const j = sum - i;
      if (j < 0 || j > 2) continue;
      plans.push({ x: cx + (i - 1) * PADS.pitch - PADS.s / 2, y: cy + (j - 1) * PADS.pitch - PADS.s / 2, w: PADS.s, d: PADS.s, r: 2.6 });
    }
  return { cx, cy, z0: topOf(t), plans, h: PADS.h, travel: PADS.travel };
}
export const multiCap = (g: MultiGeo, j: number, p: number) => slabOf(g.plans[j]!, g.z0, g.h - p * g.travel, P, 4, 0.6);
/* the sub-key nearest a point on the tile */
export const multiNearest = (g: MultiGeo, wx: number, wy: number) => {
  let best = 0;
  let bd = Infinity;
  g.plans.forEach((p, j) => {
    const d = Math.hypot(p.x + p.w / 2 - wx, p.y + p.d / 2 - wy);
    if (d < bd) (bd = d), (best = j);
  });
  return best;
};

/* ---------------------------------------------------------------- the LCD */
export interface LcdGeo {
  recess: Recess;
  at: string; // the glass's own plane: x along +x, y toward the viewer, origin at its back-left corner
  w: number;
  d: number;
}
export function lcdGeo(t: Tile): LcdGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const plan: Plan = { x: cx - LCD.w / 2, y: cy - LCD.d / 2, w: LCD.w, d: LCD.d, r: 5 };
  return { recess: planRecess(plan, z0, LCD.depth), at: topMatrix([plan.x, plan.y], z0 - LCD.depth, P, "x"), w: LCD.w, d: LCD.d };
}

/* ---------------------------------------------------------------- the joystick nub */
export interface StickGeo {
  cx: number;
  cy: number;
  z0: number;
  recess: Recess;
  boot: SolidPaths;
  halo: string;
}
export function stickGeo(t: Tile): StickGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  return {
    cx,
    cy,
    z0,
    recess: circleRecess(cx, cy, STICK.socket, z0, 2),
    boot: cylinder(cx, cy, STICK.boot, z0 - 2, STICK.bootH + 2, P, 48, 1.4),
    halo: cylinder(cx + 2.5, cy + 3, STICK.boot + 3, z0, 0.1, P, 32).fill,
  };
}
/* the shaft (a slanted rod as a band on screen) and the ball on top, tilted by tx, ty in −1..1 */
export function stickParts(g: StickGeo, tx: number, ty: number) {
  const zb = g.z0 + STICK.bootH;
  const top: Point3 = [g.cx + tx * STICK.tilt, g.cy + ty * STICK.tilt, zb + STICK.shaftH];
  const pa = iso([g.cx, g.cy, zb], P);
  const pb = iso(top, P);
  const dx = pb[0] - pa[0];
  const dy = pb[1] - pa[1];
  const l = Math.hypot(dx, dy) || 1;
  const h = STICK.shaft * K;
  const nx = (-dy / l) * h;
  const ny = (dx / l) * h;
  const shaft = pathOf([[pa[0] + nx, pa[1] + ny], [pb[0] + nx, pb[1] + ny], [pb[0] - nx, pb[1] - ny], [pa[0] - nx, pa[1] - ny]], true);
  const r = STICK.ball * K;
  const ball = `M${(pb[0] - r).toFixed(2)} ${pb[1].toFixed(2)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0`;
  // the shaft's foot on the boot: an ellipse it stands in
  const foot = ring(g.cx, g.cy, STICK.shaft + 0.6, zb, P, 20);
  return { shaft, ball, foot, top };
}

/* ---------------------------------------------------------------- the LED strip */
export interface LedGeo {
  leds: string[];
  rings: string[];
  frame: string;
}
export function ledGeo(t: Tile): LedGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const xs = Array.from({ length: LEDS.n }, (_, j) => cx + (j - (LEDS.n - 1) / 2) * LEDS.pitch);
  const half = ((LEDS.n - 1) / 2) * LEDS.pitch + 8;
  return {
    leds: xs.map((x) => ring(x, cy, LEDS.r, z0, P, 20)),
    rings: xs.map((x) => ring(x, cy, LEDS.r + 1.4, z0, P, 22)),
    frame: planOutline({ x: cx - half, y: cy - 9, w: half * 2, d: 18, r: 9 }, z0, P, 8),
  };
}

/* ---------------------------------------------------------------- the jog wheel */
export interface JogGeo {
  cx: number;
  cy: number;
  z0: number;
  r: number;
  socket: string;
  body: SolidPaths;
  rim: string; // a ring inset on the face
  halo: string;
}
export function jogGeo(t: Tile): JogGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const r = t.cell[2] > 1 ? JOG.big : JOG.small;
  return {
    cx,
    cy,
    z0,
    r,
    socket: ring(cx, cy, r + 2.6, z0, P, 72),
    body: cylinder(cx, cy, r, z0, JOG.h, P, 96, 1.8),
    rim: ring(cx, cy, r - 3.6, z0 + JOG.h, P, 96),
    halo: cylinder(cx + 3, cy + 3.5, r + 2, z0, 0.1, P, 48).fill,
  };
}
/* the finger dimple, turned by `deg`: a little round recess near the rim */
export function jogDimple(g: JogGeo, deg: number): Recess {
  const a = deg * RAD;
  const rr = g.r * 0.64;
  return circleRecess(g.cx + rr * cos(a), g.cy + rr * sin(a), g.r * 0.17, g.z0 + JOG.h, 1.4);
}
