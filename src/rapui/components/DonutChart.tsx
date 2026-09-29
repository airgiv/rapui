/* ══ DonutChart ════════════════════════════════════════════
   Shares of one whole — where this month's visits came from — as
   a ring on BalanceChart's card, with the ring's hole doing the
   figure's job: at rest it holds the total and its change against
   last period (ChartFigure + ChartDelta, the same type as every
   other card in the family); point at a segment and it holds that
   segment's count and share instead.

   The ring is drawn the way the line is: thin, round-ended, no
   labels on it, no leader lines. Each segment is a dash on one
   circle (pathLength = 360, so dash lengths ARE degrees) with a
   round cap, and the gap between neighbours is measured in PIXELS
   and converted to degrees at the ring's radius — a gap in degrees
   would be a hairline on a small donut and a canyon on a big one.
   The caps stick out by half the stroke at each end, so that much
   is taken off every dash too; a share too small to hold its own
   caps is drawn as a dot, which is still the right answer to "is
   there any of this?".

   THE DELIGHT is that the ring is a real wheel.
   - It is DRAWN, not faded in: on mount and whenever the data
     changes, one pen goes round from 12 o'clock and each segment
     sweeps out in turn, a touch past its end and back (a 1.22
     overshoot on the curve — enough to feel sprung, never enough
     to be read as a wrong value).
   - Point at a segment and it thickens (16 → 20px) and steps
     outward along its bisector (5px) on the shared spring — it is
     lifted out of the ring toward you, rather than lit up in place.
   - GRAB IT AND SPIN. Drag around the ring and it turns under your
     finger; let go and it coasts with the speed you gave it, and it
     always comes home to 12 o'clock — friction is chosen at release
     so the glide ends where the ring started, going the way you
     threw it (never rewinding). With sound on, every segment
     crossing the top is a notch, pitched by its share, so a spin
     sounds like a prize wheel.
   Sweep, spring and spin are all off under calm / reduced motion:
   the ring is simply there, pointing still lifts a segment (without
   the spring), and the ring does not turn. */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils";
import { useSound } from "../sound";
import { useSpring } from "../hooks/useSpring";
import { isCalm } from "../hooks/useGlide";
import { ChartCard, ChartDelta, ChartFigure } from "./ChartKit";
import "./DonutChart.css";

/* Tones are rap/ui tokens, never hex, so both themes answer. The default order
   leads with ink (the Readymag move: the biggest share is the plainest), then
   the blue/orange signal pair, then the two pastels, and plum last because it
   is the one with the least contrast on the dark card. */
const TONES = {
  ink: "text-ink",
  blue: "text-blue",
  flame: "text-flame",
  sky: "text-sky",
  bubble: "text-bubble",
  plum: "text-plum",
  up: "text-chart-up",
  down: "text-chart-down",
  mute: "text-mute",
} as const;
export type DonutTone = keyof typeof TONES;
const ORDER: DonutTone[] = ["ink", "blue", "flame", "sky", "bubble", "plum"];

export interface DonutDatum {
  label: string;
  value: number;
  tone?: DonutTone;
}

/* ── the demo: where September's visits came from ─────────── */
export const DONUT_DEMO: DonutDatum[] = [
  { label: "Search", value: 18420 },
  { label: "Direct", value: 11236 },
  { label: "Social", value: 8904 },
  { label: "Referral", value: 5712 },
  { label: "Email", value: 3938 },
];

/* the pixels the lifted segment needs: 5 outward + 2 of extra half-stroke + 1 of air */
const LIFT = 5;
const GROW = 4;

export interface DonutChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  data?: DonutDatum[];
  /** What the whole is called; heads the centre at rest (default "Visits"). */
  title?: string;
  /** Change of the total against the previous period; drawn as the delta at rest. */
  change?: number;
  /** Ring diameter in px (default 208). */
  size?: number;
  /** Ring stroke in px, 14–18 reads best (default 16). */
  thickness?: number;
  /** Gap between segments in px, measured along the ring (default 3). */
  gap?: number;
  /** How the centre prints a value (default: grouped whole number). */
  format?: (n: number) => ReactNode;
  /** Card corner in px (default 26). */
  corner?: number;
}

const grouped = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
const norm = (a: number) => ((a % 360) + 360) % 360;
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

export function DonutChart({
  data = DONUT_DEMO,
  title = "Visits",
  change = 3412,
  size = 208,
  thickness = 16,
  gap = 3,
  format,
  corner,
  className,
  "aria-label": ariaLabel,
  ...rest
}: DonutChartProps) {
  const sound = useSound();
  const root = useRef<HTMLDivElement>(null);
  const ringBox = useRef<HTMLDivElement>(null);

  const total = data.reduce((a, d) => a + Math.max(0, d.value), 0);
  const c = size / 2;
  // room for the lifted, thickened segment inside the box
  const r = c - thickness / 2 - LIFT - GROW / 2 - 1;
  const perDeg = (2 * Math.PI * r) / 360;
  const gapDeg = gap / perDeg;
  const capDeg = thickness / 2 / perDeg;

  const segs = useMemo(() => {
    let at = 0;
    const maxShare = Math.max(...data.map((d) => d.value / (total || 1)));
    return data.map((d, i) => {
      const share = Math.max(0, d.value) / (total || 1);
      const sweep = share * 360;
      const s = {
        ...d,
        i,
        share,
        start: at,
        sweep,
        tone: d.tone ?? ORDER[i % ORDER.length],
        rel: share / (maxShare || 1),
      };
      at += sweep;
      return s;
    });
  }, [data, total]);

  // a new data set is a new drawing: the key replays the sweep
  const drawKey = data.map((d) => `${d.label}:${d.value}`).join("|");

  const [sel, setSel] = useState<number | null>(null);
  const selSeg = sel !== null ? segs[sel] : null;

  /* one tick per change of segment, lower for the bigger share — a heavy slice sounds heavy */
  const heard = useRef<number | null>(null);
  useEffect(() => {
    if (sel !== null && sel !== heard.current && segs[sel])
      sound.play("tick", {
        strength: 0.45,
        pitch: Math.pow(1.5, 1 - 2 * segs[sel].rel),
      });
    heard.current = sel;
  }, [sel, segs, sound]);

  /* ── the wheel ──────────────────────────────────────────── */
  const [rot, setRot] = useState(0);
  const rotRef = useRef(0);
  const raf = useRef(0);
  const drag = useRef<{
    a: number;
    x: number;
    y: number;
    on: boolean;
    t: number;
    v: number;
  } | null>(null);
  const topSeg = useRef(-1);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const turn = (to: number) => {
    rotRef.current = to;
    setRot(to);
    // the segment under 12 o'clock, heard as it changes: the prize-wheel ratchet
    const a = norm(-to);
    const k = segs.findIndex((s) => a >= s.start && a < s.start + s.sweep);
    if (k !== topSeg.current && k >= 0) {
      if (topSeg.current >= 0) sound.detent(0.4, { pitch: Math.pow(1.5, 1 - 2 * segs[k].rel) });
      topSeg.current = k;
    }
  };

  const pointerAngle = (e: ReactPointerEvent) => {
    const b = ringBox.current!.getBoundingClientRect();
    const dx = e.clientX - (b.left + b.width / 2);
    const dy = e.clientY - (b.top + b.height / 2);
    return {
      deg: (Math.atan2(dy, dx) * 180) / Math.PI,
      dist: Math.hypot(dx, dy) * (size / (b.width || size)),
    };
  };

  const hit = (e: ReactPointerEvent) => {
    const { deg, dist } = pointerAngle(e);
    if (Math.abs(dist - r) > thickness / 2 + 10) return null;
    const a = norm(deg + 90 - rotRef.current);
    const k = segs.findIndex((s) => a >= s.start && a < s.start + s.sweep);
    return k >= 0 ? k : null;
  };

  /* ── release: coast home ───────────────────────────────────
     A decay d per frame carries a speed v a further v·d/(1−d). We
     pick the first "home" (a whole turn) at or past where the
     natural 0.95 glide would stop, in the direction of the throw,
     and solve d so the glide ends there — capped at 0.975 so no
     glide lasts past ~3s; if the cap bites, a spring (zeta ≈ 0.4,
     one small overshoot) carries it the rest of the way. A slow
     release just springs to the nearest home. */
  const release = (v: number) => {
    cancelAnimationFrame(raf.current);
    const from = rotRef.current;
    let home: number;
    let d = 0.95;
    if (Math.abs(v) < 0.4) home = Math.round(from / 360) * 360;
    else {
      const natural = from + (v * d) / (1 - d);
      home = v > 0 ? Math.ceil(natural / 360) * 360 : Math.floor(natural / 360) * 360;
      d = Math.min(0.975, 1 - Math.abs(v) / (Math.abs(home - from) + Math.abs(v)));
    }
    let vel = v;
    let mode: "coast" | "spring" = Math.abs(v) < 0.4 ? "spring" : "coast";
    let prev = 0;
    const tick = (t: number) => {
      const dt = prev ? Math.min(2.5, (t - prev) / 16.67) : 1;
      prev = t;
      let at = rotRef.current;
      if (mode === "coast") {
        vel *= Math.pow(d, dt);
        at += vel * dt;
        if (Math.abs(vel) < 0.6 || Math.sign(home - at) !== Math.sign(v)) mode = "spring";
      } else {
        vel += (home - at) * 0.07 * dt;
        vel *= Math.pow(0.8, dt);
        at += vel * dt;
        if (Math.abs(home - at) < 0.05 && Math.abs(vel) < 0.05) {
          turn(0); // home is a whole turn: start again from 0 so the number stays small
          raf.current = 0;
          return;
        }
      }
      turn(at);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isCalm(root.current) || hit(e) === null) return;
    cancelAnimationFrame(raf.current);
    drag.current = {
      a: pointerAngle(e).deg,
      x: e.clientX,
      y: e.clientY,
      on: false,
      t: performance.now(),
      v: 0,
    };
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (g) {
      if (!g.on && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 5) {
        g.on = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setSel(null);
        topSeg.current = -1;
      }
      if (g.on) {
        const now = performance.now();
        const a = pointerAngle(e).deg;
        const da = wrap(a - g.a);
        const frames = Math.max(0.25, (now - g.t) / 16.67);
        // velocity in degrees per frame, smoothed so the last jittery sample does not decide the throw
        g.v = g.v * 0.6 + (da / frames) * 0.4;
        g.a = a;
        g.t = now;
        turn(rotRef.current + da);
        return;
      }
    }
    setSel(hit(e));
  };

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    drag.current = null;
    if (!g) return;
    if (g.on) {
      // a pause before letting go is a stop, not a throw
      release(performance.now() - g.t > 80 ? 0 : Math.max(-24, Math.min(24, g.v)));
    } else setSel(hit(e));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = segs.length;
    let to: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") to = sel === null ? 0 : (sel + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = sel === null ? n - 1 : (sel - 1 + n) % n;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = n - 1;
    else if (e.key === "Escape") to = null;
    else return;
    e.preventDefault();
    setSel(to);
  };

  const fmt = format ?? grouped;
  const pct = total - change ? (change / (total - change)) * 100 : undefined;

  return (
    <ChartCard ref={root} corner={corner} data-slot="donut-chart" className={cn("pt-4", className)} {...rest}>
      <div
        ref={ringBox}
        data-slot="donut-ring"
        role="group"
        tabIndex={0}
        aria-label={ariaLabel ?? `${title}: ${segs.length} segments. Arrow keys read each one.`}
        onKeyDown={onKey}
        onBlur={() => setSel(null)}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={() => !drag.current?.on && setSel(null)}
        className={cn(
          "relative mx-auto rounded-full touch-none",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        )}
        style={{
          width: size,
          height: size,
          cursor: sel !== null ? "grab" : undefined,
        }}
      >
        <svg
          data-slot="donut-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block overflow-visible"
          aria-hidden
        >
          <g key={drawKey} transform={`rotate(${rot.toFixed(2)} ${c} ${c})`}>
            {segs.map((s) => (
              <Arc
                key={s.i}
                c={c}
                r={r}
                thickness={thickness}
                start={s.start}
                sweep={s.sweep}
                gapDeg={gapDeg}
                capDeg={capDeg}
                tone={TONES[s.tone]}
                on={sel === s.i}
                dim={sel !== null && sel !== s.i}
              />
            ))}
          </g>
        </svg>

        {/* the hole holds the figure; it never takes the pointer, the ring does */}
        <div
          data-slot="donut-centre"
          className="absolute inset-0 grid place-content-center justify-items-center text-center pointer-events-none"
        >
          <p className="m-0 mb-2 text-[12.5px] font-medium tracking-[-0.01em] text-ink/42">
            {selSeg ? selSeg.label : title}
          </p>
          {format ? (
            <p className="m-0 text-[33px] leading-none font-medium tracking-[-0.03em] tabular-nums">
              {fmt(selSeg ? selSeg.value : total)}
            </p>
          ) : (
            <ChartFigure value={selSeg ? selSeg.value : total} />
          )}
          {selSeg ? (
            <p
              data-slot="donut-share"
              className={cn("mt-[9px] mb-0 text-[12.5px] font-medium tabular-nums", TONES[selSeg.tone])}
            >
              {(selSeg.share * 100).toFixed(1)}%
            </p>
          ) : (
            <ChartDelta change={change} pct={pct} className="justify-center" />
          )}
        </div>
      </div>

      <span className="sr-only" aria-live="polite">
        {selSeg ? `${selSeg.label}: ${fmt(selSeg.value)}, ${(selSeg.share * 100).toFixed(1)}%` : ""}
      </span>

      {/* the legend: a dot of the segment's colour and its name; the one being read
          sits on the ink/7 pill the tabs use, the rest step back */}
      <ul data-slot="donut-legend" className="m-0 mt-4 p-0 list-none flex flex-wrap justify-center gap-1">
        {segs.map((s) => (
          <li key={s.i}>
            <button
              type="button"
              data-slot="donut-legend-item"
              data-on={sel === s.i || undefined}
              onPointerEnter={() => setSel(s.i)}
              onPointerLeave={() => setSel(null)}
              onFocus={() => setSel(s.i)}
              onBlur={() => setSel(null)}
              className={cn(
                "flex items-center gap-1.5 h-7 px-2.5 rounded-pill border-0 bg-transparent cursor-default",
                "text-[12.5px] font-medium tracking-[0.01em] text-ink/55 data-on:text-ink data-on:bg-ink/7",
                "transition-[background-color,color] duration-200",
                "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
              )}
            >
              <i aria-hidden className={cn("size-[7px] rounded-full bg-current", TONES[s.tone])} />
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

/* ── one segment ──────────────────────────────────────────────
   A dash on a full circle (pathLength 360: dash lengths in degrees),
   turned to its start. Its own spring, so a segment that is let go
   sinks back while the next one rises — two things moving at once
   is what makes it read as a hand moving between them. */
function Arc({
  c,
  r,
  thickness,
  start,
  sweep,
  gapDeg,
  capDeg,
  tone,
  on,
  dim,
}: {
  c: number;
  r: number;
  thickness: number;
  start: number;
  sweep: number;
  gapDeg: number;
  capDeg: number;
  tone: string;
  on: boolean;
  dim: boolean;
}) {
  const ref = useRef<SVGGElement>(null);
  // 0..100 (pixels-or-percent units, see useSpring), tune 60: one friendly overshoot
  const lift = useSpring(on ? 100 : 0, 60, isCalm(ref.current)) / 100;
  const dash = Math.max(0.001, sweep - gapDeg - capDeg * 2);
  const mid = ((start + sweep / 2 - 90) * Math.PI) / 180;
  const dx = Math.cos(mid) * LIFT * lift;
  const dy = Math.sin(mid) * LIFT * lift;
  /* the pen goes round once in ~0.9s: each segment starts when the pen
     reaches it and takes as long as its sweep needs, never under 280ms */
  const delay = (start / 360) * 720;
  const dur = Math.max(280, (sweep / 360) * 900 + 220);
  return (
    <g
      ref={ref}
      data-slot="donut-segment"
      data-on={on || undefined}
      transform={`translate(${dx.toFixed(2)} ${dy.toFixed(2)})`}
    >
      <circle
        cx={c}
        cy={c}
        r={r}
        pathLength={360}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={thickness + GROW * lift}
        strokeDasharray={`${dash.toFixed(3)} ${(360 - dash).toFixed(3)}`}
        transform={`rotate(${(start - 90 + gapDeg / 2 + capDeg).toFixed(3)} ${c} ${c})`}
        className={cn(
          tone,
          "transition-opacity duration-200",
          dim && "opacity-35",
          "fun:animate-[rap-donut-sweep_600ms_cubic-bezier(0.3,1.22,0.5,1)_both]",
        )}
        style={
          {
            animationDelay: `${delay.toFixed(0)}ms`,
            animationDuration: `${dur.toFixed(0)}ms`,
          } as CSSProperties
        }
      />
    </g>
  );
}
