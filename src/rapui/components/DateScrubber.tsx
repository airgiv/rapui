import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useSound } from "../sound";
import { clamp, cn } from "../utils";
import { RollingNumber, isCalm } from "./ScrubNumber";
import { rubber, useCarry, useThrow } from "./tickKit";

/* ══ Date scrubber ════════════════════════════════════════
   The TimeScrubber's ruler, laid out in days instead of minutes.
   Drag the calendar under the centre mark, fling it and it
   coasts, then settles on a whole day; the day of the month
   rolls above it in big figures.

   ── A WEEK YOU CAN SEE WITHOUT READING ──────────────────
   Three lengths and two inks, and nothing else. A day is a short
   tick, a Monday a longer one, the first of a month the longest,
   with the month's name under it — so the ruler reads as weeks
   grouped into months at a glance. Saturdays and Sundays are
   drawn at under half the ink: the week-end is a lighter patch
   of the tape, which is how a paper diary shows it too.

   ── WHY 14px A DAY ──────────────────────────────────────
   Wide enough that a finger can put one day under the mark
   without a magnifier (a 2px tick with 12px of air either side),
   narrow enough that a 600px card shows six weeks — the window
   in which "which night?" is usually asked. A fling at the
   capped speed carries about a month, never a year.

   ── A DAY IS A NOTCH ────────────────────────────────────
   Every day crossed clicks; the first of a month is the firmest,
   week-ends the softest, and the pitch climbs through the month
   (×0.8 on the 1st to ×1.5 on the 31st), so a long fling is a
   run of rising scales, each one resetting at a month's edge. */

const DAY_MS = 86_400_000;
/* px per day along the ruler, see above */
const PX = 14;

const indexOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / DAY_MS);
};
const isoOf = (i: number) => new Date(Math.round(i) * DAY_MS).toISOString().slice(0, 10);
const partsOf = (i: number) => {
  const t = new Date(Math.round(i) * DAY_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), wd: t.getUTCDay() };
};
const todayIndex = () => {
  const n = new Date();
  return Math.round(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / DAY_MS);
};

export interface DateScrubberProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  /** The chosen day, "YYYY-MM-DD". */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called once the ruler has settled after a drag, fling or key. */
  onValueCommit?: (value: string) => void;
  /** Earliest / latest day, "YYYY-MM-DD". The ruler stretches a little past them and springs back. */
  min?: string;
  max?: string;
  /** How far a fling carries, 0..100. */
  momentum?: number;
  /** Show "Today", "Tomorrow", "In 5 days" beside the date. */
  relative?: boolean;
  /** Locale for month and weekday names. */
  locale?: string;
  disabled?: boolean;
}

/** A ruler of days you drag or fling under a fixed mark; the date rolls above it. */
export const DateScrubber = forwardRef<HTMLDivElement, DateScrubberProps>(function DateScrubber(
  {
    value,
    defaultValue,
    onValueChange,
    onValueCommit,
    min,
    max,
    momentum = 50,
    relative = true,
    locale = "en-GB",
    disabled,
    className,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const lo = min ? indexOf(min) : -Infinity;
  const hi = max ? indexOf(max) : Infinity;
  const start = clamp(value ? indexOf(value) : defaultValue ? indexOf(defaultValue) : todayIndex(), lo, hi);
  const today = todayIndex();

  const sound = useSound();
  const ruler = useRef<HTMLDivElement>(null);
  const emitted = useRef(start);
  const lastDay = useRef(start);
  const bounds = useRef({ lo, hi });
  bounds.current = { lo, hi };
  const cb = useRef({ onValueChange, onValueCommit });
  cb.current = { onValueChange, onValueCommit };

  /* a notch for every day crossed — see the header for the pitch */
  const hear = (x: number) => {
    const k = Math.round(x);
    if (k === lastDay.current) return;
    lastDay.current = k;
    const { d, wd } = partsOf(k);
    sound.detent(d === 1 ? 1 : wd === 0 || wd === 6 ? 0.35 : 0.55, { pitch: 0.8 + ((d - 1) / 30) * 0.7 });
    const b = bounds.current;
    const c = clamp(k, b.lo, b.hi);
    if (c !== emitted.current) {
      emitted.current = c;
      cb.current.onValueChange?.(isoOf(c));
    }
  };

  const carry = useCarry(start, hear);
  const { pos, state, set, goTo, stop } = carry;

  const land = (to: number, v = 0) => {
    const b = bounds.current;
    const target = clamp(Math.round(to), b.lo, b.hi);
    goTo(target, v, isCalm(ruler.current));
    committed.current = target;
  };
  /* commit once the spring has parked */
  const committed = useRef<number | null>(null);
  useEffect(() => {
    if (committed.current === null || state.current.raf) return;
    if (Math.abs(pos - committed.current) < 0.001) {
      const c = committed.current;
      committed.current = null;
      cb.current.onValueCommit?.(isoOf(c));
    }
  }, [pos, state]);

  /* a value set from outside travels on the spring too */
  useEffect(() => {
    if (value === undefined || drag.current) return;
    const i = indexOf(value);
    if (i !== emitted.current) {
      emitted.current = i;
      goTo(i, 0, isCalm(ruler.current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  /* the ruler fills its card, so its width is measured */
  const [w, setW] = useState(480);
  useLayoutEffect(() => {
    const el = ruler.current;
    if (!el) return;
    const read = () => setW(el.offsetWidth || 480);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── the drag ──────────────────────────────────────────── */
  const drag = useRef<null | { x: number; raw: number; k: number }>(null);
  const hand = useThrow();

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a scripted pointer */
    }
    e.currentTarget.dataset.pointer = "";
    stop();
    /* a card drawn at a scale (a zoomed stage) moves the hand
       further than the ruler: divide it back out */
    const k = e.currentTarget.getBoundingClientRect().width / e.currentTarget.offsetWidth || 1;
    drag.current = { x: e.clientX, raw: state.current.x, k };
    hand.reset();
    committed.current = null;
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g) return;
    /* left is later: the ruler moves under a fixed mark */
    const dd = -(e.clientX - g.x) / g.k / PX;
    g.x = e.clientX;
    g.raw += dd;
    hand.feed(dd);
    const b = bounds.current;
    set(rubber(g.raw, b.lo, b.hi));
  };

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* never captured */
    }
    if (!g) return;
    /* capped at 1.2 days a frame: a flick spins a month, not a year */
    const v = hand.release(1.2);
    const reach = 6 + (clamp(momentum, 0, 100) / 100) * 30;
    /* the landing includes the throw, so the spring starts with
       only part of the hand's speed — all of it on top would carry
       it past the day and swing back */
    land(state.current.x + v * reach, v * 0.6);
  };

  /* a trackpad's sideways swipe moves it too — only sideways, so
     scrolling the page past the ruler is never caught */
  useEffect(() => {
    const el = ruler.current;
    if (!el) return;
    let idle = 0;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || el.getAttribute("aria-disabled") === "true") return;
      e.preventDefault();
      stop();
      const b = bounds.current;
      set(rubber(state.current.x + e.deltaX / PX, b.lo, b.hi));
      clearTimeout(idle);
      idle = window.setTimeout(() => land(state.current.x), 120);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", wheel);
      clearTimeout(idle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    delete e.currentTarget.dataset.pointer;
    const at = committed.current ?? Math.round(state.current.to);
    const { y, m, d } = partsOf(at);
    /* a month is a calendar month, not 30 days: the 31st of
       January goes to the last of February, not the 3rd of March */
    const month = (n: number) => {
      const last = new Date(Date.UTC(y, m + n + 1, 0)).getUTCDate();
      return Math.round(Date.UTC(y, m + n, Math.min(d, last)) / DAY_MS);
    };
    const map: Record<string, () => number> = {
      ArrowRight: () => at + 1,
      ArrowLeft: () => at - 1,
      ArrowUp: () => at + 7,
      ArrowDown: () => at - 7,
      PageUp: () => month(1),
      PageDown: () => month(-1),
      Home: () => today,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    land(map[e.key]());
  };

  /* ── the ticks in the window ───────────────────────────── */
  const half = Math.max(60, w / 2 - 8);
  const span = half / PX + 2;
  const fmtMonth = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
  const ticks: { i: number; x: number; f: number; kind: "month" | "week" | "day"; rest: boolean; label?: string }[] = [];
  for (let i = Math.floor(pos - span); i <= Math.ceil(pos + span); i++) {
    const x = (i - pos) * PX;
    /* a dial seen from the front: tall and dark at the mark,
       shorter and fainter toward the ends */
    const f = clamp(1 - Math.pow(Math.abs(x) / half, 2), 0, 1);
    const { m, d, wd, y } = partsOf(i);
    const kind = d === 1 ? "month" : wd === 1 ? "week" : "day";
    ticks.push({
      i,
      x,
      f,
      kind,
      rest: wd === 0 || wd === 6,
      label: d === 1 ? (m === 0 ? String(y) : fmtMonth.format(new Date(i * DAY_MS))) : undefined,
    });
  }

  /* ── the reading ───────────────────────────────────────── */
  const shown = clamp(Math.round(pos), lo, hi);
  const at = new Date(shown * DAY_MS);
  const { d } = partsOf(shown);
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(at);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(at);
  const year = at.getUTCFullYear();
  const full = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(at);
  const off = shown - today;
  const rel =
    off === 0 ? "Today" : off === 1 ? "Tomorrow" : off === -1 ? "Yesterday" : off > 0 ? `In ${off} days` : `${-off} days ago`;

  return (
    <div
      ref={ref}
      data-slot="date-scrubber"
      data-disabled={disabled || undefined}
      className={cn("flex flex-col gap-3 w-full min-w-0 font-sans text-ink select-none", disabled && "opacity-50 pointer-events-none", className)}
      {...rest}
    >
      <div data-slot="date-scrubber-read" className="flex items-end gap-3 px-1">
        {/* the day of the month is the figure: 52px, the size the
            TimeScrubber's time would be if it had one number to say */}
        <span data-slot="date-scrubber-day" className="text-[52px] font-medium leading-none tracking-[-0.045em] tabular-nums">
          <RollingNumber text={String(d)} />
        </span>
        <span className="flex flex-col pb-[3px] leading-[1.15]">
          <span data-slot="date-scrubber-month" className="text-[1.0625rem] font-medium tracking-[-0.02em]">
            {monthName}
          </span>
          <span data-slot="date-scrubber-weekday" className="text-[0.8125rem] font-medium tracking-[-0.01em] text-mute">
            {weekday} · {year}
          </span>
        </span>
        {relative && (
          <span
            data-slot="date-scrubber-relative"
            data-today={off === 0 || undefined}
            className="ml-auto mb-[3px] px-2.5 h-7 inline-flex items-center rounded-pill bg-fill text-[0.8125rem] font-medium tracking-[-0.01em] text-ink-2 tabular-nums data-[today]:bg-ink data-[today]:text-paper"
          >
            {rel}
          </span>
        )}
      </div>

      <div
        ref={ruler}
        data-slot="date-scrubber-ruler"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel ?? "Date"}
        aria-valuetext={full}
        aria-valuenow={shown}
        aria-valuemin={Number.isFinite(lo) ? lo : undefined}
        aria-valuemax={Number.isFinite(hi) ? hi : undefined}
        aria-disabled={disabled || undefined}
        /* touch-action pan-y: a vertical swipe still scrolls the page;
           the mask fades both ends like a wheel turning away */
        className={cn(
          "relative h-[64px] overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y outline-none rounded-[14px]",
          "[mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)]",
          "[&:focus-visible:not([data-pointer])]:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
        )}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <div data-slot="date-scrubber-track" className="absolute inset-y-0 left-1/2" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t.i}
              data-slot="date-scrubber-tick"
              data-kind={t.kind}
              data-rest={t.rest || undefined}
              /* 10 / 16 / 26px: a day, a week's start, a month's.
                 Week-end ink is 0.42 of a weekday's (see header). */
              className="absolute top-2 -left-px w-[2px] h-[10px] rounded-full bg-ink origin-top data-[kind=week]:h-[16px] data-[kind=month]:h-[26px]"
              style={{
                transform: `translateX(${t.x.toFixed(2)}px) scaleY(${(0.55 + 0.45 * t.f).toFixed(3)})`,
                opacity: (0.18 + 0.82 * t.f) * (t.rest ? 0.42 : 1),
              }}
            />
          ))}
          {ticks
            .filter((t) => t.label)
            .map((t) => (
              <span
                key={`l${t.i}`}
                data-slot="date-scrubber-month-label"
                className="absolute top-[40px] left-0 text-[11px] font-medium whitespace-nowrap text-mute"
                style={{ transform: `translateX(${t.x.toFixed(2)}px) translateX(-50%)`, opacity: 0.2 + 0.8 * t.f }}
              >
                {t.label}
              </span>
            ))}
          {/* today, a dot under its tick — the one fixed point on a moving tape */}
          {Math.abs(today - pos) <= span && (
            <span
              data-slot="date-scrubber-today"
              className="absolute top-[40px] -left-[2.5px] size-[5px] rounded-full bg-ink-2"
              style={{ transform: `translateX(${((today - pos) * PX).toFixed(2)}px)`, opacity: today === shown ? 0 : 0.6 }}
            />
          )}
        </div>
        {/* the fixed mark the days run under: flame, the scrubber family's "you are here" */}
        <span data-slot="date-scrubber-mark" className="absolute left-1/2 top-[2px] w-[3px] h-[32px] -ml-[1.5px] rounded-[2px] bg-flame" aria-hidden="true" />
      </div>
    </div>
  );
});
