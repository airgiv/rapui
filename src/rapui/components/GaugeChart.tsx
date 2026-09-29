/* ══ GaugeChart ═════════════════════════════════════════════
   One reading against its range, as an arc of ticks — the same
   tick language as RangeDial and ProgressTicks, set in a
   ChartCard so it sits beside BalanceChart as one family.

   THE DELIGHT: a ring that rides the arc on an UNDER-DAMPED
   spring. Give the gauge a new value and the ring runs past it,
   comes back, and settles — the one physical thing a needle does
   that a fill never can. The ticks it passes are lit as it
   arrives, drawn in one after another (the RangeDial wave), so a
   jump from 40 to 80 reads as travel, not as a switch. The
   figure in the middle counts to the value on a heavier spring,
   so the number never overshoots: the ring may swing, the
   reading does not lie.

   The numbers, and why:
   - 240° of arc, not 180: the feet come round under the figure
     and hold it, so the centre reads as the gauge's face rather
     than as text under a rainbow; the open 120° at the bottom is
     where the change line sits.
   - 49 ticks: 5° apart, 48 steps, divisible by 4 — so the quarter
     marks land on real ticks at every quarter, not "near" one.
   - lengths 9 / 13, quarters 14 / 16: the lit ticks are longer
     than the unlit by a step the eye can see, and the quarters
     only a hair longer again — the value is the subject, the
     quarters are only where you are.
   - 0.24 unlit / 0.9 lit ink: RangeDial's pair, measured on the
     white card (an unlit tick at 0.13 simply is not there).
   - stroke 1.44 viewBox units ≈ 2.1px at the drawn size: the
     same weight as the BalanceChart line.
   - spring tune 92 for the ring (two small rebounds), 28 for the
     figure (lands without a bounce). Both drop to instant under
     calm or reduced motion.
   - the wave: 14ms per tick from where the lit run USED to end,
     so the draw starts at the old value and runs to the new one.

   Sound: a detent per tick crossed while dragging, pitched from
   ×0.75 at the start of the arc to ×1.5 at the end, firmer on a
   quarter — so dragging round the arc is a rising scale. */
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils";
import { useSound } from "../sound";
import { useSpring } from "../hooks/useSpring";
import { isCalm } from "../hooks/useGlide";
import { ChartCard, ChartDelta, ChartFigure } from "./ChartKit";
import "./GaugeChart.css";

export type GaugeTone = "up" | "down" | "warn";

export interface GaugeZone {
  /** Upper edge of the zone, in the gauge's units (inclusive). */
  to: number;
  tone: GaugeTone;
}

export interface GaugeChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "prefix"> {
  /** Controlled value. */
  value?: number;
  /** Starting value when uncontrolled. */
  defaultValue?: number;
  /** Called with the new value while dragging or on a key press. */
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** Snap step for drag and keys. */
  step?: number;
  /** Colour bands for the lit ticks, in ascending `to` order. */
  zones?: GaugeZone[];
  /** The quiet line above the figure. */
  label?: ReactNode;
  /** After the figure, at the quiet size. */
  unit?: ReactNode;
  /** Last period's reading: the change line shows value − previous. */
  previous?: number;
  /** The quiet half of the change line. */
  when?: ReactNode;
  /** How many ticks on the arc (keep it 4n+1 so the quarters land on ticks). */
  ticks?: number;
  /** No dragging or keys: a read-out only. */
  readOnly?: boolean;
  /** Card corner, as ChartCard. */
  corner?: number;
}

const SWEEP = 240;
const START = 90 + (360 - SWEEP) / 2; // 150°: bottom-left, clockwise through the top
const CX = 100;
const CY = 100;
const R = 74; // where the ticks stand
const W = 1.44; // ≈ 2.1px at the drawn 240px

const TONE: Record<GaugeTone, string> = {
  up: "text-chart-up",
  down: "text-chart-down",
  warn: "text-warning",
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (d: number) => (d * Math.PI) / 180;

export const GaugeChart = forwardRef<HTMLDivElement, GaugeChartProps>(function GaugeChart(
  {
    value,
    defaultValue = 72,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    zones,
    label,
    unit,
    previous,
    when,
    ticks = 49,
    readOnly = false,
    corner,
    className,
    ...rest
  },
  ref,
) {
  const [own, setOwn] = useState(defaultValue);
  const raw = clamp(value ?? own, min, max);
  const span = max - min || 1;
  const frac = (raw - min) / span;
  const n = Math.max(5, Math.round(ticks));
  const lit = frac > 0 ? Math.floor(frac * (n - 1) + 1e-6) + 1 : 0;

  const sound = useSound();
  const arc = useRef<HTMLDivElement | null>(null);
  const [grab, setGrab] = useState(false);
  const calm = isCalm(arc.current);

  /* the ring swings, the figure only counts: two springs on one
     target, in 0..100 so the spring's absolute snap is fine-grained */
  const ring = useSpring(frac * 100, 92, calm) / 100;
  const shown = useSpring(raw, 28, calm);

  /* where the lit run ended LAST render — the wave starts there
     (0 on mount, so the gauge draws itself in from the start) */
  const was = useRef(0);
  useEffect(() => {
    was.current = lit;
  }, [lit]);

  const heard = useRef(-1);
  const set = (v: number, from: "drag" | "key") => {
    const next = clamp(Math.round((v - min) / step) * step + min, min, max);
    if (next === raw) return;
    const i = Math.round(((next - min) / span) * (n - 1));
    if (from === "key" || i !== heard.current) {
      heard.current = i;
      const quarter = (i * 4) % (n - 1) === 0;
      sound.detent(quarter ? 0.8 : 0.5, { pitch: 0.75 + (i / (n - 1)) * 0.75 });
    }
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };

  /* the pointer as an angle round the centre, then a fraction of
     the sweep; the dead 120° at the bottom goes to the nearer end */
  const fromPointer = (e: ReactPointerEvent) => {
    const b = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * VB.w + VB.x - CX;
    const y = ((e.clientY - b.top) / b.height) * VB.h + VB.y - CY;
    let rel = ((Math.atan2(y, x) * 180) / Math.PI - START + 720) % 360;
    if (rel > SWEEP) rel = rel > SWEEP + (360 - SWEEP) / 2 ? 0 : SWEEP;
    return min + (rel / SWEEP) * span;
  };

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (readOnly) return;
    setGrab(true);
    sound.play("tap", { strength: 0.5 });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a scripted pointer is not live */
    }
    set(fromPointer(e), "drag");
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (grab) set(fromPointer(e), "drag");
  };
  const up = () => {
    setGrab(false);
    heard.current = -1;
  };

  const key = (e: ReactKeyboardEvent) => {
    if (readOnly) return;
    const big = Math.max(step, span / 10);
    const to =
      e.key === "ArrowRight" || e.key === "ArrowUp" ? raw + step
      : e.key === "ArrowLeft" || e.key === "ArrowDown" ? raw - step
      : e.key === "PageUp" ? raw + big
      : e.key === "PageDown" ? raw - big
      : e.key === "Home" ? min
      : e.key === "End" ? max
      : null;
    if (to === null) return;
    e.preventDefault();
    set(to, "key");
  };

  const toneAt = (v: number): string | null => {
    if (!zones?.length) return null;
    const z = zones.find((z) => v <= z.to) ?? zones[zones.length - 1];
    return TONE[z.tone];
  };

  /* the ring: just inside the ticks, on the swinging spring */
  const ringA = rad(START + clamp(ring, -0.04, 1.04) * SWEEP);
  const ringR = R - 7;
  const ringTone = toneAt(raw) ?? "text-ink";
  const labelId = useId();

  return (
    <ChartCard ref={ref} corner={corner} data-slot="gauge-chart" className={cn("w-full max-w-80 pb-4", className)} {...rest}>
      <div
        ref={arc}
        data-slot="gauge-chart-arc"
        data-dragging={grab || undefined}
        role={readOnly ? "meter" : "slider"}
        tabIndex={readOnly ? undefined : 0}
        aria-labelledby={label != null ? labelId : undefined}
        aria-label={label == null ? "Gauge" : undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={raw}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onLostPointerCapture={up}
        onKeyDown={key}
        className={cn(
          "relative mx-auto w-60 max-w-full touch-none rounded-[20px]",
          !readOnly && "cursor-grab data-dragging:cursor-grabbing",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4",
        )}
      >
        <svg
          viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
          className="block w-full h-auto overflow-visible"
          aria-hidden
        >
          {Array.from({ length: n }, (_, i) => {
            const on = i < lit;
            const quarter = (i * 4) % (n - 1) === 0;
            const len = quarter ? (on ? 16 : 14) : on ? 13 : 9;
            const a = rad(START + (i / (n - 1)) * SWEEP);
            const c = Math.cos(a);
            const s = Math.sin(a);
            const tone = on ? toneAt(min + (i / (n - 1)) * span) : null;
            return (
              <line
                /* THE KEY CARRIES THE STATE, as in RangeDial: a keyframe
                   fires on mount, so a tick that becomes lit mounts
                   fresh and draws; the ones already lit keep theirs */
                key={on ? `${i}+` : i}
                data-slot="gauge-chart-tick"
                data-on={on || undefined}
                data-quarter={quarter || undefined}
                style={{ ["--d" as string]: Math.max(0, i - was.current) }}
                className={cn(tone ?? "text-ink", on && "rap-gauge-tick")}
                x1={CX + c * R}
                y1={CY + s * R}
                x2={CX + c * (R + len)}
                y2={CY + s * (R + len)}
                pathLength={1}
                strokeDasharray={1}
                stroke="currentColor"
                strokeOpacity={on ? (tone ? 1 : 0.9) : 0.24}
                strokeWidth={W}
                strokeLinecap="round"
              />
            );
          })}
          {/* the ring that rides the arc: hollow, surface-filled, the
              ScrubDot's proportions in the gauge's own units */}
          <circle
            data-slot="gauge-chart-ring"
            className={cn(ringTone, "fill-surface")}
            cx={CX + Math.cos(ringA) * ringR}
            cy={CY + Math.sin(ringA) * ringR}
            r={3.4}
            stroke="currentColor"
            strokeWidth={W}
            opacity={frac > 0 || grab ? 1 : 0.5}
          />
        </svg>

        {/* the face: label, figure, change — stacked in the arc's hollow */}
        <div
          data-slot="gauge-chart-face"
          className="absolute inset-x-0 top-[34%] flex flex-col items-center text-center pointer-events-none"
        >
          {label != null && (
            <span id={labelId} data-slot="gauge-chart-label" className="mb-2 text-[12.5px] font-medium text-ink/42">
              {label}
            </span>
          )}
          <ChartFigure value={Math.round(shown / step) * step} digits={decimals(step)} unit={unit} />
          {previous != null && (
            <ChartDelta change={raw - previous} digits={decimals(step)} when={when} className="justify-center" />
          )}
        </div>

        {/* the ends of the scale, under the feet — quiet, but a gauge
            without its range is a number with a decoration */}
        <div data-slot="gauge-chart-scale" aria-hidden className="text-[11px] font-medium tabular-nums text-ink/35">
          {[min, max].map((v, k) => {
            /* centred under each foot: the end tick's own angle, a
               little outside the ring, as a fraction of the box */
            const a = rad(START + k * SWEEP);
            const x = CX + Math.cos(a) * (R + 4);
            return (
              <span
                key={k}
                className="absolute bottom-0 -translate-x-1/2"
                style={{ left: `${(((x - VB.x) / VB.w) * 100).toFixed(2)}%` }}
              >
                {v}
              </span>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
});

/* the arc's box in the 200-unit space: ticks reach R+16 = 90 from
   the centre, top at y=10 and the feet at y=145; the scale labels
   take the last few units */
const VB = { x: 12, y: 6, w: 176, h: 152 };

const decimals = (step: number) => {
  const s = String(step);
  const dot = s.indexOf(".");
  return dot < 0 ? 0 : s.length - dot - 1;
};
