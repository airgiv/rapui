import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useSound } from "../sound";
import { useSpring } from "../hooks/useSpring";
import { cn } from "../utils";
import { RollingNumber, isCalm } from "./ScrubNumber";
import { turn } from "./tickKit";

/* ══ Hue ring ═════════════════════════════════════════════
   A colour wheel drawn in the scrubbers' language: not a smooth
   rainbow disc but a ring of short, round-capped ticks, each one
   inked in its own hue. Put a finger anywhere on the ring and the
   hue under it is chosen; the swatch in the middle takes it.

   ── THE CHOSEN HUE SWELLS ───────────────────────────────
   The ticks round the selection grow — longer and a touch wider
   — on a bell curve, 14° to a side, so the chosen colour reads as
   a bulge in the ring rather than as a marker laid on top of it.
   The bulge travels on one spring (Bencho's, tune 50: a single
   small overshoot), always the SHORT way round, so dragging
   across the top of the ring does not send it on a lap.

   ── WHY OKLCH, AND WHY THESE TWO NUMBERS ────────────────
   The hue angle is OKLCH's, not HSL's: in HSL yellow is far
   brighter than blue at the same "lightness", so a ring of HSL
   ticks has a glaring band and a band that vanishes. OKLCH keeps
   every tick at the same perceived weight. 0.72 lightness and
   0.15 chroma sit inside sRGB for nearly the whole circle and
   hold up against both the white card and the dark one — these
   are the colours being chosen, so they are the one place in a
   rap/ui scrubber that is not ink.

   ── A NOTCH PER TICK ────────────────────────────────────
   Every tick crossed clicks, pitched round the wheel from ×0.75
   at red to ×1.5 just before it comes back — a sweep sounds like
   a scale that resets where the colours do. */

const R0 = 74;

/* rough OKLCH hue families, by the angle they start at */
const NAMES: [number, string][] = [
  [0, "Rose"],
  [15, "Red"],
  [40, "Coral"],
  [62, "Amber"],
  [85, "Yellow"],
  [110, "Lime"],
  [135, "Green"],
  [165, "Teal"],
  [190, "Cyan"],
  [215, "Sky"],
  [245, "Blue"],
  [270, "Indigo"],
  [290, "Violet"],
  [315, "Magenta"],
  [340, "Rose"],
];
export const hueName = (h: number) => {
  const x = ((h % 360) + 360) % 360;
  let name = NAMES[0][1];
  for (const [at, n] of NAMES) if (x >= at) name = n;
  return name;
};

export interface HueRingProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  /** Hue angle, 0–359 (OKLCH). */
  value?: number;
  defaultValue?: number;
  onValueChange?: (hue: number) => void;
  /** Degrees per step (keys and snapping). */
  step?: number;
  /** Ticks round the ring. */
  ticks?: number;
  /** OKLCH lightness (0–1) and chroma of the ticks and the swatch. */
  lightness?: number;
  chroma?: number;
  /** Dial diameter, px. */
  size?: number;
  disabled?: boolean;
}

/** A ring of hue-coloured ticks; the chosen hue swells and fills the swatch pill in the middle. */
export const HueRing = forwardRef<HTMLDivElement, HueRingProps>(function HueRing(
  {
    value,
    defaultValue = 60,
    onValueChange,
    step = 1,
    ticks = 72,
    lightness = 0.72,
    chroma = 0.15,
    size = 220,
    disabled,
    className,
    style,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const norm = (h: number) => ((Math.round(h / step) * step) % 360 + 360) % 360;
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => norm(defaultValue));
  const hue = controlled ? norm(value) : inner;
  const cur = useRef(hue);
  cur.current = hue;

  const sound = useSound();
  const dial = useRef<HTMLDivElement>(null);
  const heardTick = useRef(Math.round((hue / 360) * ticks));

  /* the bulge's target, unwrapped: always the short way round */
  const [aim, setAim] = useState(hue);
  useEffect(() => {
    setAim((a) => a + turn(a, hue));
  }, [hue]);
  const [calm, setCalm] = useState(false);
  useEffect(() => setCalm(isCalm(dial.current)), [hue]);
  const swell = useSpring(aim, 50, calm);

  const commit = (h: number) => {
    const n = norm(h);
    if (n === cur.current) return;
    const t = Math.round((n / 360) * ticks) % ticks;
    if (t !== heardTick.current) {
      heardTick.current = t;
      sound.detent(t % (ticks / 12) === 0 ? 0.8 : 0.45, { pitch: 0.75 + (n / 360) * 0.75 });
    }
    cur.current = n;
    if (!controlled) setInner(n);
    onValueChange?.(n);
  };

  const hueAt = (e: ReactPointerEvent) => {
    const b = dial.current!.getBoundingClientRect();
    const x = e.clientX - (b.left + b.width / 2);
    const y = e.clientY - (b.top + b.height / 2);
    /* 0° at 12 o'clock, clockwise */
    return ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360;
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
    commit(hueAt(e));
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (held.current) commit(hueAt(e));
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    held.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* never captured */
    }
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    delete e.currentTarget.dataset.pointer;
    const map: Record<string, number> = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: 15, PageDown: -15 };
    let next: number | null = null;
    if (e.key in map) next = cur.current + map[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 360 - step;
    if (next === null) return;
    e.preventDefault();
    commit(next);
  };

  const color = (h: number) => `oklch(${lightness} ${chroma} ${h.toFixed(1)})`;
  const lines = Array.from({ length: ticks }, (_, i) => {
    const h = (i * 360) / ticks;
    const d = Math.abs(turn(swell, h));
    /* the bell: 1 at the chosen hue, ~0.37 at 14° off, nothing by 40° */
    const g = Math.exp(-Math.pow(d / 14, 2));
    const a = ((h - 90) * Math.PI) / 180;
    const len = 7 + 15 * g;
    return {
      i,
      h,
      x1: 100 + Math.cos(a) * R0,
      y1: 100 + Math.sin(a) * R0,
      x2: 100 + Math.cos(a) * (R0 + len),
      y2: 100 + Math.sin(a) * (R0 + len),
      w: 2 + 1.4 * g,
      o: 0.6 + 0.4 * g,
    };
  });
  /* the pointer dot sits just outside the swell, on the spring */
  const pa = ((swell - 90) * Math.PI) / 180;
  const name = hueName(hue);

  return (
    <div
      ref={ref}
      data-slot="hue-ring"
      data-disabled={disabled || undefined}
      className={cn("inline-flex font-sans text-ink select-none", disabled && "opacity-50 pointer-events-none", className)}
      style={{ ...style, ["--hue-size" as string]: `${size}px`, ["--hue-color" as string]: color(hue) } as CSSProperties}
      {...rest}
    >
      <div
        ref={dial}
        data-slot="hue-ring-wheel"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel ?? "Hue"}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={hue}
        aria-valuetext={`${name}, ${hue}°`}
        aria-disabled={disabled || undefined}
        className={cn(
          "relative size-(--hue-size) rounded-full cursor-pointer touch-none outline-none",
          "[&:focus-visible:not([data-pointer])]:shadow-[0_0_0_2px_var(--rap-ring)]",
        )}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <svg data-slot="hue-ring-ticks" viewBox="0 0 200 200" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          {lines.map((t) => (
            <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={color(t.h)} strokeOpacity={t.o} strokeWidth={t.w} strokeLinecap="round" />
          ))}
          <circle data-slot="hue-ring-pointer" cx={100 + Math.cos(pa) * (R0 + 27)} cy={100 + Math.sin(pa) * (R0 + 27)} r={2.6} className="fill-ink" />
        </svg>
        <span data-slot="hue-ring-center" className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none" aria-hidden="true">
          {/* the swatch pill: the chosen colour as a thing you could pick up */}
          <span
            data-slot="hue-ring-swatch"
            className="w-[calc(var(--hue-size)*0.34)] h-[calc(var(--hue-size)*0.19)] rounded-pill bg-(--hue-color) transition-[background-color] duration-100"
          />
          <span className="flex flex-col items-center leading-none">
            <span className="text-[length:calc(var(--hue-size)*0.12)] font-medium tracking-[-0.04em] tabular-nums">
              <RollingNumber text={`${hue}°`} />
            </span>
            <span className="mt-1.5 text-[0.8125rem] font-medium tracking-[-0.01em] text-mute">{name}</span>
          </span>
        </span>
      </div>
    </div>
  );
});
