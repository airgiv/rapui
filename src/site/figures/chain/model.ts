/* The run, worked out once from the physics: two marbles take turns. In each
   loop the "runner" rides the screw lift, rolls the zigzag, bounces down the
   stairs and knocks the first domino, then rolls off down the gutter to wait
   at the gate. The dominoes topple one onto the next; the last one trips the
   catapult, which flings the "waiter" (the marble in its cup) over the row
   into the spiral; it winds down, rings the bell and rolls home to the lift,
   where it becomes the next runner. Early in each loop a cam pops the
   dominoes back up, pulls the catapult down and opens the gate, so the marble
   that waited rolls into the cup. Everything is sampled into tables so the
   page only looks values up, and a still frame is just a time. */
import { TRACK, TREADS, cupBall, pointAt, type Slot, type Track } from "./tracks";
import {
  ARM_CUP,
  ARM_HIT,
  BELL_X,
  DOM_GAP,
  DOM_H,
  DOM_N,
  DOM_T,
  G,
  LEVER_REST,
  LEVER_SHOT,
  LIFT_BALL,
  MM,
  PITCH,
  PIVOT,
  PLATE_BACK,
  PLATE_FRONT,
  R,
  SPIRAL,
  TABLE_TOP,
  V_LIFT,
  VIEW,
  Z_IN,
  Z_OUT,
  domBack,
} from "./view";
import { RAD, add, dot, mul, smooth, sub, unit, type V3 } from "./vec";

export const RATE = 240; // samples per second
const DT = 1 / 4000;
const BOUNCE_MIN = 45; // units/s: slower than this into a surface, it settles and rolls

export const SLOTS: Slot[] = ["back", "lift", "wall", "stairs", "table", "gutter", "spiralBack", "spiralFront", "exitA", "exitB", "top"];
export const PHASES = ["waiting", "lift", "ramp 1", "ramp 2", "ramp 3", "chute", "stairs", "run-out", "gutter", "cup", "launch", "flight", "spiral", "bell", "return"] as const;
export type Phase = (typeof PHASES)[number];

const PHASE_OF: Record<string, Phase> = {
  ramp1: "ramp 1",
  ramp2: "ramp 2",
  ramp3: "ramp 3",
  chute: "chute",
  tread0: "stairs",
  tread1: "stairs",
  tread2: "stairs",
  tread3: "stairs",
  runout: "run-out",
  side: "gutter",
  gutter: "gutter",
  load: "cup",
  spiral: "spiral",
  exit: "bell",
  channel: "return",
};

/* a recorder that writes one sample every 1/RATE s */
class Tape {
  t = 0;
  next = 0;
  data: number[] = [];
  write(p: V3, slot: Slot, phase: Phase) {
    while (this.next <= this.t + 1e-9) {
      this.data.push(p[0], p[1], p[2], SLOTS.indexOf(slot), PHASES.indexOf(phase));
      this.next += 1 / RATE;
    }
  }
}

function slotOn(track: Track, p: V3): Slot {
  if (track.id === "spiral") {
    const nx = p[0] - SPIRAL[0];
    const ny = p[1] - SPIRAL[1];
    return nx * VIEW[0] + ny * VIEW[1] > 0 ? "spiralFront" : "spiralBack";
  }
  if (track.id === "exit") return "exitB";
  if (track.id === "channel") return p[0] < -118 ? "lift" : p[0] > BELL_X ? "exitB" : "exitA";
  return track.slot;
}

interface Wall {
  p: V3;
  n: V3;
  e: number;
}

type RollEnd = { kind: "stopped"; p: V3 } | { kind: "left"; track: Track; p: V3; vel: V3 };

function roll(tape: Tape, start: Track, s0: number, v0: number, until = Infinity): RollEnd {
  let track = start;
  let s = s0;
  let v = v0;
  const born = tape.t;
  for (;;) {
    if (tape.t - born > 12) throw new Error(`roll on ${track.id} never ended (s ${s.toFixed(1)}, v ${v.toFixed(1)})`);
    const { p, d } = pointAt(track, s);
    tape.write(p, slotOn(track, p), PHASE_OF[track.id] ?? "waiting");
    if (tape.t >= until) return { kind: "stopped", p };
    const drive = -track.k * G * d[2];
    if (Math.abs(v) < 0.6 && Math.abs(drive) <= track.mu) {
      if (track.endStop !== undefined || track.startStop !== undefined || s <= 0 || s >= track.len) return { kind: "stopped", p };
    }
    const a = drive - track.mu * Math.sign(v) - track.drag * v - track.wall * v * Math.abs(v);
    v += a * DT;
    s += v * DT;
    tape.t += DT;
    if (s >= track.len) {
      if (track.next) {
        s -= track.len;
        track = TRACK[track.next]!;
        continue;
      }
      if (track.endStop !== undefined) {
        s = track.len - (s - track.len);
        v = -v * track.endStop;
        if (Math.abs(v) < 3 || track.endStop === 0) {
          v = 0;
          s = track.len;
          const end = pointAt(track, s).p;
          tape.write(end, slotOn(track, end), PHASE_OF[track.id] ?? "waiting");
          return { kind: "stopped", p: end };
        }
        continue;
      }
      const end = pointAt(track, track.len);
      return { kind: "left", track, p: end.p, vel: mul(end.d, v) };
    }
    if (s <= 0) {
      if (track.startStop !== undefined) {
        s = -s;
        v = -v * track.startStop;
        continue;
      }
      s = 0;
      v = 0;
    }
  }
}

/* the highest piece of track under (or just at) a point, within the rails */
function contact(track: Track, p: V3): { s: number; z: number; d: V3 } | null {
  let best: { s: number; z: number; d: V3 } | null = null;
  for (let i = 0; i < track.pts.length - 1; i++) {
    const a = track.pts[i]!;
    const b = track.pts[i + 1]!;
    const hx = b[0] - a[0];
    const hy = b[1] - a[1];
    const hh = hx * hx + hy * hy;
    if (hh < 1e-9) continue;
    const f = ((p[0] - a[0]) * hx + (p[1] - a[1]) * hy) / hh;
    if (f < -0.02 || f > 1.02) continue;
    const cx = a[0] + hx * f;
    const cy = a[1] + hy * f;
    if (Math.hypot(p[0] - cx, p[1] - cy) > 2.5) continue;
    const z = a[2] + (b[2] - a[2]) * f;
    if (z > p[2] + 4) continue;
    if (!best || z > best.z) best = { s: track.cum[i]! + Math.sqrt(hh + (b[2] - a[2]) ** 2) * Math.min(Math.max(f, 0), 1), z, d: unit(sub(b, a)) };
  }
  return best;
}

function fly(tape: Tape, p0: V3, v0: V3, slot: Slot, phase: Phase, lands: Track[], walls: Wall[] = [], e = 0.42, skip?: Track): { track: Track; s: number; v: number } {
  let p = p0;
  let vel = v0;
  const born = tape.t;
  for (;;) {
    if (tape.t - born > 4) throw new Error(`flight from ${p0.map((v) => v.toFixed(1))} never landed (at ${p.map((v) => v.toFixed(1))})`);
    vel = [vel[0], vel[1], vel[2] - G * DT];
    p = add(p, mul(vel, DT));
    tape.t += DT;
    for (const w of walls) {
      const gap = dot(sub(p, w.p), w.n);
      const vn = dot(vel, w.n);
      if (gap < R && vn < 0) {
        vel = sub(vel, mul(w.n, (1 + w.e) * vn));
        p = add(p, mul(w.n, R - gap));
      }
    }
    tape.write(p, slot, phase);
    if (vel[2] >= 0) continue;
    for (const track of lands) {
      if (track === skip && tape.t - born < 0.04) continue;
      const hit = contact(track, p);
      if (!hit || p[2] > hit.z) continue;
      const n = unit(sub([0, 0, 1], mul(hit.d, hit.d[2])));
      const vn = dot(vel, n);
      p = [p[0], p[1], hit.z];
      if (-vn > BOUNCE_MIN) {
        vel = sub(vel, mul(n, (1 + e) * vn));
        const along = dot(vel, hit.d);
        vel = add(vel, mul(hit.d, along * -0.06));
        continue;
      }
      return { track, s: hit.s, v: dot(vel, hit.d) };
    }
  }
}

/* ---------------------------------------------------------------- dominoes */

/* domino i tilts toward -y about its front-bottom edge; the corner that leads is
   the top front one. lean(phi) is how far domino i can tilt before that corner
   meets the back face of domino i+1, itself tilted phi. */
const HINGE = (i: number) => domBack(i) - DOM_T; // y of the hinge edge
function leanOn(phi: number): number {
  // relative to domino i's hinge: next hinge is DOM_GAP further in -y
  const backX = -DOM_GAP + DOM_T * Math.cos(phi); // y of the next domino's back-bottom corner (relative, -y is +fall)
  const backZ = DOM_T * Math.sin(phi);
  const nx = Math.cos(phi);
  const nz = Math.sin(phi);
  const f = (th: number) => (-DOM_H * Math.sin(th) - backX) * nx + (DOM_H * Math.cos(th) - backZ) * nz;
  if (f(Math.PI / 2) > 0) return Math.PI / 2;
  let lo = 0;
  let hi = Math.PI / 2;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return lo;
}
const LEAN_TABLE = Array.from({ length: 181 }, (_, i) => leanOn((i / 180) * (Math.PI / 2)));
export const lean = (phi: number) => {
  const x = Math.min(Math.max(phi / (Math.PI / 2), 0), 1) * 180;
  const i = Math.min(Math.floor(x), 179);
  return LEAN_TABLE[i]! + (LEAN_TABLE[i + 1]! - LEAN_TABLE[i]!) * (x - i);
};

/* the struck paddle's top, for a cup-arm angle (degrees): the paddle sits on the other arm */
const paddleTop = (cupAngle: number) => PIVOT[2] + ARM_HIT * Math.sin(-cupAngle * RAD) + 2.2;
const lastAngleOn = (cupAngle: number) => Math.min(Math.acos(Math.min(1, Math.max(-1, (paddleTop(cupAngle) - TABLE_TOP) / DOM_H))), 91 * RAD);

const ALPHA = (3 * G) / (2 * (DOM_H * DOM_H + DOM_T * DOM_T));

/* ------------------------------------------------------------------ the run */

export interface Run {
  T: number;
  runner: Float32Array;
  waiter: Float32Array;
  domStart: number; // when the first domino is struck
  dom: Float32Array[]; // angles of each domino from domStart, at RATE
  domFallen: number[]; // final angles
  launch: number; // the catapult fires
  shotTime: number; // how long the arm takes to reach its stop
  omega: number; // arm speed at the stop, rad/s
  resetAt: number; // the cam starts popping dominoes up
  leverBack: [number, number]; // the arm is pulled back down over this window
  gateOpen: number;
  bellAt: number;
  liftTop: number;
}

const RESET_AT = 3.9;
const RESET_STAGGER = 0.11;
const RESET_SETTLE = 9; // rad/s of the critically damped pop-up

function build(): Run {
  /* ---- the runner ---- */
  const tape = new Tape();
  const liftTime = (Z_OUT - Z_IN) / V_LIFT;
  while (tape.t < liftTime) {
    tape.write([LIFT_BALL[0], LIFT_BALL[1], Z_IN + V_LIFT * tape.t], "lift", "lift");
    tape.t += DT;
  }
  let end = roll(tape, TRACK.ramp1!, 0, V_LIFT * 0.6);
  if (end.kind !== "left") throw new Error("ramp 1 stalled");
  let land = fly(tape, end.p, end.vel, "wall", "ramp 1", [TRACK.ramp2!], [{ p: [0, PLATE_FRONT, 0], n: [0, -1, 0], e: 0.35 }]);
  end = roll(tape, land.track, land.s, land.v);
  if (end.kind !== "left") throw new Error("ramp 2 stalled");
  land = fly(tape, end.p, end.vel, "wall", "ramp 2", [TRACK.ramp3!], [{ p: [0, PLATE_BACK, 0], n: [0, 1, 0], e: 0.35 }]);
  end = roll(tape, land.track, land.s, land.v);
  if (end.kind !== "left") throw new Error("chute stalled");
  const lands = [...TREADS, TRACK.runout!];
  let from: Track | undefined = end.track;
  for (;;) {
    land = fly(tape, end.p, end.vel, "stairs", "stairs", lands, [], 0.48, from);
    end = roll(tape, land.track, land.s, land.v);
    if (end.kind !== "left") throw new Error("stairs stalled");
    if (end.track.id === "runout") break;
    from = end.track;
  }
  const hitAt = tape.t;
  const hitSpeed = Math.hypot(...end.vel);
  // the marble gives most of its momentum to the domino, then the side slope takes it
  const side = roll(tape, TRACK.side!, 0, 22);
  if (side.kind !== "stopped") throw new Error("gutter did not stop");
  const runnerRest = side.p;

  /* ---- the dominoes ---- */
  const th = new Array(DOM_N).fill(0) as number[];
  const om = new Array(DOM_N).fill(0) as number[];
  const state = new Array(DOM_N).fill("up") as ("up" | "free" | "lean" | "paddle")[];
  state[0] = "free";
  om[0] = Math.max(3.4, hitSpeed / 30);
  const dom: number[][] = Array.from({ length: DOM_N }, () => []);
  let launch = -1;
  let tt = 0;
  let nextSample = 0;
  const domTop = (i: number, a: number): V3 => [0, HINGE(i) - DOM_H * Math.sin(a), TABLE_TOP + DOM_H * Math.cos(a)];
  // the arm's own motion once fired, needed for the last domino to follow it down
  let shotTime = 0;
  let omega = 0;
  let leverAt = (_t: number) => LEVER_REST;
  for (let step = 0; step < 4000 * 6; step++) {
    for (let i = DOM_N - 1; i >= 0; i--) {
      if (state[i] === "free") {
        om[i]! += ALPHA * (DOM_H * Math.sin(th[i]!) - DOM_T * Math.cos(th[i]!)) * DT;
        th[i]! += om[i]! * DT;
        if (i < DOM_N - 1 && state[i + 1] === "up" && th[i]! >= lean(0)) {
          state[i + 1] = "free";
          om[i + 1] = om[i]! * 0.82;
          state[i] = "lean";
        }
        if (i === DOM_N - 1 && launch < 0 && domTop(i, th[i]!)[2] <= paddleTop(LEVER_REST)) {
          launch = hitAt + tt;
          state[i] = "paddle";
        }
        if (th[i]! >= Math.PI / 2) {
          th[i] = Math.PI / 2;
          om[i] = 0;
        }
      } else if (state[i] === "lean") {
        th[i] = Math.max(th[i]!, Math.min(lean(th[i + 1]!), Math.PI / 2));
      } else if (state[i] === "paddle") {
        th[i] = Math.max(th[i]!, lastAngleOn(leverAt(hitAt + tt)));
      }
    }
    if (launch > 0 && omega === 0) {
      // the catapult: aim so the marble drops into the spiral's scoop
      const startP = cupBall(LEVER_SHOT);
      const u: V3 = [Math.sin(LEVER_SHOT * RAD), 0, Math.cos(LEVER_SHOT * RAD)];
      const target = pointAt(TRACK.spiral!, 12).p;
      const dx = target[0] - startP[0];
      const dz = target[2] - startP[2];
      const v2 = (G * dx * dx) / (2 * u[0] * u[0] * ((dx * u[2]) / u[0] - dz));
      const v = Math.sqrt(v2);
      omega = v / ARM_CUP;
      const span = (LEVER_SHOT - LEVER_REST) * RAD;
      const alpha = (omega * omega) / (2 * span);
      shotTime = omega / alpha;
      const t0 = launch;
      leverAt = (t: number) => (t <= t0 ? LEVER_REST : t >= t0 + shotTime ? LEVER_SHOT : LEVER_REST + (0.5 * alpha * (t - t0) ** 2) / RAD);
    }
    tt += DT;
    if (tt >= nextSample) {
      for (let i = 0; i < DOM_N; i++) dom[i]!.push(th[i]!);
      nextSample += 1 / RATE;
    }
  }
  if (launch < 0) throw new Error("the row never reached the catapult");

  /* ---- the waiter ---- */
  const wt = new Tape();
  const resetAt = RESET_AT;
  const lastUp = resetAt; // domino DOM_N-1 pops first
  const leverBack: [number, number] = [lastUp + 0.32, lastUp + 1.0];
  const gateOpen = leverBack[1] + 0.12;
  while (wt.t < gateOpen) {
    wt.write(runnerRest, "gutter", "waiting");
    wt.t += DT;
  }
  const loaded = roll(wt, TRACK.load!, 0, 0);
  if (loaded.kind !== "stopped") throw new Error("load failed");
  while (wt.t < launch) {
    wt.write(cupBall(LEVER_REST), "gutter", "cup");
    wt.t += DT;
  }
  while (wt.t < launch + shotTime) {
    wt.write(cupBall(leverAt(wt.t)), "gutter", "launch");
    wt.t += DT;
  }
  const u: V3 = [Math.sin(LEVER_SHOT * RAD), 0, Math.cos(LEVER_SHOT * RAD)];
  const flight = fly(wt, cupBall(LEVER_SHOT), mul(u, omega * ARM_CUP), "top", "flight", [TRACK.spiral!], [], 0.12);
  let bellAt = -1;
  const home = roll(wt, flight.track, flight.s, flight.v);
  if (home.kind !== "stopped") throw new Error("the waiter never got home");
  // find when it passed the hammer
  for (let i = 0; i * 5 < wt.data.length; i++) {
    const x = wt.data[i * 5]!;
    const slot = SLOTS[wt.data[i * 5 + 3]!];
    if ((slot === "exitA" || slot === "exitB") && x <= BELL_X + 7 && bellAt < 0) bellAt = i / RATE;
  }

  /* ---- the loop length: the screw must come round to the same place ---- */
  // the marble home in the intake is picked up by the next pass of the flight
  const beat = PITCH / V_LIFT;
  const T = Math.ceil((Math.max(wt.t, tape.t) + 0.05) / beat) * beat;
  const pad = (t: Tape, p: V3, slot: Slot, phase: Phase) => {
    while (t.t < T) {
      t.write(p, slot, phase);
      t.t += DT;
    }
  };
  pad(tape, runnerRest, "gutter", "waiting");
  pad(wt, home.p, "back", "waiting");
  const n = Math.round(T * RATE);
  return {
    T,
    runner: Float32Array.from(tape.data.slice(0, n * 5)),
    waiter: Float32Array.from(wt.data.slice(0, n * 5)),
    domStart: hitAt,
    dom: dom.map((list) => Float32Array.from(list)),
    domFallen: th.slice(),
    launch,
    shotTime,
    omega,
    resetAt,
    leverBack,
    gateOpen,
    bellAt,
    liftTop: liftTime,
  };
}

export const RUN = build();

/* ------------------------------------------------------------- lookups */

export interface MarbleAt {
  p: V3;
  slot: Slot;
  phase: Phase;
  speed: number;
}

function sampleOf(table: Float32Array, t: number): MarbleAt {
  const n = table.length / 5;
  const x = (((t % RUN.T) + RUN.T) % RUN.T) * RATE;
  const i = Math.min(Math.floor(x), n - 1);
  const j = (i + 1) % n;
  const f = x - i;
  const p: V3 = [0, 0, 0];
  for (let k = 0; k < 3; k++) p[k] = table[i * 5 + k]! + (table[j * 5 + k]! - table[i * 5 + k]!) * f;
  const speed = Math.hypot(table[j * 5]! - table[i * 5]!, table[j * 5 + 1]! - table[i * 5 + 1]!, table[j * 5 + 2]! - table[i * 5 + 2]!) * RATE;
  return { p, slot: SLOTS[table[i * 5 + 3]!]!, phase: PHASES[table[i * 5 + 4]!]!, speed: j === 0 ? 0 : speed };
}

export const runnerAt = (t: number) => sampleOf(RUN.runner, t);
export const waiterAt = (t: number) => sampleOf(RUN.waiter, t);

/* the cup arm angle (degrees) over the loop */
export function leverAt(t: number): number {
  const { launch, shotTime, leverBack } = RUN;
  if (t < leverBack[0]) return LEVER_SHOT;
  if (t < leverBack[1]) return LEVER_SHOT + (LEVER_REST - LEVER_SHOT) * smooth((t - leverBack[0]) / (leverBack[1] - leverBack[0]));
  if (t < launch) return LEVER_REST;
  if (t < launch + shotTime) {
    const span = LEVER_SHOT - LEVER_REST;
    const f = (t - launch) / shotTime;
    return LEVER_REST + span * f * f;
  }
  return LEVER_SHOT;
}

/* domino angles over the loop: popped back up early, knocked over later */
export function dominoAt(t: number, i: number, calm = false): number {
  if (t >= RUN.domStart) {
    const list = RUN.dom[i]!;
    const k = Math.min(Math.floor((t - RUN.domStart) * RATE), list.length - 1);
    const f = Math.min(1, (t - RUN.domStart) * RATE - k);
    const a = list[k]!;
    const b = list[Math.min(k + 1, list.length - 1)]!;
    return a + (b - a) * f;
  }
  return resetAngle(t, i, calm);
}

function resetAngle(t: number, i: number, calm: boolean): number {
  // the last domino pops first; each one behind it is held by the one in front
  const own = (j: number) => {
    const start = RUN.resetAt + (DOM_N - 1 - j) * RESET_STAGGER;
    const fallen = RUN.domFallen[j]!;
    if (t <= start) return fallen;
    const tau = t - start;
    const w = RESET_SETTLE * (calm ? 0.9 : 1);
    return fallen * (1 + w * tau) * Math.exp(-w * tau);
  };
  let angle = Math.min(own(DOM_N - 1), lastAngleOn(leverAt(t)));
  for (let j = DOM_N - 2; j >= i; j--) angle = Math.min(own(j), lean(angle));
  return angle;
}

/* the hammer: swings into the bell when the marble passes, settles back */
export function hammerAt(t: number, calm = false): number {
  const tau = t - RUN.bellAt;
  if (RUN.bellAt < 0 || tau < 0) return 0;
  const strike = 0.075;
  if (tau < strike) return smooth(tau / strike);
  const back = tau - strike;
  return calm ? Math.exp(-7 * back) : Math.exp(-5.5 * back) * Math.cos(15 * back);
}

/* the bell's ring: a fast fading shiver after the strike */
export function ringAt(t: number, calm = false): number {
  const tau = t - RUN.bellAt - 0.075;
  if (calm || RUN.bellAt < 0 || tau < 0 || tau > 1) return 0;
  return Math.sin(tau * 2 * Math.PI * 22) * Math.exp(-6 * tau);
}

/* the screw's turn, radians: one pitch per beat, so the loop closes */
export const screwAt = (t: number) => ((t * V_LIFT) / PITCH) * Math.PI * 2;

/* how lit each marble is: the runner until the catapult fires, then the waiter */
export function litOf(t: number): { runner: number; waiter: number } {
  const f = smooth((t - RUN.launch + 0.08) / 0.2);
  return { runner: 1 - f, waiter: f };
}

/* the readout, from the marble in play */
export function readoutOf(t: number): string {
  const lit = litOf(t);
  const m = lit.runner >= 0.5 ? runnerAt(t) : waiterAt(t);
  const v = (m.speed * MM).toFixed(2);
  if (t >= RUN.domStart && t < RUN.launch) {
    const down = RUN.dom.reduce((n, _list, i) => n + (dominoAt(t, i) > 0.6 ? 1 : 0), 0);
    return `dominoes · ${down} of ${DOM_N} down`;
  }
  if (m.phase === "waiting" || m.phase === "cup") return `${m.phase} · ${v} m/s`;
  return `${m.phase} · ${v} m/s`;
}

/* the composed still: the marble mid-ramp, the dominoes half back up */
export const STILL_T = RUN.resetAt + 0.36;
