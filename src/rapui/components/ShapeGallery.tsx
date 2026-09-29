import { forwardRef, useMemo, type CSSProperties, type HTMLAttributes } from "react";
import { useSound } from "../sound";
import { cn } from "../utils";
import { GalleryMedia, galleryItemKey, springEasing, wobble, type GalleryItem, type GalleryOpen } from "./galleryKit";

/* ══ Shape gallery ════════════════════════════════════════
   Pictures cut out with scissors and pinned to a board: a
   circle, a pill, an arch, a blob, a scalloped sticker like the
   lib's rotating badges. Each lies a little crooked. Hover one
   and it lifts off the board, straightens up, and its cut-out
   MORPHS into another shape.

   ── HOW THE MORPH WORKS ─────────────────────────────────
   Every shape is the same polygon: 96 points sampled at the
   same 96 angles round the centre. Point k of the circle and
   point k of the arch are the same ray, so CSS can interpolate
   `clip-path: polygon()` point by point and the outline flows
   from one shape into the other instead of cross-fading. The
   shapes are signed-distance functions in the box's own
   aspect (a circle stays round in a portrait box), and each
   ray is bisected to the edge — computed once per aspect and
   shape, not per frame. 96 points: below ~64 the corners of
   the arch facet visibly; above it there is nothing to see.

   ── THE NUMBERS ─────────────────────────────────────────
   Rotations are ±5° (seeded, stable): enough to read as hand
   placed, not so much that a portrait looks like it is falling.
   The lift is 10px and 4%: a card coming off a pin, not a
   zoom. Morph, lift and straighten all ride one easing — a CSS
   `linear()` sampled from the library's own spring (tune 55,
   ~700ms) — so they overshoot together, as one gesture.

   Calm / reduced motion: shapes still cut the pictures (they
   are the design), but no rotation, no lift and no morph.
   Sound (opt-in): a small pop when a shape changes, a tap on
   click. */

export type GalleryShape = "circle" | "pill" | "arch" | "blob" | "flower" | "rect";
const SHAPES: GalleryShape[] = ["circle", "arch", "flower", "pill", "blob", "rect"];
/* which shape each one turns into on hover when `morph="swap"` */
const PARTNER: Record<GalleryShape, GalleryShape> = {
  circle: "flower",
  flower: "circle",
  arch: "pill",
  pill: "arch",
  blob: "circle",
  rect: "blob",
};
/* the box each shape is cut from: round things from a square, tall things from a portrait */
const BOX: Record<GalleryShape, number> = { circle: 1, flower: 1, blob: 1, arch: 0.74, pill: 0.62, rect: 0.8 };

const POINTS = 96;

/* signed distance to each shape, in a box of half-size (a, 1) with a = w/h */
function sdRoundBox(x: number, y: number, a: number, b: number, rTop: number, rBot: number) {
  const r = y < 0 ? rTop : rBot;
  const qx = Math.abs(x) - a + r;
  const qy = Math.abs(y) - b + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
function sdf(shape: GalleryShape, x: number, y: number, a: number) {
  const m = Math.min(a, 1);
  switch (shape) {
    case "circle":
      return Math.hypot(x, y) - m;
    case "pill":
      return sdRoundBox(x, y, a, 1, m, m);
    case "arch":
      return sdRoundBox(x, y, a, 1, m, m * 0.12);
    case "rect":
      return sdRoundBox(x, y, a, 1, m * 0.16, m * 0.16);
    case "blob": {
      const t = Math.atan2(y, x);
      return Math.hypot(x, y) - m * 0.86 * (1 + 0.07 * Math.sin(3 * t + 0.8) + 0.05 * Math.cos(5 * t - 0.4));
    }
    case "flower": {
      const t = Math.atan2(y, x);
      return Math.hypot(x, y) - m * (0.9 + 0.1 * Math.cos(12 * t));
    }
  }
}

const cache = new Map<string, string>();
/** The shape as a 96-point `polygon()` in percentages of its box. */
export function shapePolygon(shape: GalleryShape, ratio: number): string {
  const key = `${shape}:${ratio.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const a = ratio;
  const pts: string[] = [];
  for (let k = 0; k < POINTS; k++) {
    const t = (k / POINTS) * Math.PI * 2 - Math.PI / 2;
    const dx = Math.cos(t);
    const dy = Math.sin(t);
    let lo = 0;
    let hi = Math.hypot(a, 1) * 1.2;
    for (let it = 0; it < 22; it++) {
      const mid = (lo + hi) / 2;
      if (sdf(shape, dx * mid, dy * mid, a) < 0) lo = mid;
      else hi = mid;
    }
    const x = 50 + ((dx * lo) / a) * 50;
    const y = 50 + dy * lo * 50;
    pts.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  const out = `polygon(${pts.join(",")})`;
  cache.set(key, out);
  return out;
}

export interface ShapeGalleryItem extends GalleryItem {
  /** The cut-out; by default the gallery cycles through the shapes. */
  shape?: GalleryShape;
}

export interface ShapeGalleryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  items: ShapeGalleryItem[];
  /** Base size of a piece, px (the collage varies it ±15%). */
  size?: number;
  /** What the cut-out becomes on hover: its partner shape ("swap"), a fixed shape, or nothing. */
  morph?: "swap" | "none" | GalleryShape;
  /** Resting rotation, degrees. */
  tilt?: number;
  captions?: boolean;
  onOpen?: GalleryOpen;
}

const EASE = springEasing(55);

export const ShapeGallery = forwardRef<HTMLDivElement, ShapeGalleryProps>(function ShapeGallery(
  { items, size = 200, morph = "swap", tilt = 5, captions = true, onOpen, className, style, ...rest },
  ref,
) {
  const sound = useSound();
  const pieces = useMemo(
    () =>
      items.map((item, i) => {
        const shape = item.shape ?? SHAPES[i % SHAPES.length];
        const hover = morph === "swap" ? PARTNER[shape] : morph === "none" ? shape : morph;
        const box = BOX[shape];
        const scale = 1 + wobble(i, 4.7) * 0.15;
        const w = Math.round(size * scale * Math.sqrt(box));
        return {
          item,
          shape,
          hover,
          w,
          h: Math.round(w / box),
          rot: wobble(i, 1.9) * tilt,
          dy: wobble(i, 3.3) * 14,
          from: shapePolygon(shape, box),
          to: shapePolygon(hover, box),
        };
      }),
    [items, morph, size, tilt],
  );

  return (
    <div
      data-slot="shape-gallery"
      data-gallery=""
      ref={ref}
      className={cn("flex flex-wrap justify-center items-center gap-x-[clamp(0.5rem,2vw,1.75rem)] gap-y-6 w-full py-4", className)}
      style={{ "--sg-ease": EASE.easing, "--sg-dur": `${EASE.ms}ms`, ...style } as CSSProperties}
      {...rest}
    >
      {pieces.map((pc, i) => {
        const Tag = onOpen ? "button" : "div";
        return (
          <Tag
            key={galleryItemKey(pc.item, i)}
            data-slot="shape-gallery-piece"
            data-shape={pc.shape}
            {...(onOpen
              ? {
                  type: "button" as const,
                  "aria-label": pc.item.alt,
                  onClick: (e: { currentTarget: HTMLElement }) => {
                    sound.play("tap", { strength: 0.5 });
                    const media = e.currentTarget.querySelector<HTMLElement>("[data-gallery-index]");
                    onOpen(i, media ?? e.currentTarget);
                  },
                }
              : { role: "img", "aria-label": pc.item.alt })}
            onPointerEnter={() => pc.hover !== pc.shape && sound.play("pop", { strength: 0.2, pitch: 1.2 + (i % 4) * 0.08 })}
            className={cn(
              "group/sg relative flex flex-col items-center gap-2 p-0 border-0 bg-transparent font-sans text-left max-w-full",
              onOpen && "cursor-pointer",
              "outline-none [--sg-rot:0deg] [--sg-dy:0px]",
              /* lying crooked on the board, straightening and lifting under the hand */
              "fun:[--sg-rot:var(--sg-rot0)] fun:[--sg-dy:var(--sg-dy0)]",
              "[transform:translateY(var(--sg-dy))_rotate(var(--sg-rot))] [transition:transform_var(--sg-dur)_var(--sg-ease)]",
              "fun:hover:[transform:translateY(calc(var(--sg-dy)-10px))_rotate(0deg)_scale(1.04)] hover:z-10",
              "fun:focus-visible:[transform:translateY(calc(var(--sg-dy)-10px))_rotate(0deg)_scale(1.04)] focus-visible:z-10",
              /* focus: a ring hugging the cut-out (the clip is on the child, so the filter traces the shape) */
              "focus-visible:[filter:drop-shadow(0_0_1px_var(--rap-ring))_drop-shadow(0_0_1px_var(--rap-ring))_drop-shadow(0_0_1px_var(--rap-ring))]",
            )}
            style={{ "--sg-rot0": `${pc.rot.toFixed(2)}deg`, "--sg-dy0": `${pc.dy.toFixed(1)}px` } as CSSProperties}
          >
            <span
              data-slot="shape-gallery-cutout"
              data-gallery-index={i}
              className={cn(
                "relative block max-w-full overflow-hidden bg-paper-3",
                "[clip-path:var(--sg-from)] [transition:clip-path_var(--sg-dur)_var(--sg-ease)]",
                "fun:group-hover/sg:[clip-path:var(--sg-to)] fun:group-focus-visible/sg:[clip-path:var(--sg-to)]",
              )}
              style={{ width: pc.w, aspectRatio: `${pc.w} / ${pc.h}`, "--sg-from": pc.from, "--sg-to": pc.to } as CSSProperties}
            >
              <GalleryMedia item={pc.item} />
            </span>
            {captions && pc.item.title && (
              <span
                data-slot="shape-gallery-caption"
                className={cn(
                  "px-3 py-1 rounded-pill text-[0.8125rem] font-medium tracking-[-0.01em] text-ink bg-fill max-w-full truncate",
                  "transition-colors duration-(--rap-dur-fast) ease-rm group-hover/sg:bg-ink group-hover/sg:text-paper",
                  "group-focus-visible/sg:outline-2 group-focus-visible/sg:outline-ring group-focus-visible/sg:outline-offset-2",
                )}
              >
                {pc.item.title}
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
});
