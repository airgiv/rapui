/* Every path of ControlModules, built once from view.ts with the kit, plus the
   few builders the live loop calls for what moves: the dot texture and pointer
   of a turning knob, a button or key that goes down, the grille's rings. */
import {
  cylinder,
  depthOf,
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
  CLIP,
  DISC,
  GRILLE,
  JACK,
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
  TILES,
  BEVEL,
  centreOf,
  planOf,
  topOf,
  type Tile,
} from "./view";

const VIEW: Plane = [Math.cos((P.azimuth ?? 45) * RAD), Math.sin((P.azimuth ?? 45) * RAD)];
const { cos, sin } = Math;
const COS_E = cos((P.elevation ?? 30) * RAD);

/* ---------------------------------------------------------------- tiles */
/* painter's order for boxes on a grid: a tile wholly behind another (smaller x or y, ranges overlapping) goes first */
export const TILE_ORDER: number[] = (() => {
  const n = TILES.length;
  const plans = TILES.map(planOf);
  const behind = (a: Plan, b: Plan) => {
    const overlapX = a.x < b.x + b.w && b.x < a.x + a.w;
    const overlapY = a.y < b.y + b.d && b.y < a.y + a.d;
    return (overlapY && a.x + a.w <= b.x + 0.01) || (overlapX && a.y + a.d <= b.y + 0.01);
  };
  const depth = TILES.map((t) => {
    const [cx, cy] = centreOf(t);
    return depthOf([cx, cy, 0], P);
  });
  const done = new Set<number>();
  const out: number[] = [];
  while (out.length < n) {
    const ready = [...Array(n).keys()].filter((i) => !done.has(i) && [...Array(n).keys()].every((j) => j === i || done.has(j) || !behind(plans[j]!, plans[i]!)));
    const pick = (ready.length ? ready : [...Array(n).keys()].filter((i) => !done.has(i))).sort((a, b) => depth[a]! - depth[b]!)[0]!;
    done.add(pick);
    out.push(pick);
  }
  return out;
})();

export const TILE_PATHS: SolidPaths[] = TILES.map((t) => slabOf(planOf(t), 0, topOf(t), P, 6, BEVEL));
/* one soft shadow under the whole field, and a deeper one under the raised tiles */
export const HALO = TILES.map((t) => slabOf({ ...planOf(t), x: planOf(t).x + 4, y: planOf(t).y + 5 }, 0, 0.1, P, 6).fill).join("");

/* the controls in painter's order (all stand on tile tops, so far-to-near by their centres) */
export const CTL_ORDER: number[] = TILES.map((t, i) => {
  const [cx, cy] = centreOf(t);
  return { i, d: depthOf([cx, cy, topOf(t)], P) };
})
  .sort((a, b) => a.d - b.d)
  .map((o) => o.i);

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
  return { rings: keys.map((k) => groups.get(k)!.join("")), radii: keys.map((k) => k * GRILLE.pitch) };
}

/* ---------------------------------------------------------------- loose props on the table */
/* a wire lying on the table, drawn as a tube: a centreline in screen space at the wire's height */
const floorLine = (pts: Plane[], r: number) => pathOf(pts.map(([x, y]) => iso([x, y, r], P)));
function smoothRoute(pts: Plane[], per = 10): Plane[] {
  // Catmull–Rom through the points
  const out: Plane[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]!);
  return out;
}

/* the wire loop: two long legs joined by a round end, one leg a little shorter */
export const CLIP_PATH = (() => {
  const [ax, ay] = CLIP.a;
  const [bx] = CLIP.b;
  const r = CLIP.w / 2;
  const pts: Plane[] = [[bx, ay]];
  for (let k = 0; k <= 24; k++) {
    const a = (-90 - (k * 180) / 24) * RAD;
    pts.push([ax + r + r * cos(a), ay + r + r * sin(a)]);
  }
  pts.push([bx - 9, ay + CLIP.w]);
  return floorLine(pts, CLIP.wire);
})();
export const CLIP_HALO = (() => {
  const [ax, ay] = CLIP.a;
  const [bx] = CLIP.b;
  return slabOf({ x: ax, y: ay + 1.5, w: bx - ax + 2, d: CLIP.w + 2, r: CLIP.w / 2 }, 0, 0.1, P, 8).fill;
})();

/* the jack: a 3.5 mm plug lying along +x, its cable curling round to a second plug lying the other way */
export interface Seg {
  d: string; // a closed outline: the segment's silhouette with straight ends
  tone: "body" | "band" | "metal";
}
/* the silhouette of a short round rod lying on the table along a line: a band of the rod's width on screen */
function rodOn(a: Plane, b: Plane, r: number) {
  const pa = iso([a[0], a[1], r], P);
  const pb = iso([b[0], b[1], r], P);
  const dx = pb[0] - pa[0];
  const dy = pb[1] - pa[1];
  const l = Math.hypot(dx, dy) || 1;
  const h = r * K;
  const nx = (-dy / l) * h;
  const ny = (dx / l) * h;
  return pathOf(
    [
      [pa[0] + nx, pa[1] + ny],
      [pb[0] + nx, pb[1] + ny],
      [pb[0] - nx, pb[1] - ny],
      [pa[0] - nx, pa[1] - ny],
    ],
    true,
  );
}
function plug(tip: Plane, dir: 1 | -1): { segs: Seg[]; end: Plane } {
  const [x0, y] = tip;
  const parts: [number, number, number, Seg["tone"]][] = [
    // [from, to, radius, tone] along the plug from its tip
    [0, 2.6, 1.55, "metal"],
    [2.6, 3.4, 1.75, "band"],
    [3.4, 7.2, 1.75, "metal"],
    [7.2, 8.0, 1.75, "band"],
    [8.0, 15.5, 1.75, "metal"],
    [15.5, 30, 3.3, "body"],
    [30, 37, 2.2, "body"],
  ];
  const segs = parts.map(([a, b, r, tone]) => ({ d: rodOn([x0 + dir * a, y], [x0 + dir * b, y], r), tone }));
  return { segs, end: [x0 + dir * 37, y] };
}
export const JACK_PARTS = (() => {
  const a = plug(JACK.plug, 1);
  const [ex, ey] = a.end;
  const back: Plane = [JACK.plug[0] + 8, JACK.plug[1] - 30];
  const b = plug(back, 1);
  const route = smoothRoute([
    a.end,
    [ex + 14, ey + 1],
    [ex + 30, ey - 6],
    [ex + 34, ey - 19],
    [ex + 22, ey - 29.5],
    [b.end[0] + 6, b.end[1]],
    b.end,
  ]);
  return { plugs: [...a.segs, ...b.segs], cable: floorLine(route, JACK.wire), cableW: 2 * JACK.wire * K, halo: floorLine(route, 0) };
})();
export const CLIP_W = 2 * CLIP.wire * K;
