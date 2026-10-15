/* The world of ControlModules: a field of separate square control tiles butted
   together on a grid on the table, each tile carrying one large control: tall
   knurled knobs (some standing in a wide shallow recess on a 2×2 tile), dark
   round buttons sunk in a rim, soft round buttons with a printed icon, a long
   pill key in a stadium recess, a speaker grille, a fader and two sliding
   switches. World units: x, y on the
   table, z up; one grid cell is 60 units.

   The camera looks from the +x/+y corner, so the grid's diagonal runs across
   the picture. +x goes down-right on screen, +y down-left. The flat tiles sit
   on the left (where the headline is), the tall knobs toward the middle and
   the right, so nothing stands up like a wall beside the words. */
import { iso, type Flat, type Plan, type Point3, type Projection } from "../iso/iso-kit";

export const WIDTH = 640;
export const HEIGHT = 560;

export const U = 60; // one grid cell
export const GAP = 1.5; // the hairline gap between tiles
export const TILE_H = 8.5; // a tile's thickness
export const TILE_R = 6.5; // its corner radius
export const BEVEL = 1.1;
export const ORIGIN_CELL: [number, number] = [2.5, 2.5]; // the lattice's middle sits on the world origin

/* knobs: one size everywhere, a little taller than wide, like the reference */
export const KNOB_R = 20;
export const KNOB_BODY = 33; // the knurled body, from the tile up to the cap's seam
export const KNOB_CAP = 9.5; // the cap on top
export const KNOB_H = KNOB_BODY + KNOB_CAP; // 42.5 tall, 40 across
export const KNURL = [7, 27] as const; // the dotted band, between two seams
export const SOCKET_R = KNOB_R + 3; // the round hole a knob stands in on a 1×1 tile
export const RECESS_R = 39; // the wide shallow recess round a knob on a 2×2 tile
export const RECESS_D = 1.6;

/* buttons */
export const DISC = { rim: 24.5, rimH: 2.8, well: 20.5, disc: 19.4, sink: 1.2, travel: 1.3 };
export const SOFT = { r: 23.5, h: 5.2, travel: 2.8 };
export const PILL = { w: 96, d: 33, h: 4.6, travel: 2.8, pad: 4.4, sink: 1.5 };
export const GRILLE = { n: 14, pitch: 6.5, hole: 1.85, corner: 24 };
/* the fader: a long slot along the tile with a cap that glides, a printed dot scale beside it */
export const FADER = { len: 92, slot: 6, depth: 3, cap: { w: 15, d: 28, h: 8.5, r: 2.6 }, scale: 18.5 };
/* the sliding switches: a thumb in a stadium slot, a small lamp at the "on" end */
export const SWITCH = { len: 38, d: 17, depth: 2.4, thumb: { len: 19, d: 12.4, h: 5.2 }, lamp: 24.5 };

export type Icon = "loop" | "tape" | "wave";
export type Ctl =
  | { kind: "knob"; cap: number | null } // cap: index of a coloured cap (0, 1, 2) or null for a plain white knob
  | { kind: "disc" }
  | { kind: "soft"; icon: Icon }
  | { kind: "pill" }
  | { kind: "grille" }
  | { kind: "fader" } // runs along +x
  | { kind: "switch"; axis: "x" | "y" };

export interface Tile {
  id: string;
  cell: [number, number, number, number]; // x, y, w, d in cells
  lift: number; // a few tiles stand a little higher
  ctl: Ctl;
}

export type Layout = "hero" | "field";

/* the hero: 15 tiles, flat ones toward the headline on the left, the tall knobs in the middle and right */
export const HERO_TILES: Tile[] = [
  { id: "k1", cell: [0, 0, 1, 1], lift: 0, ctl: { kind: "knob", cap: null } },
  { id: "ka", cell: [1, 0, 2, 2], lift: 0, ctl: { kind: "knob", cap: 0 } },
  { id: "k2", cell: [3, 0, 1, 1], lift: 3, ctl: { kind: "knob", cap: null } },
  { id: "d1", cell: [3, 1, 1, 1], lift: 0, ctl: { kind: "disc" } },
  { id: "sl", cell: [0, 1, 1, 1], lift: 0, ctl: { kind: "soft", icon: "loop" } },
  { id: "d2", cell: [0, 2, 1, 1], lift: 2.5, ctl: { kind: "disc" } },
  { id: "kb", cell: [1, 2, 2, 2], lift: 0, ctl: { kind: "knob", cap: 1 } },
  { id: "k3", cell: [3, 2, 1, 1], lift: 0, ctl: { kind: "knob", cap: 2 } },
  { id: "st", cell: [4, 2, 1, 1], lift: 0, ctl: { kind: "soft", icon: "tape" } },
  { id: "gr", cell: [3, 3, 2, 2], lift: 0, ctl: { kind: "grille" } },
  { id: "sw", cell: [0, 3, 1, 1], lift: 0, ctl: { kind: "soft", icon: "wave" } },
  { id: "p1", cell: [1, 4, 2, 1], lift: 0, ctl: { kind: "pill" } },
  { id: "fd", cell: [2, 5, 2, 1], lift: 0, ctl: { kind: "fader" } },
  { id: "s1", cell: [4, 5, 1, 1], lift: 1.5, ctl: { kind: "switch", axis: "x" } },
  { id: "s2", cell: [5, 3, 1, 1], lift: 0, ctl: { kind: "switch", axis: "y" } },
];

export const planOf = (t: Tile): Plan => {
  const [cx, cy, cw, cd] = t.cell;
  return {
    x: (cx - ORIGIN_CELL[0]) * U + GAP / 2,
    y: (cy - ORIGIN_CELL[1]) * U + GAP / 2,
    w: cw * U - GAP,
    d: cd * U - GAP,
    r: TILE_R,
  };
};
export const centreOf = (t: Tile): [number, number] => {
  const p = planOf(t);
  return [p.x + p.w / 2, p.y + p.d / 2];
};
export const topOf = (t: Tile) => TILE_H + t.lift;

/* the field: a wide scattered band of 26 tiles for a landing block. Everything sits right of the
   x − y = −5 diagonal, so the left of the picture stays empty floor for a headline (see FIELD_TEXT in world.ts);
   a few gaps and two small islands keep the outline loose. */
const k = (id: string, x: number, y: number, cap: number | null, size = 1, lift = 0): Tile => ({ id, cell: [x, y, size, size], lift, ctl: { kind: "knob", cap } });
const one = (id: string, x: number, y: number, ctl: Ctl, lift = 0): Tile => ({ id, cell: [x, y, 1, 1], lift, ctl });
export const FIELD_TILES: Tile[] = [
  // the far island
  k("f-k1", 3, -2, null),
  one("f-s1", 4, -2, { kind: "switch", axis: "y" }),
  k("f-ka", 5, -2, 0, 2),
  one("f-d1", 7, -1, { kind: "disc" }, 2),
  // the main field
  one("f-l1", 2, 0, { kind: "soft", icon: "loop" }),
  k("f-k2", 3, 0, null, 1, 3),
  one("f-d2", 4, 0, { kind: "disc" }),
  { id: "f-fd1", cell: [5, 0, 2, 1], lift: 0, ctl: { kind: "fader" } },
  k("f-k3", 7, 0, 1),
  one("f-t1", 1, 1, { kind: "soft", icon: "tape" }),
  { id: "f-p1", cell: [2, 1, 2, 1], lift: 0, ctl: { kind: "pill" } },
  { id: "f-g1", cell: [4, 1, 2, 2], lift: 0, ctl: { kind: "grille" } },
  k("f-kb", 6, 1, 2, 2),
  one("f-s2", 1, 2, { kind: "switch", axis: "x" }, 1.5),
  k("f-k4", 2, 2, null),
  one("f-w1", 3, 2, { kind: "soft", icon: "wave" }),
  one("f-d3", 8, 2, { kind: "disc" }),
  { id: "f-fd2", cell: [1, 3, 2, 1], lift: 0, ctl: { kind: "fader" } },
  k("f-kc", 3, 3, 0, 2),
  one("f-l2", 5, 3, { kind: "soft", icon: "loop" }),
  k("f-k5", 6, 3, 1, 1, 2),
  one("f-s3", 7, 3, { kind: "switch", axis: "y" }),
  // the near island
  { id: "f-p2", cell: [2, 5, 2, 1], lift: 0, ctl: { kind: "pill" } },
  one("f-d4", 4, 5, { kind: "disc" }),
  k("f-k6", 5, 5, null),
  one("f-t2", 6, 5, { kind: "soft", icon: "tape" }, 2),
];

/* the furthest points of a set of tiles, knob tops included, for framing */
export function extremesOf(tiles: Tile[]): Point3[] {
  const out: Point3[] = [];
  for (const t of tiles) {
    const p = planOf(t);
    for (const x of [p.x, p.x + p.w]) for (const y of [p.y, p.y + p.d]) out.push([x, y, 0], [x, y, topOf(t)]);
    if (t.ctl.kind === "knob") {
      const [cx, cy] = centreOf(t);
      for (const a of [0, 90, 180, 270]) {
        const r = (a * Math.PI) / 180;
        out.push([cx + KNOB_R * Math.cos(r), cy + KNOB_R * Math.sin(r), topOf(t) + KNOB_H]);
      }
    }
  }
  return out;
}

/* camera: the kit's 45° azimuth, looking down a little steeper than 30° */
export const AZIMUTH = 45;
export const ELEVATION = 34;

function fit(points: Point3[], pad: number): Projection {
  const unit: Projection = { origin: [0, 0], scale: 1, azimuth: AZIMUTH, elevation: ELEVATION };
  const flat = points.map((p) => iso(p, unit));
  const xs = flat.map(([x]) => x);
  const ys = flat.map(([, y]) => y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const up = Math.min(...ys);
  const down = Math.max(...ys);
  const scale = Math.min((WIDTH - pad * 2) / (right - left), (HEIGHT - pad * 2) / (down - up));
  return {
    origin: [WIDTH / 2 - ((left + right) / 2) * scale, HEIGHT / 2 - ((up + down) / 2) * scale],
    scale,
    azimuth: AZIMUTH,
    elevation: ELEVATION,
  };
}

/* one camera for every layout (the hero frames it); a layout only picks its own viewBox */
export const P = fit(extremesOf(HERO_TILES), 16);
export const at = (p: Point3): Flat => iso(p, P);
export const K = P.scale * Math.sqrt(1.6); // screen units per world unit across the view
export const RAD = Math.PI / 180;
