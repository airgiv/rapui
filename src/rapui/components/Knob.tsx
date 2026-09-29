import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useSound } from "../sound";
import { clamp, cx } from "../utils";
import { RollingNumber, isCalm } from "./ScrubNumber";
import "./Knob.css";

/* ══ Knob ═════════════════════════════════════════════════
   A rotary dial off a synth or an amp. Drag up (or right) to
   turn it up, down (or left) to turn it down; the ring of ticks
   lights up to the value and the number in the middle rolls.

   ── A DETENT YOU FEEL WITH A MOUSE ──────────────────────
   A real stepped pot has a notch per step: the shaft drops into
   it, and you have to push a little before it lets go and
   hurries on to the next. A mouse cannot push back, but the
   DIAL can refuse to move: the hand's travel is mapped through a
   staircase with sloped risers, so for the middle of every step
   the dial sits dead still on the notch (the magnet), and across
   the edge between two steps it moves faster than the hand to
   catch up. Nothing is animated to make this happen — it is the
   mapping from hand to angle, so it is exactly as quick as the
   hand and cannot lag.

     t   the hand, in steps          n = round(t), f = t − n
     |f| ≤ MAGNET       → n                    (resting in the notch)
     |f| >  MAGNET      → n ± (|f| − M)/(1 − 2M) · ½   (the riser)

   At |f| = ½ both sides give n ± ½, so the staircase is
   continuous — there is never a jump, only a hold and a hurry.

   ── ONE SPRING, CLAMPED WHERE IT MEETS THE STOP ─────────
   Let go between notches, or step with the keys, and one spring
   carries the dial to the notch (Bencho's, tune 50 — a single
   small overshoot, the "clunk" of falling into the detent). Like
   the Checklist, the spring is read two ways: the notch it
   settles in comes from the raw value, but the ANGLE and the lit
   ticks read it clamped to the range — a knob that swings past
   its own end stop is a glitch, not a bounce. So a jump to max
   lands hard against the stop and holds there for the frames
   the overshoot would have spent past it. */

/* the dial's sweep, degrees: 270 with the gap at the bottom,
   the travel of nearly every pot on nearly every amp */
const SWEEP = 270;
/* px of drag from min to max. 200 is a comfortable wrist
   movement on a trackpad and still lets a 0–100 knob give 2px
   a step — fine enough to aim, coarse enough to feel. */
const TRAVEL = 200;
/* half-width of the notch, as a share of one step (0 … 0.5).
   0.22 means the dial holds still for 44% of the hand's travel
   across each step and hurries through the other 56% at 2.3×
   the hand's speed. Wider and the knob feels sticky; narrower
   and the hold is too short to notice. */
const MAGNET = 0.22;
/* Bencho's spring at tune 50: stiffness 0.16, 72% of velocity
   kept a frame, damping ratio ~0.41 (see hooks/useSpring). Run
   in per-mille of the range so the 0.02 settle threshold means
   the same thing on a 0–1 knob and a 0–10,000 one. */
const K = 0.16;
const D = 0.72;
/* more than this many steps and the ring draws 40 evenly spaced
   ticks instead of one per step — past about forty they merge
   into a solid arc at the md size */
const MAX_TICKS = 40;

const SIZES = { sm: 64, md: 88, lg: 120 } as const;

const magnet = (t: number) => {
  const n = Math.round(t);
  const f = t - n;
  const a = Math.abs(f);
  if (a <= MAGNET) return n;
  return n + Math.sign(f) * ((a - MAGNET) / (1 - 2 * MAGNET)) * 0.5;
};

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

export interface KnobProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Called once a drag ends, or after each key press. */
  onValueCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: "sm" | "md" | "lg";
  /** Caption under the dial; also the accessible name. */
  label?: string;
  /** Where the lit arc starts. Defaults to 0 when the range spans it
   *  (a bipolar EQ or pan knob lights outward from the centre), else `min`. */
  origin?: number;
  /** How the value reads in the middle and to screen readers, e.g. v => `${v} dB`. */
  format?: (value: number) => string;
  disabled?: boolean;
}

/** Rotary dial with magnetic detents, a lit tick ring and a rolling readout. */
export const Knob = forwardRef<HTMLDivElement, KnobProps>(function Knob(
  {
    value,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    step = 1,
    size = "md",
    label,
    origin,
    format,
    disabled,
    className,
    style,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const span = Math.max(max - min, Number.EPSILON);
  const steps = Math.max(1, Math.round(span / step));
  const places = decimals(step);
  const snap = (v: number) => Number(clamp(min + Math.round((v - min) / step) * step, min, max).toFixed(places));

  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => snap(defaultValue ?? min));
  const current = controlled ? snap(value) : inner;
  const cur = useRef(current);

  const sound = useSound();
  const dial = useRef<HTMLDivElement>(null);

  /* per-mille of the range: what the spring and the drawing read */
  const toU = (v: number) => ((v - min) / span) * 1000;
  const [u, setU] = useState(() => toU(current));
  const m = useRef({ x: toU(current), v: 0, to: toU(current), raf: 0 });

  /* firmer at the ends: the stop is a harder click than a notch */
  const click = (edge: boolean) => sound.detent(edge ? 1 : 0.5);

  const commit = (next: number, audible = true) => {
    if (next === cur.current) return;
    if (audible) click(next === min || next === max);
    cur.current = next;
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  const run = useCallback(() => {
    const s = m.current;
    if (s.raf) return;
    let prev = 0;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      s.v += (s.to - s.x) * K * dt;
      s.v *= Math.pow(D, dt);
      s.x += s.v * dt;
      if (Math.abs(s.to - s.x) < 0.02 && Math.abs(s.v) < 0.02) {
        s.x = s.to;
        s.v = 0;
        s.raf = 0;
        setU(s.x);
        return;
      }
      setU(s.x);
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => cancelAnimationFrame(m.current.raf), []);

  const goTo = (v: number) => {
    const s = m.current;
    s.to = toU(v);
    if (isCalm(dial.current)) {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.x = s.to;
      s.v = 0;
      setU(s.x);
      return;
    }
    run();
  };

  /* ── the drag ──────────────────────────────────────────── */
  const drag = useRef<null | { x: number; y: number; t: number; notch: number }>(null);

  /* a value set from outside travels on the spring too */
  useEffect(() => {
    if (drag.current) return;
    cur.current = current;
    if (Math.abs(toU(current) - m.current.to) > 0.001) goTo(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, min, max]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    /* focused for the keys that may follow; marked as the hand's so
       the keyboard ring stays off until a key is pressed */
    e.currentTarget.dataset.pointer = "";
    e.currentTarget.focus({ preventScroll: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a scripted pointer */
    }
    const s = m.current;
    cancelAnimationFrame(s.raf);
    s.raf = 0;
    s.v = 0;
    /* the hand picks up from the value, not from wherever the
       spring happened to be mid-swing */
    const t = Math.round(((cur.current - min) / span) * steps);
    drag.current = { x: e.clientX, y: e.clientY, t, notch: t };
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g) return;
    /* up and right both turn it up, so it works however the hand
       naturally moves: a vertical pull on a desk, a sideways swipe
       on a trackpad */
    const d = e.clientX - g.x - (e.clientY - g.y);
    g.x = e.clientX;
    g.y = e.clientY;
    /* clamped here, so reversing past an end answers at once */
    g.t = clamp(g.t + (d / TRAVEL) * steps, 0, steps);
    const shown = isCalm(dial.current) ? Math.round(g.t) : magnet(g.t);
    const s = m.current;
    s.x = s.to = (shown / steps) * 1000;
    setU(s.x);
    /* the click belongs to the moment the dial DROPS INTO a notch
       — the end of the hurry — not to the moment the number
       changes halfway up the riser, so it is heard where it is
       seen to land */
    if (Number.isInteger(shown) && shown !== g.notch) {
      g.notch = shown;
      click(shown === 0 || shown === steps);
    }
    commit(snap(min + Math.round(g.t) * step), false);
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
    /* fling-free: it falls into the nearest notch and no further */
    goTo(cur.current);
    onValueCommit?.(cur.current);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    delete e.currentTarget.dataset.pointer;
    const big = Math.max(1, Math.round(steps / 10));
    const map: Record<string, number> = {
      ArrowUp: 1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
      PageUp: big,
      PageDown: -big,
    };
    let next: number | null = null;
    if (e.key in map) next = snap(cur.current + map[e.key] * step);
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    commit(next);
    goTo(next);
    onValueCommit?.(next);
  };

  /* ── the drawing ───────────────────────────────────────── */
  const shownU = clamp(u, 0, 1000);
  const angle = -SWEEP / 2 + (SWEEP * shownU) / 1000;
  const count = steps <= MAX_TICKS ? steps : MAX_TICKS;
  const o = toU(clamp(origin ?? (min < 0 && max > 0 ? 0 : min), min, max));
  const lo = Math.min(o, shownU);
  const hi = Math.max(o, shownU);
  const ticks = Array.from({ length: count + 1 }, (_, i) => {
    const f = i / count;
    const a = ((-SWEEP / 2 + SWEEP * f - 90) * Math.PI) / 180;
    /* the ends are longer: they are the stops */
    const r0 = i === 0 || i === count ? 40 : 43;
    return {
      i,
      x1: 50 + r0 * Math.cos(a),
      y1: 50 + r0 * Math.sin(a),
      x2: 50 + 48 * Math.cos(a),
      y2: 50 + 48 * Math.sin(a),
      /* lit between the origin and the value, with a hair of slack
         so the tick AT the value is lit when the spring settles a
         float's width short of it */
      on: f * 1000 >= lo - 0.5 && f * 1000 <= hi + 0.5,
    };
  });

  const text = format ? format(current) : current.toFixed(places);
  const px = SIZES[size];

  return (
    <div
      ref={ref}
      className={cx("rap-knob", `rap-knob--${size}`, disabled && "is-disabled", className)}
      style={{ ...style, ["--knob-size" as string]: `${px}px` }}
      {...rest}
    >
      <div
        ref={dial}
        className="rap-knob__dial"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel ?? label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={text}
        aria-orientation="vertical"
        aria-disabled={disabled || undefined}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <svg className="rap-knob__ring" viewBox="0 0 100 100" aria-hidden="true">
          {ticks.map((t) => (
            <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} data-on={t.on || undefined} />
          ))}
        </svg>
        <span className="rap-knob__well" aria-hidden="true" />
        <span className="rap-knob__cap" aria-hidden="true" style={{ transform: `rotate(${angle.toFixed(2)}deg)` }}>
          <span className="rap-knob__notch" />
        </span>
        <span className="rap-knob__value" aria-hidden="true">
          <RollingNumber text={text} />
        </span>
      </div>
      {label && <span className="rap-knob__label">{label}</span>}
    </div>
  );
});
