/* ── sticker outlines ─────────────────────────────────────
   The same trick as ShapeGallery, sized to the real sticker:
   every shape is a signed-distance function in the sticker's
   own pixels, and its outline is found by shooting rays from
   the middle and bisecting each one to the edge. Two things
   follow from that:

   1. Everything is smooth and crisp at any size. A pill that
      holds "sale −30%" is cut for that width, not stretched
      from a 100×100 drawing, so corners stay round and the
      die-cut border keeps one thickness all the way round.
   2. Every outline of one box has the SAME number of points on
      the SAME rays, so point k of the circle and point k of the
      scalloped seal line up and CSS can interpolate `d` between
      them: the outline flows into the next shape on hover.

   Rays are aimed at points spaced evenly along a rounded box
   (not at even angles), so a long label gets as many points
   along its flat top as round its ends. ~1.5px apart: below
   ~2px the stamp's perforation facets; above it there is
   nothing to see. The march steps in from outside, so the
   outermost edge wins (a speech bubble's tail stays whole). */

export type ShapeKey =
  | "pill"
  | "circle"
  | "tag"
  | "star"
  | "burst"
  | "flower"
  | "clover"
  | "blob"
  | "heart"
  | "squircle"
  | "seal"
  | "ticket"
  | "bubble"
  | "arch"
  | "stamp"
  | "label"
  /* hover partners, not public shapes */
  | "scallop"
  | "burst-puff"
  | "star-puff"
  | "seal-puff"
  | "capsule";

type Pt = [number, number];
type Sdf = (x: number, y: number) => number;
interface Box {
  /** half width / half height / half of the shorter side, px */
  a: number;
  b: number;
  m: number;
  em: number;
}
interface ShapeDef {
  sdf: Sdf;
  /** Where the rays start (px from the box centre). Must see the whole edge. */
  origin?: Pt;
}

/* ── distance helpers ───────────────────────────────────── */
const { abs, hypot, max, min, cos, sin, atan2, round, PI, SQRT1_2 } = Math;
const clamp = (v: number, lo: number, hi: number) => min(hi, max(lo, v));

function sdRoundBox(x: number, y: number, a: number, b: number, rTop: number, rBot = rTop) {
  const r = y < 0 ? rTop : rBot;
  const qx = abs(x) - a + r;
  const qy = abs(y) - b + r;
  return min(max(qx, qy), 0) + hypot(max(qx, 0), max(qy, 0)) - r;
}
const sdBox = (x: number, y: number, a: number, b: number) => sdRoundBox(x, y, a, b, 0);

/* Inigo Quilez's exact polygon distance */
function sdPolygon(v: Pt[], x: number, y: number) {
  let d = (x - v[0][0]) ** 2 + (y - v[0][1]) ** 2;
  let s = 1;
  for (let i = 0, j = v.length - 1; i < v.length; j = i, i++) {
    const ex = v[j][0] - v[i][0];
    const ey = v[j][1] - v[i][1];
    const wx = x - v[i][0];
    const wy = y - v[i][1];
    const h = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
    d = min(d, (wx - ex * h) ** 2 + (wy - ey * h) ** 2);
    const c1 = y >= v[i][1];
    const c2 = y < v[j][1];
    const c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

/* smooth union: the bubble's tail grows out of the body instead of being stuck on */
const smin = (p: number, q: number, k: number) => {
  const h = max(k - abs(p - q), 0) / k;
  return min(p, q) - h * h * k * 0.25;
};

/* a round outline from a radius function; t = −π/2 is straight up */
const polar = (r: (t: number) => number): Sdf => (x, y) => hypot(x, y) - r(atan2(y, x));

/* iq's heart, point at (0,0), lobes up to y≈1.1 (y up) */
function sdHeart(x: number, y: number) {
  x = abs(x);
  if (y + x > 1) return hypot(x - 0.25, y - 0.75) - SQRT1_2 / 2;
  const t = 0.5 * max(x + y, 0);
  return Math.sqrt(min(x * x + (y - 1) ** 2, (x - t) ** 2 + (y - t) ** 2)) * Math.sign(x - y);
}

/* ── the shapes ─────────────────────────────────────────── */
function define(key: ShapeKey, { a, b, m, em }: Box): ShapeDef {
  switch (key) {
    case "pill":
      return { sdf: (x, y) => sdRoundBox(x, y, a, b, min(a, b)) };
    case "capsule":
      /* the arch's hover partner: round at both ends */
      return { sdf: (x, y) => sdRoundBox(x, y, a, b, min(a, b)) };
    case "circle":
      return { sdf: (x, y) => hypot(x, y) - m };
    case "squircle":
      /* exponent 4: rounder than a rounded square, squarer than a circle */
      return { sdf: (x, y) => ((abs(x) / a) ** 4 + (abs(y) / b) ** 4) ** 0.25 * m - m };
    case "blob":
      return { sdf: polar((t) => m * (0.91 + 0.055 * sin(3 * t + 0.8) + 0.035 * cos(5 * t - 0.4))) };
    case "flower":
      /* six fat petals, one pointing up */
      return { sdf: polar((t) => m * (0.77 + 0.23 * cos(6 * (t + PI / 2)))) };
    case "clover":
      return { sdf: polar((t) => m * (0.72 + 0.28 * cos(4 * (t + PI / 2)))) };
    case "scallop":
      /* ShapeGallery's flower: twelve shallow scallops */
      return { sdf: polar((t) => m * (0.9 + 0.1 * cos(12 * t))) };
    case "burst":
      /* "hot drop": ten soft lobes, 8% deep — reads as a burst without a single point */
      return { sdf: polar((t) => m * (0.9 + 0.08 * cos(10 * t))) };
    case "burst-puff":
      return { sdf: polar((t) => m * (0.89 + 0.13 * cos(10 * t))) };
    case "seal":
    case "seal-puff": {
      /* a certificate seal: 24 round bumps with tucked-in valleys (|cos|^0.6) */
      const k = key === "seal" ? 0.075 : 0.11;
      return { sdf: polar((t) => m * (0.99 - k + k * abs(cos(12 * t)) ** 0.6)) };
    }
    case "star":
    case "star-puff": {
      /* five points from one smooth function, so tips AND valleys are round.
         Shifted down 9% so the star's box, not its centre, sits in the middle. */
      const [lo, p] = key === "star" ? [0.5, 1.5] : [0.64, 1.2];
      const dy = m * 0.09;
      const r = (t: number) => m * (lo + (1 - lo) * ((1 + cos(5 * (t + PI / 2))) / 2) ** p);
      return { sdf: (x, y) => hypot(x, y - dy) - r(atan2(y - dy, x)), origin: [0, dy] };
    }
    case "heart": {
      /* the heart spans x ±0.604, y 0…1.104 (y up); fit it, round the point by 0.05 */
      const round = 0.05;
      const s = min((2 * a) / (1.21 + 2 * round), (2 * b) / (1.104 + 2 * round));
      const cy = 0.552;
      return {
        sdf: (x, y) => (sdHeart(x / s, cy - y / s) - round) * s,
        origin: [0, (cy - 0.64) * s],
      };
    }
    case "tag": {
      /* a price tag: square end, tapered end with a rounded tip */
      const r = min(0.28 * em, b * 0.4);
      const k = b * 0.85;
      const v: Pt[] = [
        [-a + r * 1.9, 0],
        [-a + k + r * 0.3, -(b - r)],
        [a - r, -(b - r)],
        [a - r, b - r],
        [-a + k + r * 0.3, b - r],
      ];
      return { sdf: (x, y) => sdPolygon(v, x, y) - r };
    }
    case "ticket": {
      /* bitten corners and two notches where the stub tears off */
      const c = min(0.5 * em, b * 0.45);
      const rn = min(0.26 * em, b * 0.25);
      const xs = a - 2.05 * em;
      return {
        sdf: (x, y) => {
          let d = sdBox(x, y, a, b);
          d = max(d, c - hypot(abs(x) - a, abs(y) - b));
          return max(d, rn - hypot(x - xs, abs(y) - b));
        },
      };
    }
    case "stamp": {
      /* perforated: a hole every ~0.62em along each edge, corners included */
      const nx = max(2, round((2 * a) / (0.62 * em)));
      const ny = max(2, round((2 * b) / (0.62 * em)));
      const sx = (2 * a) / nx;
      const sy = (2 * b) / ny;
      const rb = min(sx, sy) * 0.3;
      return {
        sdf: (x, y) => {
          const hx = clamp(round((x + a) / sx), 0, nx) * sx - a;
          const hy = clamp(round((y + b) / sy), 0, ny) * sy - b;
          const hole = min(hypot(x - hx, abs(y) - b), hypot(abs(x) - a, y - hy));
          return max(sdBox(x, y, a, b), rb - hole);
        },
      };
    }
    case "bubble": {
      /* a rounded body with a tail at the bottom left, melted together */
      const th = tailOf(em, b);
      const cy = -th / 2;
      const bb = b - th / 2;
      const body = (x: number, y: number) => sdRoundBox(x, y - cy, a, bb, min(0.95 * em, bb));
      const base = b - th - 0.45 * em;
      const tail: Pt[] = [
        [-a * 0.42, base],
        [-a * 0.02 - 0.2 * em, base],
        [-a * 0.52, b - 1.2],
      ];
      return { sdf: (x, y) => smin(body(x, y), sdPolygon(tail, x, y) - 1.2, 0.35 * em), origin: [0, cy] };
    }
    case "arch":
      return { sdf: (x, y) => sdRoundBox(x, y, a, b, min(a, b), min(0.4 * em, a * 0.3)) };
    case "label":
      return { sdf: (x, y) => sdRoundBox(x, y, a, b, min(0.42 * em, b * 0.5)) };
  }
}

/** How tall the speech bubble's tail is (the sticker pads its text by this much). */
export const tailOf = (em: number, b: number) => min(0.62 * em, b * 0.5);

/* ── sampling ───────────────────────────────────────────── */

/* evenly spaced points along a rounded box — where the rays aim */
function aimPoints(a: number, b: number, n: number): Pt[] {
  const r = min(a, b) * 0.6;
  const sx = a - r;
  const sy = b - r;
  const arc = (PI / 2) * r;
  /* start at top-centre and go clockwise (y down) */
  const segs: [number, (u: number) => Pt][] = [
    [sx, (u) => [u, -b]],
    [arc, (u) => [sx + r * sin(u / r), -sy - r * cos(u / r)]],
    [2 * sy, (u) => [a, -sy + u]],
    [arc, (u) => [sx + r * cos(u / r), sy + r * sin(u / r)]],
    [2 * sx, (u) => [sx - u, b]],
    [arc, (u) => [-sx - r * sin(u / r), sy + r * cos(u / r)]],
    [2 * sy, (u) => [-a, sy - u]],
    [arc, (u) => [-sx - r * cos(u / r), -sy - r * sin(u / r)]],
    [sx, (u) => [-sx + u, -b]],
  ];
  const total = segs.reduce((s, [l]) => s + l, 0);
  const out: Pt[] = [];
  let si = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const s = (k / n) * total;
    while (si < segs.length - 1 && s > acc + segs[si][0]) acc += segs[si++][0];
    out.push(segs[si][1](s - acc));
  }
  return out;
}

function trace(def: ShapeDef, aims: Pt[], reach: number): Pt[] {
  const [ox, oy] = def.origin ?? [0, 0];
  const f = def.sdf;
  return aims.map(([px, py]) => {
    let dx = px - ox;
    let dy = py - oy;
    const l = hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    const step = 1.5;
    let t = reach;
    while (t > 0 && f(ox + dx * t, oy + dy * t) >= 0) t -= step;
    if (t <= 0) return [ox, oy] as Pt;
    let lo = t;
    let hi = t + step;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (f(ox + dx * mid, oy + dy * mid) < 0) lo = mid;
      else hi = mid;
    }
    return [ox + dx * lo, oy + dy * lo] as Pt;
  });
}

/* ── the peel ───────────────────────────────────────────────
   A corner folded back along a line: everything past the line
   is pressed onto it (the sticker) and mirrored across it (the
   flap, showing its back). Both keep all N points — the flap's
   unused points wait on the ends of the fold — so a peel can
   grow on hover by interpolating `d` like any other morph. */
const U: Pt = [SQRT1_2, -SQRT1_2]; /* toward the top-right corner */
function peel(pts: Pt[], depth: number): { kept: Pt[]; flap: Pt[] } {
  const dot = (p: Pt) => p[0] * U[0] + p[1] * U[1];
  const s = pts.map(dot);
  const top = max(...s);
  const c = top - depth;
  const n = pts.length;
  const kept = pts.map((p, i) => (s[i] > c ? ([p[0] - (s[i] - c) * U[0], p[1] - (s[i] - c) * U[1]] as Pt) : p));
  const start = s.findIndex((v, i) => v > c && s[(i - 1 + n) % n] <= c);
  if (depth <= 0 || start < 0) {
    const tip = pts[s.indexOf(top)];
    return { kept: pts, flap: pts.map(() => tip) };
  }
  let end = start;
  while (s[(end + 1) % n] > c && (end + 1) % n !== start) end = (end + 1) % n;
  const cross = (i: number, j: number): Pt => {
    const t = (c - s[i]) / (s[j] - s[i]);
    return [pts[i][0] + (pts[j][0] - pts[i][0]) * t, pts[i][1] + (pts[j][1] - pts[i][1]) * t];
  };
  const x1 = cross((start - 1 + n) % n, start);
  const x2 = cross(end, (end + 1) % n);
  const flap: Pt[] = new Array(n);
  const runLen = ((end - start + n) % n) + 1;
  const rest = n - runLen;
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    if (k < runLen) {
      const d = s[i] - c;
      flap[i] = [pts[i][0] - 2 * d * U[0], pts[i][1] - 2 * d * U[1]];
    } else flap[i] = k - runLen < rest / 2 ? x2 : x1;
  }
  return { kept, flap };
}

/* ── output ─────────────────────────────────────────────── */

export interface StickerGeometry {
  /** Outline at rest and under the hand (same point count). */
  d0: string;
  d1: string;
  /** The folded-back corner at rest and under the hand, when there is one. */
  flap0?: string;
  flap1?: string;
}

const toPath = (pts: Pt[], w: number, h: number, extra = "") => {
  let d = "";
  for (let i = 0; i < pts.length; i++) d += `${i ? "L" : "M"}${(pts[i][0] + w / 2).toFixed(1)} ${(pts[i][1] + h / 2).toFixed(1)}`;
  return d + "Z" + extra;
};

/** A punched hole as a second, reversed ring (fill-rule evenodd cuts it out). */
export const holePath = (cx: number, cy: number, r: number) => {
  let d = "";
  for (let i = 0; i < 28; i++) {
    const t = (-i / 28) * PI * 2;
    d += `${i ? "L" : "M"}${(cx + r * cos(t)).toFixed(1)} ${(cy + r * sin(t)).toFixed(1)}`;
  }
  return d + "Z";
};

/** Where the price tag's hole sits, in viewBox px. */
export const tagHole = (h: number, em: number) => {
  const b = h / 2;
  return { cx: b * 0.85 * 0.62, cy: b, r: min(b * 0.2, 0.2 * em) };
};

/** Where the ticket's stub tears off, in viewBox px from the left. */
export const ticketTear = (w: number, em: number) => w - 2.05 * em;

const cache = new Map<string, StickerGeometry>();

export interface GeometryOptions {
  /** Shape to become under the hand (same box). */
  morph?: ShapeKey | null;
  /** Corner fold depth at rest and under the hand, px (0 = none). */
  peel?: [number, number] | null;
}

export function stickerGeometry(shape: ShapeKey, w: number, h: number, em: number, opts: GeometryOptions = {}): StickerGeometry {
  const key = `${shape}|${w}|${h}|${em}|${opts.morph ?? ""}|${opts.peel ?? ""}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const box: Box = { a: w / 2, b: h / 2, m: min(w, h) / 2, em };
  const sx = w / 2 - min(w, h) * 0.3;
  const sy = h / 2 - min(w, h) * 0.3;
  const perimeter = 4 * (sx + sy) + PI * min(w, h) * 0.6;
  const n = clamp(round(perimeter / 1.5), 160, 720);
  const aims = aimPoints(box.a, box.b, n);
  const reach = hypot(w, h) * 0.75 + 4;
  const base = trace(define(shape, box), aims, reach);
  const hole = shape === "tag" ? tagHole(h, em) : null;
  const extra = hole ? holePath(hole.cx, hole.cy, hole.r) : "";
  let out: StickerGeometry;
  if (opts.peel) {
    const lim = min(w, h) * 0.42;
    const p0 = peel(base, min(opts.peel[0], lim));
    const p1 = peel(base, min(opts.peel[1], lim));
    out = {
      d0: toPath(p0.kept, w, h, extra),
      d1: toPath(p1.kept, w, h, extra),
      flap0: toPath(p0.flap, w, h),
      flap1: toPath(p1.flap, w, h),
    };
  } else {
    const d0 = toPath(base, w, h, extra);
    const d1 = opts.morph && opts.morph !== shape ? toPath(trace(define(opts.morph, box), aims, reach), w, h, extra) : d0;
    out = { d0, d1 };
  }
  if (cache.size > 400) cache.clear();
  cache.set(key, out);
  return out;
}
