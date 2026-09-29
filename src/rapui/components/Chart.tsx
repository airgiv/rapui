import { createContext, forwardRef, useContext, type CSSProperties, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { ResponsiveContainer, Tooltip, type TooltipContentProps } from "recharts";
import { cx } from "../utils";
import "./Chart.css";

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
  return (
    <ChartContext.Provider value={config}>
      <div ref={ref} className={cx("rap-chart", className)} style={{ height, ...vars, ...style } as CSSProperties} {...rest}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 260 }}>
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});

export const ChartTooltip = Tooltip;

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
    <div className="rap-pop rap-chart-tip">
      {!hideLabel && label != null && <div className="rap-chart-tip__label">{labelFormatter ? labelFormatter(label) : label}</div>}
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? "");
        const c = config[key];
        const color = c?.color ?? item.color ?? item.stroke ?? item.fill;
        const v = item.value as number | string | undefined;
        return (
          <div className="rap-chart-tip__row" key={key}>
            <span className="rap-chart-tip__swatch" style={{ background: color }} />
            <span className="rap-chart-tip__name">{c?.label ?? item.name}</span>
            <span className="rap-chart-tip__value">{v == null ? "—" : valueFormatter ? valueFormatter(v) : v}</span>
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
    <div className={cx("rap-chart-legend", className)} {...rest}>
      {Object.entries(config).map(([key, v]) => (
        <span className="rap-chart-legend__item" key={key}>
          <span className="rap-chart-tip__swatch" style={{ background: v.color }} />
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
