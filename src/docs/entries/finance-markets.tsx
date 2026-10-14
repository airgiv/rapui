import { useState } from "react";
import { BudgetBar } from "../../rapui/components/BudgetBar";
import { Holdings, type HoldingRow } from "../../rapui/components/Holdings";
import { StockChart, type StockPoint, type StockRange } from "../../rapui/components/StockChart";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* a paper ground inside the white stage: chart cards are white sheets */
const GROUND = "grid grid-cols-[minmax(0,1fr)] place-items-center w-full min-h-80 p-6 rounded-[calc(var(--rap-radius)-8px)] bg-paper";

/* ── deterministic market data ────────────────────────────────
   A seeded random walk, so the page looks the same on every load. Every range is
   cut from ONE history: five years of daily bars, the last week re-drawn as
   half-hours and the last day as five-minute bars, each bridged so it ends exactly
   on that day's close — so 1D, 1W and 1M agree about where the price is. Candles
   come from four sub-ticks per bar, so h ≥ max(o, c) and l ≤ min(o, c) by
   construction (and rounding to cents is monotonic, so it stays true). */
function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const cents = (v: number) => Math.round(v * 100) / 100;

/** steps+1 prices from `from`, bent so the last is exactly `to` */
function bridge(r: () => number, from: number, to: number, steps: number, vol: number) {
  const p = [from];
  for (let k = 0; k < steps; k++) p.push(p[k] * (1 + gauss(r) * vol));
  const miss = to - p[steps];
  return p.map((v, k) => v + (miss * k) / steps);
}

/** n bars from `from` to `to`, at t0 + i·dt, with a U-shaped (or flat) volume */
function bars(r: () => number, from: number, to: number, n: number, vol: number, times: number[], vbase: number, ushape = true) {
  const SUB = 4;
  const p = bridge(r, from, to, n * SUB, vol / 2);
  return Array.from({ length: n }, (_, i): StockPoint => {
    const seg = p.slice(i * SUB, i * SUB + SUB + 1);
    const o = seg[0];
    const c = seg[SUB];
    const u = ushape ? 1.7 - Math.sin((Math.PI * i) / Math.max(1, n - 1)) : 1;
    return {
      t: times[i],
      o: cents(o),
      h: cents(Math.max(...seg)),
      l: cents(Math.min(...seg)),
      c: cents(c),
      v: Math.round(vbase * u * (0.55 + r() * 0.9)),
    };
  });
}

/** one bar standing for several */
const merge = (bs: StockPoint[]): StockPoint => ({
  t: bs[0].t,
  o: bs[0].o,
  h: Math.max(...bs.map((b) => b.h ?? b.c)),
  l: Math.min(...bs.map((b) => b.l ?? b.c)),
  c: bs[bs.length - 1].c,
  v: bs.reduce((a, b) => a + (b.v ?? 0), 0),
});

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/* the New York open, 09:30 EDT, as UTC */
const OPEN_UTC = 13.5 * HOUR;

function makeNorthwind() {
  const r = rng(0x4e525448); // "NRTH"
  // the trading days: weekdays back from Tue 13 Oct 2026
  const lastDay = Date.UTC(2026, 9, 13);
  const days: number[] = [];
  for (let d = lastDay; days.length < 1260; d -= DAY) {
    const wd = new Date(d).getUTCDay();
    if (wd !== 0 && wd !== 6) days.unshift(d);
  }
  // five years of closes, from 18.40 to 42.18
  const closes = bridge(r, 18.4, 42.18, days.length - 1, 0.019).map(cents);
  const daily: StockPoint[] = days.map((d, i) => {
    const c = closes[i];
    const o = cents(i ? closes[i - 1] * (1 + gauss(r) * 0.004) : c);
    const wick = () => Math.abs(gauss(r)) * 0.007;
    return {
      t: d + OPEN_UTC,
      o,
      h: cents(Math.max(o, c) * (1 + wick())),
      l: cents(Math.min(o, c) * (1 - wick())),
      c,
      v: Math.round(3_200_000 * (0.5 + r()) * (1 + Math.abs(c - o) / o * 20)),
    };
  });

  // the last day in five-minute bars, 09:30–16:00
  const n = daily.length;
  const today = days[n - 1];
  const prevClose = daily[n - 2].c;
  const day1 = bars(r, prevClose * 1.003, daily[n - 1].c, 78, 0.0036, Array.from({ length: 78 }, (_, i) => today + OPEN_UTC + i * 5 * 60_000), 52_000);
  daily[n - 1] = merge(day1);

  // the last week in half-hours: four days bridged fresh, then today rolled up from 1D
  const week: StockPoint[] = [];
  for (let k = 5; k >= 2; k--) {
    const d = n - k;
    const halfHours = bars(r, daily[d - 1].c, daily[d].c, 13, 0.006, Array.from({ length: 13 }, (_, i) => days[d] + OPEN_UTC + i * 30 * 60_000), 250_000);
    week.push(...halfHours);
    daily[d] = merge(halfHours);
  }
  for (let i = 0; i < 78; i += 6) week.push(merge(day1.slice(i, i + 6)));

  // a year in weeks, all of it in months
  const weekly: StockPoint[] = [];
  const yearDays = daily.slice(-252);
  for (let i = 0; i < yearDays.length; i += 5) weekly.push(merge(yearDays.slice(i, i + 5)));
  const monthly: StockPoint[] = [];
  let bucket: StockPoint[] = [];
  for (const b of daily) {
    if (bucket.length && new Date(b.t).getUTCMonth() !== new Date(bucket[0].t).getUTCMonth()) {
      monthly.push(merge(bucket));
      bucket = [];
    }
    bucket.push(b);
  }
  if (bucket.length) monthly.push(merge(bucket));

  const series: Record<StockRange, StockPoint[]> = {
    "1D": day1,
    "1W": week,
    "1M": daily.slice(-22),
    "3M": daily.slice(-63),
    "1Y": weekly,
    ALL: monthly,
  };
  return { series, previousClose: prevClose };
}

const NRTH = makeNorthwind();

/* ── holdings: six fictional names, a day's prices each ── */
const BOOK: { symbol: string; name: string; shares: number; open: number; drift: number; seed: number }[] = [
  { symbol: "NRTH", name: "Northwind Energy", shares: 120, open: 41.62, drift: 0.0135, seed: 11 },
  { symbol: "HLXA", name: "Helix Analytics", shares: 34, open: 212.4, drift: -0.0182, seed: 23 },
  { symbol: "CRSN", name: "Corsan Foods", shares: 210, open: 18.92, drift: 0.0041, seed: 37 },
  { symbol: "VNTA", name: "Vanta Rail", shares: 55, open: 96.3, drift: 0.0226, seed: 41 },
  { symbol: "ORBL", name: "Orbital Materials", shares: 18.5, open: 304.75, drift: -0.0063, seed: 53 },
  { symbol: "KSTR", name: "Kestrel Bank", shares: 140, open: 27.08, drift: 0.0009, seed: 67 },
];

function makeHoldings(): HoldingRow[] {
  const rows = BOOK.map((b) => {
    const r = rng(b.seed);
    const spark = bridge(r, b.open, b.open * (1 + b.drift), 28, 0.0028).map(cents);
    const price = spark[spark.length - 1];
    const value = cents(b.shares * price);
    const dayChange = cents(b.shares * (price - b.open));
    return { symbol: b.symbol, name: b.name, shares: b.shares, price, value, dayChange, dayChangePct: ((price - b.open) / b.open) * 100, spark, weight: 0 };
  });
  const total = rows.reduce((a, r) => a + r.value, 0);
  return rows.map((r) => ({ ...r, weight: (r.value / total) * 100 }));
}

const HOLDINGS = makeHoldings();

/* ── budget: a believable October ── */
const SPENDING = [
  { name: "Groceries", amount: 412 },
  { name: "Eating out", amount: 286 },
  { name: "Shopping", amount: 318 },
  { name: "Transport", amount: 164 },
  { name: "Health & fitness", amount: 166 },
  { name: "Subscriptions", amount: 74 },
];

/* ── controls ── */
const stockControls: Control[] = [
  { type: "select", prop: "type", options: ["line", "area", "candles"], default: "line" },
  { type: "select", prop: "defaultRange", label: "range", options: ["1D", "1W", "1M", "3M", "1Y", "ALL"], default: "1D", codeDefault: null },
  { type: "select", prop: "currency", options: ["USD", "EUR", "GBP", "JPY"], default: "USD" },
  { type: "select", prop: "locale", options: ["en-US", "en-GB", "de-DE", "ja-JP"], default: "en-US", codeDefault: null },
  { type: "number", prop: "height", min: 140, max: 320, step: 10, default: 220 },
  { type: "boolean", prop: "volume", default: true },
];

const budgetControls: Control[] = [
  { type: "number", prop: "budget", min: 800, max: 3000, step: 50, default: 2000, codeDefault: null },
  { type: "number", prop: "pace", label: "pace (day 0–31)", min: 0, max: 31, default: 21, codeDefault: null },
  { type: "select", prop: "currency", options: ["USD", "EUR", "GBP", "JPY"], default: "USD" },
  { type: "boolean", prop: "compact", default: false },
];

const holdingsControls: Control[] = [
  { type: "number", prop: "width", label: "width (px)", min: 300, max: 900, step: 20, default: 680, codeDefault: null },
  { type: "boolean", prop: "allocation", default: false },
  { type: "boolean", prop: "compact", default: false },
  { type: "select", prop: "currency", options: ["USD", "EUR", "GBP"], default: "USD" },
];

/* a controlled example: the range lives outside, so a page could keep it in the URL */
function ControlledStock() {
  const [range, setRange] = useState<StockRange>("3M");
  return (
    <div className={GROUND}>
      <div className="w-full max-w-[34rem]">
        <StockChart
          symbol="NRTH"
          name="Northwind Energy"
          series={NRTH.series}
          previousClose={NRTH.previousClose}
          range={range}
          onRangeChange={setRange}
          type="candles"
          timeZone="America/New_York"
          locale="en-US"
        />
        <p className="m-0 mt-3 text-center text-[12.5px] text-mute">Range in the page's state: {range}</p>
      </div>
    </div>
  );
}

export const entries: DocEntry[] = [
  {
    slug: "stock-chart",
    name: "Stock chart",
    group: "Finance",
    description:
      "One instrument's price: ticker and name, the last price large, the change for the range in the trend colour, range tabs, and the chart as a line, an area or OHLC candles over a band of volume, with yesterday's close dashed across it. Drag along it (or focus it and use the arrow keys) and a crosshair reads back the price, time and change from the start of the range. Delight: a new range is drawn in with a pen and the reading ring springs onto the line; calm crossfades instead.",
    controls: stockControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div className="w-full max-w-[34rem]">
          <StockChart
            key={String(p.defaultRange)}
            symbol="NRTH"
            name="Northwind Energy"
            series={NRTH.series}
            previousClose={NRTH.previousClose}
            defaultRange={String(p.defaultRange) as StockRange}
            type={String(p.type) as "line" | "area" | "candles"}
            currency={String(p.currency)}
            locale={String(p.locale)}
            timeZone="America/New_York"
            height={Number(p.height)}
            volume={Boolean(p.volume)}
          />
        </div>
      </div>
    ),
    code: (p) => `import { StockChart } from "@rapui/react";

<StockChart
  symbol="NRTH"
  name="Northwind Energy"${attrs(p, stockControls)}
  previousClose={${NRTH.previousClose}}
  series={{
    "1D": [{ t: 1792071000000, o: 41.75, h: 41.82, l: 41.60, c: 41.71, v: 88210 }, /* … */],
    "1W": [/* … */], "1M": [/* … */], "3M": [/* … */], "1Y": [/* … */], ALL: [/* … */],
  }}
/>`,
    examples: [
      {
        title: "Candles, range held by the page",
        Demo: ControlledStock,
        code: `const [range, setRange] = useState<StockRange>("3M");

<StockChart symbol="NRTH" name="Northwind Energy" series={series} type="candles" range={range} onRangeChange={setRange} />`,
      },
    ],
  },
  {
    slug: "budget-bar",
    name: "Budget bar",
    group: "Finance",
    description:
      "Spending against a budget: “$1,420 spent of $2,000 · $580 left”, one bar split into categories, a tick for where an even month would have you today, and a legend with each category's amount and share. Point at a segment or a legend row to bring it forward. Over budget, the budget becomes a notch and the overflow is drawn past it in danger. Delight: the segments pour in one after another.",
    controls: budgetControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div className="w-full max-w-[26rem] rounded-card bg-surface px-5 py-5">
          <BudgetBar
            label="October budget"
            categories={SPENDING}
            budget={Number(p.budget)}
            pace={Number(p.pace) / 31}
            currency={String(p.currency)}
            locale="en-US"
            compact={Boolean(p.compact)}
          />
        </div>
      </div>
    ),
    code: (p) => `import { BudgetBar } from "@rapui/react";

<BudgetBar
  label="October budget"${attrs(p, budgetControls, ["pace"])}
  pace={${(Number(p.pace) / 31).toFixed(2)}}
  categories={[
${SPENDING.map((c) => `    { name: "${c.name}", amount: ${c.amount} },`).join("\n")}
  ]}
/>`,
    examples: [
      {
        title: "Over budget",
        Demo: () => (
          <div className={GROUND}>
            <div className="w-full max-w-[26rem] rounded-card bg-surface px-5 py-5">
              <BudgetBar label="Weekend away" budget={600} pace={0.9} currency="EUR" locale="de-DE" categories={[
                { name: "Hotel", amount: 380, color: "blue" },
                { name: "Restaurants", amount: 196, color: "flame" },
                { name: "Train", amount: 84, color: "sky" },
                { name: "Museum", amount: 32, color: "plum" },
              ]} />
            </div>
          </div>
        ),
        code: `<BudgetBar label="Weekend away" budget={600} pace={0.9} currency="EUR" locale="de-DE" categories={[
  { name: "Hotel", amount: 380, color: "blue" },
  { name: "Restaurants", amount: 196, color: "flame" },
  { name: "Train", amount: 84, color: "sky" },
  { name: "Museum", amount: 32, color: "plum" },
]} />`,
      },
      {
        title: "Compact, in a list row",
        Demo: () => (
          <div className={GROUND}>
            <div className="w-full max-w-[22rem] rounded-card bg-surface px-4 py-4">
              <BudgetBar compact label="Groceries" budget={500} pace={0.68} categories={[{ name: "Groceries", amount: 412, color: "acid" }]} />
            </div>
          </div>
        ),
        code: `<BudgetBar compact label="Groceries" budget={500} pace={0.68} categories={[{ name: "Groceries", amount: 412, color: "acid" }]} />`,
      },
    ],
  },
  {
    slug: "holdings",
    name: "Holdings",
    group: "Finance",
    description:
      "A portfolio table: each position's ticker and name, today's sparkline, price, day change in the trend colour, value and weight, with a total row and sortable columns (buttons in the headers, aria-sort on the column). Under about 640px of its own width it becomes a list of cards. Delight: the rows are dealt in and each sparkline draws its day.",
    controls: holdingsControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div className="max-w-full" style={{ width: Number(p.width) }}>
          <Holdings rows={HOLDINGS} allocation={Boolean(p.allocation)} compact={Boolean(p.compact)} currency={String(p.currency)} locale="en-US" />
        </div>
      </div>
    ),
    code: (p) => `import { Holdings } from "@rapui/react";

<Holdings${attrs(p, holdingsControls, ["width"])}
  rows={[
${HOLDINGS.slice(0, 2)
  .map(
    (r) =>
      `    { symbol: "${r.symbol}", name: "${r.name}", shares: ${r.shares}, price: ${r.price}, value: ${r.value}, dayChange: ${r.dayChange}, dayChangePct: ${r.dayChangePct.toFixed(2)}, weight: ${r.weight.toFixed(1)}, spark: [${r.spark.slice(0, 4).join(", ")}, /* … */] },`,
  )
  .join("\n")}
    /* … */
  ]}
/>`,
  },
];
