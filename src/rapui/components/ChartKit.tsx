/* ══ ChartKit ═════════════════════════════════════════════
   The parts every rap/ui chart card is built from, lifted out of
   BalanceChart (Bencho's portfolio card) so the others can speak
   the same language:

     ChartCard     the card: white sheet, 26px corner, the wall's
                   12px inset with a taller top for the figure
     ChartFigure   the one big number, cents at a quieter size
     ChartDelta    the change under it, green up / orange down,
                   and the quiet "when" beside it
     ChartTabs     a row of tabs with ONE pill that travels
     curve()       Catmull-Rom through the readings, with at(u) to
                   put a dot ON the curve at a fractional index
     useScrub()    the pointer → fractional index, with a detent
                   per reading pitched by its value
     ScrubGuide /  the vertical hairline and the ring on the line,
     ScrubDot      drawn as elements over a stretched svg so they
                   stay round at any width

   The rules they carry, stated once (see BalanceChart for the
   long versions):
   - figures are tabular-nums in the UI face, never mono — a stable
     digit advance is the requirement, not a monospaced look;
   - lines are 2.1px, non-scaling, in --rap-chart-up/-down: a thin
     stroke of a text green reads muddy, so charts get their own;
   - no wash under the line, no glow, no permanent guide: the guide
     and the dot exist only while you are reading back;
   - the dot does not ease toward the pointer — a scrub's claim is
     that the number and the place agree, every frame. */
import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils";
import { useSound } from "../sound";

/* ── the card ─────────────────────────────────────────────── */

export interface ChartCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card corner in px (26 is the page's own corner, as in BalanceChart). */
  corner?: number;
}

export const ChartCard = forwardRef<HTMLDivElement, ChartCardProps>(function ChartCard(
  { corner = 26, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="chart-card"
      className={cn(
        // 22 on top: the figure is the first thing read and should not sit against the edge;
        // 12 elsewhere, the wall's gap, so the plot gets the width
        "relative w-80 max-w-full bg-surface text-ink font-sans pt-[22px] px-3 pb-3 select-none",
        className,
      )}
      style={{ borderRadius: corner, ...style }}
      {...rest}
    />
  );
});

/* ── the figure ───────────────────────────────────────────── */

const grouped = (n: number, digits: number) =>
  n.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export interface ChartFigureProps extends Omit<HTMLAttributes<HTMLParagraphElement>, "prefix"> {
  value: number;
  /** Fraction digits; they ride at a quieter size, like cents. */
  digits?: number;
  /** Before the number, same size and weight — it is part of the number. */
  prefix?: ReactNode;
  /** After the number, at the quiet size (%, h, pages…). */
  unit?: ReactNode;
}

export function ChartFigure({ value, digits = 0, prefix, unit, className, ...rest }: ChartFigureProps) {
  const s = grouped(value, digits);
  const dot = digits > 0 ? s.lastIndexOf(".") : -1;
  const whole = dot < 0 ? s : s.slice(0, dot);
  const frac = dot < 0 ? "" : s.slice(dot);
  return (
    <p
      data-slot="chart-figure"
      // 33 / 500 / -0.03em: the size already makes it first; semibold made it a headline
      className={cn("m-0 text-[33px] leading-none font-medium tracking-[-0.03em] tabular-nums", className)}
      {...rest}
    >
      {prefix != null && <span className="mr-0.5">{prefix}</span>}
      {whole}
      {(frac || unit != null) && (
        // 24 against 33: the same number, quieter — grey does the subordinating, not size
        <span className="text-[24px] opacity-[0.34]">
          {frac}
          {unit != null && (
            // a symbol (%, h) hugs the number; a word ("pages") needs a real space
            <span className={typeof unit === "string" && unit.trim().length > 1 ? "ml-[0.2em]" : frac ? "ml-0.5" : "ml-[3px]"}>
              {typeof unit === "string" ? unit.trim() : unit}
            </span>
          )}
        </span>
      )}
    </p>
  );
}

/* ── the change ───────────────────────────────────────────── */

export interface ChartDeltaProps extends HTMLAttributes<HTMLParagraphElement> {
  /** The change itself; its sign picks the colour. */
  change: number;
  /** How to print it (default: signed, grouped, `digits` places). */
  format?: (n: number) => ReactNode;
  digits?: number;
  /** Percentage beside it, optional. */
  pct?: number;
  /** The quiet half of the line: "today", or the time under the pointer. */
  when?: ReactNode;
}

export function ChartDelta({ change, format, digits = 0, pct, when, className, ...rest }: ChartDeltaProps) {
  const up = change >= 0;
  const text = format ? format(change) : (up ? "+" : "−") + grouped(Math.abs(change), digits);
  return (
    <p
      data-slot="chart-delta"
      data-up={up}
      // tabular above all: this line is rewritten on every step of a scrub
      className={cn(
        "mt-[9px] mb-0 flex items-baseline gap-[7px] text-[12.5px] font-medium tabular-nums",
        up ? "text-success" : "text-flame",
        className,
      )}
      {...rest}
    >
      <span>
        {text}
        {pct != null && ` · ${Math.abs(pct).toFixed(1)}%`}
      </span>
      {when != null && <span className="text-ink/42">{when}</span>}
    </p>
  );
}

/* ── the tabs ─────────────────────────────────────────────────
   ONE PILL THAT TRAVELS rather than three backgrounds taking turns:
   a shape that moves says "this one, and it came from that one".
   Placed by arithmetic — every tab is flex-1, so a translate of
   (100% + gap) of the pill's own width is exactly one tab — nothing
   is measured. 1.16 on the curve: a bounce you feel, not watch. */

export interface ChartTabsProps<T extends string> {
  options: readonly { id: T; label: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  "aria-label"?: string;
}

export function ChartTabs<T extends string>({ options, value, onChange, className, ...rest }: ChartTabsProps<T>) {
  const sound = useSound();
  const at = Math.max(0, options.findIndex((o) => o.id === value));
  return (
    <div
      data-slot="chart-tabs"
      role="group"
      aria-label={rest["aria-label"] ?? "Range"}
      className={cn("relative mt-4 flex gap-1", className)}
      style={{ "--n": options.length, "--at": at } as CSSProperties}
    >
      <span
        aria-hidden
        data-slot="chart-tabs-pill"
        className={cn(
          "absolute inset-y-0 left-0 rounded-pill bg-ink/7",
          "w-[calc((100%-(var(--n)-1)*4px)/var(--n))] translate-x-[calc(var(--at)*(100%+4px))]",
          "transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.16,0.5,1)] calm:duration-0",
        )}
      />
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={i === at}
          data-on={i === at || undefined}
          onClick={() => {
            if (i === at) return;
            sound.play("tap", { strength: 0.5 });
            onChange(o.id);
          }}
          className={cn(
            "relative z-1 flex-1 h-8 rounded-pill border-0 bg-transparent cursor-pointer",
            "text-[12.5px] font-medium tracking-[0.01em] text-ink/45 hover:text-ink data-on:text-ink",
            "transition-[color,scale] duration-200 ease-[cubic-bezier(0.28,1.2,0.36,1)] active:scale-94",
            "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── the line ─────────────────────────────────────────────────
   A CURVE, not a polyline: Catmull-Rom as cubic béziers, through
   every reading exactly, control points from the neighbours, so
   nothing is invented and nothing overshoots. The stroke, the area
   and the points come out of one pass so they cannot disagree, and
   the control points are kept for at(u): the dot on the curve at a
   fractional index (lerping would put it on the chord). */
export function curve(vals: number[], w: number, h: number, pad: number, range?: [number, number]) {
  const lo = range?.[0] ?? Math.min(...vals);
  const hi = range?.[1] ?? Math.max(...vals);
  const pt = vals.map((v, i) => ({
    x: vals.length > 1 ? (i / (vals.length - 1)) * w : w / 2,
    y: h - pad - ((v - lo) / (hi - lo || 1)) * (h - pad * 2),
  }));
  const seg = pt.slice(0, -1).map((p1, i) => {
    const p0 = pt[i - 1] ?? p1;
    const p2 = pt[i + 1];
    const p3 = pt[i + 2] ?? p2;
    // a sixth of the neighbour span: tighter and it corners, looser and it loops
    return {
      p1,
      p2,
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
    };
  });
  let d = pt.length ? `M${pt[0].x.toFixed(2)} ${pt[0].y.toFixed(2)}` : "";
  for (const g of seg)
    d += ` C${g.c1.x.toFixed(2)} ${g.c1.y.toFixed(2)} ${g.c2.x.toFixed(2)} ${g.c2.y.toFixed(2)} ${g.p2.x.toFixed(2)} ${g.p2.y.toFixed(2)}`;
  const at = (u: number) => {
    if (!seg.length) return pt[0] ?? { x: 0, y: 0 };
    const i = Math.min(seg.length - 1, Math.max(0, Math.floor(u)));
    const g = seg[i];
    const t = Math.min(1, Math.max(0, u - i));
    const m = 1 - t;
    return {
      x: m ** 3 * g.p1.x + 3 * m * m * t * g.c1.x + 3 * m * t * t * g.c2.x + t ** 3 * g.p2.x,
      y: m ** 3 * g.p1.y + 3 * m * m * t * g.c1.y + 3 * m * t * t * g.c2.y + t ** 3 * g.p2.y,
    };
  };
  return { d, area: `${d} L${w} ${h} L0 ${h} Z`, pt, at };
}

/** Value at a fractional index, linear between readings. */
export const valueAt = (vals: number[], u: number) => {
  const lo = Math.floor(u);
  const hi = Math.min(vals.length - 1, Math.ceil(u));
  return vals[lo] + (vals[hi] - vals[lo]) * (u - lo);
};

/* ── the scrub ────────────────────────────────────────────────
   Read as a FRACTION of the plot's own box, so it needs no zoom
   correction. Continuous (the dot glides along the curve), but the
   SOUND is one detent per reading crossed, pitched a fifth either
   way by where that reading sits between the low and the high —
   so a climb sounds like a climb. `snap` rounds the index for
   charts whose readings are discrete things (bars, days). */
export function useScrub(vals: number[], { snap = false }: { snap?: boolean } = {}) {
  const [u, setU] = useState<number | null>(null);
  const heard = useRef(-1);
  const sound = useSound();
  const last = vals.length - 1;
  const onPointer = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (e.clientX - r.left) / (r.width || 1)));
      const raw = snap ? Math.min(last, Math.floor(t * vals.length)) : t * last;
      const i = Math.round(raw);
      if (i !== heard.current) {
        heard.current = i;
        const lo = Math.min(...vals);
        const span = Math.max(...vals) - lo || 1;
        sound.detent(0.5, { pitch: Math.pow(1.5, ((vals[i] - lo) / span) * 2 - 1) });
      }
      setU(raw);
    },
    [vals, last, snap, sound],
  );
  const leave = useCallback(() => {
    heard.current = -1;
    setU(null);
  }, []);
  return {
    /** fractional index under the pointer, or null at rest */
    u,
    /** spread onto the plot */
    bind: { onPointerMove: onPointer, onPointerDown: onPointer, onPointerLeave: leave, "data-scrub": u !== null || undefined },
  };
}

/** The hairline under the pointer. Place inside a `relative` plot; `x` in % of its width. */
export function ScrubGuide({ x, on, inset = 6 }: { x: number; on: boolean; inset?: number }) {
  return (
    <i
      aria-hidden
      data-slot="chart-guide"
      className={cn(
        "absolute w-px -ml-[0.5px] bg-current pointer-events-none transition-opacity duration-150",
        on ? "opacity-28" : "opacity-0",
      )}
      style={{ left: `${x}%`, top: inset, bottom: inset }}
    />
  );
}

/**
 * The ring on the line: a hollow 9px dot with a 2px currentColor ring, grown a
 * little while reading. `y` is a 0..1 fraction of the plot's inner height (between `inset`s).
 */
export function ScrubDot({ x, y, on, inset = 6 }: { x: number; y: number; on: boolean; inset?: number }) {
  return (
    <i
      aria-hidden
      data-slot="chart-dot"
      className={cn(
        "absolute size-[9px] -m-[4.5px] rounded-full bg-surface shadow-[0_0_0_2px_currentColor] pointer-events-none",
        "transition-[scale] duration-160 ease-[cubic-bezier(0.28,1.4,0.36,1)]",
        on && "scale-118",
      )}
      style={{ left: `${x}%`, top: `calc(${inset}px + (100% - ${inset * 2}px) * ${y})` }}
    />
  );
}

/** The chart colour for a direction: `color` on a wrapper so stroke, guide and dot agree. */
export const lineColor = (up: boolean) => (up ? "text-chart-up" : "text-chart-down");
