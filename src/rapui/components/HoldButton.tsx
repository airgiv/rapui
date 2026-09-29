import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import { useSound } from "../sound";
import { clamp, cn } from "../utils";
import { isCalm } from "./ScrubNumber";

/* ══ Hold button ══════════════════════════════════════════
   Press and hold to confirm. While you hold, the pill fills
   with liquid from the left; let go early and it drains back;
   hold to the end and it splats, confirms and ticks itself.

   ── ONE MOTOR, THREE READINGS ───────────────────────────
   One level L (0..100, the percent of the pill that is full)
   and one slosh S (0 at rest) run in a single rAF loop. The
   fill's width, the lean of its surface and the wobble of its
   edge are readings of those two numbers, never separate
   animations that could drift apart — the Checklist's rule.

   ── WHY THE FILL IS LINEAR BUT THE DRAIN IS A SPRING ─────
   While held, L follows the clock exactly (holdMs to 100):
   the fill is the progress bar, and an eased progress bar
   lies about how long is left. Let go and L is handed to a
   spring softer than the library's (stiffness 0.045, decay
   0.78, against Bencho's 0.16/0.72 at tune 50): at the usual
   stiffness a half-full pill empties in about 150ms, which
   reads as a light switching off. This one takes ~200ms from
   half and ~330ms from full, with a slow start — liquid has
   weight and has to turn round first. It starts from the
   level with the fill's own velocity, so a release mid-hold
   visibly carries on for a hair before it turns back.

   ── THE WAVE ────────────────────────────────────────────
   The leading edge is a sine standing up the pill's height:
     x(y) = X + A·sin(2π·0.9·y/H + φ) + lean·(y/H − ½)·H
   0.9 of a wavelength per height, so there is always one crest
   and one trough on the edge and it never reads as a straight
   line with a bump. φ advances 2π every 700ms: slow enough to
   read as liquid, fast enough not to look frozen at 1200ms.
   A is 35% of its ceiling at rest-while-filling and grows with
   |S|; the ceiling is 12% of the height (≈10px at hero), enough
   to be seen, small enough that the edge is still a line.
   The lean is the level's velocity: moving right, the bottom
   runs ahead of the top, like liquid in a pan you just pushed.

   Done is the full pill: it stays the liquid's colour (no
   switch to success green — a red pill blending into a green
   one passes through mud), carries the drawn check and drains
   out on the same spring when it resets.

   The edge travels from −ceiling to W + ceiling, so at L = 0
   not even a crest peeks in and at L = 100 no trough leaves a
   gap. The liquid is a copy of the label in the fill colour,
   clipped by the same path — so the words change colour
   exactly where the liquid reaches them.

   ── SOUND ───────────────────────────────────────────────
   A detent every 10%, pitch rising from 0.7× to 1.6× so the
   ear hears the glass filling; "drop" when an early release
   drains more than 5%; "success" at the top.

   Calm / reduced motion: the fill still tracks the hold (it is
   the information), but the edge is straight, there is no
   splat and a release empties it at once. */

/* the drain's spring (see above), and Bencho's at tune 70 for
   the slosh and the splat — livelier, two rebounds, jelly */
const DRAIN = { k: 0.045, d: 0.78 };
const JELLY = { k: 0.192, d: 0.76 };
/* wave: height ceiling of the amplitude, its resting share,
   wavelengths per height, and the period of the wobble (ms) */
const AMP = 0.12;
const AMP_REST = 0.35;
const WAVES = 0.9;
const PERIOD = 700;
/* detents: one per 10% of the fill */
const NOTCHES = 10;
/* the splat kick: S jumps by this many units a frame; at tune 70
   it peaks near 1, i.e. scale 1.05 × 0.92 (a gentler rap-splat:
   5% of a 360px pill is already 18px) */
const SPLAT = 0.7;

const holdVariants = cva(
  [
    "group/hold relative isolate inline-flex items-stretch overflow-hidden rounded-pill cursor-pointer select-none touch-none",
    "h-(--hb-h) min-w-(--hb-min) bg-(--hb-bg) text-(--hb-fg)",
    "font-sans text-(length:--hb-fs) font-medium tracking-[-0.01em] whitespace-nowrap",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring",
    "disabled:opacity-40 disabled:pointer-events-none",
    "transition-[background-color,color] duration-(--rap-dur) ease-soft",
    "[-webkit-tap-highlight-color:transparent]",
  ],
  {
    variants: {
      /* bg/fg at rest, and the liquid with the words it carries —
         the same pairs as Button's hover blob */
      variant: {
        accent: "[--hb-bg:var(--rap-accent)] [--hb-fg:var(--rap-accent-ink)] [--hb-fill:var(--rap-ink)] [--hb-fill-fg:var(--rap-paper)]",
        blue: "[--hb-bg:var(--rap-blue)] [--hb-fg:#fff] [--hb-fill:var(--rap-ink)] [--hb-fill-fg:var(--rap-paper)]",
        ink: "[--hb-bg:var(--rap-ink)] [--hb-fg:var(--rap-paper)] [--hb-fill:var(--rap-accent)] [--hb-fill-fg:var(--rap-accent-ink)]",
        danger: "[--hb-bg:var(--rap-paper-3)] [--hb-fg:var(--rap-danger)] [--hb-fill:var(--rap-danger)] [--hb-fill-fg:#fff]",
      },
      /* md/lg are Button's md/lg (52/68px); hero is 88px with the
         label flush left like Readymag's login pill, and a 22rem
         minimum so the fill has a runway worth watching */
      size: {
        md: "[--hb-h:3.25rem] [--hb-px:1.6rem] [--hb-fs:1rem] [--hb-min:0px]",
        lg: "[--hb-h:4.25rem] [--hb-px:2.2rem] [--hb-fs:1.25rem] [--hb-min:0px]",
        hero: "[--hb-h:5.5rem] [--hb-px:2rem] [--hb-fs:1.25rem] [--hb-min:22rem]",
      },
    },
    defaultVariants: { variant: "accent", size: "md" },
  },
);

export type HoldButtonVariant = "accent" | "blue" | "ink" | "danger";
export type HoldButtonSize = "md" | "lg" | "hero";

export interface HoldButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** How long the hold takes, ms. */
  holdMs?: number;
  /** Fired once the pill is full. */
  onConfirm?: () => void;
  /** Label shown (with a drawn check) after confirming. */
  doneLabel?: ReactNode;
  /** Back to idle after this many ms; `false` stays done. */
  resetAfter?: number | false;
  variant?: HoldButtonVariant;
  size?: HoldButtonSize;
  children?: ReactNode;
}

/* a check that draws itself (dash offset) when the pill is done */
function DrawnCheck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[1.1em] flex-none -ml-[0.15em]" fill="none">
      <path
        d="M5.6 12.6l4.1 4.1 8.7-9.1"
        pathLength={1}
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "[stroke-dasharray:1] [stroke-dashoffset:1] group-data-[state=done]/hold:[stroke-dashoffset:0]",
          /* drawn over 550ms, starting 120ms in so it lands after the splat's peak */
          "transition-[stroke-dashoffset] duration-(--rap-dur) ease-soft group-data-[state=done]/hold:delay-120",
        )}
      />
    </svg>
  );
}

type Motor = { L: number; vL: number; S: number; vS: number; phase: number; held: boolean; t0: number; raf: number; notch: number; drain: boolean };

/** Press and hold to confirm: liquid fills the pill; release early and it drains back. */
export const HoldButton = forwardRef<HTMLButtonElement, HoldButtonProps>(function HoldButton(
  {
    holdMs = 1200,
    onConfirm,
    doneLabel = "Done",
    resetAfter = 2400,
    variant = "accent",
    size = "md",
    disabled,
    className,
    children,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerMove,
    onKeyDown,
    onKeyUp,
    onBlur,
    ...rest
  },
  forwarded,
) {
  const ref = useRef<HTMLButtonElement>(null);
  useImperativeHandle(forwarded, () => ref.current as HTMLButtonElement);
  const sound = useSound();
  const hintId = useId();
  const [state, setState] = useState<"idle" | "holding" | "done">("idle");
  const stateRef = useRef(state);
  stateRef.current = state;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const boxRef = useRef(box);
  const [frame, setFrame] = useState({ L: 0, S: 0, lean: 0, phase: 0, flat: false });
  const m = useRef<Motor>({ L: 0, vL: 0, S: 0, vS: 0, phase: 0, held: false, t0: 0, raf: 0, notch: 0, drain: false });
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;
  const holdRef = useRef(holdMs);
  holdRef.current = holdMs;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      boxRef.current = { w: el.offsetWidth, h: el.offsetHeight };
      setBox(boxRef.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const complete = useCallback(() => {
    const c = m.current;
    c.held = false;
    c.drain = false;
    c.L = 100;
    c.vL = 0;
    if (!isCalm(ref.current)) c.vS += SPLAT;
    setState("done");
    sound.play("success");
    confirmRef.current?.();
  }, [sound]);

  const run = useCallback(() => {
    const c = m.current;
    if (c.raf) return;
    let prev = 0;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      const calm = isCalm(ref.current);
      if (c.held) {
        const before = c.L;
        c.L = clamp(((performance.now() - c.t0) / holdRef.current) * 100, 0, 100);
        c.vL = (c.L - before) / dt;
        /* a notch each time the level crosses another tenth, pitch rising */
        const n = Math.floor(c.L / (100 / NOTCHES));
        if (n > c.notch && n < NOTCHES) sound.play("detent", { pitch: 0.7 + 0.9 * (c.L / 100), strength: 0.45 + 0.4 * (c.L / 100) });
        c.notch = n;
        if (c.L >= 100) complete();
      } else if (c.drain) {
        c.vL += (0 - c.L) * DRAIN.k * dt;
        c.vL *= Math.pow(DRAIN.d, dt);
        c.L += c.vL * dt;
      }
      c.vS += (0 - c.S) * JELLY.k * dt;
      c.vS *= Math.pow(JELLY.d, dt);
      c.S += c.vS * dt;
      c.phase = (c.phase + ((2 * Math.PI * 16.67) / PERIOD) * dt) % (2 * Math.PI);
      if (calm) {
        c.S = c.vS = 0;
        if (c.drain) c.L = c.vL = 0;
      }
      const settled =
        !c.held && Math.abs(c.S) < 0.002 && Math.abs(c.vS) < 0.002 && (c.drain ? Math.abs(c.L) < 0.02 && Math.abs(c.vL) < 0.02 : true);
      if (settled) {
        if (c.drain) c.L = c.vL = 0;
        c.S = c.vS = 0;
        c.drain = false;
        c.raf = 0;
        setFrame({ L: c.L, S: 0, lean: 0, phase: c.phase, flat: calm });
        return;
      }
      setFrame({ L: c.L, S: c.S, lean: calm ? 0 : clamp(c.vL * 0.06, -0.35, 0.35), phase: c.phase, flat: calm });
      c.raf = requestAnimationFrame(tick);
    };
    c.raf = requestAnimationFrame(tick);
  }, [complete, sound]);

  useEffect(() => () => cancelAnimationFrame(m.current.raf), []);

  /* reset after the done state has been on screen for resetAfter ms:
     the full pill drains out on the same spring */
  useEffect(() => {
    if (state !== "done" || resetAfter === false) return;
    const id = window.setTimeout(() => {
      m.current.drain = true;
      m.current.notch = 0;
      setState("idle");
      run();
    }, resetAfter);
    return () => window.clearTimeout(id);
  }, [state, resetAfter, run]);

  const start = () => {
    if (disabled || stateRef.current === "done") return;
    const c = m.current;
    if (c.held) return;
    c.held = true;
    c.drain = false;
    /* pick up from wherever the drain had got to */
    c.t0 = performance.now() - (c.L / 100) * holdMs;
    c.notch = Math.floor(c.L / (100 / NOTCHES));
    /* a small slosh on grabbing: the liquid is poured, not placed */
    if (!isCalm(ref.current)) c.vS += 0.08;
    setState("holding");
    sound.play("tap");
    run();
  };

  const release = () => {
    const c = m.current;
    if (!c.held) return;
    c.held = false;
    c.drain = true;
    if (c.L > 5) sound.play("drop", { strength: 0.4 + 0.6 * (c.L / 100) });
    /* the liquid sloshes as it turns round */
    if (!isCalm(ref.current)) c.vS -= 0.12;
    setState("idle");
    run();
  };

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e);
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a scripted pointer */
    }
    start();
  };
  const onUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    onPointerUp?.(e);
    release();
  };
  /* sliding off the pill is the way out: it counts as letting go */
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(e);
    if (!m.current.held) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) release();
  };
  const onKeyD = (e: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e);
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (!e.repeat) start();
  };
  const onKeyU = (e: KeyboardEvent<HTMLButtonElement>) => {
    onKeyUp?.(e);
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    release();
  };

  /* ── the drawing ───────────────────────────────────────── */
  const { w: W, h: H } = box;
  const { L, S, lean, phase, flat } = frame;
  const ceil = AMP * H;
  const X = -ceil + (clamp(L, 0, 100) / 100) * (W + 2 * ceil);
  const A = flat ? 0 : ceil * clamp(AMP_REST + Math.abs(S) * 0.9, 0, 1) * (state === "done" && Math.abs(S) < 0.002 ? 0 : 1);
  let clip = "none";
  if (W && H) {
    const pts: string[] = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps) * H;
      const x = X + A * Math.sin(2 * Math.PI * WAVES * (y / H) + phase) + lean * (y / H - 0.5) * H;
      pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    clip = `path("M-2 -2 L${pts[0]} L${pts.join(" L")} L-2 ${(H + 2).toFixed(2)} Z")`;
  }
  const hidden = L <= 0.01 && state !== "done";
  /* the splat: wider and shorter, area roughly kept */
  const splat = state === "done" ? S : 0;
  const scale = splat ? `${(1 + 0.05 * splat).toFixed(4)} ${(1 - 0.08 * splat).toFixed(4)}` : undefined;

  const content = (
    <span
      data-slot="hold-button-label"
      className={cn(
        "flex items-center gap-[0.45em] h-full px-(--hb-px) w-full",
        size === "hero" ? "justify-start" : "justify-center",
      )}
    >
      {state === "done" ? (
        <>
          <DrawnCheck />
          <span>{doneLabel}</span>
        </>
      ) : (
        <span>{children}</span>
      )}
    </span>
  );

  return (
    <button
      ref={ref}
      type="button"
      data-slot="hold-button"
      data-state={state}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      aria-describedby={hintId}
      className={cn(holdVariants({ variant, size }), className)}
      style={{ scale }}
      {...rest}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={(e) => {
        onPointerCancel?.(e);
        release();
      }}
      onPointerMove={onMove}
      onKeyDown={onKeyD}
      onKeyUp={onKeyU}
      onBlur={(e) => {
        onBlur?.(e);
        release();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {content}
      {/* the liquid: the same label in the fill colours, clipped by the wave */}
      <span
        aria-hidden
        data-slot="hold-button-liquid"
        className={cn(
          "absolute inset-0 flex bg-(--hb-fill) text-(--hb-fill-fg) pointer-events-none",
          hidden && "invisible",
        )}
        style={{ clipPath: clip }}
      >
        {content}
      </span>
      <span id={hintId} className="sr-only">
        Press and hold to confirm
      </span>
      <span role="status" className="sr-only">
        {state === "done" ? doneLabel : ""}
      </span>
    </button>
  );
});
