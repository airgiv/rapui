import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useSound } from "../sound";
import { useReplay } from "../hooks/useReplay";
import { clamp, cx, prefersReducedMotion } from "../utils";
import "./ScrubNumber.css";

/* ══ Scrub number ═════════════════════════════════════════
   A number in a pill with its name beside it. Press the NAME
   and drag sideways and the number runs with the hand, the way
   a design tool's inspector works; click the NUMBER and it is an
   ordinary field you type into.

   ── THE PILL LEANS, THE DIGITS ROLL ─────────────────────
   Two readings of one hand. The hand's speed tips the pill a few
   degrees toward where it is going — a skew, not a rotation, so
   the baseline stays level and the number stays readable — and
   the digits roll through a window that fades rather than clips
   (the TimeScrubber's digit, lifted into `RollingNumber` below so
   the Knob and the ElasticSlider read the same). The lean is a
   spring toward a target that is only ever the hand's current
   speed, so when the hand stops the pill rights itself on its own
   instead of freezing mid-lean.

   ── A WALL YOU CAN FEEL ─────────────────────────────────
   At min or max the running total is clamped, not the display,
   so reversing answers on the first pixel rather than after the
   hand has unwound everything it pushed past the wall. Arriving
   at the wall shakes the pill once ("no") and plays the firmest
   notch; pushing on does nothing further — one bump per arrival,
   not a buzz. */

/* ── shared by the scrubber family ────────────────────────
   Knob and ElasticSlider import these two from here rather than
   growing their own copies. Not part of the public barrel. */

/** Playful motion is off under prefers-reduced-motion or inside
 *  any `[data-rap-motion="calm"]` ancestor. Read at the moment of
 *  the gesture, not once, so the docs' Calm switch applies to a
 *  component that is already on the page. */
export const isCalm = (el: Element | null | undefined) =>
  prefersReducedMotion() || !!el?.closest('[data-rap-motion="calm"]');

/* ── a digit that rolls, through a window that fades ──────
   The TimeScrubber's digit, kept as it was there: a strip of
   0–9 slides to the digit inside a cell 1.5em tall for a 1em
   line, so at rest the neighbours sit wholly outside the window
   and on the move a digit leaves and arrives through the mask's
   fade, never an edge. It smears a little while it rolls — a
   short blur, restarted on every change by alternating two
   animation names, because re-applying the same one does not
   replay. */
function Digit({ d }: { d: string }) {
  const prev = useRef(d);
  const flip = useRef<boolean | null>(null);
  if (prev.current !== d) {
    prev.current = d;
    flip.current = !flip.current;
  }
  return (
    <span className="rap-rollnum__col">
      <span
        className="rap-rollnum__strip"
        data-flip={flip.current === null ? undefined : flip.current ? "a" : "b"}
        style={{ transform: `translateY(${-Number(d) * 1.5}em)` }}
      >
        {"0123456789".split("").map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  );
}

/** Text whose digits roll. Keyed from the RIGHT, so the units
 *  column stays the units column when "9" becomes "10" and only
 *  the new tens digit appears. Decorative: give the parent the
 *  accessible text. */
export function RollingNumber({ text, className }: { text: string; className?: string }) {
  const chars = text.split("");
  return (
    <span className={cx("rap-rollnum", className)} aria-hidden="true">
      {chars.map((c, i) =>
        c >= "0" && c <= "9" ? (
          <Digit key={chars.length - i} d={c} />
        ) : (
          <span key={`s${chars.length - i}`} className="rap-rollnum__sym">
            {c}
          </span>
        ),
      )}
    </span>
  );
}

const decimals = (n: number) => {
  const s = String(n);
  if (s.includes("e-")) return Number(s.split("e-")[1]);
  return (s.split(".")[1] ?? "").length;
};

/* px of sideways travel per step. 3 rather than a design tool's
   1: at 1px a step every pixel is too fine to aim at with a
   mouse and the notch sound is a continuous ratchet; at 3 you
   can land on a number without Alt and still cross a 0–100
   range in a comfortable 300px sweep. */
const PX_PER_STEP = 3;
/* the lean, in degrees of skew per px/frame of hand speed, and
   its ceiling. 0.5 / 7: a brisk 10px-a-frame scrub tips it 5°,
   a flick tops out at 7° — enough to read as pulled, not so much
   that the digits smear. */
const LEAN_PER_SPEED = 0.5;
const LEAN_MAX = 7;
/* Bencho's spring at tune 50 (see hooks/useSpring): stiffness
   0.16, 72% of velocity kept per frame, damping ratio ~0.41 —
   one friendly overshoot as the pill rights itself. */
const K = 0.16;
const D = 0.72;

export interface ScrubNumberProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Called once when a scrub ends or a typed value is committed. */
  onValueCommit?: (value: number) => void;
  /** The scrub handle: a short name or an icon ("W", "X", <Rotate/>). */
  label: ReactNode;
  min?: number;
  max?: number;
  step?: number;
  /** Shown after the number, e.g. "px", "%", "°". */
  unit?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** Accessible name when `label` is not plain text. */
  "aria-label"?: string;
}

/**
 * Inspector-style number: drag the label sideways to scrub (Shift ×10, Alt ×0.1),
 * click the number to type. Arrow keys step; Enter edits.
 */
export const ScrubNumber = forwardRef<HTMLDivElement, ScrubNumberProps>(function ScrubNumber(
  {
    value,
    defaultValue = 0,
    onValueChange,
    onValueCommit,
    label,
    min = -Infinity,
    max = Infinity,
    step = 1,
    unit,
    size = "md",
    disabled,
    className,
    style,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const current = controlled ? value : inner;
  const cur = useRef(current);
  cur.current = current;

  const sound = useSound();
  const bump = useReplay();
  const root = useRef<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [scrubbing, setScrubbing] = useState(false);
  const [lean, setLean] = useState(0);

  /* rounding: one more decimal than the step, so Alt's tenth-steps
     survive, and float noise (0.1 + 0.2) never reaches the screen */
  const fine = decimals(step) + 1;
  const tidy = (n: number) => Number(clamp(n, min, max).toFixed(fine));

  const commit = (n: number) => {
    const next = tidy(n);
    if (!controlled) setInner(next);
    if (next !== cur.current) onValueChange?.(next);
    cur.current = next;
    return next;
  };

  const shake = () => {
    bump.play();
    sound.detent(1);
  };

  /* ── the lean: a spring toward the hand's speed ─────────── */
  const motor = useRef({ x: 0, v: 0, speed: 0, raf: 0 });
  const run = useCallback(() => {
    const m = motor.current;
    if (m.raf) return;
    let prev = 0;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      /* the speed decays on its own, so a hand that stops holding
         still lets the pill stand back up: 0.8 a frame is about a
         tenth of a second to forget a flick */
      m.speed *= Math.pow(0.8, dt);
      const to = clamp(m.speed * LEAN_PER_SPEED, -LEAN_MAX, LEAN_MAX);
      m.v += (to - m.x) * K * dt;
      m.v *= Math.pow(D, dt);
      m.x += m.v * dt;
      if (Math.abs(m.x) < 0.02 && Math.abs(m.v) < 0.02 && Math.abs(m.speed) < 0.05) {
        m.x = 0;
        m.v = 0;
        m.speed = 0;
        m.raf = 0;
        setLean(0);
        return;
      }
      setLean(m.x);
      m.raf = requestAnimationFrame(tick);
    };
    m.raf = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => cancelAnimationFrame(motor.current.raf), []);

  /* ── the scrub ─────────────────────────────────────────── */
  const drag = useRef<null | { x: number; t: number; raw: number; wall: -1 | 0 | 1; calm: boolean; cursor: string }>(null);

  const onDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (disabled || editing || e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a scripted pointer */
    }
    const html = document.documentElement;
    drag.current = {
      x: e.clientX,
      t: performance.now(),
      raw: cur.current,
      wall: 0,
      calm: isCalm(root.current),
      cursor: html.style.cursor,
    };
    /* the whole page wears the resize cursor while scrubbing, so
       it does not flicker back to an arrow when the hand leaves
       the label — which it does within the first centimetre */
    html.style.cursor = "ew-resize";
    setScrubbing(true);
    root.current?.querySelector<HTMLElement>(".rap-scrub__value")?.focus({ preventScroll: true });
  };

  const onMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const g = drag.current;
    if (!g) return;
    const now = performance.now();
    const dx = e.clientX - g.x;
    const dt = Math.max(1, now - g.t) / 16.67;
    g.x = e.clientX;
    g.t = now;
    if (!dx) return;
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    /* quantise to the FINE grid (a tenth-step under Alt), so Shift
       just runs faster and never jumps to round tens */
    const grain = e.altKey ? step / 10 : step;
    let raw = g.raw + (dx / PX_PER_STEP) * step * mult;
    let wall: -1 | 0 | 1 = 0;
    if (raw >= max) {
      raw = max;
      wall = 1;
    } else if (raw <= min) {
      raw = min;
      wall = -1;
    }
    g.raw = raw;
    const base = Number.isFinite(min) ? min : 0;
    const next = tidy(base + Math.round((raw - base) / grain) * grain);
    if (next !== cur.current) {
      commit(next);
      if (!wall) sound.detent(e.shiftKey ? 0.7 : 0.45);
    }
    if (wall && wall !== g.wall) shake();
    g.wall = wall;
    if (!g.calm) {
      motor.current.speed = motor.current.speed * 0.5 + (dx / dt) * 0.5;
      run();
    }
  };

  const onUp = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const g = drag.current;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* never captured */
    }
    if (!g) return;
    document.documentElement.style.cursor = g.cursor;
    setScrubbing(false);
    onValueCommit?.(cur.current);
  };

  useEffect(
    () => () => {
      if (drag.current) document.documentElement.style.cursor = drag.current.cursor;
    },
    [],
  );

  /* ── typing ────────────────────────────────────────────── */
  const input = useRef<HTMLInputElement>(null);
  const startEdit = (seed?: string) => {
    if (disabled) return;
    setText(seed ?? String(cur.current));
    setEditing(true);
  };
  useEffect(() => {
    if (!editing) return;
    const el = input.current;
    if (!el) return;
    el.focus();
    if (el.value.length > 1) el.select();
    else el.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  const finishEdit = (keep: boolean) => {
    setEditing(false);
    if (keep) {
      const n = parseFloat(text.replace(",", ".").replace(/[^\d.eE+-]/g, ""));
      if (!Number.isNaN(n)) {
        if (n > max || n < min) shake();
        /* committed first: `onValueCommit?.(commit(n))` would skip
           the commit whenever no callback is given */
        const next = commit(n);
        onValueCommit?.(next);
      }
    }
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(".rap-scrub__value")?.focus({ preventScroll: true }));
  };

  const nudge = (dir: 1 | -1, mult: number) => {
    const at = cur.current;
    if ((dir > 0 && at >= max) || (dir < 0 && at <= min)) {
      shake();
      return;
    }
    const next = commit(at + dir * step * mult);
    sound.detent(next === max || next === min ? 1 : 0.5);
    onValueCommit?.(next);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        e.preventDefault();
        nudge(1, mult);
        return;
      case "ArrowDown":
      case "ArrowLeft":
        e.preventDefault();
        nudge(-1, mult);
        return;
      case "PageUp":
        e.preventDefault();
        nudge(1, 10);
        return;
      case "PageDown":
        e.preventDefault();
        nudge(-1, 10);
        return;
      case "Home":
        if (Number.isFinite(min)) {
          e.preventDefault();
          commit(min);
          sound.detent(1);
        }
        return;
      case "End":
        if (Number.isFinite(max)) {
          e.preventDefault();
          commit(max);
          sound.detent(1);
        }
        return;
      case "Enter":
      case "F2":
        e.preventDefault();
        startEdit();
        return;
    }
    /* typing a digit or a minus starts an edit with that character */
    if (e.key.length === 1 && /[\d.,-]/.test(e.key) && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      startEdit(e.key);
    }
  };

  const shown = String(current);
  const name = ariaLabel ?? (typeof label === "string" ? label : undefined);

  return (
    <div
      ref={(n) => {
        root.current = n;
        if (typeof ref === "function") ref(n);
        else if (ref) ref.current = n;
      }}
      className={cx(
        "rap-scrub",
        `rap-scrub--${size}`,
        scrubbing && "is-scrubbing",
        editing && "is-editing",
        disabled && "is-disabled",
        bump.cls("rap-anim-shake"),
        className,
      )}
      style={{ ...style, transform: lean ? `skewX(${(-lean).toFixed(2)}deg)` : undefined }}
      /* the digits' blur animations bubble up here too; only the
         pill's own shake ending should clear it */
      onAnimationEnd={(e) => e.target === e.currentTarget && bump.done()}
      {...rest}
    >
      <span
        className="rap-scrub__label"
        aria-hidden="true"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {label}
      </span>
      {editing ? (
        <input
          ref={input}
          className="rap-scrub__input"
          inputMode="decimal"
          aria-label={name}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => finishEdit(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              finishEdit(true);
            } else if (e.key === "Escape") {
              e.preventDefault();
              finishEdit(false);
            }
          }}
        />
      ) : (
        <div
          className="rap-scrub__value"
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-label={name}
          aria-valuenow={current}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          aria-valuetext={unit ? `${shown} ${unit}` : shown}
          aria-disabled={disabled || undefined}
          onClick={() => startEdit()}
          onKeyDown={onKey}
        >
          <RollingNumber text={shown} />
          {unit && <span className="rap-scrub__unit">{unit}</span>}
        </div>
      )}
    </div>
  );
});
