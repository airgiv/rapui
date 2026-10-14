/* Solids the floor-prism kit can't make: boxes and turned parts at any angle
   (tipping dominoes, the catapult arm, the hammer, the bell), drawn as the kit
   draws its own: a paper fill, four side tones by facing, a lighter top, creases
   where visible faces meet and one silhouette. Also the marble and the rails. */
import { pathOf, type Flat, type SolidPaths } from "../iso/iso-kit";
import { LIGHT, K, RAIL_GAP, RAIL_R, R, SEAT, VIEW, at } from "./view";
import { add, cross, dot, mul, sub, unit, type V3 } from "./vec";
import type { Track } from "./tracks";

interface Face {
  pts: V3[];
  n: V3;
}

function hull(points: Flat[]): Flat[] {
  const s = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (s.length < 3) return s;
  const x = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Flat[] = [];
  for (const p of s) {
    while (lo.length >= 2 && x(lo[lo.length - 2]!, lo[lo.length - 1]!, p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: Flat[] = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i]!;
    while (up.length >= 2 && x(up[up.length - 2]!, up[up.length - 1]!, p) <= 0) up.pop();
    up.push(p);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

const key = (p: V3) => `${p[0].toFixed(2)},${p[1].toFixed(2)},${p[2].toFixed(2)}`;

/* any convex solid from its faces (outward normals) */
export function convex(faces: Face[], { creases = true } = {}): SolidPaths {
  const all: Flat[] = [];
  for (const f of faces) for (const p of f.pts) all.push(at(p));
  const outline = pathOf(hull(all), true);
  const shades: string[][] = [[], [], [], []];
  let top = "";
  let topZ = 0.55;
  const visible = faces.map((f) => dot(f.n, VIEW) > 1e-6);
  faces.forEach((f, i) => {
    if (!visible[i]) return;
    const d = pathOf(f.pts.map(at), true);
    if (f.n[2] > topZ) {
      if (top) shades[3]!.push(top);
      top = d;
      topZ = f.n[2];
      return;
    }
    const h = Math.hypot(f.n[0], f.n[1]) || 1;
    const lit = ((f.n[0] / h) * LIGHT[0] + (f.n[1] / h) * LIGHT[1] + 1) / 2;
    const tone = f.n[2] > 0.35 ? 3 : Math.min(3, Math.max(0, Math.floor(lit * 4)));
    shades[tone]!.push(d);
  });
  let crease = "";
  if (creases) {
    const edges = new Map<string, { a: V3; b: V3; count: number }>();
    faces.forEach((f, i) => {
      if (!visible[i]) return;
      for (let j = 0; j < f.pts.length; j++) {
        const a = f.pts[j]!;
        const b = f.pts[(j + 1) % f.pts.length]!;
        const k = [key(a), key(b)].sort().join("|");
        const e = edges.get(k);
        if (e) e.count++;
        else edges.set(k, { a, b, count: 1 });
      }
    });
    crease = [...edges.values()]
      .filter((e) => e.count > 1)
      .map((e) => pathOf([at(e.a), at(e.b)]))
      .join("");
  }
  return { fill: outline, outline, crease, top, shades: shades.map((list) => list.join("")) };
}

/* a box from its centre, three unit axes and half sizes */
export function box(c: V3, ax: [V3, V3, V3], h: [number, number, number]): SolidPaths {
  const corner = (i: number, j: number, k: number) => add(add(add(c, mul(ax[0], i * h[0])), mul(ax[1], j * h[1])), mul(ax[2], k * h[2]));
  const faces: Face[] = [];
  for (const s of [-1, 1]) {
    faces.push({ n: mul(ax[0], s), pts: [corner(s, -1, -1), corner(s, 1, -1), corner(s, 1, 1), corner(s, -1, 1)] });
    faces.push({ n: mul(ax[1], s), pts: [corner(-1, s, -1), corner(1, s, -1), corner(1, s, 1), corner(-1, s, 1)] });
    faces.push({ n: mul(ax[2], s), pts: [corner(-1, -1, s), corner(1, -1, s), corner(1, 1, s), corner(-1, 1, s)] });
  }
  return convex(faces);
}

export const X: V3 = [1, 0, 0];
export const Y: V3 = [0, 1, 0];
export const Z: V3 = [0, 0, 1];

/* an upright box between two corners */
export const block = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) =>
  box([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [X, Y, Z], [Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, Math.abs(z1 - z0) / 2]);

/* a bar from a to b with a given cross-section (w across, h up) */
export function bar(a: V3, b: V3, w: number, h: number, up: V3 = Z): SolidPaths {
  const d = unit(sub(b, a));
  let side = cross(up, d);
  if (Math.hypot(...side) < 1e-6) side = cross(Y, d);
  side = unit(side);
  const u = unit(cross(d, side));
  const l = Math.hypot(...sub(b, a));
  return box(mul(add(a, b), 0.5), [d, side, u], [l / 2, w / 2, h / 2]);
}

/* a turned part along any axis: radius r0 at s = 0, r1 at s = len */
export function turned(o: V3, axis: V3, r0: number, r1: number, length: number, steps = 28): SolidPaths {
  const a = unit(axis);
  const u = unit(Math.abs(a[2]) < 0.9 ? cross(a, Z) : cross(a, X));
  const v = cross(a, u);
  const ring = (s: number, r: number) =>
    Array.from({ length: steps }, (_, i) => {
      const t = (i / steps) * Math.PI * 2;
      return add(add(o, mul(a, s)), add(mul(u, r * Math.cos(t)), mul(v, r * Math.sin(t))));
    });
  const lo = ring(0, r0);
  const hi = ring(length, r1);
  const faces: Face[] = [
    { n: mul(a, -1), pts: [...lo].reverse() },
    { n: a, pts: hi },
  ];
  const slope = (r0 - r1) / length;
  for (let i = 0; i < steps; i++) {
    const t = ((i + 0.5) / steps) * Math.PI * 2;
    const radial = add(mul(u, Math.cos(t)), mul(v, Math.sin(t)));
    const n = unit(add(radial, mul(a, slope)));
    faces.push({ n, pts: [lo[i]!, lo[(i + 1) % steps]!, hi[(i + 1) % steps]!, hi[i]!] });
  }
  const paths = convex(faces, { creases: false });
  // creases: the rim of whichever cap faces the viewer
  const cap = dot(a, VIEW) > 0 ? hi : dot(a, VIEW) < 0 ? lo : null;
  paths.crease = cap ? pathOf(cap.map(at), true) : "";
  return paths;
}

/* ------------------------------------------------------------------ marble */

const fixed = (v: number) => Math.round(v * 100) / 100;
export const BALL_R = fixed(R * K);
/* the marble drawn at the origin (moved with a translate): fill, the shaded side
   away from the kit's light (from screen left), a glint, the outline */
export const BALL = {
  r: BALL_R,
  shade: `M0 ${-BALL_R}A${BALL_R} ${BALL_R} 0 0 1 0 ${BALL_R}A${fixed(BALL_R * 0.52)} ${BALL_R} 0 0 0 0 ${-BALL_R}Z`,
  glint: [fixed(-BALL_R * 0.38), fixed(-BALL_R * 0.4)] as Flat,
  glintR: fixed(BALL_R * 0.2),
};

/* --------------------------------------------------------------- rails */

export interface RailRun {
  d: string;
  near: boolean;
  side: 1 | -1;
}

/* the two rails under a track, cut into runs on the near and the far side */
export function railsOf(track: Track, trim: [number, number] = [0, 0]): RailRun[] {
  const runs: RailRun[] = [];
  const pts = track.pts;
  for (const side of [1, -1] as const) {
    let run: Flat[] = [];
    let near: boolean | null = null;
    for (let i = 0; i < pts.length; i++) {
      const s = track.cum[i]!;
      if (s < trim[0] - 1e-6 || s > track.len - trim[1] + 1e-6) continue;
      const a = pts[Math.max(0, i - 1)]!;
      const b = pts[Math.min(pts.length - 1, i + 1)]!;
      const d = unit(sub(b, a));
      const lat = unit([d[1], -d[0], 0]);
      const off = mul(lat, side * RAIL_GAP);
      const p = add(add(pts[i]!, off), [0, 0, -SEAT]);
      const isNear = off[0] * VIEW[0] + off[1] * VIEW[1] > 0;
      const flat = at(p);
      if (near === null) near = isNear;
      if (isNear !== near) {
        run.push(flat);
        runs.push({ d: pathOf(run), near, side });
        run = [flat];
        near = isNear;
        continue;
      }
      run.push(flat);
    }
    if (run.length > 1 && near !== null) runs.push({ d: pathOf(run), near, side });
  }
  return runs;
}

/* sleepers under a track every `gap` units: a short bar across both rails */
export function tiesOf(track: Track, gap: number, opts: { from?: number; to?: number; reach?: [number, number]; drop?: number } = {}): { paths: SolidPaths; at: V3; near: boolean }[] {
  const out: { paths: SolidPaths; at: V3; near: boolean }[] = [];
  const from = opts.from ?? gap / 2;
  const to = opts.to ?? track.len - gap / 2;
  const reach = opts.reach ?? [RAIL_GAP + 3, RAIL_GAP + 3];
  const z = SEAT + RAIL_R + 0.9 + (opts.drop ?? 0);
  for (let s = from; s <= to + 1e-6; s += gap) {
    let i = 0;
    while (i < track.cum.length - 2 && track.cum[i + 1]! < s) i++;
    const a = track.pts[i]!;
    const b = track.pts[i + 1]!;
    const f = (s - track.cum[i]!) / (track.cum[i + 1]! - track.cum[i]! || 1);
    const p: V3 = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f - z];
    const d = unit(sub(b, a));
    const lat = unit([d[1], -d[0], 0]);
    out.push({ paths: bar(add(p, mul(lat, -reach[1])), add(p, mul(lat, reach[0])), 2.6, 1.8), at: p, near: dot(lat, VIEW) > 0 });
  }
  return out;
}

export const railWidth = fixed(RAIL_R * 2 * K);
