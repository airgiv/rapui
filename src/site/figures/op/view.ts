/* The world of the rapui OP: one thin aluminium slab lying on the table, in
   world units (x, y on the table, z up; 1 unit ≈ 1 mm, so the slab is 300 × 240
   × 15.5 mm, about the size of a TX-6 grown up). The player sits on the +y side:
   the key row runs along the front edge and printed words read along +x.

   The camera looks from the front-left corner, so the front edge faces down-left
   (toward a headline on the left of the page) and the slab recedes up and to the
   right. Everything the drawing and the live loop place comes from here. */
import { iso, type Flat, type Plan, type Point3, type Projection } from "../iso/iso-kit";

export const WIDTH = 640;
export const HEIGHT = 500;

/* the body: a soft-cornered slab with a seam between its lower shell and its top */
export const BODY: Plan = { x: -150, y: -120, w: 300, d: 240, r: 22 };
export const BODY_H = 12.5;
export const SEAM_Z = 4.2;
/* the top plate, inset in the frame and a shade darker */
export const PANEL: Plan = { x: -144.5, y: -114.5, w: 289, d: 229, r: 16.5 };
export const PANEL_H = 3;
export const Z = BODY_H + PANEL_H; // the panel's face: every control stands on it

/* front row: six square keys in shallow wells */
export const KEY_N = 6;
export const KEY_S = 37; // key cap, square
export const KEY_PITCH = 44.6;
export const KEY_X0 = -((KEY_N - 1) * KEY_PITCH) / 2; // first key's centre x
export const KEY_Y = 82; // key centres
export const KEY_H = 7.2; // cap height above the panel at rest
export const KEY_TRAVEL = 3.4; // how far a cap goes down
export const WELL_PAD = 2.6; // the well around a cap
export const LED_Y = KEY_Y - KEY_S / 2 - 15; // one small LED behind each key, far enough back to clear the cap
export const keyX = (i: number) => KEY_X0 + i * KEY_PITCH;

/* middle row: three encoders and a long fader */
export const KNOB_Y = 6;
export const KNOB_X = [-117, -62, -7];
export const KNOB_R = 15.5; // the cap
export const SKIRT_R = 18.5; // the flange under it
export const SKIRT_H = 2.4;
export const KNOB_H = 12.5; // cap top above the panel
export const SCALE_R = 23; // the printed dot scale
export const ACCENT = 1; // the encoder that matters: lit
export const KNOB_SPAN = 270; // degrees from min to max
export const FADER = { x0: 33, x1: 135, y: KNOB_Y, w: 7 }; // the slot
export const CAP = { w: 15, d: 25, h: 8.5 }; // the fader cap

/* back row: the screen, the switch, the speaker grille */
export const SCREEN: Plan = { x: -139, y: -107, w: 104, d: 56, r: 6 };
export const GLASS_IN = 3.4;
export const SWITCH = { x0: -22, x1: 12, y: -84, d: 11 }; // the slot
export const PILL = { w: 15, d: 8.4, h: 4.6 };
export const GRILLE = { x: 34, y: -101, cols: 10, rows: 6, gap: 10.2 };

/* camera: from the front-left, a little higher than the kit's 30° so the
   controls on the flat top read */
export const AZIMUTH = 49;
export const ELEVATION = 37;

const extremes: Point3[] = [];
for (const x of [BODY.x, BODY.x + BODY.w]) for (const y of [BODY.y, BODY.y + BODY.d]) for (const z of [0, Z]) extremes.push([x, y, z]);
for (const x of KNOB_X) extremes.push([x, KNOB_Y - KNOB_R, Z + KNOB_H]);

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
    origin: [WIDTH / 2 - ((left + right) / 2) * scale, HEIGHT / 2 - ((up + down) / 2) * scale - 4],
    scale,
    azimuth: AZIMUTH,
    elevation: ELEVATION,
  };
}

export const P = fit(extremes, 18);
export const at = (p: Point3): Flat => iso(p, P);
export const K = P.scale * Math.sqrt(1.6); // screen units per world unit
