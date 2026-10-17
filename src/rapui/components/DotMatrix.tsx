/* ══ DotMatrix ════════════════════════════════════════════
   A small grid of dots — the signal preset's signature, and the
   heart of its loaders. Dim dots in the ink at low strength, lit
   dots in currentColor (set it with a text-* class), square or
   round.

   What lights up:
   - `pattern` — the dots that are always on: a list of indexes,
     rows of "0"/"1" strings ("01010"), or a function (col, row).
   - `animation` — a pulse that runs through the grid:
       wave     a chevron front driving left → right (two fronts
                in flight: the cycle is shorter than the sweep)
       orbit    a comet lapping the perimeter
       scan     rows lighting top → bottom, like a refresh line
       twinkle  dots blinking at their own random times
   - `interactive` — dots under the pointer light up and fade
     back, a torch over the grid.

   The pulse is stepped, like a real LCD: one small timer at
   12 fps (8 in calm) writes a brightness level (data-l) on the
   dots whose level changed — no per-frame CSS animation, no
   re-render — and it stops while the grid is off screen or the
   tab is hidden. The pointer trail writes a data attribute too.
   Calm runs the pulse at 0.6× speed; still and reduced motion
   hold the dim grid and the pattern. */
import { useEffect, useMemo, useRef, type CSSProperties, type HTMLAttributes, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "../utils";
import "./DotMatrix.css";

export type DotMatrixAnimation = "none" | "wave" | "orbit" | "scan" | "twinkle";
export type DotMatrixPattern = number[] | string[] | ((col: number, row: number) => boolean);

export interface DotMatrixProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  cols?: number;
  rows?: number;
  /** Dot size, px. */
  size?: number;
  /** Space between dots, px. */
  gap?: number;
  shape?: "round" | "square";
  /** Dots that are always lit. */
  pattern?: DotMatrixPattern;
  animation?: DotMatrixAnimation;
  /** One cycle of the animation, ms. */
  period?: number;
  /** Light the dots under the pointer. */
  interactive?: boolean;
  /** Strength of an unlit dot, 0..1. */
  dim?: number;
}

/* a tiny deterministic random, so twinkle looks the same on every render */
function seeded(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function isLit(pattern: DotMatrixPattern | undefined, c: number, r: number, cols: number) {
  if (!pattern) return false;
  if (typeof pattern === "function") return pattern(c, r);
  if (typeof pattern[0] === "string") return (pattern as string[])[r]?.[c] === "1";
  return (pattern as number[]).includes(r * cols + c);
}

/** For each dot, its delay in a cycle (0..1 of the period), or null when the dot does not pulse. */
function phases(animation: DotMatrixAnimation, cols: number, rows: number): (number | null)[] {
  const n = cols * rows;
  if (animation === "none") return Array(n).fill(null);
  if (animation === "wave") {
    // each step back along the chevron is 14% of the cycle late, so on a wide grid
    // the front repeats every ~7 columns and several are in flight at once
    const mid = (rows - 1) / 2;
    return Array.from({ length: n }, (_, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      return (c + Math.abs(r - mid)) * 0.14;
    });
  }
  if (animation === "scan") return Array.from({ length: n }, (_, i) => Math.floor(i / cols) / Math.max(1, rows));
  if (animation === "twinkle") return Array.from({ length: n }, (_, i) => seeded(i));
  // orbit: the perimeter, clockwise from the top-left corner
  const ring: number[] = [];
  for (let c = 0; c < cols; c++) ring.push(c);
  for (let r = 1; r < rows; r++) ring.push(r * cols + cols - 1);
  for (let c = cols - 2; c >= 0; c--) ring.push((rows - 1) * cols + c);
  for (let r = rows - 2; r > 0; r--) ring.push(r * cols);
  return Array.from({ length: n }, (_, i) => {
    const k = ring.indexOf(i);
    return k === -1 ? null : k / ring.length;
  });
}

export function DotMatrix({
  cols = 5,
  rows = 5,
  size = 4,
  gap = 3,
  shape = "round",
  pattern,
  animation = "none",
  period,
  interactive = false,
  dim = 0.18,
  className,
  style,
  ...rest
}: DotMatrixProps) {
  const grid = useRef<HTMLDivElement>(null);
  const timers = useRef(new Map<number, number>());
  const ph = useMemo(() => phases(animation, cols, rows), [animation, cols, rows]);
  const dur = period ?? (animation === "orbit" ? 950 : animation === "twinkle" ? 2400 : animation === "scan" ? 1100 : 650);
  const litKey = useMemo(() => ph.map((_, i) => (isLit(pattern, i % cols, Math.floor(i / cols), cols) ? 1 : 0)).join(""), [ph, pattern, cols]);

  /* the stepped pulse: a timer, not a keyframe per dot (hundreds of keyframed dots kept
     the page restyling every frame) */
  useEffect(() => {
    const el = grid.current;
    if (!el || animation === "none" || typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const n = ph.length;
    const level = new Int8Array(n);
    const len = Float32Array.from({ length: n }, (_, i) => (animation === "twinkle" ? 0.6 + seeded(i + 99) * 0.9 : 1));
    const t0 = performance.now();
    let timer = 0;
    let onScreen = false;
    const clear = () => {
      for (let i = 0; i < n; i++)
        if (level[i]) {
          level[i] = 0;
          delete (el.children[i] as HTMLElement | undefined)?.dataset.l;
        }
    };
    const motionOf = () => el.closest("[data-rap-motion]")?.getAttribute("data-rap-motion") ?? "fun";
    const tick = () => {
      const motion = motionOf();
      if (motion === "still" || reduce?.matches) return clear();
      const pace = motion === "calm" ? 1.6 : 1;
      const t = performance.now() - t0;
      for (let i = 0; i < n; i++) {
        const p = ph[i];
        if (p === null || litKey[i] === "1") continue;
        const cycle = dur * pace * len[i];
        let f = ((t - dur * p * pace) / cycle) % 1;
        if (f < 0) f += 1;
        // dim → full by 12% → held to 22% → back to dim by 48% → dark for the rest
        const v = f < 0.12 ? f / 0.12 : f <= 0.22 ? 1 : f < 0.48 ? 1 - (f - 0.22) / 0.26 : 0;
        const l = Math.round(v * 3);
        if (l !== level[i]) {
          level[i] = l;
          const dot = el.children[i] as HTMLElement | undefined;
          if (!dot) continue;
          if (l) dot.dataset.l = String(l);
          else delete dot.dataset.l;
        }
      }
    };
    const sync = () => {
      const run = onScreen && !document.hidden;
      if (run && !timer) {
        tick();
        timer = window.setInterval(tick, motionOf() === "fun" ? 1000 / 12 : 1000 / 8);
      } else if (!run && timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    };
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((e) => ((onScreen = e[e.length - 1].isIntersecting), sync())) : null;
    if (io) io.observe(el);
    else (onScreen = true), sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(timer);
      clear();
    };
  }, [animation, ph, dur, litKey]);

  /* the torch: the dot under the pointer and its neighbours light, then fade on their own */
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = grid.current;
    if (!interactive || !el) return;
    const r = el.getBoundingClientRect();
    const pitch = size + gap;
    const c0 = Math.floor((e.clientX - r.left) / pitch);
    const r0 = Math.floor((e.clientY - r.top) / pitch);
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const c = c0 + dc, rr = r0 + dr;
        if (c < 0 || rr < 0 || c >= cols || rr >= rows) continue;
        const i = rr * cols + c;
        const dot = el.children[i] as HTMLElement | undefined;
        if (!dot) continue;
        dot.dataset.hot = dc === 0 && dr === 0 ? "2" : "1";
        window.clearTimeout(timers.current.get(i));
        timers.current.set(i, window.setTimeout(() => delete dot.dataset.hot, 260));
      }
  };

  return (
    <div
      ref={grid}
      data-slot="dot-matrix"
      data-animation={animation}
      aria-hidden
      onPointerMove={onMove}
      className={cn("rap-dot-matrix inline-grid shrink-0", interactive && "cursor-crosshair", className)}
      style={
        {
          gridTemplateColumns: `repeat(${cols}, ${size}px)`,
          gap,
          "--dm-dim": dim,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {ph.map((_p, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const lit = isLit(pattern, c, r, cols);
        return (
          <span
            key={i}
            data-lit={lit || undefined}
            className={shape === "round" ? "rounded-full" : "rounded-[1px]"}
            style={
              {
                width: size,
                height: size,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
