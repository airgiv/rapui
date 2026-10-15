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
  knurl,
  sideMatrix,
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
  planOf,
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

/* ---------------------------------------------------------------- the lab bench: screens, readouts, probes */
export interface GlassGeo {
  recess: Recess;
  at: string; // the glass's plane: x along +x, y toward the viewer, origin at its back-left corner
  w: number;
  d: number;
}
/* a screen sunk in a 2×1 or 2×2 tile */
export function glassGeo(t: Tile): GlassGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const w = 100;
  const d = t.cell[3] > 1 ? 92 : 40;
  const plan: Plan = { x: cx - w / 2, y: cy - d / 2, w, d, r: 5 };
  return { recess: planRecess(plan, z0, 1.4), at: topMatrix([plan.x, plan.y], z0 - 1.4, P, "x"), w, d };
}
/* a scope's trace across its glass, edge to edge: amplitude 0..1, cycles, phase in turns; the ends taper to the midline */
export function scopeTrace(g: GlassGeo, amp: number, cycles: number, phase: number, kind: number) {
  const n = 64;
  const pts: Flat[] = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const taper = Math.sin(Math.PI * u) ** 0.5;
    const a = 2 * Math.PI * (u * cycles + phase);
    const wave = kind % 3 === 0 ? Math.sin(a) : kind % 3 === 1 ? Math.sin(a) * 0.7 + Math.sin(3 * a) * 0.3 : Math.tanh(Math.sin(a) * 3);
    pts.push([u * g.w, g.d / 2 - amp * (g.d * 0.36) * taper * wave]);
  }
  return pathOf(pts);
}
/* the graticule: a grid edge to edge, ten across and eight down */
export function graticule(g: GlassGeo) {
  const out: string[] = [];
  for (let i = 1; i < 10; i++) out.push(`M${((i * g.w) / 10).toFixed(2)} 0V${g.d}`);
  for (let j = 1; j < 8; j++) out.push(`M0 ${((j * g.d) / 8).toFixed(2)}H${g.w}`);
  return out.join("");
}
/* a dot-matrix: the dots' centres in the glass's plane */
export const MATRIX = { cols: 26, rows: 7, r: 1.15 };
export function matrixDots(g: GlassGeo, lit: (c: number, r: number) => boolean) {
  const px = g.w / (MATRIX.cols + 1);
  const py = g.d / (MATRIX.rows + 1);
  const out: string[] = [];
  const rr = MATRIX.r;
  for (let c = 0; c < MATRIX.cols; c++)
    for (let r = 0; r < MATRIX.rows; r++)
      if (lit(c, r)) {
        const x = (c + 1) * px;
        const y = (r + 1) * py;
        out.push(`M${(x - rr).toFixed(2)} ${y.toFixed(2)}a${rr} ${rr} 0 1 0 ${2 * rr} 0a${rr} ${rr} 0 1 0 ${-2 * rr} 0`);
      }
  return out.join("");
}

/* three binding posts in a row: a collar, a knurled nut and a cap with the probe's hole */
export interface JackGeo {
  posts: { collar: SolidPaths; nut: SolidPaths; ridges: string; hole: string; cap: string }[];
}
export function jacksGeo(t: Tile): JackGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  return {
    posts: [-17, 0, 17].map((dx) => {
      const x = cx + dx;
      return {
        collar: cylinder(x, cy, 7, z0, 2.6, P, 40, 0.6),
        nut: cylinder(x, cy, 5.2, z0 + 2.6, 7.4, P, 40, 0.6),
        ridges: knurl(x, cy, 5.2, z0 + 2.6, z0 + 10, 22, P, 0), // from the collar to the cap edge, ending on both
        cap: ring(x, cy, 3.4, z0 + 10, P, 28),
        hole: ring(x, cy, 1.5, z0 + 10, P, 16),
      };
    }),
  };
}

/* a printed dot scale round a 1×1 knob's socket: 270° of dots, the gap toward the tile's front-left edge (for its label) */
export function knobScale(t: Tile): { minor: Flat[]; major: Flat[] } {
  const [cx, cy] = centreOf(t);
  const z = topOf(t);
  const r = SOCKET_R + 3.6;
  const minor: Flat[] = [];
  const major: Flat[] = [];
  for (let k = 0; k <= 10; k++) {
    const a = (135 + k * 27) * RAD;
    (k % 5 === 0 ? major : minor).push(iso([cx + r * cos(a), cy + r * sin(a), z], P));
  }
  return { minor, major };
}
/* where a tile's engraved label sits: along its front-left edge */
export const labelAt = (t: Tile) => {
  const p = planOf(t);
  return topMatrix([p.x + 6, p.y + p.d - 3.6], topOf(t), P, "x");
};

/* ---------------------------------------------------------------- the office (civic) */
/* a slanted rod as a band on screen between two world points, `r` thick */
function rodBand(a: Point3, b: Point3, r: number) {
  const pa = iso(a, P);
  const pb = iso(b, P);
  const dx = pb[0] - pa[0];
  const dy = pb[1] - pa[1];
  const l = Math.hypot(dx, dy) || 1;
  const h = r * K;
  const nx = (-dy / l) * h;
  const ny = (dx / l) * h;
  return pathOf([[pa[0] + nx, pa[1] + ny], [pb[0] + nx, pb[1] + ny], [pb[0] - nx, pb[1] - ny], [pa[0] - nx, pa[1] - ny]], true);
}
/* a ball (a circle on screen) of world radius r at a point */
function ballAt(c: Point3, r: number) {
  const [x, y] = iso(c, P);
  const rr = r * K;
  return `M${(x - rr).toFixed(2)} ${y.toFixed(2)}a${rr.toFixed(2)} ${rr.toFixed(2)} 0 1 0 ${(2 * rr).toFixed(2)} 0a${rr.toFixed(2)} ${rr.toFixed(2)} 0 1 0 ${(-2 * rr).toFixed(2)} 0`;
}
function hull(points: Flat[]): Flat[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Flat[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Flat[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/* the rotary telephone dial: a brass ring, a finger wheel with ten holes that turns, a finger stop */
export interface DialGeo {
  cx: number;
  cy: number;
  z0: number;
  ring: SolidPaths;
  wheel: SolidPaths;
  card: string; // the number card in the middle
  stop: SolidPaths;
  halo: string;
}
export function dialGeo(t: Tile): DialGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const sa = 70 * RAD;
  return {
    cx,
    cy,
    z0,
    ring: cylinder(cx, cy, 25.5, z0, 2.6, P, 72, 0.8),
    wheel: cylinder(cx, cy, 22.5, z0 + 2.6, 2.8, P, 72, 0.8),
    card: ring(cx, cy, 8.2, z0 + 5.4, P, 40),
    stop: cylinder(cx + 23.2 * cos(sa), cy + 23.2 * sin(sa), 1.6, z0 + 2.6, 4.6, P, 16, 0.3),
    halo: cylinder(cx + 2.5, cy + 3, 26, z0, 0.1, P, 48).fill,
  };
}
/* the wheel's ten finger holes, turned by `deg` (they span 300°) */
export function dialHoles(g: DialGeo, deg: number) {
  const out: string[] = [];
  for (let k = 0; k < 10; k++) {
    const a = (deg + 100 + k * 30) * RAD;
    out.push(ring(g.cx + 15.6 * cos(a), g.cy + 15.6 * sin(a), 3.7, g.z0 + 5.4, P, 20));
  }
  return out.join("");
}

/* the gauge: a brass bezel, a cream face with a dot scale (the last stretch the red zone), a needle */
export const GAUGE_SPAN = { from: 150, to: 390 };
export interface GaugeGeo {
  cx: number;
  cy: number;
  z: number; // the face
  r: number;
  bezel: SolidPaths;
  face: string;
  minor: Flat[];
  major: Flat[];
  red: Flat[];
  hub: string;
  halo: string;
  at: string; // the face's plane, for its printed word
}
export function gaugeGeo(t: Tile): GaugeGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const R = t.cell[2] > 1 ? 44 : 23.5;
  const z = z0 + 5;
  const minor: Flat[] = [];
  const major: Flat[] = [];
  const red: Flat[] = [];
  const rs = R - 7;
  for (let k = 0; k <= 20; k++) {
    const a = (GAUGE_SPAN.from + (k * (GAUGE_SPAN.to - GAUGE_SPAN.from)) / 20) * RAD;
    const pt = iso([cx + rs * cos(a), cy + rs * sin(a), z], P);
    (k >= 17 ? red : k % 5 === 0 ? major : minor).push(pt);
  }
  return {
    cx,
    cy,
    z,
    r: R,
    bezel: cylinder(cx, cy, R, z0, 5, P, 80, 1.2),
    face: ring(cx, cy, R - 3, z, P, 80),
    minor,
    major,
    red,
    hub: ring(cx, cy, R > 30 ? 3 : 2, z, P, 20),
    halo: cylinder(cx + 3, cy + 3.5, R + 1.5, z0, 0.1, P, 48).fill,
    at: topMatrix([cx, cy + R * 0.42], z, P, "x"),
  };
}
/* the needle at a value 0..1, from the hub to the scale */
export function gaugeNeedle(g: GaugeGeo, v: number) {
  const a = (GAUGE_SPAN.from + v * (GAUGE_SPAN.to - GAUGE_SPAN.from)) * RAD;
  const l = g.r - 9;
  return pathOf([iso([g.cx - 0.18 * l * cos(a), g.cy - 0.18 * l * sin(a), g.z + 0.6], P), iso([g.cx + l * cos(a), g.cy + l * sin(a), g.z + 0.6], P)]);
}

/* the bat-handle toggle: an engraved plate with two screws, a bushing, a lever that tips along y */
export interface BatGeo {
  cx: number;
  cy: number;
  z0: number;
  plate: SolidPaths;
  screws: Flat[];
  bush: SolidPaths;
  nut: string;
  onAt: string;
  offAt: string;
  halo: string;
}
export function batGeo(t: Tile): BatGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  return {
    cx,
    cy,
    z0,
    plate: slabOf({ x: cx - 15, y: cy - 21, w: 30, d: 42, r: 3 }, z0, 1.4, P, 6, 0.4),
    screws: [iso([cx, cy - 17, z0 + 1.4], P), iso([cx, cy + 17, z0 + 1.4], P)],
    bush: cylinder(cx, cy, 5.4, z0 + 1.4, 4, P, 40, 0.6),
    nut: ring(cx, cy, 3, z0 + 5.4, P, 24),
    onAt: topMatrix([cx - 4, cy - 9.5], z0 + 1.4, P, "x"),
    offAt: topMatrix([cx - 5.5, cy + 13], z0 + 1.4, P, "x"),
    halo: slabOf({ x: cx - 13, y: cy - 18, w: 30, d: 42, r: 3 }, z0, 0.1, P, 6).fill,
  };
}
/* the lever at `v` (1 on: tipped toward the back, 0 off: toward the front), and its ball */
export function batLever(g: BatGeo, v: number) {
  const a = (28 - 56 * v) * RAD;
  const base: Point3 = [g.cx, g.cy, g.z0 + 5.4];
  const tip: Point3 = [g.cx, g.cy + 15 * sin(a), g.z0 + 5.4 + 15 * cos(a)];
  return { rod: rodBand(base, tip, 1.5), ball: ballAt(tip, 3.4) };
}

/* typewriter keys: round caps with a chrome rim on stems, a letter on each */
export interface TypeGeo {
  keys: { stem: SolidPaths; cap: SolidPaths; rim: string; at: string }[];
}
export function typeGeo(t: Tile): TypeGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  return {
    keys: [-36, -12, 12, 36].map((dx) => {
      const x = cx + dx;
      return {
        stem: cylinder(x, cy, 3, z0, 7, P, 20, 0),
        cap: cylinder(x, cy, 9.6, z0 + 7, 3, P, 48, 0.8),
        rim: ring(x, cy, 8.2, z0 + 10, P, 48),
        at: topMatrix([x, cy], z0 + 10, P, "x"),
      };
    }),
  };
}
export const typeDrop = (p: number) => translateAlong(P, [0, 0, -p * 3]);

/* the rubber stamp and its ink pad; the stamp hovers and comes down when pressed */
export interface StampGeo {
  tin: SolidPaths;
  ink: string;
  rubber: SolidPaths;
  block: SolidPaths;
  handle: SolidPaths;
  knob: string;
  halo: string;
}
export function stampGeo(t: Tile): StampGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const px = cx - 25;
  const sx = cx + 22;
  const zs = z0 + 7; // the stamp at rest hovers this high
  return {
    tin: slabOf({ x: px - 21, y: cy - 17, w: 42, d: 34, r: 3 }, z0, 3.6, P, 6, 0.6),
    ink: planOutline({ x: px - 17, y: cy - 13, w: 34, d: 26, r: 2 }, z0 + 3.6, P, 6),
    rubber: slabOf({ x: sx - 14, y: cy - 11, w: 28, d: 22, r: 1.5 }, zs, 2.4, P, 4, 0.3),
    block: slabOf({ x: sx - 15, y: cy - 12, w: 30, d: 24, r: 2 }, zs + 2.4, 7, P, 4, 0.8),
    handle: cylinder(sx, cy, 3.4, zs + 9.4, 11, P, 24, 0.4),
    knob: ballAt([sx, cy, zs + 23], 6.2),
    halo: slabOf({ x: sx - 12, y: cy - 8, w: 28, d: 22, r: 2 }, z0, 0.1, P, 4).fill,
  };
}
export const stampDrop = (p: number) => translateAlong(P, [0, 0, -p * 7]);

/* a card-catalogue drawer: a cabinet, and a drawer front with a brass label holder and a pull that slides out */
export interface DrawerGeo {
  cabinet: SolidPaths;
  halo: string;
  face: string; // the drawer front's plane (x along +x, y down), at rest
  faceTop: string; // the two half drawers' fronts
  faceBottom: string;
  cx: number;
  cy: number;
  z0: number;
}
export function drawerGeo(t: Tile): DrawerGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  return {
    cabinet: slabOf({ x: cx - 23, y: cy - 22, w: 46, d: 40, r: 2 }, z0, 24, P, 4, 0.8),
    halo: slabOf({ x: cx - 20, y: cy - 18, w: 46, d: 44, r: 2 }, z0, 0.1, P, 4).fill,
    face: sideMatrix([cx - 19, cy + 21], z0 + 21, P, "left"),
    faceTop: sideMatrix([cx - 19, cy + 21], z0 + 21.4, P, "left"),
    faceBottom: sideMatrix([cx - 19, cy + 21], z0 + 11.8, P, "left"),
    cx,
    cy,
    z0,
  };
}
/* the drawer's front, pulled out by p (0..1) */
/* how far a drawer slides at full press */
export const DRAWER_TRAVEL = 22;
/* the drawer pulled out by p (0..1): a tray as tall as its front (19), or as one of two half-height drawers
   (`half`: "top" or "bottom", 9 tall) */
export const drawerFront = (g: DrawerGeo, p: number, half?: "top" | "bottom") =>
  slabOf(
    { x: g.cx - 20, y: g.cy + 16, w: 40, d: 2.6 + p * DRAWER_TRAVEL, r: 1 },
    g.z0 + (half === "top" ? 12.6 : 3),
    half ? 9 : 19,
    P,
    2,
    0.5,
  );
export const drawerSlide = (p: number) => translateAlong(P, [0, p * DRAWER_TRAVEL, 0]);
/* an open tray: the opening on top between the cabinet's face and the drawer's front panel, and the index cards
   standing in it (their top edges, rim to rim) */
export function drawerTray(g: DrawerGeo, p: number) {
  const y0 = g.cy + 18;
  const y1 = g.cy + 16 + p * DRAWER_TRAVEL;
  if (y1 - y0 < 1.2) return { rim: "", cards: "" };
  const z = g.z0 + 22;
  const rim = planOutline({ x: g.cx - 18.4, y: y0, w: 36.8, d: y1 - y0, r: 0.6 }, z, P, 2);
  const cards: string[] = [];
  for (let y = y0 + 1.1; y < y1 - 0.5; y += 1.4) cards.push(pathOf([iso([g.cx - 18.4, y, z], P), iso([g.cx + 18.4, y, z], P)]));
  // a taller guide card with a tab, a third of the way in
  return { rim, cards: cards.join("") };
}

/* the desk bell: a base, a dome and the plunger on top */
export interface BellGeo {
  base: SolidPaths;
  dome: string;
  halo: string;
  plunger: SolidPaths;
  knob: string;
}
export function bellGeo(t: Tile): BellGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const zb = z0 + 4;
  const pts: Flat[] = [];
  const R = 17;
  const H = 12;
  for (let k = 0; k <= 12; k++) {
    const h = (k / 12) * H;
    const r = R * Math.sqrt(Math.max(0, 1 - (h / H) ** 2)) + 0.01;
    for (let j = 0; j < 36; j++) {
      const a = (j / 36) * Math.PI * 2;
      pts.push(iso([cx + r * cos(a), cy + r * sin(a), zb + h], P));
    }
  }
  return {
    base: cylinder(cx, cy, 20, z0, 4, P, 64, 1),
    dome: pathOf(hull(pts), true),
    halo: cylinder(cx + 3, cy + 3.5, 21, z0, 0.1, P, 40).fill,
    plunger: cylinder(cx, cy, 1.8, zb + H - 0.5, 4.5, P, 16, 0),
    knob: ballAt([cx, cy, zb + H + 6], 3.2),
  };
}


/* ---------------------------------------------------------------- convex solids in any orientation */
/* A convex polyhedron (vertices and faces, each face's corners in any winding) drawn the kit's way: faces that
   look toward the viewer, shaded by facing (up-facing faces are tops), plus the silhouette as the outline.
   Used for parts that turn in 3D: the knife switch's blade, crossbar and grip. */
export interface Poly {
  faces: { d: string; shade: number; top: boolean }[]; // one per face, "" when it faces away
  outline: string;
}
const VIEW3 = (() => {
  const a = (P.azimuth ?? 45) * RAD;
  const e = (P.elevation ?? 30) * RAD;
  return [cos(a) * cos(e), sin(a) * cos(e), sin(e)] as const;
})();
export function polyOf(verts: Point3[], faces: number[][]): Poly {
  const c = verts.reduce((acc, v) => [acc[0] + v[0] / verts.length, acc[1] + v[1] / verts.length, acc[2] + v[2] / verts.length], [0, 0, 0]);
  const flat = verts.map((v) => iso(v, P));
  const out: Poly["faces"] = faces.map((f) => {
    const [a0, a1, a2] = [verts[f[0]!]!, verts[f[1]!]!, verts[f[2]!]!];
    const u = [a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]];
    const w = [a2[0] - a0[0], a2[1] - a0[1], a2[2] - a0[2]];
    let n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const fc = f.reduce((acc, i) => [acc[0] + verts[i]![0] / f.length, acc[1] + verts[i]![1] / f.length, acc[2] + verts[i]![2] / f.length], [0, 0, 0]);
    // outward: away from the solid's centre
    if (n[0] * (fc[0] - c[0]) + n[1] * (fc[1] - c[1]) + n[2] * (fc[2] - c[2]) < 0) n = [-n[0], -n[1], -n[2]];
    const l = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
    n = [n[0]! / l, n[1]! / l, n[2]! / l];
    if (n[0]! * VIEW3[0] + n[1]! * VIEW3[1] + n[2]! * VIEW3[2] <= 1e-6) return { d: "", shade: 0, top: false };
    const top = n[2]! > 0.72;
    // lit from the kit's side light (the left of the picture), four steps
    const lx = -sin((P.azimuth ?? 45) * RAD);
    const ly = cos((P.azimuth ?? 45) * RAD);
    const lit = (n[0]! * lx + n[1]! * ly + 1) / 2;
    return { d: pathOf(f.map((i) => flat[i]!), true), shade: Math.min(3, Math.max(0, Math.floor(lit * 4))), top };
  });
  return { faces: out, outline: pathOf(hull(flat), true) };
}
/* a box from its centre and three half-axes */
export function boxPoly(c: Point3, ax: Point3, ay: Point3, az: Point3): Poly {
  const v: Point3[] = [];
  for (const i of [-1, 1]) for (const j of [-1, 1]) for (const k of [-1, 1]) v.push([c[0] + i * ax[0] + j * ay[0] + k * az[0], c[1] + i * ax[1] + j * ay[1] + k * az[1], c[2] + i * ax[2] + j * ay[2] + k * az[2]]);
  // vertex index = (i>0)*4 + (j>0)*2 + (k>0)
  return polyOf(v, [
    [0, 1, 3, 2],
    [4, 5, 7, 6],
    [0, 1, 5, 4],
    [2, 3, 7, 6],
    [0, 2, 6, 4],
    [1, 3, 7, 5],
  ]);
}
/* a round rod (a 12-sided prism) from a to b */
export function rodPoly(a: Point3, b: Point3, r: number, n = 12): Poly {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const l = Math.hypot(d[0]!, d[1]!, d[2]!) || 1;
  const t = [d[0]! / l, d[1]! / l, d[2]! / l];
  const ref = Math.abs(t[2]!) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  let u = [t[1]! * ref[2]! - t[2]! * ref[1]!, t[2]! * ref[0]! - t[0]! * ref[2]!, t[0]! * ref[1]! - t[1]! * ref[0]!];
  const ul = Math.hypot(u[0]!, u[1]!, u[2]!);
  u = [u[0]! / ul, u[1]! / ul, u[2]! / ul];
  const w = [t[1]! * u[2]! - t[2]! * u[1]!, t[2]! * u[0]! - t[0]! * u[2]!, t[0]! * u[1]! - t[1]! * u[0]!];
  const v: Point3[] = [];
  for (const e of [a, b])
    for (let k = 0; k < n; k++) {
      const q = (k / n) * Math.PI * 2;
      v.push([e[0] + r * (cos(q) * u[0]! + sin(q) * w[0]!), e[1] + r * (cos(q) * u[1]! + sin(q) * w[1]!), e[2] + r * (cos(q) * u[2]! + sin(q) * w[2]!)]);
    }
  const faces: number[][] = [];
  for (let k = 0; k < n; k++) faces.push([k, (k + 1) % n, n + ((k + 1) % n), n + k]);
  faces.push(Array.from({ length: n }, (_, k) => k), Array.from({ length: n }, (_, k) => n + k));
  return polyOf(v, faces);
}

/* ---------------------------------------------------------------- the knife switch, rebuilt */
/* A slate base; at the near end a hinge of two cheeks and a pivot pin; at the far end a jaw of two upright
   contacts (a U) on a block; a blade (a thin bar on edge) that swings about the pin, with an insulated
   crossbar and a round grip at its free end. The base, hinge and jaw are fixed solids; the blade, crossbar
   and grip are rebuilt each frame from the blade's angle. Painted far to near: the far cheek and the far
   upright, then the blade, then the near upright and the near cheek with the pin on it. */
export interface KnifeGeo {
  base: SolidPaths;
  farCheek: SolidPaths;
  nearCheek: SolidPaths;
  jawBlock: SolidPaths;
  farJaw: SolidPaths;
  nearJaw: SolidPaths;
  pin: string; // the pin's end on the near cheek
  screws: Flat[];
  hx: number;
  cy: number;
  zp: number; // the pin's height
  halo: string;
}
const KNIFE = { L: 66, h: 7, t: 1.5, gap: 2.4, cheek: 1.8, open: 72 };
export function knifeGeo(t: Tile): KnifeGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const zb = z0 + 4;
  const hx = cx - 34;
  const jx = hx + KNIFE.L - 7;
  const g = KNIFE.gap;
  const c = KNIFE.cheek;
  return {
    base: slabOf({ x: cx - 48, y: cy - 15, w: 96, d: 30, r: 3 }, z0, 4, P, 6, 0.8),
    farCheek: slabOf({ x: hx - 5, y: cy - g - c, w: 10, d: c, r: 0.4 }, zb, 13, P, 2, 0.3),
    nearCheek: slabOf({ x: hx - 5, y: cy + g, w: 10, d: c, r: 0.4 }, zb, 13, P, 2, 0.3),
    jawBlock: slabOf({ x: jx - 6, y: cy - 7, w: 12, d: 14, r: 1 }, zb, 3, P, 2, 0.4),
    farJaw: slabOf({ x: jx - 4, y: cy - g - c, w: 8, d: c, r: 0.4 }, zb + 3, 10.5, P, 2, 0.3),
    nearJaw: slabOf({ x: jx - 4, y: cy + g, w: 8, d: c, r: 0.4 }, zb + 3, 10.5, P, 2, 0.3),
    pin: ballAt([hx, cy + g + c, zb + 9], 1.5),
    screws: [
      iso([cx - 43, cy - 10, zb], P),
      iso([cx - 43, cy + 10, zb], P),
      iso([cx + 43, cy - 10, zb], P),
      iso([cx + 43, cy + 10, zb], P),
    ],
    hx,
    cy,
    zp: zb + 9,
    halo: slabOf({ x: cx - 44, y: cy - 11, w: 96, d: 30, r: 3 }, z0, 0.1, P, 6).fill,
  };
}
/* the blade at v (1 closed: down in the jaw; 0 open: swung up), its crossbar and its grip */
export function knifeBlade(g: KnifeGeo, v: number) {
  const a = (1 - v) * KNIFE.open * RAD;
  const dir: Point3 = [cos(a), 0, sin(a)];
  const up: Point3 = [-sin(a), 0, cos(a)];
  const at = (s: number, u = 0): Point3 => [g.hx + dir[0] * s + up[0] * u, g.cy, g.zp + dir[2] * s + up[2] * u];
  const half = KNIFE.L / 2;
  const blade = boxPoly(at(half - 2), [dir[0] * (half + 2), 0, dir[2] * (half + 2)], [0, KNIFE.t / 2, 0], [up[0] * (KNIFE.h / 2), 0, up[2] * (KNIFE.h / 2)]);
  const cross = boxPoly(at(KNIFE.L + 2, 1), [dir[0] * 2.6, 0, dir[2] * 2.6], [0, 7, 0], [up[0] * 2.6, 0, up[2] * 2.6]);
  const grip = rodPoly(at(KNIFE.L + 2, 3.6), at(KNIFE.L + 2, 19), 3.4);
  return { blade, cross, grip };
}
