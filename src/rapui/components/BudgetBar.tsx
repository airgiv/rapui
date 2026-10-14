/* ══ BudgetBar ═════════════════════════════════════════════
   Spending against a budget, the way a banking app shows the month:
   "$1,420 spent of $2,000 · $580 left", one bar split into the
   categories the money went on, a tick for TODAY — where spending
   would be if it went evenly through the month — and a legend with
   each category's amount and share.

     <BudgetBar budget={2000} pace={0.45} categories={[{ name: "Groceries", amount: 412 }, …]} />

   Over budget, the bar keeps telling the truth instead of pinning at
   100%: it rescales to what was spent, the budget becomes a NOTCH cut
   into the bar, and everything past the notch is drawn in danger,
   striped, with "$140 over" in the header. Point at a segment (or tab
   to it) and it and its legend row come forward while the rest step
   back; point at a legend row and its segment does the same.

   THE DELIGHT is a pour: on mount the segments fill in from the left,
   one after another, each landing with a small overshoot, and the
   today tick drops in once the bar is full. In fun only. Calm: the
   bar is simply there, a quick fade; highlighting is a colour change,
   never a movement. */
import { forwardRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "../utils";
import { formatMoney, formatPercent } from "../finance";
import { spokenMoney } from "./Money";
import "./BudgetBar.css";

export type BudgetColor = "flame" | "blue" | "acid" | "bubble" | "sky" | "plum";
const PALETTE: BudgetColor[] = ["flame", "blue", "acid", "bubble", "sky", "plum"];
/* written out whole so Tailwind sees every class */
const BG: Record<BudgetColor, string> = {
  flame: "bg-flame",
  blue: "bg-blue",
  acid: "bg-acid",
  bubble: "bg-bubble",
  sky: "bg-sky",
  plum: "bg-plum",
};

export interface BudgetCategory {
  name: string;
  amount: number;
  /** Palette colour; by default they are dealt in order flame, blue, acid, bubble, sky, plum. */
  color?: BudgetColor;
}

export interface BudgetBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  categories: BudgetCategory[];
  /** The budget for the period. */
  budget: number;
  /** ISO 4217 code (default "USD"). */
  currency?: string;
  /** BCP 47 locale; the browser's by default. */
  locale?: string;
  /** How far through the period we are, 0..1 — draws the "today" tick at budget × pace. */
  pace?: number;
  /** One line and a thin bar, no legend. */
  compact?: boolean;
  /** What the budget is called, for the heading and screen readers (default "Budget"). */
  label?: string;
}

export const BudgetBar = forwardRef<HTMLDivElement, BudgetBarProps>(function BudgetBar(
  { categories, budget, currency = "USD", locale, pace, compact = false, label = "Budget", className, ...rest },
  ref,
) {
  const [hot, setHot] = useState<number | null>(null);

  const cats = categories.map((c, i) => ({ ...c, color: c.color ?? PALETTE[i % PALETTE.length] }));
  const spent = cats.reduce((a, c) => a + Math.max(0, c.amount), 0);
  const over = spent > budget;
  const left = budget - spent;
  // whole amounts print whole: "$1,420", not "$1,420.00"
  const whole = [budget, ...cats.map((c) => c.amount)].every((v) => Number.isInteger(v));
  const fmt = (v: number) => formatMoney(v, { currency, locale, digits: whole ? 0 : undefined });
  const say = (v: number) => spokenMoney(v, { currency, locale, digits: whole ? 0 : undefined });

  /* the scale: the budget, or what was spent once that is more */
  const scale = Math.max(budget, spent) || 1;
  const budgetAt = (budget / scale) * 100;
  const expected = pace != null ? budget * Math.min(1, Math.max(0, pace)) : null;
  const paceAt = expected != null ? (expected / scale) * 100 : null;
  const vsPace = expected != null ? spent - expected : 0;

  const summary = `${label}: ${say(spent)} spent of ${say(budget)}, ${
    over ? `${say(-left)} over budget` : `${say(left)} left`
  }${expected != null ? `. ${say(Math.abs(vsPace))} ${vsPace > 0 ? "ahead of" : "behind"} an even pace for today` : ""}.`;

  return (
    <div
      ref={ref}
      data-slot="budget-bar"
      data-over={over || undefined}
      role="group"
      aria-label={summary}
      className={cn("w-full text-ink font-sans", className)}
      {...rest}
    >
      {/* ── the sentence ── */}
      <p
        data-slot="budget-head"
        aria-hidden
        className={cn("m-0 flex flex-wrap items-baseline gap-x-1.5 tabular-nums", compact ? "text-[13px]" : "text-[14px]")}
      >
        <b className={cn("font-display font-medium tracking-[-0.02em]", compact ? "text-[15px]" : "text-[22px]")}>
          {fmt(spent)}
        </b>
        <span className="text-ink-2">spent of {fmt(budget)}</span>
        <span className="text-mute">·</span>
        {over ? (
          <span className="font-medium text-danger">{fmt(-left).replace("−", "")} over</span>
        ) : (
          <span className="text-ink-2">{fmt(left)} left</span>
        )}
      </p>

      {/* ── the bar ── */}
      <div data-slot="budget-track-wrap" className={cn("relative", compact ? "mt-2" : "mt-3", paceAt != null && !compact && "mb-5")}>
        <div
          data-slot="budget-track"
          className={cn(
            "relative flex w-full gap-[2px] overflow-hidden rounded-pill bg-fill",
            compact ? "h-2" : "h-3.5",
            "calm:motion-safe:animate-[rap-fade-in_var(--rap-dur)_var(--rap-ease-out)_both]",
          )}
        >
          {cats.map((c, i) => {
            const share = spent ? (c.amount / spent) * 100 : 0;
            return (
              <span
                key={c.name}
                role="img"
                tabIndex={compact ? -1 : 0}
                data-slot="budget-segment"
                data-hot={hot === i || undefined}
                aria-label={`${c.name}, ${say(c.amount)}, ${Math.round(share)} percent of spending`}
                onPointerEnter={() => setHot(i)}
                onPointerLeave={() => setHot(null)}
                onFocus={() => setHot(i)}
                onBlur={() => setHot(null)}
                className={cn(
                  "h-full min-w-[3px] shrink-0 origin-left outline-none transition-opacity duration-150",
                  BG[c.color],
                  hot !== null && hot !== i && "opacity-30",
                  "focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
                  "fun:animate-[rap-budget-pour_520ms_cubic-bezier(0.3,1.35,0.45,1)_both]",
                )}
                style={
                  {
                    width: `calc(${(c.amount / scale) * 100}% - 2px)`,
                    animationDelay: `${i * 90}ms`,
                  } as CSSProperties
                }
              />
            );
          })}
          {/* past the budget: danger, striped, over whatever categories ran into it */}
          {over && (
            <span
              aria-hidden
              data-slot="budget-overflow"
              className="absolute inset-y-0 right-0 bg-danger fun:animate-[rap-fade-in_300ms_var(--rap-ease-out)_both]"
              style={{
                left: `${budgetAt}%`,
                animationDelay: `${cats.length * 90 + 300}ms`,
                backgroundImage:
                  "repeating-linear-gradient(-45deg, transparent 0 4px, color-mix(in oklab, var(--rap-surface) 28%, transparent) 4px 7px)",
              }}
            />
          )}
        </div>

        {/* the notch: the budget's end, cut into the bar and a little past it */}
        {over && (
          <span
            aria-hidden
            data-slot="budget-notch"
            className="absolute -top-1 -bottom-1 w-[3px] -ml-[1.5px] rounded-pill bg-surface shadow-[0_0_0_1px_var(--rap-danger)]"
            style={{ left: `${budgetAt}%` }}
          />
        )}

        {/* today: where an even month would have you */}
        {paceAt != null && (
          <span
            aria-hidden
            data-slot="budget-pace"
            className={cn(
              "absolute -top-1 -bottom-1 w-0 pointer-events-none",
              "fun:animate-[rap-budget-tick_360ms_cubic-bezier(0.3,1.5,0.45,1)_both]",
            )}
            style={{ left: `${paceAt}%`, animationDelay: `${cats.length * 90 + 380}ms` }}
          >
            <i className="absolute inset-y-0 -left-px w-[2px] rounded-pill bg-ink" />
            {!compact && (
              <span
                className="absolute top-[calc(100%+3px)] whitespace-nowrap text-[11px] leading-none text-mute"
                style={{ translate: `${-Math.min(100, Math.max(0, paceAt))}% 0` }}
              >
                Today
              </span>
            )}
          </span>
        )}
      </div>

      {/* ── the legend ── */}
      {!compact && (
        <ul data-slot="budget-legend" className="m-0 mt-3 list-none p-0 text-[13.5px]">
          {cats.map((c, i) => {
            const share = spent ? (c.amount / spent) * 100 : 0;
            return (
              <li
                key={c.name}
                data-slot="budget-row"
                data-hot={hot === i || undefined}
                onPointerEnter={() => setHot(i)}
                onPointerLeave={() => setHot(null)}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-2 py-1.5 -mx-2 transition-[background-color,opacity] duration-150",
                  hot === i && "bg-fill",
                  hot !== null && hot !== i && "opacity-55",
                )}
              >
                <i aria-hidden className={cn("size-2.5 shrink-0 rounded-full", BG[c.color])} />
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <span className="tabular-nums font-medium">{fmt(c.amount)}</span>
                <span className="w-12 text-right tabular-nums text-mute">
                  {formatPercent(share, { locale, digits: 0, sign: false })}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* the verdict on pace, in words */}
      {!compact && expected != null && (
        <p data-slot="budget-pace-note" className="m-0 mt-2 text-[12.5px] text-mute tabular-nums">
          {Math.abs(vsPace) < budget * 0.01
            ? "Right on pace for today."
            : vsPace > 0
              ? `${fmt(vsPace)} ahead of an even pace for today.`
              : `${fmt(-vsPace)} under an even pace for today.`}
        </p>
      )}
    </div>
  );
});
