/* The shapes behind <Figure>: each one is a set of 3D polylines in a unit
   space (it fits a sphere of radius ~1). Static shapes are built once; a few
   (wave, tesseract, gyroscope) take the time and move inside themselves.
   `accent` lines are drawn in the accent colour where the look allows. */

export type Vec3 = [number, number, number];
export interface ShapeFrame {
  lines: Vec3[][];
  accent?: Vec3[][];
}
export interface ShapeDef {
  /** Built once (static) or every frame from the time in seconds. */
  build: (t: number) => ShapeFrame;
  animated?: boolean;
  /** How it sits best: a pitch (deg) that shows it off. */
  pitch?: number;
}

const TAU = Math.PI * 2;

/* edges of a convex polyhedron: every pair of vertices at the shortest distance */
function edgesByDistance(v: Vec3[], tol = 1e-3): Vec3[][] {
  let min = Infinity;
  for (let i = 0; i < v.length; i++)
    for (let j = i + 1; j < v.length; j++) min = Math.min(min, dist(v[i], v[j]));
  const out: Vec3[][] = [];
  for (let i = 0; i < v.length; i++)
    for (let j = i + 1; j < v.length; j++) if (Math.abs(dist(v[i], v[j]) - min) < tol * Math.max(1, min) * 10) out.push([v[i], v[j]]);
  return out;
}
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const scale = (v: Vec3[], k: number): Vec3[] => v.map(([x, y, z]) => [x * k, y * k, z * k]);
const norm = (v: Vec3[]) => scale(v, 1 / Math.max(...v.map((p) => Math.hypot(...p))));

function circle(r: number, y: number, n = 64, axis: "y" | "x" | "z" = "y", c: Vec3 = [0, 0, 0]): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const p: Vec3 = axis === "y" ? [Math.cos(a) * r, y, Math.sin(a) * r] : axis === "x" ? [y, Math.cos(a) * r, Math.sin(a) * r] : [Math.cos(a) * r, Math.sin(a) * r, y];
    pts.push([p[0] + c[0], p[1] + c[1], p[2] + c[2]]);
  }
  return pts;
}

const PHI = (1 + Math.sqrt(5)) / 2;

const cubeV: Vec3[] = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) cubeV.push([x, y, z]);

const solid = (v: Vec3[]): ShapeDef => {
  const lines = edgesByDistance(norm(v));
  return { build: () => ({ lines }) };
};

/* a box from corner a to corner b, as its 12 edges */
function box([x0, y0, z0]: Vec3, [x1, y1, z1]: Vec3): Vec3[][] {
  const c: Vec3[] = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) c.push([x, y, z]);
  const e: Vec3[][] = [];
  for (let i = 0; i < 8; i++)
    for (let j = i + 1; j < 8; j++) {
      const d = (c[i][0] !== c[j][0] ? 1 : 0) + (c[i][1] !== c[j][1] ? 1 : 0) + (c[i][2] !== c[j][2] ? 1 : 0);
      if (d === 1) e.push([c[i], c[j]]);
    }
  return e;
}

/* 4D hypercube, turned in the xw and zw planes, then projected to 3D */
const tessV: number[][] = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) for (const w of [-1, 1]) tessV.push([x, y, z, w]);
const tessE: [number, number][] = [];
for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) if (tessV[i].filter((c, k) => c !== tessV[j][k]).length === 1) tessE.push([i, j]);

export const SHAPES = {
  cube: { build: () => ({ lines: edgesByDistance(scale(cubeV, 0.62)) }) },
  tetrahedron: solid([
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ]),
  octahedron: solid([
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]),
  icosahedron: solid(
    [
      [0, 1, PHI],
      [0, -1, PHI],
      [0, 1, -PHI],
      [0, -1, -PHI],
      [1, PHI, 0],
      [-1, PHI, 0],
      [1, -PHI, 0],
      [-1, -PHI, 0],
      [PHI, 0, 1],
      [-PHI, 0, 1],
      [PHI, 0, -1],
      [-PHI, 0, -1],
    ] as Vec3[],
  ),
  dodecahedron: solid([
    ...cubeV,
    ...[1, -1].flatMap((a) => [1, -1].flatMap((b) => [[0, a / PHI, b * PHI] as Vec3, [a / PHI, b * PHI, 0] as Vec3, [a * PHI, 0, b / PHI] as Vec3])),
  ]),
  sphere: {
    build: () => {
      const lines: Vec3[][] = [];
      for (let i = 1; i < 8; i++) {
        const lat = -Math.PI / 2 + (i / 8) * Math.PI;
        lines.push(circle(Math.cos(lat), Math.sin(lat)));
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI;
        const m: Vec3[] = [];
        for (let k = 0; k <= 48; k++) {
          const b = (k / 48) * TAU;
          m.push([Math.cos(b) * Math.cos(a), Math.sin(b), Math.cos(b) * Math.sin(a)]);
        }
        lines.push(m);
      }
      return { lines, accent: [circle(1, 0)] };
    },
  },
  torus: {
    pitch: 50,
    build: () => {
      const R = 0.68,
        r = 0.3;
      const lines: Vec3[][] = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        const ring: Vec3[] = [];
        for (let k = 0; k <= 24; k++) {
          const b = (k / 24) * TAU;
          ring.push([(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]);
        }
        lines.push(ring);
      }
      for (const b of [0, Math.PI]) lines.push(circle(R + r * Math.cos(b), 0, 72));
      return { lines, accent: [circle(R, r, 72)] };
    },
  },
  cylinder: {
    build: () => {
      const lines: Vec3[][] = [circle(0.6, 0.8), circle(0.6, -0.8)];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU;
        lines.push([
          [Math.cos(a) * 0.6, 0.8, Math.sin(a) * 0.6],
          [Math.cos(a) * 0.6, -0.8, Math.sin(a) * 0.6],
        ]);
      }
      return { lines, accent: [circle(0.6, 0)] };
    },
  },
  cone: {
    build: () => {
      const lines: Vec3[][] = [circle(0.75, -0.7), circle(0.375, 0.1)];
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        lines.push([
          [Math.cos(a) * 0.75, -0.7, Math.sin(a) * 0.75],
          [0, 0.9, 0],
        ]);
      }
      return { lines };
    },
  },
  pyramid: {
    build: () => {
      const b: Vec3[] = [
        [-0.7, -0.6, -0.7],
        [0.7, -0.6, -0.7],
        [0.7, -0.6, 0.7],
        [-0.7, -0.6, 0.7],
      ];
      const top: Vec3 = [0, 0.85, 0];
      const lines: Vec3[][] = [[...b, b[0]], ...b.map((p) => [p, top])];
      // the courses of stone: smaller squares climbing the faces
      for (let k = 1; k < 5; k++) {
        const f = k / 5;
        const sq = b.map(([x, y, z]) => [x * (1 - f), y + (top[1] - y) * f, z * (1 - f)] as Vec3);
        lines.push([...sq, sq[0]]);
      }
      return { lines };
    },
  },
  helix: {
    build: () => {
      const a: Vec3[] = [],
        b: Vec3[] = [];
      const rungs: Vec3[][] = [];
      for (let i = 0; i <= 160; i++) {
        const t = i / 160;
        const ang = t * TAU * 3;
        const y = -0.95 + t * 1.9;
        a.push([Math.cos(ang) * 0.5, y, Math.sin(ang) * 0.5]);
        b.push([Math.cos(ang + Math.PI) * 0.5, y, Math.sin(ang + Math.PI) * 0.5]);
        if (i % 8 === 0) rungs.push([a[a.length - 1], b[b.length - 1]]);
      }
      return { lines: [b, ...rungs], accent: [a] };
    },
  },
  knot: {
    pitch: 62,
    build: () => {
      // a (2,3) torus knot — the trefoil — drawn as a ribbon: two strands and the rungs between them
      const at = (t: number, dy: number): Vec3 => {
        const r = 0.62 + 0.3 * Math.cos(3 * t);
        return [r * Math.cos(2 * t), 0.34 * Math.sin(3 * t) + dy, r * Math.sin(2 * t)];
      };
      const a: Vec3[] = [],
        b: Vec3[] = [],
        rungs: Vec3[][] = [];
      for (let i = 0; i <= 360; i++) {
        const t = (i / 360) * TAU;
        a.push(at(t, 0.05));
        b.push(at(t, -0.05));
        if (i % 6 === 0) rungs.push([a[i], b[i]]);
      }
      return { lines: [b, ...rungs], accent: [a] };
    },
  },
  stairs: {
    pitch: 30,
    build: () => {
      const lines: Vec3[][] = [];
      const n = 5,
        w = 0.5,
        step = 1.6 / n;
      for (let i = 0; i < n; i++) lines.push(...box([-0.8 + i * step, -0.8, -w], [-0.8 + (i + 1) * step, -0.8 + (i + 1) * step, w]));
      return { lines };
    },
  },
  lattice: {
    build: () => {
      const lines: Vec3[][] = [];
      const s = [-0.6, 0, 0.6];
      for (const a of s)
        for (const b of s) {
          lines.push([
            [-0.6, a, b],
            [0.6, a, b],
          ]);
          lines.push([
            [a, -0.6, b],
            [a, 0.6, b],
          ]);
          lines.push([
            [a, b, -0.6],
            [a, b, 0.6],
          ]);
        }
      return { lines, accent: box([-0.15, -0.15, -0.15], [0.15, 0.15, 0.15]) };
    },
  },
} satisfies Record<string, ShapeDef>;

/* Shapes that move inside themselves (a rolling wave, a tumbling gyroscope, a
   tesseract turning in 4D). Parked: they rebuild every frame and don't yet move
   as smoothly as the rest. Not in the catalogue until they do. */
export const MOVING_SHAPES = {
  wave: {
    animated: true,
    pitch: 30,
    build: (t) => {
      const lines: Vec3[][] = [];
      const n = 14;
      const h = (x: number, z: number) => 0.16 * Math.sin(x * 3.2 + t * 1.6) * Math.cos(z * 2.6 + t * 1.1);
      for (let i = 0; i <= n; i++) {
        const a = -1 + (2 * i) / n;
        const row: Vec3[] = [],
          col: Vec3[] = [];
        for (let k = 0; k <= 32; k++) {
          const b = -1 + (2 * k) / 32;
          row.push([b * 0.85, h(b, a), a * 0.85]);
          col.push([a * 0.85, h(a, b), b * 0.85]);
        }
        lines.push(row, col);
      }
      return { lines };
    },
  },
  gyroscope: {
    animated: true,
    build: (t) => {
      // three rings on nested gimbals, each turning at its own pace
      const rot = (p: Vec3[], ax: "x" | "z", a: number) =>
        p.map(([x, y, z]) => (ax === "x" ? [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)] : [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]) as Vec3);
      const outer = circle(0.95, 0, 72, "z");
      const mid = rot(circle(0.78, 0, 72, "x"), "z", t * 0.7);
      const inner = rot(rot(circle(0.6, 0, 72, "y"), "x", t * 1.3), "z", t * 0.7);
      const axle: Vec3[] = [
        [0, -1.05, 0],
        [0, 1.05, 0],
      ];
      return { lines: [outer, mid, axle], accent: [inner] };
    },
  },
  tesseract: {
    animated: true,
    build: (t) => {
      const a = t * 0.6,
        b = t * 0.35;
      const p = tessV.map(([x, y, z, w]) => {
        // xw then zw rotation
        const x1 = x * Math.cos(a) - w * Math.sin(a),
          w1 = x * Math.sin(a) + w * Math.cos(a);
        const z1 = z * Math.cos(b) - w1 * Math.sin(b),
          w2 = z * Math.sin(b) + w1 * Math.cos(b);
        const k = 1.6 / (3 - w2); // 4D → 3D perspective
        return [x1 * k * 0.6, y * k * 0.6, z1 * k * 0.6] as Vec3;
      });
      const lines: Vec3[][] = [],
        accent: Vec3[][] = [];
      for (const [i, j] of tessE) (tessV[i][3] === -1 && tessV[j][3] === -1 ? accent : lines).push([p[i], p[j]]);
      return { lines, accent };
    },
  },
} satisfies Record<string, ShapeDef>;

export type FigureShape = keyof typeof SHAPES;
export const FIGURE_SHAPES = Object.keys(SHAPES) as FigureShape[];
