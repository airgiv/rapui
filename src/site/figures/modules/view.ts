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
/* the rocker: a bezel and a cap of two halves that tip, the lamp beside it */
export const ROCKER = { len: 40, w: 27, depth: 1.8, half: 19.4, hw: 22.5, lo: 3, hi: 7.6, lamp: 25 };
/* four tiny keys on a 2×1 tile */
export const KEYS = { n: 4, pitch: 25, w: 20.5, d: 27, h: 5, travel: 2.2 };
/* a 3×3 pad grid */
export const PADS = { pitch: 16.2, s: 13.6, h: 2.8, travel: 1.3 };
/* the LCD: a bezel sunk in a 2×1 tile, digits in the glass's plane */
export const LCD = { w: 100, d: 38, depth: 1.5 };
/* the joystick nub: a socket, a rubber boot, a shaft and a ball that tilt */
export const STICK = { socket: 17, boot: 11.5, bootH: 3.2, shaft: 3.3, shaftH: 13, ball: 7.2, tilt: 7 };
/* ten LEDs along a 2×1 tile */
export const LEDS = { n: 10, pitch: 9.6, r: 2.6 };
/* the jog wheel: a big flat dial with a finger dimple, on a 1×1 (r 25) or a 2×2 tile (r 46) */
export const JOG = { h: 5, small: 25, big: 46 };

export type Icon = "loop" | "tape" | "wave";
export type Ctl =
  // cap: index of a coloured cap (0, 1, 2) or null for a plain white knob; jog: a big flat dial with a finger dimple
  | { kind: "knob"; cap: number | null; jog?: boolean }
  | { kind: "disc" }
  | { kind: "soft"; icon: Icon }
  | { kind: "pill" }
  | { kind: "grille" }
  | { kind: "fader"; axis?: "x" | "y" } // runs along +x unless axis is "y"
  | { kind: "switch"; axis: "x" | "y"; rocker?: boolean } // a sliding switch, or a rocker that tips
  | { kind: "keys" } // a row of four tiny keys along +x (a 2×1 tile)
  | { kind: "pads" } // a 3×3 grid of small pads
  | { kind: "display" } // a small LCD with digits (a 2×1 tile along +x)
  | { kind: "stick" } // a joystick nub
  | { kind: "leds" }; // a strip of ten LEDs along +x (a 2×1 tile)

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

/* the field: a full-bleed band for a landing block. The hero composition sits in the middle (the subject, and
   where the footnote marks land); clusters of tiles spread out to both sides with floor between them, a few
   tiles stand alone and a couple are raised. Clusters are placed by their centre in screen terms — d = x − y
   across, s = x + y down — and a tile that would overlap one already placed is left out. */
type Local = Omit<Tile, "id"> & { id: string };
const L = (id: string, x: number, y: number, w: number, d: number, ctl: Ctl, lift = 0): Local => ({ id, cell: [x, y, w, d], lift, ctl });
const KN = (cap: number | null = null): Ctl => ({ kind: "knob", cap });
const TEMPLATES: Record<string, Local[]> = {
  studio: [L("lcd", 0, 0, 2, 1, { kind: "display" }), L("kn", 2, 0, 1, 1, KN(1)), L("keys", 0, 1, 2, 1, { kind: "keys" }), L("rk", 2, 1, 1, 1, { kind: "switch", axis: "y", rocker: true })],
  pads: [L("pads", 0, 0, 1, 1, { kind: "pads" }), L("jog", 1, 0, 1, 1, { kind: "knob", cap: null, jog: true }), L("leds", 0, 1, 2, 1, { kind: "leds" })],
  mixer: [L("vf1", 0, 0, 1, 2, { kind: "fader", axis: "y" }), L("vf2", 1, 0, 1, 2, { kind: "fader", axis: "y" }), L("kn", 2, 0, 1, 1, KN()), L("sw", 2, 1, 1, 1, { kind: "switch", axis: "x" })],
  big: [L("kn", 0, 0, 2, 2, KN(0)), L("st", 2, 0, 1, 1, { kind: "stick" }, 3), L("dc", 2, 1, 1, 1, { kind: "disc" })],
  jog2: [L("jog", 0, 0, 2, 2, { kind: "knob", cap: null, jog: true })],
  pair: [L("so", 0, 0, 1, 1, { kind: "soft", icon: "wave" }), L("rk", 1, 0, 1, 1, { kind: "switch", axis: "x", rocker: true })],
  speaker: [L("gr", 0, 0, 2, 2, { kind: "grille" }), L("leds", 0, 2, 2, 1, { kind: "leds" })],
  trio: [L("st", 0, 0, 1, 1, { kind: "stick" }), L("pads", 1, 0, 1, 1, { kind: "pads" }), L("lcd", 0, 1, 2, 1, { kind: "display" })],
  knob: [L("kn", 0, 0, 1, 1, KN())],
  wave: [L("so", 0, 0, 1, 1, { kind: "soft", icon: "loop" })],
  disc: [L("dc", 0, 0, 1, 1, { kind: "disc" }, 4)],
  rocker: [L("rk", 0, 0, 1, 1, { kind: "switch", axis: "y", rocker: true })],
  pad: [L("pads", 0, 0, 1, 1, { kind: "pads" })],
  vfader: [L("vf", 0, 0, 1, 2, { kind: "fader", axis: "y" })],
};
/* [template, d, s] — where each cluster's centre goes */
const PLACES: [string, number, number][] = [
  // hugging the hero on the left, with floor between the clusters
  ["studio", -6.2, 1.2],
  ["big", -7.3, 6.6],
  ["pair", -4.4, 11.8],
  ["trio", -8.6, 11.2],
  ["rocker", -3.4, -0.8],
  ["pad", -9.9, 3.2],
  // and on the right
  ["mixer", 6.4, 1.0],
  ["speaker", 9.0, 7.0],
  ["pads", 5.6, 5.6],
  ["trio", 6.0, 10.6],
  ["wave", 3.4, -0.4],
  ["pair", 5.0, -1.0],
  ["disc", 9.6, 1.8],
  // under the hero
  ["mixer", 2.2, 12.6],
  ["pair", -1.6, 13.6],
  // a far column, for wide screens (cropped at the edges of most)
  ["vfader", -11.4, 5.4],
  ["knob", -10.8, 8.8],
  ["jog2", -12.8, 12.0],
  ["pads", 10.8, 10.8],
  ["knob", 11.0, 4.6],
  ["vfader", 11.8, 0.8],
  ["big", 13.0, 8.0],
  ["jog2", -13.2, 1.0],
];
const overlaps = (a: Tile, b: Tile, clear = -0.01) =>
  a.cell[0] < b.cell[0] + b.cell[2] + clear &&
  b.cell[0] < a.cell[0] + a.cell[2] + clear &&
  a.cell[1] < b.cell[1] + b.cell[3] + clear &&
  b.cell[1] < a.cell[1] + a.cell[3] + clear;
const snap = (v: number) => Math.round(v * 20) / 20;
function placeField(): Tile[] {
  const out: Tile[] = HERO_TILES.map((t) => ({ ...t, id: `h-${t.id}` }));
  PLACES.forEach(([name, d, s], c) => {
    const tpl = TEMPLATES[name]!;
    const w = Math.max(...tpl.map((t) => t.cell[0] + t.cell[2]));
    const h = Math.max(...tpl.map((t) => t.cell[1] + t.cell[3]));
    // the cluster's centre in cells, from its place on screen (the hero's middle, cell 3, 3, is d 0, s 6)
    const ox = snap((s + d) / 2 - w / 2);
    const oy = snap((s - d) / 2 - h / 2);
    for (const t of tpl) {
      const tile: Tile = { ...t, id: `c${c}-${t.id}`, cell: [ox + t.cell[0], oy + t.cell[1], t.cell[2], t.cell[3]] };
      if (!out.some((o) => overlaps(o, tile))) out.push(tile);
    }
  });
  return out;
}
export const FIELD_TILES: Tile[] = placeField();
/* the controls the landing's footnotes point at: the hero's lit knob, its fader, the grille (the sound switch) and a switch */
export const FIELD_MARKS = ["h-ka", "h-fd", "h-gr", "h-s1"];

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
