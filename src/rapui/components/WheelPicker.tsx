import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
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
import { isCalm } from "./ScrubNumber";
import "./WheelPicker.css";

/* ══ Wheel picker ═════════════════════════════════════════
   The drum from a phone's alarm clock: a column of options on a
   cylinder turned on its side. Drag it and it follows; fling it
   and it spins, then comes to rest with one option in the band.

   ── A CYLINDER SEEN FROM THE SIDE ───────────────────────
   Every row sits at an angle on the drum, θ = (row − position) ·
   A, and is drawn where that angle PROJECTS: y = R·sin θ, turned
   by θ about its own horizontal axis, fading with cos θ. Rows
   crowd together toward the top and bottom and lean away, which
   is what makes a flat list read as a turning drum rather than a
   list with a gradient on it. Rows past a quarter turn are round
   the back and are not drawn at all, so a list of a thousand
   options costs a dozen rows.

   ── ONE SPRING FOR THE THROW AND THE SETTLE ─────────────
   The TimeScrubber's rule, unchanged: on release the landing is
   decided at once — where the drum would coast at the speed it
   was let go, rounded to a row — and one near-critical spring
   carries it there starting with part of the hand's speed. A
   flick spins, a slow release settles, and there is no seam
   between them. The value is committed at that moment, not when
   the motion ends: the choice is immediate, the spin rides on
   top of it.

   ── THE BAND IS A LENS ──────────────────────────────────
   The selected band is a filled pill in the selection blue, and
   the rows are drawn twice: once in ink, once in the blue's own
   ink, clipped to the pill. A row crossing the pill's edge
   changes colour exactly at the edge, letter by letter, the way
   a label slides under a tinted glass — no fade to time, no
   moment where it is neither. Blue because the band IS the
   selection; rap/ui's "this is chosen" colour. */

/* px per row. 36 = --rap-control-h-sm, the smallest pill in
   rap/ui, so the band is a standard control height. */
const ROW = 36;
/* the angle between rows is chosen per `visible` so the row at
   the window's edge (visible/2 rows out) sits 1.1 rad (63°)
   round the drum: steep enough to read as curved, shallow enough
   that the edge row is still legible */
const EDGE = 1.1;
/* ── the spring: TimeScrubber's, near-critical ────────────
   pull 0.022 and drag 0.26 a frame give a damping ratio of
   0.26 / (2·√0.022) ≈ 0.88 — glides in with a hint of give, no
   swing back past the row, no slow creep at the end. Run in
   rows; 0.01 row (a third of a pixel) is "there". */
const PULL = 0.022;
const DRAG = 0.26;
/* frames of coast a release carries: 18 at 60fps is a 0.3s
   throw, so a quick flick spins five or six rows and a gentle
   one one or two */
const CARRY = 18;
/* the fastest throw counted, rows a frame — a flick spins a
   dozen rows, never the whole list */
const VMAX = 1.2;
/* how far the drum can be pulled past its first or last row,
   in rows. The pull is rubber-banded: the harder you pull the
   less it gives, approaching one row and never passing it. */
const OVER = 1;

/* iOS's rubber band, f(o) = D·(1 − 1/(o·c/D + 1)) with c = 0.55,
   and its inverse, to pick the drum up where it is mid-bounce */
const rubber = (o: number) => OVER * (1 - 1 / ((o * 0.55) / OVER + 1));
const unrubber = (r: number) => (OVER / 0.55) * (1 / (1 - Math.min(r, OVER * 0.999) / OVER) - 1);
const wrapIndex = (i: number, n: number) => ((i % n) + n) % n;

export type WheelOption = string | { value: string; label?: ReactNode; text?: string };
type Norm = { value: string; label: ReactNode; text: string };

const norm = (o: WheelOption): Norm =>
  typeof o === "string"
    ? { value: o, label: o, text: o }
    : { value: o.value, label: o.label ?? o.value, text: o.text ?? (typeof o.label === "string" ? o.label : o.value) };

export interface WheelPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  options: readonly WheelOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Rows shown (odd numbers keep the band centred). Default 5. */
  visible?: number;
  /** Wraps round, the way hours and minutes do. */
  loop?: boolean;
  disabled?: boolean;
  /** Text alignment of the rows. */
  align?: "start" | "center" | "end";
}

/** A drum of options: drag or fling, it settles on the nearest row. Arrow keys step. */
export const WheelPicker = forwardRef<HTMLDivElement, WheelPickerProps>(function WheelPicker(
  {
    options,
    value,
    defaultValue,
    onValueChange,
    visible = 5,
    loop = false,
    disabled,
    align = "center",
    className,
    style,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const opts = useMemo(() => options.map(norm), [options]);
  const n = Math.max(1, opts.length);
  const rows = Math.max(3, Math.round(visible));
  const A = EDGE / (rows / 2);
  const R = ROW / A;

  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => defaultValue ?? opts[0]?.value ?? "");
  const selected = controlled ? value : inner;
  const index = Math.max(0, opts.findIndex((o) => o.value === selected));

  const sound = useSound();
  const el = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState(index);
  const p = useRef({ x: index, v: 0, to: index, raf: 0 });
  const heard = useRef(index);
  const knobs = useRef({ n, loop });
  knobs.current = { n, loop };

  /* a notch for every row that passes the band; the end rows of
     a non-looping list are the stops, and click firmer */
  const hear = (x: number) => {
    const k = Math.round(x);
    if (k === heard.current) return;
    heard.current = k;
    const { n: len, loop: lp } = knobs.current;
    if (!lp && (k < 0 || k > len - 1)) return;
    sound.detent(!lp && (k === 0 || k === len - 1) ? 0.9 : 0.5);
  };

  const set = (x: number) => {
    p.current.x = x;
    hear(x);
    setPos(x);
  };

  const run = useCallback(() => {
    const c = p.current;
    if (c.raf) return;
    let prev = 0;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      c.v += ((c.to - c.x) * PULL - c.v * DRAG) * dt;
      const x = c.x + c.v * dt;
      if (Math.abs(c.to - x) < 0.01 && Math.abs(c.v) < 0.01) {
        c.v = 0;
        c.raf = 0;
        set(c.to);
        return;
      }
      set(x);
      c.raf = requestAnimationFrame(tick);
    };
    c.raf = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => cancelAnimationFrame(p.current.raf), []);

  const stop = () => {
    cancelAnimationFrame(p.current.raf);
    p.current.raf = 0;
  };

  const goTo = (to: number, v = 0) => {
    const c = p.current;
    c.to = to;
    c.v = v;
    if (isCalm(el.current)) {
      stop();
      c.v = 0;
      set(to);
      return;
    }
    run();
  };

  /* pick row `k` (unbounded when looping): commit, then spin there */
  const land = (k: number, v = 0) => {
    const to = loop ? k : clamp(k, 0, n - 1);
    const next = opts[wrapIndex(to, n)];
    if (next && next.value !== selected) {
      if (!controlled) setInner(next.value);
      onValueChange?.(next.value);
    }
    goTo(to, v);
  };

  /* a value set from outside turns the drum the short way round */
  useEffect(() => {
    const c = p.current;
    if (drag.current || wrapIndex(Math.round(c.to), n) === index) return;
    let to = index;
    if (loop) {
      const d = ((index - c.to) % n + n + n / 2) % n - n / 2;
      to = Math.round(c.to + d);
    }
    goTo(to, c.v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, n, loop]);

  /* ── the drag ──────────────────────────────────────────── */
  const drag = useRef<null | { y: number; y0: number; t: number; v: number; raw: number; k: number }>(null);

  const show = (raw: number) => {
    if (loop) return raw;
    if (raw < 0) return -rubber(-raw);
    if (raw > n - 1) return n - 1 + rubber(raw - (n - 1));
    return raw;
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a scripted pointer */
    }
    stop();
    /* scale, for a picker inside a transformed parent */
    const k = e.currentTarget.getBoundingClientRect().height / e.currentTarget.offsetHeight || 1;
    /* picking the drum up mid-bounce past an end: undo the band
       so the hand holds the same raw position it would have */
    const x = p.current.x;
    const raw = loop || (x >= 0 && x <= n - 1) ? x : x < 0 ? -unrubber(-x) : n - 1 + unrubber(x - (n - 1));
    drag.current = { y: e.clientY, y0: e.clientY, t: performance.now(), v: 0, raw, k };
    p.current.v = 0;
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g) return;
    const now = performance.now();
    /* up is later: the drum turns under a fixed band */
    const dr = -(e.clientY - g.y) / g.k / ROW;
    const dt = Math.max(1, now - g.t) / 16.67;
    g.v = g.v * 0.5 + (dr / dt) * 0.5;
    g.y = e.clientY;
    g.t = now;
    g.raw += dr;
    set(show(g.raw));
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
    /* a press that barely moved is a tap on a row: turn to it */
    if (Math.abs(e.clientY - g.y0) < 4) {
      const box = e.currentTarget.getBoundingClientRect();
      const y = (e.clientY - (box.top + box.height / 2)) / g.k;
      const rowsAway = Math.asin(clamp(y / R, -1, 1)) / A;
      land(Math.round(p.current.x + rowsAway));
      return;
    }
    /* a hand that stopped before letting go threw nothing */
    const v = performance.now() - g.t > 80 ? 0 : clamp(g.v, -VMAX, VMAX);
    /* the landing already includes the throw, so the spring starts
       with only part of the hand's speed (TimeScrubber's 0.6) */
    land(Math.round(p.current.x + v * CARRY), v * 0.6);
  };

  /* a mouse wheel or a trackpad turns it; settles 120ms after the
     last event, the pause between two flicks of a finger */
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    let idle = 0;
    const wheel = (e: WheelEvent) => {
      if (disabled || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      stop();
      const { n: len, loop: lp } = knobs.current;
      /* a mouse wheel's 100px notch is one row; a trackpad's small
         deltas scroll continuously */
      const d = Math.abs(e.deltaY) >= 50 ? Math.sign(e.deltaY) : e.deltaY / ROW;
      const x = lp ? p.current.x + d : clamp(p.current.x + d, 0, len - 1);
      set(x);
      clearTimeout(idle);
      idle = window.setTimeout(() => landRef.current(Math.round(p.current.x)), 120);
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", wheel);
      clearTimeout(idle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);
  const landRef = useRef(land);
  landRef.current = land;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const base = Math.round(p.current.to);
    const page = Math.max(1, rows - 1);
    /* spinbutton keys: Up is "increase" = the next row, rolling the
       drum up the way a thumb would push it; Down the previous */
    const moves: Record<string, number> = { ArrowUp: 1, ArrowDown: -1, PageUp: page, PageDown: -page };
    if (e.key in moves) {
      e.preventDefault();
      const to = base + moves[e.key];
      if (!loop && (to < 0 || to > n - 1)) {
        sound.detent(1);
        return;
      }
      land(to);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const target = e.key === "Home" ? 0 : n - 1;
      land(loop ? base + (target - wrapIndex(base, n)) : target);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      /* type-ahead: the next option starting with that letter */
      const ch = e.key.toLowerCase();
      for (let s = 1; s <= n; s++) {
        const i = wrapIndex(base + s, n);
        if (opts[i].text.toLowerCase().startsWith(ch)) {
          land(loop ? base + s : i);
          break;
        }
      }
    }
  };

  /* ── the rows round the front of the drum ──────────────── */
  const reach = Math.ceil(Math.PI / 2 / A);
  const drawn: { k: number; o: Norm; th: number; f: number }[] = [];
  for (let k = Math.floor(pos) - reach; k <= Math.ceil(pos) + reach; k++) {
    if (!loop && (k < 0 || k > n - 1)) continue;
    const th = (k - pos) * A;
    if (Math.abs(th) >= Math.PI / 2) continue;
    drawn.push({ k, o: opts[wrapIndex(k, n)], th, f: Math.cos(th) });
  }

  const row = (d: (typeof drawn)[number], lens: boolean) => (
    <span
      key={d.k}
      className="rap-wheel__row"
      style={{
        /* turned about the drum's axis, R behind the band, so the
           row lands at y = R·sin θ and recedes by R·(1 − cos θ):
           rows round the rim get smaller as well as flatter */
        transform: `translateZ(${-R.toFixed(2)}px) rotateX(${(-d.th).toFixed(4)}rad) translateZ(${R.toFixed(2)}px)`,
        /* ink fades with the cosine: full at the band, a fifth at
           the rim (0.2 + 0.8·cos θ) — the lens copy never fades */
        opacity: lens ? 1 : (0.2 + 0.8 * d.f).toFixed(3),
      }}
    >
      {d.o.label}
    </span>
  );

  const current = opts[index];

  return (
    <div
      ref={(node) => {
        el.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cx("rap-wheel", `rap-wheel--${align}`, disabled && "is-disabled", className)}
      style={{ ...style, "--wheel-row": `${ROW}px`, "--wheel-rows": rows } as CSSProperties}
      role="spinbutton"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuenow={index}
      aria-valuemin={0}
      aria-valuemax={n - 1}
      aria-valuetext={current?.text}
      aria-disabled={disabled || undefined}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={onKey}
      {...rest}
    >
      {/* sets the width: every label, stacked in one cell, unseen */}
      <span className="rap-wheel__sizer" aria-hidden="true">
        {opts.map((o) => (
          <span key={o.value}>{o.label}</span>
        ))}
      </span>
      <span className="rap-wheel__band" aria-hidden="true" />
      <span className="rap-wheel__drum" aria-hidden="true">
        {drawn.map((d) => row(d, false))}
      </span>
      <span className="rap-wheel__drum rap-wheel__drum--lens" aria-hidden="true">
        {drawn.filter((d) => Math.abs(d.th) < A * 1.5).map((d) => row(d, true))}
      </span>
    </div>
  );
});

/* ══ TimeWheel ════════════════════════════════════════════
   Two or three drums side by side — hours, minutes and, on a
   12-hour clock, AM/PM — sharing one band. The band is each
   drum's own pill with the inner corners squared off to the
   small 6px radius, 2px apart (rap/ui's tight joinery), so the
   three read as one pill cut into segments. Hours and minutes
   loop, as they do on a clock; AM/PM is a two-row drum that
   stops at its ends. The value is always 24-hour "HH:MM", so
   the format is a display choice and never changes the data. */

const pad = (x: number) => String(x).padStart(2, "0");

export interface TimeWheelProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  /** 24-hour "HH:MM". */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  format?: "12h" | "24h";
  /** Minutes between rows: 1, 5, 10, 15… Default 5. */
  minuteStep?: number;
  visible?: number;
  disabled?: boolean;
}

const parse = (v: string | undefined) => {
  const [h, m] = (v ?? "").split(":").map(Number);
  return { h: Number.isFinite(h) ? clamp(Math.floor(h), 0, 23) : 0, m: Number.isFinite(m) ? clamp(Math.floor(m), 0, 59) : 0 };
};

/** Hours / minutes (/ AM-PM) drums. Value is 24-hour "HH:MM". */
export const TimeWheel = forwardRef<HTMLDivElement, TimeWheelProps>(function TimeWheel(
  { value, defaultValue = "09:00", onValueChange, format = "12h", minuteStep = 5, visible = 5, disabled, className, ...rest },
  ref,
) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const { h, m } = parse(controlled ? value : inner);
  const ms = clamp(Math.round(minuteStep), 1, 30);
  const mm = Math.min(59 - (59 % ms), Math.round(m / ms) * ms);
  const h12 = format === "12h";

  const hours = useMemo(
    () => (h12 ? Array.from({ length: 12 }, (_, i) => String(i + 1)) : Array.from({ length: 24 }, (_, i) => pad(i))),
    [h12],
  );
  const minutes = useMemo(() => Array.from({ length: Math.ceil(60 / ms) }, (_, i) => pad(i * ms)), [ms]);
  const pm = h >= 12;

  const emit = (nh: number, nm: number) => {
    const next = `${pad(nh)}:${pad(nm)}`;
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  return (
    <div ref={ref} className={cx("rap-timewheel", className)} role="group" {...rest}>
      <WheelPicker
        aria-label="Hours"
        options={hours}
        loop
        visible={visible}
        disabled={disabled}
        value={h12 ? String(h % 12 || 12) : pad(h)}
        onValueChange={(v) => emit(h12 ? (Number(v) % 12) + (pm ? 12 : 0) : Number(v), mm)}
      />
      <WheelPicker
        aria-label="Minutes"
        options={minutes}
        loop
        visible={visible}
        disabled={disabled}
        value={pad(mm)}
        onValueChange={(v) => emit(h, Number(v))}
      />
      {h12 && (
        <WheelPicker
          aria-label="AM or PM"
          options={["AM", "PM"]}
          visible={visible}
          disabled={disabled}
          value={pm ? "PM" : "AM"}
          onValueChange={(v) => emit((h % 12) + (v === "PM" ? 12 : 0), mm)}
        />
      )}
    </div>
  );
});
