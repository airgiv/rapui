import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useSound } from "../sound";
import { useSpring } from "../hooks/useSpring";
import { clamp, cn } from "../utils";
import { RollingNumber, isCalm } from "./ScrubNumber";

/* ══ Split slider ═════════════════════════════════════════
   One amount shared between two things — rain and brown noise,
   work and play, a 60/40 crossfade. A row of ticks is filled from
   BOTH ends: the left share in ink, the right in flame, meeting
   at a handle you drag. Each end's figure rolls as its share
   changes; the two always add up to a hundred.

   ── A COMB THROUGH GRASS ────────────────────────────────
   The handle does not slide over the ticks, it parts them. The
   ticks beside it lean away from where it is going, by how far
   the handle's spring trails the hand — which is its speed, near
   enough — on a falloff of about four ticks. Drag briskly and a
   bow wave runs ahead of it; stop, and the spring catches up, the
   lag goes to zero and the ticks stand up again on their own.
   That is the one spring here (Bencho's, tune 50, in px).

   ── A CENTRE NOTCH, LIKE A PAN POT ──────────────────────
   Even is the one split people aim for, so it is sticky: within
   3 of 50 the handle drops to 50 and stays there until the hand
   has clearly moved on, with the firmest click of the row. The
   rest click softly, pitched by the left share — ×0.75 all the
   way right, ×1.5 all the way left — so you can hear which way
   the balance is tipping.

   ── WHY THE TICKS RISE TOWARD THE HANDLE ────────────────
   Each side is drawn as a ramp that climbs from its own end to
   the meeting point, 30% to 100% of the row's height, so the
   split reads as two amounts pressing against each other rather
   than as a bar with a marker on it. */

const MAGNET = 3;

export interface SplitSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  /** The LEFT side's share, 0–100; the right side gets the rest. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (left: number) => void;
  onValueCommit?: (left: number) => void;
  step?: number;
  /** Names of the two sides. */
  labels?: [ReactNode, ReactNode];
  /** Ticks in the row. */
  ticks?: number;
  /** Stick at 50/50. */
  centerDetent?: boolean;
  disabled?: boolean;
}

/** One amount split between two things, filled with ticks from both ends to a handle you drag. */
export const SplitSlider = forwardRef<HTMLDivElement, SplitSliderProps>(function SplitSlider(
  {
    value,
    defaultValue = 60,
    onValueChange,
    onValueCommit,
    step = 1,
    labels = ["Left", "Right"],
    ticks = 44,
    centerDetent = true,
    disabled,
    className,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const snap = (v: number) => clamp(Math.round(v / step) * step, 0, 100);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => snap(defaultValue));
  const current = controlled ? snap(value) : inner;
  const cur = useRef(current);
  cur.current = current;

  const sound = useSound();
  const row = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320);
  useLayoutEffect(() => {
    const el = row.current;
    if (!el) return;
    const read = () => setW(el.offsetWidth || 320);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [calm, setCalm] = useState(false);
  useLayoutEffect(() => setCalm(isCalm(row.current)), [current]);
  const target = (current / 100) * w;
  const at = useSpring(target, 50, calm);
  const lag = target - at;

  const commit = (next: number) => {
    if (next === cur.current) return;
    sound.detent(next === 50 ? 1 : next === 0 || next === 100 ? 0.8 : 0.4, { pitch: 0.75 + (next / 100) * 0.75 });
    cur.current = next;
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  const valueAt = (e: ReactPointerEvent) => {
    const b = row.current!.getBoundingClientRect();
    const raw = ((e.clientX - b.left) / b.width) * 100;
    if (centerDetent && Math.abs(raw - 50) <= MAGNET) return 50;
    return snap(raw);
  };

  const held = useRef(false);
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.dataset.pointer = "";
    e.currentTarget.focus({ preventScroll: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a scripted pointer */
    }
    held.current = true;
    commit(valueAt(e));
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (held.current) commit(valueAt(e));
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!held.current) return;
    held.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* never captured */
    }
    onValueCommit?.(cur.current);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    delete e.currentTarget.dataset.pointer;
    const map: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 10, PageDown: -10 };
    let next: number | null = null;
    if (e.key in map) next = snap(cur.current + map[e.key]);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    else if (e.key === "=" || e.key === "c") next = 50;
    if (next === null) return;
    e.preventDefault();
    commit(next);
    onValueCommit?.(next);
  };

  /* ── the drawing ───────────────────────────────────────── */
  const gap = w / ticks;
  const lean = clamp(lag * 0.9, -16, 16);
  const lines = Array.from({ length: ticks }, (_, i) => {
    const x = (i + 0.5) * gap;
    const left = x < at;
    /* the ramp: 0 at its own end, 1 against the handle */
    const f = left ? x / Math.max(1, at) : (w - x) / Math.max(1, w - at);
    const d = (x - at) / gap;
    const near = Math.exp(-Math.pow(d / 4, 2));
    /* the handle needs room: the two ticks either side step back */
    const push = Math.sign(d || 1) * 7 * Math.exp(-Math.pow(d / 1.2, 2));
    return {
      i,
      x: x + push,
      left,
      h: 0.3 + 0.7 * clamp(f, 0, 1),
      r: lean * near,
    };
  });
  const right = 100 - current;
  const [lName, rName] = labels;

  return (
    <div
      ref={ref}
      data-slot="split-slider"
      data-disabled={disabled || undefined}
      className={cn("flex flex-col gap-3 w-full min-w-0 font-sans text-ink select-none", disabled && "opacity-50 pointer-events-none", className)}
      {...rest}
    >
      <div data-slot="split-slider-read" className="flex items-end justify-between gap-4">
        <span className="flex flex-col gap-1 min-w-0">
          <span className="text-[0.8125rem] font-medium tracking-[-0.01em] text-mute truncate">{lName}</span>
          <span data-slot="split-slider-left" className="text-[34px] font-medium leading-none tracking-[-0.045em] tabular-nums">
            <RollingNumber text={String(current)} />
            <span className="text-[0.6em] text-mute ml-0.5">%</span>
          </span>
        </span>
        <span className="flex flex-col items-end gap-1 min-w-0">
          <span className="text-[0.8125rem] font-medium tracking-[-0.01em] text-mute truncate">{rName}</span>
          <span data-slot="split-slider-right" className="text-[34px] font-medium leading-none tracking-[-0.045em] tabular-nums text-flame">
            <RollingNumber text={String(right)} />
            <span className="text-[0.6em] opacity-60 ml-0.5">%</span>
          </span>
        </span>
      </div>
      <div
        ref={row}
        data-slot="split-slider-row"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel ?? "Split"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={current}
        aria-valuetext={`${current}% ${typeof lName === "string" ? lName : "left"}, ${right}% ${typeof rName === "string" ? rName : "right"}`}
        aria-disabled={disabled || undefined}
        className={cn(
          "relative h-[52px] cursor-ew-resize touch-pan-y outline-none rounded-[12px]",
          "[&:focus-visible:not([data-pointer])]:shadow-[0_0_0_2px_var(--rap-ring)]",
        )}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        {lines.map((t) => (
          <span
            key={t.i}
            data-slot="split-slider-tick"
            data-side={t.left ? "left" : "right"}
            /* grows up from the baseline, leans from its foot */
            className="absolute bottom-[6px] -ml-px w-[2px] h-[40px] rounded-full origin-bottom bg-ink data-[side=left]:opacity-90 data-[side=right]:bg-flame"
            style={{ left: t.x, transform: `rotate(${t.r.toFixed(2)}deg) scaleY(${t.h.toFixed(3)})` }}
            aria-hidden="true"
          />
        ))}
        <span
          data-slot="split-slider-handle"
          data-even={current === 50 || undefined}
          className="group/handle absolute top-0 bottom-0 w-[6px] -ml-[3px] rounded-full bg-ink data-[even]:bg-ink-2"
          style={{ left: at }}
          aria-hidden="true"
        >
          {/* the centre notch shows itself when you are in it */}
          <span className="absolute left-1/2 -top-[7px] -ml-[2px] size-[4px] rounded-full bg-ink opacity-0 transition-opacity duration-(--rap-dur-fast) group-data-[even]/handle:opacity-100" />
        </span>
      </div>
    </div>
  );
});
