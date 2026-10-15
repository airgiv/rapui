/* The live ControlModules: places the props, the tiles and the controls in
   painter's order, runs one time-based loop and writes attributes through refs
   (no re-render per frame). Idle, the knobs turn to new positions, the buttons
   press in a slow sequence, the grille ripples with each press and the lit
   accent moves from cap to cap. Pointer and keyboard take over (drag a knob,
   press a button or the key) and the idle life comes back 3.6 s after the last
   touch. Stops offscreen; one composed still under reduced motion or an
   ancestor with data-rap-motion="still"; slower, smaller sweeps under
   data-rap-motion="calm". */
import * as React from "react";
import { Dots } from "../iso/react/draw";
import { useInView, useLoop, spring, type Spring } from "../iso/react/live";
import { IconArt, LiveSolid, Paints, RecessArt, Round, Tiles, grilleOf, writeRound, writeSolid } from "./art";
import {
  DOT_BUCKETS,
  discFace,
  discGeo,
  faderCap,
  faderGeo,
  faderGrip,
  faderValueAt,
  faderTop,
  jogDimple,
  jogGeo,
  keysGeo,
  lcdGeo,
  ledGeo,
  multiCap,
  multiNearest,
  padsGeo,
  rockerGeo,
  rockerHalves,
  stickGeo,
  stickParts,
  type JogGeo,
  type LcdGeo,
  type LedGeo,
  type MultiGeo,
  type RockerGeo,
  type StickGeo,
  switchGeo,
  switchGrip,
  switchThumb,
  type FaderGeo,
  type SwitchGeo,
  discShine,
  knobGeo,
  knobPointer,
  knurlDots,
  pillFace,
  pillGeo,
  pillKey,
  softCushion,
  softDome,
  softDrop,
  softGeo,
  softIconAt,
  type DiscGeo,
  type KnobGeo,
  type PillGeo,
  type SoftGeo,
} from "./geometry";
import { LOOP, STILL_T, idleAt } from "./model";
import { iso, type Point3 } from "../iso/iso-kit";
import { JOG, KNOB_H, P, RAD, STICK, SWITCH, centreOf, topOf, type Layout, type Tile } from "./view";
import { worldOf, type World } from "./world";
import { useSound } from "../../../rapui";

export interface ModulesHandle {
  /** Restart the idle sequence from its start (the controls glide there; nothing jumps). */
  run(): void;
}

export const DESCRIPTION =
  "A composition of separate square control tiles butted together on a table, drawn in isometric line work: tall knurled knobs covered in fine dimples (three with coloured caps, one in the accent colour, two standing in wide shallow round recesses on large tiles), dark round buttons sunk in soft rims, soft round buttons printed with a loop, a cassette and a wave icon, a long pill key in a stadium recess, and a speaker grille of round holes, faders with printed scales, sliding switches and rockers with small lamps, rows of tiny keys, pad grids, small LCDs, joystick nubs, LED strips and big jog wheels. The knobs turn by themselves, the buttons press in turn, the fader glides, the switches flip now and then, the grille ripples with each press and the accent moves from cap to cap.";
const HINT =
  "Control modules — drag a knob to turn it, drag the fader, click a button, the key or a switch; arrow keys turn the lit knob, 1 to 9 press the buttons, S and Shift+S flip the switches, F and Shift+F move the fader, M or a click on the speaker grille turns sound on or off, Enter restarts";

type Motion = "fun" | "calm" | "still";
function motionOf(node: Element | null): Motion {
  if (typeof window === "undefined") return "fun";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "still";
  const m = node?.closest("[data-rap-motion]")?.getAttribute("data-rap-motion");
  return m === "still" ? "still" : m === "calm" ? "calm" : "fun";
}

const QUIET = 3.6; // seconds after the last touch before the idle life comes back
const ease = (cur: number, target: number, dt: number, tau: number) => cur + (target - cur) * (1 - Math.exp(-dt / tau));

/* the geometry of every control of a layout, once */
type PressGeo =
  | { kind: "disc"; g: DiscGeo }
  | { kind: "soft"; g: SoftGeo; icon: "loop" | "tape" | "wave" }
  | { kind: "pill"; g: PillGeo }
  | { kind: "keys"; g: MultiGeo }
  | { kind: "pads"; g: MultiGeo };
const isJog = (t: Tile) => t.ctl.kind === "knob" && Boolean(t.ctl.jog);
const isRocker = (t: Tile) => t.ctl.kind === "switch" && Boolean(t.ctl.rocker);
function build(W: World) {
  const KNOBS = W.knobs;
  const CAPPED = W.capped;
  const PRESSABLE = W.pressable;
  return {
    TILES: W.tiles,
    KNOBS,
    CAPPED,
    PRESSABLE,
    FADERS: W.faders,
    SWITCHES: W.switches,
    KNOB_GEO: KNOBS.map((t) => (isJog(t) ? null : knobGeo(t))) as (KnobGeo | null)[],
    JOG_GEO: KNOBS.map((t) => (isJog(t) ? jogGeo(t) : null)) as (JogGeo | null)[],
    CAP_OF: KNOBS.map((k) => (CAPPED.indexOf(k) >= 0 ? CAPPED.indexOf(k) : null)) as (number | null)[],
    PRESS_GEO: PRESSABLE.map((t) =>
      t.ctl.kind === "disc"
        ? { kind: "disc", g: discGeo(t) }
        : t.ctl.kind === "soft"
          ? { kind: "soft", g: softGeo(t), icon: t.ctl.icon }
          : t.ctl.kind === "keys"
            ? { kind: "keys", g: keysGeo(t) }
            : t.ctl.kind === "pads"
              ? { kind: "pads", g: padsGeo(t) }
              : { kind: "pill", g: pillGeo(t) },
    ) as PressGeo[],
    FADER_GEO: W.faders.map(faderGeo) as FaderGeo[],
    SWITCH_GEO: W.switches.map((t) => (isRocker(t) ? null : switchGeo(t))) as (SwitchGeo | null)[],
    ROCKER_GEO: W.switches.map((t) => (isRocker(t) ? rockerGeo(t) : null)) as (RockerGeo | null)[],
    STICK_GEO: W.sticks.map(stickGeo) as StickGeo[],
    LCD_GEO: W.displays.map(lcdGeo) as LcdGeo[],
    LED_GEO: W.leds.map(ledGeo) as LedGeo[],
    GRILLE_GEO: W.grilles.map(grilleOf),
  };
}
const GEOS = new Map<World, ReturnType<typeof build>>();
const geosOf = (W: World) => {
  if (!GEOS.has(W)) GEOS.set(W, build(W));
  return GEOS.get(W)!;
};
const TONES = ["lit", "a", "b"] as const;

interface Nodes {
  dots: (SVGPathElement | null)[][]; // per knob, per bucket
  pointers: (SVGPathElement | null)[];
  tones: (SVGPathElement | null)[][]; // per capped knob: side and top layers per tone (6)
  press: (SVGGElement | null)[]; // the moving solid of each pressable
  pressFace: (SVGPathElement | null)[]; // a disc's face, a cushion's dome ring, a key's face ring
  pressShine: (SVGPathElement | null)[];
  icons: (SVGGElement | null)[];
  holes: (SVGPathElement | null)[][]; // per grille, per ring
  sndLamps: (SVGPathElement | null)[]; // the sound lamp on each grille
  caps: (SVGGElement | null)[]; // fader caps
  grips: (SVGPathElement | null)[];
  capHalos: (SVGPathElement | null)[];
  thumbs: (SVGGElement | null)[]; // switch thumbs
  thumbGrips: (SVGPathElement | null)[];
  lamps: (SVGPathElement | null)[];
  rockers: (SVGGElement | null)[][]; // per switch that is a rocker: its two halves
  multi: (SVGGElement | null)[][]; // per pressable that is a key row or pad grid: each key or pad
  dimples: (SVGPathElement | null)[][]; // per jog: clip, wall, floor, rim
  sticks: (SVGPathElement | null)[][]; // per stick: shaft, ball, foot
  lcds: (SVGTextElement | null)[];
  leds: (SVGPathElement | null)[][];
  readout: Element | null;
}

interface State {
  t: number; // the idle clock
  clock: number; // real seconds, for hand-made ripples
  held: boolean;
  touched: number; // seconds since the last touch
  seq: number; // how much the idle life drives the controls (eases 0 ↔ 1)
  angles: number[];
  target: number[];
  hand: Spring[]; // hand presses
  handHeld: boolean[];
  handAt: number[]; // clock times of recent hand presses (for the grille)
  fader: number[]; // shown
  faderTarget: number[];
  on: boolean[]; // switch states
  lastIdleOn: boolean[];
  thumb: Spring[]; // switch thumbs, 0 off .. 1 on
  pick: number[]; // per pressable: the tiny key or pad being pressed
  tilt: Spring[][]; // per stick: x and y
  tiltHand: ([number, number] | null)[]; // per stick: where the hand holds it
}

function initial(W: World, t: number, calm: boolean): State {
  const idle = idleAt(t, calm, W);
  return {
    t,
    clock: 0,
    held: false,
    touched: 99,
    seq: 1,
    angles: [...idle.angles],
    target: [...idle.angles],
    hand: W.pressable.map(() => ({ at: 0, rate: 0 })),
    handHeld: W.pressable.map(() => false),
    handAt: [],
    fader: [...idle.faders],
    faderTarget: [...idle.faders],
    on: [...idle.switches],
    lastIdleOn: [...idle.switches],
    thumb: idle.switches.map((o) => ({ at: o ? 1 : 0, rate: 0 })),
    pick: [...idle.picks],
    tilt: idle.sticks.map(([x, y]) => [
      { at: x, rate: 0 },
      { at: y, rate: 0 },
    ]),
    tiltHand: W.sticks.map(() => null),
  };
}


/* where a pointer lands on the plane z, in world x, y */
function toWorld(sx: number, sy: number, z: number): [number, number] {
  const a = (P.azimuth ?? 45) * RAD;
  const e = (P.elevation ?? 30) * RAD;
  const k = P.scale * Math.sqrt(1.6);
  const u = (sx - P.origin[0]) / k;
  const v = ((sy - P.origin[1]) / k + z * Math.cos(e)) / Math.sin(e);
  return [u * Math.sin(a) + v * Math.cos(a), -u * Math.cos(a) + v * Math.sin(a)];
}

export interface ModulesLiveProps {
  runKey?: number;
  layout?: Layout;
  /** the figure's own sound switch (the grille): whether it is on, and how to flip it */
  soundOn?: boolean;
  onSound?: () => void;
  /** footnote marks to place over controls (tile ids), the one to highlight, and hover/focus reports */
  marks?: { id: string; n: number }[];
  active?: number | null;
  onActive?: (n: number | null) => void;
}

export const ModulesLive = React.forwardRef<ModulesHandle, ModulesLiveProps>(function ModulesLive(
  { runKey, layout = "hero", soundOn = false, onSound, marks, active = null, onActive },
  ref,
) {
  const W = worldOf(layout);
  const { TILES, KNOBS, CAPPED, PRESSABLE, FADERS, SWITCHES, KNOB_GEO, JOG_GEO, CAP_OF, PRESS_GEO, FADER_GEO, SWITCH_GEO, ROCKER_GEO, STICK_GEO, LCD_GEO, LED_GEO, GRILLE_GEO } =
    geosOf(W);
  const FIRST = React.useMemo(() => idleAt(STILL_T, false, W), [W]);
  // sound only ever answers the hand, never the idle loop
  const sound = useSound();
  const snd = React.useRef(sound);
  snd.current = sound;
  const notch = React.useRef<number[]>([]); // the last notch each knob or fader sounded
  const paint = React.useId().replace(/:/g, "");
  const root = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const n = React.useRef<Nodes>({
    dots: KNOBS.map(() => []),
    pointers: [],
    tones: CAPPED.map(() => []),
    press: [],
    pressFace: [],
    pressShine: [],
    icons: [],
    holes: W.grilles.map(() => []),
    sndLamps: [],
    caps: [],
    grips: [],
    capHalos: [],
    thumbs: [],
    thumbGrips: [],
    lamps: [],
    rockers: W.switches.map(() => []),
    multi: W.pressable.map(() => []),
    dimples: KNOBS.map(() => []),
    sticks: W.sticks.map(() => []),
    lcds: [],
    leds: W.leds.map(() => []),
    readout: null,
  });
  // what each live element last showed, so a frame only rewrites what changed
  const shown = React.useRef(new Map<string, number>());
  const changed = (key: string, v: number, eps = 1e-3) => {
    const last = shown.current.get(key);
    if (last !== undefined && Math.abs(last - v) < eps) return false;
    shown.current.set(key, v);
    return true;
  };
  const st = React.useRef<State>(initial(W, STILL_T, false));
  const [motion, setMotion] = React.useState<Motion>("fun");
  const visible = useInView(root);
  const said = React.useRef("");

  /* write one frame from the state; only what changed since the last frame is rewritten */
  const draw = React.useCallback((calm: boolean) => {
    const s = st.current;
    const m = n.current;
    const idle = idleAt(s.t, calm, W);
    for (let i = 0; i < KNOBS.length; i++) {
      if (!changed(`k${i}`, s.angles[i]!, 0.05)) continue;
      const kg = KNOB_GEO[i];
      if (kg) {
        const dots = knurlDots(kg, s.angles[i]!);
        for (let b = 0; b < DOT_BUCKETS; b++) m.dots[i]![b]?.setAttribute("d", dots[b]!);
        m.pointers[i]?.setAttribute("d", knobPointer(kg, s.angles[i]!));
      } else writeDimple(m.dimples[i]!, jogDimple(JOG_GEO[i]!, s.angles[i]!));
    }
    for (let j = 0; j < CAPPED.length; j++) {
      const wts = idle.tones[j]!;
      if (!changed(`t${j}`, wts[0]! * 3 + wts[1]!)) continue;
      const a = layered(wts);
      for (let k = 0; k < 3; k++) {
        const w = a[k]!.toFixed(3);
        m.tones[j]![k]?.setAttribute("opacity", w);
        m.tones[j]![k + 3]?.setAttribute("opacity", w);
      }
    }
    for (let i = 0; i < PRESSABLE.length; i++) {
      const p = Math.min(1, Math.max(idle.presses[i]! * s.seq, s.hand[i]!.at));
      const pg = PRESS_GEO[i]!;
      if (pg.kind === "pads") {
        // the pads light in a walking pattern, and the pressed one too
        const pick = s.hand[i]!.at > 0.02 ? s.pick[i]! : idle.picks[i]!;
        for (let j = 0; j < 9; j++) {
          const lit = (j * 4 + idle.beat + i * 3) % 9 < 2 || (j === pick && p > 0.2);
          if (changed(`pl${i}.${j}`, lit ? 1 : 0)) m.multi[i]![j]?.toggleAttribute("data-on", lit);
        }
      }
      if (!changed(`p${i}`, p)) continue;
      if (pg.kind === "disc") {
        m.pressFace[i]?.setAttribute("d", discFace(pg.g, p));
        m.pressShine[i]?.setAttribute("d", discShine(pg.g, p));
      } else if (pg.kind === "soft") {
        writeRound(m.press[i] ?? null, softCushion(pg.g, p));
        m.pressFace[i]?.setAttribute("d", softDome(pg.g, p));
        m.icons[i]?.setAttribute("transform", softDrop(p));
      } else if (pg.kind === "keys" || pg.kind === "pads") {
        const pick = s.hand[i]!.at > 0.02 ? s.pick[i]! : idle.picks[i]!;
        for (let j = 0; j < pg.g.plans.length; j++) writeSolid(m.multi[i]![j] ?? null, multiCap(pg.g, j, j === pick ? p : 0));
      } else {
        writeSolid(m.press[i] ?? null, pillKey(pg.g, p));
        m.pressFace[i]?.setAttribute("d", pillFace(pg.g, p));
      }
    }
    for (let i = 0; i < FADERS.length; i++) {
      if (!changed(`f${i}`, s.fader[i]!)) continue;
      const g = FADER_GEO[i]!;
      writeSolid(m.caps[i] ?? null, faderCap(g, s.fader[i]!));
      m.grips[i]?.setAttribute("d", faderGrip(g, s.fader[i]!));
      m.capHalos[i]?.setAttribute("d", g.halo(s.fader[i]!));
    }
    for (let i = 0; i < SWITCHES.length; i++) {
      const v = Math.min(1, Math.max(0, s.thumb[i]!.at));
      if (changed(`l${i}`, s.on[i] ? 1 : 0)) m.lamps[i]?.toggleAttribute("data-on", s.on[i]!);
      if (!changed(`s${i}`, v)) continue;
      const g = SWITCH_GEO[i];
      if (g) {
        writeSolid(m.thumbs[i] ?? null, switchThumb(g, v));
        m.thumbGrips[i]?.setAttribute("d", switchGrip(g, v));
      } else {
        const [back, front] = rockerHalves(ROCKER_GEO[i]!, v);
        writeSolid(m.rockers[i]![0] ?? null, back);
        writeSolid(m.rockers[i]![1] ?? null, front);
      }
    }
    for (let i = 0; i < STICK_GEO.length; i++) {
      const tx = s.tilt[i]![0]!.at;
      const ty = s.tilt[i]![1]!.at;
      if (!changed(`x${i}`, tx * 1000 + ty, 0.5)) continue;
      const parts = stickParts(STICK_GEO[i]!, tx, ty);
      m.sticks[i]![0]?.setAttribute("d", parts.shaft);
      m.sticks[i]![1]?.setAttribute("d", parts.ball);
    }
    for (let i = 0; i < LED_GEO.length; i++) {
      const lit = Math.round(idle.leds[i]! * 10);
      if (!changed(`e${i}`, lit)) continue;
      for (let j = 0; j < 10; j++) m.leds[i]![j]?.toggleAttribute("data-on", j < lit);
    }
    // the grilles: idle ripples plus the ones the hand made
    for (let gi = 0; gi < GRILLE_GEO.length; gi++) {
      const G = GRILLE_GEO[gi]!;
      for (let k = 0; k < G.radii.length; k++) {
        const r = G.radii[k]!;
        let v = idle.ripple(r) * s.seq;
        for (const at0 of s.handAt) {
          const age = s.clock - at0;
          const d = (r - age * 46) / 7;
          v += Math.exp(-d * d) * Math.exp(-age / 0.55);
        }
        v = Math.min(1, v);
        if (changed(`g${gi}.${k}`, v, 0.01)) m.holes[gi]![k]?.style.setProperty("--v", v.toFixed(2));
      }
    }
    const ai = Math.max(0, KNOBS.indexOf(CAPPED[idle.active]!));
    const deg = Math.round((((s.angles[ai]! % 360) + 360) % 360));
    // the LCDs read the lit knob as a tempo, 60–180
    const bpm = String(60 + Math.round((deg / 360) * 120)).padStart(3, "0");
    for (const t of m.lcds) if (t && t.textContent !== bpm) t.textContent = bpm;
    const text = `knob ${ai + 1} lit · ${deg}°`;
    if (text !== said.current) {
      said.current = text;
      m.readout ??= root.current?.closest(".iso-plate")?.querySelector("[data-readout]") ?? null;
      if (m.readout) m.readout.textContent = text;
    }
  }, []);

  // the sound lamps follow the switch
  React.useEffect(() => {
    for (const l of n.current.sndLamps) l?.toggleAttribute("data-on", soundOn);
  }, [soundOn]);
  const toggleSound = () => {
    const s = st.current;
    s.handAt.push(s.clock); // a brief ripple through the holes
    onSound?.();
    touch();
  };

  const box = W.viewBox;

  // watch the motion level: OS reduced motion, or the page's data-rap-motion
  React.useEffect(() => {
    const update = () => setMotion(motionOf(root.current));
    update();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", update);
    const watcher = new MutationObserver(update);
    watcher.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["data-rap-motion"] });
    return () => {
      media.removeEventListener("change", update);
      watcher.disconnect();
    };
  }, []);

  const still = motion === "still";
  const calm = motion === "calm";
  React.useEffect(() => {
    if (still) {
      st.current = initial(W, STILL_T, false);
      draw(false);
    }
  }, [still, draw]);
  // the first paint of the live parts that aren't in the markup (grille levels)
  React.useEffect(() => draw(false), [draw]);

  const kick = useLoop((dt, reduced) => {
    if (reduced || still) return false;
    const s = st.current;
    if (!s.held) s.t += dt;
    if (s.t > LOOP * 3000) s.t -= LOOP * 3000; // keep the clock small, same phase (3000 is a multiple of the accent's 3 loops)
    s.clock += dt;
    s.handAt = s.handAt.filter((a) => s.clock - a < 1.6);
    s.touched += dt;
    const idleOn = s.touched > QUIET;
    s.seq = ease(s.seq, idleOn ? 1 : 0, dt, 0.3);
    const idle = idleAt(s.t, calm, W);
    if (idleOn) for (let i = 0; i < KNOBS.length; i++) s.target[i] = nearest(s.target[i]!, idle.angles[i]!);
    for (let i = 0; i < KNOBS.length; i++) s.angles[i] = ease(s.angles[i]!, s.target[i]!, dt, 0.12);
    for (let i = 0; i < PRESSABLE.length; i++) spring(s.hand[i]!, s.handHeld[i] ? 1 : 0, dt, 900, 26);
    if (idleOn) for (let i = 0; i < FADERS.length; i++) s.faderTarget[i] = idle.faders[i]!;
    for (let i = 0; i < FADERS.length; i++) s.fader[i] = ease(s.fader[i]!, s.faderTarget[i]!, dt, 0.14);
    for (let i = 0; i < SWITCHES.length; i++) {
      // the idle life flips a switch only at its own flips, so a hand-set switch stays put until then
      if (idle.switches[i] !== s.lastIdleOn[i] && s.touched > QUIET) s.on[i] = idle.switches[i]!;
      s.lastIdleOn[i] = idle.switches[i]!;
      spring(s.thumb[i]!, s.on[i] ? 1 : 0, dt, 520, 30);
    }
    for (let i = 0; i < STICK_GEO.length; i++) {
      const hand = s.tiltHand[i];
      const [ix, iy] = idle.sticks[i]!;
      spring(s.tilt[i]![0]!, hand ? hand[0] : ix * s.seq, dt, 260, 16);
      spring(s.tilt[i]![1]!, hand ? hand[1] : iy * s.seq, dt, 260, 16);
    }
    draw(calm);
    return true;
  }, visible && !still);

  const touch = React.useCallback(() => {
    st.current.touched = 0;
    kick();
  }, [kick]);

  const run = React.useCallback(() => {
    if (still) return;
    const s = st.current;
    s.t = 0;
    s.touched = 99;
    kick();
  }, [still, kick]);

  React.useImperativeHandle(ref, () => ({ run }), [run]);

  const firstKey = React.useRef(runKey);
  React.useEffect(() => {
    if (runKey === undefined || runKey === firstKey.current) return;
    firstKey.current = runKey;
    run();
  }, [runKey, run]);

  // a seek hook for visual checks: dispatch "cm-seek" with { t } to hold a moment, { t: -1 } to let go
  React.useEffect(() => {
    const node = root.current;
    if (!node) return;
    const seek = (e: Event) => {
      const { t, calm: c } = (e as CustomEvent<{ t: number; calm?: boolean }>).detail;
      if (t < 0) {
        st.current.held = false;
        kick();
        return;
      }
      st.current = { ...initial(W, t, Boolean(c)), held: true };
      draw(Boolean(c));
    };
    node.addEventListener("cm-seek", seek);
    return () => node.removeEventListener("cm-seek", seek);
  }, [draw, kick]);

  /* ---------------------------------------------------------- pointer */
  const drag = React.useRef<{ kind: string; i: number; id: number; last: number } | null>(null);
  const toSvg = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return [0, 0] as const;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return [p.x, p.y] as const;
  };
  const angleAt = (i: number, x: number, y: number) => {
    const g = KNOB_GEO[i]!;
    const [wx, wy] = toWorld(x, y, g.z0 + KNOB_H);
    return Math.atan2(wy - g.cy, wx - g.cx) / RAD;
  };
  const faderAt = (i: number, x: number, y: number) => {
    const g = FADER_GEO[i]!;
    const [wx, wy] = toWorld(x, y, g.z0);
    return faderValueAt(g, wx, wy);
  };
  const press = (i: number) => {
    const s = st.current;
    s.handHeld[i] = true;
    s.handAt.push(s.clock);
    snd.current.play("tap");
  };
  const lift = (i: number) => {
    const s = st.current;
    if (!s.handHeld[i]) return;
    s.handHeld[i] = false;
    snd.current.play("release");
  };
  const flip = (i: number) => {
    const s = st.current;
    if (i >= s.on.length) return;
    s.on[i] = !s.on[i];
    snd.current.play(s.on[i] ? "toggleOn" : "toggleOff");
  };
  /* a knob notches every 15°, firmer every 90°; a fader on each dot of its scale, firmer on the big ones and the ends */
  const knobNotch = (i: number) => {
    const k = Math.floor(st.current.target[i]! / 15);
    const prev = notch.current[i];
    notch.current[i] = k;
    if (prev !== undefined && prev !== k) snd.current.detent(((k % 6) + 6) % 6 === 0 ? 0.95 : 0.5);
  };
  const faderNotch = (i: number) => {
    const v = st.current.faderTarget[i]!;
    const k = Math.round(v * 10);
    const key = 100 + i;
    const prev = notch.current[key];
    notch.current[key] = k;
    if (prev !== undefined && prev !== k) snd.current.detent(k === 0 || k === 10 ? 1 : k === 5 ? 0.85 : 0.5, { pitch: 0.9 + 0.3 * v });
  };
  const onPointerDown = (e: React.PointerEvent) => {
    const ctl = (e.target as Element).closest("[data-ctl]");
    if (!ctl) return;
    const [kind, idx] = (ctl.getAttribute("data-ctl") ?? "").split("-");
    const i = Number(idx ?? 0);
    const [x, y] = toSvg(e);
    touch();
    if (kind === "snd") {
      toggleSound();
      e.preventDefault();
      return;
    }
    if (kind === "btn") {
      const pg = PRESS_GEO[i]!;
      if (pg.kind === "keys" || pg.kind === "pads") {
        const [wx, wy] = toWorld(x, y, pg.g.z0 + pg.g.h);
        st.current.pick[i] = multiNearest(pg.g, wx, wy);
      }
      press(i);
    }
    if (kind === "sw") flip(i);
    if (kind === "stick") {
      snd.current.play("tap");
      stickTo(i, x, y);
    }
    // a fader keeps its grab offset, so the cap doesn't jump to the pointer
    const last = kind === "knob" ? angleAt(i, x, y) : kind === "fd" ? st.current.faderTarget[i]! - faderAt(i, x, y) : 0;
    if (kind === "knob") notch.current[i] = Math.floor(st.current.target[i]! / 15);
    if (kind === "fd") notch.current[100 + i] = Math.round(st.current.faderTarget[i]! * 10);
    drag.current = { kind: kind!, i, id: e.pointerId, last };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer (synthetic event) */
    }
    e.preventDefault();
  };
  const stickTo = (i: number, x: number, y: number) => {
    const g = STICK_GEO[i]!;
    const [wx, wy] = toWorld(x, y, g.z0 + STICK.bootH + STICK.shaftH);
    let tx = (wx - g.cx) / (STICK.tilt * 1.6);
    let ty = (wy - g.cy) / (STICK.tilt * 1.6);
    const l = Math.hypot(tx, ty);
    if (l > 1) (tx /= l), (ty /= l);
    st.current.tiltHand[i] = [tx, ty];
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const [x, y] = toSvg(e);
    if (d.kind === "stick") {
      stickTo(d.i, x, y);
      touch();
      return;
    }
    if (d.kind === "fd") {
      st.current.faderTarget[d.i] = Math.min(1, Math.max(0, d.last + faderAt(d.i, x, y)));
      faderNotch(d.i);
      touch();
      return;
    }
    if (d.kind !== "knob") return;
    const a = angleAt(d.i, x, y);
    let delta = a - d.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.last = a;
    st.current.target[d.i] = st.current.target[d.i]! + delta;
    knobNotch(d.i);
    touch();
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.kind === "btn") lift(d.i);
    if (d.kind === "stick") {
      st.current.tiltHand[d.i] = null;
      snd.current.play("release");
    }
    drag.current = null;
    touch();
  };

  /* ---------------------------------------------------------- keyboard */
  const heldKeys = React.useRef(new Set<number>());
  const onKeyDown = (e: React.KeyboardEvent) => {
    const s = st.current;
    const k = Number(e.key);
    if (Number.isInteger(k) && k >= 1 && k <= Math.min(9, PRESSABLE.length)) {
      e.preventDefault();
      if (!heldKeys.current.has(k)) press(k - 1);
      heldKeys.current.add(k);
      // a quick tap still shows a whole press
      window.setTimeout(() => {
        if (!heldKeys.current.has(k)) lift(k - 1);
      }, 120);
      touch();
    } else if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      const active = Math.max(0, KNOBS.indexOf(CAPPED[idleAt(s.t, calm, W).active]!));
      const by = (e.shiftKey ? 45 : 15) * (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1);
      notch.current[active] = Math.floor(s.target[active]! / 15);
      s.target[active] = s.target[active]! + by;
      knobNotch(active);
      touch();
    } else if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      flip(e.shiftKey ? 1 : 0);
      touch();
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      toggleSound();
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      // F slides the fader up a step, Shift+F down
      if (s.faderTarget.length) {
        notch.current[100] = Math.round(s.faderTarget[0]! * 10);
        s.faderTarget[0] = Math.min(1, Math.max(0, s.faderTarget[0]! + (e.shiftKey ? -0.2 : 0.2)));
        faderNotch(0);
      }
      touch();
    } else if (e.key === "Enter") {
      e.preventDefault();
      run();
    }
  };
  const onKeyUp = (e: React.KeyboardEvent) => {
    const k = Number(e.key);
    if (Number.isInteger(k) && heldKeys.current.has(k)) {
      heldKeys.current.delete(k);
      const s = st.current;
      window.setTimeout(() => {
        if (!heldKeys.current.has(k) && s.handHeld[k - 1]) lift(k - 1);
      }, 60);
    }
  };

  /* ---------------------------------------------------------- the controls, far to near (built once per layout) */
  const m = n.current;
  const art = React.useMemo(() => {
    const controls = W.ctlOrder.map((ti) => {
    const t = TILES[ti]!;
    if (t.ctl.kind === "knob" && t.ctl.jog) {
      const i = KNOBS.indexOf(t);
      const g = JOG_GEO[i]!;
      const d0 = jogDimple(g, FIRST.angles[i]!);
      return (
        <g key={t.id} data-ctl={`knob-${i}`} className="cm-knob cm-jog">
          <path className="cm-recess-wall" data-shade={0} d={g.socket} />
          <path className="iso-line" data-tone="lo" d={g.socket} />
          <path className="cm-soft-halo" d={g.halo} />
          <Round paths={g.body} paint={paint} tone="mid" crease="faint">
            <path className="iso-line" data-tone="faint" d={g.rim} />
          </Round>
          <clipPath id={`${paint}-dim-${t.id}`}>
            <path ref={(el) => void (m.dimples[i]![0] = el)} d={d0.rim} />
          </clipPath>
          <path ref={(el) => void (m.dimples[i]![1] = el)} className="cm-recess-wall" data-shade={1} d={d0.rim} />
          <path ref={(el) => void (m.dimples[i]![2] = el)} className="cm-recess-floor" d={d0.floor} clipPath={`url(#${paint}-dim-${t.id})`} />
          <path ref={(el) => void (m.dimples[i]![3] = el)} className="iso-line" data-tone="mid" d={d0.rim} />
        </g>
      );
    }
    if (t.ctl.kind === "knob") {
      const i = KNOBS.indexOf(t);
      const g = KNOB_GEO[i]!;
      const cap = CAP_OF[i];
      const dots = knurlDots(g, FIRST.angles[i]!);
      return (
        <g key={t.id} data-ctl={`knob-${i}`} className="cm-knob">
          {g.recess ? <RecessArt r={g.recess} id={`${paint}-rec-${t.id}`} /> : null}
          <path className="cm-soft-halo" d={g.halo} />
          <Round paths={g.body} paint={paint} tone="mid" crease="faint" top={false}>
            <path className="iso-line" data-tone="faint" d={g.seams} />
            {dots.map((d, b) => (
              <path key={b} ref={(el) => void (m.dots[i]![b] = el)} className="cm-dots" data-b={b} d={d} />
            ))}
          </Round>
          {cap === null ? (
            <Round paths={g.cap} paint={paint} tone="mid" crease="faint">
              <path className="iso-line" data-tone="faint" d={g.capRing} />
              <path ref={(el) => void (m.pointers[i] = el)} className="cm-pointer" d={knobPointer(g, FIRST.angles[i]!)} />
            </Round>
          ) : (
            <g className="iso-solid cm-cap">
              {TONES.map((tone, k) => (
                <path
                  key={`s${tone}`}
                  ref={(el) => void (m.tones[cap]![k] = el)}
                  className="cm-cap-side"
                  data-cap={tone}
                  d={g.cap.fill}
                  opacity={layered(FIRST.tones[cap]!)[k]}
                />
              ))}
              <path d={g.cap.fill} style={{ fill: `url(#${paint}-veil)` }} />
              {TONES.map((tone, k) => (
                <path
                  key={`t${tone}`}
                  ref={(el) => void (m.tones[cap]![k + 3] = el)}
                  className="cm-cap-top"
                  data-cap={tone}
                  d={g.cap.top}
                  opacity={layered(FIRST.tones[cap]!)[k]}
                />
              ))}
              <path className="iso-line cm-cap-line" d={g.capRing} />
              <path className="iso-line cm-cap-line" d={g.cap.crease} />
              <path className="iso-line iso-edge cm-cap-edge" d={g.cap.outline} />
              <path ref={(el) => void (m.pointers[i] = el)} className="cm-pointer cm-pointer-on-cap" d={knobPointer(g, FIRST.angles[i]!)} />
            </g>
          )}
        </g>
      );
    }
    if (t.ctl.kind === "fader") {
      const i = FADERS.indexOf(t);
      const g = FADER_GEO[i]!;
      const v = st.current.fader[i]!;
      return (
        <g key={t.id} data-ctl={`fd-${i}`} className="cm-fader">
          <RecessArt r={g.recess} id={`${paint}-fd-${t.id}`} wall={0} />
          <Dots points={g.scale} size={0.9} tone="mid" />
          <Dots points={g.major} size={1.5} tone="hi" />
          <path ref={(el) => void (m.capHalos[i] = el)} className="cm-soft-halo" d={g.halo(v)} />
          <LiveSolid ref={(el) => void (m.caps[i] = el)} paths={faderCap(g, v)} tone="mid" crease="faint">
            <path ref={(el) => void (m.grips[i] = el)} className="iso-line" data-tone="lo" d={faderGrip(g, v)} />
          </LiveSolid>
        </g>
      );
    }
    if (t.ctl.kind === "switch" && t.ctl.rocker) {
      const i = SWITCHES.indexOf(t);
      const g = ROCKER_GEO[i]!;
      const [back, front] = rockerHalves(g, st.current.thumb[i]!.at);
      return (
        <g key={t.id} data-ctl={`sw-${i}`} className="cm-switch cm-rocker">
          <path className="iso-line" data-tone="faint" d={g.lampRing} />
          <path ref={(el) => void (m.lamps[i] = el)} className="cm-lamp" d={g.lamp} data-on={st.current.on[i] ? "" : undefined} />
          <RecessArt r={g.recess} id={`${paint}-rk-${t.id}`} wall={0} />
          <LiveSolid ref={(el) => void (m.rockers[i]![0] = el)} paths={back} tone="mid" crease="faint" />
          <LiveSolid ref={(el) => void (m.rockers[i]![1] = el)} paths={front} tone="mid" crease="faint" />
        </g>
      );
    }
    if (t.ctl.kind === "stick") {
      const i = W.sticks.indexOf(t);
      const g = STICK_GEO[i]!;
      const [tx, ty] = FIRST.sticks[i]!;
      const parts = stickParts(g, tx, ty);
      return (
        <g key={t.id} data-ctl={`stick-${i}`} className="cm-stick">
          <RecessArt r={g.recess} id={`${paint}-stk-${t.id}`} wall={0} />
          <path className="cm-soft-halo" d={g.halo} />
          <Round paths={g.boot} paint={paint} tone="mid" crease="faint">
            <path className="iso-line" data-tone="lo" d={parts.foot} />
          </Round>
          <path ref={(el) => void (m.sticks[i]![0] = el)} className="cm-shaft" d={parts.shaft} />
          <path ref={(el) => void (m.sticks[i]![1] = el)} className="cm-ball" d={parts.ball} style={{ fill: `url(#${paint}-ball)` }} />
        </g>
      );
    }
    if (t.ctl.kind === "display") {
      const i = W.displays.indexOf(t);
      const g = LCD_GEO[i]!;
      return (
        <g key={t.id} className="cm-display">
          <g className="cm-lcd">
            <RecessArt r={g.recess} id={`${paint}-lcd-${t.id}`} wall={0} />
          </g>
          <g transform={g.at} className="cm-lcd-text">
            <text className="cm-lcd-unit" x={7} y={13} fontSize={6.2}>
              BPM
            </text>
            <text className="cm-lcd-ghost" x={g.w - 7} y={g.d - 8} fontSize={24} textAnchor="end">
              888
            </text>
            <text ref={(el) => void (m.lcds[i] = el)} className="cm-lcd-digits" x={g.w - 7} y={g.d - 8} fontSize={24} textAnchor="end">
              120
            </text>
          </g>
        </g>
      );
    }
    if (t.ctl.kind === "leds") {
      const i = W.leds.indexOf(t);
      const g = LED_GEO[i]!;
      return (
        <g key={t.id} className="cm-leds">
          <path className="iso-line" data-tone="faint" d={g.frame} />
          {g.rings.map((d, j) => (
            <path key={`r${j}`} className="iso-line" data-tone="faint" d={d} />
          ))}
          {g.leds.map((d, j) => (
            <path key={j} ref={(el) => void (m.leds[i]![j] = el)} className="cm-lamp" data-peak={j >= 8 ? "" : undefined} d={d} />
          ))}
        </g>
      );
    }
    if (t.ctl.kind === "switch") {
      const i = SWITCHES.indexOf(t);
      const g = SWITCH_GEO[i]!;
      const v = st.current.thumb[i]!.at;
      return (
        <g key={t.id} data-ctl={`sw-${i}`} className="cm-switch">
          <path className="iso-line" data-tone="faint" d={g.lampRing} />
          <path ref={(el) => void (m.lamps[i] = el)} className="cm-lamp" d={g.lamp} data-on={st.current.on[i] ? "" : undefined} />
          <RecessArt r={g.recess} id={`${paint}-sw-${t.id}`} wall={0} />
          <LiveSolid ref={(el) => void (m.thumbs[i] = el)} paths={switchThumb(g, v)} tone="mid" crease="faint">
            <path ref={(el) => void (m.thumbGrips[i] = el)} className="iso-line" data-tone="lo" d={switchGrip(g, v)} />
          </LiveSolid>
        </g>
      );
    }
    const i = PRESSABLE.indexOf(t);
    if (i < 0) return null;
    const pg = PRESS_GEO[i]!;
    const p0 = FIRST.presses[i]!;
    if (pg.kind === "keys" || pg.kind === "pads") {
      const g = pg.g;
      const pick = FIRST.picks[i]!;
      return (
        <g key={t.id} data-ctl={`btn-${i}`} className={pg.kind === "pads" ? "cm-pads" : "cm-keys"}>
          {g.plans.map((_, j) => (
            <LiveSolid key={j} ref={(el) => void (m.multi[i]![j] = el)} paths={multiCap(g, j, j === pick ? p0 : 0)} tone="mid" crease="faint" className="cm-subkey" />
          ))}
        </g>
      );
    }
    if (pg.kind === "disc") {
      const g = pg.g;
      return (
        <g key={t.id} data-ctl={`btn-${i}`} className="cm-disc">
          <path className="cm-soft-halo" d={g.halo} />
          <Round paths={g.rim} paint={paint} tone="mid" crease="faint" />
          <clipPath id={`${paint}-well-${t.id}`}>
            <path d={g.well} />
          </clipPath>
          <path className="cm-recess-wall" data-shade={1} d={g.well} />
          <g clipPath={`url(#${paint}-well-${t.id})`}>
            <path ref={(el) => void (m.pressFace[i] = el)} className="cm-dark" d={discFace(g, p0)} />
            <path ref={(el) => void (m.pressShine[i] = el)} className="cm-shine" d={discShine(g, p0)} />
          </g>
          <path className="iso-line" data-tone="lo" d={g.well} />
        </g>
      );
    }
    if (pg.kind === "soft") {
      const g = pg.g;
      return (
        <g key={t.id} data-ctl={`btn-${i}`} className="cm-soft">
          <path className="iso-line" data-tone="faint" d={g.base} />
          <path className="cm-soft-halo" d={g.halo} />
          <Round ref={(el) => void (m.press[i] = el)} paths={softCushion(g, p0)} paint={paint} tone="mid" crease="faint" />
          <path ref={(el) => void (m.pressFace[i] = el)} className="iso-line" data-tone="faint" d={softDome(g, p0)} />
          <g ref={(el) => void (m.icons[i] = el)} transform={softDrop(p0)}>
            <g transform={`${softIconAt(g)} scale(1.45)`}>
              <IconArt icon={pg.icon} />
            </g>
          </g>
        </g>
      );
    }
    const g = pg.g;
    return (
      <g key={t.id} data-ctl={`btn-${i}`} className="cm-pill">
        <RecessArt r={g.recess} id={`${paint}-pill-${t.id}`} />
        <LiveSolid ref={(el) => void (m.press[i] = el)} paths={pillKey(g, p0)} tone="mid" crease="faint">
          <path ref={(el) => void (m.pressFace[i] = el)} className="iso-line" data-tone="faint" d={pillFace(g, p0)} />
        </LiveSolid>
      </g>
    );
  });

    return (
      <>
        <Paints id={paint} />
        <Tiles id={paint} world={W} hole={(g, k, el) => void (m.holes[g]![k] = el)} lamp={(g, el) => void (m.sndLamps[g] = el)} />
        {controls}
      </>
    );
    // the markup is static: the loop writes every change through refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, paint]);

  /* ---------------------------------------------------------- footnote marks: HTML over the drawing */
  const [spots, setSpots] = React.useState<{ n: number; x: number; y: number; show: boolean }[]>([]);
  const markList = marks ?? [];
  const markKey = markList.map((k) => `${k.id}:${k.n}`).join(",");
  React.useEffect(() => {
    const node = root.current;
    const svg = svgRef.current;
    if (!node || !svg || !markList.length) return;
    const place = () => {
      const ctm = svg.getScreenCTM();
      const rect = node.getBoundingClientRect();
      if (!ctm) return;
      setSpots(
        markList.map(({ id, n: num }) => {
          const t = TILES.find((tile) => tile.id === id);
          if (!t) return { n: num, x: 0, y: 0, show: false };
          const [x, y] = iso(anchorOf(t), P);
          const pt = new DOMPoint(x, y).matrixTransform(ctm);
          const px = pt.x - rect.left;
          const py = pt.y - rect.top;
          return { n: num, x: px, y: py, show: px > 14 && px < rect.width - 14 && py > 20 && py < rect.height - 8 };
        }),
      );
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(node);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markKey, W]);

  return (
    <div
      ref={root}
      className="cm-stage"
      tabIndex={still ? undefined : 0}
      role={still ? undefined : "group"}
      aria-label={still ? undefined : HINT}
      onPointerDown={still ? undefined : onPointerDown}
      onPointerMove={still ? undefined : onPointerMove}
      onPointerUp={still ? undefined : onPointerUp}
      onPointerCancel={still ? undefined : onPointerUp}
      onKeyDown={still ? undefined : onKeyDown}
      onKeyUp={still ? undefined : onKeyUp}
    >
      <svg
        ref={svgRef}
        className={W.layout === "field" ? "iso-svg cm-svg cm-svg-field" : "iso-svg cm-svg"}
        preserveAspectRatio={W.layout === "field" ? "xMidYMid slice" : undefined}
        viewBox={box.map((v) => Math.round(v * 10) / 10).join(" ")}
        role="img"
        aria-label={DESCRIPTION}
        aria-hidden={still ? undefined : true}
        focusable="false"
      >
        {art}
      </svg>
      {spots.map((sp) =>
        sp.show ? (
          <button
            key={sp.n}
            type="button"
            className="cm-mark"
            data-active={active === sp.n ? "" : undefined}
            style={{ left: `${sp.x.toFixed(1)}px`, top: `${sp.y.toFixed(1)}px` }}
            aria-label={`Note ${sp.n}`}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerEnter={() => onActive?.(sp.n)}
            onPointerLeave={() => onActive?.(null)}
            onFocus={() => onActive?.(sp.n)}
            onBlur={() => onActive?.(null)}
          >
            {sp.n}
          </button>
        ) : null,
      )}
    </div>
  );
});

/* layer opacities that composite (each over the ones before it) to exactly the weighted blend of the tones,
   so a crossfade never lets the white body show through half way */
function layered(w: number[]) {
  let sum = 0;
  return w.map((x) => {
    sum += x;
    return sum > 1e-6 ? x / sum : 0;
  });
}

/* the idle target nearest the current angle, so a knob never spins the long way back */
function nearest(from: number, to: number) {
  const d = ((((to - from) % 360) + 540) % 360) - 180;
  return from + d;
}

/* the point a footnote mark points at: the top of the control on a tile */
function anchorOf(t: Tile): Point3 {
  const [cx, cy] = centreOf(t);
  const z = topOf(t);
  if (t.ctl.kind === "knob") return [cx, cy, z + (t.ctl.jog ? JOG.h : KNOB_H)];
  if (t.ctl.kind === "switch") return [cx, cy, z + SWITCH.thumb.h];
  if (t.ctl.kind === "fader") return faderTop(faderGeo(t), 0.5);
  if (t.ctl.kind === "grille") return [cx, cy, z];
  return [cx, cy, z + 5];
}

/* move a jog's dimple: its clip, wall, floor and rim */
function writeDimple(els: (SVGPathElement | null)[], r: { rim: string; floor: string }) {
  els[0]?.setAttribute("d", r.rim);
  els[1]?.setAttribute("d", r.rim);
  els[2]?.setAttribute("d", r.floor);
  els[3]?.setAttribute("d", r.rim);
}
