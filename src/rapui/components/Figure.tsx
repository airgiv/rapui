/* ══ Figure ═══════════════════════════════════════════════
   A thin-line 3D figure — a cube, a torus, a trefoil knot, a
   double helix — drawn as hairlines in SVG and slowly
   turning on its stand, the way an engraving of a solid would
   if it could move.

     <Figure shape="icosahedron" size={160} />

   A tiny projector, no 3D library: each shape is a set of 3D
   polylines (figureShapes.ts), rotated, projected (isometric by
   default, or with perspective) and split by depth into four
   layers, so the lines at the back are fainter than the ones in
   front — or dashed, or gone (`backLines`). Lines are currentColor;
   `accent` lines (the equator, the knot, the inner gimbal) take
   the accent colour. Strokes stay hairline at any size.

   Looks follow the preset: fun draws a touch heavier with the
   accent on; signal marks every vertex with a dot and dashes the
   hidden lines, like a plotter; civic, product and minimal stay
   one plain hairline in ink.

   Delight (fun): it turns on its own; grab it and spin it, and
   it carries on with the spin you gave it and eases back to its
   own pace. Calm: a slow turn, dragging turns it but
   lets go without a throw. Still / reduced motion: one fixed
   isometric view. Off screen it stops drawing. */
import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type PointerEvent } from "react";
import { usePreset } from "../hooks/usePreset";
import { cn } from "../utils";
import { FIGURE_SHAPES, SHAPES, type FigureShape, type ShapeDef, type ShapeFrame, type Vec3 } from "./figureShapes";

export { FIGURE_SHAPES, type FigureShape };

export type FigureHidden = "fade" | "dash" | "none" | "show";
export type FigureLook = "line" | "plot";

export interface FigureProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  shape?: FigureShape;
  /** Width and height, px. */
  size?: number;
  /** Stroke width in screen px (it doesn't scale with the figure). */
  strokeWidth?: number;
  /** Turn speed, degrees per second; 0 holds it still. */
  speed?: number;
  /** The starting turn and tilt, degrees. Tilt defaults to the shape's best view. */
  yaw?: number;
  pitch?: number;
  /** iso: parallel lines stay parallel (an engraving); perspective: they meet. */
  projection?: "iso" | "perspective";
  /** What happens to the lines at the back: fainter, dashed, gone, or as strong as the front. */
  backLines?: FigureHidden;
  /** line: plain hairlines; plot: plus a dot on every vertex (signal's default). */
  look?: FigureLook;
  /** Draw the shape's accent lines in the accent colour. */
  accent?: boolean;
  /** Drag to turn it. */
  interactive?: boolean;
  /** Accessible name; defaults to "<shape>, a turning line drawing". Pass "" for decoration. */
  label?: string;
}

const DEG = Math.PI / 180;
const ISO_PITCH = Math.atan(Math.SQRT1_2) / DEG; // 35.26°: the true isometric tilt
const OPACITY = [0.16, 0.38, 0.68, 1];

interface Proj {
  x: number;
  y: number;
  z: number;
}

function project([x, y, z]: Vec3, yaw: number, pitch: number, persp: boolean): Proj {
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const y2 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  const k = persp ? 3.6 / (3.6 - z2) : 1;
  return { x: x1 * k, y: -y2 * k, z: z2 };
}

const f = (n: number) => n.toFixed(2);

/* the polylines as four path strings by depth (back → front), plus vertex dots */
function render(frame: ShapeFrame, yaw: number, pitch: number, persp: boolean, hidden: FigureHidden) {
  const layers = (lines: Vec3[][]) => {
    const out = ["", "", "", ""];
    for (const line of lines) {
      let prevBucket = -1;
      let prev = project(line[0], yaw, pitch, persp);
      for (let i = 1; i < line.length; i++) {
        const p = project(line[i], yaw, pitch, persp);
        const z = (prev.z + p.z) / 2;
        const b = hidden === "show" ? 3 : Math.max(0, Math.min(3, Math.floor(((z + 1.05) / 2.1) * 4)));
        if (b !== prevBucket) out[b] += `M${f(prev.x)} ${f(prev.y)}`;
        out[b] += `L${f(p.x)} ${f(p.y)}`;
        prevBucket = b;
        prev = p;
      }
    }
    return out;
  };
  return { main: layers(frame.lines), accent: layers(frame.accent ?? []) };
}

/* the corners worth a dot: polyline ends (edges) — but not every point of a curve */
function vertices(frame: ShapeFrame): Vec3[] {
  const seen = new Map<string, Vec3>();
  for (const line of [...frame.lines, ...(frame.accent ?? [])])
    if (line.length <= 5)
      for (const p of line) {
        const k = p.map((c) => c.toFixed(3)).join();
        if (!seen.has(k)) seen.set(k, p);
      }
  return [...seen.values()];
}

export function Figure({
  shape = "cube",
  size = 160,
  strokeWidth,
  speed = 16,
  yaw = 30,
  pitch,
  projection = "iso",
  backLines,
  look,
  accent,
  interactive = true,
  label,
  className,
  style,
  ...rest
}: FigureProps) {
  const ref = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const { preset, motion } = usePreset(ref);
  const def: ShapeDef = SHAPES[shape];
  const plot = (look ?? (preset === "signal" ? "plot" : "line")) === "plot";
  const hide = backLines ?? (preset === "signal" ? "dash" : "fade");
  const useAccent = accent ?? preset !== "minimal";
  const sw = strokeWidth ?? (preset === "fun" ? 1.25 : 1);
  const tilt = (pitch ?? def.pitch ?? ISO_PITCH) * DEG;

  // live state for the loop, outside React: the angle, the spin velocity, the drag
  const live = useRef({ yaw: yaw * DEG, pitch: tilt, vel: 0, drag: null as null | { x: number; y: number; t: number }, t0: performance.now() });
  live.current.pitch = live.current.drag ? live.current.pitch : tilt;

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const paths = [...el.querySelectorAll<SVGPathElement>("[data-layer]")];
    const dots = el.querySelector<SVGPathElement>("[data-slot=figure-vertices]");
    const still = motion === "still" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const calm = motion === "calm";
    const base = (speed * DEG) / (calm ? 2.5 : 1);
    const statics = def.animated ? null : def.build(0);
    const vtx = plot ? vertices(statics ?? def.build(0)) : [];
    const s = live.current;
    if (still) {
      s.yaw = yaw * DEG;
      s.vel = 0;
    }

    const draw = (time: number) => {
      const frame = statics ?? def.build(still ? 1.2 : (time - s.t0) / 1000);
      const { main, accent: acc } = render(frame, s.yaw, s.pitch, projection === "perspective", hide);
      for (const p of paths) {
        const [kind, i] = p.dataset.layer!.split(":");
        p.setAttribute("d", (kind === "a" ? acc : main)[+i]);
      }
      if (dots) {
        let d = "";
        for (const v of vtx) {
          const q = project(v, s.yaw, s.pitch, projection === "perspective");
          d += `M${f(q.x)} ${f(q.y)}h0`;
        }
        dots.setAttribute("d", d);
      }
    };

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!s.drag) {
        // a thrown spin eases back to the figure's own pace
        s.vel += (base - s.vel) * Math.min(1, dt * (calm ? 8 : 1.6));
        s.yaw += s.vel * dt;
      }
      draw(now);
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    s.vel = base;
    draw(performance.now());
    if (still) return;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(el);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [def, speed, yaw, projection, hide, plot, motion]);

  // drag to turn: x turns, y tilts (within limits); in fun the release keeps the spin
  const onPointerDown = (e: PointerEvent) => {
    if (!interactive) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    live.current.drag = { x: e.clientX, y: e.clientY, t: performance.now() };
    live.current.vel = 0;
  };
  const onPointerMove = (e: PointerEvent) => {
    const s = live.current;
    if (!s.drag) return;
    const dx = e.clientX - s.drag.x,
      dy = e.clientY - s.drag.y;
    const now = performance.now();
    const k = 2.4 / size;
    s.yaw += dx * k;
    s.pitch = Math.max(-80 * DEG, Math.min(80 * DEG, s.pitch + dy * k));
    const dt = Math.max(8, now - s.drag.t) / 1000;
    s.vel = motion === "fun" ? Math.max(-12, Math.min(12, (dx * k) / dt)) : 0;
    s.drag = { x: e.clientX, y: e.clientY, t: now };
    if (motion === "still") s.vel = 0;
  };
  const onPointerUp = () => {
    live.current.drag = null;
  };

  const name = label ?? `${shape}, a turning line drawing`;
  const layers = [0, 1, 2, 3].filter((i) => !(hide === "none" && i < 2));
  const layerStyle = (i: number): { opacity: number; strokeDasharray?: string } =>
    hide === "dash" && i < 2 ? { opacity: 0.55, strokeDasharray: "2 3" } : hide === "show" ? { opacity: 1 } : { opacity: OPACITY[i] };

  return (
    <div
      ref={ref}
      data-slot="figure"
      data-shape={shape}
      role={name ? "img" : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      className={cn("inline-block shrink-0 text-ink select-none", interactive && "cursor-grab touch-none active:cursor-grabbing", className)}
      style={{ width: size, height: size, ...style } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      {...rest}
    >
      <svg ref={svg} viewBox="-1.25 -1.25 2.5 2.5" width="100%" height="100%" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="overflow-visible">
        {layers.map((i) => (
          <path key={`m${i}`} data-layer={`m:${i}`} stroke="currentColor" strokeWidth={sw} vectorEffect="non-scaling-stroke" style={layerStyle(i)} />
        ))}
        {layers.map((i) => (
          <path
            key={`a${i}`}
            data-layer={`a:${i}`}
            stroke={useAccent ? "var(--rap-accent)" : "currentColor"}
            strokeWidth={sw * (useAccent ? 1.2 : 1)}
            vectorEffect="non-scaling-stroke"
            style={layerStyle(i)}
          />
        ))}
        {plot && <path data-slot="figure-vertices" stroke="var(--rap-accent)" strokeWidth={sw * 4} vectorEffect="non-scaling-stroke" />}
      </svg>
    </div>
  );
}
