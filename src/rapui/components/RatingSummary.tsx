/* ══ RatingSummary ════════════════════════════════════════
   The ratings block of a store page: the big average ("4.8"),
   "out of 5", a row of stars filled to the tenth, the number of
   ratings, and a 5→1 histogram. Each bar is a stop: hover or
   focus it and its count and share come up at the end of the row.

     <RatingSummary average={4.8} count={12480}
       distribution={[9620, 1840, 560, 210, 250]} />

   `distribution` runs 5 stars → 1 star. `compact` drops the
   histogram for one line: 4.8 ★★★★★ 12K ratings.

   Looks — each preset picks its own, or pass `look`:
     civic    a serif numeral, slim navy bars on a pale track,
              small-caps labels — a published result
     fun      a huge chunky numeral, fat rounded flame bars that
              grow in from the left one after another
     signal   a mono readout; each bar a row of phosphor dots
              (lit dots = share), stars as pips
     product  a clean semibold numeral, 4px ink bars, hairline
              outline stars filled in ink
     minimal  black on white: a light numeral, 1px bars on a
              hairline track

   Stars read as "4.8 out of 5"; the histogram is a list whose
   rows say "5 stars: 9,620 ratings, 77%". Built on <Stars>, a
   read-only row filled to any fraction (exported — ReviewCard
   and AppStats use it; the interactive <Rating> takes whole
   stars only).

   Delight (fun): the bars grow in, top to bottom. Calm: they are
   simply there. */
import { useId, useLayoutEffect, useState, type HTMLAttributes } from "react";
import { cn } from "../utils";
import { isMotionCalm } from "./FormField";
import { useBlockLook, type BlockLook } from "./Layout";

/* ── Stars ── read-only, filled to the tenth */

// the same chubby star as <Rating>: inner points far out, softened by a round-joined stroke
const STAR = "M12 2.7L15.23 8.45L21.7 9.75L17.23 14.6L18 21.15L12 18.4L6 21.15L6.77 14.6L2.3 9.75L8.77 8.45Z";
// a crisper, classic star for the strict looks
const STAR_SHARP = "M12 2.2l2.86 6.3 6.88.74-5.15 4.63 1.45 6.77L12 17.2l-6.04 3.44 1.45-6.77-5.15-4.63 6.88-.74z";

export interface StarsProps extends HTMLAttributes<HTMLSpanElement> {
  value: number;
  max?: number;
  /** Star size: px, or any CSS length. */
  size?: number | string;
  look?: BlockLook;
  /** Accessible name. Defaults to "4.8 out of 5". */
  label?: string;
  locale?: string;
}

export function Stars({ value, max = 5, size = 16, look: lookProp, label, locale, className, style, ...rest }: StarsProps) {
  const { ref, look } = useBlockLook<HTMLSpanElement>(lookProp);
  const id = useId().replace(/:/g, "");
  const v = Math.max(0, Math.min(max, value));
  const s = typeof size === "number" ? `${size}px` : size;
  const name = label ?? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(v)} out of ${max}`;
  return (
    <span
      ref={ref}
      role="img"
      aria-label={name}
      data-slot="stars"
      data-look={look}
      className={cn("inline-flex shrink-0 items-center align-middle", look === "fun" ? "text-flame" : look === "signal" ? "text-accent" : "text-ink", className)}
      style={{ gap: `calc(${s} * ${look === "signal" ? 0.22 : 0.08})`, ...style }}
      {...rest}
    >
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        const clip = `${id}-${i}`;
        return (
          <svg key={i} aria-hidden focusable="false" viewBox="0 0 24 24" className="block overflow-visible" style={{ width: s, height: s }}>
            <defs>
              <clipPath id={clip}>
                <rect x="0" y="0" width={24 * fill} height="24" />
              </clipPath>
            </defs>
            {look === "signal" ? (
              /* a pip: a dim dot, lit to the fraction */
              <>
                <circle cx="12" cy="12" r="7.5" fill="currentColor" opacity={0.18} />
                <circle cx="12" cy="12" r="7.5" fill="currentColor" clipPath={`url(#${clip})`} />
              </>
            ) : look === "fun" ? (
              <>
                <path d={STAR} className="fill-ink/12 stroke-transparent" strokeWidth={3.2} strokeLinejoin="round" />
                <path d={STAR} fill="currentColor" stroke="currentColor" strokeWidth={3.2} strokeLinejoin="round" clipPath={`url(#${clip})`} />
              </>
            ) : look === "product" || look === "minimal" ? (
              /* a hairline outline, filled in ink */
              <>
                <path d={STAR_SHARP} fill="none" stroke="currentColor" strokeWidth={look === "minimal" ? 1 : 1.25} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <path d={STAR_SHARP} fill="currentColor" clipPath={`url(#${clip})`} />
              </>
            ) : (
              <>
                <path d={STAR_SHARP} className="fill-ink/14" />
                <path d={STAR_SHARP} fill="currentColor" clipPath={`url(#${clip})`} />
              </>
            )}
          </svg>
        );
      })}
    </span>
  );
}

/* ── RatingSummary ── */

export interface RatingSummaryProps extends HTMLAttributes<HTMLDivElement> {
  /** The mean score, 0..5. */
  average: number;
  /** How many ratings in all. Defaults to the sum of `distribution`. */
  count?: number;
  /** Ratings per score, 5 stars first: [5★, 4★, 3★, 2★, 1★]. */
  distribution?: number[];
  /** One line — numeral, stars, count — no histogram. */
  compact?: boolean;
  locale?: string;
  look?: BlockLook;
  /** The word after the count. */
  ratingsLabel?: string;
}

const NUMERAL: Record<BlockLook, string> = {
  civic: "font-display font-normal text-[3.5rem] leading-[0.9] tracking-[-0.02em]",
  fun: "font-display font-black text-[4.25rem] leading-[0.85] tracking-[-0.04em]",
  signal: "font-mono font-medium text-[3rem] leading-none tracking-[-0.02em]",
  product: "font-sans font-semibold text-[3.5rem] leading-[0.9] tracking-[-0.035em]",
  minimal: "font-sans font-light text-[3.5rem] leading-[0.9] tracking-[-0.03em]",
};
const SMALLCAP: Record<BlockLook, string> = {
  civic: "font-sans text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-2",
  fun: "font-sans text-[0.8125rem] font-bold text-ink-2",
  signal: "font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-2",
  product: "font-sans text-[0.8125rem] font-medium text-mute",
  minimal: "font-sans text-[0.8125rem] text-mute",
};
const TRACK: Record<BlockLook, string> = {
  civic: "h-[6px] rounded-pill bg-paper-3",
  fun: "h-[10px] rounded-pill bg-fill",
  signal: "h-auto",
  product: "h-[4px] rounded-pill bg-fill",
  minimal: "h-px bg-line",
};
const BAR: Record<BlockLook, string> = {
  civic: "rounded-pill bg-ink",
  fun: "rounded-pill bg-flame",
  signal: "",
  product: "rounded-pill bg-ink",
  minimal: "bg-ink",
};
const SIGNAL_DOTS = 24;

export function RatingSummary({
  average,
  count: countProp,
  distribution = [],
  compact,
  locale,
  look: lookProp,
  ratingsLabel = "Ratings",
  className,
  ...rest
}: RatingSummaryProps) {
  const { ref, look } = useBlockLook<HTMLDivElement>(lookProp);
  const dist = [0, 1, 2, 3, 4].map((i) => Math.max(0, distribution[i] ?? 0));
  const sum = dist.reduce((a, b) => a + b, 0);
  const count = countProp ?? sum;
  const avg = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.max(0, Math.min(5, average)));
  const short = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(count);
  const full = new Intl.NumberFormat(locale);
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });

  /* fun: the bars grow in, one after another. Starts collapsed only when the motion is allowed. */
  const [grow, setGrow] = useState<"rest" | "from" | "to">("rest");
  useLayoutEffect(() => {
    if (look !== "fun" || compact || isMotionCalm(ref.current)) return;
    setGrow("from");
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrow("to")));
    return () => cancelAnimationFrame(id);
  }, [look, compact, ref]);

  const header = (
    <div data-slot="rating-summary-score" aria-hidden className={cn("flex", compact ? "items-center gap-3" : "flex-col items-center gap-1.5")}>
      <span className={cn("tabular-nums text-ink", NUMERAL[look], compact && "text-[2rem]", look === "fun" && "text-flame")}>
        {avg}
      </span>
      {!compact && <span className={SMALLCAP[look]}>{look === "signal" ? "/ 5.0" : "out of 5"}</span>}
      {compact && <Stars value={average} size={18} look={look} locale={locale} />}
      {compact && (
        <span className={SMALLCAP[look]}>
          {short} {ratingsLabel}
        </span>
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      data-slot="rating-summary"
      data-look={look}
      className={cn("text-ink", compact ? "inline-flex" : "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-2 sm:gap-x-8", className)}
      {...rest}
    >
      {/* the numbers, said once in full for screen readers */}
      <span className="sr-only">
        {avg} out of 5, {full.format(count)} {ratingsLabel.toLowerCase()}
      </span>
      {header}
      {!compact && (
        <div data-slot="rating-summary-bars" className="min-w-0">
          <ul className="m-0 flex list-none flex-col gap-[3px] p-0" aria-label="Ratings by score">
            {dist.map((n, i) => {
              const score = 5 - i;
              const share = sum ? n / sum : 0;
              const shown = grow === "from" ? 0 : share;
              return (
                <li
                  key={score}
                  tabIndex={0}
                  aria-label={`${score} star${score === 1 ? "" : "s"}: ${full.format(n)} ratings, ${pct.format(share)}`}
                  data-slot="rating-summary-row"
                  className="group grid grid-cols-[3.25rem_minmax(0,1fr)_3.5rem] items-center gap-2 rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span aria-hidden className="flex justify-end">
                    {look === "signal" ? (
                      <span className="font-mono text-[0.6875rem] tabular-nums text-ink-2">{score}★</span>
                    ) : (
                      <Stars value={score} max={score} size={look === "fun" ? 9 : 8} look={look} className="text-ink-2" label="" />
                    )}
                  </span>
                  {look === "signal" ? (
                    <span aria-hidden className="flex items-center gap-[2px] text-accent">
                      {Array.from({ length: SIGNAL_DOTS }, (_, d) => (
                        <i key={d} className={cn("block size-[4px] shrink-0 rounded-full bg-current", d < Math.round(share * SIGNAL_DOTS) ? "" : "opacity-15")} />
                      ))}
                    </span>
                  ) : (
                    <span aria-hidden className={cn("relative block overflow-hidden", TRACK[look])}>
                      <span
                        className={cn("absolute inset-y-0 left-0 block origin-left", BAR[look], grow !== "rest" && "transition-[width] duration-700 ease-spring")}
                        style={{ width: `${shown * 100}%`, transitionDelay: grow === "to" ? `${i * 70}ms` : undefined }}
                      />
                    </span>
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "text-right text-[0.75rem] tabular-nums text-mute opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100",
                      look === "signal" && "font-mono",
                    )}
                  >
                    {new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n)}
                  </span>
                </li>
              );
            })}
          </ul>
          <p aria-hidden className={cn("m-0 mt-2 text-right", SMALLCAP[look])}>
            {look === "signal" ? `N = ${short}` : `${short} ${ratingsLabel}`}
          </p>
        </div>
      )}
    </div>
  );
}
