/* The live rapui OP: places the static art and the moving controls in
   painter's order, runs one time-based loop and writes attributes through refs
   (no re-render per frame). Idle, it plays its six-step pattern; pointer and
   keyboard take over (press a key, drag an encoder or the fader, flip the
   switch) and the pattern comes back 3.6 s after the last touch. Stops
   offscreen; one composed still under reduced motion or an ancestor with
   data-rap-motion="still"; smaller, slower sweeps under data-rap-motion="calm". */
import * as React from "react";
import { axisVector, type SolidPaths } from "../iso/iso-kit";
import { useInView, useLoop, spring, type Spring } from "../iso/react/live";
import { Body, LiveSolid, Prints, ScreenFrame, writeSolid } from "./art";
import {
  GLASS_D,
  GLASS_R,
  GLASS_W,
  KEY_LABEL_AT,
  KEY_WORDS,
  KEY_WORD_AT,
  LEDS,
  RAISED_ORDER,
  SCREEN_AT,
  TRACE_MID,
  faderCap,
  faderGrip,
  FADER_TRAVEL,
  keyCap,
  keyDrop,
  knobCap,
  knobHub,
  knobPointer,
  knobRidges,
  knobSkirt,
  KNOB_FACE,
  pillGrip,
  switchPill,
  trace,
} from "./geometry";
import { LOOP, STILL_T, bpmOf, idleAt, knobDeg } from "./model";
import { ACCENT, FADER, HEIGHT, KEY_N, KNOB_X, P, WIDTH, Z, at } from "./view";

export interface OPHandle {
  /** Restart the pattern from its first step (the controls glide there; nothing jumps). */
  run(): void;
}

export const DESCRIPTION =
  "A flat, light grey pocket instrument lying on the table, in the manner of a Teenage Engineering synth: a row of six square keys along the front edge, three round encoders (the middle one, tempo, in the accent colour), a long fader, a sliding dry/wet switch, a small screen with the tempo and a waveform, and a speaker grille of dots. Its keys press themselves in turn like a step sequencer while the tempo encoder turns and the fader glides.";
const HINT = "rapui OP — press keys 1 to 6, turn the tempo encoder with the arrow keys, Space flips the switch; drag the encoders and the fader";

type Motion = "fun" | "calm" | "still";
function motionOf(node: Element | null): Motion {
  if (typeof window === "undefined") return "fun";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "still";
  const m = node?.closest("[data-rap-motion]")?.getAttribute("data-rap-motion");
  return m === "still" ? "still" : m === "calm" ? "calm" : "fun";
}

const QUIET = 3.6; // seconds after the last touch before the pattern comes back
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (cur: number, target: number, dt: number, tau: number) => cur + (target - cur) * (1 - Math.exp(-dt / tau));

interface Nodes {
  keys: (SVGGElement | null)[];
  keyLabels: (SVGGElement | null)[];
  leds: (SVGPathElement | null)[];
  ridges: (SVGPathElement | null)[];
  pointers: (SVGPathElement | null)[];
  cap: SVGGElement | null;
  grip: SVGPathElement | null;
  pill: SVGGElement | null;
  pillGrip: SVGPathElement | null;
  trace: SVGPathElement | null;
  bpm: SVGTextElement | null;
  steps: (SVGRectElement | null)[];
  readout: Element | null;
}

interface State {
  t: number; // the pattern clock
  held: boolean; // a seek holds the clock
  touched: number; // seconds since the last touch (large = idle)
  seq: number; // how much the pattern drives the keys (eases 0 ↔ 1)
  keys: Spring[]; // hand presses
  keyHeld: boolean[];
  knobs: number[]; // shown values 0..1
  knobTarget: number[];
  fader: number;
  faderTarget: number;
  pill: Spring; // 0 dry, 1 wet
  on: boolean;
  lastIdleOn: boolean;
  phase: number; // the trace's phase, turns
}

function initial(t: number, calm: boolean): State {
  const idle = idleAt(t, calm);
  const knobs = KNOB_X.map((_, i) => (i === ACCENT ? idle.knob : i === 0 ? 0.38 : 0.7));
  return {
    t,
    held: false,
    touched: 99,
    seq: 1,
    keys: Array.from({ length: KEY_N }, () => ({ at: 0, rate: 0 })),
    keyHeld: Array.from({ length: KEY_N }, () => false),
    knobs,
    knobTarget: [...knobs],
    fader: idle.fader,
    faderTarget: idle.fader,
    pill: { at: idle.on ? 1 : 0, rate: 0 },
    on: idle.on,
    lastIdleOn: idle.on,
    phase: t * 0.32,
  };
}

const FIRST = initial(STILL_T, false);
const FIRST_IDLE = idleAt(STILL_T, false);
const KEY0 = FIRST_IDLE.keys.map((p, i) => keyCap(i, p));
const STEP_W = 9.4;
const STEP_GAP = 3.2;
const STEPS_X0 = (GLASS_W - KEY_N * STEP_W - (KEY_N - 1) * STEP_GAP) / 2;

export const OPLive = React.forwardRef<OPHandle, { runKey?: number }>(function OPLive({ runKey }, ref) {
  const root = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const n = React.useRef<Nodes>({
    keys: [],
    keyLabels: [],
    leds: [],
    ridges: [],
    pointers: [],
    cap: null,
    grip: null,
    pill: null,
    pillGrip: null,
    trace: null,
    bpm: null,
    steps: [],
    readout: null,
  });
  const st = React.useRef<State>(initial(STILL_T, false));
  const [motion, setMotion] = React.useState<Motion>("fun");
  const visible = useInView(root);
  const said = React.useRef("");
  const shownBpm = React.useRef(-1);

  /* write one frame from the state (the idle part comes from the pattern at s.t) */
  const draw = React.useCallback((calm: boolean) => {
    const s = st.current;
    const m = n.current;
    const idle = idleAt(s.t, calm);
    for (let i = 0; i < KEY_N; i++) {
      const press = Math.min(1, Math.max(idle.keys[i]! * s.seq, s.keys[i]!.at));
      writeSolid(m.keys[i] ?? null, keyCap(i, press));
      m.keyLabels[i]?.setAttribute("transform", keyDrop(press));
      m.leds[i]?.toggleAttribute("data-on", press > 0.3);
    }
    for (let i = 0; i < KNOB_X.length; i++) {
      const deg = knobDeg(s.knobs[i]!);
      m.ridges[i]?.setAttribute("d", knobRidges(i, deg));
      m.pointers[i]?.setAttribute("d", knobPointer(i, deg));
    }
    writeSolid(m.cap, faderCap(s.fader));
    m.grip?.setAttribute("d", faderGrip(s.fader));
    const pv = Math.min(1, Math.max(0, s.pill.at));
    writeSolid(m.pill, switchPill(pv));
    m.pillGrip?.setAttribute("d", pillGrip(pv));
    // the screen: tempo, the trace, the step lights
    const kick = idle.kick * s.seq;
    const amp = (0.35 + 0.65 * s.fader) * (0.62 + 0.38 * kick);
    m.trace?.setAttribute("d", trace(amp, 1.2 + 2.2 * s.knobs[ACCENT]!, s.phase, pv));
    const bpm = bpmOf(s.knobs[ACCENT]!);
    if (bpm !== shownBpm.current && m.bpm) {
      shownBpm.current = bpm;
      m.bpm.textContent = String(bpm);
    }
    for (let i = 0; i < KEY_N; i++) m.steps[i]?.toggleAttribute("data-on", s.seq > 0.5 ? i === idle.step : s.keys[i]!.at > 0.3);
    const text = `step ${idle.step + 1} · ${bpm} bpm · ${s.on ? "wet" : "dry"}`;
    if (text !== said.current) {
      said.current = text;
      m.readout ??= root.current?.closest(".iso-plate")?.querySelector("[data-readout]") ?? null;
      if (m.readout) m.readout.textContent = text;
    }
  }, []);

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
      st.current = initial(STILL_T, false);
      draw(false);
    }
  }, [still, draw]);

  const kick = useLoop((dt, reduced) => {
    if (reduced || still) return false;
    const s = st.current;
    if (!s.held) s.t += dt;
    if (s.t > LOOP * 4000) s.t -= LOOP * 4000; // keep the clock small, same phase
    s.touched += dt;
    const idleOn = s.touched > QUIET;
    s.seq = ease(s.seq, idleOn ? 1 : 0, dt, 0.25);
    const idle = idleAt(s.t, calm);
    if (idleOn) {
      s.knobTarget[ACCENT] = idle.knob;
      s.faderTarget = idle.fader;
      // the switch follows the pattern only when the pattern flips it
      if (idle.on !== s.lastIdleOn) s.on = idle.on;
    }
    s.lastIdleOn = idle.on;
    for (let i = 0; i < KEY_N; i++) spring(s.keys[i]!, s.keyHeld[i] ? 1 : 0, dt, 900, 26);
    for (let i = 0; i < KNOB_X.length; i++) s.knobs[i] = ease(s.knobs[i]!, s.knobTarget[i]!, dt, 0.14);
    s.fader = ease(s.fader, s.faderTarget, dt, 0.16);
    spring(s.pill, s.on ? 1 : 0, dt, 420, 24);
    s.phase += dt * (calm ? 0.18 : 0.32);
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

  // a seek hook for visual checks: dispatch "op-seek" with { t } to hold a moment, { t: -1 } to let go
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
      st.current = { ...initial(t, Boolean(c)), held: true };
      draw(Boolean(c));
    };
    node.addEventListener("op-seek", seek);
    return () => node.removeEventListener("op-seek", seek);
  }, [draw, kick]);

  /* ---------------------------------------------------------- pointer */
  const drag = React.useRef<{ kind: string; i: number; id: number; x0: number; y0: number; v0: number } | null>(null);
  const toSvg = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return [0, 0] as const;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return [p.x, p.y] as const;
  };
  const faderAt = (x: number, y: number) => {
    const ax = axisVector(P, [1, 0, 0]);
    const [bx, by] = at([0, FADER.y, Z]);
    const wx = ((x - bx) * ax[0] + (y - by) * ax[1]) / (ax[0] ** 2 + ax[1] ** 2);
    return (wx - FADER_TRAVEL[0]) / (FADER_TRAVEL[1] - FADER_TRAVEL[0]);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    const ctl = (e.target as Element).closest("[data-ctl]");
    if (!ctl) return;
    const [kind, idx] = (ctl.getAttribute("data-ctl") ?? "").split("-");
    const i = Number(idx ?? 0);
    const s = st.current;
    const [x, y] = toSvg(e);
    touch();
    if (kind === "switch") {
      s.on = !s.on;
      return;
    }
    let v0 = 0;
    if (kind === "key") s.keyHeld[i] = true;
    else if (kind === "knob") v0 = s.knobTarget[i]!;
    else if (kind === "fader") v0 = s.faderTarget - faderAt(x, y); // grab offset: the cap doesn't jump to the pointer
    drag.current = { kind: kind!, i, id: e.pointerId, x0: x, y0: y, v0 };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer (synthetic event) */
    }
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const s = st.current;
    const [x, y] = toSvg(e);
    if (d.kind === "knob") {
      s.knobTarget[d.i] = clamp01(d.v0 + (x - d.x0 - (y - d.y0)) / 150);
      touch();
    } else if (d.kind === "fader") {
      s.faderTarget = clamp01(d.v0 + faderAt(x, y));
      touch();
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.kind === "key") st.current.keyHeld[d.i] = false;
    drag.current = null;
    touch();
  };

  /* ---------------------------------------------------------- keyboard */
  const onKeyDown = (e: React.KeyboardEvent) => {
    const s = st.current;
    const k = Number(e.key);
    if (Number.isInteger(k) && k >= 1 && k <= KEY_N) {
      e.preventDefault();
      s.keyHeld[k - 1] = true;
      // a quick tap still shows a whole press
      window.setTimeout(() => {
        if (!heldKeys.current.has(k)) s.keyHeld[k - 1] = false;
      }, 110);
      heldKeys.current.add(k);
      touch();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const by = (e.shiftKey ? 3 : 1) / 18;
      s.knobTarget[ACCENT] = clamp01(s.knobTarget[ACCENT]! + (e.key === "ArrowRight" || e.key === "ArrowUp" ? by : -by));
      touch();
    } else if (e.key === " ") {
      e.preventDefault();
      s.on = !s.on;
      touch();
    } else if (e.key === "Enter") {
      e.preventDefault();
      run();
    }
  };
  const heldKeys = React.useRef(new Set<number>());
  const onKeyUp = (e: React.KeyboardEvent) => {
    const k = Number(e.key);
    if (Number.isInteger(k) && k >= 1 && k <= KEY_N) {
      heldKeys.current.delete(k);
      const s = st.current;
      window.setTimeout(() => {
        if (!heldKeys.current.has(k)) s.keyHeld[k - 1] = false;
      }, 60);
    }
  };

  const m = n.current;
  const raised = RAISED_ORDER.map(({ kind, i }) => {
    if (kind === "knob") {
      const deg = knobDeg(FIRST.knobs[i]!);
      return (
        <g key={`knob-${i}`} data-ctl={`knob-${i}`} className="op-knob">
          <LiveSolid paths={knobSkirt(i)} tone="mid" crease="faint" />
          <LiveSolid paths={knobCap(i)} tone="hi" crease="lo" lit={i === ACCENT}>
            <path className="iso-line" data-tone="faint" d={KNOB_FACE[i]} />
            <path ref={(el) => void (m.ridges[i] = el)} className="iso-line op-ridges" data-tone={i === ACCENT ? "mid" : "lo"} d={knobRidges(i, deg)} />
            <path ref={(el) => void (m.pointers[i] = el)} className="iso-line op-pointer" data-tone={i === ACCENT ? "lit" : "hi"} data-free="start" d={knobPointer(i, deg)} />
            <path className="op-hub" d={knobHub(i)} />
          </LiveSolid>
        </g>
      );
    }
    if (kind === "fader") {
      return (
        <g key="fader" data-ctl="fader" className="op-fader">
          <LiveSolid ref={(el) => void (m.cap = el)} paths={faderCap(FIRST.fader)} tone="hi" crease="lo">
            <path ref={(el) => void (m.grip = el)} className="iso-line" data-tone="mid" d={faderGrip(FIRST.fader)} />
          </LiveSolid>
        </g>
      );
    }
    if (kind === "pill") {
      const pv = FIRST.pill.at;
      return (
        <g key="pill" data-ctl="switch" className="op-switch">
          <LiveSolid ref={(el) => void (m.pill = el)} paths={switchPill(pv)} tone="hi" crease="lo">
            <path ref={(el) => void (m.pillGrip = el)} className="iso-line" data-tone="lo" d={pillGrip(pv)} />
          </LiveSolid>
        </g>
      );
    }
    const p0 = FIRST_IDLE.keys[i]!;
    return (
      <g key={`key-${i}`} data-ctl={`key-${i}`} className="op-key">
        <LiveSolid ref={(el) => void (m.keys[i] = el)} paths={KEY0[i] as SolidPaths} tone="hi" crease="lo" />
        <g ref={(el) => void (m.keyLabels[i] = el)} transform={keyDrop(p0)}>
          <text className="iso-face-text op-key-num" data-tone="hi" transform={KEY_LABEL_AT[i]} fontSize={7}>
            {i + 1}
          </text>
          <text className="iso-face-text" data-tone="lo" transform={KEY_WORD_AT[i]} fontSize={3.9} textAnchor="end">
            {KEY_WORDS[i]}
          </text>
        </g>
      </g>
    );
  });

  return (
    <div
      ref={root}
      className="op-stage"
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
        className="iso-svg op-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={DESCRIPTION}
        aria-hidden={still ? undefined : true}
        focusable="false"
      >
        <defs>
          <clipPath id="op-glass-clip">
            <rect x={0} y={0} width={GLASS_W} height={GLASS_D} rx={GLASS_R} />
          </clipPath>
        </defs>
        <Body />
        <ScreenFrame />
        {/* the picture, in the glass's own plane */}
        <g transform={SCREEN_AT} className="op-screen">
          <g clipPath="url(#op-glass-clip)">
            <text ref={(el) => void (m.bpm = el)} className="op-digits" x={33} y={14.8} fontSize={11.5} textAnchor="end">
              {bpmOf(FIRST.knobs[ACCENT]!)}
            </text>
            <text className="op-unit" x={35.5} y={14.8} fontSize={4.6}>
              bpm
            </text>
            <path className="op-mid" d={`M0 ${TRACE_MID}H${GLASS_W}`} />
            <path ref={(el) => void (m.trace = el)} className="op-trace" d={trace(0.6, 2.3, FIRST.phase, FIRST.pill.at)} />
            {Array.from({ length: KEY_N }, (_, i) => (
              <rect
                key={i}
                ref={(el) => void (m.steps[i] = el)}
                className="op-step"
                x={STEPS_X0 + i * (STEP_W + STEP_GAP)}
                y={41.6}
                width={STEP_W}
                height={4.2}
                rx={0.8}
                data-on={i === FIRST_IDLE.step ? "" : undefined}
              />
            ))}
          </g>
        </g>
        <Prints />
        {LEDS.map((d, i) => (
          <path key={`led-${i}`} ref={(el) => void (m.leds[i] = el)} className="op-led" d={d} data-on={FIRST_IDLE.keys[i]! > 0.3 ? "" : undefined} />
        ))}
        {raised}
      </svg>
    </div>
  );
});
