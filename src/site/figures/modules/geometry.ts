/* Every path of ControlModules, built once from view.ts with the kit, plus the
   few builders the live loop calls for what moves: the dot texture and pointer
   of a turning knob, a button or key that goes down, the grille's rings. */
import {
  cylinder,
  iso,
  onTop,
  pathOf,
  ring,
  ringOf,
  roundedPlan,
  sideArc,
  slabOf,
  topMatrix,
  translateAlong,
  type Flat,
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

/* ---------------------------------------------------------------- the fader */
export interface FaderGeo {
  cx: number;
  cy: number;
  z0: number;
  recess: Recess; // the long slot
  scale: Flat[]; // the printed dots beside the travel
  major: Flat[];
  halo: (v: number) => string;
}
export function faderGeo(t: Tile): FaderGeo {
  const [cx, cy] = centreOf(t);
  const z0 = topOf(t);
  const { len, slot, depth, scale } = FADER;
  const plan: Plan = { x: cx - len / 2 - slot / 2, y: cy - slot / 2, w: len + slot, d: slot, r: slot / 2 - 0.05 };
  const dots: Flat[] = [];
  const major: Flat[] = [];
  for (let k = 0; k <= 10; k++) (k % 5 === 0 ? major : dots).push(iso([cx - len / 2 + (k * len) / 10, cy + scale, z0], P));
  return {
    cx,
    cy,
    z0,
    recess: planRecess(plan, z0, depth),
    scale: dots,
    major,
    halo: (v) => slabOf(capPlan(cx, cy, v, 2.5, 3), z0, 0.1, P, 5).fill,
  };
}
const capX = (cx: number, v: number) => cx - FADER.len / 2 + v * FADER.len;
const capPlan = (cx: number, cy: number, v: number, dx = 0, dy = 0): Plan => ({
  x: capX(cx, v) - FADER.cap.w / 2 + dx,
  y: cy - FADER.cap.d / 2 + dy,
  w: FADER.cap.w,
  d: FADER.cap.d,
  r: FADER.cap.r,
});
export const faderCap = (g: FaderGeo, v: number) => slabOf(capPlan(g.cx, g.cy, v), g.z0, FADER.cap.h, P, 5, 0.8);
/* three grip lines across the cap's top, edge to edge (inside the corner rounding) */
export const faderGrip = (g: FaderGeo, v: number) =>
  [-3.2, 0, 3.2]
    .map((dx) => onTop([[capX(g.cx, v) + dx, g.cy - FADER.cap.d / 2], [capX(g.cx, v) + dx, g.cy + FADER.cap.d / 2]], g.z0 + FADER.cap.h, P))
    .join("");
/* the fader's value under a point on its tile's plane */
export const faderValueAt = (g: FaderGeo, wx: number) => (wx - (g.cx - FADER.len / 2)) / FADER.len;

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
