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
   ticks beside it lean away from where it is going, and step
   aside to let it through, both by how far the handle's spring
   trails the hand — which is its speed, near enough — on a
   falloff of about four ticks. Drag briskly and a bow wave runs
   ahead of it; stop, and the spring catches up, the lag goes to
   exactly zero and every tick is back upright on its own even
   slot. That is the one spring here (Bencho's, tune 50, in px).

   ── THE HANDLE ONLY EVER RESTS ON A TICK ────────────────
   The ticks are the scale, so every value is a tick: the pointer
   and the arrows pick the nearest tick the handle may stop on,
   the read-out is that tick's own value, and the spring only
   glides the handle from one tick's slot to the next (a soft
   click for each one it lands on). It used to follow the raw
   percentage, which almost never falls on a tick, so a drag
   often left the handle parked unevenly between two of them —
   read as broken. Now at rest the lag is exactly zero, the
   parting and leaning are exactly zero, and the handle covers
   its tick. The parting is a smooth odd curve (d·e^−d²) scaled
   by the lag, so a tick passing under the moving handle glides
   across instead of jumping from one side to the other. The one
   tick the handle covers simply steps out — hidden while it is
   within 5px (half the handle, half a tick, 1px of air) — and the
   spacing, positions and heights land on whole device pixels so
   every 2px tick renders equally crisp and every gap is the same.

   ── A CENTRE NOTCH, LIKE A PAN POT ──────────────────────
   Even is the one split people aim for, so it has a tick of its
   own (the grid always has an even number of gaps) and it is
   sticky: within 3 of 50 the handle drops to 50 and stays there until the hand
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
  /** Ticks in the row (fewer on a narrow row: they stay at least 10px apart). The handle always rests on one,
   *  so the values it can hold are this grid: 100 / (ticks − 1) apart, or `step` apart when that is coarser. */
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

  /* ── the grid: every value the handle can hold IS a tick ──
     m gaps, m + 1 ticks. Never closer than 10px (the 6px handle
     needs one clear slot, so a narrow row drops ticks rather than
     turning into a barcode) and always an even m, so 50/50 has a
     tick of its own. When `step` asks for fewer values than there
     are ticks, m is a whole multiple of 100/step and the handle
     stops only on every r-th tick — the ones in between are just
     scale. When it asks for more (step 1 on a 43-tick row), the
     ticks win: each is worth 100/m, rounded for the read-out. */
  const maxM = Math.max(2, Math.min(ticks, Math.floor(w / 10)) - 1);
  const k = Math.max(1, Math.round(100 / Math.max(step, 0.0001)));
  let m = k <= maxM ? k * Math.floor(maxM / k) : maxM;
  if (m % 2 && m > 2 && k > maxM) m -= 1;
  const r = k <= maxM ? m / k : 1;
  const snapIdx = (i: number) => clamp(Math.round(i / r) * r, 0, m);
  const idxOf = (v: number) => snapIdx((clamp(v, 0, 100) / 100) * m);
  const valOf = (i: number) => Math.round((i / m) * 100);
  const mid = m % 2 === 0 && (m / 2) % r === 0 ? m / 2 : -1;

  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => clamp(defaultValue, 0, 100));
  const index = idxOf(controlled ? value : inner);
  /* the read-out is the tick's own value, never the raw prop */
  const current = valOf(index);
  const cur = useRef(current);
  cur.current = current;

  /* ── the comb's geometry ─────────────────────────────── */
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const px = (v: number) => Math.round(v * dpr) / dpr;
  /* a whole number of device pixels between ticks, the comb centred
     in the row: rounding each tick instead would alternate 17/18px */
  const n = m + 1;
  const gap = Math.max(1, Math.floor((w / n) * dpr)) / dpr;
  const first = px((w - gap * n) / 2 + gap / 2);
  const slotOf = (i: number) => first + i * gap;

  const [calm, setCalm] = useState(false);
  useLayoutEffect(() => setCalm(isCalm(row.current)), [current]);
  /* the handle's rest is a tick's own slot, to the device pixel —
     the spring only glides it from one tick to the next */
  const target = slotOf(index);
  const at = useSpring(target, 50, calm);
  const lag = target - at;

  const commit = (i: number) => {
    const next = valOf(i);
    if (next === cur.current) return;
    sound.detent(i === mid ? 1 : i === 0 || i === m ? 0.8 : 0.4, { pitch: 0.75 + (next / 100) * 0.75 });
    cur.current = next;
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  /* the pointer picks the nearest tick the handle may stop on */
  const indexAt = (e: ReactPointerEvent) => {
    const b = row.current!.getBoundingClientRect();
    const raw = (e.clientX - b.left - first) / gap;
    if (centerDetent && mid >= 0 && Math.abs((raw / m) * 100 - 50) <= MAGNET) return mid;
    return snapIdx(raw);
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
    commit(indexAt(e));
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (held.current) commit(indexAt(e));
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
    /* one stop per arrow; a page is the stop nearest to 10% */
    const page = Math.max(r, Math.round(m / 10 / r) * r);
    const map: Record<string, number> = { ArrowRight: r, ArrowUp: r, ArrowLeft: -r, ArrowDown: -r, PageUp: page, PageDown: -page };
    const i0 = idxOf(cur.current);
    let next: number | null = null;
    if (e.key in map) next = snapIdx(i0 + map[e.key]);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = m;
    else if (e.key === "=" || e.key === "c") next = mid >= 0 ? mid : snapIdx(m / 2);
    if (next === null) return;
    e.preventDefault();
    commit(next);
    onValueCommit?.(valOf(next));
  };

  /* ── the drawing ───────────────────────────────────────── */
  const lean = clamp(lag * 0.9, -16, 16);
  /* 0 at rest, 1 once the handle trails the hand by 6px or more */
  const part = clamp(Math.abs(lag) / 6, 0, 1);
  const lines = Array.from({ length: n }, (_, i) => {
    const slot = slotOf(i);
    const left = slot < at;
    /* the ramp: 0 at its own end, 1 against the handle */
    const f = left ? slot / Math.max(1, at) : (w - slot) / Math.max(1, w - at);
    const d = (slot - at) / gap;
    const near = Math.exp(-Math.pow(d / 4, 2));
    /* stepping aside while it moves: a smooth odd bump that peaks at
       ±6px a tick and a bit from the handle, and is 0 at rest */
    const u = d / 1.2;
    const x = px(slot + part * 6 * u * Math.exp((1 - u * u) / 2));
    const rot = lean * near;
    return {
      i,
      x,
      left,
      /* under the handle: out of the way */
      hidden: Math.abs(x - at) < 5,
      h: px(40 * (0.3 + 0.7 * clamp(f, 0, 1))),
      r: Math.abs(rot) < 0.05 ? 0 : rot,
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
            data-hidden={t.hidden || undefined}
            className="absolute bottom-[6px] -ml-px w-[2px] rounded-full origin-bottom bg-ink data-[side=left]:opacity-90 data-[side=right]:bg-flame data-[hidden]:opacity-0"
            style={{ left: t.x, height: t.h, transform: t.r ? `rotate(${t.r.toFixed(2)}deg)` : undefined }}
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
