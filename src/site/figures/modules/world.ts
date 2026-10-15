/* A layout of ControlModules as a world: its tiles, the controls on them grouped
   by kind, the painter's order, the static tile paths and the viewBox that
   frames it. Every layout shares the one camera in view.ts, so a part looks the
   same everywhere; a layout only chooses its tiles and its frame.

   "hero"  — the 15-tile composition beside a headline (640 × 560).
   "field" — a wide band (16:7) of 26 scattered tiles that keeps the left of the
             picture empty floor; FIELD_TEXT says how much, so a block can put
             its headline there. `tight` is the frame of the tiles alone, for
             narrow screens where the text stacks above the picture. */
import { depthOf, iso, slabOf, type Plan, type SolidPaths } from "../iso/iso-kit";
import { BEVEL, FIELD_TILES, HEIGHT, HERO_TILES, P, WIDTH, centreOf, extremesOf, planOf, topOf, type Layout, type Tile } from "./view";

export type Box = [number, number, number, number]; // x, y, w, h in drawing units

export interface World {
  layout: Layout;
  tiles: Tile[];
  knobs: Tile[];
  capped: Tile[]; // knobs with coloured caps, in the order the lit accent visits them
  pressable: Tile[]; // discs, soft buttons and pill keys (keys 1..9)
  faders: Tile[];
  switches: Tile[];
  grilles: Tile[];
  tileOrder: number[];
  tilePaths: SolidPaths[];
  halo: string;
  ctlOrder: number[];
  viewBox: Box;
  tight: Box;
}

/* the share of a field's width on the left that stays empty floor for text */
export const FIELD_TEXT = 0.4;

/* painter's order for boxes on a grid: a tile wholly behind another (smaller x or y, ranges overlapping) goes first */
function orderOf(tiles: Tile[]) {
  const n = tiles.length;
  const plans = tiles.map(planOf);
  const behind = (a: Plan, b: Plan) => {
    const overlapX = a.x < b.x + b.w && b.x < a.x + a.w;
    const overlapY = a.y < b.y + b.d && b.y < a.y + a.d;
    return (overlapY && a.x + a.w <= b.x + 0.01) || (overlapX && a.y + a.d <= b.y + 0.01);
  };
  const depth = tiles.map((t) => {
    const [cx, cy] = centreOf(t);
    return depthOf([cx, cy, 0], P);
  });
  const done = new Set<number>();
  const out: number[] = [];
  const all = [...Array(n).keys()];
  while (out.length < n) {
    const ready = all.filter((i) => !done.has(i) && all.every((j) => j === i || done.has(j) || !behind(plans[j]!, plans[i]!)));
    const pick = (ready.length ? ready : all.filter((i) => !done.has(i))).sort((a, b) => depth[a]! - depth[b]!)[0]!;
    done.add(pick);
    out.push(pick);
  }
  return out;
}

function boundsOf(tiles: Tile[], pad: number): Box {
  const flat = extremesOf(tiles).map((p) => iso(p, P));
  const xs = flat.map(([x]) => x);
  const ys = flat.map(([, y]) => y);
  const x0 = Math.min(...xs) - pad;
  const y0 = Math.min(...ys) - pad;
  return [x0, y0, Math.max(...xs) + pad - x0, Math.max(...ys) + pad - y0];
}

function build(layout: Layout): World {
  const tiles = layout === "field" ? FIELD_TILES : HERO_TILES;
  const knobs = tiles.filter((t) => t.ctl.kind === "knob");
  let viewBox: Box = [0, 0, WIDTH, HEIGHT];
  let tight: Box = viewBox;
  if (layout === "field") {
    tight = boundsOf(tiles, 12);
    // a 16:7 band with the tiles at its right, the left FIELD_TEXT of it left empty
    const [tx, ty, tw, th] = tight;
    const w = Math.max(tw / (1 - FIELD_TEXT), (th * 16) / 7);
    const h = (w * 7) / 16;
    viewBox = [tx + tw - w, ty - (h - th) / 2, w, h];
  }
  return {
    layout,
    tiles,
    knobs,
    capped: knobs.filter((t) => t.ctl.kind === "knob" && t.ctl.cap !== null),
    pressable: tiles.filter((t) => t.ctl.kind === "disc" || t.ctl.kind === "soft" || t.ctl.kind === "pill"),
    faders: tiles.filter((t) => t.ctl.kind === "fader"),
    switches: tiles.filter((t) => t.ctl.kind === "switch"),
    grilles: tiles.filter((t) => t.ctl.kind === "grille"),
    tileOrder: orderOf(tiles),
    tilePaths: tiles.map((t) => slabOf(planOf(t), 0, topOf(t), P, 6, BEVEL)),
    halo: tiles.map((t) => slabOf({ ...planOf(t), x: planOf(t).x + 4, y: planOf(t).y + 5 }, 0, 0.1, P, 6).fill).join(""),
    // the controls in painter's order (all stand on tile tops, so far-to-near by their centres)
    ctlOrder: tiles
      .map((t, i) => {
        const [cx, cy] = centreOf(t);
        return { i, d: depthOf([cx, cy, topOf(t)], P) };
      })
      .sort((a, b) => a.d - b.d)
      .map((o) => o.i),
    viewBox,
    tight,
  };
}

const WORLDS = new Map<Layout, World>();
export function worldOf(layout: Layout): World {
  if (!WORLDS.has(layout)) WORLDS.set(layout, build(layout));
  return WORLDS.get(layout)!;
}
