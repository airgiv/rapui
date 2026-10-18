/* ══ DotText ══════════════════════════════════════════════
   A word set in dots, like a stadium board or a dot-matrix
   printer. The text is drawn once into an offscreen canvas in the
   page's display face, sampled on a grid, and every inked cell
   becomes a dot — so it is real type, just made of points.

   `step` is the grid pitch in px (smaller = finer), `dot` the dot
   diameter as a share of the step. The colour is currentColor.
   It stays accessible: the SVG carries the text as its label.

   Matrix mode (`matrix`): instead of sampling a typeface, the
   text is set in a built-in 5×7 dot-matrix font — a departures
   board, a pager, a Nothing screen. `off` draws the unlit dots
   of the whole field too (grey dots, the lit ones in
   currentColor), `field` fixes the field's size in dots and
   `pad` places the text inside it; `wrap` breaks lines at a dot
   width. Lit dots are one SVG path and the unlit field one
   pattern, so a big field costs almost nothing; on first view the
   text steps in from the left in six 12 fps steps (half a second;
   still: it is simply there), then holds.

   Delight: the dots arrive. On mount they appear in a scatter —
   fun: each pops from nothing at its own random moment, so the
   word condenses like a signal locking on; calm: one quiet fade,
   left to right; still: it is simply there. Hover (fun only):
   the dots near the pointer swell, a lens dragged over a board. */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type SVGAttributes } from "react";
import { cn } from "../utils";
import { isMotionCalm } from "./FormField";
import { layoutDots } from "./dotFont";
import "./DotText.css";

export interface DotTextProps extends Omit<SVGAttributes<SVGSVGElement>, "children"> {
  children: string;
  /** Font size the word is drawn at, px — sets the height. */
  fontSize?: number;
  /** Grid pitch, px. Defaults to fontSize / 16. */
  step?: number;
  /** Dot diameter as a share of the step, 0..1. */
  dot?: number;
  /** Font weight to draw with. */
  weight?: number | string;
  /** CSS font-family; defaults to the display face of the current preset. */
  family?: string;
  /** Set the text in the built-in 5×7 dot-matrix font instead of sampling a typeface. */
  matrix?: boolean;
  /** Matrix: draw the unlit dots of the field as well. */
  off?: boolean;
  /** Matrix: the field's size in dots (at least the text's own size). */
  field?: { cols?: number; rows?: number };
  /** Matrix: where the text sits in the field, in dots: [x, y] (or one number for both). */
  pad?: number | [number, number];
  /** Matrix: the most dots a line may hold before it wraps at a space. */
  wrap?: number;
  /** Matrix: line alignment inside the text block. */
  align?: "left" | "center" | "right";
  /** Matrix: dots square instead of round. */
  square?: boolean;
}

interface Dot {
  x: number;
  y: number;
  r: number; // 0..1 random, for staggering
}

export function DotText(props: DotTextProps) {
  return props.matrix ? <MatrixText {...props} /> : <FaceText {...props} />;
}

/* ── matrix mode ── */
function MatrixText({ children, fontSize = 120, step, dot = 0.72, off = false, field, pad = 0, wrap, align = "left", square = false, matrix: _m, weight: _w, family: _f, className, style, ...rest }: DotTextProps) {
  const ref = useRef<SVGSVGElement>(null);
  const clip = useRef<SVGRectElement>(null);
  const id = `rap-dt-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [px, py] = typeof pad === "number" ? [pad, pad] : pad;
  const lay = useMemo(() => layoutDots(children, { wrap: wrap ?? Infinity, align }), [children, wrap, align]);
  const cols = Math.max(field?.cols ?? 0, lay.cols + px * 2);
  const rows = Math.max(field?.rows ?? 0, lay.rows + py * 2);
  const pitch = step ?? Math.max(3, fontSize / 9);
  const r = dot / 2;
  const d = useMemo(() => {
    let out = "";
    for (const [x, y] of lay.lit) {
      const cx = x + px + 0.5, cy = y + py + 0.5;
      out += square ? `M${cx - r} ${cy - r}h${dot}v${dot}h${-dot}z` : `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${dot} 0a${r} ${r} 0 1 0 ${-dot} 0`;
    }
    return out;
  }, [lay, px, py, r, dot, square]);

  /* the text steps in, column by column, once it is first seen */
  useEffect(() => {
    const el = ref.current, c = clip.current;
    if (!el || !c) return;
    const motion = el.closest("[data-rap-motion]")?.getAttribute("data-rap-motion") ?? "fun";
    if (motion === "still" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    c.setAttribute("width", "0");
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      // six steps over half a second, by the clock (a late tick catches up, never lags)
      const t0 = performance.now();
      timer = window.setInterval(() => {
        const step = Math.min(6, Math.floor((performance.now() - t0) / 83) + 1);
        c.setAttribute("width", String((cols * step) / 6));
        if (step >= 6) window.clearInterval(timer);
      }, 1000 / 12);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
      c.setAttribute("width", String(cols));
    };
  }, [cols, d]);

  return (
    <svg
      ref={ref}
      data-slot="dot-text"
      data-matrix=""
      role="img"
      aria-label={children}
      viewBox={`0 0 ${cols} ${rows}`}
      width={cols * pitch}
      className={cn("rap-dot-text inline-block h-auto max-w-full", className)}
      style={style as CSSProperties}
      {...rest}
    >
      {off && (
        <>
          <defs>
            <pattern id={id} width="1" height="1" patternUnits="userSpaceOnUse">
              {square ? <rect x={0.5 - r} y={0.5 - r} width={dot} height={dot} className="rap-dot-text-off" /> : <circle cx="0.5" cy="0.5" r={r} className="rap-dot-text-off" />}
            </pattern>
          </defs>
          <rect width={cols} height={rows} fill={`url(#${id})`} />
        </>
      )}
      <clipPath id={`${id}-c`}>
        <rect ref={clip} width={cols} height={rows} />
      </clipPath>
      <path d={d} fill="currentColor" clipPath={`url(#${id}-c)`} />
    </svg>
  );
}

/* ── face mode: a typeface sampled into dots ── */
function FaceText({ children, fontSize = 120, step, dot = 0.74, weight = 600, family, matrix: _m, off: _o, field: _fi, pad: _p, wrap: _wr, align: _a, square: _s, className, style, ...rest }: DotTextProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [geo, setGeo] = useState<{ w: number; h: number; dots: Dot[] } | null>(null);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [calm, setCalm] = useState(false);
  const pitch = step ?? Math.max(3, Math.round(fontSize / 16));

  useLayoutEffect(() => setCalm(isMotionCalm(ref.current)), []);

  useEffect(() => {
    let alive = true;
    const el = ref.current;
    const fam = family ?? (el ? getComputedStyle(el).getPropertyValue("--rap-font-display").trim() : "") ?? "sans-serif";
    const font = `${weight} ${fontSize}px ${fam || "sans-serif"}`;
    const draw = () => {
      if (!alive) return;
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.font = font;
      const w = Math.ceil(ctx.measureText(children).width + pitch * 2);
      const h = Math.ceil(fontSize * 1.2);
      c.width = w;
      c.height = h;
      ctx.font = font;
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000";
      ctx.fillText(children, pitch, h / 2);
      const data = ctx.getImageData(0, 0, w, h).data;
      const dots: Dot[] = [];
      let k = 0;
      for (let y = pitch / 2; y < h; y += pitch)
        for (let x = pitch / 2; x < w; x += pitch) {
          if (data[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 120) {
            const n = Math.sin(++k * 12.9898 + x * 0.17) * 43758.5453;
            dots.push({ x, y, r: n - Math.floor(n) });
          }
        }
      setGeo({ w, h, dots });
    };
    // draw with the real face: wait for it, then sample (falls back after a moment)
    if (document.fonts?.load) document.fonts.load(font).then(draw, draw);
    else draw();
    return () => {
      alive = false;
    };
  }, [children, fontSize, pitch, weight, family]);

  const rad = (pitch * dot) / 2;
  return (
    <svg
      ref={ref}
      data-slot="dot-text"
      role="img"
      aria-label={children}
      viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : `0 0 ${fontSize} ${fontSize}`}
      width={geo?.w}
      className={cn("rap-dot-text inline-block h-auto max-w-full fill-current", calm ? "rap-dot-text-calm" : "", className)}
      style={style as CSSProperties}
      onPointerMove={(e) => {
        if (calm || !ref.current || !geo) return;
        const b = ref.current.getBoundingClientRect();
        setLens({ x: ((e.clientX - b.left) / b.width) * geo.w, y: ((e.clientY - b.top) / b.height) * geo.h });
      }}
      onPointerLeave={() => setLens(null)}
      {...rest}
    >
      {geo?.dots.map((d, i) => {
        const near = lens ? Math.hypot(d.x - lens.x, d.y - lens.y) : Infinity;
        const swell = near < pitch * 6 ? 1 + (1 - near / (pitch * 6)) * 0.55 : 1;
        return (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={rad * swell}
            style={{ "--d": calm ? (d.x / geo.w).toFixed(3) : d.r.toFixed(3) } as CSSProperties}
          />
        );
      })}
    </svg>
  );
}
