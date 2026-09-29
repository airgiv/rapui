/* ══ Rating ═══════════════════════════════════════════════
   A row of big soft stars. Hover previews the score (the stars you
   would add fill faintly, the ones you would take away fade), the
   star under the pointer leans up on a spring.

   DELIGHT — THE STARS STAMP IN ONE BY ONE.

   Raising the score pops every newly lit star in turn, left to
   right, 55ms apart: a squash, a jump past full size with a small
   alternating twist, and down — like a row of rubber stamps. The
   star you clicked also throws six sparks. Lowering it drops the
   stars that go out: they sink and shrink back into the grey.
   Clicking the current score again clears it (allowClear).

   A radiogroup underneath: one tab stop, arrows move the score,
   Home clears, End fills. Colour is currentColor — set it with a
   text-* class. Reduced motion / data-rap-motion="calm": no stamps,
   no sparks. Sound: a pop that climbs with the score, a drop on
   the way down. */
import { forwardRef, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent } from "react";
import { useSound } from "../sound";
import { cn } from "../utils";
import { isMotionCalm } from "./FormField";
import "./Rating.css";

export interface RatingProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** How many stars. */
  max?: number;
  /** Star size: px, or any CSS length (e.g. a clamp() so the row follows its container). */
  size?: number | string;
  /** Clicking the current score sets it back to 0. */
  allowClear?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}

// a chubby star: the inner points sit far out (0.54 of the outer radius), and a
// thick round-joined stroke of the same colour softens every corner
const STAR = "M12 2.7L15.23 8.45L21.7 9.75L17.23 14.6L18 21.15L12 18.4L6 21.15L6.77 14.6L2.3 9.75L8.77 8.45Z";

interface Burst {
  id: number;
  from: number;
  to: number;
  at: number;
}

export const Rating = forwardRef<HTMLDivElement, RatingProps>(function Rating(
  {
    value: valueProp,
    defaultValue = 0,
    onValueChange,
    max = 5,
    size = 32,
    allowClear = true,
    readOnly,
    disabled,
    className,
    style,
    "aria-label": ariaLabel = "Rating",
    ...rest
  },
  ref,
) {
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [hover, setHover] = useState<number | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);
  const root = useRef<HTMLDivElement | null>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const sound = useSound();
  const live = !readOnly && !disabled;
  const rs = typeof size === "number" ? `${size}px` : size;

  const set = (next: number, at = next) => {
    next = Math.max(0, Math.min(max, next));
    if (next === value) return;
    if (!isMotionCalm(root.current)) setBurst((b) => ({ id: (b?.id ?? 0) + 1, from: value, to: next, at }));
    if (next > value) sound.play("pop", { strength: 0.5, pitch: 0.85 + next * 0.08 });
    else sound.play("drop", { strength: 0.4 });
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const onKey = (e: KeyboardEvent) => {
    if (!live) return;
    const map: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
    let next: number | null = null;
    if (e.key in map) next = value + map[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    next = Math.max(0, Math.min(max, next));
    set(next);
    btns.current[Math.max(0, next - 1)]?.focus();
  };

  return (
    <div
      ref={(el) => {
        root.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      aria-readonly={readOnly || undefined}
      data-slot="rating"
      className={cn("rap-rating inline-flex items-center text-ink", disabled && "opacity-45", className)}
      style={{ ["--rs" as string]: rs, gap: "calc(var(--rs) * 0.04)", ...style }}
      onKeyDown={onKey}
      onPointerLeave={() => setHover(null)}
      {...rest}
    >
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const on = n <= value;
        // hover preview: stars you would add fill faintly, stars you would drop fade
        const faint = hover !== null && ((n <= hover && !on) || (on && n > hover));
        const lit = on || (hover !== null && n <= hover);
        const b = burst;
        const popping = b && b.to > b.from && n > b.from && n <= b.to;
        const dropping = b && b.to < b.from && n > b.to && n <= b.from;
        const anim: CSSProperties = popping
          ? { animation: `rap-rating-pop 520ms var(--rap-ease-out) ${(n - b.from - 1) * 55}ms both`, ["--tw" as string]: n % 2 ? "-9deg" : "9deg" }
          : dropping
            ? { animation: `rap-rating-drop 360ms var(--rap-ease-out) ${(b.from - n) * 40}ms both` }
            : {};
        return (
          <button
            key={i}
            ref={(el) => {
              btns.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} of ${max}`}
            tabIndex={live ? (n === Math.max(1, value) ? 0 : -1) : -1}
            disabled={disabled}
            className={cn(
              "relative grid place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-current/40",
              live ? "cursor-pointer" : "cursor-default",
            )}
            style={{ width: "var(--rs)", height: "var(--rs)" }}
            onPointerEnter={() => live && setHover(n)}
            onClick={() => live && set(allowClear && n === value ? 0 : n, n)}
          >
            <span
              key={popping || dropping ? `${b!.id}` : "rest"}
              className="block size-full transition-transform duration-300 ease-spring"
              style={{ transform: hover === n && live ? "translateY(-8%) scale(1.12)" : undefined, ...anim }}
            >
              <svg viewBox="0 0 24 24" className="size-full overflow-visible" aria-hidden>
                <path
                  d={STAR}
                  strokeWidth={3.2}
                  strokeLinejoin="round"
                  className={cn(
                    "transition-[fill,stroke,opacity] duration-200",
                    lit ? "fill-current stroke-current" : "fill-ink/12 stroke-transparent",
                    faint && "opacity-35",
                  )}
                />
              </svg>
            </span>
            {b && b.to > b.from && b.at === n && (
              <span key={`s${b.id}`} aria-hidden className="pointer-events-none absolute inset-0">
                {Array.from({ length: 6 }, (_, k) => (
                  <span
                    key={k}
                    className="rap-rating-spark absolute left-1/2 top-1/2 rounded-full bg-current"
                    style={{ width: "calc(var(--rs) * 0.12)", height: "calc(var(--rs) * 0.12)", ["--a" as string]: `${k * 60 + 30}deg`, ["--r" as string]: "calc(var(--rs) * 0.85)", animationDelay: `${(n - b.from - 1) * 55 + 80}ms` }}
                  />
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
