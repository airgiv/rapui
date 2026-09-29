import {
  forwardRef,
  useCallback,
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
import { clamp, cx } from "../utils";
import { RollingNumber, isCalm } from "./ScrubNumber";
import "./ElasticSlider.css";

/* ══ Elastic slider ═══════════════════════════════════════
   A slider whose track is a rubber band. Inside the range it is
   an ordinary slider; drag PAST either end and the band
   stretches after the hand — less and less the further you pull
   — thinning as it goes, the thumb drawn out along the pull and
   the icon at that end shoved aside. Let go and the band snaps
   back on a spring, overshooting into a small recoil, with a
   "drop" as it lands.

   ── WHY THE STRETCH SLOWS DOWN ──────────────────────────
   The pull past the end is not the stretch. It goes through the
   rubber band iOS uses for overscroll,

     s = D · (1 − 1 / (o·c/D + 1)),   c = 0.55,

   which gives 55% of the hand at first and less every pixel
   after, closing on D and never reaching it. Linear resistance
   reads as a slower slider; this reads as a material.

   ── ONE MOTOR, TWO SPRINGS, ONE CONSTANT ────────────────
   The thumb's position and the band's stretch each settle on
   Bencho's spring at tune 50 (stiffness 0.16, decay 0.72, damping
   ratio ~0.41 — one visible overshoot and done). The stretch's
   overshoot is the RECOIL: the band snaps back past rest by a
   quarter of its stretch, the track briefly shorter than itself,
   and settles. Both run in pixels, so 0.02 is "there".

   ── SQUASH BY SPEED ─────────────────────────────────────
   The thumb is read off the same motor a third time: its speed
   (px a frame, smoothed over two frames) stretches it along the
   direction of travel and narrows it across, keeping its area,
   so a fast drag smears it into a lozenge and a slow one leaves
   it round. */

/* the stretch's ceiling, px: how far the band will ever give */
const STRETCH = 40;
/* Bencho's spring at tune 50, as in hooks/useSpring */
const K = 0.16;
const D = 0.72;
/* squash per px/frame of thumb speed, and its ceiling: at 12
   px/frame (a brisk drag) the thumb is 24% longer than tall */
const SQUASH = 0.02;
const SQUASH_MAX = 0.3;
/* a snap-back from more than this many px drops audibly */
const DROP_AT = 6;
/* a key press against the stop kicks the band this hard (px a
   frame): a 3–4px give and a recoil — "that's the end" */
const KICK = 3;

const rubber = (o: number) => Math.sign(o) * STRETCH * (1 - 1 / ((Math.abs(o) * 0.55) / STRETCH + 1));
const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

export interface ElasticSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Called when a drag ends or after a key press. */
  onValueCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Icons at the low and high ends; each bumps when the band is pulled past it. */
  icons?: [ReactNode, ReactNode];
  /** The value bubble on the thumb: always, only while held/focused, or never. */
  bubble?: "always" | "active" | "never";
  format?: (value: number) => string;
  disabled?: boolean;
}

/** A rubber-band slider: pull past an end and the track stretches, let go and it snaps back. */
export const ElasticSlider = forwardRef<HTMLDivElement, ElasticSliderProps>(function ElasticSlider(
  {
    value,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    step = 1,
    icons,
    bubble = "always",
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
  const places = decimals(step);
  const snap = (v: number) => Number(clamp(min + Math.round((v - min) / step) * step, min, max).toFixed(places));

  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => snap(defaultValue ?? min));
  const current = controlled ? snap(value) : inner;
  const cur = useRef(current);

  const sound = useSound();
  const track = useRef<HTMLDivElement>(null);
  const thumbEl = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const wRef = useRef(0);

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      wRef.current = el.offsetWidth;
      setW(el.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* the motor, in px: thumb x along the track, stretch s at an end,
     and a smoothed speed for the squash */
  const frac = (v: number) => (v - min) / span;
  /* `s` is how far the stretched END has moved (px, + is right);
     `end` says which end that is, so a recoil past rest reads as
     that end pulling IN rather than the other end stretching */
  const [f, setF] = useState({ x: 0, s: 0, end: 1, speed: 0 });
  const m = useRef({ x: 0, vx: 0, tx: 0, s: 0, vs: 0, ts: 0, end: 1, speed: 0, px: 0, raf: 0, held: false });

  const paint = () => {
    const c = m.current;
    setF({ x: c.x, s: c.s, end: c.end, speed: c.speed });
  };

  const run = useCallback(() => {
    const c = m.current;
    if (c.raf) return;
    let prev = 0;
    c.px = c.x + c.s;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      if (!c.held) {
        c.vx += (c.tx - c.x) * K * dt;
        c.vx *= Math.pow(D, dt);
        c.x += c.vx * dt;
        c.vs += (c.ts - c.s) * K * dt;
        c.vs *= Math.pow(D, dt);
        c.s += c.vs * dt;
      }
      /* the thumb's visible speed includes the band's, so a snap
         back squashes it too */
      const at = c.x + c.s;
      c.speed = c.speed * 0.5 + ((at - c.px) / dt) * 0.5;
      c.px = at;
      const settled =
        !c.held && Math.abs(c.tx - c.x) < 0.02 && Math.abs(c.vx) < 0.02 && Math.abs(c.s) < 0.02 && Math.abs(c.vs) < 0.02 && Math.abs(c.speed) < 0.05;
      if (settled) {
        c.x = c.tx;
        c.s = 0;
        c.vx = c.vs = c.speed = 0;
        c.raf = 0;
        paint();
        return;
      }
      paint();
      c.raf = requestAnimationFrame(tick);
    };
    c.raf = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => cancelAnimationFrame(m.current.raf), []);

  const calm = () => isCalm(track.current);

  const settleTo = (v: number) => {
    const c = m.current;
    c.tx = frac(v) * wRef.current;
    c.ts = 0;
    if (calm()) {
      cancelAnimationFrame(c.raf);
      c.raf = 0;
      c.x = c.tx;
      c.s = c.vx = c.vs = c.speed = 0;
      paint();
      return;
    }
    run();
  };

  /* follow the width and any value set from outside: a new width
     (first measure, a resize) jumps, a new value travels */
  const lastW = useRef(0);
  useEffect(() => {
    const c = m.current;
    if (c.held || !w) return;
    cur.current = current;
    const tx = frac(current) * w;
    if (lastW.current !== w) {
      lastW.current = w;
      c.x = c.tx = tx;
      paint();
      return;
    }
    if (Math.abs(c.tx - tx) > 0.01) settleTo(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, w, min, max]);

  const commit = (next: number) => {
    if (next === cur.current) return false;
    cur.current = next;
    if (!controlled) setInner(next);
    onValueChange?.(next);
    return true;
  };

  /* ── the drag ──────────────────────────────────────────── */
  const drag = useRef<null | { left: number; grab: number; k: number; calm: boolean }>(null);

  const follow = (clientX: number) => {
    const g = drag.current;
    if (!g) return;
    const W = wRef.current;
    const local = (clientX - g.left) / g.k - g.grab;
    const x = clamp(local, 0, W);
    const c = m.current;
    c.x = c.tx = x;
    c.s = g.calm ? 0 : rubber(local - x);
    if (c.s) c.end = Math.sign(c.s);
    c.vx = c.vs = 0;
    const next = snap(min + (x / (W || 1)) * span);
    if (commit(next)) sound.detent(next === min || next === max ? 1 : 0.45);
    if (g.calm) paint();
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0 || !track.current) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a scripted pointer */
    }
    const box = track.current.getBoundingClientRect();
    const k = box.width / (track.current.offsetWidth || 1) || 1;
    const c = m.current;
    /* take the thumb where it was grabbed; a press on the bare
       track brings the thumb to the hand at once */
    const onThumb = thumbEl.current?.contains(e.target as Node);
    const grab = onThumb ? (e.clientX - box.left) / k - (c.x + c.s) : 0;
    drag.current = { left: box.left, grab, k, calm: calm() };
    /* focused for the keys that may follow, but marked as taken by
       the hand so the keyboard focus ring stays off until a key is
       actually pressed */
    if (thumbEl.current) {
      thumbEl.current.dataset.pointer = "";
      thumbEl.current.focus({ preventScroll: true });
    }
    c.held = true;
    if (!drag.current.calm) run();
    follow(e.clientX);
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => follow(e.clientX);

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
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
    if (Math.abs(c.s) > DROP_AT) sound.play("drop");
    settleTo(cur.current);
    onValueCommit?.(cur.current);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    delete e.currentTarget.dataset.pointer;
    const big = Math.max(step, Math.round(span / 10 / step) * step);
    const moves: Record<string, number> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: big,
      PageDown: -big,
    };
    let next: number | null = null;
    let dir = 0;
    if (e.key in moves) {
      next = snap(cur.current + moves[e.key]);
      dir = Math.sign(moves[e.key]);
    } else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    if (next === cur.current && dir) {
      /* pushing against the stop: the band gives a little and
         recoils, and the icon at that end is nudged */
      if (!calm()) {
        m.current.end = dir;
        m.current.vs += dir * KICK;
        run();
      }
      sound.detent(1);
      return;
    }
    commit(next);
    sound.detent(next === min || next === max ? 1 : 0.5);
    settleTo(next);
    onValueCommit?.(next);
  };

  /* ── the drawing ───────────────────────────────────────── */
  const { x, s, end, speed } = f;
  /* stretch along the end's own outward direction; negative is
     the recoil, that end drawn in past rest */
  const out = s * end;
  const pull = clamp(out / STRETCH, 0, 1);
  /* track: the stretched end moves by s, the other stays put, and
     it thins by up to 35% as it stretches — the band giving up
     thickness for length */
  const trackLeft = end < 0 ? s : 0;
  const trackWidth = w + out;
  const thin = 1 - 0.35 * pull;
  /* thumb: drawn out along the pull by up to 40% and along its
     speed; the cross-axis shrinks by the root so it never looks
     like it is gaining mass */
  const long = (1 + 0.4 * pull) * (1 + Math.min(SQUASH_MAX, Math.abs(speed) * SQUASH));
  const thumbX = x + s;
  const text = format ? format(current) : current.toFixed(places);
  /* the icon at the stretched end is shoved outward by 90% of the
     stretch — the thumb, drawn out along the pull, gains the other
     10% plus its own growth, which is exactly the 10px of air
     between them at rest, so the thumb reaches the icon at full
     stretch and never overlaps it — and swells by up to 20% */
  const iconStyle = (at: -1 | 1): CSSProperties | undefined => {
    if (at !== end || out <= 0) return undefined;
    return { translate: `${(s * 0.9).toFixed(2)}px 0`, scale: (1 + 0.2 * pull).toFixed(3) };
  };

  return (
    <div
      ref={ref}
      className={cx("rap-elastic", disabled && "is-disabled", `rap-elastic--bubble-${bubble}`, className)}
      style={style}
      {...rest}
    >
      {icons && (
        <span className="rap-elastic__icon" data-end="start" aria-hidden="true" style={iconStyle(-1)}>
          {icons[0]}
        </span>
      )}
      <div
        className="rap-elastic__area"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div ref={track} className="rap-elastic__rail">
          <div
            className="rap-elastic__track"
            style={{ left: trackLeft, width: trackWidth || "100%", transform: `scaleY(${thin.toFixed(3)})` }}
          >
            <div className="rap-elastic__range" style={{ width: Math.max(0, thumbX - trackLeft) }} />
          </div>
          <div
            ref={thumbEl}
            className="rap-elastic__thumb"
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={ariaLabel}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={current}
            aria-valuetext={text}
            aria-orientation="horizontal"
            aria-disabled={disabled || undefined}
            onKeyDown={onKey}
            style={{ translate: `${thumbX.toFixed(2)}px 0` }}
          >
            <span
              className="rap-elastic__knob"
              style={{ transform: `scale(${long.toFixed(3)}, ${(1 / Math.sqrt(long)).toFixed(3)})` }}
            />
            {bubble !== "never" && (
              <span className="rap-elastic__bubble" aria-hidden="true">
                <RollingNumber text={text} />
              </span>
            )}
          </div>
        </div>
      </div>
      {icons && (
        <span className="rap-elastic__icon" data-end="end" aria-hidden="true" style={iconStyle(1)}>
          {icons[1]}
        </span>
      )}
    </div>
  );
});
