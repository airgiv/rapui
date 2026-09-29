/* ══ Rating ═══════════════════════════════════════════════
   A row of big soft stars. Hover previews the score (the stars you
   would add fill faintly, the ones you would take away fade), the
   star under the pointer leans up on a spring.

   DELIGHT — THE STARS STAMP IN ONE BY ONE.

   Raising the score pops every newly lit star in turn, left to
   right, 55ms apart: a squash, a jump past full size with a small
   alternating twist, and down — like a row of rubber stamps. The
   star you clicked also throws six sparks. Reach the top score and
   the whole row goes BOOM: every star jumps big in a wave from the
   left and bursts into its own ring of sparks and streaks. Lowering it drops the
   stars that go out: they sink and shrink back into the grey.
   Clicking the current score again clears it (allowClear).

   DRAG TO RATE. Press any star and slide: the score follows the
   finger star by star — slide right and they stamp on one after
   another, slide back and they drop out, past the first star's left
   edge and it clears. The row takes horizontal drags only
   (touch-action: pan-y), so a vertical swipe still scrolls the page.

   A radiogroup underneath: one tab stop, arrows move the score,
   Home clears, End fills. Colour is currentColor — set it with a
   text-* class. Reduced motion / data-rap-motion="calm": no stamps,
   no sparks. Sound: a pop that climbs with the score, a drop on
   the way down. */
import { forwardRef, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
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

/** A star's last animation: `k` restarts it, `delay` staggers a run of stars. */
interface StarAnim {
  k: number;
  kind: "pop" | "drop" | "cheer";
  delay: number;
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
  // per star, so a fast drag never cuts the stamp of the star before
  const [anims, setAnims] = useState<Record<number, StarAnim>>({});
  const [spark, setSpark] = useState<{ k: number; at: number; delay: number } | null>(null);
  const [cheer, setCheer] = useState<number | null>(null);
  const seq = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;
  const drag = useRef<{ id: number; x: number; moved: boolean; downOn: number; startValue: number } | null>(null);
  const root = useRef<HTMLDivElement | null>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const sound = useSound();
  const live = !readOnly && !disabled;
  const rs = typeof size === "number" ? `${size}px` : size;

  /* full marks: every star jumps in a wave, 70ms apart, and bursts */
  const CHEER_GAP = 70;
  const celebrate = () => {
    if (isMotionCalm(root.current)) return;
    setAnims(() => {
      const out: Record<number, StarAnim> = {};
      for (let n = 1; n <= max; n++) out[n] = { k: ++seq.current, kind: "cheer", delay: (n - 1) * CHEER_GAP };
      return out;
    });
    setSpark(null);
    setCheer(++seq.current);
    sound.play("success", { strength: 0.7 });
  };

  const set = (next: number, { sparks = true } = {}) => {
    next = Math.max(0, Math.min(max, next));
    const prev = valueRef.current;
    if (next === prev) return;
    valueRef.current = next;
    if (!isMotionCalm(root.current)) {
      const up = next > prev;
      setAnims((a) => {
        const out = { ...a };
        const lo = Math.min(prev, next);
        const hi = Math.max(prev, next);
        for (let n = lo + 1; n <= hi; n++)
          out[n] = { k: ++seq.current, kind: up ? "pop" : "drop", delay: up ? (n - prev - 1) * 55 : (prev - n) * 40 };
        return out;
      });
      if (up && sparks && next !== max) setSpark({ k: ++seq.current, at: next, delay: (next - prev - 1) * 55 + 80 });
      if (next !== max) setCheer(null);
    }
    if (next > prev && next === max && sparks) celebrate();
    else if (next > prev) sound.play("pop", { strength: 0.5, pitch: 0.85 + next * 0.08 });
    else sound.play("drop", { strength: 0.4 });
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  /* the score under a pointer x: every star whose left fifth the pointer has
     passed counts, so the first star lights as soon as you touch it and sliding
     off its left edge clears */
  const scoreAt = (x: number) => {
    let n = 0;
    btns.current.forEach((b, i) => {
      if (!b) return;
      const r = b.getBoundingClientRect();
      if (x >= r.left + r.width * 0.2) n = i + 1;
    });
    return n;
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!live || e.button !== 0) return;
    const n = Math.max(1, scoreAt(e.clientX));
    drag.current = { id: e.pointerId, x: e.clientX, moved: false, downOn: n, startValue: valueRef.current };
    e.currentTarget.setPointerCapture(e.pointerId);
    // pressing the current score waits: a click clears it, a drag keeps going
    if (n !== valueRef.current) set(n);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (Math.abs(e.clientX - d.x) > 4) d.moved = true;
    if (!d.moved) return;
    setHover(null);
    set(scoreAt(e.clientX), { sparks: false });
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved && allowClear && d.downOn === d.startValue) set(0);
    else if (d.moved && valueRef.current === max && d.startValue < max) celebrate();
    else if (d.moved && valueRef.current > d.startValue && !isMotionCalm(root.current))
      // a drag that raised the score ends with the sparks on the last star
      setSpark({ k: ++seq.current, at: valueRef.current, delay: 0 });
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
      className={cn("rap-rating inline-flex items-center text-ink touch-pan-y select-none", disabled && "opacity-45", className)}
      style={{ ["--rs" as string]: rs, gap: "calc(var(--rs) * 0.04)", ...style }}
      onKeyDown={onKey}
      onPointerLeave={() => setHover(null)}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => (drag.current = null)}
      {...rest}
    >
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const on = n <= value;
        // hover preview: stars you would add fill faintly, stars you would drop fade
        const faint = hover !== null && ((n <= hover && !on) || (on && n > hover));
        const lit = on || (hover !== null && n <= hover);
        const a = anims[n];
        const anim: CSSProperties = !a
          ? {}
          : a.kind === "pop"
            ? { animation: `rap-rating-pop 520ms var(--rap-ease-out) ${a.delay}ms both`, ["--tw" as string]: n % 2 ? "-9deg" : "9deg" }
            : a.kind === "cheer"
              ? { animation: `rap-rating-cheer 760ms var(--rap-ease-out) ${a.delay}ms both`, ["--tw" as string]: n % 2 ? "-14deg" : "14deg" }
              : { animation: `rap-rating-drop 360ms var(--rap-ease-out) ${a.delay}ms both` };
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
            onPointerEnter={() => live && !drag.current && setHover(n)}
            // pointers are handled on the row (press, drag, release); this is Enter / Space
            onClick={(e) => live && e.detail === 0 && set(allowClear && n === value ? 0 : n)}
          >
            <span
              key={a ? a.k : "rest"}
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
            {spark && spark.at === n && (
              <span key={`s${spark.k}`} aria-hidden className="pointer-events-none absolute inset-0">
                {Array.from({ length: 6 }, (_, k) => (
                  <span
                    key={k}
                    className="rap-rating-spark absolute left-1/2 top-1/2 rounded-full bg-current"
                    style={{ width: "calc(var(--rs) * 0.12)", height: "calc(var(--rs) * 0.12)", ["--a" as string]: `${k * 60 + 30}deg`, ["--r" as string]: "calc(var(--rs) * 0.85)", animationDelay: `${spark.delay}ms` }}
                  />
                ))}
              </span>
            )}
            {cheer !== null && value === max && (
              /* the burst: ten per star, a dot and a streak in turn, on two radii,
                 each star's ring turned a little so the row never looks stamped */
              <span key={`c${cheer}`} aria-hidden className="pointer-events-none absolute inset-0">
                {Array.from({ length: 10 }, (_, k) => {
                  const streak = k % 2 === 1;
                  return (
                    <span
                      key={k}
                      className="rap-rating-burst absolute left-1/2 top-1/2 rounded-full bg-current"
                      style={{
                        width: streak ? "calc(var(--rs) * 0.07)" : "calc(var(--rs) * 0.15)",
                        height: streak ? "calc(var(--rs) * 0.26)" : "calc(var(--rs) * 0.15)",
                        ["--a" as string]: `${k * 36 + n * 17}deg`,
                        ["--r" as string]: streak ? "calc(var(--rs) * 1.05)" : "calc(var(--rs) * 1.35)",
                        animationDelay: `${(n - 1) * CHEER_GAP + 140}ms`,
                      }}
                    />
                  );
                })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
