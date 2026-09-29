import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import { ArrowRight } from "../icons";
import { useSound } from "../sound";
import { clamp, cn } from "../utils";
import { isCalm } from "./ScrubNumber";

/* ══ Slide button ═════════════════════════════════════════
   Slide to confirm. A round thumb sits at the left end of the
   pill; drag it to the right end and the action happens. The
   label is in the thumb's way, and as the thumb covers it, it
   gives way: fading and stretching out ahead of the thumb as if
   the thumb were pushing it off the end.

   ── ONE RAW POSITION, READ THROUGH A RUBBER BAND ─────────
   The motor keeps one raw position r (px, 0 at the left stop,
   `max` at the right) and never clamps it. What is DRAWN is r
   inside [0, max] and, past either stop, the rubber band from
   ElasticSlider (iOS overscroll),
     s = C · (1 − 1 / (o·0.55/C + 1)),
   whose ceiling C is the thumb's inset from the pill's edge: the
   thumb can be pulled right up to the rim and never through it.
   Because the spring works on r too, its overshoot at the end of
   a snap or of the keyboard's scripted slide goes through the
   same band — one physics for the hand and for the spring.

   ── THE 90% RULE ────────────────────────────────────────
   Let go past 90% of the travel and it counts: the thumb springs
   the last 10% on its own and the pill turns success. Below, it
   springs home on Bencho's spring at tune 50 (stiffness 0.16,
   decay 0.72: one small overshoot that the band absorbs as a
   squeeze against the left rim). 90% and not 100% because a
   thumb dragged by a finger never quite lands on the stop, and
   asking it to is asking for a second try.

   ── SQUASH BY SPEED ─────────────────────────────────────
   As in ElasticSlider: the thumb stretches along its travel by
   0.02 per px/frame of speed, at most 30%, and narrows across by
   the square root so it never gains mass. Squeezed against a rim
   by the band, it flattens by up to 20%.

   ── SOUND ───────────────────────────────────────────────
   A detent every 10% of the travel (stronger as it goes), a firm
   one when the 90% line is crossed — "you can let go now" —
   "success" on confirm and "drop" when a real attempt (more than
   12px) springs back.

   Calm / reduced motion: no band, no squash, no stretch of the
   label (it only fades); release jumps to its stop. */

/* Bencho's spring at tune 50 for the snap home and to the end */
const K = 0.16;
const D = 0.72;
/* the line past which a release confirms, as a share of the travel */
const COMMIT = 0.9;
/* squash per px/frame of speed, and its ceiling */
const SQUASH = 0.02;
const SQUASH_MAX = 0.3;
/* a spring-home from further than this many px is audible */
const DROP_AT = 12;
/* the keyboard's scripted slide: an invisible hand drags the thumb
   across in 480ms on a sine ease — about the pace of an unhurried
   real slide, so it reads as the same gesture and not a teleport —
   then lets go with a 4px/frame nudge into the right rim, which the
   band and the spring turn into the same small landing a hand gets */
const SCRIPT_MS = 480;
const SCRIPT_KICK = 4;

const slideVariants = cva(
  [
    "group/slide relative isolate block overflow-hidden rounded-pill select-none touch-none",
    "h-(--sb-h) w-full max-w-(--sb-w) bg-(--sb-bg) text-(--sb-fg)",
    "font-sans text-(length:--sb-fs) font-medium tracking-[-0.01em] whitespace-nowrap",
    "transition-[background-color,color] duration-(--rap-dur) ease-soft",
    "data-[state=done]:bg-success data-[state=done]:text-white",
    "data-[disabled]:opacity-40 data-[disabled]:pointer-events-none",
    /* the thumb is 72% of the height, inset 14% — the same bubble
       proportions as Button's arrow bubble */
    "[--sb-d:calc(var(--sb-h)*0.72)] [--sb-in:calc(var(--sb-h)*0.14)]",
  ],
  {
    variants: {
      /* the thumb is the bubble of Button: fg on bg, bg on fg */
      variant: {
        accent: "[--sb-bg:var(--rap-accent)] [--sb-fg:var(--rap-accent-ink)]",
        blue: "[--sb-bg:var(--rap-blue)] [--sb-fg:#fff]",
        ink: "[--sb-bg:var(--rap-ink)] [--sb-fg:var(--rap-paper)]",
        danger: "[--sb-bg:var(--rap-danger)] [--sb-fg:#fff]",
      },
      /* width ceilings (the pill fills its column up to them):
         enough travel that the drag is a gesture, not a nudge —
         5× the height at md, 4.7× at lg, 5.5× at hero, where the
         label sits flush left like Readymag's */
      size: {
        md: "[--sb-h:3.25rem] [--sb-fs:1rem] [--sb-w:16rem]",
        lg: "[--sb-h:4.25rem] [--sb-fs:1.25rem] [--sb-w:20rem]",
        hero: "[--sb-h:5.5rem] [--sb-fs:1.25rem] [--sb-w:30rem]",
      },
    },
    defaultVariants: { variant: "accent", size: "md" },
  },
);

export type SlideButtonVariant = "accent" | "blue" | "ink" | "danger";
export type SlideButtonSize = "md" | "lg" | "hero";

export interface SlideButtonProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The instruction on the track, e.g. "Slide to publish". */
  label?: ReactNode;
  /** Fired when the thumb is released past 90% (or on Enter/Space). */
  onConfirm?: () => void;
  /** Shown after confirming. */
  doneLabel?: ReactNode;
  /** Back to the start after this many ms; `false` stays done. */
  resetAfter?: number | false;
  variant?: SlideButtonVariant;
  size?: SlideButtonSize;
  disabled?: boolean;
}

const rubber = (o: number, ceil: number) => (ceil <= 0 ? 0 : Math.sign(o) * ceil * (1 - 1 / ((Math.abs(o) * 0.55) / ceil + 1)));

/** Slide to confirm: drag the thumb to the end of the pill. */
export const SlideButton = forwardRef<HTMLDivElement, SlideButtonProps>(function SlideButton(
  { label = "Slide to confirm", onConfirm, doneLabel = "Done", resetAfter = 2400, variant = "accent", size = "md", disabled, className, ...rest },
  ref,
) {
  const sound = useSound();
  const hintId = useId();
  const root = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<"idle" | "dragging" | "done">("idle");
  const stateRef = useRef(state);
  stateRef.current = state;
  /* geometry, px: travel `max` and the thumb's inset `inset` */
  const geo = useRef({ max: 0, inset: 0 });
  const [, setGeoTick] = useState(0);
  const [f, setF] = useState({ r: 0, speed: 0 });
  const m = useRef({ r: 0, vr: 0, tr: 0, speed: 0, pr: 0, raf: 0, held: false, notch: 0, armed: false, script: null as null | { t0: number; from: number } });
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  const setRefs = (el: HTMLDivElement | null) => {
    root.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const h = el.offsetHeight;
      const inset = h * 0.14;
      const d = h * 0.72;
      geo.current = { inset, max: Math.max(0, el.offsetWidth - 2 * inset - d) };
      /* a resize while done keeps the thumb parked at the new end */
      if (stateRef.current === "done") m.current.r = m.current.tr = geo.current.max;
      setGeoTick((n) => n + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const paint = () => setF({ r: m.current.r, speed: m.current.speed });

  const run = useCallback(() => {
    const c = m.current;
    if (c.raf) return;
    let prev = 0;
    c.pr = c.r;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      if (c.script) {
        const k = clamp((t - c.script.t0) / SCRIPT_MS, 0, 1);
        const { max } = geo.current;
        c.r = c.script.from + (max - c.script.from) * (0.5 - 0.5 * Math.cos(Math.PI * k));
        if (k >= 1) {
          c.script = null;
          c.held = false;
          c.tr = max;
          c.vr = SCRIPT_KICK;
        }
      } else if (!c.held) {
        c.vr += (c.tr - c.r) * K * dt;
        c.vr *= Math.pow(D, dt);
        c.r += c.vr * dt;
      }
      c.speed = c.speed * 0.5 + ((c.r - c.pr) / dt) * 0.5;
      c.pr = c.r;
      if (!c.held && Math.abs(c.tr - c.r) < 0.02 && Math.abs(c.vr) < 0.02 && Math.abs(c.speed) < 0.05) {
        c.r = c.tr;
        c.vr = c.speed = 0;
        c.raf = 0;
        paint();
        return;
      }
      paint();
      c.raf = requestAnimationFrame(tick);
    };
    c.raf = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => cancelAnimationFrame(m.current.raf), []);

  const calm = () => isCalm(root.current);

  const settle = (to: number, kick = 0) => {
    const c = m.current;
    c.tr = to;
    c.vr += kick;
    if (calm()) {
      cancelAnimationFrame(c.raf);
      c.raf = 0;
      c.r = to;
      c.vr = c.speed = 0;
      paint();
      return;
    }
    run();
  };

  const confirm = () => {
    setState("done");
    sound.play("success");
    confirmRef.current?.();
  };

  /* after resetAfter ms the thumb springs home and the pill cools down */
  useEffect(() => {
    if (state !== "done" || resetAfter === false) return;
    const id = window.setTimeout(() => {
      m.current.notch = 0;
      m.current.armed = false;
      setState("idle");
      settle(0);
    }, resetAfter);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, resetAfter]);

  /* ── the drag ──────────────────────────────────────────── */
  const drag = useRef<null | { left: number; grab: number; k: number; calm: boolean }>(null);

  const follow = (clientX: number) => {
    const g = drag.current;
    if (!g) return;
    const c = m.current;
    const { max } = geo.current;
    c.r = c.tr = (clientX - g.left) / g.k - g.grab;
    c.vr = 0;
    const p = clamp(c.r / (max || 1), 0, 1);
    const n = Math.floor(p * 10);
    if (n > c.notch && n < 9) sound.detent(0.35 + 0.5 * p);
    c.notch = n;
    const armed = p >= COMMIT;
    if (armed && !c.armed) sound.detent(1);
    c.armed = armed;
    if (g.calm) paint();
  };

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled || stateRef.current === "done" || e.button !== 0 || !root.current) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a scripted pointer */
    }
    const box = root.current.getBoundingClientRect();
    const k = box.width / (root.current.offsetWidth || 1) || 1;
    const c = m.current;
    /* keep the thumb where it was taken: the hand's offset from its left edge */
    const grab = (e.clientX - box.left) / k - c.r;
    drag.current = { left: box.left, grab, k, calm: calm() };
    thumb.current?.focus({ preventScroll: true });
    if (thumb.current) thumb.current.dataset.pointer = "";
    c.held = true;
    setState("dragging");
    sound.play("tap");
    if (!drag.current.calm) run();
  };

  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => follow(e.clientX);

  const onUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const g = drag.current;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* never captured */
    }
    if (!g) return;
    const c = m.current;
    c.held = false;
    const { max } = geo.current;
    if (c.r >= COMMIT * max) {
      confirm();
      /* carry the hand's own speed into the last stretch */
      c.vr = c.speed;
      settle(max);
    } else {
      if (c.r > DROP_AT) sound.play("drop");
      c.vr = c.speed;
      c.notch = 0;
      c.armed = false;
      setState("idle");
      settle(0);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    delete e.currentTarget.dataset.pointer;
    if (disabled || stateRef.current !== "idle") return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (e.repeat) return;
    /* the scripted slide: the pill confirms now (the state change is
       immediate), the thumb is thrown and the spring lands it */
    confirm();
    const c = m.current;
    if (calm()) return settle(geo.current.max);
    c.held = true;
    c.script = { t0: performance.now(), from: c.r };
    run();
  };

  /* ── the drawing ───────────────────────────────────────── */
  const { max, inset } = geo.current;
  const { r, speed } = f;
  const quiet = drag.current?.calm ?? false;
  const over = r < 0 ? r : r > max ? r - max : 0;
  const x = clamp(r, 0, max) + (quiet ? 0 : rubber(over, inset));
  const p = max ? clamp(x / max, 0, 1) : 0;
  /* squeeze against a rim: up to 20% flatter at the band's ceiling */
  const squeeze = inset ? 1 - 0.2 * clamp(Math.abs(x - clamp(x, 0, max)) / inset, 0, 1) : 1;
  const long = quiet ? 1 : 1 + Math.min(SQUASH_MAX, Math.abs(speed) * SQUASH);
  const sx = long * squeeze;
  const sy = 1 / Math.sqrt(sx);
  const done = state === "done";
  /* the label gives way: gone by 60% of the travel (so it is never
     seen under the thumb), stretched out ahead of it by up to 35% —
     anchored at its left end, so the words run away to the right */
  const fade = clamp(1 - p / 0.6, 0, 1);
  const stretch = 1 + 0.35 * p;
  /* and it is hidden where the thumb has passed: the label box starts
     1.5 insets past the thumb's resting right edge, so its first
     x − 1.5·inset px (in its own, unscaled space) are covered */
  const covered = Math.max(0, x - 1.5 * inset) / (quiet || done ? 1 : stretch);

  return (
    <div
      ref={setRefs}
      data-slot="slide-button"
      data-state={state}
      data-variant={variant}
      data-size={size}
      data-disabled={disabled || undefined}
      /* landed: done AND the thumb has arrived — the done label and the
         check wait for it, so a scripted slide never runs over its own
         "Published" */
      data-landed={(done && p >= COMMIT) || undefined}
      className={cn(slideVariants({ variant, size }), className)}
      {...rest}
    >
      {/* the trail: the stretch of track the thumb has already covered */}
      <span
        aria-hidden
        data-slot="slide-button-trail"
        className="absolute left-(--sb-in) inset-y-(--sb-in) rounded-pill bg-current opacity-18 group-data-[state=done]/slide:opacity-0 transition-opacity duration-(--rap-dur-fast)"
        style={{ width: `calc(var(--sb-d) + ${Math.max(0, x).toFixed(2)}px)` }}
      />
      {/* the instruction: right of the thumb; flush left on hero like Readymag */}
      <span
        aria-hidden
        data-slot="slide-button-label"
        className={cn(
          "absolute inset-y-0 right-[calc(var(--sb-in)*2.5)] left-[calc(var(--sb-d)+var(--sb-in)*2.5)] flex items-center origin-left",
          size === "hero" ? "justify-start" : "justify-center",
          done && "invisible",
        )}
        style={{ opacity: fade, scale: quiet || done ? undefined : `${stretch.toFixed(3)} 1`, clipPath: covered ? `inset(0 0 0 ${covered.toFixed(2)}px)` : undefined }}
      >
        {label}
      </span>
      {/* the done label: where the thumb set off from */}
      <span
        aria-hidden
        data-slot="slide-button-done"
        className={cn(
          "absolute inset-y-0 left-[calc(var(--sb-in)*2.5)] right-[calc(var(--sb-d)+var(--sb-in)*2.5)] flex items-center",
          size === "hero" ? "justify-start" : "justify-center",
          "opacity-0 translate-y-[40%] transition-[opacity,translate] duration-(--rap-dur) ease-soft",
          "group-data-landed/slide:opacity-100 group-data-landed/slide:translate-y-0 group-data-landed/slide:delay-100",
        )}
      >
        {doneLabel}
      </span>
      <button
        ref={thumb}
        type="button"
        data-slot="slide-button-thumb"
        aria-label={typeof label === "string" ? label : "Slide to confirm"}
        aria-describedby={hintId}
        aria-disabled={disabled || done || undefined}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "group/thumb absolute left-(--sb-in) top-(--sb-in) size-(--sb-d) rounded-pill outline-none cursor-grab active:cursor-grabbing",
          "grid place-items-center",
        )}
        style={{ translate: `${x.toFixed(2)}px 0` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <span
          data-slot="slide-button-knob"
          className={cn(
            "absolute inset-0 rounded-pill bg-(--sb-fg) transition-colors duration-(--rap-dur) ease-soft",
            "group-data-[state=done]/slide:bg-white",
            "group-[:focus-visible:not([data-pointer])]/thumb:shadow-[0_0_0_3px_var(--rap-ring)]",
          )}
          style={{ scale: `${sx.toFixed(3)} ${sy.toFixed(3)}` }}
        />
        <span
          aria-hidden
          className={cn(
            "relative grid place-items-center text-(--sb-bg) text-[calc(var(--sb-fs)*1.15)] [&_svg]:size-[1em]",
            "group-data-[state=done]/slide:text-success transition-colors duration-(--rap-dur) ease-soft",
          )}
        >
          {/* the arrow turns to face down and shrinks away as the check draws */}
          <span
            className={cn(
              "grid place-items-center transition-[opacity,scale,rotate] duration-(--rap-dur-fast) ease-soft",
              "group-data-landed/slide:opacity-0 group-data-landed/slide:scale-50 group-data-landed/slide:rotate-90",
            )}
          >
            {/* a firmer stroke than the kit default: the thumb is a big round button and a 2px line in it read as a hairline */}
            <ArrowRight strokeWidth={2.75} />
          </span>
          <svg viewBox="0 0 24 24" fill="none" className="absolute size-[1.1em]">
            {/* the check draws itself 100ms after the thumb lands, over 550ms */}
            <path
              d="M5.6 12.6l4.1 4.1 8.7-9.1"
              pathLength={1}
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-(--rap-dur-fast) ease-soft",
                "group-data-landed/slide:[stroke-dashoffset:0] group-data-landed/slide:duration-(--rap-dur) group-data-landed/slide:delay-100",
              )}
            />
          </svg>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Drag to the right, or press Enter, to confirm
      </span>
      <span role="status" className="sr-only">
        {done ? doneLabel : ""}
      </span>
    </div>
  );
});
