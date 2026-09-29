import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { isCalm } from "../hooks/useGlide";
import { useSound } from "../sound";
import { clamp, cn } from "../utils";
import { GalleryMedia, createLoop, galleryItemKey, spring, stepSpring, type GalleryItem, type GalleryOpen, type Spring } from "./galleryKit";

/* ══ Tilt gallery ═════════════════════════════════════════
   A grid of prints on a light table. Put your hand over one
   and it turns to look at you; its neighbours lean out of the
   way; press and it squashes like a card under a thumb.

   ── ONE LOOP, SIX SPRINGS A CARD ────────────────────────
   Every card owns rx/ry (tilt), tx/ty (lean away), s (press)
   and g (glare strength). The pointer only sets targets; one
   rAF loop for the whole grid walks the springs and writes
   `transform` + three custom properties straight onto the
   elements, so React does not render per frame, and the loop
   parks when every spring has settled.

   ── THE NUMBERS ─────────────────────────────────────────
   Tilt 10° by default: past ~14° a card's far edge
   foreshortens enough that the picture reads as distorted
   rather than turned. Perspective is 900px — about four card
   widths — which keeps the near edge from swelling (a short
   perspective is a fisheye). Tune 62 on the tilt: quick enough
   to track a hand, with one soft overshoot when it leaves.
   The lean is 3° and 6px, fading with the square of grid
   distance, so only the ring of direct neighbours really moves
   — any more and the grid looks like it is fleeing. The press
   is 0.955: a squash you feel, not a shrink you see.
   The glare is a white radial at the pointer, soft-light
   blended so it brightens colour instead of greying it, and it
   fades in with its own spring so it never pops on.

   Calm / reduced motion: flat cards, no glare, no lean; focus
   and click behave exactly the same. Sound (opt-in): a very
   quiet notch as the hand crosses into a new card, a tap on
   press. */

const TILT_TUNE = 62;
const LEAN_DEG = 3;
const LEAN_PX = 6;
const PRESS = 0.955;
const PERSPECTIVE = 900;

export interface TiltGalleryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  items: GalleryItem[];
  /** Minimum column width in px; the grid fills the row with as many as fit. */
  minWidth?: number;
  /** Card aspect ratio (width / height); pictures are cropped to it. */
  ratio?: number;
  /** Maximum tilt in degrees. */
  max?: number;
  /** Show the moving glare highlight. */
  glare?: boolean;
  /** Neighbours lean away from the hovered card. */
  lean?: boolean;
  /** Show title and caption under each picture. */
  captions?: boolean;
  /** Called when a card is clicked or activated with Enter/Space. */
  onOpen?: GalleryOpen;
}

type Card = { rx: Spring; ry: Spring; tx: Spring; ty: Spring; s: Spring; g: Spring; gx: number; gy: number };
const newCard = (): Card => ({ rx: spring(), ry: spring(), tx: spring(), ty: spring(), s: spring(100), g: spring(), gx: 50, gy: 50 });

export const TiltGallery = forwardRef<HTMLDivElement, TiltGalleryProps>(function TiltGallery(
  { items, minWidth = 190, ratio = 4 / 5, max = 10, glare = true, lean = true, captions = true, onOpen, className, style, ...rest },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current!);
  const els = useRef<(HTMLElement | null)[]>([]);
  const cards = useRef<Card[]>([]);
  const hover = useRef(-1);
  const sound = useSound();

  if (cards.current.length !== items.length) cards.current = items.map((_, i) => cards.current[i] ?? newCard());

  const loop = useRef<ReturnType<typeof createLoop> | null>(null);
  if (!loop.current)
    loop.current = createLoop((dt) => {
      let moving = false;
      cards.current.forEach((c, i) => {
        const el = els.current[i];
        const m = [
          stepSpring(c.rx, TILT_TUNE, dt),
          stepSpring(c.ry, TILT_TUNE, dt),
          stepSpring(c.tx, 50, dt),
          stepSpring(c.ty, 50, dt),
          stepSpring(c.s, 70, dt),
          stepSpring(c.g, 40, dt),
        ].some(Boolean);
        moving ||= m;
        if (!el) return;
        el.style.transform = `translate3d(${c.tx.x.toFixed(2)}px, ${c.ty.x.toFixed(2)}px, 0) rotateX(${c.rx.x.toFixed(2)}deg) rotateY(${c.ry.x.toFixed(2)}deg) scale(${(c.s.x / 100).toFixed(4)})`;
        el.style.setProperty("--tg-gx", `${c.gx.toFixed(1)}%`);
        el.style.setProperty("--tg-gy", `${c.gy.toFixed(1)}%`);
        el.style.setProperty("--tg-g", (c.g.x / 100).toFixed(3));
      });
      return moving;
    });
  useEffect(() => () => loop.current?.stop(), []);

  /* aim every card: the hovered one at the pointer, the rest away from it */
  const aim = useCallback(
    (index: number, px = 0.5, py = 0.5) => {
      const calm = isCalm(root.current);
      const hot = els.current[index];
      const hr = hot?.getBoundingClientRect();
      cards.current.forEach((c, i) => {
        if (calm || index < 0) {
          c.rx.to = c.ry.to = c.tx.to = c.ty.to = c.g.to = 0;
          return;
        }
        if (i === index) {
          // pointer at the right edge turns the right edge away: rotateY follows x, rotateX against y
          c.ry.to = (px - 0.5) * 2 * max;
          c.rx.to = -(py - 0.5) * 2 * max;
          c.tx.to = c.ty.to = 0;
          c.g.to = glare ? 100 : 0;
          c.gx = px * 100;
          c.gy = py * 100;
          return;
        }
        c.g.to = 0;
        c.rx.to = c.ry.to = 0;
        const el = els.current[i];
        if (!lean || !el || !hr) {
          c.tx.to = c.ty.to = 0;
          return;
        }
        const r = el.getBoundingClientRect();
        const dx = (r.left + r.width / 2 - (hr.left + hr.width / 2)) / hr.width;
        const dy = (r.top + r.height / 2 - (hr.top + hr.height / 2)) / hr.height;
        const d2 = dx * dx + dy * dy;
        const fall = 1 / (1 + d2 * d2); // ≈0.5 for direct neighbours, ≈0.06 two away
        const len = Math.sqrt(d2) || 1;
        c.tx.to = (dx / len) * LEAN_PX * fall;
        c.ty.to = (dy / len) * LEAN_PX * fall;
        // lean: the edge nearest the hovered card lifts away from it
        c.ry.to = (dx / len) * LEAN_DEG * fall;
        c.rx.to = -(dy / len) * LEAN_DEG * fall;
      });
      loop.current!.kick();
    },
    [glare, lean, max],
  );

  const onMove = (i: number) => (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    if (hover.current !== i) {
      hover.current = i;
      sound.detent(0.25, { pitch: 1 + (i % 5) * 0.06 });
    }
    // measured on the untransformed wrapper, so the tilt never feeds back into the aim
    aim(i, clamp((e.clientX - r.left) / r.width, 0, 1), clamp(((e.clientY - r.top) * ratio) / r.width, 0, 1));
  };
  const onLeave = () => {
    hover.current = -1;
    aim(-1);
  };
  const press = (i: number, down: boolean) => {
    const c = cards.current[i];
    if (!c) return;
    c.s.to = down && !isCalm(root.current) ? PRESS * 100 : 100;
    loop.current!.kick();
  };

  return (
    <div
      ref={root}
      data-slot="tilt-gallery"
      data-gallery=""
      className={cn("grid w-full gap-4 grid-cols-[repeat(auto-fill,minmax(min(var(--tg-min),100%),1fr))]", className)}
      style={{ "--tg-min": `${minWidth}px`, ...style } as CSSProperties}
      onPointerLeave={onLeave}
      {...rest}
    >
      {items.map((item, i) => {
        const Tag = onOpen ? "button" : "div";
        return (
          <div
            key={galleryItemKey(item, i)}
            data-slot="tilt-gallery-cell"
            className="flex flex-col gap-2.5 min-w-0"
            style={{ perspective: PERSPECTIVE }}
            onPointerMove={onMove(i)}
          >
            <Tag
              ref={(el: HTMLElement | null) => {
                els.current[i] = el;
              }}
              data-slot="tilt-gallery-card"
              data-gallery-index={i}
              {...(onOpen
                ? {
                    type: "button" as const,
                    "aria-label": item.alt,
                    onClick: (e: ReactMouseEvent<HTMLElement>) => {
                      sound.play("tap", { strength: 0.5 });
                      onOpen(i, e.currentTarget);
                    },
                  }
                : { role: "img", "aria-label": item.alt })}
              onPointerDown={() => press(i, true)}
              onPointerUp={() => press(i, false)}
              onPointerCancel={() => press(i, false)}
              onPointerLeave={() => press(i, false)}
              onFocus={() => aim(i, 0.5, 0.35)}
              onBlur={() => aim(-1)}
              className={cn(
                "group/tg relative block w-full p-0 border-0 overflow-hidden rounded-card bg-paper-3 text-left",
                "aspect-(--tg-ratio) [transform-style:preserve-3d] will-change-transform",
                onOpen && "cursor-pointer",
                "outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring",
              )}
              style={{ "--tg-ratio": ratio } as CSSProperties}
            >
              <GalleryMedia item={item} />
              {/* the glare: a soft white disc at the pointer, soft-light so it brightens colour */}
              <span
                data-slot="tilt-gallery-glare"
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 opacity-(--tg-g,0) mix-blend-soft-light",
                  "bg-[radial-gradient(circle_at_var(--tg-gx,50%)_var(--tg-gy,50%),rgb(255_255_255/0.95),rgb(255_255_255/0.3)_30%,transparent_60%)]",
                )}
              />
            </Tag>
            {captions && (item.title || item.caption) && (
              <div data-slot="tilt-gallery-caption" className="flex flex-col gap-0.5 px-1 font-sans tracking-[-0.01em]">
                {item.title && <span className="text-[0.9375rem] font-medium text-ink leading-tight">{item.title}</span>}
                {item.caption && <span className="text-[0.8125rem] text-mute leading-snug">{item.caption}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
