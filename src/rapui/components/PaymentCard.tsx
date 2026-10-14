/* ══ PaymentCard ══════════════════════════════════════════
   A bank card, drawn: ISO 85.6 × 54 proportions, chip, contactless
   glyph, network mark, the number masked to "•••• 4242" with a
   reveal toggle, holder and expiry — and a back (magnetic stripe,
   signature strip, CVV box) it flips to when you click it.

     <PaymentCard brand="visa" number="4242424242424242"
                  holder="Mira Okafor" expiry="08/28" cvv="314" />

   Looks — each preset picks its own, or pass `look`:
     fun      a bright card of colour blobs that tilts toward the
              pointer under a holographic sheen
     civic    deep navy with a fine guilloche (banknote) line pattern
     signal   an earthy card with a dot-matrix texture, mono numbers
     product  matte black, a whisper of noise and a thin light edge
     minimal  a white card with a hairline border — all type

   `frozen` lays frost over the face (fun: it creeps in from a corner)
   with a lock and the word Frozen. The whole card is one labelled group
   ("Visa card ending in 4242, Mira Okafor, expires August 2028"); reveal
   and flip are real buttons, and the hidden face is inert.
   Calm: no tilt, the flip is a cross-fade, a gentle sheen only on hover.
   Still: static. */
import { useId, useRef, useState, type CSSProperties, type HTMLAttributes, type MouseEvent, type PointerEvent } from "react";
import { usePreset } from "../hooks/usePreset";
import { Eye, Lock, RefreshCw } from "../icons";
import { cn, prefersReducedMotion } from "../utils";
import "./PaymentCard.css";

export type PaymentCardBrand = "visa" | "mastercard" | "amex" | "generic";
export type PaymentCardLook = "fun" | "civic" | "signal" | "product" | "minimal";

export interface PaymentCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  brand?: PaymentCardBrand;
  /** The full number (spaces ignored) — or just the last four, then it cannot be revealed. */
  number?: string;
  /** Name on the card. */
  holder?: string;
  /** "MM/YY". */
  expiry?: string;
  /** Security code, shown on the back (masked until revealed). */
  cvv?: string;
  /** The bank's name, top left. */
  issuer?: string;
  /** Defaults to the preset in effect. */
  look?: PaymentCardLook;
  /** Frost over the face, a lock and "Frozen". */
  frozen?: boolean;
  /** Controlled: which side shows. */
  flipped?: boolean;
  defaultFlipped?: boolean;
  onFlippedChange?: (flipped: boolean) => void;
  /** Clicking the card turns it over (the flip button always does). Default true. */
  flipOnClick?: boolean;
  /** Controlled: full number and CVV visible. */
  revealed?: boolean;
  defaultRevealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
  /** Card width (the height follows the ISO ratio). Default "100%", capped at 380px by `max-w`. */
  width?: CSSProperties["width"];
}

const BRAND_NAME: Record<PaymentCardBrand, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", generic: "Debit" };

/** "4242424242424242" → ["4242","4242","4242","4242"]; Amex reads 4-6-5. */
function groups(digits: string, brand: PaymentCardBrand): string[] {
  if (brand === "amex" && digits.length === 15) return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10)];
  return digits.match(/.{1,4}/g) ?? [];
}

/** "08/28" → "August 2028" for the accessible name. */
function spokenExpiry(expiry?: string) {
  const m = expiry?.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/);
  if (!m) return expiry;
  const year = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(year, Number(m[1]) - 1, 1));
}

/* ── the guilloche: interlaced sine waves, like the fine print on a banknote ── */
const GUILLOCHE = (() => {
  const out: string[] = [];
  for (let k = 0; k < 22; k++) {
    let d = "";
    for (let x = 0; x <= 856; x += 8) {
      const y = 270 + Math.sin(x / 70 + k * 0.42) * (120 + 60 * Math.sin(k * 0.7)) * Math.cos(x / 260 - k * 0.15);
      d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
    }
    out.push(d);
  }
  return out;
})();
const ROSETTE = (() => {
  let d = "";
  for (let t = 0; t <= 360; t += 2) {
    const a = (t * Math.PI) / 180;
    const r = 120 + 34 * Math.cos(9 * a);
    d += `${t === 0 ? "M" : "L"}${(690 + r * Math.cos(a)).toFixed(1)} ${(150 + r * Math.sin(a)).toFixed(1)}`;
  }
  return d + "Z";
})();

function BrandMark({ brand }: { brand: PaymentCardBrand }) {
  if (brand === "visa")
    return (
      <span data-slot="payment-card-brand" className="rap-pc-visa">
        VISA
      </span>
    );
  if (brand === "mastercard")
    return (
      <svg data-slot="payment-card-brand" className="rap-pc-mc" viewBox="0 0 40 26" aria-hidden>
        <circle cx="13" cy="13" r="12" className="rap-pc-mc-a" />
        <circle cx="27" cy="13" r="12" className="rap-pc-mc-b" />
      </svg>
    );
  if (brand === "amex")
    return (
      <span data-slot="payment-card-brand" className="rap-pc-amex">
        AMEX
      </span>
    );
  return (
    <svg data-slot="payment-card-brand" className="rap-pc-generic" viewBox="0 0 40 26" aria-hidden>
      <rect x="1" y="1" width="38" height="24" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 17h10M8 13h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Chip() {
  return (
    <svg data-slot="payment-card-chip" className="rap-pc-chip" viewBox="0 0 44 34" aria-hidden>
      <rect x="0.75" y="0.75" width="42.5" height="32.5" rx="6" className="rap-pc-chip-body" />
      <path d="M0.75 11.5h13M0.75 22.5h13M30.25 11.5h13M30.25 22.5h13M14 0.75v32.5M30 0.75v32.5M14 17h16" className="rap-pc-chip-lines" />
    </svg>
  );
}

function Contactless() {
  return (
    <svg data-slot="payment-card-contactless" className="rap-pc-nfc" viewBox="0 0 24 24" aria-hidden>
      {/* four arcs opening to the right, centred on a point at the left edge */}
      {[5, 9, 13, 17].map((r) => {
        const c = Math.SQRT1_2 * r;
        return <path key={r} d={`M${(2 + c).toFixed(2)} ${(12 - c).toFixed(2)}A${r} ${r} 0 0 1 ${(2 + c).toFixed(2)} ${(12 + c).toFixed(2)}`} />;
      })}
    </svg>
  );
}

function Snowflake() {
  return (
    <svg className="rap-pc-flake" viewBox="0 0 48 48" aria-hidden>
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a} 24 24)`}>
          <path d="M24 4v40M24 10l-5-5M24 10l5-5M24 38l-5 5M24 38l5 5" />
        </g>
      ))}
    </svg>
  );
}

export function PaymentCard({
  brand = "visa",
  number = "4242",
  holder,
  expiry,
  cvv,
  issuer = "rap bank",
  look,
  frozen = false,
  flipped: flippedProp,
  defaultFlipped = false,
  onFlippedChange,
  flipOnClick = true,
  revealed: revealedProp,
  defaultRevealed = false,
  onRevealedChange,
  width,
  className,
  style,
  "aria-label": ariaLabel,
  ...rest
}: PaymentCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { preset, motion } = usePreset(ref);
  const kind: PaymentCardLook = look ?? (preset as PaymentCardLook) ?? "fun";
  const [flipState, setFlipState] = useState(defaultFlipped);
  const [revealState, setRevealState] = useState(defaultRevealed);
  const flipped = flippedProp ?? flipState;
  const revealed = revealedProp ?? revealState;
  const statusId = useId();

  const digits = number.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  const canReveal = digits.length > 4;
  const shown = revealed && canReveal ? groups(digits, brand).join("  ") : `•••• ${last4}`;
  const name = BRAND_NAME[brand];
  const label =
    ariaLabel ??
    [`${issuer ? issuer + " " : ""}${name} card ending in ${last4}`, holder, expiry && `expires ${spokenExpiry(expiry)}`, frozen && "frozen"]
      .filter(Boolean)
      .join(", ");

  const setFlipped = (v: boolean) => {
    if (flippedProp === undefined) setFlipState(v);
    onFlippedChange?.(v);
  };
  const setRevealed = (v: boolean) => {
    if (revealedProp === undefined) setRevealState(v);
    onRevealedChange?.(v);
  };

  // the pointer: --mx/--my place the sheen, --rx/--ry tilt (fun motion only; CSS gates the look)
  const still = motion === "still" || prefersReducedMotion();
  const calm = still || motion === "calm";
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || still || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    if (!calm) {
      el.style.setProperty("--rx", `${((0.5 - y) * 14).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * 18).toFixed(2)}deg`);
    }
  };
  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
  };
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!flipOnClick || (e.target as Element).closest("button")) return;
    setFlipped(!flipped);
  };

  const flipButton = (
    <button
      type="button"
      data-slot="payment-card-flip"
      className="rap-pc-btn"
      aria-label={flipped ? "Show front of card" : "Show back of card"}
      onClick={() => setFlipped(!flipped)}
    >
      <RefreshCw size="1em" />
    </button>
  );

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      data-slot="payment-card"
      data-look={kind}
      data-brand={brand}
      data-flipped={flipped || undefined}
      data-frozen={frozen || undefined}
      className={cn("rap-payment-card relative w-full max-w-[380px] select-none", flipOnClick && "cursor-pointer", className)}
      style={{ width, ...style }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      {...rest}
    >
      <div className="rap-pc-body">
        {/* ── front ── */}
        <div className="rap-pc-face rap-pc-front" inert={flipped || undefined}>
          <div className="rap-pc-bg" aria-hidden>
            {kind === "civic" && (
              <svg viewBox="0 0 856 540" preserveAspectRatio="none" className="rap-pc-guilloche">
                {GUILLOCHE.map((d, i) => (
                  <path key={i} d={d} />
                ))}
                <path d={ROSETTE} />
              </svg>
            )}
          </div>
          <div className="rap-pc-sheen" aria-hidden />

          <div className="rap-pc-top">
            <span className="rap-pc-issuer" aria-hidden>
              {issuer}
            </span>
            {flipButton}
          </div>
          <div className="rap-pc-mid" aria-hidden>
            <Chip />
            <Contactless />
          </div>
          <div className="rap-pc-number-row">
            <span className="rap-pc-number tabular-nums" aria-hidden>
              {shown}
            </span>
            {canReveal && (
              <button
                type="button"
                data-slot="payment-card-reveal"
                className="rap-pc-btn"
                aria-pressed={revealed}
                aria-label={revealed ? "Hide card number" : "Show card number"}
                aria-describedby={statusId}
                onClick={() => setRevealed(!revealed)}
              >
                <Eye size="1em" />
                {revealed && <i className="rap-pc-slash" aria-hidden />}
              </button>
            )}
          </div>
          <div className="rap-pc-bottom" aria-hidden>
            <div className="rap-pc-meta">
              {holder && <span className="rap-pc-holder">{holder}</span>}
              {expiry && (
                <span className="rap-pc-expiry tabular-nums">
                  <small>valid thru</small> {expiry}
                </span>
              )}
            </div>
            <BrandMark brand={brand} />
          </div>

          {frozen && (
            <div data-slot="payment-card-frost" className="rap-pc-frost" aria-hidden>
              <Snowflake />
              <span className="rap-pc-frozen-tag">
                <Lock size="1em" /> Frozen
              </span>
            </div>
          )}
        </div>

        {/* ── back ── */}
        <div className="rap-pc-face rap-pc-back" inert={!flipped || undefined}>
          <div className="rap-pc-bg" aria-hidden />
          <div className="rap-pc-stripe" aria-hidden />
          <div className="rap-pc-sig-row" aria-hidden>
            <div className="rap-pc-sig">{holder}</div>
            <div className="rap-pc-cvv tabular-nums">
              <small>CVV</small>
              {cvv ? (revealed ? cvv : "•".repeat(cvv.length)) : "•••"}
            </div>
          </div>
          <p className="rap-pc-fine" aria-hidden>
            This card is issued by {issuer} and remains its property. If found, please return it to any branch. Use is subject to the cardholder agreement.
          </p>
          <div className="rap-pc-back-foot">
            {flipButton}
            <span aria-hidden>
              <BrandMark brand={brand} />
            </span>
          </div>
        </div>
      </div>

      <span id={statusId} role="status" className="sr-only">
        {revealed && canReveal ? `Card number ${groups(digits, brand).join(" ")}${cvv ? `, security code ${cvv.split("").join(" ")}` : ""}` : ""}
      </span>
    </div>
  );
}
