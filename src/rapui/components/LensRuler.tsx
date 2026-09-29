import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useSound } from "../sound";
import { useSpring } from "../hooks/useSpring";
import { clamp, cn } from "../utils";
import { RollingNumber, isCalm } from "./ScrubNumber";

/* ══ Lens ruler ═══════════════════════════════════════════
   A vertical ruler — a thermometer's scale, a type-size ramp —
   with a magnifying lens riding on it. Press anywhere on the
   ruler and the lens goes there; under it the ticks spread apart
   and the fine ones, too close to read at rest, come into view.

   ── A FISHEYE THAT CANNOT FOLD ──────────────────────────
   A tick at distance d from the lens's centre is drawn at

       d′ = d + K·d·e^(−(d/R)²)

   which magnifies 1 + K at the centre and hands back to 1:1 by
   about 2R. Its slope is 1 + K·e^(−u²)(1 − 2u²), smallest at
   u² = 1.5 where it is 1 − 0.446·K — positive while K < 2.24,
   so ticks spread and squeeze but never pass each other. K = 1.3
   gives 2.3× at the centre, which is what it takes for a tenth of
   a degree (2.7px apart at rest on a 300px ruler) to become 6px:
   enough air for a 2px tick to stand alone.

   ── THE LENS REVEALS, IT DOES NOT ONLY ENLARGE ──────────
   Three tiers of tick. The whole units and the steps are always
   there; the fine ticks between them are drawn at an opacity that
   follows the local magnification, so at rest they are a faint
   texture and under the lens they are a readable scale. The
   labels do the same: every unit is labelled, but the ones out
   in the open are quieter than the ones in the glass.

   ── ONE SPRING ──────────────────────────────────────────
   The value answers the hand at once; the LENS follows it on
   Bencho's spring (tune 50) in px, so a jump across the ruler is
   a lens sliding there and settling with one small overshoot,
   and dragging smoothly it simply rides under your finger. */

const K = 1.3;
const R = 40;
/* room above and below the scale: the fisheye pushes the ticks at
   the ends outward by up to K·R·0.43 ≈ 22px */
const PAD = 24;
/* the fine ticks, per step */
const FINE = 5;

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

export interface LensRulerProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  onValueCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Labelled ticks every this many units. */
  major?: number;
  /** Set after the figure, e.g. "°". */
  unit?: string;
  /** Caption above the figure; also the accessible name. */
  label?: string;
  /** Anything under the figure (a hint, a status that follows the value). */
  hint?: ReactNode;
  format?: (value: number) => string;
  /** Ruler height, px. */
  height?: number;
  disabled?: boolean;
}

/** A vertical ruler with a fisheye lens that follows the value and spreads the ticks under it. */
export const LensRuler = forwardRef<HTMLDivElement, LensRulerProps>(function LensRuler(
  {
    value,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 16,
    max = 26,
    step = 0.5,
    major = 1,
    unit = "",
    label,
    hint,
    format,
    height = 300,
    disabled,
    className,
    style,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const places = Math.max(decimals(step), decimals(major));
  const span = Math.max(max - min, Number.EPSILON);
  const snap = (v: number) => Number(clamp(min + Math.round((v - min) / step) * step, min, max).toFixed(places));

  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => snap(defaultValue ?? (min + max) / 2));
  const current = controlled ? snap(value) : inner;
  const cur = useRef(current);
  cur.current = current;

  const sound = useSound();
  const rulerRef = useRef<HTMLDivElement>(null);

  const H = height - PAD * 2;
  const yOf = (v: number) => PAD + (1 - (v - min) / span) * H;

  const [calm, setCalm] = useState(false);
  useLayoutEffect(() => setCalm(isCalm(rulerRef.current)), [current]);
  const lens = useSpring(yOf(current), 50, calm);

  const commit = (next: number) => {
    if (next === cur.current) return;
    const isMajor = Math.abs(next / major - Math.round(next / major)) < 1e-6;
    /* firmer on the labelled units; pitch climbs with the value */
    sound.detent(isMajor ? 0.9 : 0.45, { pitch: 0.75 + ((next - min) / span) * 0.75 });
    cur.current = next;
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  const valueAt = (e: ReactPointerEvent) => {
    const b = rulerRef.current!.getBoundingClientRect();
    const k = b.height / (rulerRef.current!.offsetHeight || b.height) || 1;
    const y = (e.clientY - b.top) / k;
    return snap(min + (1 - (y - PAD) / H) * span);
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
    const map: Record<string, number> = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: major, PageDown: -major };
    let next: number | null = null;
    if (e.key in map) next = snap(cur.current + map[e.key]);
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    commit(next);
    onValueCommit?.(next);
  };

  /* a value from outside moves the lens by the spring, nothing else to do */
  useEffect(() => {
    cur.current = current;
  }, [current]);

  /* ── the drawing ───────────────────────────────────────── */
  const fine = step / FINE;
  const count = Math.round(span / fine);
  const warp = (y: number) => {
    const d = y - lens;
    const u = d / R;
    const e = Math.exp(-u * u);
    return { y: lens + d + K * d * e, m: 1 + K * e * (1 - 2 * u * u) };
  };
  const ticks = Array.from({ length: count + 1 }, (_, i) => {
    const v = min + i * fine;
    const { y, m } = warp(yOf(v));
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
    const isStep = i % FINE === 0;
    /* how much the glass is magnifying here, 0 in the open, 1 at its heart */
    const glass = clamp((m - 1) / K, 0, 1);
    return {
      i,
      v,
      y,
      kind: isMajor ? "major" : isStep ? "step" : "fine",
      glass,
      /* where the glass squeezes (just outside it, slope < 1) the
         labels would pile up: they step back there and return in
         the open */
      room: clamp((m - 0.55) / 0.4, 0, 1),
      /* fine ticks: a faint texture in the open, a scale under the lens */
      o: isMajor ? 0.9 : isStep ? 0.5 + 0.3 * glass : 0.1 + 0.55 * glass,
      /* and everything grows a little under the glass, as it would */
      s: 1 + 0.35 * glass,
    };
  });
  const text = format ? format(current) : current.toFixed(places);
  const name = ariaLabel ?? label ?? "Value";

  return (
    <div
      ref={ref}
      data-slot="lens-ruler"
      data-disabled={disabled || undefined}
      className={cn("inline-flex items-stretch gap-5 font-sans text-ink select-none", disabled && "opacity-50 pointer-events-none", className)}
      style={{ ...style, ["--lens-h" as string]: `${height}px` } as CSSProperties}
      {...rest}
    >
      <div data-slot="lens-ruler-read" className="flex flex-col justify-center gap-1.5 min-w-0">
        {label && <span className="text-[0.8125rem] font-medium tracking-[-0.01em] text-mute">{label}</span>}
        <span data-slot="lens-ruler-figure" className="flex items-start text-[44px] font-medium leading-none tracking-[-0.045em] tabular-nums">
          <RollingNumber text={text} />
          {unit && <span className="text-[0.55em] mt-[0.1em] ml-0.5 text-mute tracking-[-0.02em]">{unit}</span>}
        </span>
        {hint && <span data-slot="lens-ruler-hint" className="text-[0.8125rem] font-medium tracking-[-0.01em] text-ink-2">{hint}</span>}
      </div>
      <div
        ref={rulerRef}
        data-slot="lens-ruler-scale"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={name}
        aria-orientation="vertical"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={`${text}${unit}`}
        aria-disabled={disabled || undefined}
        className={cn(
          "relative shrink-0 w-[88px] h-(--lens-h) rounded-[18px] cursor-ns-resize touch-none outline-none overflow-hidden",
          "[&:focus-visible:not([data-pointer])]:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
        )}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        {/* the glass: a filled pill as tall as the lens's working
            reach (±R), drawn behind the ticks — rap/ui draws a lens
            the way it draws a well, as a fill, never a bevel */}
        <span
          data-slot="lens-ruler-lens"
          className="absolute left-1 right-1 rounded-[16px] bg-fill"
          style={{ top: lens - R * 1.15, height: R * 2.3 }}
          aria-hidden="true"
        />
        {ticks.map((t) =>
          t.y < -4 || t.y > height + 4 ? null : (
            <span
              key={t.i}
              data-slot="lens-ruler-tick"
              data-kind={t.kind}
              /* 6 / 11 / 18px: a fine tick, a step, a unit */
              className="absolute left-[18px] -mt-px h-[2px] w-[6px] rounded-full bg-ink origin-left data-[kind=step]:w-[11px] data-[kind=major]:w-[18px]"
              style={{ top: t.y, opacity: t.o, transform: `scaleX(${t.s.toFixed(3)})` }}
              aria-hidden="true"
            />
          ),
        )}
        {ticks
          .filter((t) => t.kind === "major" && t.y > 4 && t.y < height - 4)
          .map((t) => (
            <span
              key={`l${t.i}`}
              data-slot="lens-ruler-label"
              className="absolute left-[46px] -translate-y-1/2 text-[11px] font-medium tabular-nums tracking-[-0.01em] text-ink"
              style={{ top: t.y, opacity: (0.4 + 0.6 * t.glass) * t.room }}
              aria-hidden="true"
            >
              {t.v.toFixed(decimals(major))}
            </span>
          ))}
        {/* the reading line, in flame, across the heart of the lens */}
        <span data-slot="lens-ruler-mark" className="absolute left-[6px] w-[40px] h-[3px] -mt-[1.5px] rounded-[2px] bg-flame" style={{ top: lens }} aria-hidden="true" />
      </div>
    </div>
  );
});
