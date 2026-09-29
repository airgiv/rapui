/* ══ RaceBars ═══════════════════════════════════════════════
   A ranking — where the visits came from, which pages were read —
   as a short stack of thin rounded bars with their labels and
   values, in a ChartCard with the total as the figure.

   THE DELIGHT: change the period and the rows RACE. Every row is
   positioned by a spring on its rank, so a source that climbed
   from fifth to second physically overtakes the three above it,
   and the ones moving fastest squash a little along their travel
   — a bar is a thing with mass, not a sorted list redrawn. Widths
   spring to their new share and the numbers count there. When a
   new leader arrives at the top it gives a small hop, the only
   moment in the chart that is about a winner.

   The numbers, and why:
   - 34px a row: the 12.5px label line, 7px gap, a 6px bar and air
     — BalanceChart's tab height plus a hair, so the two cards
     share a vertical rhythm.
   - bar 6px, fully round: thin enough to be a line with a length
     rather than a block, thick enough to hover. ink 0.86 on a 0.07
     track: the ChartTabs pill's wash is the "empty" here too.
   - position spring tune 55 (one soft overshoot: they arrive, not
     slam), width 40, number 26 (it counts, it never rebounds —
     a number that goes past its value has lied for a frame).
   - squash: the lag between a row's target and where it is, 7% of
     scaleY per row-height of lag, capped at 18% — visible on the
     one that jumps three places, invisible on a neighbour swap.
   - hover dims the others to 0.3: the row you are on stays exactly
     as it was; everything else steps back.

   Sound: one pop when a period change reorders the rows (a pop
   per row would be applause); a detent on hover, higher for a
   higher rank, so running down the list is a falling scale. */
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../utils";
import { useSound } from "../sound";
import { useSpring } from "../hooks/useSpring";
import { isCalm } from "../hooks/useGlide";
import { ChartCard, ChartDelta, ChartFigure, ChartTabs } from "./ChartKit";

export interface RaceBarsItem {
  id: string;
  label: ReactNode;
  value: number;
  /** Same source, previous period: drives the change line. */
  prev?: number;
}

export interface RaceBarsPeriod {
  id: string;
  /** The tab's label. */
  label: string;
  items: RaceBarsItem[];
  /** The quiet half of the change line at rest ("vs previous 30 days"). */
  when?: string;
}

export interface RaceBarsProps extends HTMLAttributes<HTMLDivElement> {
  periods?: RaceBarsPeriod[];
  /** Period shown first (id). */
  defaultPeriod?: string;
  /** After the figure, quiet. */
  unit?: string;
  /** How many rows to show (the rest are left out of the race). */
  rows?: number;
  corner?: number;
}

const ROW = 34;

export const RaceBars = forwardRef<HTMLDivElement, RaceBarsProps>(function RaceBars(
  { periods = DEMO, defaultPeriod, unit = "visits", rows = 6, corner, className, ...rest },
  ref,
) {
  const [periodId, setPeriodId] = useState(defaultPeriod ?? periods[0]?.id);
  const period = periods.find((p) => p.id === periodId) ?? periods[0];
  const sound = useSound();
  const list = useRef<HTMLDivElement | null>(null);
  const calm = isCalm(list.current);
  const [hover, setHover] = useState<string | null>(null);

  const ranked = [...(period?.items ?? [])].sort((a, b) => b.value - a.value).slice(0, Math.max(1, rows));
  const top = Math.max(1, ranked[0]?.value ?? 1);
  const total = ranked.reduce((s, r) => s + r.value, 0);
  const prevTotal = ranked.every((r) => r.prev != null) ? ranked.reduce((s, r) => s + (r.prev ?? 0), 0) : null;
  const order = ranked.map((r) => r.id).join("|");

  /* the pop, and the leader's hop: only when the ORDER changed,
     compared with the order last shown */
  const was = useRef(order);
  const [crown, setCrown] = useState<{ id: string; n: number } | null>(null);
  useEffect(() => {
    if (was.current === order) return;
    const before = was.current.split("|");
    was.current = order;
    sound.play("pop", { strength: 0.5 });
    const lead = order.split("|")[0];
    if (lead !== before[0]) setCrown((c) => ({ id: lead, n: (c?.n ?? 0) + 1 }));
  }, [order, sound]);

  const hovered = ranked.find((r) => r.id === hover) ?? null;
  /* the total counts when the period changes; a hovered row's value
     is shown as it is — reading back, the number and the row agree
     at once (the scrub rule from ChartKit) */
  const rolled = useSpring(total, 26, calm);
  const shown = hovered ? hovered.value : rolled;

  return (
    <ChartCard ref={ref} corner={corner} data-slot="race-bars" className={cn("w-full max-w-80", className)} {...rest}>
      <div data-slot="race-bars-readout" aria-live="polite">
        <ChartFigure value={Math.round(shown)} unit={unit} />
        {hovered ? (
          /* the row's own line: its change on the last period, and its
             share of the total as the quiet half */
          <ChartDelta
            change={hovered.prev != null ? hovered.value - hovered.prev : 0}
            format={hovered.prev != null ? undefined : () => ""}
            when={
              <>
                {hovered.label} · {((hovered.value / (total || 1)) * 100).toFixed(1)}% share
              </>
            }
          />
        ) : (
          <ChartDelta
            change={prevTotal != null ? total - prevTotal : 0}
            format={prevTotal != null ? undefined : () => ""}
            pct={prevTotal ? ((total - prevTotal) / prevTotal) * 100 : undefined}
            when={period?.when}
          />
        )}
      </div>

      <div
        ref={list}
        data-slot="race-bars-list"
        data-hovering={hover != null || undefined}
        role="list"
        aria-label="Ranking"
        className="group/race relative mt-5"
        style={{ height: ranked.length * ROW }}
        onPointerLeave={() => setHover(null)}
      >
        {ranked.map((r, rank) => (
          <RaceRow
            key={r.id}
            item={r}
            rank={rank}
            count={ranked.length}
            width={(r.value / top) * 100}
            on={hover === r.id}
            dim={hover != null && hover !== r.id}
            calm={calm}
            hop={crown?.id === r.id ? crown.n : 0}
            onEnter={() => {
              if (hover === r.id) return;
              setHover(r.id);
              sound.detent(0.45, { pitch: 1.5 - (rank / Math.max(1, ranked.length - 1)) * 0.7 });
            }}
            onLeave={() => setHover((h) => (h === r.id ? null : h))}
          />
        ))}
      </div>

      {periods.length > 1 && (
        <ChartTabs
          aria-label="Period"
          options={periods.map((p) => ({ id: p.id, label: p.label }))}
          value={period.id}
          onChange={(id) => {
            setHover(null);
            setPeriodId(id);
          }}
        />
      )}
    </ChartCard>
  );
});

function RaceRow({
  item,
  rank,
  count,
  width,
  on,
  dim,
  calm,
  hop,
  onEnter,
  onLeave,
}: {
  item: RaceBarsItem;
  rank: number;
  count: number;
  width: number;
  on: boolean;
  dim: boolean;
  calm: boolean;
  hop: number;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const y = useSpring(rank * ROW, 55, calm);
  const w = useSpring(width, 40, calm);
  const n = useSpring(item.value, 26, calm);
  /* squash by lag: how far behind its new rank the row still is */
  const lag = Math.abs(rank * ROW - y) / ROW;
  const squash = Math.min(0.18, lag * 0.07);
  const moving = lag > 0.05;

  return (
    <div
      role="listitem"
      data-slot="race-bars-row"
      data-rank={rank + 1}
      data-on={on || undefined}
      tabIndex={0}
      onPointerEnter={onEnter}
      onFocus={onEnter}
      onBlur={onLeave}
      className={cn(
        "absolute inset-x-0 top-0 flex flex-col justify-center gap-[7px] rounded-[10px] outline-none cursor-default",
        "transition-opacity duration-200 ease-soft",
        dim ? "opacity-30" : "opacity-100",
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
      )}
      /* rows moving up pass OVER the ones moving down */
      style={{ height: ROW, transform: `translateY(${y.toFixed(2)}px)`, zIndex: moving ? count - rank + 1 : 0 }}
    >
      {/* the hop lives on its own wrapper, keyed by the crowning, so
          a new leader remounts it and the keyframe plays once */}
      <div key={hop} className={cn("flex flex-col gap-[7px]", hop > 0 && "fun:animate-hop fun:[animation-delay:260ms]")}>
        <div className="flex items-baseline justify-between gap-3 text-[12.5px] font-medium leading-none">
          <span data-slot="race-bars-label" className="truncate">
            <span aria-hidden className="mr-2 inline-block w-3 tabular-nums text-ink/35">
              {rank + 1}
            </span>
            {item.label}
          </span>
          <span data-slot="race-bars-value" className="tabular-nums text-ink/55">
            {Math.round(n).toLocaleString("en-GB")}
          </span>
        </div>
        <div data-slot="race-bars-track" className="relative h-1.5 rounded-pill bg-ink/7">
          <i
            data-slot="race-bars-bar"
            className={cn("absolute inset-y-0 left-0 rounded-pill", on ? "bg-ink" : "bg-ink/86")}
            style={{
              /* clamped: the spring may overshoot, the bar may not leave its track */
              width: `${Math.min(100, Math.max(1.5, w)).toFixed(2)}%`,
              /* the squash: thinner and a touch longer along the travel */
              scale: squash ? `${(1 + squash * 0.25).toFixed(3)} ${(1 - squash).toFixed(3)}` : undefined,
              transformOrigin: "left center",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── demo data ───────────────────────────────────────────────
   Where visitors to a studio's Readymag portfolio came from. The
   week is a Behance feature (it jumps from fifth to first), the
   month is newsletter-led after an issue went out, the quarter is
   the steady state: search and direct on top. */
const DEMO: RaceBarsPeriod[] = [
  {
    id: "7d",
    label: "7D",
    when: "vs previous 7 days",
    items: [
      { id: "behance", label: "Behance", value: 3920, prev: 610 },
      { id: "google", label: "Google", value: 2140, prev: 1985 },
      { id: "direct", label: "Direct", value: 1760, prev: 1702 },
      { id: "instagram", label: "Instagram", value: 1180, prev: 1320 },
      { id: "newsletter", label: "Newsletter", value: 540, prev: 488 },
      { id: "pinterest", label: "Pinterest", value: 415, prev: 452 },
    ],
  },
  {
    id: "30d",
    label: "30D",
    when: "vs previous 30 days",
    items: [
      { id: "newsletter", label: "Newsletter", value: 9310, prev: 2240 },
      { id: "google", label: "Google", value: 8470, prev: 8105 },
      { id: "direct", label: "Direct", value: 6980, prev: 7210 },
      { id: "behance", label: "Behance", value: 5650, prev: 2380 },
      { id: "instagram", label: "Instagram", value: 4870, prev: 5030 },
      { id: "pinterest", label: "Pinterest", value: 1920, prev: 1760 },
    ],
  },
  {
    id: "90d",
    label: "90D",
    when: "vs previous 90 days",
    items: [
      { id: "google", label: "Google", value: 25_300, prev: 22_840 },
      { id: "direct", label: "Direct", value: 21_150, prev: 20_470 },
      { id: "instagram", label: "Instagram", value: 15_020, prev: 16_880 },
      { id: "newsletter", label: "Newsletter", value: 13_640, prev: 7_950 },
      { id: "behance", label: "Behance", value: 10_480, prev: 6_120 },
      { id: "pinterest", label: "Pinterest", value: 5_760, prev: 5_210 },
    ],
  },
];
