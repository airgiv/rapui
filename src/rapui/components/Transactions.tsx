/* ══ Transactions ═════════════════════════════════════════
   The list every banking app opens on: payments grouped by day
   ("Today", "Yesterday", "Mon 12 May"), each day headed by its net
   total. A row is a merchant face (logo, or initials on a colour
   picked from the name), merchant, category and time, a Pending badge
   while it clears, the amount — income in the up colour with a +,
   spending plain — and, if you pass it, the balance after it.

     <Transactions items={txns} currency="USD" onSelect={open} searchable />

   With `onSelect` each row is a button (Tab / Enter / Space) and the
   chosen one is marked aria-current. `loading` shows skeleton rows,
   an empty list (or a search with no hits) says so. Every row has a
   spoken label: "Kettle & Crumb, Coffee, 8:14 AM, spent 4 US dollars
   50 cents, pending".

   Fun: on mount the rows rise in, staggered 35ms apart, and the
   selected row lifts off the list. Calm: they fade in; selection is
   a tint. */
import { forwardRef, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { formatMoney, moneyParts, type MoneyFormat } from "../finance";
import { Inbox, Search } from "../icons";
import { cn } from "../utils";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";
import { Input } from "./Input";
import { Skeleton, SkeletonCircle } from "./Skeleton";

export interface Transaction {
  id: string;
  merchant: string;
  /** Negative = money out, positive = money in. */
  amount: number;
  date: Date | string | number;
  category?: string;
  /** Merchant logo URL; initials on a tone from the name otherwise. */
  logo?: string;
  pending?: boolean;
  /** Account balance after this transaction. */
  balance?: number;
  /** Overrides the transaction's own currency (defaults to the list's). */
  currency?: string;
}

export interface TransactionsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  items: Transaction[];
  /** ISO 4217. Default USD. */
  currency?: string;
  locale?: string;
  /** Group rows under day headers (default) or one flat list. */
  groupBy?: "day" | "none";
  /** Rows become buttons; called with the chosen transaction. */
  onSelect?: (item: Transaction) => void;
  /** Controlled selection (otherwise the last row chosen). */
  selectedId?: string | null;
  /** Show skeleton rows instead of items. */
  loading?: boolean;
  /** How many skeleton rows while loading. Default 5. */
  skeletonRows?: number;
  /** A search field over merchant, category and amount. */
  searchable?: boolean;
  /** Show each row's running balance when it has one. Default true. */
  showBalance?: boolean;
  /** What "today" is, for the day labels. Default: now. */
  now?: Date;
  /** Shown when there are no items. */
  empty?: ReactNode;
}

/* ── shared money bits (used by Receipt and TransferStatus too) ── */

/** A spoken amount: "1,240 US dollars 50 cents" in English, Intl's long name elsewhere. */
export function moneyLabel(value: number, { currency = "USD", locale }: Pick<MoneyFormat, "currency" | "locale"> = {}) {
  const abs = Math.abs(value);
  const nf = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "name" });
  const digits = nf.resolvedOptions().maximumFractionDigits ?? 2;
  const lang = (locale ?? (typeof navigator !== "undefined" ? navigator.language : "en")).toLowerCase();
  if (digits === 2 && lang.startsWith("en")) {
    const whole = Math.floor(abs + 1e-9);
    const cents = Math.round((abs - whole) * 100);
    const w = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "name", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(whole);
    return cents ? `${w} ${cents} ${cents === 1 ? "cent" : "cents"}` : w;
  }
  return nf.format(abs);
}

/** A formatted amount with the cents set a touch smaller; digits are tabular. */
export function MoneyText({ value, className, fractionClassName, ...fmt }: { value: number; className?: string; fractionClassName?: string } & MoneyFormat) {
  const p = moneyParts(value, fmt);
  const sym = <span data-part="symbol">{p.symbol}</span>;
  return (
    <span data-slot="money" className={cn("tabular-nums whitespace-nowrap", className)}>
      {p.sign}
      {p.symbolFirst && sym}
      {p.whole}
      {p.fraction && (
        <span data-part="fraction" className={cn("text-[0.86em]", fractionClassName)}>
          {p.decimal}
          {p.fraction}
        </span>
      )}
      {p.suffix}
      {!p.symbolFirst && <>{" "}{sym}</>}
    </span>
  );
}

/* ── day labels ── */

const toDate = (d: Transaction["date"]) => (d instanceof Date ? d : new Date(d));
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function dayLabel(d: Date, now: Date, locale?: string) {
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  })
    .format(d)
    .replace(/,/g, "");
}

/* ── the component ── */

export const Transactions = forwardRef<HTMLDivElement, TransactionsProps>(function Transactions(
  {
    items,
    currency = "USD",
    locale,
    groupBy = "day",
    onSelect,
    selectedId,
    loading = false,
    skeletonRows = 5,
    searchable = false,
    showBalance = true,
    now,
    empty,
    className,
    ...rest
  },
  ref,
) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const selected = selectedId !== undefined ? selectedId : picked;
  const searchId = useId();

  // rows animate in on the first paint only, not every time a search re-renders them
  const [entering, setEntering] = useState(true);
  const t = useRef(0);
  useEffect(() => {
    if (loading) return;
    t.current = window.setTimeout(() => setEntering(false), 1400);
    return () => window.clearTimeout(t.current);
  }, [loading]);

  const today = now ?? new Date();
  const timeFmt = useMemo(() => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }), [locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
    if (!q) return sorted;
    return sorted.filter((it) =>
      [it.merchant, it.category ?? "", formatMoney(it.amount, { currency: it.currency ?? currency, locale })].some((s) => s.toLowerCase().includes(q)),
    );
  }, [items, query, currency, locale]);

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ key: "all", label: "", items: filtered }];
    const out: { key: string; label: string; items: Transaction[] }[] = [];
    for (const it of filtered) {
      const d = toDate(it.date);
      const k = dayKey(d);
      let g = out[out.length - 1];
      if (!g || g.key !== k) out.push((g = { key: k, label: dayLabel(d, today, locale), items: [] }));
      g.items.push(it);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, groupBy, locale, today.toDateString()]);

  let index = 0; // running row index, for the stagger

  const row = (it: Transaction) => {
    const cur = it.currency ?? currency;
    const d = toDate(it.date);
    const income = it.amount > 0;
    const isSel = selected === it.id;
    const i = index++;
    const spoken = [
      it.merchant,
      it.category,
      groupBy === "none" ? `${dayLabel(d, today, locale)} ${timeFmt.format(d)}` : timeFmt.format(d),
      `${income ? "received" : "spent"} ${moneyLabel(it.amount, { currency: cur, locale })}`,
      it.pending && "pending",
      showBalance && it.balance != null && `balance ${it.balance < 0 ? "minus " : ""}${moneyLabel(it.balance, { currency: cur, locale })}`,
    ]
      .filter(Boolean)
      .join(", ");

    const inner = (
      <>
        <Avatar size="md" name={it.merchant} src={it.logo} alt="" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-ink">{it.merchant}</span>
            {it.pending && (
              <Badge size="sm" variant="warning" dot>
                Pending
              </Badge>
            )}
          </span>
          <span className="truncate text-[0.8125rem] text-mute">
            {[it.category, groupBy === "none" ? `${dayLabel(d, today, locale)} · ${timeFmt.format(d)}` : timeFmt.format(d)].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className="flex flex-none flex-col items-end gap-0.5 text-right">
          <MoneyText
            value={income ? it.amount : Math.abs(it.amount)}
            sign={income}
            currency={cur}
            locale={locale}
            className={cn("font-medium", income ? "text-chart-up" : "text-ink", it.pending && "opacity-70")}
          />
          {showBalance && it.balance != null && <MoneyText value={it.balance} currency={cur} locale={locale} className="text-[0.75rem] text-mute" />}
        </span>
      </>
    );

    const rowCls = cn(
      "flex w-full items-center gap-3 px-3 py-2.5 text-left rounded-sm",
      entering && "fun:animate-[rap-label-in_480ms_var(--rap-ease-spring)_both] calm:animate-[rap-fade-in_320ms_var(--rap-ease-out)_both]",
      entering && "[animation-delay:calc(var(--i)*35ms)]",
    );

    return (
      <li key={it.id} data-slot="transaction" data-pending={it.pending || undefined} className="list-none">
        {onSelect ? (
          <button
            type="button"
            aria-label={spoken}
            aria-current={isSel || undefined}
            onClick={() => {
              setPicked(it.id);
              onSelect(it);
            }}
            style={{ "--i": Math.min(i, 14) } as CSSProperties}
            className={cn(
              rowCls,
              "cursor-pointer outline-none transition-[background-color,translate,box-shadow] duration-(--rap-dur-fast) ease-rm",
              "hover:bg-fill focus-visible:ring-2 focus-visible:ring-ring",
              isSel && "bg-fill",
              isSel && "fun:bg-surface fun:-translate-y-0.5 fun:shadow-pop fun:relative fun:z-1",
            )}
          >
            {inner}
          </button>
        ) : (
          <div role="group" aria-label={spoken} style={{ "--i": Math.min(i, 14) } as CSSProperties} className={rowCls}>
            {inner}
          </div>
        )}
      </li>
    );
  };

  const body = () => {
    if (loading)
      return (
        <ul aria-hidden className="flex flex-col p-0 m-0">
          {groupBy === "day" && <Skeleton shape="pill" width={96} height={12} className="mx-3 my-3" />}
          {Array.from({ length: skeletonRows }, (_, i) => (
            <li key={i} className="flex list-none items-center gap-3 px-3 py-2.5">
              <SkeletonCircle size={40} />
              <span className="flex flex-1 flex-col gap-2">
                <Skeleton shape="pill" height={12} width={`${48 + ((i * 17) % 30)}%`} />
                <Skeleton shape="pill" height={10} width={`${26 + ((i * 11) % 18)}%`} />
              </span>
              <Skeleton shape="pill" height={12} width={56} />
            </li>
          ))}
        </ul>
      );
    if (filtered.length === 0)
      return (
        empty ?? (
          <EmptyState
            size="sm"
            icon={query ? <Search size={28} /> : <Inbox size={28} />}
            title={query ? "No matches" : "No transactions yet"}
            description={query ? `Nothing matches “${query.trim()}”.` : "Payments and transfers will show up here."}
          />
        )
      );
    return groups.map((g) => {
      const net = g.items.reduce((s, it) => s + it.amount, 0);
      const headId = `${searchId}-${g.key}`;
      return (
        <section key={g.key} data-slot="transactions-day" aria-labelledby={groupBy === "day" ? headId : undefined} className="flex flex-col">
          {groupBy === "day" && (
            <div className="flex items-baseline justify-between gap-3 px-3 pt-4 pb-1.5 text-[0.8125rem]">
              <h3 id={headId} className="m-0 font-medium text-ink-2 text-[length:inherit]">
                {g.label}
              </h3>
              <span className="text-mute" aria-label={`Net ${net < 0 ? "minus " : net > 0 ? "plus " : ""}${moneyLabel(net, { currency, locale })}`}>
                <MoneyText value={net} sign currency={currency} locale={locale} className={net > 0 ? "text-chart-up" : undefined} />
              </span>
            </div>
          )}
          <ul className="m-0 flex flex-col gap-0.5 p-0">{g.items.map(row)}</ul>
        </section>
      );
    });
  };

  return (
    <div ref={ref} data-slot="transactions" aria-busy={loading || undefined} className={cn("flex w-full flex-col font-sans text-[0.9375rem]", className)} {...rest}>
      {searchable && (
        <div className="px-1 pb-1">
          <Input
            size="sm"
            type="search"
            aria-label="Search transactions"
            placeholder="Search transactions"
            prefix={<Search />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}
      {loading && (
        <span role="status" className="sr-only">
          Loading transactions
        </span>
      )}
      {body()}
      {searchable && !loading && (
        <span role="status" aria-live="polite" className="sr-only">
          {query.trim() ? `${filtered.length} ${filtered.length === 1 ? "transaction" : "transactions"}` : ""}
        </span>
      )}
    </div>
  );
});
