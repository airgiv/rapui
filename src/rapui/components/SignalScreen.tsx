/* ══ SignalScreen ══════════════════════════════════════════
   The pocket-radio pieces of the signal hero:

   DotSpectrum  a field of round dots — dark sage when off, ink when
                on — lit from the bottom as a moving spectrum. The off
                field is one SVG pattern, the lit dots one <path>, so a
                frame is a single attribute write; it steps at 8 fps
                (12 in fun), stops off screen or in a hidden tab, and
                holds one still frame in still / reduced motion.
   TunerPanel   a black LCD panel: the frequency in big phosphor
                segments over their own unlit ghosts, a label, and a
                tuner scale (FM over a dark window of tick marks, AM
                under it) with a bright needle at the frequency.

   Both are flat and read their colours from the preset's tokens
   (--rap-dot-off, --rap-panel, --rap-panel-2, --rap-lcd, …) with
   fallbacks, so they work in any preset. */
import { useEffect, useId, useRef, type HTMLAttributes } from "react";
import { cn } from "../utils";

/* ── DotSpectrum ── */

export interface DotSpectrumProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  cols?: number;
  rows?: number;
}

const PITCH = 10;
const R = 3.15;

/* how many dots are lit in column c at time t (s): a broad hump of low-mids that breathes */
function heights(cols: number, rows: number, t: number) {
  const out: number[] = [];
  for (let c = 0; c < cols; c++) {
    const x = c / Math.max(1, cols - 1);
    const env = 0.28 + 0.62 * Math.exp(-((x - 0.34) ** 2) / 0.045) + 0.18 * Math.exp(-((x - 0.78) ** 2) / 0.012);
    const wob = 0.5 + 0.5 * Math.sin(t * 1.9 + c * 0.83) * Math.cos(t * 0.71 - c * 0.29);
    const flick = 0.5 + 0.5 * Math.sin(t * 3.3 + c * 2.17);
    out.push(Math.max(1, Math.min(rows, Math.round(rows * env * (0.5 + 0.38 * wob + 0.12 * flick)))));
  }
  return out;
}

function litPath(cols: number, rows: number, t: number) {
  const h = heights(cols, rows, t);
  let d = "";
  for (let c = 0; c < cols; c++) {
    const cx = c * PITCH + PITCH / 2 - R;
    for (let r = rows - h[c]; r < rows; r++) {
      const cy = r * PITCH + PITCH / 2;
      d += `M${cx} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0`;
    }
  }
  return d;
}

export function DotSpectrum({ cols = 40, rows = 12, className, ...rest }: DotSpectrumProps) {
  const ref = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const id = `rap-ds-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const el = ref.current;
    const p = path.current;
    if (!el || !p) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const motionOf = () => el.closest("[data-rap-motion]")?.getAttribute("data-rap-motion") ?? "fun";
    const t0 = performance.now();
    const draw = () => p.setAttribute("d", litPath(cols, rows, 1.3 + (performance.now() - t0) / 1000));
    let timer = 0;
    let onScreen = false;
    const sync = () => {
      const motion = motionOf();
      const run = onScreen && !document.hidden && motion !== "still" && !reduce?.matches;
      if (run && !timer) timer = window.setInterval(draw, motion === "fun" ? 1000 / 12 : 1000 / 8);
      else if (!run && timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    };
    draw();
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((e) => ((onScreen = e[e.length - 1].isIntersecting), sync())) : null;
    if (io) io.observe(el);
    else (onScreen = true), sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(timer);
    };
  }, [cols, rows]);

  const w = cols * PITCH;
  const h = rows * PITCH;
  return (
    <div ref={ref} data-slot="dot-spectrum" aria-hidden className={cn("w-full text-ink", className)} {...rest}>
      <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id={id} width={PITCH} height={PITCH} patternUnits="userSpaceOnUse">
            <circle cx={PITCH / 2} cy={PITCH / 2} r={R} fill="var(--rap-dot-off, color-mix(in srgb, currentColor 14%, transparent))" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill={`url(#${id})`} />
        <path ref={path} d={litPath(cols, rows, 1.3)} fill="currentColor" />
      </svg>
    </div>
  );
}

/* ── TunerPanel ── */

export interface TunerPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The frequency shown, and where the needle sits on the FM scale (88–108). */
  value?: number;
  /** "MHz" — set small after the digits. */
  unit?: string;
  /** A station name in the corner. */
  label?: string;
}

const FM = [88, 92, 96, 100, 104, 107];
const AM = ["5.4", "06", "07", "08", "10", "12", "14", "16"];
const fmPos = (f: number) => ((Math.min(108, Math.max(87.5, f)) - 87.5) / (108 - 87.5)) * 100;

export function TunerPanel({ value = 98.8, unit = "MHz", label, className, ...rest }: TunerPanelProps) {
  const digits = Number.isInteger(value) ? String(value) : value.toFixed(1);
  // an LCD's unlit segments: every digit as "~" (all fourteen segments), the point kept
  const ghost = digits.replace(/\d/g, "~");
  const scaleLabel = "absolute top-0 -translate-x-1/2 whitespace-nowrap";
  return (
    <div
      data-slot="tuner-panel"
      className={cn(
        "@container flex flex-col gap-(--rap-space-md) rounded-lg bg-[var(--rap-panel,#0a0d09)] p-(--rap-space-md) font-display text-[color:var(--rap-lcd,#b6f09a)]",
        className,
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="relative m-0 flex items-baseline gap-3 leading-none" aria-label={`${digits} ${unit}`}>
          <span className="relative text-[clamp(3rem,17cqi,6rem)]">
            <span aria-hidden className="absolute inset-0 opacity-[0.09]">
              {ghost}
            </span>
            <span aria-hidden className="relative">
              {digits}
            </span>
          </span>
          <span aria-hidden className="text-[0.8125rem] uppercase text-[color:var(--rap-lcd-dim,rgb(182_240_154/0.4))]">
            {unit}
          </span>
        </p>
        {label && <span className="pt-1 text-right text-[0.75rem] uppercase leading-snug text-[color:var(--rap-lcd-dim,rgb(182_240_154/0.4))]">{label}</span>}
      </div>
      <div aria-hidden className="flex flex-col gap-2 text-[0.6875rem] uppercase text-[color:var(--rap-lcd-dim,rgb(182_240_154/0.4))]">
        <div className="relative ml-8 h-4">
          {FM.map((f) => (
            <span key={f} className={scaleLabel} style={{ left: `${fmPos(f)}%` }}>
              {f}
            </span>
          ))}
          <span className="absolute -left-8 top-0">FM</span>
        </div>
        <div
          className="relative ml-8 h-[clamp(3.5rem,12cqi,6rem)] overflow-hidden rounded-sm bg-[var(--rap-panel-2,#1c2a1b)]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgb(182 240 154 / 0.22) 0 1px, transparent 1px 2.5%), repeating-linear-gradient(90deg, rgb(182 240 154 / 0.1) 0 1px, transparent 1px 0.625%)",
          }}
        >
          <span className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-[var(--rap-lcd-needle,#8dff6a)]" style={{ left: `${fmPos(value)}%` }} />
        </div>
        <div className="relative ml-8 h-4">
          {AM.map((a, i) => (
            <span key={a} className={scaleLabel} style={{ left: `${(i / (AM.length - 1)) * 96 + 2}%` }}>
              {a}
            </span>
          ))}
          <span className="absolute -left-8 top-0">AM</span>
        </div>
      </div>
    </div>
  );
}
