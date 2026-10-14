/* World layout of the component factory, in world units (x along the belt,
   y across it, z up), and the camera that fits it in the card. */
import { boxCorners, fitProjection, iso, type Flat, type Plan, type Point3 } from "../iso/iso-kit";
import { PITCH } from "./model";

export const WIDTH = 600;
export const HEIGHT = 372;
export const AZIMUTH = 60;

/* conveyor */
export const BELT_X0 = -152;
export const BELT_X1 = 170;
export const BELT_HALF = 26;
export const BELT_Z0 = 40;
export const BELT_TOP = 46;
export const DRUM_R = 6;
export const DRUM_Z = BELT_TOP - DRUM_R;
export const RAIL_X0 = -162;
export const RAIL_X1 = 178;
export const RAIL_Z0 = 33;
export const RAIL_TOP = 48;
export const RAIL_D = 6;
export const LEG_XS = [-138, 150];
export const LEG_Y = BELT_HALF + RAIL_D / 2;
export const LEG = 8;
export const FOOT_H = 3;
export const BRACE_Z = 12;
export const BRACE_H = 5;
export const ROLLER_XS = [-124, -68, -12, 44, 100];
export const CAP_Z = (RAIL_Z0 + RAIL_TOP) / 2;

/* stations sit on the pitch */
export const slotX = (slot: number) => -128 + PITCH * slot;
export const HOPPER_X = slotX(0);
export const PRESS_X = slotX(1);

/* blank and hopper */
export const BLANK: Plan = { x: -22, y: -12, w: 44, d: 24, r: 1 };
export const BLANK_H = 4;
export const STACK_Z = 56;
export const STACK_COUNT = 9;
export const HOP_TOP_Z = 104;
export const HOP_POST = 5;

/* press: a C-frame behind the belt, its arm over the second station */
export const PRESS_BASE: Plan = { x: -104, y: -96, w: 80, d: 54, r: 4 };
export const PRESS_BASE_H = 8;
export const COLUMN: Plan = { x: -88, y: -84, w: 48, d: 32, r: 3 };
export const ARM: Plan = { x: -98, y: -84, w: 68, d: 104, r: 5 };
export const ARM_Z = 124;
export const ARM_TOP = 154;
export const RAM: Plan = { x: PRESS_X - 12, y: -12, w: 24, d: 24, r: 3 };
export const RAM_LEN = 66;
export const DIE_H = 5;
export const SHOE_H = 6;
export const DIE_REST = 70;
export const DIE_HIT = BELT_TOP + BLANK_H;

/* the style dial on the arm */
export const DIAL: Flat = [PRESS_X, -20];
export const BEZEL_R = 31;
export const BEZEL_H = 3;
export const BEZEL_TOP = ARM_TOP + BEZEL_H;
export const KNOB_R = 15;
export const KNOB_H = 10;
export const KNOB_TOP = BEZEL_TOP + KNOB_H;
export const GRIP_H = 4;

/* crate under the belt's end */
export const CRATE: Plan = { x: 166, y: -36, w: 76, d: 72, r: 2 };
export const CRATE_FLOOR = 7;
export const CRATE_TOP = 30;
export const WALL = 4;
export const LAND_X = 206;
export const LAND_Z = 14;

export const P = fitProjection(
  [
    ...boxCorners(PRESS_BASE, 0, 0),
    ...boxCorners({ x: RAIL_X0, y: -BELT_HALF - RAIL_D, w: CRATE.x + CRATE.w - RAIL_X0, d: 2 * (BELT_HALF + RAIL_D), r: 0 }, 0, 0),
    ...boxCorners(CRATE, 0, CRATE_TOP),
    ...boxCorners(ARM, ARM_Z, ARM_TOP),
    [DIAL[0], DIAL[1] - BEZEL_R, KNOB_TOP + GRIP_H],
    [DIAL[0] - BEZEL_R, DIAL[1], KNOB_TOP + GRIP_H],
  ],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: AZIMUTH },
);

export const at = (point: Point3) => iso(point, P);
