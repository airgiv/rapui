import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { useSpring } from "../hooks/useSpring";
import { useSound } from "../sound";
import { cva } from "class-variance-authority";
import { cn, prefersReducedMotion } from "../utils";
import "./Progress.css";

/* ── Progress ──────────────────────────────────────────────
   Delight: the fill is a liquid with a soft blob for a head.

   ONE SPRING (0..100, tune 45: a single small overshoot) carries
   the fill, and the head is read off the same number. The lag —
   how far the spring still is from the value — is the blob's
   speed: while the fill runs, the head stretches forward into a
   nose up to 1.8× long and thins to 0.7× (volume kept, roughly),
   and when it arrives it rounds up again. It stretches from its
   back edge, so the nose leads; the overshoot on arrival pulls
   it back through round, which reads as the liquid sloshing.

   At 100 it SPLATS: when the fill actually reaches the end (not
   when the value is set — it has to hit the wall), the bar
   bulges 1.6× tall, squashes to 0.8× and settles, once per trip
   to 100. The value itself is announced immediately through
   Radix / aria; only the picture catches up.

   CircularProgress runs the ring on the same spring and gives
   the same splat at 100.

   Calm / reduced motion: no spring, no blob, no splat — the fill
   eases to each value with a plain transition, as before. With a
   SoundProvider on, reaching 100 plays "success". */

export type ProgressTone = "blue" | "flame" | "ink" | "success";

const TONE: Record<ProgressTone, string> = {
  blue: "[--pg-color:var(--rap-blue)]",
  flame: "[--pg-color:var(--rap-flame)]",
  ink: "[--pg-color:var(--rap-ink)]",
  success: "[--pg-color:var(--rap-success)]",
};

const progressVariants = cva(
  // Safari clips rounded overflow correctly only on its own layer (isolate)
  "relative w-full h-(--pg-h) overflow-hidden rounded-pill bg-fill-strong isolate",
  {
    variants: {
      size: { sm: "[--pg-h:4px]", md: "[--pg-h:8px]", lg: "[--pg-h:12px]" },
    },
    defaultVariants: { size: "md" },
  },
);

/** true under prefers-reduced-motion or inside data-rap-motion="calm" (kept live). */
function useCalm(ref: RefObject<Element | null>) {
  const [calm, setCalm] = useState(false);
  useLayoutEffect(() => {
    const check = () => setCalm(prefersReducedMotion() || !!ref.current?.closest('[data-rap-motion="calm"]'));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-rap-motion"], subtree: true });
    return () => mo.disconnect();
  }, [ref]);
  return calm;
}

/** Plays `splat` once each time `at` reaches 100 while the value is 100; `success` sound with it. */
function useSplat(pct: number | null, at: number) {
  const [splat, setSplat] = useState(0);
  const armed = useRef(true);
  const sound = useSound();
  useEffect(() => {
    if (pct == null || pct < 100) {
      armed.current = true;
      return;
    }
    if (armed.current && at >= 99.5) {
      armed.current = false;
      setSplat((n) => n + 1);
      sound.play("success");
    }
  }, [pct, at, sound]);
  return splat;
}

function setRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export interface ProgressProps extends ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  size?: "sm" | "md" | "lg";
  tone?: ProgressTone;
}

/** Pill progress bar (Radix Progress). Pass `value={null}` for an indeterminate sweep. */
export const Progress = forwardRef<ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(function Progress(
  { value, max = 100, size = "md", tone = "blue", className, style, ...rest },
  ref,
) {
  const node = useRef<HTMLDivElement | null>(null);
  const calm = useCalm(node);
  const pct = value == null ? null : Math.max(0, Math.min(100, (value / max) * 100));
  const at = useSpring(pct ?? 0, 45, calm || pct == null);
  const shown = calm ? (pct ?? 0) : Math.max(0, Math.min(101, at));
  const lag = (pct ?? 0) - at;
  // speed → stretch: 12 points of lag is full stretch
  const stretch = calm ? 0 : Math.min(1, Math.abs(lag) / 12);
  const splat = useSplat(pct, at);

  return (
    <ProgressPrimitive.Root
      ref={(el: HTMLDivElement | null) => {
        node.current = el;
        setRef(ref, el);
      }}
      value={value}
      max={max}
      data-slot="progress"
      data-size={size}
      className={cn(
        progressVariants({ size }),
        TONE[tone],
        // the head pokes out past the rounded end while the liquid runs
        !calm && pct != null && "overflow-visible",
        // the splat: the whole bar hits the wall and bulges. Two identical keyframes
        // (Progress.css), alternated, so each trip to 100 replays it
        splat > 0 &&
          (splat % 2
            ? "fun:animate-[rap-progress-splat-a_560ms_var(--rap-ease-out)]"
            : "fun:animate-[rap-progress-splat-b_560ms_var(--rap-ease-out)]"),
        className,
      )}
      style={
        {
          ...style,
          "--pg-at": `${Math.min(100, shown)}%`,
          "--pg-sx": 1 + stretch * 0.8,
          "--pg-sy": 1 - stretch * 0.3,
          "--pg-dir": lag < 0 ? -1 : 1,
        } as CSSProperties
      }
      {...rest}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-0 rounded-[inherit] bg-(--pg-color) transition-[width] duration-(--rap-dur) ease-soft",
          pct == null && "w-[40%] animate-[rap-progress-sweep_1.4s_var(--rap-ease-in-out)_infinite]",
          // the spring drives width every frame, so no CSS transition on top of it
          !calm && pct != null && "transition-none",
        )}
        style={pct == null ? undefined : { width: `${Math.min(100, shown)}%` }}
      />
      {pct != null && !calm && (
        <span
          data-slot="progress-head"
          className={cn(
            "absolute top-0 left-(--pg-at) size-(--pg-h) ml-[calc(var(--pg-h)*-1)] rounded-full bg-(--pg-color) pointer-events-none",
            // stretch from the back edge, so the nose leads in the direction of travel
            "origin-[calc(50%-var(--pg-dir)*50%)_50%] [scale:var(--pg-sx)_var(--pg-sy)]",
            "data-hidden:opacity-0",
          )}
          data-hidden={shown < 0.5 ? "" : undefined}
          aria-hidden
        />
      )}
    </ProgressPrimitive.Root>
  );
});

export interface CircularProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: number;
  max?: number;
  /** Diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  tone?: ProgressTone;
  /** What sits in the middle. Defaults to the percentage; pass `null` for nothing. */
  label?: ReactNode;
}

/** Ring progress with the value in the middle. */
export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(function CircularProgress(
  { value, max = 100, size = 88, thickness = 8, tone = "blue", label, className, style, ...rest },
  ref,
) {
  const node = useRef<HTMLDivElement | null>(null);
  const calm = useCalm(node);
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const at = useSpring(pct, 45, calm);
  const shown = calm ? pct : Math.max(0, Math.min(100, at));
  const splat = useSplat(pct, at);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      ref={(el) => {
        node.current = el;
        setRef(ref, el);
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      data-slot="circular-progress"
      className={cn("relative inline-grid place-items-center flex-none font-sans", TONE[tone], className)}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.22), ...style }}
      {...rest}
    >
      <svg
        key={splat}
        className={cn("absolute inset-0 -rotate-90", splat > 0 && "fun:animate-[rap-splat_520ms_var(--rap-ease-out)]")}
        width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className="fill-none stroke-fill-strong" cx={size / 2} cy={size / 2} r={r} strokeWidth={thickness} />
        <circle
          data-slot="circular-progress-indicator"
          className={cn(
            "fill-none stroke-(--pg-color) [stroke-linecap:round] transition-[stroke-dashoffset] duration-(--rap-dur) ease-soft",
            !calm && "transition-none",
          )}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={thickness}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          opacity={shown <= 0.2 ? 0 : 1}
        />
      </svg>
      {label !== null && <span data-slot="circular-progress-label" className="relative font-medium tracking-[-0.02em] text-ink tabular-nums">{label ?? `${Math.round(pct)}%`}</span>}
    </div>
  );
});
