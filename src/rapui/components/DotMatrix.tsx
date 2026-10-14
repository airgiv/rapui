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

   It is all CSS: each dot gets its delay as a custom property
   and one keyframe does the rest; the pointer trail writes a
   data attribute, no re-render. Calm runs the pulse at 0.6×
   speed; still holds the dim grid and the pattern. */
import { useMemo, useRef, type CSSProperties, type HTMLAttributes, type PointerEvent as ReactPointerEvent } from "react";
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
          "--dm-dur": `${dur}ms`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {ph.map((p, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const lit = isLit(pattern, c, r, cols);
        return (
          <span
            key={i}
            data-lit={lit || undefined}
            data-pulse={p !== null || undefined}
            className={shape === "round" ? "rounded-full" : "rounded-[1px]"}
            style={
              {
                width: size,
                height: size,
                "--dm-delay": p === null ? undefined : `calc(var(--dm-dur) * ${p.toFixed(3)} * var(--dm-pace, 1))`,
                "--dm-len": animation === "twinkle" ? `${(0.6 + seeded(i + 99) * 0.9).toFixed(2)}` : undefined,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
