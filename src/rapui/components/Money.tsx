/* ══ Money ════════════════════════════════════════════════
   An amount of money, set properly: the locale's own symbol, grouping
   and decimal mark (from `moneyParts`), tabular digits so a column of
   them lines up, and a spoken label for screen readers — "Balance,
   1,240 US dollars and 50 cents" instead of "dollar sign one comma…".

     <Money value={1240.5} currency="USD" size="xl" cents="small" label="Balance" />

   cents   same  — 1,240.50 all one size
           small — the banking-app look: the fraction (and the symbol)
                   set smaller and raised, so the whole number is the
                   figure you read
           hide  — rounded to the whole unit
   tone    trend colours the figure by its sign (chart-up / chart-down).
   Big sizes (lg and up) are set in font-display — serif numerals in
   civic; signal sets every figure in its mono. Pass `look` to choose.

   DELIGHT — THE ODOMETER. When the value changes each digit is a little
   reel of 0–9 that spins to its new figure, the units first and each
   column to the left 32ms later, so a balance going up reads like a
   meter turning over. Separators stay put; new leading digits simply
   appear. Calm: no reels — the new figure crossfades in, quickly.
   Still: it is just there.

   Also here: MoneyDelta, the change chip (▲ +$12.40 · +2.4%). */
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
} from "react";
import { moneyParts, formatMoney, formatPercent, trend as trendOf } from "../finance";
import { usePreset } from "../hooks/usePreset";
import { cn } from "../utils";
import "./Money.css";

export type MoneySize = "sm" | "md" | "lg" | "xl" | "display";
export type MoneyLook = "sans" | "display" | "mono";

/* ── speaking it ─────────────────────────────────────────── */

const MINOR: Record<string, [string, string]> = {
  USD: ["cent", "cents"], EUR: ["cent", "cents"], AUD: ["cent", "cents"], CAD: ["cent", "cents"],
  NZD: ["cent", "cents"], HKD: ["cent", "cents"], SGD: ["cent", "cents"], ZAR: ["cent", "cents"],
  GBP: ["penny", "pence"], CHF: ["centime", "centimes"],
};

/** Fraction digits a currency uses (2 for USD, 0 for JPY, 3 for KWD). */
export function currencyDigits(currency = "USD", locale?: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

/**
 * The amount as a screen reader should say it: "1,240 US dollars and 50 cents",
 * "minus 12 euros", "plus 3.1 thousand US dollars". Prefixed with `label` when given.
 */
export function spokenMoney(
  value: number,
  { currency = "USD", locale, compact, sign, digits, label }: { currency?: string; locale?: string; compact?: boolean; sign?: boolean; digits?: number; label?: string } = {},
) {
  const abs = Math.abs(value);
  const lead = value < 0 ? "minus " : sign && value > 0 ? "plus " : "";
  const fd = digits ?? currencyDigits(currency, locale);
  const english = !locale || locale.toLowerCase().startsWith("en");
  let body: string;
  if (compact) {
    body = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "name", notation: "compact", compactDisplay: "long", maximumFractionDigits: 1 }).format(abs);
  } else {
    const rounded = Number(abs.toFixed(fd));
    const whole = Math.trunc(rounded);
    const minor = Math.round((rounded - whole) * 10 ** fd);
    if (english && MINOR[currency] && fd === 2) {
      const unit = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "name", maximumFractionDigits: 0 }).format(whole);
      body = minor ? `${unit} and ${minor} ${MINOR[currency][minor === 1 ? 0 : 1]}` : unit;
    } else {
      body = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "name", minimumFractionDigits: fd, maximumFractionDigits: fd }).format(rounded);
    }
  }
  return `${label ? `${label}, ` : ""}${lead}${body}`;
}

/* ── the reel ────────────────────────────────────────────── */

const REEL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/* One digit column. The visible digit is an invisible copy in normal flow (so the
   column has the glyph's width and the text's baseline); the reel of 0–9 hangs
   absolutely over it and is translated by whole rows. clip-path, not overflow,
   does the clipping: overflow:hidden would move an inline-block's baseline to its
   bottom edge and knock it out of line with the cents. */
function Reel({ digit, order }: { digit: number; order: number }) {
  return (
    <span data-slot="money-reel" className="relative inline-block [clip-path:inset(0)]">
      <span className="invisible">{digit}</span>
      <span
        className={cn(
          "absolute inset-x-0 top-0 flex flex-col",
          "fun:transition-[translate] fun:duration-[720ms] fun:ease-[cubic-bezier(.2,.9,.25,1.08)] fun:delay-(--d)",
        )}
        style={{ translate: `0 ${-digit * 10}%`, "--d": `${Math.min(order, 10) * 32}ms` } as CSSProperties}
      >
        {REEL.map((n) => (
          <span key={n} className="block">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Characters of a run of figures: digits become reels (numbered from the right), the rest stay put. */
function Figures({ text, roll, offset = 0 }: { text: string; roll: boolean; offset?: number }) {
  if (!roll) return <>{text}</>;
  const chars = Array.from(text);
  let order = offset + chars.filter((c) => /\d/.test(c)).length;
  return (
    <>
      {chars.map((ch, i) => {
        const key = chars.length - i; // keyed from the right: a new leading digit adds a column, the rest keep theirs
        if (/\d/.test(ch)) {
          order -= 1;
          return <Reel key={key} digit={Number(ch)} order={order} />;
        }
        return <span key={key}>{ch}</span>;
      })}
    </>
  );
}

function useMergedRef<T>(outer: Ref<T> | undefined) {
  const inner = useRef<T>(null);
  const set = (node: T | null) => {
    inner.current = node;
    if (typeof outer === "function") outer(node);
    else if (outer) (outer as { current: T | null }).current = node;
  };
  return [inner, set] as const;
}

/* ── Money ───────────────────────────────────────────────── */

const SIZE: Record<MoneySize, string> = {
  sm: "text-[0.875rem]",
  md: "text-[1.0625rem]",
  lg: "text-[2rem] tracking-[-0.02em]",
  xl: "text-[3.25rem] tracking-[-0.03em] leading-[1.05]",
  display: "text-[clamp(3.5rem,9vw,6.5rem)] tracking-[-0.04em] leading-[1]",
};

export interface MoneyProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  value: number;
  /** ISO 4217 code. */
  currency?: string;
  /** BCP 47 locale; the browser's by default. */
  locale?: string;
  size?: MoneySize;
  /** same · small (smaller and raised) · hide (rounded to whole units). */
  cents?: "same" | "small" | "hide";
  /** Always show + / −. */
  sign?: boolean;
  /** 12.4K instead of 12,400.00. */
  compact?: boolean;
  /** trend: coloured by sign. */
  tone?: "plain" | "trend";
  /** Reels (fun) / crossfade (calm) when the value changes. Default true. */
  animate?: boolean;
  /** Typeface: display for lg and up, mono in signal, sans otherwise. */
  look?: MoneyLook;
  /** What the amount is ("Balance"): spoken before it. */
  label?: string;
}

export const Money = forwardRef<HTMLSpanElement, MoneyProps>(function Money(
  { value, currency = "USD", locale, size = "md", cents = "same", sign, compact, tone = "plain", animate = true, look, label, className, style, ...rest },
  outer,
) {
  const [ref, setRef] = useMergedRef<HTMLSpanElement>(outer);
  const { preset, motion } = usePreset(ref);
  const kind: MoneyLook = look ?? (preset === "signal" ? "mono" : size === "lg" || size === "xl" || size === "display" ? "display" : "sans");

  const digits = cents === "hide" && !compact ? 0 : undefined;
  const p = moneyParts(value, { currency, locale, sign, compact, digits });
  const t = trendOf(value);

  // calm: count changes so the crossfade can restart on alternating keyframes
  const [fades, setFades] = useState(0);
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value) setFades((n) => n + 1);
    last.current = value;
  }, [value]);

  const roll = animate && motion === "fun";
  const small = cents === "small";
  const gap = /\p{L}/u.test(p.symbol) || !p.symbolFirst ? " " : "";
  const symbol = p.symbol && (
    <span data-slot="money-symbol" className={cn(small && "text-[0.6em] align-[0.5em] mr-[0.04em]")}>
      {p.symbolFirst ? p.symbol + gap : gap + p.symbol}
    </span>
  );

  return (
    <span
      ref={setRef}
      data-slot="money"
      data-size={size}
      data-look={kind}
      data-trend={tone === "trend" ? t : undefined}
      className={cn(
        "rap-money inline-block whitespace-nowrap tabular-nums",
        SIZE[size],
        kind === "display" && "font-display font-medium",
        kind === "mono" && "font-mono tracking-normal",
        kind === "sans" && "font-sans font-medium",
        tone === "trend" && t === "up" && "text-chart-up",
        tone === "trend" && t === "down" && "text-chart-down",
        className,
      )}
      style={{ fontVariantNumeric: "tabular-nums", ...style }}
      {...rest}
    >
      <span className="sr-only">{spokenMoney(value, { currency, locale, compact, sign, digits, label })}</span>
      <span
        aria-hidden
        data-slot="money-figure"
        className={cn(
          "inline-block",
          animate && fades > 0 && (fades % 2 ? "calm:animate-[rap-money-fade-a_180ms_var(--rap-ease-out)]" : "calm:animate-[rap-money-fade-b_180ms_var(--rap-ease-out)]"),
        )}
      >
        {p.sign && <span data-slot="money-sign">{p.sign}</span>}
        {p.symbolFirst && symbol}
        <span data-slot="money-whole">
          <Figures text={p.whole} roll={roll} offset={p.fraction.length} />
        </span>
        {p.fraction && (
          <span data-slot="money-cents" className={cn(small && "text-[0.55em] align-[0.62em] ml-[0.04em] tracking-normal")}>
            {p.decimal}
            <Figures text={p.fraction} roll={roll} />
          </span>
        )}
        {p.suffix && <span data-slot="money-suffix">{p.suffix}</span>}
        {!p.symbolFirst && symbol}
      </span>
    </span>
  );
});

/* ── MoneyDelta ──────────────────────────────────────────── */

export interface MoneyDeltaProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The change in money; its sign picks the arrow and colour. */
  change: number;
  /** The change in percent (2.4 = 2.4%), shown after a dot. */
  pct?: number;
  currency?: string;
  locale?: string;
  compact?: boolean;
  size?: "sm" | "md";
  /** chip (tinted pill) or plain (coloured text only). */
  variant?: "chip" | "plain";
  /** Quiet trailing text: "today". */
  when?: string;
}

/** A change chip: ▲ +$12.40 · +2.4% in the trend colours. */
export const MoneyDelta = forwardRef<HTMLSpanElement, MoneyDeltaProps>(function MoneyDelta(
  { change, pct, currency = "USD", locale, compact, size = "sm", variant = "chip", when, className, ...rest },
  ref,
) {
  const t = trendOf(change);
  const word = t === "up" ? "Up" : t === "down" ? "Down" : "Unchanged";
  const spoken = `${word} ${spokenMoney(Math.abs(change), { currency, locale, compact })}${pct != null ? `, ${Math.abs(pct).toFixed(1)} percent` : ""}${when ? `, ${when}` : ""}`;
  return (
    <span
      ref={ref}
      data-slot="money-delta"
      data-trend={t}
      className={cn(
        "inline-flex items-center gap-[0.4em] whitespace-nowrap font-medium tabular-nums",
        size === "sm" ? "text-[0.8125rem]" : "text-[0.9375rem]",
        variant === "chip" && "rounded-pill px-[0.6em] py-[0.2em]",
        t === "up" && "text-chart-up",
        t === "down" && "text-chart-down",
        t === "flat" && "text-mute",
        variant === "chip" && t === "up" && "bg-chart-up/12",
        variant === "chip" && t === "down" && "bg-chart-down/12",
        variant === "chip" && t === "flat" && "bg-fill",
        className,
      )}
      {...rest}
    >
      <span className="sr-only">{spoken}</span>
      <span aria-hidden className="text-[0.75em]">
        {t === "up" ? "▲" : t === "down" ? "▼" : "■"}
      </span>
      <span aria-hidden>
        {formatMoney(change, { currency, locale, compact, sign: true })}
        {pct != null && ` · ${formatPercent(pct, { locale, digits: 1 })}`}
      </span>
      {when && (
        <span aria-hidden className="text-mute font-normal">
          {when}
        </span>
      )}
    </span>
  );
});
