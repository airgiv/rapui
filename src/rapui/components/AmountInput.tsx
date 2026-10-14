/* ══ AmountInput ══════════════════════════════════════════
   The "send money" field: one huge amount in the middle of the
   screen, the currency symbol beside it, the balance underneath and
   a row of quick chips (+10, +50, +100, Max).

     <AmountInput currency="EUR" balance={2480.12} onValueChange={setAmount} />

   It is a real <input inputMode="decimal"> with a label, so phones
   bring up the number pad and screen readers get a named field.
   Typing is locale-aware: the locale's decimal mark (and "." as well,
   for keypads that only have a dot), grouping added as you go, never
   more fraction digits than the currency has (two for USD, none for
   JPY). The figure STEPS DOWN in size as digits are added, so a
   seven-figure amount still fits on one line.

   DELIGHT — over the balance the whole figure SHAKES "no" once (the
   rising edge only) and turns the danger colour, with a message under
   it. Calm: no shake — it turns danger and the message appears; the
   size steps are instant. */
import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
} from "react";
import { formatMoney, moneyParts } from "../finance";
import { cn } from "../utils";
import { isMotionCalm } from "./FormField";
import { currencyDigits } from "./Money";

export interface AmountInputProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Controlled amount. */
  value?: number | null;
  defaultValue?: number | null;
  /** Called with the parsed amount (0 when empty) on every edit. */
  onValueChange?: (value: number) => void;
  currency?: string;
  locale?: string;
  /** Visible label above the figure. */
  label?: string;
  /** The spendable balance: shown as a hint, the default `max`, and what "Max" fills in. */
  balance?: number;
  /** Upper limit; defaults to `balance`. Above it the field is invalid. */
  max?: number;
  /** Quick add chips. Pass [] to hide them. "Max" is added when there is a max. */
  chips?: number[];
  /** Message when over the max. */
  overMessage?: string;
  /** Hint under the figure; defaults to "Balance $2,480.12". */
  hint?: string;
  name?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** id for the <input>. */
  inputId?: string;
}

/* the locale's decimal and grouping marks */
function marks(locale?: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    decimal: parts.find((p) => p.type === "decimal")?.value ?? ".",
    group: parts.find((p) => p.type === "group")?.value ?? ",",
  };
}

/* canonical text ("1240.5") → what the field shows ("1,240.5") */
function display(raw: string, locale: string | undefined, decimal: string) {
  if (!raw) return "";
  const [w, f] = raw.split(".");
  const whole = w === "" ? "0" : new Intl.NumberFormat(locale, { maximumFractionDigits: 0, useGrouping: true }).format(Number(w));
  return f === undefined ? whole : whole + decimal + f;
}

/* number → canonical text, trailing ".00" dropped */
function toRaw(n: number | null | undefined, fd: number) {
  if (n == null || !isFinite(n) || n === 0) return "";
  const s = Math.abs(n).toFixed(fd);
  return /\.0+$/.test(s) ? s.replace(/\.0+$/, "") : s;
}

const parse = (raw: string) => (raw === "" || raw === "." ? 0 : Number(raw));

/* the figure's size steps down as it gets longer */
function step(len: number) {
  if (len <= 4) return "text-[clamp(3.25rem,12vw,4.75rem)]";
  if (len <= 6) return "text-[clamp(2.9rem,10.5vw,4.25rem)]";
  if (len <= 8) return "text-[clamp(2.5rem,9vw,3.5rem)]";
  if (len <= 10) return "text-[clamp(2.1rem,7.5vw,2.85rem)]";
  return "text-[clamp(1.75rem,6vw,2.35rem)]";
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(function AmountInput(
  {
    value,
    defaultValue,
    onValueChange,
    currency = "USD",
    locale,
    label = "Amount",
    balance,
    max,
    chips = [10, 50, 100],
    overMessage,
    hint,
    name,
    disabled,
    autoFocus,
    inputId,
    className,
    ...rest
  },
  ref,
) {
  const fd = useMemo(() => currencyDigits(currency, locale), [currency, locale]);
  const { decimal, group } = useMemo(() => marks(locale), [locale]);
  const sym = moneyParts(0, { currency, locale });
  const limit = max ?? balance;

  const [raw, setRaw] = useState(() => toRaw(value ?? defaultValue, fd));
  const amount = parse(raw);

  // controlled: follow the prop when it says something different from what is typed
  useEffect(() => {
    if (value === undefined) return;
    setRaw((r) => (parse(r) === (value ?? 0) ? r : toRaw(value, fd)));
  }, [value, fd]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const caret = useRef<number | null>(null);
  const autoId = useId();
  const id = inputId ?? `${autoId}-amount`;
  const hintId = `${autoId}-hint`;
  const msgId = `${autoId}-msg`;

  const commit = (next: string) => {
    setRaw(next);
    onValueChange?.(parse(next));
  };

  /* keep only digits and one decimal mark; cap the fraction; drop leading zeros */
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const typed = el.value;
    const pos = el.selectionStart ?? typed.length;
    let out = "";
    let seenDot = false;
    let before = 0; // canonical characters left of the caret
    for (let i = 0; i < typed.length; i++) {
      const c = typed[i];
      let add = "";
      if (/\d/.test(c)) add = c;
      else if (!seenDot && fd > 0) {
        // the locale's mark is always a decimal; "." too (keypads that only have a dot) — unless "."
        // is this locale's grouping mark, when it counts only as the key just pressed
        const isDecimal = c === decimal || (c === "." && (group !== "." || i === pos - 1));
        if (isDecimal) {
          add = ".";
          seenDot = true;
        }
      }
      if (add && add !== "." && !seenDot && out.replace(/^0+/, "").length >= 12) add = "";
      if (add && seenDot && add !== "." && out.split(".")[1]?.length >= fd) add = "";
      out += add;
      if (i < pos) before += add.length;
    }
    // leading zeros: "007" → "7", but keep "0.5"
    const stripped = out.replace(/^0+(?=\d)/, "");
    before -= out.length - stripped.length;
    out = stripped === "." ? "0." : stripped;
    caret.current = Math.max(0, before);
    commit(out);
  };

  // put the caret back after the same number of figures once grouping has been redrawn
  const shown = display(raw, locale, decimal);
  useEffect(() => {
    const el = inputRef.current;
    if (caret.current == null || !el || document.activeElement !== el) return;
    let n = caret.current;
    let i = 0;
    while (i < shown.length && n > 0) {
      if (/\d/.test(shown[i]) || shown[i] === decimal) n--;
      i++;
    }
    el.setSelectionRange(i, i);
    caret.current = null;
  }, [shown, decimal]);

  const over = limit != null && amount > limit;
  const wasOver = useRef(false);
  useEffect(() => {
    if (over && !wasOver.current && figureRef.current && !isMotionCalm(figureRef.current)) {
      figureRef.current.animate(
        [{ translate: "0" }, { translate: "-9px" }, { translate: "8px" }, { translate: "-5px" }, { translate: "3px" }, { translate: "-1px" }, { translate: "0" }],
        { duration: 440, easing: "cubic-bezier(.3,.7,.4,1)" },
      );
    }
    wasOver.current = over;
  }, [over]);

  const add = (n: number) => commit(toRaw(Number((amount + n).toFixed(fd)), fd));
  const hintText = hint ?? (balance != null ? `Balance ${formatMoney(balance, { currency, locale })}` : undefined);
  const message = overMessage ?? (balance != null && limit === balance ? "That's more than your balance" : `The most you can send is ${formatMoney(limit ?? 0, { currency, locale })}`);
  const len = (shown || "0").length;
  const describedBy = [hintText && hintId, over && msgId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      data-slot="amount-input"
      data-over={over || undefined}
      className={cn("flex flex-col items-center gap-3 text-center text-ink", disabled && "opacity-50", className)}
      {...rest}
    >
      <label htmlFor={id} data-slot="amount-input-label" className="text-[0.875rem] font-medium text-mute">
        {label}
      </label>

      <div
        ref={figureRef}
        data-slot="amount-input-figure"
        className={cn(
          "flex max-w-full items-baseline justify-center font-display font-medium leading-[1.1] tracking-[-0.035em] tabular-nums",
          "transition-[font-size,color] fun:duration-(--rap-dur-fast) ease-soft calm:duration-0",
          step(len),
          over ? "text-danger" : raw ? "text-ink" : "text-mute",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {sym.symbolFirst && (
          <span aria-hidden className="mr-[0.06em] text-[0.62em] self-start mt-[0.12em]">
            {sym.symbol}
          </span>
        )}
        {/* the field sizes to its own text: an invisible copy in the same grid cell sets the width */}
        <span className="inline-grid min-w-0 max-w-full">
          <span aria-hidden className="invisible whitespace-pre [grid-area:1/1] px-[0.02em]">
            {shown || "0"}
          </span>
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            id={id}
            name={name}
            type="text"
            inputMode={fd > 0 ? "decimal" : "numeric"}
            autoComplete="off"
            spellCheck={false}
            placeholder="0"
            value={shown}
            onChange={onChange}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-invalid={over || undefined}
            aria-describedby={describedBy}
            data-slot="amount-input-field"
            className={cn(
              "[grid-area:1/1] w-full min-w-[1ch] border-0 bg-transparent p-0 text-center text-inherit [font:inherit] [letter-spacing:inherit]",
              "caret-accent outline-none placeholder:text-mute",
            )}
          />
        </span>
        {!sym.symbolFirst && (
          <span aria-hidden className="ml-[0.12em] text-[0.62em] self-start mt-[0.12em]">
            {sym.symbol}
          </span>
        )}
        <span className="sr-only">{currency}</span>
      </div>

      <div className="min-h-[1.25rem] text-[0.875rem]" aria-live="polite">
        {over ? (
          <p id={msgId} data-slot="amount-input-message" className="m-0 font-medium text-danger">
            {message}
          </p>
        ) : (
          hintText && (
            <p id={hintId} data-slot="amount-input-hint" className="m-0 text-mute tabular-nums">
              {hintText}
            </p>
          )
        )}
      </div>

      {(chips.length > 0 || limit != null) && (
        <div data-slot="amount-input-chips" role="group" aria-label="Quick amounts" className="flex flex-wrap justify-center gap-2">
          {chips.map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => add(n)}
              aria-label={`Add ${formatMoney(n, { currency, locale, digits: 0 })}`}
              className={chipClass}
            >
              {formatMoney(n, { currency, locale, digits: 0, sign: true })}
            </button>
          ))}
          {limit != null && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => commit(toRaw(limit, fd))}
              aria-label={`Max, ${formatMoney(limit, { currency, locale })}`}
              className={cn(chipClass, "bg-ink text-paper hover:bg-ink/85")}
            >
              Max
            </button>
          )}
        </div>
      )}
    </div>
  );
});

const chipClass = cn(
  "inline-flex h-control-sm items-center rounded-pill bg-fill px-4 text-[0.875rem] font-medium tabular-nums text-ink cursor-pointer",
  "transition-[background-color,scale] duration-(--rap-dur-fast) ease-rm hover:bg-fill-hover",
  "fun:active:scale-94 calm:active:scale-98",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40 disabled:pointer-events-none",
);
