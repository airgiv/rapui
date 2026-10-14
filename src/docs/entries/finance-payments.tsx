import { useState } from "react";
import { Button } from "../../rapui";
import { PaymentCard, type PaymentCardBrand, type PaymentCardLook } from "../../rapui/components/PaymentCard";
import { Receipt, TransferStatus, type ReceiptItem, type TransferStep } from "../../rapui/components/Receipt";
import { Transactions, type Transaction } from "../../rapui/components/Transactions";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* a paper ground inside the white stage, so white cards and receipts read as sheets */
const GROUND = "grid place-items-center w-full min-h-80 p-6 rounded-[calc(var(--rap-radius)-8px)] bg-paper";

/* ── data: a believable fortnight of one person's money ─────────────── */

/** a time `days` ago at h:m, so "Today" and "Yesterday" are always right in the demo */
function ago(days: number, h: number, m: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d;
}

const RAW: Omit<Transaction, "balance">[] = [
  { id: "t1", merchant: "Kettle & Crumb", category: "Coffee", amount: -4.5, date: ago(0, 8, 14), pending: true },
  { id: "t2", merchant: "Northline Transit", category: "Transport", amount: -2.75, date: ago(0, 7, 52) },
  { id: "t3", merchant: "Harbor Grocery", category: "Groceries", amount: -63.18, date: ago(1, 18, 40) },
  { id: "t4", merchant: "Fieldwork Studio", category: "Salary", amount: 3240, date: ago(1, 9, 0) },
  { id: "t5", merchant: "Pinecrest Pharmacy", category: "Health", amount: -12.4, date: ago(1, 8, 22) },
  { id: "t6", merchant: "Lantern Cinema", category: "Entertainment", amount: -28, date: ago(3, 20, 5) },
  { id: "t7", merchant: "Ana Lima", category: "Transfer in", amount: 45, date: ago(3, 13, 31) },
  { id: "t8", merchant: "Saltwater Noodle Bar", category: "Restaurants", amount: -36.9, date: ago(3, 12, 48) },
  { id: "t9", merchant: "Brightwire Internet", category: "Bills", amount: -59.99, date: ago(5, 6, 0) },
  { id: "t10", merchant: "Northline Transit", category: "Transport", amount: -2.75, date: ago(5, 17, 34) },
];
/* running balances, newest first: work back from today's 2,418.62 */
const TXNS: Transaction[] = (() => {
  let bal = 2418.62;
  return RAW.map((t) => {
    const row = { ...t, balance: Math.round(bal * 100) / 100 };
    bal -= t.amount;
    return row;
  });
})();

const LINES: ReceiptItem[] = [
  { name: "Flat white", qty: 2, price: 4.5, note: "oat milk" },
  { name: "Cardamom bun", price: 3.75 },
  { name: "Sourdough loaf", price: 7.25 },
  { name: "Ginger lemonade", price: 4 },
];

/* ── Payment card ─────────────────────────────────────────── */

const cardControls: Control[] = [
  { type: "select", prop: "brand", options: ["visa", "mastercard", "amex", "generic"], default: "visa" },
  { type: "select", prop: "look", options: ["preset", "fun", "civic", "signal", "product", "minimal"], default: "preset", codeDefault: "preset" },
  { type: "text", prop: "holder", default: "Mira Okafor", codeDefault: null },
  { type: "text", prop: "expiry", default: "08/28", codeDefault: null },
  { type: "boolean", prop: "frozen", default: false },
  { type: "boolean", prop: "flipped", default: false },
];

const NUMBERS: Record<PaymentCardBrand, string> = {
  visa: "4242 4242 4242 4242",
  mastercard: "5555 3412 8890 4417",
  amex: "3782 822463 10005",
  generic: "6011 0009 9013 9424",
};

/* ── Transactions ─────────────────────────────────────────── */

const txControls: Control[] = [
  { type: "select", prop: "groupBy", options: ["day", "none"], default: "day" },
  { type: "select", prop: "currency", options: ["USD", "EUR", "GBP", "JPY"], default: "USD" },
  { type: "boolean", prop: "searchable", default: true, codeDefault: false },
  { type: "boolean", prop: "showBalance", default: true },
  { type: "boolean", prop: "loading", default: false },
  { type: "boolean", prop: "empty", default: false },
];

/* ── Receipt ──────────────────────────────────────────────── */

const receiptControls: Control[] = [
  { type: "text", prop: "merchant", default: "Kettle & Crumb", codeDefault: null },
  { type: "select", prop: "code", options: ["qr", "barcode", "none"], default: "qr" },
  { type: "number", prop: "tip", min: 0, max: 20, step: 0.5, default: 4, codeDefault: null },
  { type: "select", prop: "currency", options: ["USD", "EUR", "GBP", "JPY"], default: "USD" },
];

/* ── Transfer status ──────────────────────────────────────── */

const transferControls: Control[] = [
  { type: "select", prop: "status", options: ["initiated", "processing", "sent", "arrived"], default: "sent", codeDefault: null },
  { type: "select", prop: "orientation", options: ["vertical", "horizontal"], default: "vertical" },
  { type: "boolean", prop: "error", default: false },
];

const STAMPS = { initiated: ago(1, 16, 2), processing: ago(1, 16, 3), sent: ago(0, 9, 41), arrived: ago(0, 11, 15) };

export const entries: DocEntry[] = [
  {
    slug: "payment-card",
    name: "Payment card",
    group: "Finance",
    description:
      "A bank card, drawn to ISO proportions: chip, contactless glyph, network mark, the number masked to •••• 4242 with a reveal button, holder and expiry — click it to turn it over to the stripe and CVV. Each preset gives it its own stock: a tilting blob card with a holographic sheen (fun), navy with a guilloche (civic), earthy dot-matrix (signal), matte black (product), a white hairline card (minimal). `frozen` frosts it over.",
    controls: cardControls,
    Demo: ({ p }) => {
      const brand = p.brand as PaymentCardBrand;
      return (
        <div className={GROUND}>
          <PaymentCard
            key={String(p.flipped)}
            brand={brand}
            number={NUMBERS[brand]}
            holder={String(p.holder)}
            expiry={String(p.expiry)}
            cvv={brand === "amex" ? "7316" : "314"}
            issuer="Fieldstone"
            look={p.look === "preset" ? undefined : (p.look as PaymentCardLook)}
            frozen={Boolean(p.frozen)}
            defaultFlipped={Boolean(p.flipped)}
          />
        </div>
      );
    },
    code: (p) => {
      const brand = p.brand as PaymentCardBrand;
      const lines = [`brand="${brand}"`, `number="${NUMBERS[brand]}"`, `holder="${p.holder}"`, `expiry="${p.expiry}"`, `cvv="${brand === "amex" ? "7316" : "314"}"`, `issuer="Fieldstone"`];
      if (p.look !== "preset") lines.push(`look="${p.look}"`);
      if (p.frozen) lines.push("frozen");
      if (p.flipped) lines.push("defaultFlipped");
      return `import { PaymentCard } from "@rapui/react";

<PaymentCard
  ${lines.join("\n  ")}
/>`;
    },
    examples: [
      {
        title: "Every look",
        Demo: () => (
          <div className="grid w-full grid-cols-2 gap-6 max-[700px]:grid-cols-1">
            {(
              [
                ["fun", "visa", "Mira Okafor"],
                ["civic", "mastercard", "Daniel Reyes"],
                ["signal", "generic", "Ines Halvorsen"],
                ["product", "amex", "Theo Nakamura"],
                ["minimal", "visa", "Ruth Abernathy"],
              ] as const
            ).map(([look, brand, holder]) => (
              <PaymentCard key={look} look={look} brand={brand} number={NUMBERS[brand]} holder={holder} expiry="11/29" cvv="208" issuer="Fieldstone" />
            ))}
            <PaymentCard look="fun" brand="mastercard" number={NUMBERS.mastercard} holder="Mira Okafor" expiry="03/27" issuer="Fieldstone" frozen />
          </div>
        ),
        code: `<PaymentCard look="fun" brand="visa" number="4242 4242 4242 4242" holder="Mira Okafor" expiry="11/29" />
<PaymentCard look="civic" brand="mastercard" … />
<PaymentCard look="signal" brand="generic" … />
<PaymentCard look="product" brand="amex" … />
<PaymentCard look="minimal" brand="visa" … />
<PaymentCard brand="mastercard" … frozen />`,
      },
      {
        title: "Freeze from outside",
        Demo: () => {
          const [frozen, setFrozen] = useState(false);
          return (
            <div className="flex w-full flex-col items-center gap-4">
              <PaymentCard brand="visa" number="4000 0566 5566 5556" holder="Mira Okafor" expiry="08/28" issuer="Fieldstone" frozen={frozen} flipOnClick={false} />
              <Button size="sm" variant="soft" onClick={() => setFrozen((f) => !f)}>
                {frozen ? "Unfreeze card" : "Freeze card"}
              </Button>
            </div>
          );
        },
        code: `const [frozen, setFrozen] = useState(false);

<PaymentCard brand="visa" number={card.number} holder={card.holder} expiry={card.expiry}
             frozen={frozen} flipOnClick={false} />
<Button onClick={() => setFrozen((f) => !f)}>{frozen ? "Unfreeze card" : "Freeze card"}</Button>`,
      },
    ],
  },
  {
    slug: "transactions",
    name: "Transactions",
    group: "Finance",
    description:
      "An account's activity: payments grouped by day (Today, Yesterday, Mon 12 May) with each day's net total, a merchant face, category and time, a Pending badge, the amount — income in the up colour with a +, spending plain — and the running balance. Pass `onSelect` and rows become keyboard-friendly buttons; there is a search field, a loading skeleton and an empty state.",
    controls: txControls,
    Demo: ({ p }) => {
      const [sel, setSel] = useState<string | null>(null);
      return (
        <div className="flex w-full max-w-md flex-col gap-2">
          <Transactions
            items={p.empty ? [] : TXNS}
            currency={String(p.currency)}
            groupBy={p.groupBy as "day" | "none"}
            searchable={Boolean(p.searchable)}
            showBalance={Boolean(p.showBalance)}
            loading={Boolean(p.loading)}
            onSelect={(t) => setSel(t.merchant)}
          />
          <p className="m-0 px-3 text-[0.8125rem] text-mute" aria-live="polite">
            {sel ? `Opened: ${sel}` : "Pick a row."}
          </p>
        </div>
      );
    },
    code: (p) => `import { Transactions } from "@rapui/react";

<Transactions
  items={transactions}${attrs(p, txControls, ["empty"]).replace(/ (\w+)/g, "\n  $1")}
  onSelect={(t) => openDetails(t.id)}
/>`,
    examples: [
      {
        title: "Read-only, flat",
        Demo: () => <Transactions className="max-w-md" items={TXNS.slice(0, 4)} groupBy="none" showBalance={false} currency="EUR" locale="de-DE" />,
        code: `<Transactions items={latest} groupBy="none" showBalance={false} currency="EUR" locale="de-DE" />`,
      },
    ],
  },
  {
    slug: "receipt",
    name: "Receipt",
    group: "Finance",
    description:
      "The slip after a purchase, on paper with a torn perforated edge: merchant, date, line items with quantities, subtotal, tax, tip, a big total, the card it was paid with, and a code at the foot (QR-ish dots or a barcode). In fun motion it feeds out of the printer.",
    controls: receiptControls,
    Demo: ({ p }) => {
      const [run, setRun] = useState(0);
      return (
        <div className={GROUND}>
          <div className="flex flex-col items-center gap-4">
            <Receipt
              key={run}
              merchant={String(p.merchant)}
              address="212 Alder St · Portland, OR"
              date={ago(0, 8, 14)}
              items={p.currency === "JPY" ? LINES.map((l) => ({ ...l, price: Math.round(l.price * 150) })) : LINES}
              taxRate={8.875}
              tip={p.currency === "JPY" ? 0 : Number(p.tip)}
              currency={String(p.currency)}
              payment="Visa •••• 4242"
              code={p.code as "qr" | "barcode" | "none"}
              reference="KC-20481"
              footer="Thanks — see you tomorrow."
            />
            <Button size="sm" variant="soft" onClick={() => setRun((r) => r + 1)}>
              Print again
            </Button>
          </div>
        </div>
      );
    },
    code: (p) => `import { Receipt } from "@rapui/react";

<Receipt
  merchant="${p.merchant}"
  address="212 Alder St · Portland, OR"
  date={paidAt}
  items={[
    { name: "Flat white", qty: 2, price: 4.5, note: "oat milk" },
    { name: "Cardamom bun", price: 3.75 },
    { name: "Sourdough loaf", price: 7.25 },
    { name: "Ginger lemonade", price: 4 },
  ]}
  taxRate={8.875}
  tip={${p.tip}}${p.currency !== "USD" ? `\n  currency="${p.currency}"` : ""}
  payment="Visa •••• 4242"${p.code !== "qr" ? `\n  code="${p.code}"` : ""}
  reference="KC-20481"
/>`,
    examples: [
      {
        title: "Groceries, with a barcode",
        Demo: () => (
          <div className={GROUND}>
            <Receipt
              merchant="Harbor Grocery"
              address="Pier 9 Market Hall"
              date={ago(1, 18, 40)}
              items={[
                { name: "Heirloom tomatoes", qty: 3, price: 1.89 },
                { name: "Olive oil 500 ml", price: 11.5 },
                { name: "Rigatoni", qty: 2, price: 3.25 },
                { name: "Parmigiano 200 g", price: 8.95 },
                { name: "Basil", price: 2.49 },
                { name: "Sparkling water 6-pack", price: 5.99 },
                { name: "Lemons", qty: 4, price: 0.65 },
                { name: "Oat milk", price: 3.79 },
              ]}
              tax={3.42}
              payment="Mastercard •••• 4417"
              code="barcode"
              reference="0417 2210 8833"
              animate={false}
            />
          </div>
        ),
        code: `<Receipt merchant="Harbor Grocery" items={basket} tax={3.42}
         payment="Mastercard •••• 4417" code="barcode" reference="0417 2210 8833" animate={false} />`,
      },
    ],
  },
  {
    slug: "transfer-status",
    name: "Transfer status",
    group: "Finance",
    description:
      "Where a money transfer is: Initiated → Processing → Sent → Arrived, with the time each step happened and the amount and recipient on top. The current step pulses (a still dot in calm); an error stops it where it failed, with the bank's reason. Vertical for a detail screen, horizontal for a row.",
    controls: transferControls,
    Demo: ({ p }) => {
      const st = p.status as TransferStep;
      return (
        <TransferStatus
          amount={250}
          recipient="Ana Lima"
          recipientDetail="Northline Credit Union •••• 0193"
          status={st}
          error={p.error ? "Returned by bank — account closed" : false}
          timestamps={STAMPS}
          expected={ago(-1, 12, 0)}
          orientation={p.orientation as "vertical" | "horizontal"}
        />
      );
    },
    code: (p) => `import { TransferStatus } from "@rapui/react";

<TransferStatus
  amount={250}
  recipient="Ana Lima"
  recipientDetail="Northline Credit Union •••• 0193"
  status="${p.status}"
  timestamps={{ initiated, processing, sent }}
  expected={arrivesBy}${p.orientation !== "vertical" ? `\n  orientation="${p.orientation}"` : ""}${p.error ? `\n  error="Returned by bank — account closed"` : ""}
/>`,
    examples: [
      {
        title: "Returned, horizontal",
        Demo: () => (
          <TransferStatus
            amount={1200}
            currency="EUR"
            locale="en-IE"
            recipient="Saltwater Lettings"
            recipientDetail="IBAN •••• 7720"
            status="sent"
            error="Returned by bank"
            timestamps={STAMPS}
            orientation="horizontal"
          />
        ),
        code: `<TransferStatus amount={1200} currency="EUR" recipient="Saltwater Lettings" status="sent"
                error="Returned by bank" timestamps={stamps} orientation="horizontal" />`,
      },
    ],
  },
];
