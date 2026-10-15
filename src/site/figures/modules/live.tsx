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
import { useInView, useLoop, spring, type Spring } from "../iso/react/live";
import { IconArt, LiveSolid, Paints, Props, RecessArt, Round, Tiles, grilleOf, writeRound, writeSolid } from "./art";
import {
  CTL_ORDER,
  DOT_BUCKETS,
  discFace,
  discGeo,
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
import { CAPPED, HEIGHT, KNOBS, KNOB_H, P, PRESSABLE, RAD, TILES, WIDTH } from "./view";

export interface ModulesHandle {
  /** Restart the idle sequence from its start (the controls glide there; nothing jumps). */
  run(): void;
}

export const DESCRIPTION =
  "A composition of separate square control tiles butted together on a table, drawn in isometric line work: tall knurled knobs covered in fine dimples (three with coloured caps, one in the accent colour, two standing in wide shallow round recesses on large tiles), dark round buttons sunk in soft rims, soft round buttons printed with a loop, a cassette and a wave icon, a long pill key in a stadium recess, and a speaker grille of round holes; a wire loop and a short jack cable lie beside them. The knobs turn by themselves, the buttons press in turn, the grille ripples with each press and the accent moves from cap to cap.";
const HINT = "Control modules — drag a knob to turn it, click a button or the key; arrow keys turn the lit knob, 1 to 6 press the buttons, Enter restarts";

type Motion = "fun" | "calm" | "still";
function motionOf(node: Element | null): Motion {
  if (typeof window === "undefined") return "fun";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "still";
  const m = node?.closest("[data-rap-motion]")?.getAttribute("data-rap-motion");
  return m === "still" ? "still" : m === "calm" ? "calm" : "fun";
}

const QUIET = 3.6; // seconds after the last touch before the idle life comes back
const ease = (cur: number, target: number, dt: number, tau: number) => cur + (target - cur) * (1 - Math.exp(-dt / tau));

/* the geometry of every control, once */
const KNOB_GEO: KnobGeo[] = KNOBS.map(knobGeo);
const CAP_OF: (number | null)[] = KNOBS.map((k) => (k.ctl.kind === "knob" ? (CAPPED.indexOf(k) >= 0 ? CAPPED.indexOf(k) : null) : null));
type PressGeo = { kind: "disc"; g: DiscGeo } | { kind: "soft"; g: SoftGeo; icon: "loop" | "tape" | "wave" } | { kind: "pill"; g: PillGeo };
const PRESS_GEO: PressGeo[] = PRESSABLE.map((t) =>
  t.ctl.kind === "disc" ? { kind: "disc", g: discGeo(t) } : t.ctl.kind === "soft" ? { kind: "soft", g: softGeo(t), icon: t.ctl.icon } : { kind: "pill", g: pillGeo(t) },
);
const GRILLE_I = TILES.findIndex((t) => t.ctl.kind === "grille");
const GRILLE = grilleOf(GRILLE_I);
const TONES = ["lit", "a", "b"] as const;

interface Nodes {
  dots: (SVGPathElement | null)[][]; // per knob, per bucket
  pointers: (SVGPathElement | null)[];
  tones: (SVGPathElement | null)[][]; // per capped knob: side and top layers per tone (6)
  press: (SVGGElement | null)[]; // the moving solid of each pressable
  pressFace: (SVGPathElement | null)[]; // a disc's face, a cushion's dome ring, a key's face ring
  pressShine: (SVGPathElement | null)[];
  icons: (SVGGElement | null)[];
  holes: (SVGPathElement | null)[];
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
}

function initial(t: number, calm: boolean): State {
  const idle = idleAt(t, calm);
  return {
    t,
    clock: 0,
    held: false,
    touched: 99,
    seq: 1,
    angles: [...idle.angles],
    target: [...idle.angles],
    hand: PRESSABLE.map(() => ({ at: 0, rate: 0 })),
    handHeld: PRESSABLE.map(() => false),
    handAt: [],
  };
}

const FIRST = idleAt(STILL_T, false);

/* where a pointer lands on the plane z, in world x, y */
function toWorld(sx: number, sy: number, z: number): [number, number] {
  const a = (P.azimuth ?? 45) * RAD;
  const e = (P.elevation ?? 30) * RAD;
  const k = P.scale * Math.sqrt(1.6);
  const u = (sx - P.origin[0]) / k;
  const v = ((sy - P.origin[1]) / k + z * Math.cos(e)) / Math.sin(e);
  return [u * Math.sin(a) + v * Math.cos(a), -u * Math.cos(a) + v * Math.sin(a)];
}

export const ModulesLive = React.forwardRef<ModulesHandle, { runKey?: number }>(function ModulesLive({ runKey }, ref) {
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
    holes: [],
    readout: null,
  });
  const st = React.useRef<State>(initial(STILL_T, false));
  const [motion, setMotion] = React.useState<Motion>("fun");
  const visible = useInView(root);
  const said = React.useRef("");

  /* write one frame from the state */
  const draw = React.useCallback((calm: boolean) => {
    const s = st.current;
    const m = n.current;
    const idle = idleAt(s.t, calm);
    for (let i = 0; i < KNOBS.length; i++) {
      const dots = knurlDots(KNOB_GEO[i]!, s.angles[i]!);
      for (let b = 0; b < DOT_BUCKETS; b++) m.dots[i]![b]?.setAttribute("d", dots[b]!);
      m.pointers[i]?.setAttribute("d", knobPointer(KNOB_GEO[i]!, s.angles[i]!));
    }
    for (let j = 0; j < CAPPED.length; j++) {
      const a = layered(idle.tones[j]!);
      for (let k = 0; k < 3; k++) {
        const w = a[k]!.toFixed(3);
        m.tones[j]![k]?.setAttribute("opacity", w);
        m.tones[j]![k + 3]?.setAttribute("opacity", w);
      }
    }
    for (let i = 0; i < PRESSABLE.length; i++) {
      const p = Math.min(1, Math.max(idle.presses[i]! * s.seq, s.hand[i]!.at));
      const pg = PRESS_GEO[i]!;
      if (pg.kind === "disc") {
        m.pressFace[i]?.setAttribute("d", discFace(pg.g, p));
        m.pressShine[i]?.setAttribute("d", discShine(pg.g, p));
      } else if (pg.kind === "soft") {
        writeRound(m.press[i] ?? null, softCushion(pg.g, p));
        m.pressFace[i]?.setAttribute("d", softDome(pg.g, p));
        m.icons[i]?.setAttribute("transform", softDrop(p));
      } else {
        writeSolid(m.press[i] ?? null, pillKey(pg.g, p));
        m.pressFace[i]?.setAttribute("d", pillFace(pg.g, p));
      }
    }
    // the grille: idle ripples plus the ones the hand made
    for (let k = 0; k < GRILLE.radii.length; k++) {
      const r = GRILLE.radii[k]!;
      let v = idle.ripple(r) * s.seq;
      for (const at0 of s.handAt) {
        const age = s.clock - at0;
        const d = (r - age * 46) / 7;
        v += Math.exp(-d * d) * Math.exp(-age / 0.55);
      }
      m.holes[k]?.setAttribute("data-v", "");
      m.holes[k]?.style.setProperty("--v", Math.min(1, v).toFixed(3));
    }
    const active = CAPPED[idle.active]!;
    const ai = KNOBS.indexOf(active);
    const deg = Math.round((((s.angles[ai]! % 360) + 360) % 360));
    const text = `knob ${ai + 1} lit · ${deg}°`;
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
    const idle = idleAt(s.t, calm);
    if (idleOn) for (let i = 0; i < KNOBS.length; i++) s.target[i] = nearest(s.target[i]!, idle.angles[i]!);
    for (let i = 0; i < KNOBS.length; i++) s.angles[i] = ease(s.angles[i]!, s.target[i]!, dt, 0.12);
    for (let i = 0; i < PRESSABLE.length; i++) spring(s.hand[i]!, s.handHeld[i] ? 1 : 0, dt, 900, 26);
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
      st.current = { ...initial(t, Boolean(c)), held: true };
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
  const press = (i: number) => {
    const s = st.current;
    s.handHeld[i] = true;
    s.handAt.push(s.clock);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    const ctl = (e.target as Element).closest("[data-ctl]");
    if (!ctl) return;
    const [kind, idx] = (ctl.getAttribute("data-ctl") ?? "").split("-");
    const i = Number(idx ?? 0);
    const [x, y] = toSvg(e);
    touch();
    if (kind === "btn") press(i);
    drag.current = { kind: kind!, i, id: e.pointerId, last: kind === "knob" ? angleAt(i, x, y) : 0 };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer (synthetic event) */
    }
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || d.kind !== "knob") return;
    const [x, y] = toSvg(e);
    const a = angleAt(d.i, x, y);
    let delta = a - d.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.last = a;
    st.current.target[d.i] = st.current.target[d.i]! + delta;
    touch();
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.kind === "btn") st.current.handHeld[d.i] = false;
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
        if (!heldKeys.current.has(k)) s.handHeld[k - 1] = false;
      }, 120);
      touch();
    } else if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      const active = KNOBS.indexOf(CAPPED[idleAt(s.t, calm).active]!);
      const by = (e.shiftKey ? 45 : 15) * (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1);
      s.target[active] = s.target[active]! + by;
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
        if (!heldKeys.current.has(k)) s.handHeld[k - 1] = false;
      }, 60);
    }
  };

  /* ---------------------------------------------------------- the controls, far to near */
  const m = n.current;
  const controls = CTL_ORDER.map((ti) => {
    const t = TILES[ti]!;
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
    const i = PRESSABLE.indexOf(t);
    if (i < 0) return null;
    const pg = PRESS_GEO[i]!;
    const p0 = FIRST.presses[i]!;
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
        className="iso-svg cm-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={DESCRIPTION}
        aria-hidden={still ? undefined : true}
        focusable="false"
      >
        <Paints id={paint} />
        <Tiles id={paint} hole={(k, el) => void (m.holes[k] = el)} />
        {controls}
        {/* the props lie on the table in front of the field's right-hand edge: nothing stands in front of them */}
        <Props />
      </svg>
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
