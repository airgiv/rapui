/* Money formatting shared by the finance components. Intl does the locale
   work; these helpers only add what a UI needs on top: the parts split so the
   cents can be set smaller, a sign that is always shown for changes, and a
   compact form (12.4k, 3.1M) for tight spots. */

export interface MoneyFormat {
  /** ISO 4217 code: "USD", "EUR", "JPY"… */
  currency?: string;
  /** BCP 47 locale; the browser's by default. */
  locale?: string;
  /** 12.4K instead of 12,400.00. */
  compact?: boolean;
  /** Always show + or − (for changes and transactions). */
  sign?: boolean;
  /** Fraction digits; the currency's own by default (0 for JPY, 2 for USD). */
  digits?: number;
}

function formatter({ currency = "USD", locale, compact, sign, digits }: MoneyFormat) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    signDisplay: sign ? "exceptZero" : "auto",
    ...(digits != null ? { minimumFractionDigits: digits, maximumFractionDigits: digits } : compact ? { maximumFractionDigits: 1 } : {}),
  });
}

/** "$1,240.50", "−€12.00", "+$3.1K". The minus is a real minus sign (U+2212). */
export function formatMoney(value: number, opts: MoneyFormat = {}): string {
  return formatter(opts).format(value).replace("-", "−");
}

/** The formatted amount in parts: sign, currency symbol, whole, decimal mark, fraction, compact suffix —
    and whether the symbol comes before the number in this locale. */
export function moneyParts(value: number, opts: MoneyFormat = {}) {
  const parts = formatter(opts).formatToParts(value);
  const out = { sign: "", symbol: "", whole: "", decimal: "", fraction: "", suffix: "", symbolFirst: true };
  let seenNumber = false;
  for (const p of parts) {
    if (p.type === "minusSign") out.sign = "−";
    else if (p.type === "plusSign") out.sign = "+";
    else if (p.type === "currency") {
      out.symbol = p.value;
      out.symbolFirst = !seenNumber;
    } else if (p.type === "integer" || p.type === "group") {
      out.whole += p.value;
      seenNumber = true;
    } else if (p.type === "decimal") out.decimal = p.value;
    else if (p.type === "fraction") out.fraction = p.value;
    else if (p.type === "compact") out.suffix = p.value;
  }
  return out;
}

/** A plain number with grouping: 12,400 / 12 400 / 12.400 by locale. */
export function formatNumber(value: number, opts: { locale?: string; digits?: number; sign?: boolean; compact?: boolean } = {}) {
  return new Intl.NumberFormat(opts.locale, {
    notation: opts.compact ? "compact" : "standard",
    signDisplay: opts.sign ? "exceptZero" : "auto",
    ...(opts.digits != null ? { minimumFractionDigits: opts.digits, maximumFractionDigits: opts.digits } : {}),
  })
    .format(value)
    .replace("-", "−");
}

/** "+2.40%" / "−0.85%". */
export function formatPercent(value: number, opts: { locale?: string; digits?: number; sign?: boolean } = {}) {
  const d = opts.digits ?? 2;
  return new Intl.NumberFormat(opts.locale, {
    style: "percent",
    signDisplay: opts.sign === false ? "auto" : "exceptZero",
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
    .format(value / 100)
    .replace("-", "−");
}

/** up / down / flat, for colouring a change. */
export const trend = (v: number): "up" | "down" | "flat" => (v > 0 ? "up" : v < 0 ? "down" : "flat");
