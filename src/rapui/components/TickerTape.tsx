/* ══ TickerTape ═══════════════════════════════════════════
   A strip of quotes — symbol, price, ▲/▼ change in the trend colours —
   running past like the tape above a trading floor.

     <TickerTape quotes={[{ symbol: "NRTH", price: 182.4, change: 2.21, changePct: 1.23 }, …]} />

   Feed it new `quotes` as prices move; each cell notices its own price
   change. It stops while the pointer is over it or focus is inside it,
   and has a pause button (WCAG 2.2.2: anything that moves on its own
   for more than five seconds must be stoppable). Under
   prefers-reduced-motion, or motion "still", the tape does not move at
   all: it becomes an ordinary row you scroll yourself.
   variant="board" is a static grid of quote cells instead — a
   departure board; in signal it is mono on ruled cells.
   Screen readers get a polite summary of what moved, at most every
   15 seconds, rather than every tick.

   DELIGHT — THE FLASH. A cell whose price just changed lights up with
   a green or red wash that fades out over a second, like a quote board
   catching a trade. Calm: the tape runs slower and there is no flash —
   the price is just tinted the colour of its last move. */
import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import { formatMoney, formatNumber, formatPercent, trend as trendOf } from "../finance";
import { usePreset } from "../hooks/usePreset";
import { Pause, Play } from "../icons";
import { cn, prefersReducedMotion } from "../utils";

export interface Quote {
  symbol: string;
  price: number;
  /** Change since the open, in price units. */
  change: number;
  /** Change since the open, percent (1.2 = 1.2%). */
  changePct: number;
  /** Full name, for screen readers and the board. */
  name?: string;
}

export interface TickerTapeProps extends HTMLAttributes<HTMLDivElement> {
  quotes: Quote[];
  /** tape: a scrolling strip · board: a static grid of cells. */
  variant?: "tape" | "board";
  /** Format prices as this currency; plain numbers otherwise. */
  currency?: string;
  locale?: string;
  /** Tape speed, px per second (calm runs at 60% of it). */
  speed?: number;
  /** Accessible name of the strip. */
  label?: string;
  /** Mono figures (signal's own). Defaults to the preset's. */
  mono?: boolean;
}

type Tick = "up" | "down" | undefined;

/* one quote; remembers its last price to flash (fun) or tint (calm) on a move */
function QuoteCell({
  q,
  currency,
  locale,
  board,
  mono,
  hidden,
}: {
  q: Quote;
  currency?: string;
  locale?: string;
  board?: boolean;
  mono?: boolean;
  hidden?: boolean;
}) {
  const prev = useRef(q.price);
  const wash = useRef<HTMLSpanElement>(null);
  const [tick, setTick] = useState<Tick>();
  useEffect(() => {
    if (q.price === prev.current) return;
    const dir: Tick = q.price > prev.current ? "up" : "down";
    prev.current = q.price;
    setTick(dir);
    const el = wash.current;
    // the flash rides on fun motion only; calm keeps just the tint (below)
    if (el && !prefersReducedMotion() && !el.closest('[data-rap-motion="calm"], [data-rap-motion="still"]')) {
      el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], { duration: 1100, easing: "ease-out" });
    }
  }, [q.price]);

  const t = trendOf(q.change);
  const price = currency ? formatMoney(q.price, { currency, locale }) : formatNumber(q.price, { locale, digits: 2 });
  return (
    <li
      data-slot="ticker-quote"
      data-trend={t}
      data-tick={tick}
      aria-hidden={hidden || undefined}
      className={cn(
        "relative isolate flex-none tabular-nums",
        board
          ? "flex flex-col gap-1 bg-surface px-4 py-3"
          : "inline-flex items-baseline gap-2 px-5 py-2.5 shadow-[inset_-1px_0_0_var(--rap-line)]",
        mono && "font-mono",
      )}
    >
      <span
        ref={wash}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-0",
          tick === "up" ? "bg-chart-up/22" : "bg-chart-down/22",
        )}
      />
      <span className={cn("font-semibold text-ink", mono && "uppercase tracking-[0.04em]")}>
        {q.symbol}
        {board && q.name && <span className="ml-2 font-normal text-mute normal-case tracking-normal text-[0.8125rem]">{q.name}</span>}
      </span>
      <span
        className={cn(
          "text-ink",
          board && "text-[1.375rem] font-medium leading-[1.1]",
          !board && "font-medium",
          // calm: no flash — the price keeps the colour of its last move
          "transition-colors duration-(--rap-dur)",
          "calm:in-data-[tick=up]:text-chart-up calm:in-data-[tick=down]:text-chart-down",
          "motion-reduce:in-data-[tick=up]:text-chart-up motion-reduce:in-data-[tick=down]:text-chart-down",
        )}
      >
        {price}
      </span>
      <span className={cn("text-[0.8125rem] font-medium", t === "up" ? "text-chart-up" : t === "down" ? "text-chart-down" : "text-mute")}>
        <span aria-hidden className="mr-1 text-[0.75em]">
          {t === "up" ? "▲" : t === "down" ? "▼" : "■"}
        </span>
        <span className="sr-only">{t === "up" ? "up" : t === "down" ? "down" : "unchanged"} </span>
        {formatNumber(Math.abs(q.change), { locale, digits: 2 })}
        <span className="text-[0.95em] opacity-80"> ({formatPercent(Math.abs(q.changePct), { locale, sign: false })})</span>
      </span>
    </li>
  );
}

/* a polite, throttled summary of what moved */
function useAnnouncer(quotes: Quote[], locale?: string) {
  const [said, setSaid] = useState("");
  const last = useRef(new Map(quotes.map((q) => [q.symbol, q.price])));
  const lastAt = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastAt.current < 15_000) return;
    const moved = quotes.filter((q) => last.current.get(q.symbol) !== q.price).slice(0, 3);
    if (!moved.length) return;
    lastAt.current = now;
    last.current = new Map(quotes.map((q) => [q.symbol, q.price]));
    setSaid(
      moved
        .map((q) => `${q.symbol} ${formatNumber(q.price, { locale, digits: 2 })}, ${q.change >= 0 ? "up" : "down"} ${formatPercent(Math.abs(q.changePct), { locale, sign: false })}`)
        .join("; "),
    );
  }, [quotes, locale]);
  return said;
}

export const TickerTape = forwardRef<HTMLDivElement, TickerTapeProps>(function TickerTape(
  { quotes, variant = "tape", currency, locale, speed = 48, label = "Market prices", mono, className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest },
  outer,
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const setRef = (node: HTMLDivElement | null) => {
    ref.current = node;
    if (typeof outer === "function") outer(node);
    else if (outer) outer.current = node;
  };
  const { preset, motion } = usePreset(ref);
  const isMono = mono ?? preset === "signal";
  const said = useAnnouncer(quotes, locale);

  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  const moving = variant === "tape" && !reduced && motion !== "still";

  const [userPaused, setUserPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const paused = userPaused || hover || focus;

  /* the scroll: two copies in one track, slid left by half its width forever.
     Web Animations rather than a keyframe so pausing holds the exact spot. */
  const track = useRef<HTMLUListElement>(null);
  const anim = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const el = track.current;
    if (!moving || !el) return;
    let a: Animation | null = null;
    const start = () => {
      const half = el.scrollWidth / 2;
      const pxs = motion === "calm" ? speed * 0.6 : speed;
      const progress = a?.effect?.getComputedTiming().progress ?? 0;
      a?.cancel();
      a = el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }], {
        duration: Math.max(4000, (half / pxs) * 1000),
        iterations: Infinity,
      });
      a.currentTime = (progress ?? 0) * Number(a.effect?.getTiming().duration ?? 0);
      if (paused) a.pause();
      anim.current = a;
    };
    start();
    const ro = new ResizeObserver(start);
    ro.observe(el);
    return () => {
      ro.disconnect();
      a?.cancel();
      anim.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moving, motion, speed, quotes.length]);
  useEffect(() => {
    const a = anim.current;
    if (!a) return;
    if (paused) a.pause();
    else a.play();
  }, [paused]);

  if (variant === "board") {
    return (
      <div ref={setRef} data-slot="ticker-board" role="region" aria-label={label} className={cn("w-full text-ink", className)} {...rest}>
        <ul
          className={cn(
            "m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-px overflow-hidden p-0",
            isMono ? "rounded-xs bg-line shadow-[0_0_0_1px_var(--rap-line)]" : "rounded-card bg-line",
          )}
        >
          {quotes.map((q) => (
            <QuoteCell key={q.symbol} q={q} currency={currency} locale={locale} board mono={isMono} />
          ))}
        </ul>
        <p className="sr-only" aria-live="polite">
          {said}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={setRef}
      data-slot="ticker-tape"
      data-paused={paused || undefined}
      role="region"
      aria-label={label}
      className={cn(
        "relative flex w-full items-stretch overflow-hidden bg-surface text-[0.9375rem] text-ink",
        isMono ? "rounded-xs shadow-[inset_0_0_0_1px_var(--rap-line)]" : "rounded-pill",
        className,
      )}
      onMouseEnter={(e) => {
        setHover(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setFocus(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
        onBlur?.(e);
      }}
      {...rest}
    >
      <div
        // the strip itself is focusable so keyboard users can stop it (and scroll it when static)
        tabIndex={0}
        role="group"
        aria-label={`${label}${moving ? (paused ? ", paused" : ", scrolling") : ""}`}
        className={cn(
          "min-w-0 flex-1 outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
          moving ? "overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]" : "overflow-x-auto",
          !isMono && "rounded-l-pill",
        )}
      >
        <ul ref={track} className="m-0 flex w-max list-none p-0">
          {quotes.map((q) => (
            <QuoteCell key={q.symbol} q={q} currency={currency} locale={locale} mono={isMono} />
          ))}
          {moving && quotes.map((q) => <QuoteCell key={`${q.symbol}~`} q={q} currency={currency} locale={locale} mono={isMono} hidden />)}
        </ul>
      </div>
      {moving && (
        <button
          type="button"
          data-slot="ticker-pause"
          onClick={() => setUserPaused((p) => !p)}
          aria-pressed={userPaused}
          aria-label={userPaused ? "Play ticker" : "Pause ticker"}
          className={cn(
            "grid w-11 flex-none place-items-center bg-surface text-ink-2 cursor-pointer shadow-[inset_1px_0_0_var(--rap-line)]",
            "hover:bg-fill hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring",
            !isMono && "rounded-r-pill",
          )}
        >
          {userPaused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
        </button>
      )}
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </div>
  );
});
