/* ══ CurrencyConverter ════════════════════════════════════
   Two rows — an amount and a currency each — with a swap button
   between them and the rate underneath:
   "1 USD = 0.9213 EUR · updated 2 min ago".

     <CurrencyConverter base="USD" rates={{ EUR: 0.9213, GBP: 0.7841, JPY: 149.32 }} updatedAt={fetchedAt} />

   Rates come in as props (units of each currency per one `base`); it
   never fetches. Either side is editable: type in the bottom row and
   the top one is worked out backwards. The side you last typed in is
   the one that holds when a currency changes. Each result is rounded
   to its currency's own fraction digits (none for JPY).

   DELIGHT — THE SWAP. The button spins half a turn (and keeps turning
   the same way on every press) while the two rows trade places with a
   little hop — the bottom row's figures rise over the top, the top
   one dips under. Calm: the rows just fade into their new places.
   Screen readers hear the result ("100 US dollars is 92.13 euros"),
   politely and only once typing pauses. */
import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import { formatNumber } from "../finance";
import { ArrowUpDown } from "../icons";
import { cn } from "../utils";
import { isMotionCalm } from "./FormField";
import { currencyDigits, spokenMoney } from "./Money";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";

export interface CurrencyConverterProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Units of each currency per one `base`. The base itself may be left out (it is 1). */
  rates: Record<string, number>;
  /** The currency the rates are quoted against. */
  base?: string;
  /** Currencies offered in the menus; defaults to the base plus every key of `rates`. */
  currencies?: string[];
  defaultFrom?: string;
  defaultTo?: string;
  defaultAmount?: number;
  /** When the rates were fetched — shown as "updated 2 min ago". */
  updatedAt?: Date | number;
  locale?: string;
  /** Row labels. */
  fromLabel?: string;
  toLabel?: string;
  onConvert?: (r: { from: string; to: string; amount: number; converted: number }) => void;
}

/* "1,240.5" ↔ 1240.5 in a given locale, keeping what was typed when it parses the same */
function marks(locale?: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    decimal: parts.find((p) => p.type === "decimal")?.value ?? ".",
    group: parts.find((p) => p.type === "group")?.value ?? ",",
  };
}
function parseAmount(text: string, decimal: string, group: string) {
  let s = text.split(group).join("").replace(/\s/g, "");
  if (decimal !== ".") s = s.replace(decimal, ".");
  s = s.replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}
const fmt = (n: number, fd: number, locale?: string) => (n ? formatNumber(n, { locale, digits: fd }) : "");

function ago(t: number, now: number, locale?: string) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "just now";
  const [n, unit] = s < 3600 ? [Math.round(s / 60), "minute"] : s < 86400 ? [Math.round(s / 3600), "hour"] : [Math.round(s / 86400), "day"];
  // English gets the terse "2 min ago"; other locales their own short form
  if (!locale || locale.toLowerCase().startsWith("en")) {
    const short = { minute: "min", hour: "hr", day: n === 1 ? "day" : "days" }[unit as "minute" | "hour" | "day"];
    return `${n} ${short} ago`;
  }
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" }).format(-n, unit as Intl.RelativeTimeFormatUnit);
}

const names = (locale?: string) => {
  try {
    return new Intl.DisplayNames(locale ? [locale] : undefined, { type: "currency" });
  } catch {
    return null;
  }
};

export const CurrencyConverter = forwardRef<HTMLDivElement, CurrencyConverterProps>(function CurrencyConverter(
  {
    rates,
    base = "USD",
    currencies,
    defaultFrom,
    defaultTo,
    defaultAmount = 100,
    updatedAt,
    locale,
    fromLabel = "You send",
    toLabel = "They receive",
    onConvert,
    className,
    ...rest
  },
  ref,
) {
  const list = useMemo(() => currencies ?? Array.from(new Set([base, ...Object.keys(rates)])), [currencies, base, rates]);
  const rateOf = (c: string) => (c === base ? (rates[c] ?? 1) : rates[c]);
  const cross = (a: string, b: string) => {
    const ra = rateOf(a);
    const rb = rateOf(b);
    return ra && rb ? rb / ra : 0;
  };
  const { decimal, group } = useMemo(() => marks(locale), [locale]);
  const display = useMemo(() => names(locale), [locale]);

  const [cur, setCur] = useState<[string, string]>([defaultFrom ?? list[0] ?? base, defaultTo ?? list.find((c) => c !== (defaultFrom ?? list[0])) ?? base]);
  // the side you last typed in holds its figure; the other is computed
  const [lead, setLead] = useState<0 | 1>(0);
  const [text, setText] = useState<[string, string]>(() => {
    const a = defaultFrom ?? list[0] ?? base;
    const b = defaultTo ?? list.find((c) => c !== a) ?? base;
    return [fmt(defaultAmount, currencyDigits(a, locale), locale), fmt(defaultAmount * cross(a, b), currencyDigits(b, locale), locale)];
  });

  const recompute = (t: [string, string], c: [string, string], l: 0 | 1): [string, string] => {
    const other = l === 0 ? 1 : 0;
    const n = parseAmount(t[l], decimal, group);
    const r = l === 0 ? cross(c[0], c[1]) : cross(c[1], c[0]);
    const out: [string, string] = [...t];
    out[other] = fmt(n * r, currencyDigits(c[other], locale), locale);
    return out;
  };

  // new rates or locale: redo the follower side
  const ratesKey = JSON.stringify(rates);
  useEffect(() => {
    setText((t) => recompute(t, cur, lead));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratesKey, base, locale]);

  const amounts = [parseAmount(text[0], decimal, group), parseAmount(text[1], decimal, group)] as const;
  useEffect(() => {
    onConvert?.({ from: cur[0], to: cur[1], amount: amounts[0], converted: amounts[1] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text[0], text[1], cur[0], cur[1]]);

  const edit = (side: 0 | 1, value: string) => {
    // digits, the locale's marks and a dot; capped to the currency's fraction digits
    const fd = currencyDigits(cur[side], locale);
    let v = value.replace(new RegExp(`[^\\d${escape(decimal)}${escape(group)}.\\s]`, "g"), "");
    const dec = v.includes(decimal) ? decimal : decimal !== "." && group !== "." && v.includes(".") ? "." : null;
    if (dec) {
      const i = v.indexOf(dec);
      v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\D/g, "").slice(0, fd);
      if (fd === 0) v = v.slice(0, i);
    }
    const t: [string, string] = [...text];
    t[side] = v;
    setLead(side);
    setText(recompute(t, cur, side));
  };
  // tidy the figure you were typing when you leave it
  const blur = (side: 0 | 1) => {
    const t: [string, string] = [...text];
    t[side] = fmt(parseAmount(text[side], decimal, group), currencyDigits(cur[side], locale), locale);
    setText(t);
  };
  const pick = (side: 0 | 1, code: string) => {
    const c: [string, string] = [...cur];
    if (c[side === 0 ? 1 : 0] === code) c[side === 0 ? 1 : 0] = c[side]; // picking the other side's currency swaps them
    c[side] = code;
    setCur(c);
    setText(recompute(text, c, lead));
  };

  /* ── the swap ── */
  const [turns, setTurns] = useState(0);
  const rows = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const swap = () => {
    setTurns((n) => n + 1);
    setCur([cur[1], cur[0]]);
    setText([text[1], text[0]]);
    setLead(lead === 0 ? 1 : 0);
    const [a, b] = [rows[0].current, rows[1].current];
    if (!a || !b) return;
    const d = b.getBoundingClientRect().top - a.getBoundingClientRect().top;
    if (isMotionCalm(a)) {
      if (a.closest('[data-rap-motion="still"]')) return;
      for (const el of [a, b]) el.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
      return;
    }
    // each row starts where its new content used to be and hops home
    const hop = (el: HTMLElement, from: number, lift: number) =>
      el.animate(
        [
          { transform: `translateY(${from}px)`, zIndex: lift > 0 ? 1 : 0 },
          { transform: `translateY(${from / 2 - 10}px) scale(${1 + lift * 0.03})`, offset: 0.5 },
          { transform: "translateY(0) scale(1)" },
        ],
        { duration: 460, easing: "cubic-bezier(.3,1.25,.5,1)" },
      );
    hop(a, d, 1);
    hop(b, -d, -1);
  };

  /* ── the rate line ── */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (updatedAt == null) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [updatedAt]);
  const rate = cross(cur[0], cur[1]);
  const rateText = `1 ${cur[0]} = ${formatNumber(rate, { locale, digits: rate >= 100 ? 2 : 4 })} ${cur[1]}`;
  const when = updatedAt != null ? ago(+updatedAt, now, locale) : null;

  // what a screen reader hears, once typing settles
  const [said, setSaid] = useState("");
  useEffect(() => {
    const t = setTimeout(
      () =>
        setSaid(
          `${spokenMoney(amounts[0], { currency: cur[0], locale })} is ${spokenMoney(amounts[1], { currency: cur[1], locale })}`,
        ),
      700,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amounts[0], amounts[1], cur[0], cur[1], locale]);

  const id = useId();
  const row = (side: 0 | 1) => (
    <div
      ref={rows[side]}
      data-slot="currency-converter-row"
      className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 bg-surface px-5 py-4"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={`${id}-${side}`} className="text-[0.8125rem] font-medium text-mute">
          {side === 0 ? fromLabel : toLabel}
        </label>
        <input
          id={`${id}-${side}`}
          data-slot="currency-converter-amount"
          type="text"
          inputMode={currencyDigits(cur[side], locale) > 0 ? "decimal" : "numeric"}
          autoComplete="off"
          spellCheck={false}
          placeholder="0"
          value={text[side]}
          onChange={(e) => edit(side, e.target.value)}
          onBlur={() => blur(side)}
          aria-describedby={`${id}-rate`}
          className="w-full min-w-0 border-0 bg-transparent p-0 font-display text-[clamp(1.5rem,5vw,2rem)] font-medium leading-[1.15] tracking-[-0.02em] text-ink tabular-nums outline-none placeholder:text-mute focus-visible:underline focus-visible:decoration-ring focus-visible:decoration-2 focus-visible:underline-offset-6"
        />
      </div>
      <Select value={cur[side]} onValueChange={(v) => pick(side, v)}>
        <SelectTrigger size="md" className="w-[7.25rem] font-medium tabular-nums" aria-label={`${side === 0 ? fromLabel : toLabel} currency`}>
          <SelectValue>{cur[side]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {list.map((c) => (
            <SelectItem key={c} value={c}>
              <span className="font-medium">{c}</span>
              <span className="ml-2 text-mute">{display?.of(c) ?? ""}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div ref={ref} data-slot="currency-converter" className={cn("flex w-full max-w-[26rem] flex-col gap-3 text-ink", className)} {...rest}>
      <div className="relative isolate flex flex-col gap-px overflow-hidden rounded-card bg-line">
        {row(0)}
        {row(1)}
        <button
          type="button"
          data-slot="currency-converter-swap"
          onClick={swap}
          aria-label={`Swap: convert ${cur[1]} to ${cur[0]}`}
          className={cn(
            "absolute right-[8.75rem] top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-ink text-paper cursor-pointer",
            "shadow-[0_0_0_4px_var(--rap-surface)] hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
          )}
        >
          <ArrowUpDown
            size={18}
            aria-hidden
            className="transition-[rotate] fun:duration-[520ms] fun:ease-spring calm:duration-0"
            style={{ rotate: `${turns * 180}deg` }}
          />
        </button>
      </div>
      <p id={`${id}-rate`} data-slot="currency-converter-rate" className="m-0 px-1 text-[0.8125rem] text-mute tabular-nums">
        <span className="font-medium text-ink-2">{rateText}</span>
        {when && <> · updated {when}</>}
      </p>
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </div>
  );
});

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\\s]/g, (m) => (/\s/.test(m) ? "\\s" : `\\${m}`));
}
