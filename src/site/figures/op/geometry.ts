/* Every path of the rapui OP, built once from view.ts with the kit, plus the
   few builders the live loop calls for the parts that move: a key cap that goes
   down, an encoder's ridges and pointer, the fader cap, the switch pill and the
   trace on the screen. */
import {
  cylinder,
  depthOf,
  dotGrid,
  insetPlan,
  iso,
  onTop,
  pathOf,
  planOutline,
  ring,
  ringOf,
  sideMatrix,
  sideSeam,
  slabOf,
  topMatrix,
  topTicks,
  translateAlong,
  type Flat,
  type Plan,
  type Plane,
  type SolidPaths,
} from "../iso/iso-kit";
import {
  BODY,
  BODY_H,
  CAP,
  FADER,
  GLASS_IN,
  GRILLE,
  KEY_H,
  KEY_N,
  KEY_S,
  KEY_TRAVEL,
  KEY_Y,
  KNOB_H,
  KNOB_R,
  KNOB_SPAN,
  KNOB_X,
  KNOB_Y,
  LED_Y,
  P,
  PANEL,
  PANEL_H,
  PILL,
  SCALE_R,
  SCREEN,
  SEAM_Z,
  SKIRT_H,
  SKIRT_R,
  SWITCH,
  WELL_PAD,
  Z,
  keyX,
} from "./view";

const RAD = Math.PI / 180;

/* ---------------------------------------------------------------- body */
export const HALO = onTop(ringOf({ ...BODY, x: BODY.x + 6, y: BODY.y + 8, w: BODY.w - 4, d: BODY.d - 4 }, 12), 0, P, true);
export const BODY_PATHS = slabOf(BODY, 0, BODY_H, P, 12, 1.1);
export const BODY_SEAM = sideSeam(BODY, SEAM_Z, P, 12);
export const PANEL_PATHS = slabOf(PANEL, BODY_H, PANEL_H, P, 12, 0.6);

/* the maker's mark, printed on the front face (local x along +x, local y down) */
export const BRAND_AT = sideMatrix([BODY.x + 30, BODY.y + BODY.d], 7.4, P, "left");
export const MODEL_AT = sideMatrix([BODY.x + BODY.w - 30, BODY.y + BODY.d], 7.6, P, "left");

/* ---------------------------------------------------------------- keys */
export const keyPlan = (i: number): Plan => ({ x: keyX(i) - KEY_S / 2, y: KEY_Y - KEY_S / 2, w: KEY_S, d: KEY_S, r: 5 });
export const WELLS = Array.from({ length: KEY_N }, (_, i) => planOutline(insetPlan(keyPlan(i), -WELL_PAD), Z, P, 6));
export const LEDS = Array.from({ length: KEY_N }, (_, i) => ring(keyX(i), LED_Y, 1.9, Z, P, 20));
/* a key cap pressed by `press` (0 at rest, 1 at the bottom of its travel) */
export const keyCap = (i: number, press: number): SolidPaths => slabOf(keyPlan(i), Z, KEY_H - press * KEY_TRAVEL, P, 6, 0.7);
/* the printed number in the cap's back-left corner, at rest; the loop moves it down with the cap */
export const KEY_LABEL_AT = Array.from({ length: KEY_N }, (_, i) => topMatrix([keyX(i) - KEY_S / 2 + 5, KEY_Y - KEY_S / 2 + 10.5], Z + KEY_H, P, "x"));
export const keyDrop = (press: number) => translateAlong(P, [0, 0, -press * KEY_TRAVEL]);
export const KEY_WORDS = ["kick", "snare", "hat", "clap", "bass", "lead"];
export const KEY_WORD_AT = Array.from({ length: KEY_N }, (_, i) => topMatrix([keyX(i) + KEY_S / 2 - 5, KEY_Y + KEY_S / 2 - 5.5], Z + KEY_H, P, "x"));

/* ------------------------------------------------------------- encoders */
export const KNOB_WORDS = ["pitch", "tempo", "level"];
export const knobSkirt = (i: number) => cylinder(KNOB_X[i]!, KNOB_Y, SKIRT_R, Z, SKIRT_H, P, 48, 0.5);
export const knobCap = (i: number) => cylinder(KNOB_X[i]!, KNOB_Y, KNOB_R, Z + SKIRT_H, KNOB_H - SKIRT_H, P, 56, 0.8);
export const KNOB_FACE = KNOB_X.map((x) => ring(x, KNOB_Y, KNOB_R - 3.6, Z + KNOB_H, P, 48));
/* the printed scale: dots over 270°, the gap toward the player */
export const KNOB_SCALE: Flat[][] = KNOB_X.map((x) =>
  Array.from({ length: 11 }, (_, k) => {
    const a = (-KNOB_SPAN / 2 + (k * KNOB_SPAN) / 10) * RAD;
    return iso([x + SCALE_R * Math.sin(a), KNOB_Y - SCALE_R * Math.cos(a), Z], P);
  }),
);
export const KNOB_LABEL_AT = KNOB_X.map((x) => topMatrix([x, KNOB_Y + SCALE_R + 1.5], Z, P, "x"));
/* the screen direction of "toward the viewer" on the table */
const VIEW = [Math.cos((P.azimuth ?? 45) * RAD), Math.sin((P.azimuth ?? 45) * RAD)] as const;
/* angle in degrees: 0 points to the back, + turns clockwise for the player */
const dir = (deg: number): Plane => [Math.sin(deg * RAD), -Math.cos(deg * RAD)];
/* the ridges round the cap's side that you can see, turned by `deg` */
export function knobRidges(i: number, deg: number) {
  const cx = KNOB_X[i]!;
  const lines: string[] = [];
  const n = 36;
  const z0 = Z + SKIRT_H + 0.35;
  const z1 = Z + KNOB_H - 0.35;
  for (let k = 0; k < n; k++) {
    const [nx, ny] = dir(deg + (k * 360) / n);
    if (nx * VIEW[0] + ny * VIEW[1] < 0.2) continue;
    const x = cx + KNOB_R * nx;
    const y = KNOB_Y + KNOB_R * ny;
    lines.push(pathOf([iso([x, y, z0], P), iso([x, y, z1], P)]));
  }
  return lines.join("");
}
/* the pointer on the cap's face, from the hub out to the face ring */
export function knobPointer(i: number, deg: number) {
  const cx = KNOB_X[i]!;
  const [nx, ny] = dir(deg);
  return pathOf([iso([cx + nx * 3.2, KNOB_Y + ny * 3.2, Z + KNOB_H], P), iso([cx + nx * (KNOB_R - 3.6), KNOB_Y + ny * (KNOB_R - 3.6), Z + KNOB_H], P)]);
}
export const knobHub = (i: number) => ring(KNOB_X[i]!, KNOB_Y, 1.5, Z + KNOB_H, P, 16);

/* ---------------------------------------------------------------- fader */
export const FADER_SLOT = planOutline({ x: FADER.x0, y: FADER.y - FADER.w / 2, w: FADER.x1 - FADER.x0, d: FADER.w, r: FADER.w / 2 }, Z, P, 6);
const ticks = topTicks(FADER.x0 + 5, FADER.x1 - 5, 9.2, 5, FADER.y - FADER.w / 2, Z, [-2.6, -4.8], P, "x");
export const FADER_TICKS = { minor: ticks.minor, major: ticks.major };
export const FADER_TRAVEL = [FADER.x0 + CAP.w / 2 - 1, FADER.x1 - CAP.w / 2 + 1] as const;
export const FADER_LABEL_AT = topMatrix([FADER.x1, FADER.y + FADER.w / 2 + CAP.d / 2 - 1], Z, P, "x");
export const faderX = (v: number) => FADER_TRAVEL[0] + (FADER_TRAVEL[1] - FADER_TRAVEL[0]) * v;
const capPlan = (v: number): Plan => ({ x: faderX(v) - CAP.w / 2, y: FADER.y - CAP.d / 2, w: CAP.w, d: CAP.d, r: 2.6 });
export const faderCap = (v: number) => slabOf(capPlan(v), Z, CAP.h, P, 5, 0.6);
/* the grip line across the cap's top, edge to edge */
export const faderGrip = (v: number) => onTop([[faderX(v), FADER.y - CAP.d / 2], [faderX(v), FADER.y + CAP.d / 2]], Z + CAP.h, P);

/* ---------------------------------------------------------------- switch */
export const SWITCH_SLOT = planOutline({ x: SWITCH.x0, y: SWITCH.y - SWITCH.d / 2, w: SWITCH.x1 - SWITCH.x0, d: SWITCH.d, r: SWITCH.d / 2 }, Z, P, 6);
export const PILL_TRAVEL = [SWITCH.x0 + PILL.w / 2 + 1.3, SWITCH.x1 - PILL.w / 2 - 1.3] as const;
export const pillX = (v: number) => PILL_TRAVEL[0] + (PILL_TRAVEL[1] - PILL_TRAVEL[0]) * v;
const pillPlan = (v: number): Plan => ({ x: pillX(v) - PILL.w / 2, y: SWITCH.y - PILL.d / 2, w: PILL.w, d: PILL.d, r: PILL.d / 2 });
export const switchPill = (v: number) => slabOf(pillPlan(v), Z, PILL.h, P, 6, 0.5);
export const pillGrip = (v: number) =>
  [-2.2, 0, 2.2].map((dx) => onTop([[pillX(v) + dx, SWITCH.y - PILL.d / 2], [pillX(v) + dx, SWITCH.y + PILL.d / 2]], Z + PILL.h, P)).join("");
export const SWITCH_OFF_AT = topMatrix([SWITCH.x0 + 2, SWITCH.y + SWITCH.d / 2 + 7.5], Z, P, "x");
export const SWITCH_ON_AT = topMatrix([SWITCH.x1 - 2, SWITCH.y + SWITCH.d / 2 + 7.5], Z, P, "x");

/* ---------------------------------------------------------------- screen */
export const BEZEL = planOutline(SCREEN, Z, P, 6);
export const GLASS_PLAN = insetPlan(SCREEN, GLASS_IN);
export const GLASS = planOutline(GLASS_PLAN, Z, P, 6);
/* the screen draws in its own flat coordinates: (0, 0) at the glass's back-left corner, x along +x, y toward the player */
export const SCREEN_AT = topMatrix([GLASS_PLAN.x, GLASS_PLAN.y], Z, P, "x");
export const GLASS_W = GLASS_PLAN.w;
export const GLASS_D = GLASS_PLAN.d;
export const GLASS_R = GLASS_PLAN.r;
const TRACE_N = 56;
export const TRACE_MID = 28.5;
/* the waveform across the glass, edge to edge: amplitude 0..1, cycles across the glass, phase in turns, wet 0..1 adds an echo */
export function trace(amp: number, cycles: number, phase: number, wet: number) {
  const pts: Flat[] = [];
  for (let k = 0; k <= TRACE_N; k++) {
    const u = k / TRACE_N;
    // ends taper to the midline so the trace meets the glass edge on its centre line
    const taper = Math.sin(Math.PI * u) ** 0.6;
    const a = 2 * Math.PI * (u * cycles + phase);
    const dry = Math.sin(a) * 0.8 + Math.sin(2 * a + 0.6) * 0.2;
    const echo = Math.sin(3 * a - 1.1) * 0.35;
    const y = TRACE_MID - amp * 6.4 * taper * (dry * (1 - 0.25 * wet) + echo * wet);
    pts.push([u * GLASS_W, y]);
  }
  return pathOf(pts);
}

/* ---------------------------------------------------------------- grille */
export const GRILLE_DOTS: Flat[] = (() => {
  const out: Flat[] = [];
  const pts = dotGrid(GRILLE.x, GRILLE.y, GRILLE.cols, GRILLE.rows, GRILLE.gap, Z, P);
  for (let r = 0; r < GRILLE.rows; r++)
    for (let c = 0; c < GRILLE.cols; c++) {
      // round the field's corners
      const corner = (r === 0 || r === GRILLE.rows - 1) && (c === 0 || c === GRILLE.cols - 1);
      if (!corner) out.push(pts[r * GRILLE.cols + c]!);
    }
  return out;
})();
export const GRILLE_LABEL_AT = topMatrix([GRILLE.x + (GRILLE.cols - 1) * GRILLE.gap, GRILLE.y + (GRILLE.rows - 1) * GRILLE.gap + 9.5], Z, P, "x");

/* raised parts on the panel, far to near (all fixed in place, so one order serves) */
export const RAISED_ORDER = (() => {
  const list: { kind: "knob" | "fader" | "pill" | "key"; i: number; d: number }[] = [];
  KNOB_X.forEach((x, i) => list.push({ kind: "knob", i, d: depthOf([x, KNOB_Y, Z], P) }));
  list.push({ kind: "fader", i: 0, d: depthOf([(FADER.x0 + FADER.x1) / 2, FADER.y, Z], P) });
  list.push({ kind: "pill", i: 0, d: depthOf([(SWITCH.x0 + SWITCH.x1) / 2, SWITCH.y, Z], P) });
  for (let i = 0; i < KEY_N; i++) list.push({ kind: "key", i, d: depthOf([keyX(i), KEY_Y, Z], P) });
  return list.sort((a, b) => a.d - b.d);
})();
