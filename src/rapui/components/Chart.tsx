import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Area, Bar, Line, ResponsiveContainer, Tooltip, type TooltipContentProps } from "recharts";
import { cn, prefersReducedMotion } from "../utils";
import "./Chart.css";

/* ── Chart ─────────────────────────────────────────────────
   Delight: the chart is drawn in front of you, once.

   Lines are drawn by a pen: each curve gets pathLength=1 and
   its dash offset runs 1 → 0 over 1.3s (eased in and out, like a
   hand), so the line leaves the y-axis and travels right, the fill
   rising in behind it. Bars grow out of the baseline one after
   another (35ms apart, left to right) and overshoot by 10%
   before settling — a row of springs let go, not a progress
   bar. The tooltip follows the pointer on an overshooting ease
   instead of Recharts' plain slide.

   Recharts' own tween is switched off for Bar / Area / Line
   (unless you set `isAnimationActive` yourself) because both
   running at once reads as a stutter. The intro plays on mount
   and again whenever the set of series changes (a type switch,
   a series toggled on), then gets out of the way: data updates
   after that just redraw. `data-intro` on the container is the
   window during which CSS may animate; Recharts may rebuild bar
   nodes when it measures, and inside the window they simply
   start their grow again.

   Calm / reduced motion: no intro, the chart is just there. */

const isCalm = (el: Element | null) => prefersReducedMotion() || !!el?.closest('[data-rap-motion="calm"]');
const TWEENED = new Set<unknown>([Area, Bar, Line]);
/** how long the intro window stays open: the longest bar stagger + its grow */
const INTRO_MS = 1500;

function typeName(t: unknown): string {
  if (typeof t === "string") return t;
  const f = t as { displayName?: string; name?: string; render?: { name?: string } } | null;
  return f?.displayName ?? f?.name ?? f?.render?.name ?? "";
}

function setRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** Series settings keyed by dataKey. `color` is any CSS colour, ideally a token: "var(--rap-blue)". */
export type ChartConfig = Record<string, { label?: ReactNode; color?: string }>;

const ChartContext = createContext<ChartConfig>({});
export const useChartConfig = () => useContext(ChartContext);

export interface ChartContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  config: ChartConfig;
  /** A single recharts chart (<AreaChart>, <BarChart>…). */
  children: ReactElement;
  /** Height of the plot, px or any CSS length. */
  height?: number | string;
}

/**
 * Themes a recharts chart: exposes each series colour as `--color-<key>` (use
 * `fill="var(--color-pages)"`), paints grid, ticks and cursor from tokens, and makes it responsive.
 */
export const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(function ChartContainer(
  { config, children, height = 260, className, style, ...rest },
  ref,
) {
  const vars: Record<string, string> = {};
  for (const [key, v] of Object.entries(config)) if (v.color) vars[`--color-${key}`] = v.color;

  const box = useRef<HTMLDivElement | null>(null);
  const [intro, setIntro] = useState(false);

  // our own intro replaces Recharts' tween on the series it draws
  const series = Children.toArray((children.props as { children?: ReactNode }).children).filter(isValidElement);
  const signature = [
    typeName(children.type),
    ...series.map((c) => `${typeName(c.type)}:${String((c.props as { dataKey?: unknown }).dataKey ?? "")}`),
  ].join("|");
  const chart = cloneElement(children as ReactElement<{ children?: ReactNode }>, {
    children: Children.map((children.props as { children?: ReactNode }).children, (c) =>
      isValidElement(c) && TWEENED.has(c.type) && (c.props as { isAnimationActive?: unknown }).isAnimationActive === undefined
        ? cloneElement(c as ReactElement<{ isAnimationActive?: boolean }>, { isAnimationActive: false })
        : c,
    ),
  });

  useLayoutEffect(() => {
    if (isCalm(box.current)) return;
    setIntro(true);
    const t = window.setTimeout(() => setIntro(false), INTRO_MS);
    return () => window.clearTimeout(t);
  }, [signature]);

  // while the window is open, give every curve a unit length so CSS can draw it
  useEffect(() => {
    const el = box.current;
    if (!intro || !el) return;
    const mark = () =>
      el.querySelectorAll<SVGPathElement>(".recharts-area-curve, .recharts-line-curve").forEach((p) => {
        if (p.getAttribute("pathLength") !== "1") {
          p.setAttribute("pathLength", "1");
          p.setAttribute("data-pen", "");
        }
      });
    mark();
    const mo = new MutationObserver(mark);
    mo.observe(el, { subtree: true, childList: true });
    return () => {
      mo.disconnect();
      el.querySelectorAll(".recharts-area-curve, .recharts-line-curve").forEach((p) => {
        p.removeAttribute("pathLength");
        p.removeAttribute("data-pen");
      });
    };
  }, [intro]);

  return (
    <ChartContext.Provider value={config}>
      <div
        ref={(el) => {
          box.current = el;
          setRef(ref, el);
        }}
        data-slot="chart"
        className={cn(
          "relative w-full min-w-0 font-sans tabular-nums",
          "[&_.recharts-surface]:overflow-visible [&_.recharts-wrapper:focus]:outline-none [&_.recharts-surface:focus]:outline-none",
          // token-driven chrome: CSS beats the SVG presentation attributes recharts writes
          "[&_.recharts-cartesian-grid_line]:stroke-line",
          "[&_.recharts-cartesian-axis-tick-value]:fill-mute [&_.recharts-cartesian-axis-tick-value]:font-sans",
          "[&_.recharts-cartesian-axis-tick-value]:text-[12px] [&_.recharts-cartesian-axis-tick-value]:tracking-[-0.01em]",
          "[&_.recharts-cartesian-axis-tick-value_tspan]:fill-mute [&_.recharts-cartesian-axis-tick-value_tspan]:font-sans",
          "[&_.recharts-cartesian-axis-tick-value_tspan]:text-[12px] [&_.recharts-cartesian-axis-tick-value_tspan]:tracking-[-0.01em]",
          "[&_:is(.recharts-cartesian-axis-line,.recharts-cartesian-axis-tick-line)]:stroke-line",
          "[&_.recharts-tooltip-cursor]:stroke-fill-strong [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-fill [&_.recharts-rectangle.recharts-tooltip-cursor]:stroke-none",
          "[&_.recharts-active-dot_circle]:stroke-surface [&_.recharts-reference-line_line]:stroke-fill-strong",
          className,
        )}
        style={{ height, ...vars, ...style } as CSSProperties}
        data-intro={intro ? "" : undefined}
        {...rest}
      >
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 260 }}>
          {chart}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});

export const ChartTooltip = Tooltip;

const SWATCH = "flex-none size-2 rounded-full";

export interface ChartTooltipContentProps extends Partial<TooltipContentProps> {
  /** Format each value, e.g. (v) => `${v} pages`. */
  valueFormatter?: (value: number | string) => ReactNode;
  /** Format the heading (the x value). */
  labelFormatter?: (label: ReactNode) => ReactNode;
  hideLabel?: boolean;
}

/** Tooltip body in rap/ui's floating-surface style. Use as `<ChartTooltip content={<ChartTooltipContent />} />`. */
export function ChartTooltipContent({ active, payload, label, valueFormatter, labelFormatter, hideLabel }: ChartTooltipContentProps) {
  const config = useChartConfig();
  if (!active || !payload?.length) return null;
  return (
    // the floating surface, minus its entrance: the tooltip is always there, it only moves
    <div
      data-slot="chart-tooltip"
      className="pop flex flex-col gap-1 min-w-36 py-[0.6rem] px-[0.8rem] rounded-[16px] text-[0.8125rem] tracking-[-0.01em] animate-none"
    >
      {!hideLabel && label != null && (
        <div data-slot="chart-tooltip-label" className="font-medium text-ink mb-0.5">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? "");
        const c = config[key];
        const color = c?.color ?? item.color ?? item.stroke ?? item.fill;
        const v = item.value as number | string | undefined;
        return (
          <div data-slot="chart-tooltip-row" className="flex items-center gap-2 text-ink-2" key={key}>
            <span data-slot="chart-swatch" className={SWATCH} style={{ background: color }} />
            <span data-slot="chart-tooltip-name">{c?.label ?? item.name}</span>
            <span data-slot="chart-tooltip-value" className="ml-auto pl-4 font-medium text-ink tabular-nums">{v == null ? "—" : valueFormatter ? valueFormatter(v) : v}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Legend row: coloured dots + labels. Inside a ChartContainer it reads that config;
 * outside one (e.g. under the chart) pass `config`.
 */
export function ChartLegend({ config: own, className, ...rest }: HTMLAttributes<HTMLDivElement> & { config?: ChartConfig }) {
  const ctx = useChartConfig();
  const config = own ?? ctx;
  return (
    <div
      data-slot="chart-legend"
      className={cn("flex flex-wrap gap-4 font-sans text-[0.8125rem] font-medium text-ink-2 tracking-[-0.01em]", className)}
      {...rest}
    >
      {Object.entries(config).map(([key, v]) => (
        <span data-slot="chart-legend-item" className="inline-flex items-center gap-[0.45rem]" key={key}>
          <span data-slot="chart-swatch" className={SWATCH} style={{ background: v.color }} />
          {v.label ?? key}
        </span>
      ))}
    </div>
  );
}

/** Spread onto <XAxis>/<YAxis>: no axis line, no tick marks, small muted labels. */
export const chartAxisProps = {
  axisLine: false,
  tickLine: false,
  tickMargin: 10,
  tick: { fontSize: 12 },
} as const;

/** Spread onto <CartesianGrid>: horizontal hairlines only. */
export const chartGridProps = { vertical: false, strokeDasharray: "0" } as const;
