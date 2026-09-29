/* ══ Sparkline ═════════════════════════════════════════════
   The BalanceChart line with the card taken away: a trend small
   enough to sit in a table cell or halfway through a sentence
   ("pages published this week ⟋ 1,382"). Same language as the
   card, on purpose — the 2.1px Catmull-Rom stroke from ChartKit's
   curve(), green up / orange down by first-vs-last, no fill, no
   axes, and the hairline-free version of the scrub: hover and the
   hollow ring rides the curve with a small chip saying the value.

   THE DELIGHT is a pen, then a pulse.
   - On mount the line is DRAWN, left to right, the way you would
     sketch a trend in a margin: pathLength=1 turns the dash into a
     0..1 fraction of the path, so one keyframe draws any shape at
     the same pace. 900ms because it is read in passing — long
     enough to see the direction happen, short enough that a table
     of twenty of them is finished before you reach the last row.
   - When the pen lifts, the endpoint lands as a 5px dot and then
     BREATHES: a ring swells off it and fades every 2.8s. That is
     "this is the latest reading, and it is live", said the way the
     Badge's live dot says it — slower than a heartbeat, so a column
     of them reads as calm rather than alarmed.
   Both are behind `fun:` — calm and reduced motion get the finished
   line and a still dot.

   ── why the numbers ──────────────────────────────────────────
   120×32 by default: about the width of a table column of figures
   and the cap height of 1.5 lines of body text, so it sits in a row
   without making it taller. The drawing box keeps 3px of air on
   every side (PAD) — half the stroke plus the end dot's radius —
   so neither is clipped when the extreme is at an edge.

   The svg is drawn at its own pixel size (viewBox = width × height,
   no preserveAspectRatio="none"), unlike the card's stretched plot:
   a sparkline knows its size up front, and an unstretched svg is
   what lets the pen use pathLength without non-scaling-stroke
   muddling the dash maths. */
import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";
import { ScrubDot, curve, lineColor, useScrub, valueAt } from "./ChartKit";
import "./Sparkline.css";

const PAD = 3;

/* the chip reads the curve BETWEEN readings too, so a count of pages would come out as
   58.6 — whole-number data gets whole-number readings */
const plainFor = (vals: number[]) => {
  const whole = vals.every((v) => Number.isInteger(v));
  return (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: whole ? 0 : 1 });
};

export interface SparklineProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The readings, oldest first. Two or more. */
  data: number[];
  /** Width in px (default 120). */
  width?: number;
  /** Height in px (default 32). */
  height?: number;
  /** How the chip prints a reading (default: grouped, up to one decimal). */
  format?: (n: number) => ReactNode;
  /** Show the breathing dot on the latest reading (default true). */
  showEnd?: boolean;
  /** Force the colour; by default the trend picks it (last ≥ first is up). */
  trend?: "up" | "down";
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  format: formatProp,
  showEnd = true,
  trend,
  className,
  style,
  "aria-label": ariaLabel,
  ...rest
}: SparklineProps) {
  const vals = data.length > 1 ? data : [data[0] ?? 0, data[0] ?? 0];
  const last = vals.length - 1;
  const format = formatProp ?? plainFor(vals);
  const up = trend ? trend === "up" : vals[last] >= vals[0];
  const w = Math.max(8, width - PAD * 2);
  const h = Math.max(8, height);
  const c = curve(vals, w, h, PAD);
  const { u, bind } = useScrub(vals);

  // everything over the svg is placed in % of the box, from the same points the path is built from
  const xPct = (x: number) => ((PAD + x) / width) * 100;
  const yFrac = (y: number) => (y - PAD) / (h - PAD * 2 || 1);
  const end = c.pt[last];
  const dot = u === null ? null : c.at(u);
  const reading = u === null ? null : valueAt(vals, u);

  // the label says what the line says: where it went, from where, and by how much
  const pct = vals[0] ? ((vals[last] - vals[0]) / Math.abs(vals[0])) * 100 : 0;
  const label =
    ariaLabel ??
    `Trend over ${vals.length} readings: ${String(format(vals[0]))} to ${String(format(vals[last]))}, ${
      up ? "up" : "down"
    } ${Math.abs(pct).toFixed(1)}%`;

  return (
    <span
      data-slot="sparkline"
      data-up={up}
      role="img"
      aria-label={label}
      className={cn("relative inline-block shrink-0 align-middle select-none touch-pan-y", lineColor(up), className)}
      style={{ width, height, ...style }}
      {...bind}
      {...rest}
    >
      <svg
        data-slot="sparkline-svg"
        width={width}
        height={h}
        viewBox={`${-PAD} 0 ${width} ${h}`}
        className="block overflow-visible"
        aria-hidden
      >
        {/* The pen: one dash as long as the whole path (pathLength=1), pulled from offset 1 to 0.
            At rest (and under calm) the offset is 0 and the dash IS the line. */}
        <path
          data-slot="sparkline-line"
          d={c.d}
          pathLength={1}
          strokeDasharray="1 1"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="fun:animate-[rap-spark-draw_900ms_cubic-bezier(0.45,0.05,0.25,1)_both]"
        />
      </svg>

      {showEnd && (
        <span
          aria-hidden
          data-slot="sparkline-end"
          className={cn(
            "absolute size-[5px] -m-[2.5px] pointer-events-none transition-opacity duration-150",
            // lands as the pen lifts: 900ms of draw, then a small pop
            "fun:animate-[rap-spark-land_320ms_cubic-bezier(0.28,1.6,0.4,1)_860ms_both]",
            dot && "opacity-0",
          )}
          style={{ left: `${xPct(end.x)}%`, top: end.y }}
        >
          <i className="absolute inset-0 rounded-full bg-current" />
          {/* the breath: a ring off the dot, every 2.8s, starting once the dot has landed */}
          <i className="absolute inset-0 rounded-full bg-current opacity-0 fun:animate-[rap-spark-breathe_2.8s_cubic-bezier(0.2,0.6,0.35,1)_1.2s_infinite]" />
        </span>
      )}

      {dot && reading !== null && (
        <>
          <ScrubDot x={xPct(dot.x)} y={yFrac(dot.y)} on inset={PAD} />
          {/* The chip: over the box, not over the dot — it must not hide the line it reads.
              translate by −x% of its own width, so it is centred mid-line and flush with
              either end at the edges, and never leaves the sparkline's own column. */}
          <span
            data-slot="sparkline-chip"
            aria-hidden
            className={cn(
              "absolute bottom-[calc(100%+5px)] z-10 h-5 px-1.5 rounded-pill bg-ink text-surface pointer-events-none",
              "text-[11px] leading-5 font-medium tracking-[-0.01em] tabular-nums whitespace-nowrap",
            )}
            style={
              {
                left: `${xPct(dot.x)}%`,
                translate: `${-xPct(dot.x)}% 0`,
              } as CSSProperties
            }
          >
            {format(reading)}
          </span>
        </>
      )}
    </span>
  );
}
