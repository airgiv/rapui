/* What changes per frame: where every part on the line is, what it has
   become, the ram, the hopper stack, the belt's cleats and the dial grip.
   Parts are drawn once per (kind, character, lit) at the origin and moved. */
import { dotsSvg, lineOnTop, lineSvg, planOutline, cylinder, slabOf, solidSvg, translateAlong, iso, type Plan, type Plane } from "../iso/iso-kit";
import type { RapPreset } from "../../../rapui";
import {
  CYCLE,
  DROP_AT,
  DROP_FALL,
  FADE_FROM,
  FADE_TO,
  FALL_FROM,
  LAND_AT,
  PITCH,
  STACK_AT,
  STACK_FALL,
  kindOf,
  phaseOf,
  radiusOf,
  ramAt,
  smooth,
  stampTime,
  travelAt,
  type Kind,
} from "./model";
import { BELT_TOP, BLANK, BLANK_H, CRATE_FLOOR, DIE_HIT, DIE_REST, LAND_X, LAND_Z, P, STACK_Z, slotX } from "./view";

const plan = (x: number, y: number, w: number, d: number, r: number): Plan => ({ x, y, w, d, r: Math.max(0, r) });
const at0 = (x: number, y: number, z: number) => iso([x, y, z], P);

/* ── the parts, at the origin, bottom on z = 0 ─────────────────────── */
function partSvg(kind: Kind, form: RapPreset | null, lit: boolean, on: boolean) {
  if (!form) {
    return solidSvg(slabOf(BLANK, 0, BLANK_H, P, 2, 0.6), { tone: "mid", lit, crease: "faint" });
  }
  const rr = (depth: number) => radiusOf(form, depth);
  const out: string[] = [];
  if (kind === "button") {
    const body = plan(-22, -11, 44, 22, rr(22));
    out.push(solidSvg(slabOf(body, 0, 6, P, 10, 0.9), { tone: "hi", lit, crease: "lo" }));
    out.push(lineSvg(planOutline({ ...body, x: body.x + 3, y: body.y + 3, w: body.w - 6, d: body.d - 6, r: Math.max(0, body.r - 3) }, 6, P, 10), { tone: "faint" }));
    const label = plan(-11, -2.8, 22, 5.6, rr(5.6));
    out.push(solidSvg(slabOf(label, 6, 0.9, P, 6), { tone: "mid", crease: "none" }));
  } else if (kind === "radio") {
    const base = plan(-22, -11, 44, 22, rr(22));
    out.push(solidSvg(slabOf(base, 0, 2.4, P, 10, 0.5), { tone: "hi", lit, crease: "lo" }));
    out.push(solidSvg(cylinder(-10, 0, 8.6, 2.4, 3.6, P, 48, 0.7), { tone: "hi", crease: "lo" }));
    out.push(lineSvg(planOutline(plan(-15.4, -5.4, 10.8, 10.8, 5.4), 6, P, 10), { tone: "faint" }));
    out.push(solidSvg(cylinder(-10, 0, 3.4, 6, 1.8, P, 32), { tone: "hi", crease: "lo" }));
    out.push(lineSvg(lineOnTop([3, -2.4], [17, -2.4], 2.4, P) + lineOnTop([3, 2.6], [12, 2.6], 2.4, P), { tone: "lo", free: true }));
  } else if (kind === "switch") {
    const track = plan(-19, -10, 38, 20, rr(20));
    out.push(solidSvg(slabOf(track, 0, 4, P, 10, 0.7), { tone: "hi", lit, crease: "lo" }));
    out.push(lineSvg(planOutline(plan(-13, -3, 26, 6, rr(6)), 4, P, 8), { tone: "lo" }));
    const kx = on ? 6 : -6;
    out.push(solidSvg(slabOf(plan(kx - 7, -7, 14, 14, rr(14)), 4, 5, P, 8, 0.7), { tone: "hi", crease: "lo" }));
  } else if (kind === "field") {
    const body = plan(-25, -10, 50, 20, rr(20));
    out.push(solidSvg(slabOf(body, 0, 4, P, 10, 0.7), { tone: "hi", lit, crease: "lo" }));
    out.push(lineSvg(planOutline({ ...body, x: body.x + 2.6, y: body.y + 2.6, w: body.w - 5.2, d: body.d - 5.2, r: Math.max(0, body.r - 2.6) }, 4, P, 10), { tone: "faint" }));
    out.push(lineSvg(planOutline(plan(-18.5, -4.5, 2, 9, 1), 4, P, 3), { tone: "hi" }));
    out.push(lineSvg(lineOnTop([-13, 0], [9, 0], 4, P), { tone: "lo", free: true }));
  } else {
    const box = plan(-11, -11, 22, 22, Math.min(rr(22), 6));
    out.push(solidSvg(slabOf(box, 0, 6, P, 8, 0.9), { tone: "hi", lit, crease: "lo" }));
    out.push(lineSvg(planOutline({ ...box, x: box.x + 2.5, y: box.y + 2.5, w: 17, d: 17, r: Math.max(0, box.r - 2.5) }, 6, P, 8), { tone: "faint" }));
    const tick: Plane[] = [
      [-5.5, -0.5],
      [-1.5, 4],
      [5, -6.5],
    ];
    out.push(lineSvg(tick.map((p, i) => (i ? lineOnTop(tick[i - 1]!, p, 6, P) : "")).join(""), { tone: "hi", free: true, className: "fac-tick" }));
  }
  return out.join("");
}

const cache = new Map<string, string>();
export function partOf(kind: Kind, form: RapPreset | null, lit: boolean, on: boolean) {
  const key = `${kind}|${form ?? "blank"}|${lit ? 1 : 0}|${on ? 1 : 0}`;
  let svg = cache.get(key);
  if (!svg) {
    svg = partSvg(kind, form, lit, on);
    cache.set(key, svg);
  }
  return { key, svg };
}

/* two parts already lying in the crate */
export const PILE = [
  { at: [190, -14, CRATE_FLOOR] as const, kind: "field" as Kind, form: "product" as RapPreset },
  { at: [212, 13, CRATE_FLOOR] as const, kind: "button" as Kind, form: "fun" as RapPreset },
]
  .map(({ at, kind, form }) => `<g transform="${translateAlong(P, [at[0], at[1], at[2]])}">${partOf(kind, form, false, false).svg}</g>`)
  .join("");

/* ── where each part is ────────────────────────────────────────────── */
export interface Placed {
  k: number;
  kind: Kind;
  x: number;
  y: number;
  z: number;
  opacity: number;
  formed: boolean;
  lit: boolean;
  crate: boolean;
  on: boolean;
}

const jitter = (k: number, span: number, salt: number) => ((((k * salt) % 17) + 17) % 17) / 16 * 2 * span - span;

export function placedAt(t: number): Placed[] {
  const { cycle, phase } = phaseOf(t);
  const u = travelAt(t);
  const out: Placed[] = [];
  for (let k = cycle - 9; k <= cycle + 1; k++) {
    const p = u - k;
    let x = slotX(0) + PITCH * p;
    let y = 0;
    let z = BELT_TOP;
    let opacity = 1;
    let crate = false;
    if (p < 0) continue;
    if (p === 0 && k === cycle + 1) {
      if (phase < DROP_AT) continue;
      const f = Math.min(1, (phase - DROP_AT) / DROP_FALL);
      z = STACK_Z - (STACK_Z - BELT_TOP) * f * f;
    } else if (p > FALL_FROM) {
      crate = true;
      const s = Math.min(1, (p - FALL_FROM) / (LAND_AT - FALL_FROM));
      const x0 = slotX(0) + PITCH * FALL_FROM;
      /* two rows on top of the parts already in the crate, one part per row at a time */
      const row = ((k % 2) + 2) % 2;
      const landX = LAND_X + (row ? 4 : -2) + jitter(k, 3, 7);
      const landY = row ? 10 : -14;
      const landZ = LAND_Z;
      x = x0 + (landX - x0) * s;
      y = landY * s;
      z = BELT_TOP - (BELT_TOP - landZ) * s * s;
      if (p > FADE_FROM) opacity = 1 - smooth((p - FADE_FROM) / (FADE_TO - FADE_FROM));
      if (opacity <= 0) continue;
    }
    const formed = p > 1 || (p === 1 && t >= stampTime(k));
    out.push({ k, kind: kindOf(k), x, y, z, opacity, formed, lit: p > 0.5 && p < 1.5, crate, on: Math.floor(k / 5) % 2 === 0 });
  }
  return out;
}

/* the ram's offset, the hopper stack's lift and the cleats' travel */
export function ramShift(t: number) {
  const { phase } = phaseOf(t);
  return translateAlong(P, [0, 0, -(DIE_REST - DIE_HIT) * ramAt(phase)]);
}

export function stackLift(t: number) {
  const { phase } = phaseOf(t);
  if (phase < DROP_AT) return 0;
  return BLANK_H * (1 - smooth((phase - STACK_AT) / STACK_FALL));
}

export const travelUnits = (t: number) => travelAt(t) * PITCH;
export const cycleOf = (t: number) => Math.floor(t / CYCLE);
export const shiftOf = (x: number, y: number, z: number) => translateAlong(P, [x, y, z]);
export const dotAt = (x: number, y: number, z: number) => dotsSvg([at0(x, y, z)]);
