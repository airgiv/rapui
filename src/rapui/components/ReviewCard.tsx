/* ══ ReviewCard · AwardBadge ══════════════════════════════
   ReviewCard — one customer review, as a store lists them: a
   title, the stars, the date and the author, the body clamped to
   a few lines with a "more" to open it, and the developer's reply
   indented underneath under its own label.

     <ReviewCard title="Finally, notes that keep up"
       rating={5} date="2026-09-02" author="marsh_wren"
       body="…"
       response={{ body: "Thank you!…", date: "2026-09-04" }} />

   The title is a heading (`as`, h3 by default); the stars read as
   "5 out of 5"; the date is a <time>. "more" appears only when the
   body really is cut off, and says what it opens (aria-expanded).

   AwardBadge — a compact plaque: a small laurel wreath (with a
   rank in it, if you give one) and one or two lines:
   "#1 in Productivity", "App of the Day".

   Looks — each preset picks its own, or pass `look`:
     civic    a white card with a soft shadow, a serif title, the
              reply on a pale ruled panel; the badge a square-cut
              plaque with a navy wreath
     fun      a round card that tilts a hair under the pointer, a
              chunky title, flame stars; the badge an acid pill
              that wiggles on hover
     signal   a ruled cell: mono header, phosphor pips, the reply
              behind a "> DEV" rule; the badge a bracketed readout
     product  a hairline card on paper, semibold title, the reply
              indented with a hairline; the badge a hairline pill
     minimal  no box: a top hairline, plain type; the badge text
              between two hairline sprigs

   Delight (fun): the card tilts and lifts under the pointer; the
   badge wiggles. Calm: they stay put. */
import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";
import { useBlockLook, type BlockLook } from "./Layout";
import { LaurelWreath, type LaurelTone } from "./Laurel";
import { Stars } from "./RatingSummary";

/* ── a body clamped to `lines`, with "more" only when it really is cut ── */

function Clamped({ lines, children, className, moreClass }: { lines: number; children: ReactNode; className?: string; moreClass?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open || typeof ResizeObserver === "undefined") return;
    const check = () => setCut(el.scrollHeight - el.clientHeight > 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, children, lines]);
  return (
    <div className="relative">
      <p
        ref={ref}
        className={cn("m-0 whitespace-pre-line", className)}
        style={open ? undefined : { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden" }}
      >
        {children}
      </p>
      {(cut || open) && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn("mt-1 cursor-pointer rounded-xs bg-transparent p-0 text-[0.875rem] font-medium text-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring", moreClass)}
        >
          {open ? "less" : "more"}
        </button>
      )}
    </div>
  );
}

const fmtDate = (d: Date | string | number | undefined, locale?: string) => {
  if (d == null) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return { iso: undefined, text: String(d) };
  return { iso: date.toISOString().slice(0, 10), text: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date) };
};

/* ── ReviewCard ── */

export interface ReviewResponse {
  body: ReactNode;
  date?: Date | string | number;
  /** Who answered. Defaults to "Developer Response". */
  label?: ReactNode;
}

export interface ReviewCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  /** Stars given, 0..5. */
  rating: number;
  date?: Date | string | number;
  author?: ReactNode;
  body: ReactNode;
  response?: ReviewResponse;
  /** Lines of the body shown before "more". */
  lines?: number;
  /** The title's heading level. */
  as?: "h2" | "h3" | "h4" | "h5" | "h6";
  locale?: string;
  look?: BlockLook;
}

const CARD: Record<BlockLook, string> = {
  civic: "rounded-card bg-surface p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.06)]",
  fun: "rounded-lg bg-surface p-5 transition-[translate,rotate,box-shadow] duration-300 ease-spring fun:hover:-translate-y-1 fun:hover:rotate-[-0.6deg] fun:hover:shadow-pop",
  signal: "rounded-xs border border-line bg-surface p-4",
  product: "rounded-card border border-line bg-paper-2 p-5",
  minimal: "border-t border-ink pt-4",
};
const HEAD: Record<BlockLook, string> = {
  civic: "font-display text-[1.125rem] font-normal leading-snug",
  fun: "font-display text-[1.25rem] font-black leading-tight tracking-[-0.02em]",
  signal: "font-mono text-[0.875rem] font-medium uppercase tracking-[0.04em]",
  product: "font-sans text-[1rem] font-semibold tracking-[-0.01em]",
  minimal: "font-sans text-[1rem] font-medium",
};
const META = (look: BlockLook) => cn("text-[0.8125rem] text-mute", look === "signal" && "font-mono text-[0.6875rem] uppercase tracking-[0.06em]");

export function ReviewCard({ title, rating, date, author, body, response, lines = 3, as: H = "h3", locale, look: lookProp, className, ...rest }: ReviewCardProps) {
  const { ref, look } = useBlockLook<HTMLElement>(lookProp);
  const when = fmtDate(date, locale);
  const replyWhen = fmtDate(response?.date, locale);
  const bodyText = cn("text-[0.9375rem] leading-relaxed text-ink-2", look === "signal" && "text-[0.875rem]");
  return (
    <article ref={ref} data-slot="review-card" data-look={look} className={cn("flex flex-col gap-2 text-ink", CARD[look], className)} {...rest}>
      <header className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <H data-slot="review-title" className={cn("m-0 min-w-0 truncate text-ink", HEAD[look])}>
            {title}
          </H>
          {when && (
            <time data-slot="review-date" dateTime={when.iso} className={cn("shrink-0 whitespace-nowrap", META(look))}>
              {when.text}
            </time>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <Stars value={rating} size={look === "fun" ? 16 : 13} look={look} locale={locale} />
          {author && (
            <span data-slot="review-author" className={cn("min-w-0 truncate", META(look))}>
              {look === "signal" ? <>@{author}</> : author}
            </span>
          )}
        </div>
      </header>
      <div data-slot="review-body">
        <Clamped lines={lines} className={bodyText}>
          {body}
        </Clamped>
      </div>
      {response && (
        <section
          data-slot="review-response"
          aria-label="Developer response"
          className={cn(
            "mt-2",
            look === "civic" && "rounded-sm bg-paper p-4",
            look === "fun" && "rounded-card bg-paper p-4",
            look === "signal" && "border-t border-dashed border-line pt-3",
            look === "product" && "ml-4 border-l border-line pl-4",
            look === "minimal" && "ml-6 border-l border-line pl-4",
          )}
        >
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span
              data-slot="review-response-label"
              className={cn(
                "text-[0.8125rem] font-semibold text-ink",
                look === "signal" && "font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-accent",
                look === "civic" && "uppercase tracking-[0.06em] text-[0.75rem]",
              )}
            >
              {look === "signal" ? <>&gt; {response.label ?? "Dev response"}</> : (response.label ?? "Developer Response")}
            </span>
            {replyWhen && (
              <time dateTime={replyWhen.iso} className={cn("shrink-0 whitespace-nowrap", META(look))}>
                {replyWhen.text}
              </time>
            )}
          </div>
          <Clamped lines={lines} className={bodyText}>
            {response.body}
          </Clamped>
        </section>
      )}
    </article>
  );
}

/* ── AwardBadge ── */

export interface AwardBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** The main line, e.g. "App of the Day" or "in Productivity". */
  label: ReactNode;
  /** A small line above, e.g. "Editors' Choice". */
  kicker?: ReactNode;
  /** Set inside the wreath, e.g. "#1". */
  rank?: ReactNode;
  tone?: LaurelTone;
  look?: BlockLook;
}

const BADGE: Record<BlockLook, string> = {
  civic: "rounded-xs border border-line bg-surface px-3 py-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)]",
  fun: "rounded-pill bg-acid px-3.5 py-1.5 text-ink fun:hover:animate-wiggle",
  signal: "rounded-xs border border-ink/40 px-2.5 py-1",
  product: "rounded-pill border border-line bg-surface px-3 py-1",
  minimal: "px-0 py-1",
};
const BADGE_TEXT: Record<BlockLook, string> = {
  civic: "font-display text-[0.9375rem]",
  fun: "font-display text-[0.9375rem] font-black tracking-[-0.01em]",
  signal: "font-mono text-[0.75rem] uppercase tracking-[0.08em]",
  product: "font-sans text-[0.8125rem] font-semibold",
  minimal: "font-sans text-[0.8125rem]",
};

export function AwardBadge({ label, kicker, rank, tone, look: lookProp, className, ...rest }: AwardBadgeProps) {
  const { ref, look } = useBlockLook<HTMLSpanElement>(lookProp);
  return (
    <span ref={ref} data-slot="award-badge" data-look={look} className={cn("inline-flex items-center gap-2 text-ink", BADGE[look], className)} {...rest}>
      <LaurelWreath look={look} tone={tone ?? (look === "fun" ? "ink" : undefined)} size={kicker ? 30 : 24} leaves={4}>
        {rank}
      </LaurelWreath>
      <span className="flex flex-col leading-tight">
        {kicker && <span className={cn("text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ink-2", look === "signal" && "font-mono font-normal")}>{kicker}</span>}
        <span className={cn("whitespace-nowrap", BADGE_TEXT[look])}>{look === "signal" ? <>[ {label} ]</> : label}</span>
      </span>
    </span>
  );
}
