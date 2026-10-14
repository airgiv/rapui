import { useEffect, useState } from "react";
import { Button } from "../../rapui";
import { AmountInput } from "../../rapui/components/AmountInput";
import { CurrencyConverter } from "../../rapui/components/CurrencyConverter";
import { Money, MoneyDelta, type MoneySize } from "../../rapui/components/Money";
import { TickerTape, type Quote } from "../../rapui/components/TickerTape";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* a paper ground inside the white stage: finance cards are white sheets */
const GROUND = "grid grid-cols-[minmax(0,1fr)] place-items-center w-full min-h-80 p-6 rounded-[calc(var(--rap-radius)-8px)] bg-paper";
const CARD = "rounded-card bg-surface text-ink";

/* ── Money ─────────────────────────────────────────────────── */

const moneyControls: Control[] = [
  { type: "number", prop: "value", min: -5000, max: 250000, step: 0.01, default: 2480.12 },
  { type: "select", prop: "currency", options: ["USD", "EUR", "GBP", "JPY", "CHF", "INR"], default: "USD" },
  { type: "select", prop: "locale", options: ["en-US", "en-GB", "de-DE", "fr-FR", "ja-JP", "en-IN"], default: "en-US", codeDefault: null },
  { type: "select", prop: "size", options: ["sm", "md", "lg", "xl", "display"], default: "xl", codeDefault: "md" },
  { type: "select", prop: "cents", options: ["same", "small", "hide"], default: "small", codeDefault: "same" },
  { type: "select", prop: "tone", options: ["plain", "trend"], default: "plain" },
  { type: "boolean", prop: "sign", default: false },
  { type: "boolean", prop: "compact", default: false },
  { type: "text", prop: "label", default: "Balance", codeDefault: "" },
];

/* believable money moving in and out of a current account */
const MOVES = [
  { who: "Salary · Fernhill Studio", amount: 3120.0 },
  { who: "Corner Grocer", amount: -48.37 },
  { who: "Northline Rail", amount: -12.4 },
  { who: "Refund · Lumen Books", amount: 18.99 },
  { who: "Harbour Coffee", amount: -4.65 },
  { who: "Rent · Ashby Lettings", amount: -1450.0 },
];

function MoneyPlayground({ p }: { p: Record<string, string | number | boolean> }) {
  const [delta, setDelta] = useState(0);
  const [i, setI] = useState(0);
  const value = Number(p.value) + delta;
  const move = MOVES[i % MOVES.length];
  return (
    <div className={GROUND}>
      <div className={`${CARD} flex w-full max-w-[28rem] flex-col items-center gap-5 px-6 py-8 text-center`}>
        <Money
          value={value}
          currency={String(p.currency)}
          locale={String(p.locale)}
          size={p.size as MoneySize}
          cents={p.cents as "same" | "small" | "hide"}
          tone={p.tone as "plain" | "trend"}
          sign={Boolean(p.sign)}
          compact={Boolean(p.compact)}
          label={String(p.label) || undefined}
        />
        <MoneyDelta change={delta} pct={Number(p.value) ? (delta / Math.abs(Number(p.value))) * 100 : undefined} currency={String(p.currency)} locale={String(p.locale)} when="this session" />
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            size="sm"
            variant="soft"
            onClick={() => {
              setDelta((d) => Math.round((d + move.amount) * 100) / 100);
              setI((n) => n + 1);
            }}
          >
            {move.who.split(" · ")[0]} {move.amount > 0 ? "+" : "−"}
            {Math.abs(move.amount).toFixed(2)}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDelta(0)}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccountCard() {
  const balance = MOVES.reduce((s, m) => s + m.amount, 1324.07);
  return (
    <div className={GROUND}>
      <div className={`${CARD} w-full max-w-[24rem] px-6 py-6`}>
        <p className="m-0 text-[0.8125rem] font-medium text-mute">Everyday account · ••4821</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Money value={balance} size="xl" cents="small" label="Balance" />
          <MoneyDelta change={1623.57} pct={63.2} when="this month" />
        </div>
        <ul className="m-0 mt-5 list-none p-0">
          {MOVES.map((m) => (
            <li key={m.who} className="flex items-baseline justify-between gap-4 border-t border-line py-2.5 text-[0.9375rem]">
              <span className="truncate">{m.who}</span>
              <Money value={m.amount} sign tone={m.amount > 0 ? "trend" : "plain"} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Deltas() {
  return (
    <div className={GROUND}>
      <div className={`${CARD} flex flex-wrap items-center justify-center gap-3 px-6 py-5`}>
        <MoneyDelta change={12.4} pct={2.4} />
        <MoneyDelta change={-318.06} pct={-4.17} currency="EUR" locale="de-DE" />
        <MoneyDelta change={0} pct={0} currency="GBP" locale="en-GB" />
        <MoneyDelta change={48200} pct={11.8} compact size="md" variant="plain" when="YTD" />
        <MoneyDelta change={-1840} currency="JPY" locale="ja-JP" />
      </div>
    </div>
  );
}

/* ── AmountInput ───────────────────────────────────────────── */

const amountControls: Control[] = [
  { type: "select", prop: "currency", options: ["USD", "EUR", "GBP", "JPY", "INR"], default: "USD" },
  { type: "select", prop: "locale", options: ["en-US", "en-GB", "de-DE", "fr-FR", "ja-JP", "en-IN"], default: "en-US", codeDefault: null },
  { type: "number", prop: "balance", min: 0, max: 100000, step: 0.01, default: 2480.12, codeDefault: null },
  { type: "text", prop: "label", default: "Amount" },
];

function SendMoney() {
  const [amount, setAmount] = useState(0);
  const balance = 640.5;
  const over = amount > balance;
  return (
    <div className={GROUND}>
      <div className={`${CARD} flex w-full max-w-[24rem] flex-col items-center gap-6 px-6 py-7`}>
        <p className="m-0 text-[0.9375rem]">
          Send to <strong className="font-semibold">Maya Okafor</strong>
        </p>
        <AmountInput currency="GBP" locale="en-GB" balance={balance} value={amount} onValueChange={setAmount} chips={[5, 20, 50]} label="Amount to send" />
        <Button block disabled={!amount || over}>
          {amount && !over ? `Send £${amount.toFixed(2)}` : "Send"}
        </Button>
      </div>
    </div>
  );
}

/* ── CurrencyConverter ─────────────────────────────────────── */

/* mid-market rates, per 1 USD */
const RATES = { USD: 1, EUR: 0.9213, GBP: 0.7841, JPY: 149.32, CHF: 0.8814, CAD: 1.3672, AUD: 1.5218, INR: 83.41, MXN: 17.12 };

const convControls: Control[] = [
  { type: "select", prop: "defaultFrom", options: Object.keys(RATES), default: "USD" },
  { type: "select", prop: "defaultTo", options: Object.keys(RATES), default: "EUR" },
  { type: "number", prop: "defaultAmount", min: 0, max: 100000, step: 10, default: 250, codeDefault: 100 },
  { type: "select", prop: "locale", options: ["en-US", "en-GB", "de-DE", "fr-FR", "ja-JP"], default: "en-US", codeDefault: null },
];

function TravelMoney() {
  // a smaller menu, rates as of the morning
  const [at] = useState(() => Date.now() - 2 * 3600_000);
  return (
    <div className={GROUND}>
      <CurrencyConverter
        base="EUR"
        rates={{ EUR: 1, GBP: 0.8511, CHF: 0.9567, SEK: 11.42, NOK: 11.71, PLN: 4.31 }}
        defaultFrom="EUR"
        defaultTo="SEK"
        defaultAmount={600}
        updatedAt={at}
        locale="en-GB"
        fromLabel="Holiday budget"
        toLabel="In Swedish kronor"
      />
    </div>
  );
}

/* ── TickerTape ────────────────────────────────────────────── */

/* fictional listings */
const QUOTES: Quote[] = [
  { symbol: "NRTH", name: "Northwind Labs", price: 182.4, change: 2.21, changePct: 1.23 },
  { symbol: "HLX", name: "Helix Energy", price: 64.18, change: -0.93, changePct: -1.43 },
  { symbol: "KSTL", name: "Kestrel Air", price: 23.77, change: 0.41, changePct: 1.76 },
  { symbol: "ORBT", name: "Orbital Freight", price: 311.02, change: -4.6, changePct: -1.46 },
  { symbol: "VRDN", name: "Verdant Foods", price: 47.9, change: 0.12, changePct: 0.25 },
  { symbol: "QNTA", name: "Quanta Bio", price: 9.84, change: -0.31, changePct: -3.05 },
  { symbol: "MRLN", name: "Marlin Bank", price: 128.56, change: 1.08, changePct: 0.85 },
  { symbol: "PLRS", name: "Polaris Systems", price: 456.3, change: 7.92, changePct: 1.77 },
];

/* simulated live ticks: every 1.2s one or two names move a few basis points */
function useLiveQuotes(on = true) {
  const [quotes, setQuotes] = useState(QUOTES);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => {
      setQuotes((qs) => {
        const next = [...qs];
        const n = 1 + Math.floor(Math.random() * 2);
        for (let k = 0; k < n; k++) {
          const i = Math.floor(Math.random() * next.length);
          const q = next[i];
          const open = q.price - q.change;
          const price = Math.max(0.01, Math.round(q.price * (1 + (Math.random() - 0.48) * 0.006) * 100) / 100);
          const change = Math.round((price - open) * 100) / 100;
          next[i] = { ...q, price, change, changePct: (change / open) * 100 };
        }
        return next;
      });
    }, 1200);
    return () => clearInterval(t);
  }, [on]);
  return quotes;
}

const tickerControls: Control[] = [
  { type: "select", prop: "variant", options: ["tape", "board"], default: "tape" },
  { type: "number", prop: "speed", min: 16, max: 120, step: 4, default: 48 },
  { type: "boolean", prop: "live", label: "simulate ticks", default: true, codeDefault: null },
];

function TradingHeader() {
  const quotes = useLiveQuotes();
  return (
    <div className={GROUND}>
      <div className={`${CARD} w-full max-w-[40rem] overflow-hidden`}>
        <TickerTape quotes={quotes.slice(0, 6)} currency="USD" speed={36} className="rounded-none" />
        <div className="flex items-end justify-between gap-4 px-6 py-5">
          <div>
            <p className="m-0 text-[0.8125rem] font-medium text-mute">Portfolio value</p>
            <Money value={84213.55} size="lg" cents="small" label="Portfolio value" />
          </div>
          <MoneyDelta change={612.3} pct={0.73} when="today" />
        </div>
      </div>
    </div>
  );
}

export const entries: DocEntry[] = [
  {
    slug: "money",
    name: "Money",
    group: "Finance",
    description:
      "An amount set properly: the locale's symbol, grouping and decimal mark, tabular digits, and a spoken label for screen readers (\"Balance, 2,480 US dollars and 12 cents\"). Cents can be the same size, set small and raised like a banking app, or hidden; tone=\"trend\" colours it by sign. Delight: when the value changes every digit is a reel that spins to its new figure, units first, like a meter turning over — calm crossfades instead. MoneyDelta is the ▲ +$12.40 · +2.4% chip.",
    controls: moneyControls,
    Demo: MoneyPlayground,
    code: (p) => `import { Money, MoneyDelta } from "@rapui/react";

<Money value={balance}${attrs(p, moneyControls, ["value"])} />
<MoneyDelta change={12.4} pct={2.4} when="today" />`,
    examples: [
      {
        title: "An account card",
        Demo: AccountCard,
        code: `<Money value={balance} size="xl" cents="small" label="Balance" />
<MoneyDelta change={1623.57} pct={63.2} when="this month" />

<ul>
  {transactions.map((t) => (
    <li key={t.id}>
      {t.merchant}
      <Money value={t.amount} sign tone={t.amount > 0 ? "trend" : "plain"} />
    </li>
  ))}
</ul>`,
      },
      {
        title: "Change chips",
        Demo: Deltas,
        code: `<MoneyDelta change={12.4} pct={2.4} />
<MoneyDelta change={-318.06} pct={-4.17} currency="EUR" locale="de-DE" />
<MoneyDelta change={48200} pct={11.8} compact size="md" variant="plain" when="YTD" />`,
      },
    ],
  },
  {
    slug: "amount-input",
    name: "Amount input",
    group: "Finance",
    description:
      "The big \"send money\" field: one huge centred amount with its currency symbol, the balance underneath and quick chips (+10, +50, +100, Max). A real decimal input — the phone's number pad, the locale's decimal mark, never more fraction digits than the currency has — whose figure steps down in size as digits are added. Over the balance it shakes \"no\" and turns the danger colour with a message; calm just turns danger.",
    controls: amountControls,
    Demo: ({ p }) => {
      const [v, setV] = useState(0);
      return (
        <div className={GROUND}>
          <div className={`${CARD} flex w-full max-w-[24rem] flex-col items-center gap-4 px-6 py-7`}>
            <AmountInput
              key={`${p.currency}-${p.locale}`}
              currency={String(p.currency)}
              locale={String(p.locale)}
              balance={Number(p.balance)}
              label={String(p.label)}
              onValueChange={setV}
            />
            <p className="m-0 text-[0.75rem] text-mute tabular-nums">onValueChange → {v}</p>
          </div>
        </div>
      );
    },
    code: (p) => `import { AmountInput } from "@rapui/react";

<AmountInput${attrs(p, amountControls, ["balance"])} balance={${p.balance}} onValueChange={setAmount} />`,
    examples: [
      {
        title: "Send to a friend",
        Demo: SendMoney,
        code: `const [amount, setAmount] = useState(0);

<AmountInput currency="GBP" locale="en-GB" balance={640.5} value={amount} onValueChange={setAmount} chips={[5, 20, 50]} label="Amount to send" />
<Button block disabled={!amount || amount > 640.5}>Send</Button>`,
      },
    ],
  },
  {
    slug: "currency-converter",
    name: "Currency converter",
    group: "Finance",
    description:
      "Two rows — amount and currency each — with a swap button between them and the rate underneath (\"1 USD = 0.9213 EUR · updated 2 min ago\"). Rates come in as props, quoted against a base; either side is editable and the other is worked out, rounded to its currency's own digits. Delight: the swap button spins half a turn as the rows trade places with a little hop; calm fades them.",
    controls: convControls,
    Demo: ({ p }) => {
      const [at] = useState(() => Date.now() - 2 * 60_000);
      return (
        <div className={GROUND}>
          <CurrencyConverter
            key={`${p.defaultFrom}-${p.defaultTo}-${p.defaultAmount}-${p.locale}`}
            rates={RATES}
            base="USD"
            defaultFrom={String(p.defaultFrom)}
            defaultTo={String(p.defaultTo)}
            defaultAmount={Number(p.defaultAmount)}
            locale={String(p.locale)}
            updatedAt={at}
          />
        </div>
      );
    },
    code: (p) => `import { CurrencyConverter } from "@rapui/react";

const rates = { EUR: 0.9213, GBP: 0.7841, JPY: 149.32, CHF: 0.8814 /* per 1 USD */ };

<CurrencyConverter base="USD" rates={rates} updatedAt={fetchedAt}${attrs(p, convControls)} />`,
    examples: [
      {
        title: "A travel budget, euro-based",
        Demo: TravelMoney,
        code: `<CurrencyConverter
  base="EUR"
  rates={{ GBP: 0.8511, CHF: 0.9567, SEK: 11.42, NOK: 11.71, PLN: 4.31 }}
  defaultFrom="EUR"
  defaultTo="SEK"
  defaultAmount={600}
  fromLabel="Holiday budget"
  toLabel="In Swedish kronor"
/>`,
      },
    ],
  },
  {
    slug: "ticker-tape",
    name: "Ticker tape",
    group: "Finance",
    description:
      "A running strip of quotes — symbol, price, ▲/▼ change in the trend colours. It stops under the pointer or focus and has a pause button; with reduced motion it is a plain row you scroll. variant=\"board\" is a static grid of quote cells, a departure board (mono on ruled cells in signal). Delight: a cell whose price just moved flashes a green or red wash that fades out; calm runs slower and only tints the price.",
    controls: tickerControls,
    Demo: ({ p }) => {
      const quotes = useLiveQuotes(Boolean(p.live));
      return (
        <div className={GROUND}>
          <div className="w-full max-w-[44rem]">
            <TickerTape quotes={quotes} variant={p.variant as "tape" | "board"} speed={Number(p.speed)} />
          </div>
        </div>
      );
    },
    code: (p) => `import { TickerTape } from "@rapui/react";

// quotes: { symbol, price, change, changePct, name? }[] — pass new ones as prices move
<TickerTape quotes={quotes}${attrs(p, tickerControls, ["live"])} />`,
    examples: [
      {
        title: "Above a portfolio",
        Demo: TradingHeader,
        code: `<TickerTape quotes={quotes} currency="USD" speed={36} />
<Money value={84213.55} size="lg" cents="small" label="Portfolio value" />
<MoneyDelta change={612.3} pct={0.73} when="today" />`,
      },
    ],
  },
];
