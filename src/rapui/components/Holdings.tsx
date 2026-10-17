/* ══ Holdings ══════════════════════════════════════════════
   A portfolio, one row per position: ticker and name, the day's
   Sparkline, price, the day's change in the trend colour, market
   value, and its weight in the portfolio as a short bar — with a total
   row underneath and every figure column sortable.

     <Holdings rows={[{ symbol: "NRTH", name: "Northwind Energy", shares: 120, price: 42.18, … }]} />

   It is a real <table>: headers are buttons inside <th> carrying
   aria-sort, numbers are right-aligned and tabular so a column reads
   down, and the total sits in <tfoot>. Narrower than ~640px of ITS OWN
   width (a container query, so it works in a sidebar as well as on a
   phone) it becomes a list of cards — the same figures, stacked — with
   the sort as a select; `compact` asks for the cards at any width.
   `allocation` adds a strip over the table: the portfolio split by
   weight, each position's colour repeated as a dot beside its ticker.

   THE DELIGHT is a deal: in fun the rows arrive one after another like
   cards off a deck, and each Sparkline draws its own day as it lands.
   Calm: the rows are simply there; the lines draw quickly and plainly. */
import { forwardRef, useMemo, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";
import { formatMoney, formatNumber, formatPercent, trend } from "../finance";
import { ArrowUpDown, SortAsc, SortDesc } from "../icons";
import { Sparkline } from "./Sparkline";

export interface HoldingRow {
  symbol: string;
  name: string;
  shares: number;
  /** Last price, per share. */
  price: number;
  /** Market value (shares × price). */
  value: number;
  /** Today's change in value, in money. */
  dayChange: number;
  /** Today's change in percent (1.2 = 1.2%). */
  dayChangePct: number;
  /** Share of the portfolio, 0..100. */
  weight: number;
  /** Today's prices, oldest first, for the sparkline. */
  spark: number[];
}

export type HoldingsSortKey = "symbol" | "price" | "dayChange" | "value" | "weight";
export interface HoldingsSort {
  key: HoldingsSortKey;
  dir: "asc" | "desc";
}

export interface HoldingsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  rows: HoldingRow[];
  /** ISO 4217 code (default "USD"). */
  currency?: string;
  /** BCP 47 locale; the browser's by default. */
  locale?: string;
  /** Starting sort (default: value, largest first). */
  defaultSort?: HoldingsSort;
  /** The cards at every width. */
  compact?: boolean;
  /** A strip of the portfolio split by weight, over the table. */
  allocation?: boolean;
  /** The table's caption, read by screen readers (default "Holdings"). */
  caption?: string;
}

const COLUMNS: { key: HoldingsSortKey | null; label: string; align: "left" | "right"; className?: string }[] = [
  { key: "symbol", label: "Holding", align: "left" },
  { key: null, label: "Today", align: "left", className: "w-[104px]" },
  { key: "price", label: "Price", align: "right" },
  { key: "dayChange", label: "Day change", align: "right" },
  { key: "value", label: "Value", align: "right" },
  { key: "weight", label: "Weight", align: "right", className: "w-[132px]" },
];

/* the allocation's colours, dealt in order (written out whole for Tailwind) */
const TONES = ["bg-flame", "bg-blue", "bg-acid", "bg-bubble", "bg-sky", "bg-plum"];

const trendText = (v: number) => (trend(v) === "up" ? "text-chart-up" : trend(v) === "down" ? "text-chart-down" : "text-mute");

function sorted(rows: HoldingRow[], s: HoldingsSort) {
  const k = s.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (s.key === "symbol") return a.symbol.localeCompare(b.symbol) * k;
    // day change sorts by percent: it is the question "what moved most", not "what is biggest"
    const av = s.key === "dayChange" ? a.dayChangePct : a[s.key];
    const bv = s.key === "dayChange" ? b.dayChangePct : b[s.key];
    return (av - bv) * k;
  });
}

function WeightBar({ weight, locale }: { weight: number; locale?: string }) {
  return (
    <span data-slot="holdings-weight" className="inline-flex items-center justify-end gap-2 w-full">
      <span aria-hidden className="relative h-1.5 w-14 overflow-hidden rounded-pill bg-fill">
        <span className="absolute inset-y-0 left-0 rounded-pill bg-ink/65" style={{ width: `${Math.min(100, Math.max(0, weight))}%` }} />
      </span>
      <span className="w-11 text-right tabular-nums">{formatPercent(weight, { locale, digits: 1, sign: false })}</span>
    </span>
  );
}

export const Holdings = forwardRef<HTMLDivElement, HoldingsProps>(function Holdings(
  {
    rows,
    currency = "USD",
    locale,
    defaultSort = { key: "value", dir: "desc" },
    compact = false,
    allocation = false,
    caption = "Holdings",
    className,
    ...rest
  },
  ref,
) {
  const [sort, setSort] = useState<HoldingsSort>(defaultSort);
  const list = useMemo(() => sorted(rows, sort), [rows, sort]);
  // colours follow the position, not its place in the current sort
  const tone = useMemo(() => new Map(rows.map((r, i) => [r.symbol, TONES[i % TONES.length]])), [rows]);

  const money = (v: number, sign?: boolean) => formatMoney(v, { currency, locale, sign });
  const total = rows.reduce((a, r) => a + r.value, 0);
  const totalChange = rows.reduce((a, r) => a + r.dayChange, 0);
  const opening = total - totalChange;
  const totalPct = opening ? (totalChange / opening) * 100 : 0;

  const toggle = (key: HoldingsSortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "symbol" ? "asc" : "desc" }));

  const change = (abs: number, pct: number, cls?: string) => (
    <span className={cn("inline-flex flex-col items-end leading-tight tabular-nums", trendText(abs), cls)}>
      <span className="font-medium">{money(abs, true)}</span>
      <span className="text-[0.9em] opacity-80">{formatPercent(pct, { locale })}</span>
    </span>
  );

  const dot = (symbol: string) =>
    allocation ? <i aria-hidden className={cn("size-2 shrink-0 rounded-full", tone.get(symbol))} /> : null;

  const spark = (r: HoldingRow, width: number): ReactNode =>
    r.spark.length > 1 ? (
      <Sparkline
        data={r.spark}
        width={width}
        height={24}
        showEnd={false}
        trend={r.dayChange >= 0 ? "up" : "down"}
        format={(n) => money(n)}
        aria-label={`${r.symbol} today: ${money(r.spark[0])} to ${money(r.spark[r.spark.length - 1])}`}
      />
    ) : null;

  return (
    <div
      ref={ref}
      data-slot="holdings"
      className={cn("@container w-full min-w-0 rounded-card bg-surface text-ink font-sans", className)}
      {...rest}
    >
      {/* ── allocation strip ── */}
      {allocation && rows.length > 0 && (
        <div data-slot="holdings-allocation" className="px-4 pt-4">
          <div
            role="img"
            aria-label={`Allocation: ${[...rows]
              .sort((a, b) => b.weight - a.weight)
              .map((r) => `${r.symbol} ${formatPercent(r.weight, { locale, digits: 1, sign: false })}`)
              .join(", ")}`}
            className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-pill bg-fill"
          >
            {rows.map((r) => (
              <span
                key={r.symbol}
                title={`${r.symbol} · ${formatPercent(r.weight, { locale, digits: 1, sign: false })}`}
                className={cn("h-full min-w-[2px]", tone.get(r.symbol))}
                style={{ width: `${r.weight}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── the table: from 640px of its own width ── */}
      <div className={cn("overflow-x-auto px-2 pb-2", compact ? "hidden" : "hidden @min-[640px]:block", "pt-2")}>
        <table data-slot="holdings-table" className="w-full border-collapse text-[13.5px]">
          <caption className="sr-only">{caption}, sortable by column</caption>
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const on = c.key !== null && sort.key === c.key;
                return (
                  <th
                    key={c.label}
                    scope="col"
                    aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn(
                      "h-10 px-2 align-middle text-[12px] font-medium text-mute whitespace-nowrap border-b border-line",
                      c.align === "right" ? "text-right" : "text-left",
                      c.className,
                    )}
                  >
                    {c.key === null ? (
                      c.label
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggle(c.key!)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-xs -mx-1 px-1 py-0.5 cursor-pointer bg-transparent border-0",
                          "font-medium text-inherit hover:text-ink focus-visible:outline-2 focus-visible:outline-ring",
                          c.align === "right" && "flex-row-reverse",
                          on && "text-ink",
                        )}
                      >
                        {c.label}
                        {on ? (
                          sort.dir === "asc" ? (
                            <SortAsc size={13} aria-hidden />
                          ) : (
                            <SortDesc size={13} aria-hidden />
                          )
                        ) : (
                          <ArrowUpDown size={13} aria-hidden className="opacity-40" />
                        )}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr
                key={r.symbol}
                data-slot="holdings-row"
                className="border-b border-line transition-colors duration-150 hover:bg-fill fun:animate-deal-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <th scope="row" className="px-2 py-2.5 text-left font-normal">
                  <span className="flex items-center gap-2 min-w-0">
                    {dot(r.symbol)}
                    <span className="min-w-0">
                      <span className="block font-semibold tracking-[0.01em]">{r.symbol}</span>
                      <span className="block truncate max-w-[18ch] text-[12px] text-mute">{r.name}</span>
                    </span>
                  </span>
                </th>
                <td className="px-2 py-2.5">{spark(r, 88)}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">
                  <span className="block">{money(r.price)}</span>
                  <span className="block text-[12px] text-mute">{formatNumber(r.shares, { locale })} sh</span>
                </td>
                <td className="px-2 py-2.5 text-right">
                  {change(r.dayChange, r.dayChangePct)}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums font-medium">{money(r.value)}</td>
                <td className="px-2 py-2.5 text-right">
                  <WeightBar weight={r.weight} locale={locale} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr data-slot="holdings-total" className="font-medium">
              <th scope="row" className="px-2 pt-3 pb-2 text-left font-semibold">
                Total
              </th>
              <td className="px-2 pt-3 pb-2 text-[12px] text-mute font-normal">
                {rows.length} {rows.length === 1 ? "position" : "positions"}
              </td>
              <td />
              <td className="px-2 pt-3 pb-2 text-right">
                {change(totalChange, totalPct)}
              </td>
              <td className="px-2 pt-3 pb-2 text-right tabular-nums font-display-ui text-[15px]">{money(total)}</td>
              <td className="px-2 pt-3 pb-2 text-right">
                <WeightBar weight={100} locale={locale} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── the cards: under 640px, or always when compact ── */}
      <div data-slot="holdings-cards" className={cn("p-3", compact ? "block" : "block @min-[640px]:hidden")}>
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <p className="m-0 text-[12px] font-medium text-mute">
            {rows.length} {rows.length === 1 ? "position" : "positions"}
          </p>
          <label className="inline-flex items-center gap-1.5 text-[12px] text-mute">
            Sort
            <select
              value={`${sort.key}:${sort.dir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split(":") as [HoldingsSortKey, "asc" | "desc"];
                setSort({ key, dir });
              }}
              className="h-7 rounded-sm border border-line bg-surface px-1.5 text-[12px] text-ink focus-visible:outline-2 focus-visible:outline-ring"
            >
              <option value="value:desc">Value, high to low</option>
              <option value="value:asc">Value, low to high</option>
              <option value="dayChange:desc">Day change, best first</option>
              <option value="dayChange:asc">Day change, worst first</option>
              <option value="weight:desc">Weight</option>
              <option value="price:desc">Price</option>
              <option value="symbol:asc">Symbol, A–Z</option>
            </select>
          </label>
        </div>
        <ul aria-label={caption} className="m-0 list-none p-0 flex flex-col gap-1.5">
          {list.map((r, i) => (
            <li
              key={r.symbol}
              data-slot="holdings-card"
              className="rounded-sm bg-paper-2 px-3 py-2.5 fun:animate-deal-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {dot(r.symbol)}
                  <div className="min-w-0">
                    <p className="m-0 font-semibold text-[14px]">{r.symbol}</p>
                    <p className="m-0 truncate text-[12px] text-mute">{r.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="m-0 font-medium tabular-nums text-[14px]">{money(r.value)}</p>
                  {change(r.dayChange, r.dayChangePct, "text-[12px] flex-row gap-1.5")}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                {spark(r, 96)}
                <p className="m-0 text-[12px] text-mute tabular-nums">
                  {formatNumber(r.shares, { locale })} × {money(r.price)}
                </p>
              </div>
              <div className="mt-1.5">
                <WeightBar weight={r.weight} locale={locale} />
              </div>
            </li>
          ))}
        </ul>
        <div data-slot="holdings-total" className="mt-2 flex items-baseline justify-between gap-3 px-1 pt-2 border-t border-line">
          <span className="text-[13px] font-semibold">Total</span>
          <span className="flex items-baseline gap-2">
            {change(totalChange, totalPct, "text-[12px] flex-row gap-1.5")}
            <span className="font-display-ui font-medium tabular-nums text-[15px]">{money(total)}</span>
          </span>
        </div>
      </div>
    </div>
  );
});
