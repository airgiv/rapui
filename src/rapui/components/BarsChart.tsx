/* ══ BarsChart ═════════════════════════════════════════════
   BalanceChart's card with the line swapped for a row of rounded
   bars — for things that are COUNTED per period rather than
   measured continuously: pages published per day, invoices per
   month. The card, the figure, the delta and the travelling-pill
   tabs are ChartKit's, so it reads as the same family.

   Reading it: at rest the figure is the TOTAL for the window and
   the delta is that total against the window before it. Run along
   the bars and the figure becomes the bar under the pointer, its
   delta is against the window's average day (a count per day has
   no "previous" that means anything on a Monday after a Sunday;
   the average is the question a bar actually answers — "was this
   a good day?"), and the quiet "when" becomes the bar's label.
   The bar under you goes full colour and the rest step back.

   THE DELIGHT is a heap. Change the window and the bars do not
   grow out of the baseline like a spreadsheet: they are DROPPED —
   from above the plot, under gravity, landing with a squash and
   one small bounce, in a slightly shuffled order, like the
   Checklist's slips falling into their pile. With sound on each
   landing is a soft notch pitched by the bar's value, and the
   first one lands with a "drop". Click a bar and it wobbles like
   jelly. All of it behind `fun:`; calm and reduced motion show the
   bars already standing.

   ── why the numbers ──────────────────────────────────────────
   - The fall is 720ms with the impact at 52%: ease-in to the
     floor (gravity is acceleration, so the curve is the
     gravity easing), a 1.1×0.82 squash as it hits, a 9px rebound,
     a 2px one, still. Two bounces read as rubber; one reads as
     a thing with weight, and bars should feel like blocks.
   - The stagger is at most 55ms a bar and the whole row is in
     motion within ~0.5s whatever the count — 30 bars at 55ms
     would be a queue, not a heap. The jitter (0–32ms, fixed per
     position) is what makes it a heap: a strict left-to-right
     cascade reads as a wave, which is a different metaphor.
   - Gaps shrink with the count (10 / 6 / 3px) so a week reads as
     seven blocks and a month as a texture, and every bar is a
     pill: the rounded end is the one bit of softness that keeps a
     block of bars from looking like a 1998 sales chart. */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils";
import { useSound } from "../sound";
import { isCalm } from "../hooks/useGlide";
import { ChartCard, ChartDelta, ChartFigure, ChartTabs, lineColor, useScrub } from "./ChartKit";
import "./BarsChart.css";

export interface BarsDatum {
  /** What the quiet "when" says while this bar is read: "Tue 29 Sep", "Aug 2026". */
  label: string;
  value: number;
}

export interface BarsRange {
  id: string;
  /** The tab's text: "7D". */
  tab: ReactNode;
  /** The "when" at rest: "past 7 days". */
  span: string;
  bars: BarsDatum[];
  /** Total of the window before this one; the delta at rest compares against it. */
  previous?: number;
}

/* ── the demo: pages published on a studio workspace ─────────
   One series, three windows, and they agree: the week is the last
   seven days of the month, and September in the year is the month
   less 31 August. Weekends dip because people publish at work. */
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// written out rather than toLocaleDateString: en-GB gives "Fri, 25 Sept", and the comma is noise here
const day = (from: [number, number, number], values: number[]): BarsDatum[] =>
  values.map((value, i) => {
    const d = new Date(Date.UTC(from[0], from[1] - 1, from[2] + i));
    return {
      value,
      label: `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`,
    };
  });

const MONTH = [
  53, 52, 58, 42, 37, 23, 12, 54, 66, 47, 57, 41, 15, 12, 56, 61, 48, 48, 37, 23, 17, 44, 66, 48, 61, 54, 22, 17, 66,
  71,
];

export const BARS_DEMO: BarsRange[] = [
  {
    id: "7d",
    tab: "7D",
    span: "past 7 days",
    bars: day([2026, 9, 23], MONTH.slice(-7)),
    previous: 312,
  },
  {
    id: "30d",
    tab: "30D",
    span: "past 30 days",
    bars: day([2026, 8, 31], MONTH),
    previous: 1221,
  },
  {
    id: "12m",
    tab: "12M",
    span: "past 12 months",
    bars: [1104, 1172, 968, 1051, 1098, 1233, 1290, 1318, 1377, 1164, 1216, 1255].map((value, i) => ({
      value,
      label: `${MO[(9 + i) % 12]} ${2025 + Math.floor((9 + i) / 12)}`,
    })),
    previous: 12608,
  },
];

const FALL_MS = 720;
const IMPACT = 0.52;

export interface BarsChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "prefix" | "onChange"> {
  /** The windows the tabs switch between (default: pages published, 7D / 30D / 12M). */
  ranges?: BarsRange[];
  /** Which window opens first (default: the first). */
  defaultRange?: string;
  /** Unit after the figure, at the quiet size (default "pages"). */
  unit?: ReactNode;
  /** Before the figure, e.g. "$". */
  prefix?: ReactNode;
  /** Fraction digits of the figure. */
  digits?: number;
  /** Height of the bars' plot in px (default 120). */
  plotHeight?: number;
  /** Card corner in px (default 26). */
  corner?: number;
}

export function BarsChart({
  ranges = BARS_DEMO,
  defaultRange,
  unit = "pages",
  prefix,
  digits = 0,
  plotHeight = 120,
  corner,
  className,
  ...rest
}: BarsChartProps) {
  const [rangeId, setRangeId] = useState(defaultRange ?? ranges[0]?.id ?? "");
  const range = ranges.find((r) => r.id === rangeId) ?? ranges[0];
  const bars = range?.bars ?? [];
  const values = bars.map((b) => b.value);
  const n = values.length;
  const last = n - 1;

  const sound = useSound();
  const root = useRef<HTMLDivElement>(null);
  const { u, bind } = useScrub(values, { snap: true });
  const [kbd, setKbd] = useState<number | null>(null);
  const [squish, setSquish] = useState<{ i: number; k: number } | null>(null);

  const sel = u !== null ? Math.round(u) : kbd;
  const reading = sel !== null && sel >= 0 && sel <= last ? sel : null;

  const total = values.reduce((a, b) => a + b, 0);
  const mean = n ? total / n : 0;
  const max = Math.max(1, ...values);

  const shown = reading === null ? total : values[reading];
  const change = reading === null ? (range?.previous != null ? total - range.previous : 0) : values[reading] - mean;
  const base = reading === null ? range?.previous : mean;
  const pct = base ? (change / base) * 100 : undefined;
  const trendUp = (range?.previous != null ? total - range.previous : values[last] - values[0]) >= 0;
  // the colour answers the line it sits under: the window's trend at rest, the bar's own delta while read
  const up = reading === null ? trendUp : change >= 0;

  /* ── the heap, heard ─────────────────────────────────────────
     Only when the window is CHANGED — a page that makes a sound
     on load is a page people mute. One notch per landing, at the
     moment of impact, pitched by the bar's height; the sound's own
     rate limit turns thirty landings into a patter rather than a
     burst. */
  const changed = useRef(false);
  useEffect(() => {
    if (!changed.current || isCalm(root.current)) return;
    const timers = values.map((v, i) =>
      window.setTimeout(
        () => {
          if (i === 0) sound.play("drop", { strength: 0.35 });
          else sound.detent(0.32, { pitch: Math.pow(1.5, (v / max) * 2 - 1) });
        },
        delayOf(i, n) + FALL_MS * IMPACT,
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
    // replay per window, not per render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeId]);

  const poke = useCallback(
    (i: number) => {
      setSquish((s) => ({ i, k: (s?.k ?? 0) + 1 }));
      sound.play("tap", {
        strength: 0.55,
        pitch: Math.pow(1.5, (values[i] / max) * 2 - 1),
      });
    },
    [sound, values, max],
  );

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = kbd ?? (e.key === "ArrowLeft" ? n : -1);
    let to: number | null = null;
    if (e.key === "ArrowRight") to = Math.min(last, from + 1);
    else if (e.key === "ArrowLeft") to = Math.max(0, from - 1);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = last;
    else if (e.key === "Escape") {
      setKbd(null);
      return;
    } else if ((e.key === "Enter" || e.key === " ") && kbd !== null) {
      e.preventDefault();
      poke(kbd);
      return;
    } else return;
    e.preventDefault();
    if (to !== kbd) sound.detent(0.5, { pitch: Math.pow(1.5, (values[to] / max) * 2 - 1) });
    setKbd(to);
  };

  const gap = n <= 7 ? 10 : n <= 12 ? 6 : 3;

  return (
    <ChartCard ref={root} corner={corner} data-slot="bars-chart" className={cn(lineColor(up), className)} {...rest}>
      <div className="text-ink">
        <ChartFigure value={shown} digits={digits} prefix={prefix} unit={unit} />
        <ChartDelta
          change={change}
          digits={digits}
          pct={pct}
          when={reading === null ? range?.span : bars[reading].label}
        />
      </div>

      {/* The plot reads the pointer as one strip (useScrub, snapped to bars), so a finger
          dragged along it works the same as a mouse — the bars themselves never listen. */}
      <div
        data-slot="bars-plot"
        role="group"
        tabIndex={0}
        aria-label={`${range?.span ?? ""}, ${n} bars. Arrow keys read each one.`}
        onKeyDown={onKey}
        onBlur={() => setKbd(null)}
        onClick={() => reading !== null && poke(reading)}
        className={cn(
          "relative mt-3 cursor-default touch-pan-y rounded-[10px]",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4",
        )}
        style={
          {
            height: plotHeight + 12,
            "--fall": `${plotHeight + 24}px`,
          } as CSSProperties
        }
        {...bind}
      >
        {/* pt-3 of headroom inside the clip: the tallest bar's 9px rebound stays visible, and
            anything higher is out of sight — the bars fall from above the plot, not across the
            figure. clip-path rather than overflow: it cuts only the top edge, so the impact
            squash at the sides is left alone (and it sits on this inner row, not the plot,
            so it cannot cut the focus ring either). */}
        <div className="flex items-end h-full pt-3 [clip-path:inset(0_-12px_-12px_-12px)]" style={{ gap }}>
          {/* keyed by window: a new window is a new pile, so the drop replays */}
          {bars.map((b, i) => {
            const on = reading === i;
            const jelly = squish?.i === i;
            return (
              <div
                key={`${range?.id}-${i}`}
                data-slot="bars-col"
                className={cn(
                  "flex-1 min-w-0 h-full flex items-end justify-center origin-bottom",
                  "fun:animate-[rap-bars-drop_720ms_both]",
                )}
                style={{ animationDelay: `${delayOf(i, n)}ms` }}
              >
                <div
                  key={jelly ? `j${squish.k}` : "b"}
                  data-slot="bars-bar"
                  data-on={on || undefined}
                  className={cn(
                    // 14px at most: a week is seven slim pills with air between, not seven slabs
                    "w-full max-w-[14px] min-h-1.5 rounded-pill origin-bottom transition-colors duration-150",
                    // at rest the bars are pencil-grey and only the latest is in colour — "now",
                    // tied to the delta above it; while reading, the bar under you takes the
                    // colour and everything else steps further back
                    reading === null ? (i === last ? "bg-current" : "bg-ink/13") : on ? "bg-current" : "bg-ink/7",
                    jelly && "fun:animate-[rap-bars-jelly_560ms_both]",
                  )}
                  style={{ height: `${(b.value / max) * 100}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* what a screen reader hears while the arrow keys walk the bars */}
      <span className="sr-only" aria-live="polite">
        {kbd !== null && bars[kbd] ? `${bars[kbd].label}: ${bars[kbd].value}` : ""}
      </span>

      <ChartTabs
        aria-label="Window"
        options={ranges.map((r) => ({ id: r.id, label: r.tab }))}
        value={range?.id ?? ""}
        onChange={(id) => {
          changed.current = true;
          setKbd(null);
          setSquish(null);
          setRangeId(id);
        }}
        className="text-ink"
      />
    </ChartCard>
  );
}

/* the stagger: ≤55ms a bar, the row under way within ~0.5s, plus a fixed jitter per position */
function delayOf(i: number, n: number) {
  const step = Math.min(55, 480 / Math.max(1, n));
  return Math.round(i * step + ((i * 37) % 5) * 8);
}
