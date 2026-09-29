import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { isCalm } from "../hooks/useGlide";
import { useSound } from "../sound";
import { clamp, cn } from "../utils";
import { GalleryMedia, createLoop, galleryItemKey, setSpring, spring, stepSpring, type GalleryItem, type GalleryOpen } from "./galleryKit";

/* ══ Warp strip ═══════════════════════════════════════════
   A strip of prints you can throw sideways. The faster it
   travels the more the prints lean back and stretch — like a
   rubber sheet dragged across a table — and when it stops they
   spring upright with one wobble.

   ── VELOCITY IS THE ONLY INPUT ──────────────────────────
   The distortion is read off the scroll position, not off the
   pointer, so a mouse drag, a trackpad swipe, a touch fling, a
   wheel and the arrow keys all warp alike. One rAF loop samples
   the position each frame while anything moves, turns the
   difference into px/frame and hands it to two springs (skew
   and stretch) that write two custom properties on the track;
   every card reads them in CSS. Nothing re-renders, and the
   loop parks when the strip and both springs are at rest.

   ── THE NUMBERS ─────────────────────────────────────────
   Skew is 0.3° per px/frame, capped at `skew` (10°): a flick
   runs 40–60px a frame and should hit the cap; a slow read-
   along (3–5px) should barely lean, or reading becomes
   seasick. Stretch is 0.5% per px/frame capped at +`stretch`
   (12%) — a squash-and-stretch you notice on a fling and
   never while scanning. The springs are tune 58: one visible
   overshoot on the way back to upright, the "boing", then
   still. The lean is AGAINST the motion — tops trail — which
   is what reads as speed (a leaning-forward card reads as
   falling over).

   Mouse drags get momentum (touch already has it natively):
   release velocity decays 5% a frame, i.e. a 40px/frame flick
   glides ~800px over ~1s, about three cards. There is no
   snapping: a strip you throw should land where physics puts
   it, not be dragged back to a grid.

   Calm / reduced motion: no warp and no mouse momentum — the
   strip is a plain scroller (drag, wheel, keys still work).
   Sound (opt-in): a notch for each card that passes, firmer
   the faster it goes. */

const SKEW_PER = 0.3;
const STRETCH_PER = 0.005;
const WARP_TUNE = 58;
const FRICTION = 0.95;

export interface WarpStripProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  items: GalleryItem[];
  /** Horizontal strip (skews on X) or vertical column (skews on Y). */
  direction?: "horizontal" | "vertical";
  /** Card height (horizontal) or width (vertical), px. Its other side follows the picture's ratio. */
  size?: number;
  /** Height of the vertical viewport, px. */
  length?: number;
  /** Maximum skew, degrees. */
  skew?: number;
  /** Maximum stretch along the motion, 0..0.3. */
  stretch?: number;
  /** Space between cards, px. */
  gap?: number;
  captions?: boolean;
  /** Fade the strip out at its two ends instead of cutting the cards off. */
  fade?: boolean;
  onOpen?: GalleryOpen;
}

export const WarpStrip = forwardRef<HTMLDivElement, WarpStripProps>(function WarpStrip(
  {
    items,
    direction = "horizontal",
    size = 300,
    length = 520,
    skew = 10,
    stretch = 0.12,
    gap = 12,
    captions = true,
    fade = true,
    onOpen,
    className,
    style,
    "aria-label": ariaLabel = "Gallery strip",
    ...rest
  },
  ref,
) {
  const vertical = direction === "vertical";
  const scroller = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => scroller.current!);
  const track = useRef<HTMLDivElement>(null);
  const sound = useSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const st = useRef({
    last: 0,
    vel: 0,
    momentum: 0,
    dragging: false,
    skew: spring(0),
    stretch: spring(0), // in 0..100 (%) so the spring's snap threshold is meaningful
    notch: 0,
    quiet: 0,
  });
  const cfg = useRef({ skew, stretch, vertical, step: size * 0.8 + gap });
  cfg.current = { skew, stretch, vertical, step: size * 0.8 + gap };

  const pos = () => {
    const el = scroller.current!;
    return cfg.current.vertical ? el.scrollTop : el.scrollLeft;
  };
  const setPos = (v: number) => {
    const el = scroller.current!;
    if (cfg.current.vertical) el.scrollTop = v;
    else el.scrollLeft = v;
  };

  const loop = useRef<ReturnType<typeof createLoop> | null>(null);
  if (!loop.current)
    loop.current = createLoop((dt) => {
      const s = st.current;
      const el = scroller.current;
      const tr = track.current;
      if (!el || !tr) return false;
      const calm = isCalm(el);
      // mouse momentum
      if (s.momentum && !s.dragging) {
        const before = pos();
        setPos(before + s.momentum * dt);
        s.momentum *= Math.pow(FRICTION, dt);
        if (Math.abs(s.momentum) < 0.2 || pos() === before) s.momentum = 0;
      }
      const p = pos();
      const v = (p - s.last) / dt;
      s.last = p;
      s.vel = v;
      // a notch per card passed
      const notch = Math.floor(p / cfg.current.step);
      if (notch !== s.notch) {
        s.notch = notch;
        if (Math.abs(v) > 1) soundRef.current.detent(clamp(Math.abs(v) / 40, 0.2, 1));
      }
      const { skew: max, stretch: maxStretch } = cfg.current;
      s.skew.to = calm ? 0 : clamp(-v * SKEW_PER, -max, max);
      s.stretch.to = calm ? 0 : Math.min(maxStretch * 100, Math.abs(v) * STRETCH_PER * 100);
      if (calm) {
        setSpring(s.skew, 0);
        setSpring(s.stretch, 0);
      }
      const a = stepSpring(s.skew, WARP_TUNE, dt);
      const b = stepSpring(s.stretch, WARP_TUNE, dt);
      tr.style.setProperty("--ws-skew", `${s.skew.x.toFixed(2)}deg`);
      tr.style.setProperty("--ws-stretch", (1 + s.stretch.x / 100).toFixed(4));
      // keep running a few frames after the last movement so a scroll that pauses isn't mistaken for a stop
      if (Math.abs(v) > 0.05) s.quiet = 0;
      else s.quiet += 1;
      return a || b || s.dragging || !!s.momentum || s.quiet < 4;
    });
  useEffect(() => () => loop.current?.stop(), []);

  const wake = useCallback(() => {
    const s = st.current;
    if (!loop.current!.running) {
      s.last = pos();
      s.quiet = 0;
    }
    loop.current!.kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── mouse drag with momentum (touch scrolls natively) ─── */
  const drag = useRef<{ id: number; start: number; pos0: number; samples: { t: number; p: number }[]; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const coord = (e: ReactPointerEvent) => (vertical ? e.clientY : e.clientX);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    st.current.momentum = 0;
    drag.current = { id: e.pointerId, start: coord(e), pos0: pos(), samples: [{ t: e.timeStamp, p: coord(e) }], moved: false };
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const delta = coord(e) - d.start;
    if (!d.moved) {
      if (Math.abs(delta) < 5) return;
      d.moved = true;
      st.current.dragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      wake();
    }
    d.samples.push({ t: e.timeStamp, p: coord(e) });
    if (d.samples.length > 6) d.samples.shift();
    setPos(d.pos0 - delta);
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    suppressClick.current = true;
    const s = st.current;
    s.dragging = false;
    const a = d.samples[0];
    const b = d.samples[d.samples.length - 1];
    const v = (b.p - a.p) / Math.max(1, b.t - a.t); // px/ms
    if (!isCalm(scroller.current) && e.timeStamp - b.t < 80) s.momentum = -v * 16.67;
    wake();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const fwd = vertical ? "ArrowDown" : "ArrowRight";
    const back = vertical ? "ArrowUp" : "ArrowLeft";
    if (e.key !== fwd && e.key !== back) return;
    e.preventDefault();
    const by = (e.key === fwd ? 1 : -1) * (size * 0.8 + gap) * (e.shiftKey ? 3 : 1);
    scroller.current?.scrollBy({ [vertical ? "top" : "left"]: by, behavior: isCalm(scroller.current) ? "auto" : "smooth" });
  };

  return (
    <div
      ref={scroller}
      data-slot="warp-strip"
      data-gallery=""
      data-direction={direction}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      onScroll={wake}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onKeyDown={onKey}
      className={cn(
        "relative w-full min-w-0 overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none",
        "rounded-card outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring",
        vertical ? "overflow-y-auto overflow-x-hidden" : "overflow-x-auto overflow-y-hidden",
        "cursor-grab active:cursor-grabbing",
        /* soft ends: cards slide out of sight rather than hitting an edge (28px ≈ a card's corner radius) */
        fade &&
          (vertical
            ? "[mask-image:linear-gradient(to_bottom,transparent,black_28px,black_calc(100%-28px),transparent)]"
            : "[mask-image:linear-gradient(to_right,transparent,black_28px,black_calc(100%-28px),transparent)]"),
        className,
      )}
      style={{ ...(vertical ? { height: length } : null), ...style }}
      {...rest}
    >
      <div
        ref={track}
        data-slot="warp-strip-track"
        className={cn("flex", vertical ? "flex-col items-center py-8" : "w-max flex-row items-start px-8")}
        style={{ gap } as CSSProperties}
      >
        {items.map((item, i) => {
          const r = item.ratio ?? 4 / 5;
          const box = vertical ? { width: size, height: size / r } : { width: size * r, height: size };
          const Tag = onOpen ? "button" : "div";
          return (
            <figure key={galleryItemKey(item, i)} data-slot="warp-strip-item" className="m-0 flex flex-col gap-2 shrink-0" style={{ width: box.width }}>
              <Tag
                data-slot="warp-strip-card"
                data-gallery-index={i}
                {...(onOpen
                  ? {
                      type: "button" as const,
                      "aria-label": item.alt,
                      onClick: (e: { currentTarget: HTMLElement }) => {
                        sound.play("tap", { strength: 0.5 });
                        onOpen(i, e.currentTarget);
                      },
                    }
                  : { role: "img", "aria-label": item.alt })}
                className={cn(
                  "relative block p-0 border-0 overflow-hidden rounded-card bg-paper-3 will-change-transform",
                  onOpen && "cursor-[inherit]",
                  "outline-offset-3 focus-visible:outline-2 focus-visible:outline-ring",
                  vertical
                    ? "[transform:skewY(var(--ws-skew,0deg))_scaleY(var(--ws-stretch,1))]"
                    : "[transform:skewX(var(--ws-skew,0deg))_scaleX(var(--ws-stretch,1))]",
                )}
                style={box}
              >
                <GalleryMedia item={item} />
              </Tag>
              {captions && (item.title || item.caption) && (
                <figcaption data-slot="warp-strip-caption" className="flex flex-col px-1 font-sans tracking-[-0.01em] min-w-0">
                  {item.title && <span className="text-[0.9375rem] font-medium text-ink leading-tight truncate">{item.title}</span>}
                  {item.caption && <span className="text-[0.8125rem] text-mute leading-snug truncate">{item.caption}</span>}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
});
