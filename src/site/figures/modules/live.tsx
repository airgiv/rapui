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
import { Dots, FaceText } from "../iso/react/draw";
import { translateAlong } from "../iso/iso-kit";
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
  batGeo,
  batLever,
  bellGeo,
  dialGeo,
  dialHoles,
  drawerFront,
  drawerGeo,
  drawerSlide,
  drawerTray,
  gaugeGeo,
  gaugeNeedle,
  knifeBlade,
  knifeGeo,
  stampDrop,
  stampGeo,
  typeDrop,
  typeGeo,
  type BatGeo,
  type BellGeo,
  type DialGeo,
  type DrawerGeo,
  type GaugeGeo,
  type KnifeGeo,
  type StampGeo,
  type TypeGeo,
  type Poly,
  glassGeo,
  graticule,
  jacksGeo,
  matrixDots,
  scopeTrace,
  type GlassGeo,
  type JackGeo,
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
import { KNOB_H, P, RAD, STICK, ctlFill, subFill, tileFill, type Layout, type Tile, type TileSet } from "./view";
import { FIELD_BOX, PERIOD_H, PERIOD_W, worldOf, type World } from "./world";
import { PERIOD_D, PERIOD_S } from "./view";
import { useSound } from "../../../rapui";

export interface ModulesHandle {
  /** Restart the idle sequence from its start (the controls glide there; nothing jumps). */
  run(): void;
}

export const DESCRIPTION =
  "A composition of separate square control tiles butted together on a table, drawn in isometric line work: tall knurled knobs covered in fine dimples (three with coloured caps, one in the accent colour, two standing in wide shallow round recesses on large tiles), dark round buttons sunk in soft rims, soft round buttons printed with a loop, a cassette and a wave icon, a long pill key in a stadium recess, and a speaker grille of round holes, faders with printed scales, sliding switches and rockers with small lamps, rows of tiny keys, pad grids, small LCDs, joystick nubs, LED strips and big jog wheels. The knobs turn by themselves, the buttons press in turn, the fader glides, the switches flip now and then, the grille ripples with each press and the accent moves from cap to cap.";
const HINT =
  "Control modules — drag a knob to turn it, drag the fader, click a button, the key or a switch; arrow keys turn the lit knob, 1 to 9 press the buttons, S and Shift+S flip the switches, F and Shift+F move the fader, M or a click on the speaker grille turns sound on or off, Enter restarts";
const FIELD_HINT =
  "An endless field of control modules — drag the floor in any direction or press the arrow keys (Shift for further) to move across it; drag a knob, fader or joystick to work it, click a button, key or switch; [ and ] turn the lit knob, 1 to 9 press the first buttons, S flips a switch, M or a click on a speaker grille turns sound on or off, Enter restarts";

type Motion = "fun" | "calm" | "still";
function motionOf(node: Element | null): Motion {
  if (typeof window === "undefined") return "fun";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "still";
  const m = node?.closest("[data-rap-motion]")?.getAttribute("data-rap-motion");
  return m === "still" ? "still" : m === "calm" ? "calm" : "fun";
}

const QUIET = 3.6;
/* a rotary dial goes home at this many degrees a second */
const DIAL_SPEED = 330;
/* a field animates ACTIVE controls in view at a time, a new handful every ACT_EVERY seconds */
const ACTIVE = 4;
const ACT_EVERY = 2.4;
const ANIMATED = new Set(["knob", "disc", "soft", "pill", "keys", "pads", "fader", "switch", "stick", "gauge", "stamp", "drawer", "bell", "grille", "leds"]);
const mix = (i: number, e: number) => (Math.imul(i * 2654435761 + e * 40503, 2246822519) >>> 0) / 4294967296;
/* a field's coarse pan steps, in drawing units (see placeTiles) */
const STEP_X = 640;
const STEP_Y = 400; // seconds after the last touch before the idle life comes back
const ease = (cur: number, target: number, dt: number, tau: number) => cur + (target - cur) * (1 - Math.exp(-dt / tau));

/* the geometry of every control of a layout, once */
type PressGeo =
  | { kind: "type"; g: TypeGeo; pick: MultiGeo }
  | { kind: "stamp"; g: StampGeo }
  | { kind: "drawer"; g: DrawerGeo }
  | { kind: "bell"; g: BellGeo }
  | { kind: "disc"; g: DiscGeo }
  | { kind: "soft"; g: SoftGeo; icon: "loop" | "tape" | "wave" }
  | { kind: "pill"; g: PillGeo }
  | { kind: "keys"; g: MultiGeo }
  | { kind: "pads"; g: MultiGeo };
const isJog = (t: Tile) => t.ctl.kind === "knob" && Boolean(t.ctl.jog);
const isDial = (t: Tile) => t.ctl.kind === "knob" && Boolean(t.ctl.dial);
const isBat = (t: Tile) => t.ctl.kind === "switch" && Boolean(t.ctl.bat);
const isKnife = (t: Tile) => t.ctl.kind === "switch" && Boolean(t.ctl.knife);
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
    KNOB_GEO: KNOBS.map((t) => (isJog(t) || isDial(t) ? null : knobGeo(t))) as (KnobGeo | null)[],
    DIAL_GEO: KNOBS.map((t) => (isDial(t) ? dialGeo(t) : null)) as (DialGeo | null)[],
    JOG_GEO: KNOBS.map((t) => (isJog(t) ? jogGeo(t) : null)) as (JogGeo | null)[],
    CAP_OF: KNOBS.map((k) => (CAPPED.indexOf(k) >= 0 ? CAPPED.indexOf(k) : null)) as (number | null)[],
    PRESS_GEO: PRESSABLE.map((t) =>
      t.ctl.kind === "keys" && t.ctl.round
        ? { kind: "type", g: typeGeo(t), pick: keysGeo(t) }
        : t.ctl.kind === "stamp"
          ? { kind: "stamp", g: stampGeo(t) }
          : t.ctl.kind === "drawer"
            ? { kind: "drawer", g: drawerGeo(t) }
            : t.ctl.kind === "bell"
              ? { kind: "bell", g: bellGeo(t) }
              : t.ctl.kind === "disc"
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
    SWITCH_GEO: W.switches.map((t) => (isRocker(t) || isBat(t) || isKnife(t) ? null : switchGeo(t))) as (SwitchGeo | null)[],
    BAT_GEO: W.switches.map((t) => (isBat(t) ? batGeo(t) : null)) as (BatGeo | null)[],
    KNIFE_GEO: W.switches.map((t) => (isKnife(t) ? knifeGeo(t) : null)) as (KnifeGeo | null)[],
    GAUGE_GEO: W.gauges.map(gaugeGeo) as GaugeGeo[],
    GAUGE_TI: W.gauges.map((t) => W.tiles.indexOf(t)),
    ROCKER_GEO: W.switches.map((t) => (isRocker(t) ? rockerGeo(t) : null)) as (RockerGeo | null)[],
    STICK_GEO: W.sticks.map(stickGeo) as StickGeo[],
    LCD_GEO: W.displays.map(lcdGeo) as LcdGeo[],
    LED_GEO: W.leds.map(ledGeo) as LedGeo[],
    SCOPE_GEO: W.scopes.map(glassGeo) as GlassGeo[],
    MATRIX_GEO: W.matrices.map(glassGeo) as GlassGeo[],
    JACK_GEO: W.jacks.map(jacksGeo) as JackGeo[],
    SCOPE_TI: W.scopes.map((t) => W.tiles.indexOf(t)),
    MATRIX_TI: W.matrices.map((t) => W.tiles.indexOf(t)),
    GRILLE_GEO: W.grilles.map(grilleOf),
    // each control's tile, for wrapping and for skipping what is out of view
    KNOB_TI: KNOBS.map((t) => W.tiles.indexOf(t)),
    PRESS_TI: PRESSABLE.map((t) => W.tiles.indexOf(t)),
    FADER_TI: W.faders.map((t) => W.tiles.indexOf(t)),
    SWITCH_TI: W.switches.map((t) => W.tiles.indexOf(t)),
    STICK_TI: W.sticks.map((t) => W.tiles.indexOf(t)),
    LED_TI: W.leds.map((t) => W.tiles.indexOf(t)),
    GRILLE_TI: W.grilles.map((t) => W.tiles.indexOf(t)),
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
  sticks: (SVGPathElement | null)[][]; // per stick: (unused), ball
  stickPolys: (SVGGElement | null)[]; // per stick: the shaft
  lcds: (SVGTextElement | null)[];
  tileG: (SVGGElement | null)[]; // per tile: its tile group and its control group, moved together when it wraps
  ctlG: (SVGGElement | null)[];
  pan: SVGGElement | null;
  halos: (SVGPathElement | null)[]; // a field's shadows, one path per wrap position
  leds: (SVGPathElement | null)[][];
  traces: (SVGPathElement | null)[];
  holesDial: (SVGPathElement | null)[]; // per knob that is a rotary dial
  needles: (SVGPathElement | null)[];
  levers: (SVGPathElement | null)[][]; // per switch that is a bat toggle: rod, ball
  polys: (SVGGElement | null)[][]; // per knife switch: blade, crossbar, grip
  moves: (SVGGElement | null)[]; // per pressable that moves as a whole (typewriter key caps are per key, below)
  typeCaps: (SVGGElement | null)[][];
  counters: (SVGTextElement | null)[];
  matrix: (SVGPathElement | null)[];
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
  dialTurn: number[]; // per knob that is a rotary dial: how far it is wound (degrees, ≥ 0)
  dialBack: boolean[]; // springing back
  dialDigit: number[]; // the digit it will dial when it gets home
  dialled: number; // what the counters have added up
  gaugeKick: Spring[]; // per gauge: a tap on the glass
  dOpen: boolean[]; // per pressable that is a drawer: pulled out
  scopeKind: number[]; // per scope: its waveform
  act: number[]; // per tile: how much the idle life moves it (eases 0 ↔ 1; a field animates a few at a time)
  actEpoch: number;
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
    dialTurn: W.knobs.map(() => 0),
    dialBack: W.knobs.map(() => false),
    dialDigit: W.knobs.map(() => 0),
    dialled: 0,
    gaugeKick: W.gauges.map(() => ({ at: 0, rate: 0 })),
    dOpen: W.pressable.map(() => false),
    scopeKind: W.scopes.map((_, i) => i % 3),
    act: W.tiles.map(() => (W.layout === "field" ? 0 : 1)),
    actEpoch: -1,
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
  /** a field's tile set */
  set?: TileSet;
  /** a field can be dragged around (and drifts when idle); false holds it as a fixed composition */
  pan?: boolean;
}

export const ModulesLive = React.forwardRef<ModulesHandle, ModulesLiveProps>(function ModulesLive(
  { runKey, layout = "hero", set = "synth", soundOn = false, onSound, pan: canPan = true },
  ref,
) {
  const W = worldOf(layout, set);
  const field = W.layout === "field";
  const G = geosOf(W);
  const { TILES, KNOBS, CAPPED, PRESSABLE, FADERS, SWITCHES, KNOB_GEO, JOG_GEO, CAP_OF, PRESS_GEO, FADER_GEO, SWITCH_GEO, ROCKER_GEO, STICK_GEO, LCD_GEO, LED_GEO, GRILLE_GEO } = G;
  const FIRST = React.useMemo(() => idleAt(STILL_T, false, W), [W]);
  // sound only ever answers the hand, never the idle loop
  const sound = useSound();
  const snd = React.useRef(sound);
  snd.current = sound;
  const notch = React.useRef<number[]>([]); // the last notch each knob or fader sounded
  const paint = React.useId().replace(/:/g, "");
  const root = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const layerRef = React.useRef<HTMLDivElement | null>(null); // a field's composited layer: the pan's fine shift
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
    stickPolys: [],
    lcds: [],
    tileG: [],
    ctlG: [],
    pan: null,
    halos: [],
    leds: W.leds.map(() => []),
    traces: [],
    holesDial: [],
    needles: [],
    levers: W.switches.map(() => []),
    polys: W.switches.map(() => []),
    moves: [],
    typeCaps: W.pressable.map(() => []),
    counters: [],
    matrix: [],
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
  const actOn = React.useRef(new Set<number>());

  /* ---------------------------------------------------------- the endless field (a field only)
     The field pans by (ox, oy) drawing units, each kept within one period. It repeats every PERIOD_W across
     and PERIOD_H down the screen, like a torus: each tile sits at its own place plus (nx, ny) periods, chosen
     so it lands in a window one period each way round the view, so a tile that leaves one side comes back on
     the other. A sideways shift keeps a tile's depth; a downward one doesn't, so when a tile wraps up or down
     the tiles and the controls are put back in painter's order: first by how many periods down they sit, then
     by their order within one period (the window spans exactly one period, so that is the order on screen). */
  const pan = React.useRef({
    ox: 0,
    oy: 0,
    cx: NaN, // the coarse offset, last written to the drawing
    cy: NaN,
    k: 1, // screen px per drawing unit
    lastX: "",
    lastY: "",
    order: null as null | true, // painter's order put in place once
    checks: 0, // how many times the order was redone (for checks)
    movedNodes: 0, // and how many nodes that moved
    vx: 0,
    vy: 0,
    nx: TILES.map(() => 0),
    ny: TILES.map(() => 0),
    vis: TILES.map(() => true),
    split: "",
    drag: null as null | { id: number; x: number; y: number; t: number; touch: boolean; started: boolean; scroll?: boolean; sv?: number },
    fling: 0, // the frame of a page-scroll glide after a vertical swipe
  });
  const [vbW, setVbW] = React.useState(FIELD_BOX.w);
  const box: [number, number, number, number] = field
    ? [W.viewBox[0] + W.viewBox[2] / 2 - vbW / 2, W.viewBox[1], vbW, W.viewBox[3]]
    : (W.viewBox as [number, number, number, number]);
  const boxRef = React.useRef(box);
  boxRef.current = box;
  const placeTiles = React.useCallback(() => {
    if (!field) return;
    const p = pan.current;
    const m = n.current;
    const [bx, by, bw, bh] = boxRef.current;
    const left = bx + bw / 2 - PERIOD_W / 2;
    const top = by + bh / 2 - PERIOD_H / 2;
    const midX = bx + bw / 2;
    const midY = by + bh / 2;
    p.ox = ((p.ox % PERIOD_W) + PERIOD_W) % PERIOD_W;
    p.oy = ((p.oy % PERIOD_H) + PERIOD_H) % PERIOD_H;
    // The offset is split in two. A coarse part, in big steps (STEP_X × STEP_Y drawing units), moves the
    // drawing itself, which restyles and repaints it; the rest moves the whole <svg> as a composited layer,
    // which costs neither. The <svg> is drawn STEP larger than the view on the left and the top, so that
    // shift never shows an edge. A drag or a glide so repaints a few times a second at most, not every frame.
    const fx = ((p.ox % STEP_X) + STEP_X) % STEP_X;
    const fy = ((p.oy % STEP_Y) + STEP_Y) % STEP_Y;
    const cx = p.ox - fx;
    const cy = p.oy - fy;
    if (cx !== p.cx || cy !== p.cy) {
      p.cx = cx;
      p.cy = cy;
      m.pan?.setAttribute("transform", `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
    }
    const px = ((fx - STEP_X) * p.k).toFixed(2);
    const py = ((fy - STEP_Y) * p.k).toFixed(2);
    if (px !== p.lastX || py !== p.lastY) {
      p.lastX = px;
      p.lastY = py;
      layerRef.current?.style.setProperty("transform", `translate3d(${px}px, ${py}px, 0)`);
    }
    let moved = false;
    for (let i = 0; i < TILES.length; i++) {
      const kx = Math.ceil((left - W.sx[i]! - p.ox) / PERIOD_W);
      const ky = Math.ceil((top - W.sy[i]! - p.oy) / PERIOD_H);
      if (kx !== p.nx[i] || ky !== p.ny[i]) {
        p.nx[i] = kx;
        p.ny[i] = ky;
        moved = true;
        const tf = kx || ky ? `translate(${(kx * PERIOD_W).toFixed(2)} ${(ky * PERIOD_H).toFixed(2)})` : "";
        m.tileG[i]?.setAttribute("transform", tf);
        m.ctlG[i]?.setAttribute("transform", tf);
      }
      const x = W.sx[i]! + p.ox + kx * PERIOD_W;
      const y = W.sy[i]! + p.oy + ky * PERIOD_H;
      p.vis[i] = Math.abs(x - midX) < bw / 2 + 170 && y > midY - bh / 2 - 120 && y < midY + bh / 2 + 240;
    }
    if (moved || p.order === null) {
      // Back in painter's order, from where each tile sits now (its own cell plus the periods it was moved).
      // A tile that wraps lands next to tiles it was a whole period away from before, so the order within
      // one period says nothing about it: the visible order is sorted afresh from the placed footprints
      // (a tile wholly behind a near neighbour goes first, else by depth), and only nodes out of place move.
      const order = placedOrder(W, p.nx, p.ny);
      const fix = (els: (SVGGElement | null)[], list: number[]) => {
        // move as few nodes as can be: keep the longest run that is already in order, move the rest
        const want = list.map((i) => els[i]).filter((el): el is SVGGElement => Boolean(el));
        if (!want.length) return;
        const parent = want[0]!.parentNode!;
        const at = new Map<Element, number>();
        [...parent.children].forEach((el, k) => at.set(el, k));
        const keep = longestRising(want.map((el) => at.get(el) ?? -1));
        let anchor: ChildNode | null = want[want.length - 1]!.nextSibling;
        if (!keep.has(want.length - 1)) anchor = null;
        for (let k = want.length - 1; k >= 0; k--) {
          const el = want[k]!;
          if (!keep.has(k)) {
            parent.insertBefore(el, anchor);
            p.movedNodes++;
          }
          anchor = el;
        }
      };
      fix(m.tileG, order.tiles);
      fix(m.ctlG, order.ctls);
      p.order = true;
      p.checks++;
    }
    // the shadows: one path per wrap position (two across, two down), rebuilt only when a tile changes place
    const sig = `${p.nx.join("")}|${p.ny.join("")}`;
    if (moved || sig !== p.split) {
      p.split = sig;
      const lx = Math.min(...p.nx);
      const ly = Math.min(...p.ny);
      for (let g = 0; g < 4; g++) {
        const gx = lx + (g & 1);
        const gy = ly + (g >> 1);
        const d = W.halos.filter((_, i) => p.nx[i] === gx && p.ny[i] === gy).join("");
        const el = m.halos[g];
        el?.setAttribute("d", d);
        el?.setAttribute("transform", `translate(${(gx * PERIOD_W).toFixed(2)} ${(gy * PERIOD_H).toFixed(2)})`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, field]);
  /* where a control's tile is now, so pointer maths happens in its own (unpanned) place */
  const shiftOf = (ti: number): [number, number] =>
    field ? [pan.current.cx + pan.current.nx[ti]! * PERIOD_W, pan.current.cy + pan.current.ny[ti]! * PERIOD_H] : [0, 0];
  const said = React.useRef("");

  /* write one frame from the state; only what changed since the last frame is rewritten */
  const draw = React.useCallback((calm: boolean) => {
    const s = st.current;
    const m = n.current;
    const idle = idleAt(s.t, calm, W);
    const vis = pan.current.vis;
    for (let i = 0; i < KNOBS.length; i++) {
      if (!vis[G.KNOB_TI[i]!]) continue;
      if (!changed(`k${i}`, s.angles[i]!, 0.05)) continue;
      const kg = KNOB_GEO[i];
      if (kg) {
        const dots = knurlDots(kg, s.angles[i]!);
        for (let b = 0; b < DOT_BUCKETS; b++) m.dots[i]![b]?.setAttribute("d", dots[b]!);
        m.pointers[i]?.setAttribute("d", knobPointer(kg, s.angles[i]!));
      } else if (G.DIAL_GEO[i]) m.holesDial[i]?.setAttribute("d", dialHoles(G.DIAL_GEO[i]!, s.angles[i]!));
      else writeDimple(m.dimples[i]!, jogDimple(JOG_GEO[i]!, s.angles[i]!));
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
      if (!vis[G.PRESS_TI[i]!]) continue;
      const p = Math.min(1, Math.max(idle.presses[i]! * s.seq * s.act[G.PRESS_TI[i]!]!, s.hand[i]!.at));
      const pg = PRESS_GEO[i]!;
      if (pg.kind === "pads") {
        // the pads light in a walking pattern, and the pressed one too
        const pick = s.hand[i]!.at > 0.02 ? s.pick[i]! : idle.picks[i]!;
        for (let j = 0; j < 9; j++) {
          const walk = s.act[G.PRESS_TI[i]!]! > 0.5 ? idle.beat : 0;
          const lit = (j * 4 + walk + i * 3) % 9 < 2 || (j === pick && p > 0.2);
          if (changed(`pl${i}.${j}`, lit ? 1 : 0)) m.multi[i]![j]?.toggleAttribute("data-on", lit);
        }
      }
      if (!changed(`p${i}`, p)) continue;
      if (pg.kind === "type") {
        const pick = s.hand[i]!.at > 0.02 ? s.pick[i]! : idle.picks[i]!;
        for (let j = 0; j < 4; j++) m.typeCaps[i]![j]?.setAttribute("transform", typeDrop(j === pick ? p : 0));
      } else if (pg.kind === "stamp") m.moves[i]?.setAttribute("transform", stampDrop(p));
      else if (pg.kind === "bell") m.moves[i]?.setAttribute("transform", translateAlong(P, [0, 0, -p * 2.6]));
      else if (pg.kind === "drawer") {
        const c = PRESSABLE[i]!.ctl;
        const split = c.kind === "drawer" && c.split;
        // an ajar drawer rests half open and goes all the way when pressed
        const q = c.kind === "drawer" && c.ajar ? 0.42 + 0.58 * p : p;
        writeSolid(m.press[i] ?? null, drawerFront(pg.g, q, split ? "top" : undefined));
        m.moves[i]?.setAttribute("transform", drawerSlide(q));
        if (!split) {
          const tr = drawerTray(pg.g, q);
          m.pressFace[i]?.setAttribute("d", tr.rim);
          m.pressShine[i]?.setAttribute("d", tr.cards);
        }
      } else if (pg.kind === "disc") {
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
      if (!vis[G.FADER_TI[i]!]) continue;
      if (!changed(`f${i}`, s.fader[i]!)) continue;
      const g = FADER_GEO[i]!;
      writeSolid(m.caps[i] ?? null, faderCap(g, s.fader[i]!));
      m.grips[i]?.setAttribute("d", faderGrip(g, s.fader[i]!));
      m.capHalos[i]?.setAttribute("d", g.halo(s.fader[i]!));
    }
    for (let i = 0; i < SWITCHES.length; i++) {
      if (!vis[G.SWITCH_TI[i]!]) continue;
      const v = Math.min(1, Math.max(0, s.thumb[i]!.at));
      if (changed(`l${i}`, s.on[i] ? 1 : 0)) m.lamps[i]?.toggleAttribute("data-on", s.on[i]!);
      if (!changed(`s${i}`, v)) continue;
      const g = SWITCH_GEO[i];
      if (G.BAT_GEO[i]) {
        const lv = batLever(G.BAT_GEO[i]!, v);
        writePoly(m.polys[i]![0] ?? null, lv.rod);
        m.levers[i]![1]?.setAttribute("d", lv.ball);
      } else if (G.KNIFE_GEO[i]) {
        const kb = knifeBlade(G.KNIFE_GEO[i]!, v);
        writePoly(m.polys[i]![0] ?? null, kb.blade);
        writePoly(m.polys[i]![1] ?? null, kb.cross);
        writePoly(m.polys[i]![2] ?? null, kb.grip);
      } else if (g) {
        writeSolid(m.thumbs[i] ?? null, switchThumb(g, v));
        m.thumbGrips[i]?.setAttribute("d", switchGrip(g, v));
      } else {
        const [back, front] = rockerHalves(ROCKER_GEO[i]!, v);
        writeSolid(m.rockers[i]![0] ?? null, back);
        writeSolid(m.rockers[i]![1] ?? null, front);
      }
    }
    for (let i = 0; i < STICK_GEO.length; i++) {
      if (!vis[G.STICK_TI[i]!]) continue;
      const tx = s.tilt[i]![0]!.at;
      const ty = s.tilt[i]![1]!.at;
      if (!changed(`x${i}`, tx * 1000 + ty, 0.5)) continue;
      const parts = stickParts(STICK_GEO[i]!, tx, ty);
      writePoly(m.stickPolys[i] ?? null, parts.shaft);
      m.sticks[i]![1]?.setAttribute("d", parts.ball);
    }
    for (let i = 0; i < LED_GEO.length; i++) {
      if (!vis[G.LED_TI[i]!]) continue;
      // a strip at rest shows a steady low level; in the animated handful it meters the presses
      const lit = Math.round((0.2 + (idle.leds[i]! - 0.2) * s.act[G.LED_TI[i]!]!) * 10);
      if (!changed(`e${i}`, lit)) continue;
      for (let j = 0; j < 10; j++) m.leds[i]![j]?.toggleAttribute("data-on", j < lit);
    }
    // the office's gauges and counters
    for (let i = 0; i < G.GAUGE_GEO.length; i++) {
      if (!vis[G.GAUGE_TI[i]!]) continue;
      const gv = Math.min(0.99, Math.max(0.01, FIRST.gauges[i]! + (idle.gauges[i]! - FIRST.gauges[i]!) * s.act[G.GAUGE_TI[i]!]! + s.gaugeKick[i]!.at));
      if (changed(`gg${i}`, gv, 0.002)) m.needles[i]?.setAttribute("d", gaugeNeedle(G.GAUGE_GEO[i]!, gv));
    }
    if (m.counters.length) {
      const count = String(1000 + Math.floor(s.t / 1.6) + s.dialled).slice(-4);
      for (const c of m.counters) if (c && c.textContent !== count) c.textContent = count;
    }
    // the lab's screens: a live trace on each scope, a moving spectrum on each dot-matrix
    for (let i = 0; i < G.SCOPE_GEO.length; i++) {
      if (!vis[G.SCOPE_TI[i]!]) continue;
      const g = G.SCOPE_GEO[i]!;
      // traces move slowly: twenty redraws a second are plenty, and leave the frame to the rest
      const ph = Math.floor(s.t * 20) / 20 * (calm ? 0.12 : 0.3) + i * 0.37;
      if (!changed(`sc${i}`, ph + s.scopeKind[i]! * 100, 0.002)) continue;
      const amp = 0.62 + 0.28 * Math.sin(s.t * 0.7 + i * 1.3);
      m.traces[i]?.setAttribute("d", scopeTrace(g, amp, 2 + (i % 3), ph, s.scopeKind[i]!));
    }
    for (let i = 0; i < G.MATRIX_GEO.length; i++) {
      if (!vis[G.MATRIX_TI[i]!]) continue;
      const step = Math.floor(s.t * (calm ? 5 : 10));
      if (!changed(`mx${i}`, step)) continue;
      const tt = step / 10;
      const rows = 7;
      m.matrix[i]?.setAttribute(
        "d",
        matrixDots(G.MATRIX_GEO[i]!, (c, r) => {
          const level = 0.15 + 0.75 * Math.abs(Math.sin(c * 0.55 + tt * 1.9 + i)) * (0.55 + 0.45 * Math.sin(tt * 1.1 + c * 0.23 + i * 2));
          return rows - 1 - r < Math.round(level * rows);
        }),
      );
    }
    // the grilles: idle ripples plus the ones the hand made
    for (let gi = 0; gi < GRILLE_GEO.length; gi++) {
      if (!vis[G.GRILLE_TI[gi]!]) continue;
      const GG = GRILLE_GEO[gi]!;
      for (let k = 0; k < GG.radii.length; k++) {
        const r = GG.radii[k]!;
        let v = idle.ripple(r) * s.seq * s.act[G.GRILLE_TI[gi]!]!;
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


  // a field's viewBox is as wide as the stage asks, so the strip fills it at the field's height
  React.useEffect(() => {
    const node = root.current;
    if (!node || !field || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((e) => {
      const r = e[0]?.contentRect;
      if (r && r.height > 0) {
        pan.current.k = r.height / FIELD_BOX.h;
        pan.current.cx = NaN;
        pan.current.lastX = "";
        setVbW(Math.round((FIELD_BOX.h * r.width) / r.height));
      }
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [field]);
  React.useLayoutEffect(() => {
    pan.current.nx = TILES.map(() => NaN);
    pan.current.ny = TILES.map(() => NaN);
    pan.current.order = null;
    pan.current.split = "";
    placeTiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vbW, placeTiles]);

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
    // a field animates only a few of the controls in view at a time: every ACT_EVERY seconds a new handful
    // (picked by a hash of the moment), each easing in and out of its idle life, so nothing jumps
    if (field) {
      const epoch = Math.floor(s.clock / ACT_EVERY);
      if (epoch !== s.actEpoch) {
        s.actEpoch = epoch;
        const vis = pan.current.vis;
        const pool = W.tiles.map((_, i) => i).filter((i) => vis[i] && ANIMATED.has(W.tiles[i]!.ctl.kind));
        pool.sort((a, b) => mix(a, epoch) - mix(b, epoch));
        const on = new Set(pool.slice(0, ACTIVE));
        actOn.current = on;
      }
      for (let i = 0; i < s.act.length; i++) s.act[i] = ease(s.act[i]!, actOn.current.has(i) ? 1 : 0, dt, 0.5);
    }
    const w = s.act;
    if (idleOn)
      for (let i = 0; i < KNOBS.length; i++) {
        const rest = FIRST.angles[i]!;
        const to = rest + (nearest(rest, idle.angles[i]!) - rest) * w[G.KNOB_TI[i]!]!;
        s.target[i] = nearest(s.target[i]!, to);
      }
    for (let i = 0; i < KNOBS.length; i++) s.angles[i] = ease(s.angles[i]!, s.target[i]!, dt, 0.12);
    // rotary dials: wound by hand, then home again at a constant speed, ticking once per digit
    for (let i = 0; i < KNOBS.length; i++) {
      if (!G.DIAL_GEO[i]) continue;
      if (s.dialBack[i]) {
        const before = s.dialTurn[i]!;
        const after = Math.max(0, before - DIAL_SPEED * dt);
        if (Math.floor(before / 30 - 1e-6) !== Math.floor(after / 30 - 1e-6) && before > 0) snd.current.detent(0.8);
        s.dialTurn[i] = after;
        if (after === 0) {
          s.dialBack[i] = false;
          if (s.dialDigit[i]) {
            s.dialled += s.dialDigit[i]!;
            snd.current.play("tick");
          }
          s.dialDigit[i] = 0;
        }
      }
      s.angles[i] = FIRST.angles[i]! + s.dialTurn[i]!;
    }
    for (let i = 0; i < G.GAUGE_GEO.length; i++) spring(s.gaugeKick[i]!, 0, dt, 140, 5);
    for (let i = 0; i < PRESSABLE.length; i++)
      if (PRESSABLE[i]!.ctl.kind === "drawer") spring(s.hand[i]!, s.dOpen[i] ? 1 : 0, dt, 160, 22);
      else spring(s.hand[i]!, s.handHeld[i] ? 1 : 0, dt, 900, 26);
    if (idleOn) for (let i = 0; i < FADERS.length; i++) s.faderTarget[i] = FIRST.faders[i]! + (idle.faders[i]! - FIRST.faders[i]!) * w[G.FADER_TI[i]!]!;
    for (let i = 0; i < FADERS.length; i++) s.fader[i] = ease(s.fader[i]!, s.faderTarget[i]!, dt, 0.14);
    for (let i = 0; i < SWITCHES.length; i++) {
      // the idle life flips a switch only at its own flips, so a hand-set switch stays put until then
      if (idle.switches[i] !== s.lastIdleOn[i] && s.touched > QUIET && w[G.SWITCH_TI[i]!]! > 0.5) s.on[i] = idle.switches[i]!;
      s.lastIdleOn[i] = idle.switches[i]!;
      spring(s.thumb[i]!, s.on[i] ? 1 : 0, dt, 520, 30);
    }
    for (let i = 0; i < STICK_GEO.length; i++) {
      const hand = s.tiltHand[i];
      const [ix, iy] = idle.sticks[i]!;
      const k = s.seq * w[G.STICK_TI[i]!]!;
      spring(s.tilt[i]![0]!, hand ? hand[0] : ix * k, dt, 260, 16);
      spring(s.tilt[i]![1]!, hand ? hand[1] : iy * k, dt, 260, 16);
    }
    if (field && canPan) {
      const p = pan.current;
      if (!p.drag?.started) {
        if (Math.hypot(p.vx, p.vy) > 2) {
          p.ox += p.vx * dt;
          p.oy += p.vy * dt;
          const f = Math.exp(-dt / 0.42);
          p.vx *= f;
          p.vy *= f;
        } else {
          p.vx = 0;
          p.vy = 0;
          // a very slow diagonal drift while nobody touches it
          if (s.touched > QUIET && !p.drag && !s.held) {
            p.ox -= (calm ? 4 : 9) * dt;
            p.oy -= (calm ? 1.6 : 3.6) * dt;
          }
        }
      }
      placeTiles();
    }
    // while the floor is dragged nothing else moves: the frame is the pan's alone
    if (!pan.current.drag?.started) draw(calm);
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
    // and "cm-pan" with { x, y } moves the field to an offset (drawing units), for checks of the seams
    const panTo = (e: Event) => {
      const { x = 0, y = 0 } = (e as CustomEvent<{ x?: number; y?: number }>).detail;
      pan.current.ox = x;
      pan.current.oy = y;
      pan.current.vx = 0;
      pan.current.vy = 0;
      placeTiles();
    };
    // checks of the painter's order: "cm-check" compares the DOM with a fresh sort (data-order: ok or the
    // number of tiles out of place); "cm-reorder" puts every tile back from scratch, as a first render would
    const check = () => {
      const m = n.current;
      const want = placedOrder(W, pan.current.nx, pan.current.ny).tiles.filter((i) => m.tileG[i]);
      const parent = m.tileG[want[0]!]?.parentNode;
      const have = parent ? [...parent.children].map((el) => m.tileG.indexOf(el as SVGGElement)).filter((i) => i >= 0) : [];
      const off = want.filter((i, k) => have[k] !== i).length;
      node.setAttribute("data-order", off ? String(off) : "ok");
      node.setAttribute("data-reorders", `${pan.current.checks}/${pan.current.movedNodes}`);
    };
    const reorder = () => {
      pan.current.nx = TILES.map(() => NaN);
      pan.current.ny = TILES.map(() => NaN);
      pan.current.order = null;
      const m = n.current;
      // the first render's DOM order: the order within one period
      for (const i of W.tileOrder) m.tileG[i]?.parentNode?.appendChild(m.tileG[i]!);
      placeTiles();
    };
    node.addEventListener("cm-check", check);
    node.addEventListener("cm-reorder", reorder);
    node.addEventListener("cm-seek", seek);
    node.addEventListener("cm-pan", panTo);
    return () => {
      node.removeEventListener("cm-check", check);
      node.removeEventListener("cm-reorder", reorder);
      node.removeEventListener("cm-seek", seek);
      node.removeEventListener("cm-pan", panTo);
    };
  }, [draw, kick, placeTiles]);

  /* ---------------------------------------------------------- pointer */
  const drag = React.useRef<{ kind: string; i: number; id: number; last: number; max?: number; digit?: number } | null>(null);
  const toSvg = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return [0, 0] as const;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return [p.x, p.y] as const;
  };
  const angleAt = (i: number, x: number, y: number) => {
    const g = KNOB_GEO[i] ?? JOG_GEO[i] ?? G.DIAL_GEO[i]!;
    const top = KNOB_GEO[i] ? KNOB_H : JOG_GEO[i] ? 5 : 5.4;
    const [wx, wy] = toWorld(x, y, g.z0 + top);
    return Math.atan2(wy - g.cy, wx - g.cx) / RAD;
  };
  const faderAt = (i: number, x: number, y: number) => {
    const g = FADER_GEO[i]!;
    const [wx, wy] = toWorld(x, y, g.z0);
    return faderValueAt(g, wx, wy);
  };
  const press = (i: number) => {
    const s = st.current;
    if (PRESSABLE[i]?.ctl.kind === "drawer") {
      // a drawer stays where it is put: a click pulls it out, the next pushes it home
      s.dOpen[i] = !s.dOpen[i];
      snd.current.play(s.dOpen[i] ? "tap" : "drop");
      return;
    }
    s.handHeld[i] = true;
    s.handAt.push(s.clock);
    if (PRESSABLE[i]?.ctl.kind === "bell") snd.current.play("bell");
    else snd.current.play("tap");
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
    if (!ctl) {
      // the floor: pan the strip (a touch only once it is clearly sideways, so the page still scrolls)
      if (!field || !canPan) return;
      const p = pan.current;
      const touchy = e.pointerType === "touch";
      p.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), touch: touchy, started: !touchy };
      p.vx = 0;
      p.vy = 0;
      if (!touchy) {
        try {
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
        } catch {
          /* synthetic */
        }
        root.current?.setAttribute("data-grabbing", "");
        e.preventDefault();
      }
      kick();
      return;
    }
    const [kind, idx] = (ctl.getAttribute("data-ctl") ?? "").split("-");
    const i = Number(idx ?? 0);
    const [x0, y0] = toSvg(e);
    const ti = kind === "knob" ? G.KNOB_TI[i]! : kind === "btn" ? G.PRESS_TI[i]! : kind === "fd" ? G.FADER_TI[i]! : kind === "stick" ? G.STICK_TI[i]! : -1;
    const [sx0, sy0] = ti >= 0 ? shiftOf(ti) : [0, 0];
    const x = x0 - sx0;
    const y = y0 - sy0;
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
      } else if (pg.kind === "type") {
        const [wx, wy] = toWorld(x, y, pg.pick.z0 + 10);
        st.current.pick[i] = multiNearest(pg.pick, wx, wy);
      }
      press(i);
    }
    if (kind === "sw") flip(i);
    if (kind === "gauge") {
      // a tap on the glass: the needle jumps and settles
      st.current.gaugeKick[i]!.rate += 4.5;
      snd.current.play("tick");
      e.preventDefault();
      return;
    }
    if (kind === "ctr") {
      st.current.dialled += 1;
      snd.current.play("tick");
      e.preventDefault();
      return;
    }
    if (kind === "scope") {
      st.current.scopeKind[i] = (st.current.scopeKind[i]! + 1) % 3;
      snd.current.play("tick");
      e.preventDefault();
      return;
    }
    if (kind === "jack") {
      // the probe moves to the next binding post
      const posts = (ctl as Element).querySelectorAll("[data-post-i]");
      const hot = [...posts].findIndex((el) => el.hasAttribute("data-post"));
      posts.forEach((el, k) => el.toggleAttribute("data-post", k === (hot + 1) % posts.length));
      if (posts[(hot + 1) % posts.length]) posts[(hot + 1) % posts.length]!.setAttribute("data-post", "hot");
      snd.current.play("tap");
      e.preventDefault();
      return;
    }
    if (kind === "knob" && G.DIAL_GEO[i]) {
      // a rotary dial: a finger in the nearest hole winds it clockwise, as far as the finger stop
      const g = G.DIAL_GEO[i]!;
      const s = st.current;
      if (s.dialBack[i]) return;
      const a = angleAt(i, x, y);
      const rest = FIRST.angles[i]!;
      let k = Math.round((((a - rest - 100) % 360) + 360) % 360 / 30);
      k = Math.min(9, Math.max(0, k));
      drag.current = { kind: "dial", i, id: e.pointerId, last: a, max: 330 - 30 * k, digit: (k + 1) % 10 || 10 };
      void g;
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        /* synthetic */
      }
      e.preventDefault();
      return;
    }
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
    const p = pan.current;
    if (p.drag && p.drag.id === e.pointerId) {
      const dx = e.clientX - p.drag.x;
      const dy = e.clientY - p.drag.y;
      if (!p.drag.started) {
        // a touch grabs the field once it moves more than ~25° away from straight up or down
        if (Math.hypot(dx, dy) > 8 && Math.abs(dx) > Math.abs(dy) * 0.47) {
          p.drag.started = true;
          p.drag.x = e.clientX;
          p.drag.y = e.clientY;
          try {
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
          } catch {
            /* synthetic */
          }
          root.current?.setAttribute("data-grabbing", "");
        } else if (Math.abs(dy) > 8) {
          // a swipe within ~25° of vertical is the page's: the field takes no touch gestures itself
          // (touch-action: none, so a diagonal one can grab it), so it scrolls the page by hand
          p.drag.scroll = true;
          p.drag.started = true;
          p.drag.sv = 0;
          p.drag.y = e.clientY;
          p.drag.t = performance.now();
          cancelAnimationFrame(p.fling);
          try {
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
          } catch {
            /* synthetic */
          }
        }
        return;
      }
      if (p.drag.scroll) {
        const now = performance.now();
        const dyp = e.clientY - p.drag.y;
        window.scrollBy(0, -dyp);
        p.drag.sv = (p.drag.sv ?? 0) * 0.6 + (-dyp / (Math.max(1, now - p.drag.t) / 1000)) * 0.4;
        p.drag.y = e.clientY;
        p.drag.t = now;
        return;
      }
      const k = svgRef.current?.getScreenCTM()?.a || 1; // screen px per drawing unit
      const mx = (e.clientX - p.drag.x) / k;
      const my = (e.clientY - p.drag.y) / k;
      const now = performance.now();
      const dt = Math.max(1, now - p.drag.t) / 1000;
      // the release speed: a smoothed velocity of the last moves
      p.vx = p.vx * 0.6 + (mx / dt) * 0.4;
      p.vy = p.vy * 0.6 + (my / dt) * 0.4;
      p.drag.t = now;
      p.ox += mx;
      p.oy += my;
      p.drag.x = e.clientX;
      p.drag.y = e.clientY;
      placeTiles();
      kick();
      return;
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const [x0, y0] = toSvg(e);
    const ti = d.kind === "knob" ? G.KNOB_TI[d.i]! : d.kind === "fd" ? G.FADER_TI[d.i]! : d.kind === "stick" ? G.STICK_TI[d.i]! : -1;
    const [sx0, sy0] = ti >= 0 ? shiftOf(ti) : [0, 0];
    const x = x0 - sx0;
    const y = y0 - sy0;
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
    if (d.kind === "dial") {
      const a = angleAt(d.i, x, y);
      let delta = a - d.last;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      d.last = a;
      const s = st.current;
      const before = s.dialTurn[d.i]!;
      s.dialTurn[d.i] = Math.min(d.max!, Math.max(0, before + delta));
      if (before < d.max! && s.dialTurn[d.i]! >= d.max!) snd.current.play("tick"); // the finger stop
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
    const p = pan.current;
    if (p.drag && p.drag.id === e.pointerId && p.drag.scroll) {
      // let the page glide on like a native scroll
      let v = performance.now() - p.drag.t > 90 ? 0 : (p.drag.sv ?? 0);
      p.drag = null;
      let last = performance.now();
      const glide = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        window.scrollBy(0, v * dt);
        v *= Math.exp(-dt / 0.33);
        if (Math.abs(v) > 20) p.fling = requestAnimationFrame(glide);
      };
      if (Math.abs(v) > 20) p.fling = requestAnimationFrame(glide);
      return;
    }
    if (p.drag && p.drag.id === e.pointerId) {
      // let go: glide on with the hand's speed (none if it rested before letting go)
      if (!p.drag.started || performance.now() - p.drag.t > 90 || e.type === "pointercancel") p.vx = p.vy = 0;
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 3200) (p.vx *= 3200 / sp), (p.vy *= 3200 / sp);
      p.drag = null;
      root.current?.removeAttribute("data-grabbing");
      kick();
      return;
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.kind === "btn") lift(d.i);
    if (d.kind === "dial") {
      // let go: home again at a constant speed; a digit counts only if it was wound to the stop
      const s = st.current;
      s.dialDigit[d.i] = s.dialTurn[d.i]! >= d.max! - 12 ? d.digit! : 0;
      s.dialBack[d.i] = s.dialTurn[d.i]! > 0;
    }
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
    } else if (field && canPan && e.key.startsWith("Arrow")) {
      e.preventDefault();
      // the arrows glide the field a step that way (Shift: further)
      const by = e.shiftKey ? 1500 : 600;
      if (e.key === "ArrowLeft") pan.current.vx += by;
      if (e.key === "ArrowRight") pan.current.vx -= by;
      if (e.key === "ArrowUp") pan.current.vy += by;
      if (e.key === "ArrowDown") pan.current.vy -= by;
      kick();
    } else if (e.key.startsWith("Arrow") || e.key === "[" || e.key === "]") {
      e.preventDefault();
      // [ and ] (and, in the hero, the arrows) turn the lit knob
      const active = Math.max(0, KNOBS.indexOf(CAPPED[idleAt(s.t, calm, W).active]!));
      const by = (e.shiftKey ? 45 : 15) * (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "]" ? 1 : -1);
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
    if (t.ctl.kind === "knob" && t.ctl.dial) {
      const i = KNOBS.indexOf(t);
      const g = G.DIAL_GEO[i]!;
      return (
        <g key={t.id} data-ctl={`knob-${i}`} className="cm-knob cm-dial">
          <path className="cm-soft-halo" d={g.halo} />
          <Round paths={g.ring} paint={paint} tone="mid" crease="faint" fill="brass" />
          <Round paths={g.wheel} paint={paint} tone="mid" crease="faint">
            <path ref={(el) => void (m.holesDial[i] = el)} className="cm-dial-holes" d={dialHoles(g, FIRST.angles[i]!)} />
            <path className="cm-dial-card" d={g.card} />
          </Round>
          <Round paths={g.stop} paint={paint} tone="mid" crease="faint" fill="brass" />
        </g>
      );
    }
    if (t.ctl.kind === "gauge") {
      const i = W.gauges.indexOf(t);
      const g = G.GAUGE_GEO[i]!;
      // the first gauge (the office's big one in the middle) carries the one red needle
      const lit = i === 0;
      return (
        <g key={t.id} data-ctl={`gauge-${i}`} className="cm-gauge">
          <path className="cm-soft-halo" d={g.halo} />
          <Round paths={g.bezel} paint={paint} tone="mid" crease="faint" fill="brass" />
          <path className="cm-gauge-face" d={g.face} />
          <Dots points={g.minor} size={g.r > 30 ? 0.9 : 0.7} tone="mid" />
          <Dots points={g.major} size={g.r > 30 ? 1.6 : 1.2} tone="hi" />
          <g className="cm-red-zone">
            <Dots points={g.red} size={g.r > 30 ? 1.3 : 1} tone="hi" />
          </g>
          <FaceText transform={g.at} size={g.r > 30 ? 6 : 4} tone="mid" anchor="middle">
            {g.r > 30 ? "kPa" : "VOLTS"}
          </FaceText>
          <path ref={(el) => void (m.needles[i] = el)} className="cm-needle" data-lit={lit ? "" : undefined} data-free="end" d={gaugeNeedle(g, FIRST.gauges[i]!)} />
          <path className="cm-hub" d={g.hub} />
        </g>
      );
    }
    if (t.ctl.kind === "knob" && t.ctl.jog) {
      const i = KNOBS.indexOf(t);
      const g = JOG_GEO[i]!;
      const d0 = jogDimple(g, FIRST.angles[i]!);
      return (
        <g key={t.id} data-ctl={`knob-${i}`} className="cm-knob cm-jog">
          <path className="cm-recess-wall" data-shade={0} d={g.socket} />
          <path className="iso-line" data-tone="lo" d={g.socket} />
          <path className="cm-soft-halo" d={g.halo} />
          <Round paths={g.body} paint={paint} tone="mid" crease="faint" fill={ctlFill(t)}>
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
            <Round paths={g.cap} paint={paint} tone="mid" crease="faint" fill={ctlFill(t)}>
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
          <LiveSolid ref={(el) => void (m.caps[i] = el)} paths={faderCap(g, v)} tone="mid" crease="faint" fill={ctlFill(t)}>
            <path ref={(el) => void (m.grips[i] = el)} className="iso-line" data-tone="lo" d={faderGrip(g, v)} />
          </LiveSolid>
        </g>
      );
    }
    if (t.ctl.kind === "switch" && t.ctl.bat) {
      const i = SWITCHES.indexOf(t);
      const g = G.BAT_GEO[i]!;
      const lv = batLever(g, st.current.thumb[i]!.at);
      return (
        <g key={t.id} data-ctl={`sw-${i}`} className="cm-switch cm-bat">
          <path className="cm-soft-halo" d={g.halo} />
          <LiveSolid paths={g.plate} tone="mid" crease="faint" fill="brass" />
          <Dots points={g.screws} size={1.3} tone="hi" />
          <FaceText transform={g.onAt} size={4.2} tone="mid">
            ON
          </FaceText>
          <FaceText transform={g.offAt} size={4.2} tone="mid">
            OFF
          </FaceText>
          <Round paths={g.bush} paint={paint} tone="mid" crease="faint" fill="brass">
            <path className="iso-line" data-tone="lo" d={g.nut} />
          </Round>
          <PolyLive ref={(el) => void (m.polys[i]![0] = el)} poly={lv.rod} fill="brass" round />
          <path ref={(el) => void (m.levers[i]![1] = el)} className="cm-ball" d={lv.ball} style={{ fill: `url(#${paint}-ball)` }} />
          <path ref={(el) => void (m.lamps[i] = el)} className="cm-lamp cm-hidden-lamp" d="" />
        </g>
      );
    }
    if (t.ctl.kind === "switch" && t.ctl.knife) {
      const i = SWITCHES.indexOf(t);
      const g = G.KNIFE_GEO[i]!;
      const kb = knifeBlade(g, st.current.thumb[i]!.at);
      return (
        <g key={t.id} data-ctl={`sw-${i}`} className="cm-switch cm-knife">
          <path className="cm-soft-halo" d={g.halo} />
          <LiveSolid paths={g.base} tone="mid" crease="faint" fill="slate" />
          <Dots points={g.screws} size={1.2} tone="hi" />
          <LiveSolid paths={g.farCheek} tone="mid" crease="faint" fill="brass" />
          <LiveSolid paths={g.jawBlock} tone="mid" crease="faint" fill="slate" />
          <LiveSolid paths={g.farJaw} tone="mid" crease="faint" fill="brass" />
          <PolyLive ref={(el) => void (m.polys[i]![0] = el)} poly={kb.blade} fill="brass" />
          <PolyLive ref={(el) => void (m.polys[i]![1] = el)} poly={kb.cross} fill="slate" />
          <PolyLive ref={(el) => void (m.polys[i]![2] = el)} poly={kb.grip} fill="slate" round />
          <LiveSolid paths={g.nearJaw} tone="mid" crease="faint" fill="brass" />
          <LiveSolid paths={g.nearCheek} tone="mid" crease="faint" fill="brass" />
          <path className="cm-pin" d={g.pin} />
          <path ref={(el) => void (m.lamps[i] = el)} className="cm-lamp cm-hidden-lamp" d="" />
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
          <LiveSolid ref={(el) => void (m.rockers[i]![0] = el)} paths={back} tone="mid" crease="faint" fill={ctlFill(t)} />
          <LiveSolid ref={(el) => void (m.rockers[i]![1] = el)} paths={front} tone="mid" crease="faint" fill={ctlFill(t)} />
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
          <Round paths={g.boot} paint={paint} tone="mid" crease="faint" />
          <PolyLive poly={g.dome} fill="boot" round />
          <PolyLive ref={(el) => void (m.stickPolys[i] = el)} poly={parts.shaft} round />
          <path ref={(el) => void (m.sticks[i]![1] = el)} className="cm-ball" d={parts.ball} style={{ fill: `url(#${paint}-ball)` }} />
        </g>
      );
    }
    if (t.ctl.kind === "display" && t.ctl.counter) {
      const i = W.displays.indexOf(t);
      const g = LCD_GEO[i]!;
      const cw = g.w / 4;
      return (
        <g key={t.id} data-ctl={`ctr-${i}`} className="cm-display cm-counter">
          <g className="cm-lcd">
            <RecessArt r={g.recess} id={`${paint}-ctr-${t.id}`} wall={0} />
          </g>
          <g transform={g.at} className="cm-counter-text">
            <path className="cm-counter-cuts" d={[1, 2, 3].map((k) => `M${(k * cw).toFixed(2)} 0V${g.d}`).join("")} />
            <path className="cm-counter-band" d={`M0 ${(g.d * 0.22).toFixed(2)}H${g.w}M0 ${(g.d * 0.78).toFixed(2)}H${g.w}`} />
            <text ref={(el) => void (m.counters[i] = el)} x={g.w / 2} y={g.d * 0.7} fontSize={21} textAnchor="middle" textLength={g.w * 0.86} lengthAdjust="spacing">
              1000
            </text>
          </g>
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
    if (t.ctl.kind === "scope" || t.ctl.kind === "matrix") {
      const isScope = t.ctl.kind === "scope";
      const i = isScope ? W.scopes.indexOf(t) : W.matrices.indexOf(t);
      const g = isScope ? G.SCOPE_GEO[i]! : G.MATRIX_GEO[i]!;
      const clip = `${paint}-glass-${t.id}`;
      return (
        <g key={t.id} className="cm-screen" data-ctl={isScope ? `scope-${i}` : undefined}>
          <RecessArt r={g.recess} id={`${paint}-scr-${t.id}`} wall={0} />
          <g transform={g.at}>
            <clipPath id={clip}>
              <rect width={g.w} height={g.d} rx={4} />
            </clipPath>
            <g clipPath={`url(#${clip})`}>
              {isScope ? (
                <>
                  <path className="cm-grat" d={graticule(g)} />
                  <path ref={(el) => void (m.traces[i] = el)} className="cm-trace" d={scopeTrace(g, 0.7, 2 + (i % 3), i * 0.37, i)} />
                </>
              ) : (
                <>
                  <path className="cm-mx-off" d={matrixDots(g, () => true)} />
                  <path ref={(el) => void (m.matrix[i] = el)} className="cm-mx-on" d="" />
                </>
              )}
              <path className="cm-scanlines" d={Array.from({ length: Math.floor(g.d / 2) }, (_, k) => `M0 ${(k * 2 + 1).toFixed(1)}H${g.w}`).join("")} />
            </g>
            {/* the glass's edge: every grid line and scan line ends on it */}
            <rect className="cm-glass-edge" width={g.w} height={g.d} rx={4} />
          </g>
        </g>
      );
    }
    if (t.ctl.kind === "jacks") {
      const g = G.JACK_GEO[W.jacks.indexOf(t)]!;
      return (
        <g key={t.id} data-ctl={`jack-${W.jacks.indexOf(t)}`} className="cm-jacks">
          {g.posts.map((p, k) => (
            <g key={k} data-post-i={k} data-post={k === 0 ? "hot" : undefined}>
              <Round paths={p.collar} paint={paint} tone="mid" crease="faint" className="cm-collar" />
              <Round paths={p.nut} paint={paint} tone="mid" crease="faint">
                <path className="iso-line" data-tone="lo" d={p.ridges} />
                <path className="iso-line" data-tone="faint" d={p.cap} />
                <path className="cm-hole-dark" d={p.hole} />
              </Round>
            </g>
          ))}
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
          <LiveSolid ref={(el) => void (m.thumbs[i] = el)} paths={switchThumb(g, v)} tone="mid" crease="faint" fill={ctlFill(t)}>
            <path ref={(el) => void (m.thumbGrips[i] = el)} className="iso-line" data-tone="lo" d={switchGrip(g, v)} />
          </LiveSolid>
        </g>
      );
    }
    const i = PRESSABLE.indexOf(t);
    if (i < 0) return null;
    const pg = PRESS_GEO[i]!;
    const p0 = FIRST.presses[i]!;
    if (pg.kind === "type") {
      const letters = ["Q", "W", "E", "R", "A", "S", "D", "F", "Z", "X"];
      return (
        <g key={t.id} data-ctl={`btn-${i}`} className="cm-type">
          {pg.g.keys.map((k, j) => (
            <g key={j}>
              <Round paths={k.stem} paint={paint} tone="mid" crease="faint" />
              <g ref={(el) => void (m.typeCaps[i]![j] = el)}>
                <Round paths={k.cap} paint={paint} tone="mid" crease="faint" fill="cream">
                  <path className="cm-type-rim" d={k.rim} />
                  <text className="cm-type-letter" transform={k.at} fontSize={8} textAnchor="middle" y={2.8}>
                    {letters[(j + i * 4) % letters.length]}
                  </text>
                </Round>
              </g>
            </g>
          ))}
        </g>
      );
    }
    if (pg.kind === "stamp") {
      const g = pg.g;
      return (
        <g key={t.id} data-ctl={`btn-${i}`} className="cm-stamp">
          <LiveSolid paths={g.tin} tone="mid" crease="faint" fill="slate" />
          <path className="cm-ink" d={g.ink} />
          <path className="cm-soft-halo" d={g.halo} />
          <g ref={(el) => void (m.moves[i] = el)}>
            <LiveSolid paths={g.rubber} tone="hi" crease="faint" className="cm-rubber" />
            <LiveSolid paths={g.block} tone="mid" crease="faint" fill="wood" />
            <Round paths={g.handle} paint={paint} tone="mid" crease="faint" fill="wood" />
            <path className="cm-ball cm-wood-ball" d={g.knob} style={{ fill: `url(#${paint}-ball)` }} />
          </g>
        </g>
      );
    }
    if (pg.kind === "drawer") {
      const g = pg.g;
      const split = t.ctl.kind === "drawer" && t.ctl.split;
      const q0 = t.ctl.kind === "drawer" && t.ctl.ajar ? 0.42 : 0;
      return (
        <g key={t.id} data-ctl={`btn-${i}`} className="cm-drawer">
          <path className="cm-soft-halo" d={g.halo} />
          <LiveSolid paths={g.cabinet} tone="mid" crease="faint" fill="wood" />
          {split ? <LiveSolid paths={drawerFront(g, 0, "bottom")} tone="mid" crease="faint" fill="cream" /> : null}
          {split ? (
            <g transform={g.faceBottom}>
              <DrawerFace label={LABELS[(i * 5 + 3) % 6]!} small />
            </g>
          ) : null}
          <LiveSolid ref={(el) => void (m.press[i] = el)} paths={drawerFront(g, q0, split ? "top" : undefined)} tone="mid" crease="faint" fill="cream" />
          {split ? null : (
            <>
              <path ref={(el) => void (m.pressFace[i] = el)} className="cm-tray" d={drawerTray(g, q0).rim} />
              <path ref={(el) => void (m.pressShine[i] = el)} className="cm-cards" d={drawerTray(g, q0).cards} />
            </>
          )}
          <g ref={(el) => void (m.moves[i] = el)} transform={drawerSlide(q0)}>
            <g transform={split ? g.faceTop : g.face}>
              <DrawerFace label={LABELS[(i * 5) % 6]!} small={Boolean(split)} />
            </g>
          </g>
        </g>
      );
    }
    if (pg.kind === "bell") {
      const g = pg.g;
      return (
        <g key={t.id} data-ctl={`btn-${i}`} className="cm-bell">
          <path className="cm-soft-halo" d={g.halo} />
          <Round paths={g.base} paint={paint} tone="mid" crease="faint" fill="wood" />
          <path className="cm-dome" d={g.dome} style={{ fill: `url(#${paint}-ball)` }} />
          <g ref={(el) => void (m.moves[i] = el)}>
            <Round paths={g.plunger} paint={paint} tone="mid" crease="faint" />
            <path className="cm-ball" d={g.knob} style={{ fill: `url(#${paint}-ball)` }} />
          </g>
        </g>
      );
    }
    if (pg.kind === "keys" || pg.kind === "pads") {
      const g = pg.g;
      const pick = FIRST.picks[i]!;
      return (
        <g key={t.id} data-ctl={`btn-${i}`} className={pg.kind === "pads" ? "cm-pads" : "cm-keys"}>
          {g.plans.map((_, j) => (
            <LiveSolid key={j} ref={(el) => void (m.multi[i]![j] = el)} paths={multiCap(g, j, j === pick ? p0 : 0)} tone="mid" crease="faint" className="cm-subkey" fill={subFill(t, j)} />
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
            <path ref={(el) => void (m.pressFace[i] = el)} className="cm-dark" data-fill={ctlFill(t) || undefined} d={discFace(g, p0)} />
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
          <Round ref={(el) => void (m.press[i] = el)} paths={softCushion(g, p0)} paint={paint} tone="mid" crease="faint" fill={ctlFill(t)} />
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
        <LiveSolid ref={(el) => void (m.press[i] = el)} paths={pillKey(g, p0)} tone="mid" crease="faint" fill={ctlFill(t)}>
          <path ref={(el) => void (m.pressFace[i] = el)} className="iso-line" data-tone="faint" d={pillFace(g, p0)} />
        </LiveSolid>
      </g>
    );
  });

    return (
      <>
        <Paints id={paint} />
        <g ref={(el) => void (m.pan = el)}>
          {field ? (
            <>
              {[0, 1, 2, 3].map((g) => (
                <path key={g} ref={(el) => void (m.halos[g] = el)} className="iso-halo cm-halo" />
              ))}
            </>
          ) : null}
          <Tiles
            id={paint}
            world={W}
            halo={!field}
            tile={(i, el) => void (m.tileG[i] = el)}
            hole={(g, k, el) => void (m.holes[g]![k] = el)}
            lamp={(g, el) => void (m.sndLamps[g] = el)}
          />
          <g data-part="controls">
          {controls.map((c, k) => {
            const ti = W.ctlOrder[k]!;
            return c ? (
              <g key={TILES[ti]!.id} ref={(el) => void (m.ctlG[ti] = el)} data-tfill={tileFill(TILES[ti]!) || undefined}>
                {c}
              </g>
            ) : null;
          })}
          </g>
        </g>
      </>
    );
    // the markup is static: the loop writes every change through refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, paint]);

  return (
    <div
      ref={root}
      className="cm-stage"
      data-pan={field && !canPan ? "off" : undefined}
      tabIndex={still ? undefined : 0}
      role={still ? undefined : "group"}
      aria-label={still ? undefined : field && canPan ? FIELD_HINT : HINT}
      onPointerDown={still ? undefined : onPointerDown}
      onPointerMove={still ? undefined : onPointerMove}
      onPointerUp={still ? undefined : onPointerUp}
      onPointerCancel={still ? undefined : onPointerUp}
      onKeyDown={still ? undefined : onKeyDown}
      onKeyUp={still ? undefined : onKeyUp}
    >
      {field ? (
        <div
          ref={layerRef}
          className="cm-layer"
          // STEP larger on the left and the top: placeTiles shifts it by (fine − STEP), so the view is always covered
          style={{ width: `${(100 * (box[2] + STEP_X)) / box[2]}%`, height: `${(100 * (box[3] + STEP_Y)) / box[3]}%` }}
        >
      <svg
        ref={svgRef}
        className={field ? "iso-svg cm-svg cm-svg-field" : "iso-svg cm-svg"}
        viewBox={(field ? [box[0] - STEP_X, box[1] - STEP_Y, box[2] + STEP_X, box[3] + STEP_Y] : box).map((v) => Math.round(v * 10) / 10).join(" ")}
        role="img"
        aria-label={DESCRIPTION}
        aria-hidden={still ? undefined : true}
        focusable="false"
      >
        {art}
      </svg>
        </div>
      ) : (
      <svg
        ref={svgRef}
        className={field ? "iso-svg cm-svg cm-svg-field" : "iso-svg cm-svg"}
        viewBox={(field ? [box[0] - STEP_X, box[1] - STEP_Y, box[2] + STEP_X, box[3] + STEP_Y] : box).map((v) => Math.round(v * 10) / 10).join(" ")}
        style={
          field
            ? {
                // STEP larger on the left and the top: placeTiles shifts it by (fine − STEP), so the view is always covered
                width: `${(100 * (box[2] + STEP_X)) / box[2]}%`,
                height: `${(100 * (box[3] + STEP_Y)) / box[3]}%`,
              }
            : undefined
        }
        role="img"
        aria-label={DESCRIPTION}
        aria-hidden={still ? undefined : true}
        focusable="false"
      >
        {art}
      </svg>
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

/* a drawer's front: a brass label holder with its card, and a cup pull; `small` for a half drawer */
const LABELS = ["A–C", "D–G", "H–L", "M–P", "Q–S", "T–Z"];
function DrawerFace({ label, small = false }: { label: string; small?: boolean }) {
  if (small)
    return (
      <>
        <rect className="cm-holder" x={6} y={1.3} width={13} height={4.6} rx={0.5} />
        <text className="cm-holder-text" x={12.5} y={4.7} fontSize={3} textAnchor="middle">
          {label}
        </text>
        <path className="cm-pull" d="M23.5 3.6a3.6 2.6 0 0 0 7.2 0Z" />
      </>
    );
  return (
    <>
      <rect className="cm-holder" x={11} y={1.6} width={16} height={6.2} rx={0.6} />
      <text className="cm-holder-text" x={19} y={6.2} fontSize={3.6} textAnchor="middle">
        {label}
      </text>
      <path className="cm-pull" d="M14.5 11.2a4.5 3.4 0 0 0 9 0Z" />
    </>
  );
}

/* a convex solid that turns: one path per face (shaded by facing, or a top) and the outline over them */
const PolyLive = React.forwardRef<SVGGElement, { poly: Poly; fill?: string; round?: boolean }>(function PolyLive({ poly, fill, round }, ref) {
  return (
    <g ref={ref} className={round ? "iso-solid cm-poly cm-poly-round" : "iso-solid cm-poly"} data-fill={fill}>
      {poly.faces.map((f, k) => (
        <path key={k} className={f.top ? "iso-top" : "iso-shade"} data-shade={f.top ? undefined : f.shade} d={f.d} />
      ))}
      <path className="iso-line iso-edge" data-tone="mid" d={poly.outline} />
    </g>
  );
});
function writePoly(g: SVGGElement | null, p: Poly) {
  if (!g) return;
  const c = g.children;
  p.faces.forEach((f, k) => {
    const el = c[k];
    if (!el) return;
    if (el.getAttribute("d") !== f.d) el.setAttribute("d", f.d);
    const cls = f.top ? "iso-top" : "iso-shade";
    if (el.getAttribute("class") !== cls) el.setAttribute("class", cls);
    const sh = f.top ? null : String(f.shade);
    if (el.getAttribute("data-shade") !== sh) {
      if (sh === null) el.removeAttribute("data-shade");
      else el.setAttribute("data-shade", sh);
    }
  });
  c[p.faces.length]?.setAttribute("d", p.outline);
}

/* move a jog's dimple: its clip, wall, floor and rim */
function writeDimple(els: (SVGPathElement | null)[], r: { rim: string; floor: string }) {
  els[0]?.setAttribute("d", r.rim);
  els[1]?.setAttribute("d", r.rim);
  els[2]?.setAttribute("d", r.floor);
  els[3]?.setAttribute("d", r.rim);
}

/* the painter's order of a field's tiles and controls as they sit now: each tile at its cell moved by
   (nx, ny) periods. Tiles: a topological sort where a tile wholly behind a near neighbour (smaller x or y,
   their other ranges overlapping, less than two cells apart) goes first, the rest by depth (x + y of the
   middle, the camera's 45°). Controls stand on their tiles, so by the depth of their tile's middle. */
export function placedOrder(W: World, nx: number[], ny: number[]) {
  const n = W.tiles.length;
  const cells = W.tiles.map((t, i) => {
    const sx = (nx[i]! * PERIOD_D) / 2 + (ny[i]! * PERIOD_S) / 2;
    const sy = (-nx[i]! * PERIOD_D) / 2 + (ny[i]! * PERIOD_S) / 2;
    return [t.cell[0] + sx, t.cell[1] + sy, t.cell[2], t.cell[3]] as const;
  });
  const depth = cells.map((c) => c[0] + c[2] / 2 + c[1] + c[3] / 2);
  const indeg = new Array<number>(n).fill(0);
  const next: number[][] = Array.from({ length: n }, () => []);
  for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      const A = cells[a]!;
      const B = cells[b]!;
      const ox = A[0] < B[0] + B[2] - 1e-3 && B[0] < A[0] + A[2] - 1e-3;
      const oy = A[1] < B[1] + B[3] - 1e-3 && B[1] < A[1] + A[3] - 1e-3;
      const gx = B[0] - (A[0] + A[2]);
      const gy = B[1] - (A[1] + A[3]);
      if ((oy && gx > -1e-3 && gx < 2) || (ox && gy > -1e-3 && gy < 2)) {
        next[a]!.push(b);
        indeg[b]!++;
      }
    }
  const done = new Array<boolean>(n).fill(false);
  const tiles: number[] = [];
  for (let k = 0; k < n; k++) {
    let pick = -1;
    for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (pick < 0 || depth[i]! < depth[pick]!)) pick = i;
    if (pick < 0) for (let i = 0; i < n; i++) if (!done[i] && (pick < 0 || depth[i]! < depth[pick]!)) pick = i; // a cycle: by depth
    done[pick] = true;
    tiles.push(pick);
    for (const b of next[pick]!) indeg[b]!--;
  }
  const ctls = W.tiles.map((_, i) => i).sort((a, b) => depth[a]! - depth[b]! || a - b);
  return { tiles, ctls };
}

/* the positions of the longest strictly rising run in a list (patience sorting), as a set of indexes */
function longestRising(xs: number[]) {
  const tails: number[] = [];
  const prev = new Array<number>(xs.length).fill(-1);
  for (let i = 0; i < xs.length; i++) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (xs[tails[mid]!]! < xs[i]!) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[i] = tails[lo - 1]!;
    tails[lo] = i;
  }
  const keep = new Set<number>();
  for (let k = tails.length ? tails[tails.length - 1]! : -1; k >= 0; k = prev[k]!) keep.add(k);
  return keep;
}
