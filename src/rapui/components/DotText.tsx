/* ══ DotText ══════════════════════════════════════════════
   A word set in dots, like a stadium board or a dot-matrix
   printer. The text is drawn once into an offscreen canvas in the
   page's display face, sampled on a grid, and every inked cell
   becomes a dot — so it is real type, just made of points.

   `step` is the grid pitch in px (smaller = finer), `dot` the dot
   diameter as a share of the step. The colour is currentColor.
   It stays accessible: the SVG carries the text as its label.

   Delight: the dots arrive. On mount they appear in a scatter —
   fun: each pops from nothing at its own random moment, so the
   word condenses like a signal locking on; calm: one quiet fade,
   left to right; still: it is simply there. Hover (fun only):
   the dots near the pointer swell, a lens dragged over a board. */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type SVGAttributes } from "react";
import { cn } from "../utils";
import { isMotionCalm } from "./FormField";
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
}

interface Dot {
  x: number;
  y: number;
  r: number; // 0..1 random, for staggering
}

export function DotText({ children, fontSize = 120, step, dot = 0.74, weight = 600, family, className, style, ...rest }: DotTextProps) {
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
