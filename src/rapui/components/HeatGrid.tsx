/* ══ HeatGrid ═══════════════════════════════════════════════
   Half a year of days as a grid of small rounded squares — weeks
   across, Monday to Sunday down — each one a step of ink by how
   much happened that day. Set in a ChartCard: the total is the
   figure, the change line carries the streak.

   THE DELIGHT: touching a day sends a RIPPLE out from it. The
   day's neighbours swell and settle one ring after another, the
   delay growing with their distance from the pointer, the swell
   shrinking with it — a stone dropped in the grid. Running the
   pointer along a row leaves a wake. Switching the metric
   re-colours the grid in a diagonal wave from the top-left, so
   the new picture is laid down rather than swapped in.

   The numbers, and why:
   - five steps (none + four): enough to see a busy week from a
     quiet one, few enough that a step is a real difference. The
     four are the QUARTILES of the active days, not shares of the
     busiest: by share, one launch-week outlier washes every other
     day into the first step and the grid goes flat.
   - ink at 7 / 22 / 42 / 66 / 92%: 7 is the ChartTabs pill, the
     card's own "empty"; the rest roughly double in contrast each
     step, which is how the eye counts opacity.
   - 3px gap, 3px corner on a ~12px cell: the gap is what makes
     them read as days rather than as a texture, the corner is
     just enough to be rap/ui's "nothing square".
   - ripple: radius 3 cells, 34ms a cell, 1.42 at the centre
     falling to 1.1 at the edge, 420ms on a back-out curve — quick
     enough that a sweep reads as a wake, not a queue.
   - re-colour wave: 11ms per step of (week + weekday) — the
     diagonal crosses 32 steps in about a third of a second.

   Sound: a soft detent per day entered, pitched by its step, so a
   run across a busy week climbs. */
import {
  forwardRef,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "../utils";
import { useSound } from "../sound";
import { isCalm } from "../hooks/useGlide";
import { ChartCard, ChartDelta, ChartFigure, ChartTabs } from "./ChartKit";

export interface HeatGridMetric {
  id: string;
  /** The tab's label. */
  label: string;
  /** After the figure, quiet: "edits", "visits". */
  unit?: string;
  /** One value per day, oldest first; the last one is `end`. */
  values: number[];
}

export interface HeatGridProps extends HTMLAttributes<HTMLDivElement> {
  metrics?: HeatGridMetric[];
  /** Metric shown first (id). */
  defaultMetric?: string;
  /** The last day on the grid, ISO date. */
  end?: string;
  /** How many weeks across. */
  weeks?: number;
  /** Rounded squares or dots. */
  shape?: "square" | "dot";
  /** Ink steps, or the chart green. */
  tone?: "ink" | "up";
  corner?: number;
}

const DAY = 86_400_000;
const RIPPLE = 3;

/* the five steps, as static class names so Tailwind sees them */
const STEPS: Record<"ink" | "up", string[]> = {
  ink: ["bg-ink/7", "bg-ink/22", "bg-ink/42", "bg-ink/66", "bg-ink/92"],
  up: ["bg-ink/7", "bg-chart-up/28", "bg-chart-up/50", "bg-chart-up/74", "bg-chart-up"],
};

const dayLabel = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export const HeatGrid = forwardRef<HTMLDivElement, HeatGridProps>(function HeatGrid(
  {
    metrics = DEMO,
    defaultMetric,
    end = DEMO_END,
    weeks = 26,
    shape = "square",
    tone = "ink",
    corner,
    className,
    ...rest
  },
  ref,
) {
  const [metricId, setMetricId] = useState(defaultMetric ?? metrics[0]?.id);
  const metric = metrics.find((m) => m.id === metricId) ?? metrics[0];
  const sound = useSound();
  const grid = useRef<HTMLDivElement | null>(null);
  const [at, setAt] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const cols = Math.max(4, Math.min(53, Math.round(weeks)));

  /* the grid's cells, column-major (week by week, Monday first);
     the days after `end` in its week are left empty */
  const cells = useMemo(() => {
    const last = new Date(`${end}T00:00:00Z`);
    const lastDow = (last.getUTCDay() + 6) % 7; // Monday 0
    const total = cols * 7;
    const tail = 6 - lastDow; // empty slots after `end`
    const vals = metric?.values ?? [];
    /* steps by QUARTILE of the days that had anything: each step
       holds about a quarter of the active days, so the grid always
       uses its whole range and one record day cannot flatten it */
    const active = vals.slice(-(total - tail)).filter((v) => v > 0).sort((a, b) => a - b);
    const q = (f: number) => active[Math.min(active.length - 1, Math.floor(active.length * f))] ?? 1;
    const cut = [q(0.25), q(0.5), q(0.75)];
    return Array.from({ length: total }, (_, i) => {
      const back = total - tail - 1 - i; // days before `end`
      const v = back < 0 ? null : (vals[vals.length - 1 - back] ?? 0);
      const date = new Date(last.getTime() - back * DAY);
      const step = v == null || v <= 0 ? 0 : v >= cut[2] ? 4 : v >= cut[1] ? 3 : v >= cut[0] ? 2 : 1;
      return { i, col: Math.floor(i / 7), row: i % 7, v, date, step };
    });
  }, [metric, end, cols]);

  const real = cells.filter((c) => c.v != null);
  const total = real.reduce((s, c) => s + (c.v ?? 0), 0);
  const avg = total / (real.length || 1);
  /* the streak: consecutive days with anything, back from the last */
  let streak = 0;
  for (let k = real.length - 1; k >= 0 && (real[k].v ?? 0) > 0; k--) streak++;
  /* the change at rest: the last four weeks against the four before */
  const lastN = real.slice(-28).reduce((s, c) => s + (c.v ?? 0), 0);
  const prevN = real.slice(-56, -28).reduce((s, c) => s + (c.v ?? 0), 0);

  /* month labels: under the first week that starts in a new month */
  const months = useMemo(() => {
    const out: { col: number; label: string }[] = [];
    let was = -1;
    for (let c = 0; c < cols; c++) {
      const m = cells[c * 7].date.getUTCMonth();
      if (m !== was) {
        if (c > 0 || cells[0].date.getUTCDate() <= 7)
          out.push({ col: c, label: cells[c * 7].date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) });
        was = m;
      }
    }
    return out;
  }, [cells, cols]);

  /* ── the ripple ───────────────────────────────────────────
     Web Animations, not a class per cell: a hover can start a new
     ripple every few frames and restarting 182 CSS animations
     through React would be a re-render per ring. `scale` is its own
     property, so it stacks with anything else on the cell. */
  const ripple = useCallback((from: number) => {
    const g = grid.current;
    if (!g || isCalm(g) || typeof Element.prototype.animate !== "function") return;
    const c0 = Math.floor(from / 7);
    const r0 = from % 7;
    g.querySelectorAll<HTMLElement>("[data-slot=heat-grid-cell]").forEach((el) => {
      const i = Number(el.dataset.i);
      const d = Math.hypot(Math.floor(i / 7) - c0, (i % 7) - r0);
      if (d > RIPPLE) return;
      const peak = 1.42 - (d / RIPPLE) * 0.32;
      el.animate([{ scale: 1 }, { scale: peak, offset: 0.35 }, { scale: 1 }], {
        duration: 420,
        delay: d * 34,
        easing: "cubic-bezier(0.34, 1.4, 0.64, 1)",
      });
    });
  }, []);

  const enter = (i: number | null) => {
    if (i === at) return;
    setAt(i);
    if (i == null) return;
    const c = cells[i];
    if (!c || c.v == null) return;
    sound.detent(0.3, { pitch: 0.85 + c.step * 0.12 });
    ripple(i);
  };

  /* the pointer from coordinates, not per-cell enter events — a
     finger is captured to the cell it started on, so enter never
     fires on the others (ProgressTicks' note) */
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" && e.buttons === 0) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const i = el?.dataset.slot === "heat-grid-cell" ? Number(el.dataset.i) : null;
    if (i != null && cells[i]?.v != null) enter(i);
  };

  /* arrows move a day (up/down) or a week (left/right); Home and End
     jump to the first and the last day; Escape lets go */
  const onKey = (e: ReactKeyboardEvent) => {
    const first = real[0]?.i ?? 0;
    const last = real[real.length - 1]?.i ?? 0;
    const from = at ?? last;
    const to =
      e.key === "ArrowUp" ? from - 1
      : e.key === "ArrowDown" ? from + 1
      : e.key === "ArrowLeft" ? from - 7
      : e.key === "ArrowRight" ? from + 7
      : e.key === "Home" ? first
      : e.key === "End" ? last
      : null;
    if (to == null) {
      if (e.key === "Escape") setAt(null);
      return;
    }
    e.preventDefault();
    enter(at == null ? last : Math.min(last, Math.max(first, to)));
  };

  const cur = at != null ? cells[at] : null;
  const unit = metric?.unit;
  const figureId = useId();

  return (
    <ChartCard ref={ref} corner={corner} data-slot="heat-grid" className={cn("w-full max-w-[26rem]", className)} {...rest}>
      <div id={figureId} aria-live="polite" data-slot="heat-grid-readout">
        <ChartFigure value={cur ? (cur.v ?? 0) : total} unit={unit} />
        {cur ? (
          <ChartDelta
            change={Math.round((cur.v ?? 0) - avg)}
            format={(n) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toLocaleString("en-GB")} vs avg`}
            when={dayLabel(cur.date)}
          />
        ) : (
          <ChartDelta
            change={lastN - prevN}
            pct={prevN ? ((lastN - prevN) / prevN) * 100 : undefined}
            when={streak > 1 ? `${streak}-day streak` : "last 4 weeks"}
          />
        )}
      </div>

      <div
        ref={grid}
        data-slot="heat-grid-days"
        role="group"
        aria-label={`${metric?.label ?? "Activity"} by day, ${cols} weeks. Arrow keys move between days.`}
        aria-describedby={figureId}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => !focused && enter(null)}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setAt(null);
        }}
        onKeyDown={onKey}
        className={cn(
          "group/grid mt-5 grid grid-flow-col grid-rows-7 gap-[3px] touch-pan-y rounded-[6px] outline-none",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4",
        )}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } as CSSProperties}
      >
        {cells.map((c) => (
          <i
            key={c.i}
            data-slot="heat-grid-cell"
            data-i={c.i}
            data-step={c.v == null ? undefined : c.step}
            data-at={at === c.i || undefined}
            aria-hidden
            className={cn(
              "block aspect-square",
              shape === "dot" ? "rounded-full" : "rounded-[3px]",
              c.v == null ? "invisible" : STEPS[tone][c.step],
              /* the re-colour wave: only background eases, so hover
                 and the ripple are untouched by the delay */
              "transition-[background-color] duration-300 ease-soft",
              "fun:[transition-delay:calc((var(--c)+var(--r))*11ms)] motion-reduce:transition-none calm:transition-none",
              /* the day you are on: a ring in the card's colour inside
                 an ink ring, so it reads on the empty and the full step */
              "data-at:shadow-[0_0_0_1.5px_var(--rap-surface),0_0_0_3px_var(--rap-ink)] data-at:z-1 relative",
            )}
            style={{ "--c": c.col, "--r": c.row } as CSSProperties}
          />
        ))}
      </div>

      <div data-slot="heat-grid-months" aria-hidden className="relative mt-2 h-3.5 text-[11px] font-medium text-ink/35">
        {months.map((m) => (
          <span key={m.col} className="absolute top-0" style={{ left: `${(m.col / cols) * 100}%` }}>
            {m.label}
          </span>
        ))}
      </div>

      {metrics.length > 1 && (
        <ChartTabs
          aria-label="Metric"
          options={metrics.map((m) => ({ id: m.id, label: m.label }))}
          value={metric.id}
          onChange={(id) => {
            setAt(null);
            setMetricId(id);
          }}
        />
      )}
    </ChartCard>
  );
});

/* ── demo data ───────────────────────────────────────────────
   Six months of a designer's Readymag account up to Sunday
   27 September 2026: busy weekdays, quiet weekends, a fortnight
   off in August, a launch crunch in mid-June and a streak running
   into the present. Seeded, so it is the same picture every load. */
const DEMO_END = "2026-09-27";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function series(seed: number, scale: number, weekend: number): number[] {
  const rnd = seeded(seed);
  const days = 26 * 7;
  const endT = Date.parse(`${DEMO_END}T00:00:00Z`);
  return Array.from({ length: days }, (_, k) => {
    const d = new Date(endT - (days - 1 - k) * DAY);
    const dow = (d.getUTCDay() + 6) % 7;
    const m = d.getUTCMonth();
    const date = d.getUTCDate();
    if (m === 7 && date >= 3 && date <= 16) return 0; // a fortnight off
    const crunch = m === 5 && date >= 8 && date <= 19 ? 2.1 : 1;
    const base = dow >= 5 ? weekend : 1;
    const r = rnd();
    if (r < 0.12 && k < days - 16) return 0; // the odd blank day (not in the live streak)
    return Math.round(scale * base * crunch * (0.35 + r * 0.9));
  });
}

const DEMO: HeatGridMetric[] = [
  { id: "edits", label: "Edits", unit: "edits", values: series(7, 38, 0.25) },
  { id: "publishes", label: "Publishes", unit: "publishes", values: series(19, 4, 0.1) },
  { id: "comments", label: "Comments", unit: "comments", values: series(41, 9, 0.35) },
];
