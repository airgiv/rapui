/* ══ Receipt · TransferStatus ═════════════════════════════
   Receipt: the paper slip after a purchase — merchant, date, the
   line items (qty × price), subtotal, tax, tip and a big total,
   the card it went on ("Visa •••• 4242"), a dashed rule and a code
   at the foot (a QR-ish dot square, a barcode, or none). The bottom
   edge is torn along its perforation (a CSS mask), so it sits on
   any background like real paper.

     <Receipt merchant="Kettle & Crumb" items={lines} taxRate={8.875}
              tip={3} payment="Visa •••• 4242" />

   TransferStatus: where a money transfer is — Initiated → Processing
   → Sent → Arrived — as a vertical or horizontal stepper with the
   time each step happened, the amount and the recipient on top, and
   an error state ("Returned by bank") that stops it where it failed.

     <TransferStatus amount={250} recipient="Ana Lima" status="sent"
                     timestamps={{ initiated, processing, sent }} />

   Fun: the receipt feeds out of a slot; the transfer's current step
   pulses. Calm: the receipt fades in; the current step is a still dot. */
import { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from "react";
import { formatMoney, moneyParts } from "../finance";
import { Check, X } from "../icons";
import { cn } from "../utils";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { DotMatrix } from "./DotMatrix";
import { MoneyText, moneyLabel } from "./Transactions";
import "./Receipt.css";

type When = Date | string | number;
const toDate = (d: When) => (d instanceof Date ? d : new Date(d));

/** a tiny deterministic hash, so a reference always draws the same code */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/* ═════════════ Receipt ═════════════ */

export interface ReceiptItem {
  name: string;
  /** Default 1. */
  qty?: number;
  /** Unit price. */
  price: number;
  /** A modifier line under the name ("oat milk", "no ice"). */
  note?: string;
}

export interface ReceiptProps extends HTMLAttributes<HTMLElement> {
  merchant: string;
  /** Address or a second line under the merchant. */
  address?: string;
  date?: When;
  items: ReceiptItem[];
  /** Tax amount. Or give `taxRate`. */
  tax?: number;
  /** Tax as a percent of the subtotal (8.875 → 8.875%). */
  taxRate?: number;
  tip?: number;
  currency?: string;
  locale?: string;
  /** "Visa •••• 4242". */
  payment?: string;
  /** The code at the foot. Default "qr". */
  code?: "qr" | "barcode" | "none";
  /** Order / receipt number: printed, and seeds the code's pattern. */
  reference?: string;
  /** A line at the very bottom ("Thank you!"). */
  footer?: ReactNode;
  /** Feed out of the printer on mount (fun motion). Default true. */
  animate?: boolean;
}

function QRish({ seed }: { seed: string }) {
  const n = 21;
  const bits = useMemo(() => {
    const r = hash(seed);
    return Array.from({ length: n * n }, () => r() > 0.52);
  }, [seed]);
  // the three finder squares: a 7×7 ring with a 3×3 core
  const finder = (c: number, r: number) => {
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      const x = c - ox, y = r - oy;
      if (x >= 0 && x < 7 && y >= 0 && y < 7) return x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
      if (x >= -1 && x <= 7 && y >= -1 && y <= 7) return false; // the quiet margin round each finder
    }
    return null;
  };
  return (
    <DotMatrix
      aria-hidden
      cols={n}
      rows={n}
      size={3}
      gap={1}
      shape="square"
      dim={0}
      className="text-ink"
      pattern={(c, r) => finder(c, r) ?? bits[r * n + c]}
    />
  );
}

function Barcode({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    const r = hash(seed);
    const out: { x: number; w: number }[] = [];
    let x = 0;
    while (x < 180) {
      const w = 1 + Math.floor(r() * 3);
      if (r() > 0.4) out.push({ x, w });
      x += w + 1 + Math.floor(r() * 2);
    }
    return out;
  }, [seed]);
  return (
    <svg aria-hidden viewBox="0 0 180 40" preserveAspectRatio="none" className="h-10 w-full max-w-[220px] text-ink">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={40} fill="currentColor" />
      ))}
    </svg>
  );
}

const Rule = () => <hr aria-hidden className="my-3 border-0 border-t border-dashed border-fill-strong" />;

export const Receipt = forwardRef<HTMLElement, ReceiptProps>(function Receipt(
  {
    merchant,
    address,
    date,
    items,
    tax,
    taxRate,
    tip,
    currency = "USD",
    locale,
    payment,
    code = "qr",
    reference,
    footer,
    animate = true,
    className,
    ...rest
  },
  ref,
) {
  const fmt = { currency, locale };
  const subtotal = items.reduce((s, it) => s + (it.qty ?? 1) * it.price, 0);
  const taxAmt = tax ?? (taxRate != null ? Math.round(subtotal * taxRate) / 100 : 0);
  const total = subtotal + taxAmt + (tip ?? 0);
  const p = moneyParts(total, fmt);
  const when = date != null ? toDate(date) : null;
  const seed = reference ?? `${merchant}${total}`;
  const pct = taxRate != null ? new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(taxRate) + "%" : null;

  const sumRow = (label: string, value: number) => (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-2">{label}</dt>
      <dd className="m-0 tabular-nums text-ink">{formatMoney(value, fmt)}</dd>
    </div>
  );

  return (
    <article
      ref={ref}
      data-slot="receipt"
      data-print={animate || undefined}
      aria-label={`Receipt from ${merchant}${when ? `, ${new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(when)}` : ""}`}
      className={cn("rap-receipt w-full max-w-[340px]", className)}
      {...rest}
    >
      <div className="rap-receipt-paper rounded-t-card bg-surface px-6 pt-6 font-mono text-[0.8125rem] leading-[1.5] text-ink">
        <header className="text-center">
          <h3 className="m-0 font-display text-[1.25rem] leading-tight font-semibold tracking-[-0.01em] text-ink">{merchant}</h3>
          {address && <p className="m-0 mt-1 text-mute">{address}</p>}
          {when && (
            <p className="m-0 mt-1 text-mute tabular-nums">
              <time dateTime={when.toISOString()}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(when)}</time>
            </p>
          )}
        </header>

        <Rule />

        <table className="w-full border-collapse">
          <caption className="sr-only">Items</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Quantity</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const q = it.qty ?? 1;
              return (
                <tr key={i} className="align-top">
                  <td className="py-1 pr-2">
                    <span className="text-ink">{it.name}</span>
                    {(it.note || q > 1) && (
                      <span className="block text-[0.75rem] text-mute tabular-nums">
                        {[q > 1 && `${q} × ${formatMoney(it.price, fmt)}`, it.note].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </td>
                  <td className="py-1 pr-3 text-right text-mute tabular-nums">{q > 1 ? `×${q}` : ""}</td>
                  <td className="py-1 text-right tabular-nums">{formatMoney(q * it.price, fmt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Rule />

        <dl className="m-0 flex flex-col gap-0.5">
          {sumRow("Subtotal", subtotal)}
          {(tax != null || taxRate != null) && sumRow(pct ? `Tax ${pct}` : "Tax", taxAmt)}
          {tip != null && sumRow("Tip", tip)}
        </dl>

        <div className="mt-4 flex items-end justify-between gap-4">
          <span className="pb-1 text-[0.75rem] font-medium uppercase tracking-[0.12em] text-mute">Total</span>
          <span
            data-slot="receipt-total"
            role="img"
            aria-label={`Total, ${moneyLabel(total, fmt)}`}
            className="flex items-start font-display leading-none font-semibold tracking-[-0.02em] text-ink tabular-nums"
          >
            {p.symbolFirst && <span className="mt-[0.2em] mr-[0.06em] text-[1.25rem] text-ink-2">{p.symbol}</span>}
            <span className="text-[2.5rem]">{p.whole}</span>
            {p.fraction && (
              <span className="mt-[0.2em] text-[1.25rem]">
                {p.decimal}
                {p.fraction}
              </span>
            )}
            {!p.symbolFirst && <span className="mt-[0.2em] ml-[0.2em] text-[1.25rem] text-ink-2">{p.symbol}</span>}
          </span>
        </div>

        {payment && (
          <p className="m-0 mt-3 flex justify-between gap-4 text-ink-2">
            <span>Paid with</span>
            <span className="tabular-nums text-ink">{payment}</span>
          </p>
        )}

        {(code !== "none" || reference || footer) && <Rule />}

        {code !== "none" && <div className="flex justify-center py-1">{code === "qr" ? <QRish seed={seed} /> : <Barcode seed={seed} />}</div>}
        {reference && <p className="m-0 mt-2 text-center text-[0.75rem] tracking-[0.08em] text-mute tabular-nums">No. {reference}</p>}
        {footer && <p className="m-0 mt-2 text-center text-ink-2">{footer}</p>}
      </div>
    </article>
  );
});

/* ═════════════ TransferStatus ═════════════ */

export type TransferStep = "initiated" | "processing" | "sent" | "arrived";
const STEPS: TransferStep[] = ["initiated", "processing", "sent", "arrived"];
const STEP_LABEL: Record<TransferStep, string> = { initiated: "Initiated", processing: "Processing", sent: "Sent", arrived: "Arrived" };

export interface TransferStatusProps extends HTMLAttributes<HTMLDivElement> {
  amount: number;
  currency?: string;
  locale?: string;
  recipient: string;
  /** Under the name: "Northline Credit Union •••• 0193". */
  recipientDetail?: string;
  /** Recipient photo. */
  avatar?: string;
  /** The step reached. */
  status: TransferStep;
  /** The step failed: true or the reason ("Returned by bank"). */
  error?: boolean | string;
  /** When each step happened. */
  timestamps?: Partial<Record<TransferStep, When>>;
  /** Shown on Arrived until it happens. */
  expected?: When;
  orientation?: "vertical" | "horizontal";
  /** Rename steps ("Sent" → "Paid out"). */
  labels?: Partial<Record<TransferStep, string>>;
}

export const TransferStatus = forwardRef<HTMLDivElement, TransferStatusProps>(function TransferStatus(
  {
    amount,
    currency = "USD",
    locale,
    recipient,
    recipientDetail,
    avatar,
    status,
    error,
    timestamps = {},
    expected,
    orientation = "vertical",
    labels,
    className,
    ...rest
  },
  ref,
) {
  const at = STEPS.indexOf(status);
  const failed = !!error;
  const reason = typeof error === "string" ? error : "Transfer failed";
  const done = !failed && status === "arrived";
  const label = (s: TransferStep) => labels?.[s] ?? STEP_LABEL[s];
  const stamp = (d: When) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(toDate(d)).replace(/,/g, "");
  const day = (d: When) => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(toDate(d)).replace(/,/g, "");
  const h = orientation === "horizontal";
  const spoken = `Transfer of ${moneyLabel(amount, { currency, locale })} to ${recipient}: ${failed ? reason : label(status)}`;

  return (
    <div
      ref={ref}
      data-slot="transfer-status"
      data-status={failed ? "error" : status}
      data-orientation={orientation}
      className={cn("flex w-full flex-col gap-5 font-sans text-ink", h ? "max-w-[640px]" : "max-w-[380px]", className)}
      {...rest}
    >
      <header className="flex items-center gap-3">
        <Avatar size="lg" name={recipient} src={avatar} alt="" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[0.8125rem] text-mute">To</span>
          <span className="truncate font-medium">{recipient}</span>
          {recipientDetail && <span className="truncate text-[0.8125rem] text-mute tabular-nums">{recipientDetail}</span>}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span aria-hidden className="font-display text-[1.75rem] leading-none font-semibold tracking-[-0.02em]">
            <MoneyText value={amount} currency={currency} locale={locale} fractionClassName="text-[0.6em]" />
          </span>
          <span className="sr-only">{moneyLabel(amount, { currency, locale })}</span>
          <Badge size="sm" variant={failed ? "danger" : done ? "success" : "neutral"} dot>
            {failed ? "Returned" : done ? "Arrived" : "In progress"}
          </Badge>
        </div>
      </header>

      <ol aria-label="Transfer progress" className={cn("m-0 flex p-0", h ? "flex-row" : "flex-col")}>
        {STEPS.map((s, i) => {
          const isDone = i < at || (i === at && !failed && s === "arrived");
          const isCur = i === at && !isDone;
          const isErr = isCur && failed;
          const isLast = i === STEPS.length - 1;
          const ts = timestamps[s];
          const sub = isErr ? reason : ts != null && i <= at ? stamp(ts) : s === "arrived" && expected != null && !failed ? `Expected ${day(expected)}` : i > at ? (failed ? "—" : "Pending") : "";
          const lineDone = i < at;
          return (
            <li
              key={s}
              data-state={isErr ? "error" : isDone ? "done" : isCur ? "current" : "upcoming"}
              aria-current={isCur ? "step" : undefined}
              className={cn("relative flex list-none", h ? "flex-1 flex-col items-start gap-2" : "gap-3 pb-5 last:pb-0")}
            >
              {/* connector to the next step */}
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute",
                    h ? "top-[11px] left-7 right-1 h-0.5" : "top-7 bottom-1 left-[11px] w-0.5",
                    "rounded-pill",
                    lineDone ? "bg-accent" : "bg-line",
                    isErr && (h ? "bg-transparent border-t-2 border-dashed border-danger/40" : "bg-transparent border-l-2 border-dashed border-danger/40"),
                  )}
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "relative grid size-6 flex-none place-items-center rounded-pill",
                  isDone && "bg-accent text-accent-ink",
                  isCur && !isErr && "bg-surface shadow-[inset_0_0_0_2px_var(--rap-accent)]",
                  isErr && "bg-danger text-white",
                  !isDone && !isCur && "bg-surface shadow-[inset_0_0_0_2px_var(--rap-line)]",
                )}
              >
                {isDone && <Check size={14} strokeWidth={2.6} />}
                {isErr && <X size={14} strokeWidth={2.6} />}
                {isCur && !isErr && (
                  <>
                    <span className="rap-transfer-pulse absolute inset-0 rounded-pill bg-accent" />
                    <span className="relative size-2 rounded-pill bg-accent" />
                  </>
                )}
              </span>
              <span className={cn("flex min-w-0 flex-col", !h && "pt-0.5")}>
                <span className={cn("text-[0.9375rem] font-medium leading-tight", !isDone && !isCur && "text-mute", isErr && "text-danger")}>{label(s)}</span>
                {sub && <span className={cn("mt-0.5 text-[0.8125rem] text-mute tabular-nums", isErr && "text-danger")}>{sub}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <span role="status" className="sr-only">
        {spoken}
      </span>
    </div>
  );
});
