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
import { clamp, cn } from "../utils";
import { RollingNumber, isCalm } from "./ScrubNumber";
import { rubber, turn, useCarry, useThrow } from "./tickKit";
import "./TempoDial.css";

/* ══ Tempo dial ═══════════════════════════════════════════
   A jog wheel for a tempo. The whole ring of ticks turns under
   your finger — round it clockwise and the tempo climbs — and
   one quarter of the ring lights up on every beat, walking round
   the face in fours like a conductor's hand: down, in, out, up.
   Tap the pill under it in time and the ring turns itself to the
   tempo you tapped.

   ── WHY 3° A BEAT-PER-MINUTE ────────────────────────────
   A tick every 6° is 60 round the ring, which is as fine as a
   2px stroke can be set at 220px before neighbours touch. At 3°
   a bpm each tick is two bpm, and a whole turn is 120 of them —
   so the useful range of music, 60 to 180, is one comfortable
   turn of the wrist, and 40–220 is a turn and a half.

   ── THE TOP IS WHERE YOU READ ───────────────────────────
   A ring that turns has no fixed ticks to look at, so the ink
   gathers at the mark instead: ticks near the top are dark and
   fall away to 0.22 by the sides — the TimeScrubber's "dial seen
   from the front", bent into a circle. The flame mark at 12
   o'clock is the only thing that never moves.

   ── ONE SPRING FOR THE SPIN AND THE SETTLE ──────────────
   Let go with speed and the wheel coasts on the same spring the
   TimeScrubber lands on, to the whole bpm it would have reached.
   A tapped tempo arrives by that spring too, so the ring visibly
   spins to the new number instead of cutting to it. */

/* degrees of ring per bpm, see above */
const DEG = 3;
const N = 60;
const R0 = 72;

export interface TempoDialProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (bpm: number) => void;
  min?: number;
  max?: number;
  /** Dial diameter, px. */
  size?: number;
  /** Pulse the ring on the beat. */
  playing?: boolean;
  /** Beats in a bar; the first is the downbeat. */
  beats?: number;
  /** Called on every beat while playing, with its index in the bar. */
  onBeat?: (beat: number) => void;
  /** Show the tap-tempo pill. */
  tap?: boolean;
  disabled?: boolean;
}

/** A jog wheel of ticks for a tempo: spin it, fling it, or tap the beat. */
export const TempoDial = forwardRef<HTMLDivElement, TempoDialProps>(function TempoDial(
  {
    value,
    defaultValue = 96,
    onValueChange,
    min = 40,
    max = 220,
    size = 220,
    playing = true,
    beats = 4,
    onBeat,
    tap = true,
    disabled,
    className,
    style,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const start = clamp(Math.round(value ?? defaultValue), min, max);
  const sound = useSound();
  const dial = useRef<HTMLDivElement>(null);
  const range = useRef({ min, max });
  range.current = { min, max };
  const cb = useRef({ onValueChange, onBeat });
  cb.current = { onValueChange, onBeat };
  const emitted = useRef(start);
  const heard = useRef(start);

  /* a notch per bpm, firmer on the tens; the pitch rises with the
     tempo, ×0.7 at the slowest to ×1.5 at the fastest */
  const hear = (x: number) => {
    const r = range.current;
    const k = clamp(Math.round(x), r.min, r.max);
    if (k === heard.current) return;
    heard.current = k;
    sound.detent(k % 10 === 0 ? 0.9 : 0.45, { pitch: 0.7 + ((k - r.min) / Math.max(1, r.max - r.min)) * 0.8 });
    if (k !== emitted.current) {
      emitted.current = k;
      cb.current.onValueChange?.(k);
    }
  };
  const { pos, state, set, goTo, stop } = useCarry(start, hear);
  const bpm = clamp(Math.round(pos), min, max);

  const land = (to: number, v = 0) => goTo(clamp(Math.round(to), min, max), v, isCalm(dial.current));

  useEffect(() => {
    if (value === undefined || drag.current) return;
    const v = clamp(Math.round(value), min, max);
    if (v !== emitted.current) {
      emitted.current = v;
      goTo(v, 0, isCalm(dial.current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  /* ── the beat ──────────────────────────────────────────────
     A setTimeout chain that reads the tempo from a ref on every
     beat, so a drag changes the pace without restarting the bar,
     and that schedules against the clock rather than after the
     last callback, so it does not drift late. */
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const [beat, setBeat] = useState<{ n: number; q: number } | null>(null);
  useEffect(() => {
    if (!playing || disabled) {
      setBeat(null);
      return;
    }
    let n = 0;
    let next = performance.now() + 60000 / bpmRef.current;
    let t = 0;
    const fire = () => {
      const q = n % Math.max(1, beats);
      n += 1;
      /* calm: the tempo is still kept (onBeat still fires), but
         nothing on the ring blinks */
      setBeat(isCalm(dial.current) ? null : { n, q });
      cb.current.onBeat?.(q);
      next += 60000 / bpmRef.current;
      const now = performance.now();
      if (next < now) next = now + 60000 / bpmRef.current;
      t = window.setTimeout(fire, next - now);
    };
    t = window.setTimeout(fire, next - performance.now());
    return () => clearTimeout(t);
  }, [playing, beats, disabled]);

  /* ── tap tempo ─────────────────────────────────────────────
     The average of the last four gaps. A pause of two seconds
     starts a new count, so a stray tap after a while is the first
     of a new tempo, not a 20 bpm outlier. */
  const taps = useRef<number[]>([]);
  const [tapped, setTapped] = useState(0);
  const doTap = () => {
    const now = performance.now();
    const list = taps.current;
    if (list.length && now - list[list.length - 1] > 2000) list.length = 0;
    list.push(now);
    if (list.length > 5) list.shift();
    setTapped(list.length);
    sound.play("tap", { strength: 0.6 });
    if (list.length >= 2) {
      const gaps = list.slice(1).map((x, i) => x - list[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      land(60000 / avg);
    }
  };
  useEffect(() => {
    if (!tapped) return;
    const t = window.setTimeout(() => setTapped(0), 2000);
    return () => clearTimeout(t);
  }, [tapped]);

  /* ── the drag: the angle the hand has turned ──────────── */
  const drag = useRef<null | { a: number; raw: number }>(null);
  const hand = useThrow();
  const angleAt = (e: ReactPointerEvent) => {
    const b = dial.current!.getBoundingClientRect();
    const x = e.clientX - (b.left + b.width / 2);
    const y = e.clientY - (b.top + b.height / 2);
    return { a: (Math.atan2(y, x) * 180) / Math.PI, r: Math.hypot(x, y) / (b.width / 2) };
  };

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
    stop();
    drag.current = { a: angleAt(e).a, raw: state.current.x };
    hand.reset();
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g) return;
    const { a, r } = angleAt(e);
    /* at the very centre the angle spins wildly for a pixel of
       travel — ignore the hand while it is inside the figure */
    if (r < 0.18) {
      g.a = a;
      return;
    }
    const d = turn(g.a, a) / DEG;
    g.a = a;
    g.raw += d;
    hand.feed(d);
    set(rubber(g.raw, min, max));
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
    /* capped at 3 bpm a frame; 14 frames of carry — a spin of
       the wrist coasts about a third of a turn */
    const v = hand.release(3);
    land(state.current.x + v * 14, v * 0.6);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    delete e.currentTarget.dataset.pointer;
    const at = Math.round(state.current.to);
    const map: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 };
    let next: number | null = null;
    if (e.key in map) next = at + map[e.key];
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    else if (e.key === "t" || e.key === "T") {
      e.preventDefault();
      doTap();
      return;
    }
    if (next === null) return;
    e.preventDefault();
    land(next);
  };

  /* ── the drawing ───────────────────────────────────────── */
  const rot = (clamp(pos, min - 8, max + 8) - min) * DEG;
  const ticks = Array.from({ length: N }, (_, i) => {
    const base = (i * 360) / N;
    /* where this tick is on screen now: 0 at the mark */
    const seen = Math.abs(turn(0, base + rot));
    const f = clamp(1 - Math.pow(seen / 110, 2), 0, 1);
    const long = i % 5 === 0;
    const a = ((base - 90) * Math.PI) / 180;
    const len = long ? 14 : 8;
    return {
      i,
      q: Math.floor((i * 4) / N),
      x1: 100 + Math.cos(a) * R0,
      y1: 100 + Math.sin(a) * R0,
      x2: 100 + Math.cos(a) * (R0 + len),
      y2: 100 + Math.sin(a) * (R0 + len),
      o: 0.22 + 0.7 * f,
    };
  });
  /* the lit quarter: which quarter of the RING (not the screen)
     for this beat, so the light is carried round when you spin */
  const quarter = beat ? Math.floor((beat.q * 4) / Math.max(1, beats)) % 4 : -1;
  const flash = Math.min(420, (60000 / bpm) * 0.85);

  return (
    <div
      ref={ref}
      data-slot="tempo-dial"
      data-disabled={disabled || undefined}
      className={cn("inline-flex flex-col items-center gap-3 font-sans text-ink select-none", disabled && "opacity-50 pointer-events-none", className)}
      style={{ ...style, ["--tempo-size" as string]: `${size}px` } as CSSProperties}
      {...rest}
    >
      <div
        ref={dial}
        data-slot="tempo-dial-wheel"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel ?? "Tempo"}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={bpm}
        aria-valuetext={`${bpm} beats per minute`}
        aria-disabled={disabled || undefined}
        className={cn(
          "group/tempo relative size-(--tempo-size) rounded-full cursor-grab active:cursor-grabbing touch-none outline-none",
          "[&:focus-visible:not([data-pointer])]:shadow-[0_0_0_2px_var(--rap-ring)]",
        )}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <svg data-slot="tempo-dial-ring" viewBox="0 0 200 200" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
          <g transform={`rotate(${rot.toFixed(2)} 100 100)`}>
            {ticks.map((t) => (
              <line
                key={t.i}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="currentColor"
                strokeOpacity={t.o}
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}
            {beat && quarter >= 0 && (
              <g
                key={beat.n}
                data-slot="tempo-dial-beat"
                data-down={beat.q === 0 || undefined}
                className="text-flame"
                style={{ animation: `rap-tempo-flash ${flash.toFixed(0)}ms cubic-bezier(0.2, 0.7, 0.3, 1) both` }}
              >
                {ticks
                  .filter((t) => t.q === quarter)
                  .map((t) => (
                    <line
                      key={t.i}
                      x1={t.x1}
                      y1={t.y1}
                      x2={t.x2}
                      y2={t.y2}
                      stroke="currentColor"
                      /* the downbeat is struck harder: a wider stroke */
                      strokeWidth={beat.q === 0 ? 2.8 : 2}
                      strokeLinecap="round"
                    />
                  ))}
              </g>
            )}
          </g>
          {/* the one fixed thing: the reading mark at 12 o'clock */}
          <line data-slot="tempo-dial-mark" x1={100} y1={4} x2={100} y2={16} className="stroke-flame" strokeWidth={3} strokeLinecap="round" />
        </svg>
        <span data-slot="tempo-dial-value" className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" aria-hidden="true">
          <span className="text-[length:calc(var(--tempo-size)*0.2)] font-medium leading-none tracking-[-0.045em] tabular-nums">
            <RollingNumber text={String(bpm)} />
          </span>
          <span className="mt-1.5 text-[0.8125rem] font-medium tracking-[-0.01em] text-mute">bpm</span>
        </span>
      </div>

      {tap && (
        <div data-slot="tempo-dial-foot" className="flex items-center gap-3">
          <button
            type="button"
            data-slot="tempo-dial-tap"
            disabled={disabled}
            onClick={doTap}
            className={cn(
              "h-(--rap-control-h-sm) px-4 rounded-pill bg-fill text-ink text-[0.875rem] font-medium tracking-[-0.01em] tabular-nums",
              "transition-[background-color,scale] duration-(--rap-dur-fast) ease-rm hover:bg-fill-hover active:scale-95 calm:active:scale-100",
              "outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
            )}
          >
            {tapped ? `Tap ${tapped}` : "Tap tempo"}
          </button>
          {/* the bar, as dots: which beat of it is sounding */}
          <span data-slot="tempo-dial-bar" className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: beats }, (_, i) => (
              <span
                key={i}
                data-on={beat?.q === i || undefined}
                className={cn(
                  "size-[6px] rounded-full bg-fill-strong transition-colors duration-100 data-[on]:bg-flame",
                  i === 0 && "size-[8px] -my-px",
                )}
              />
            ))}
          </span>
        </div>
      )}
    </div>
  );
});
