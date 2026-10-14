/* ══ StockChart ════════════════════════════════════════════
   One instrument's price, the way a trading screen shows it: the
   symbol and name, the last price large, the change for the range in
   the trend colour, range tabs (1D 1W 1M 3M 1Y ALL), the chart as a
   line, an area or OHLC candles, a dashed previous-close line, and the
   day's volume as a band of bars underneath.

     <StockChart symbol="NRTH" name="Northwind Energy" series={{ "1D": [...], "1M": [...] }} type="candles" />

   It speaks ChartKit's language — the card, the 2.1px Catmull-Rom
   line in chart-up / chart-down, the travelling-pill tabs, the hollow
   ring that rides the line — with two differences a market chart
   needs: the svg is drawn at its MEASURED pixel width (ResizeObserver)
   rather than stretched, so every hairline (wicks, the previous close,
   the crosshair) sits on a whole pixel and stays crisp; and readings
   sit in slots, so a candle and a point of the line at the same index
   are at the same x.

   Reading it: run a pointer or a finger along the plot, or focus it and
   use the arrow keys (Shift for ten at a time, Home / End, Esc to let
   go). A crosshair follows; the header becomes the price under it, the
   change from the start of the range, and its time — and, for
   candles, the bar's open/high/low/close and volume. The arrow keys
   are read out in a polite live region.

   THE DELIGHT is a pen and a spring. Change the range and the line is
   drawn in left to right while the candles, volume and area fill are
   uncovered in step with it; start reading and the ring springs onto
   the line (a third past full, back); the latest price breathes at
   the end of the line, the way the Sparkline's does. All behind fun:.
   Calm: a range change is a crossfade, old range out as the new one
   comes in; the ring simply appears. */
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn, prefersReducedMotion } from "../utils";
import { useSound } from "../sound";
import { formatMoney, formatNumber, formatPercent, moneyParts } from "../finance";
import { ChartCard, ChartTabs, curve, lineColor, valueAt } from "./ChartKit";
import { isMotionCalm } from "./FormField";
import { spokenMoney } from "./Money";
import "./StockChart.css";

export type StockRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";
export const STOCK_RANGES: readonly StockRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

export interface StockPoint {
  /** Time, ms since the epoch. */
  t: number;
  /** Open, high, low — needed for candles; a line uses only the close. */
  o?: number;
  h?: number;
  l?: number;
  /** Close (the price, for a line). */
  c: number;
  /** Volume, shares traded in this bar. */
  v?: number;
}

export type StockChartType = "line" | "area" | "candles";

export interface StockChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Ticker: "NRTH". */
  symbol: string;
  /** Company name, beside the ticker. */
  name?: string;
  /** The readings per range, oldest first. Ranges with no data get no tab. */
  series: Partial<Record<StockRange, StockPoint[]>>;
  /** Controlled range. */
  range?: StockRange;
  /** Starting range when uncontrolled (default: the first one with data). */
  defaultRange?: StockRange;
  onRangeChange?: (range: StockRange) => void;
  /** ISO 4217 code (default "USD"). */
  currency?: string;
  /** BCP 47 locale; the browser's by default. */
  locale?: string;
  /** IANA time zone for the times read back (default: the viewer's). */
  timeZone?: string;
  /** line, area or OHLC candles (default "line"). */
  type?: StockChartType;
  /** Plot height in px, volume band included (default 220). */
  height?: number;
  /** Draw the volume band (default true; only shown when the data has volume). */
  volume?: boolean;
  /** Yesterday's close: the 1D range is measured from it and draws it dashed. */
  previousClose?: number;
  /** Card corner in px (default 26). */
  corner?: number;
}

const SPAN: Record<StockRange, string> = {
  "1D": "Today",
  "1W": "Past week",
  "1M": "Past month",
  "3M": "Past 3 months",
  "1Y": "Past year",
  ALL: "All time",
};

const WHEN: Record<StockRange, Intl.DateTimeFormatOptions> = {
  "1D": { hour: "numeric", minute: "2-digit" },
  "1W": { weekday: "short", hour: "numeric", minute: "2-digit" },
  "1M": { weekday: "short", day: "numeric", month: "short" },
  "3M": { day: "numeric", month: "short" },
  "1Y": { day: "numeric", month: "short", year: "numeric" },
  ALL: { month: "short", year: "numeric" },
};

/* air above the high and below the low, inside the price band */
const PAD = 10;
/* between the price band and the volume band */
const VOL_GAP = 8;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/* a 1px line on a pixel boundary is two half-lit rows; on a half pixel it is one */
const crisp = (v: number) => Math.round(v) + 0.5;

/* what the range is measured from: yesterday's close on 1D, else where the range starts */
function baseOf(range: StockRange, data: StockPoint[], previousClose?: number) {
  if (!data.length) return 0;
  if (range === "1D" && previousClose != null) return previousClose;
  return range === "1D" ? (data[0].o ?? data[0].c) : data[0].c;
}

const up = (p: StockPoint, prev?: StockPoint) => p.c >= (p.o ?? prev?.c ?? p.c);

/* ── the geometry of one range ─────────────────────────────────
   Every reading owns a SLOT of width w/n and sits at its centre, so the line and
   the candles agree on x. curve() draws edge to edge across the width it is given,
   so it is given w − slot and shifted half a slot right: the same centres. */
function geometry(data: StockPoint[], w: number, height: number, type: StockChartType, showVol: boolean, base: number) {
  const n = data.length;
  const last = Math.max(0, n - 1);
  const slot = n ? w / n : w;
  const hasVol = showVol && data.some((p) => p.v != null);
  const volH = hasVol ? Math.round(height * 0.2) : 0;
  const priceH = height - (hasVol ? volH + VOL_GAP : 0);
  const closes = data.map((p) => p.c);
  const highs = type === "candles" ? data.map((p) => p.h ?? Math.max(p.o ?? p.c, p.c)) : closes;
  const lows = type === "candles" ? data.map((p) => p.l ?? Math.min(p.o ?? p.c, p.c)) : closes;
  const lo = Math.min(base, ...lows);
  const hi = Math.max(base, ...highs);
  const yOf = (v: number) => PAD + (1 - (v - lo) / (hi - lo || 1)) * (priceH - PAD * 2);
  const xOf = (i: number) => slot / 2 + (n > 1 ? (i / last) * (w - slot) : (w - slot) / 2);
  const line = n ? curve(closes.length > 1 ? closes : [closes[0], closes[0]], Math.max(1, w - slot), priceH, PAD, [lo, hi]) : null;
  // bodies: ~62% of the slot, never more than 12px, at least one pixel — snapped to whole pixels
  const bw = Math.max(1, Math.min(12, Math.round(slot * 0.62)));
  const maxV = Math.max(1, ...data.map((p) => p.v ?? 0));
  return { n, last, slot, hasVol, volH, priceH, volTop: priceH + VOL_GAP, closes, lo, hi, yOf, xOf, line, bw, maxV };
}
type Geometry = ReturnType<typeof geometry>;

/* ── the drawing of one range (also used for the range fading out) ── */
function Drawing({
  data,
  g,
  w,
  height,
  type,
  className,
  entering,
  wash,
}: {
  data: StockPoint[];
  g: Geometry;
  w: number;
  height: number;
  type: StockChartType;
  className?: string;
  /** the entering range: draw it in (fun) or fade it in (calm) */
  entering?: boolean;
  /** a page-unique id for the area's gradient */
  wash: string;
}) {
  const shift = `translate(${(g.slot / 2).toFixed(2)} 0)`;
  return (
    <div
      aria-hidden
      data-slot="stock-drawing"
      className={cn(
        "absolute inset-0 pointer-events-none",
        entering && "calm:motion-safe:animate-[rap-stock-in_var(--rap-dur)_var(--rap-ease-out)_both]",
        className,
      )}
    >
      {/* the wiped layer: candles, volume, area fill — uncovered in step with the pen */}
      <svg
        width={w}
        height={height}
        className={cn("absolute inset-0 block overflow-visible", entering && "fun:animate-[rap-stock-wipe_900ms_cubic-bezier(0.45,0.05,0.25,1)_both]")}
      >
        {type === "area" && g.line && (
          <>
            <defs>
              <linearGradient id={wash} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity={0.16} />
                <stop offset="1" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path data-slot="stock-area" d={g.line.area} transform={shift} fill={`url(#${wash})`} />
          </>
        )}
        {type === "candles" &&
          data.map((p, i) => {
            const o = p.o ?? data[i - 1]?.c ?? p.c;
            const hi = p.h ?? Math.max(o, p.c);
            const lo = p.l ?? Math.min(o, p.c);
            const x = g.xOf(i);
            const top = Math.round(g.yOf(Math.max(o, p.c)));
            const bot = Math.round(g.yOf(Math.min(o, p.c)));
            return (
              <g key={i} data-slot="stock-candle" className={up(p, data[i - 1]) ? "text-chart-up" : "text-chart-down"}>
                <line
                  x1={crisp(x - 0.5)}
                  x2={crisp(x - 0.5)}
                  y1={Math.round(g.yOf(hi))}
                  y2={Math.round(g.yOf(lo))}
                  stroke="currentColor"
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
                <rect
                  x={Math.round(x - g.bw / 2)}
                  y={top}
                  width={g.bw}
                  height={Math.max(1, bot - top)}
                  rx={g.bw >= 5 ? 1 : 0}
                  fill="currentColor"
                  shapeRendering={g.bw >= 5 ? undefined : "crispEdges"}
                />
              </g>
            );
          })}
        {g.hasVol &&
          data.map((p, i) => {
            if (p.v == null) return null;
            const h = Math.max(1, Math.round((p.v / g.maxV) * g.volH));
            return (
              <rect
                key={`v${i}`}
                data-slot="stock-volume"
                x={Math.round(g.xOf(i) - g.bw / 2)}
                y={g.volTop + g.volH - h}
                width={g.bw}
                height={h}
                fill="currentColor"
                className={cn("opacity-28", up(p, data[i - 1]) ? "text-chart-up" : "text-chart-down")}
                shapeRendering="crispEdges"
              />
            );
          })}
      </svg>
      {/* the pen: one dash as long as the path (pathLength=1), pulled from 1 to 0 */}
      {type !== "candles" && g.line && (
        <svg width={w} height={height} className="absolute inset-0 block overflow-visible">
          <path
            data-slot="stock-line"
            d={g.line.d}
            transform={shift}
            pathLength={1}
            strokeDasharray={entering ? "1 1" : undefined}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(entering && "fun:animate-[rap-stock-draw_900ms_cubic-bezier(0.45,0.05,0.25,1)_both]")}
          />
        </svg>
      )}
    </div>
  );
}

/* ── the big price: the cents quieter, symbol where the locale puts it ── */
function Price({ value, currency, locale }: { value: number; currency: string; locale?: string }) {
  const m = moneyParts(value, { currency, locale });
  return (
    <p
      data-slot="stock-price"
      aria-label={spokenMoney(value, { currency, locale })}
      className="m-0 font-display text-[33px] leading-none font-medium tracking-[-0.03em] tabular-nums"
    >
      <span aria-hidden>
        {m.sign}
        {m.symbolFirst && m.symbol}
        {m.whole}
        <span className="text-[24px] opacity-[0.4]">
          {m.decimal}
          {m.fraction}
          {!m.symbolFirst && <span className="ml-1">{m.symbol}</span>}
        </span>
      </span>
    </p>
  );
}

export const StockChart = forwardRef<HTMLDivElement, StockChartProps>(function StockChart(
  {
    symbol,
    name,
    series,
    range: rangeProp,
    defaultRange,
    onRangeChange,
    currency = "USD",
    locale,
    timeZone,
    type = "line",
    height = 220,
    volume = true,
    previousClose,
    corner,
    className,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const available = STOCK_RANGES.filter((r) => (series[r]?.length ?? 0) > 0);
  const [inner, setInner] = useState<StockRange>(defaultRange ?? available[0] ?? "1D");
  const rangeId = rangeProp ?? inner;
  const data = series[rangeId] ?? [];
  const sound = useSound();
  const uid = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement | null>(null);
  const setRoot = (el: HTMLDivElement | null) => {
    root.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  /* ── measured, so hairlines land on pixels ── */
  const plot = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = plot.current;
    if (!el) return;
    setW(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const base = baseOf(rangeId, data, previousClose);
  const g = useMemo(() => geometry(data, w, height, type, volume, base), [data, w, height, type, volume, base]);
  const { n, last, closes } = g;

  /* ── the range changing: fun draws the new one in; calm crossfades ── */
  const [leaving, setLeaving] = useState<StockRange | null>(null);
  const [drawKey, setDrawKey] = useState(0);
  const prevRange = useRef(rangeId);
  // a layout effect: the old range must be back (fading) before the frame without it is painted
  useLayoutEffect(() => {
    if (prevRange.current === rangeId) return;
    const from = prevRange.current;
    prevRange.current = rangeId;
    setDrawKey((k) => k + 1);
    if (isMotionCalm(root.current) && !prefersReducedMotion()) {
      setLeaving(from);
      const t = window.setTimeout(() => setLeaving(null), 400);
      return () => window.clearTimeout(t);
    }
  }, [rangeId]);
  const leavingData = leaving ? (series[leaving] ?? []) : [];
  const leavingG = useMemo(
    () => (leaving ? geometry(leavingData, w, height, type, volume, baseOf(leaving, leavingData, previousClose)) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leaving, w, height, type, volume, previousClose],
  );

  const pickRange = (r: StockRange) => {
    setU(null);
    setKbd(null);
    if (rangeProp === undefined) setInner(r);
    onRangeChange?.(r);
  };

  /* ── the scrub ─────────────────────────────────────────────
     Pointer → fraction of the plot's own box → fractional index across the slot
     centres. A line reads continuously (the ring glides along the curve, as on
     every rap/ui chart); candles snap, because a bar is a thing, not a sample.
     One detent per reading crossed, pitched by where it sits between low and high. */
  const [u, setU] = useState<number | null>(null);
  const [kbd, setKbd] = useState<number | null>(null);
  const heard = useRef(-1);
  const detent = useCallback(
    (i: number) => {
      if (i === heard.current) return;
      heard.current = i;
      const span = g.hi - g.lo || 1;
      sound.detent(0.5, { pitch: Math.pow(1.5, ((closes[i] - g.lo) / span) * 2 - 1) });
    },
    [closes, g.hi, g.lo, sound],
  );
  const onPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!n) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / (r.width || 1)) * w;
    let at = clamp((x - g.slot / 2) / (w - g.slot || 1), 0, 1) * last;
    if (type === "candles") at = Math.round(at);
    detent(Math.round(at));
    setKbd(null);
    setU(at);
  };
  const leave = () => {
    heard.current = -1;
    setU(null);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!n) return;
    const step = e.shiftKey ? 10 : 1;
    const from = kbd ?? (e.key === "ArrowLeft" ? last + 1 : -1);
    let to: number | null = null;
    if (e.key === "ArrowRight") to = Math.min(last, from + step);
    else if (e.key === "ArrowLeft") to = Math.max(0, from - step);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = last;
    else if (e.key === "Escape" && kbd !== null) {
      setKbd(null);
      return;
    } else return;
    e.preventDefault();
    detent(to);
    setKbd(to);
  };

  /* ── what the header says ── */
  const at = u ?? kbd;
  const reading = at !== null && n > 0;
  const idx = at === null ? last : Math.round(at);
  const price = !n ? 0 : at === null || type === "candles" ? closes[idx] : valueAt(closes, at);
  const change = price - base;
  const pct = base ? (change / base) * 100 : 0;
  const restUp = (closes[last] ?? 0) >= base;
  const point = data[idx];

  const money = (v: number, sign?: boolean) => formatMoney(v, { currency, locale, sign });
  const when = (t: number) => new Intl.DateTimeFormat(locale, { ...WHEN[rangeId], timeZone }).format(t);
  const fig = (v: number) => formatNumber(v, { locale, digits: 2 });

  /* the arrow keys are heard, settled for a beat so a held key does not queue a speech per point */
  const [said, setSaid] = useState("");
  useEffect(() => {
    if (kbd === null || !data[kbd]) return;
    const p = data[kbd];
    const ch = p.c - base;
    const text = [
      when(p.t),
      spokenMoney(p.c, { currency, locale }),
      `${ch >= 0 ? "up" : "down"} ${spokenMoney(Math.abs(ch), { currency, locale })}, ${formatPercent(Math.abs((ch / (base || 1)) * 100), { locale, sign: false })}`,
      type === "candles" && p.o != null ? `open ${fig(p.o)}, high ${fig(p.h ?? p.c)}, low ${fig(p.l ?? p.c)}` : "",
      p.v != null ? `volume ${formatNumber(p.v, { locale, compact: true })}` : "",
    ]
      .filter(Boolean)
      .join(", ");
    const t = window.setTimeout(() => setSaid(text), 220);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kbd, rangeId]);

  /* a live price: when the latest close changes on its own, say so — at most every 10s */
  const lastClose = closes[last];
  const lastSaid = useRef({ at: 0, value: lastClose });
  useEffect(() => {
    if (lastClose == null || lastClose === lastSaid.current.value) return;
    const now = Date.now();
    const wait = Math.max(0, lastSaid.current.at + 10_000 - now);
    const t = window.setTimeout(() => {
      lastSaid.current = { at: Date.now(), value: lastClose };
      setSaid(`${symbol} ${spokenMoney(lastClose, { currency, locale })}`);
    }, wait);
    return () => window.clearTimeout(t);
  }, [lastClose, symbol, currency, locale]);
  useEffect(() => {
    lastSaid.current.value = closes[last];
    // a new range is not a new price
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeId]);

  /* ── the summary a screen reader gets for the plot ── */
  const summary =
    ariaLabel ??
    (n
      ? `${symbol} price, ${SPAN[rangeId].toLowerCase()}: ${money(closes[0])} to ${money(closes[last])}, ${
          restUp ? "up" : "down"
        } ${formatPercent(Math.abs(((closes[last] - base) / (base || 1)) * 100), { locale, sign: false })}${
          rangeId === "1D" && previousClose != null ? " from the previous close" : ""
        }. High ${money(g.hi)}, low ${money(g.lo)}. Arrow keys read each point.`
      : `${symbol} price, no data`);

  /* the ring and crosshair, in the plot's own pixels */
  const dot =
    reading && g.line
      ? type === "candles"
        ? { x: g.xOf(idx), y: g.yOf(closes[idx]) }
        : (() => {
            const p = g.line!.at(at!);
            return { x: p.x + g.slot / 2, y: p.y };
          })()
      : null;
  const end = n ? { x: g.xOf(last), y: g.yOf(closes[last]) } : null;
  const baseY = crisp(g.yOf(base) - 0.5);
  const showBase = n > 0 && w > 0;

  const tabs = available.map((r) => ({ id: r, label: r }));
  const deltaUp = change >= 0;

  return (
    <ChartCard
      ref={setRoot}
      corner={corner}
      data-slot="stock-chart"
      data-type={type}
      className={cn("w-full max-w-full", className)}
      {...rest}
    >
      {/* ── the header ── */}
      <div data-slot="stock-header" className="px-1.5">
        <p className="m-0 mb-2 flex items-baseline gap-2 text-[13px] leading-tight">
          <span data-slot="stock-symbol" className="font-semibold tracking-[0.02em]">
            {symbol}
          </span>
          {name && (
            <span data-slot="stock-name" className="truncate text-mute">
              {name}
            </span>
          )}
        </p>
        <Price value={price} currency={currency} locale={locale} />
        <p
          data-slot="stock-delta"
          className={cn(
            "mt-[9px] mb-0 flex flex-wrap items-baseline gap-x-[7px] text-[12.5px] font-medium tabular-nums",
            deltaUp ? "text-chart-up" : "text-chart-down",
          )}
        >
          <span>
            {money(change, true)} ({formatPercent(pct, { locale })})
          </span>
          <span className="text-ink/45">
            {reading && point ? when(point.t) : SPAN[rangeId]}
          </span>
        </p>
        {type === "candles" && (
          <p
            data-slot="stock-ohlc"
            aria-hidden
            className="mt-1.5 mb-0 flex flex-wrap gap-x-3 text-[11.5px] tabular-nums text-ink/45 min-h-[1lh]"
          >
            {point && (
              <>
                <span>O <b className="font-medium text-ink/75">{fig(point.o ?? point.c)}</b></span>
                <span>H <b className="font-medium text-ink/75">{fig(point.h ?? point.c)}</b></span>
                <span>L <b className="font-medium text-ink/75">{fig(point.l ?? point.c)}</b></span>
                <span>C <b className="font-medium text-ink/75">{fig(point.c)}</b></span>
                {point.v != null && (
                  <span>Vol <b className="font-medium text-ink/75">{formatNumber(point.v, { locale, compact: true })}</b></span>
                )}
              </>
            )}
          </p>
        )}
      </div>

      {/* ── the plot ── */}
      <div
        ref={plot}
        data-slot="stock-plot"
        role="group"
        aria-roledescription="chart"
        tabIndex={0}
        aria-label={summary}
        onKeyDown={onKey}
        onBlur={() => setKbd(null)}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={leave}
        onPointerCancel={leave}
        data-scrub={reading || undefined}
        className={cn(
          "relative mt-4 touch-pan-y cursor-crosshair rounded-[10px]",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4",
          lineColor(restUp),
        )}
        style={{ height }}
      >
        {w > 0 && n > 0 && (
          <>
            {leaving && leavingG && leavingData.length > 0 && (
              <Drawing
                data={leavingData}
                g={leavingG}
                w={w}
                height={height}
                type={type}
                wash={`${uid}-out`}
                className={cn(
                  "animate-[rap-stock-out_var(--rap-dur)_var(--rap-ease-out)_both]",
                  (leavingData[leavingData.length - 1].c >= baseOf(leaving, leavingData, previousClose)) !== restUp &&
                    lineColor(!restUp),
                )}
              />
            )}
            <Drawing key={`${drawKey}-${type}`} data={data} g={g} w={w} height={height} type={type} wash={`${uid}-in`} entering />

            {/* the reference line: yesterday's close on 1D, the range's start otherwise */}
            <svg aria-hidden width={w} height={height} className="absolute inset-0 block pointer-events-none text-ink">
              {showBase && (
                <line
                  data-slot="stock-base"
                  x1={0}
                  x2={w}
                  y1={baseY}
                  y2={baseY}
                  stroke="currentColor"
                  strokeOpacity={0.32}
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  shapeRendering="crispEdges"
                />
              )}
              {dot && (
                <g data-slot="stock-crosshair" stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} shapeRendering="crispEdges">
                  <line x1={crisp(dot.x - 0.5)} x2={crisp(dot.x - 0.5)} y1={0} y2={height} />
                  <line x1={0} x2={w} y1={crisp(dot.y - 0.5)} y2={crisp(dot.y - 0.5)} strokeDasharray="1 2" />
                </g>
              )}
              {/* the scrubbed volume bar, at full strength */}
              {reading && g.hasVol && point?.v != null && (
                <rect
                  x={Math.round(g.xOf(idx) - g.bw / 2)}
                  y={g.volTop + g.volH - Math.max(1, Math.round((point.v / g.maxV) * g.volH))}
                  width={g.bw}
                  height={Math.max(1, Math.round((point.v / g.maxV) * g.volH))}
                  fill="currentColor"
                  className={cn("opacity-75", up(point, data[idx - 1]) ? "text-chart-up" : "text-chart-down")}
                  shapeRendering="crispEdges"
                />
              )}
            </svg>

            {showBase && (
              <span
                aria-hidden
                data-slot="stock-base-label"
                className={cn(
                  "absolute right-0 rounded-xs bg-surface/85 px-1 text-[10.5px] leading-none tabular-nums text-ink/50 pointer-events-none",
                  baseY < 16 ? "pt-1" : "-translate-y-full pb-1",
                )}
                style={{ top: baseY }}
              >
                {rangeId === "1D" && previousClose != null ? "Prev close " : "Start "}
                {money(base)}
              </span>
            )}

            {/* the latest price, breathing (lines only — a candle already marks it) */}
            {end && type !== "candles" && (
              <span
                aria-hidden
                data-slot="stock-end"
                key={`end-${drawKey}`}
                className={cn(
                  "absolute size-[6px] -m-[3px] pointer-events-none transition-opacity duration-150",
                  "fun:animate-[rap-stock-dot_420ms_cubic-bezier(0.28,1,0.4,1)_860ms_both]",
                  "calm:motion-safe:animate-[rap-stock-in_var(--rap-dur)_var(--rap-ease-out)_both]",
                  dot && "opacity-0",
                )}
                style={{ left: end.x, top: end.y }}
              >
                <i className="absolute inset-0 rounded-full bg-current" />
                <i className="absolute inset-0 rounded-full bg-current opacity-0 fun:animate-[rap-stock-breathe_2.8s_cubic-bezier(0.2,0.6,0.35,1)_1.3s_infinite]" />
              </span>
            )}

            {/* the ring: springs on in fun, simply there in calm */}
            {dot && (
              <span
                aria-hidden
                data-slot="stock-dot"
                className="absolute size-[11px] -m-[5.5px] pointer-events-none"
                style={{ left: dot.x, top: dot.y }}
              >
                <i className="absolute inset-0 rounded-full bg-surface shadow-[0_0_0_2px_currentColor] fun:animate-[rap-stock-dot_420ms_linear_both]" />
              </span>
            )}
          </>
        )}
      </div>

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {said}
      </span>

      {tabs.length > 1 && (
        <ChartTabs aria-label="Range" options={tabs} value={rangeId} onChange={pickRange} className="text-ink" />
      )}
    </ChartCard>
  );
});
