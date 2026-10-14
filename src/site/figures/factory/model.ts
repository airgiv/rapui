/* The factory's truth: the five characters, what each stamps, and the
   indexing line's timetable. Pure — no DOM. Everything the figure moves
   and everything the readout says comes from here. */
import type { RapPreset } from "../../../rapui";

export const PRESETS: RapPreset[] = ["fun", "civic", "signal", "product", "minimal"];

export const PRESET_NAMES: Record<RapPreset, string> = {
  fun: "Fun",
  civic: "Civic",
  signal: "Signal",
  product: "Product",
  minimal: "Minimal",
};

/* The button corner each preset stamps: its --rap-radius-pill, in CSS px
   (src/rapui/styles/tokens.css and presets.css). */
export const RADIUS_PX: Record<RapPreset, number> = {
  fun: 999,
  civic: 999,
  signal: 10,
  product: 10,
  minimal: 0,
};

/* A blank is 22 world units deep and stands for a 40 px control, so a
   world unit is about 1.8 px; a pill radius clamps to half the depth. */
export const PX_PER_UNIT = 40 / 22;
export const radiusOf = (preset: RapPreset, depth: number) => Math.min(RADIUS_PX[preset] / PX_PER_UNIT, depth / 2);

/* Dial: five engraved positions, 45° apart, on the side of the bezel that
   faces the viewer (the knob hides the far side), fun at the left. Angle 0
   points along −y and grows clockwise seen from above (the kit's
   radialTicks convention). */
export const DIAL_FIRST = 240;
export const DIAL_STEP = -45;
export const angleOf = (preset: RapPreset) => DIAL_FIRST + DIAL_STEP * PRESETS.indexOf(preset);
export const nearestPreset = (angle: number): RapPreset => {
  const index = Math.round((angle - DIAL_FIRST) / DIAL_STEP);
  return PRESETS[Math.min(PRESETS.length - 1, Math.max(0, index))]!;
};
const DIAL_LAST = DIAL_FIRST + DIAL_STEP * (PRESETS.length - 1);
export const DIAL_MIN = Math.min(DIAL_FIRST, DIAL_LAST) - 8;
export const DIAL_MAX = Math.max(DIAL_FIRST, DIAL_LAST) + 8;

/* The parts, in the order the line makes them. */
export const KINDS = ["button", "radio", "switch", "field", "checkbox"] as const;
export type Kind = (typeof KINDS)[number];
export const kindOf = (k: number): Kind => KINDS[((k % KINDS.length) + KINDS.length) % KINDS.length]!;

/* An indexing conveyor: the belt moves one pitch, stops, the hopper drops
   a blank and the press strokes, then it moves again. Seconds. */
export const PITCH = 64;
export const CYCLE = 2.6;
export const MOVE = 1.0;
export const DROP_AT = MOVE + 0.05;
export const DROP_FALL = 0.3;
export const STACK_AT = DROP_AT + 0.2;
export const STACK_FALL = 0.4;
export const PRESS_DOWN = MOVE + 0.25;
export const PRESS_HIT = MOVE + 0.6;
export const PRESS_HOLD = MOVE + 0.78;
export const PRESS_UP = MOVE + 1.38;

export const SLOTS = { hopper: 0, press: 1, last: 4 };
export const FALL_FROM = 4.42;
export const LAND_AT = 5;
export const FADE_FROM = 6.3;
export const FADE_TO = 6.9;

export const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};

/* travel in pitches since the start: whole cycles plus the eased move */
export function travelAt(t: number) {
  const cycle = Math.floor(t / CYCLE);
  const phase = t - cycle * CYCLE;
  return cycle + smooth(phase / MOVE);
}

export function phaseOf(t: number) {
  const cycle = Math.floor(t / CYCLE);
  return { cycle, phase: t - cycle * CYCLE };
}

/* the ram's drop below its rest height, 0..1 */
export function ramAt(phase: number) {
  if (phase < PRESS_DOWN || phase > PRESS_UP) return 0;
  if (phase < PRESS_HIT) {
    const u = (phase - PRESS_DOWN) / (PRESS_HIT - PRESS_DOWN);
    return u * u;
  }
  if (phase < PRESS_HOLD) return 1;
  return 1 - smooth((phase - PRESS_HOLD) / (PRESS_UP - PRESS_HOLD));
}

/* the stamp: item `cycle` is under the die in that cycle's dwell */
export const stampTime = (k: number) => k * CYCLE + PRESS_HIT;

/* a resting frame for stillness: dwell after the stroke, ram up */
export const STILL_T = 8 * CYCLE + PRESS_UP + 0.1;

/* the crate starts with a few parts in it; the count is what has landed */
export const STOCK = 18;
export const landedBy = (t: number) => {
  /* item k lands when travel reaches k + LAND_AT */
  const u = travelAt(t);
  return Math.max(0, Math.floor(u - LAND_AT) + 1);
};

export function readoutOf(preset: RapPreset, count: number) {
  return `${preset} · ${count} components · radius ${RADIUS_PX[preset]}`;
}
