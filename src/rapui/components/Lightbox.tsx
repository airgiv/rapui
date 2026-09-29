import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { isCalm, useGlide } from "../hooks/useGlide";
import { ArrowLeft, ArrowRight, X } from "../icons";
import { useSound } from "../sound";
import { clamp, cn } from "../utils";
import { GalleryMedia, createLoop, galleryItemKey, rubber, setSpring, spring, stepSpring, type GalleryItem, type GalleryOpen } from "./galleryKit";

/* ══ Lightbox ═════════════════════════════════════════════
   Pick a print up off the table and hold it to the light.
   Click a thumbnail and THAT picture leaves its place and grows
   to fill the screen while the room goes dark; swipe it aside
   for the next one; pull it down and it shrinks in your hand
   while the lights come back, and let go to put it back where
   it came from.

   ── ONE PICTURE, NOT TWO ────────────────────────────────
   The fly-out is a FLIP. The full-size picture is laid out
   first, then transformed back onto the thumbnail's rect and
   released: scale (uniform, cover — the thumbnail is usually a
   crop) plus a clip-path inset that crops it exactly as the
   thumbnail did, with the thumbnail's own corner radius. So at
   t = 0 it IS the thumbnail, pixel for pixel, and nothing
   cross-fades. Closing runs the same path backwards to the
   CURRENT picture's thumbnail (it may not be the one you
   opened); if that thumbnail is gone or off-screen, the
   picture shrinks and fades in place instead.

   ── ONE LOOP, FOUR NUMBERS ──────────────────────────────
   p (0..100, open), off (px, the track), drag (px, under the
   finger, no spring — lag under a finger feels broken) and dy
   (px, the pull-down). Scrim, chrome, FLIP and track are all
   readings of those, written straight to the DOM from one rAF
   loop that parks when they settle.

   ── THE NUMBERS ─────────────────────────────────────────
   Opening is tune 12 (damping ~0.7: one ~4% swell past full
   size, a landing — the library's usual 50 swells 20%, which
   on a full-screen picture reads as a zoom glitch); closing is
   tune 0 (~0.85, next to critical), because a picture that
   overshoots its thumbnail on the way home lands BESIDE its
   slot. A swipe commits past 18% of the width or
   0.4px/ms; the ends give like a rubber band (c = 0.55, the
   iOS constant: 100px of pull moves ~35px). Pull-down: the
   picture shrinks to 50% at a full screen height and the scrim
   loses 85% of its dark at half a height; letting go past
   110px or 0.5px/ms closes.

   Radix Dialog does the focus trap, Escape, scroll lock and
   gives focus back to the thumbnail. ←/→ step, Home/End jump.
   Calm / reduced motion: it opens and closes in place with no
   flight, swipes switch instantly, no pull-down (use Escape or
   the close button). Sound (opt-in): a pop as it opens, a
   whoosh per swipe, a soft bonk at either end, a drop on close. */

const OPEN_TUNE = 12;
const CLOSE_TUNE = 0;
const TRACK_TUNE = 50;
const GAP = 24;

export interface LightboxProps {
  items: GalleryItem[];
  /** The open picture, or null when closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  /** Called once the closing animation has finished. */
  onClose: () => void;
  /** The element it was opened from (a thumbnail) — the picture flies out of it. */
  origin?: HTMLElement | null;
  /** Where picture `i` lives on the page, for the flight home. Defaults to the
      `[data-gallery-index=i]` element in the same `[data-gallery]` as `origin`. */
  getOrigin?: (index: number) => HTMLElement | null | undefined;
  /** Show the thumbnail rail. */
  rail?: boolean;
  /** Accessible name of the dialog. */
  label?: string;
}

/** State + handlers for a Lightbox: `const lb = useLightbox(); <TiltGallery onOpen={lb.open}/> <Lightbox items={…} {...lb.props}/>` */
export function useLightbox() {
  const [index, setIndex] = useState<number | null>(null);
  const [origin, setOrigin] = useState<HTMLElement | null>(null);
  const open: GalleryOpen = useCallback((i, from) => {
    setOrigin(from ?? null);
    setIndex(i);
  }, []);
  const close = useCallback(() => setIndex(null), []);
  return { open, close, index, props: { index, origin, onIndexChange: setIndex, onClose: close } };
}

type Rect = { x: number; y: number; w: number; h: number; r: number };

const rectOf = (el: Element): Rect => {
  const b = el.getBoundingClientRect();
  const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return { x: b.left, y: b.top, w: b.width, h: b.height, r };
};
const visible = (el: HTMLElement | null | undefined): el is HTMLElement => {
  if (!el || !el.isConnected) return false;
  const b = el.getBoundingClientRect();
  if (b.width < 4 || b.height < 4) return false;
  if (b.bottom < 0 || b.right < 0 || b.top > window.innerHeight || b.left > window.innerWidth) return false;
  return getComputedStyle(el).opacity !== "0";
};

export function Lightbox({ items, index, onIndexChange, onClose, origin, getOrigin, rail = true, label = "Picture viewer" }: LightboxProps) {
  const n = items.length;
  const sound = useSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const [shown, setShown] = useState(false);
  const [cur, setCur] = useState(index ?? 0);

  const stage = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const chrome = useRef<(HTMLElement | null)[]>([]);
  const slides = useRef(new Map<number, HTMLDivElement>());
  const flip = useRef(new Map<number, HTMLDivElement>());

  const S = useRef({
    cur: index ?? 0,
    p: spring(0),
    off: spring(0),
    dy: spring(0),
    drag: 0,
    pTune: OPEN_TUNE,
    from: null as Rect | null,
    to: null as Rect | null,
    measure: true,
    closing: false,
    opener: null as HTMLElement | null,
    W: 0,
    H: 0,
  });

  const findOrigin = useCallback(
    (i: number) => {
      const custom = getOrigin?.(i);
      if (custom !== undefined) return custom;
      const scope = origin?.closest("[data-gallery]");
      return (scope?.querySelector<HTMLElement>(`[data-gallery-index="${i}"]`) ?? (i === S.current.cur ? origin : null)) || null;
    },
    [getOrigin, origin],
  );

  /* ── painting ─────────────────────────────────────────── */
  const paint = () => {
    const s = S.current;
    const st = stage.current;
    if (!st) return;
    if (s.measure) {
      s.W = st.clientWidth;
      s.H = st.clientHeight;
      const f = flip.current.get(s.cur);
      if (f) {
        f.style.transform = "none";
        f.style.clipPath = "none";
        s.to = rectOf(f);
        s.measure = false;
      }
    }
    const t = s.p.x / 100;
    const tc = clamp(t, 0, 1);
    const dismiss = clamp(Math.abs(s.dy.x) / (s.H * 0.5 || 1), 0, 1);
    if (scrim.current) scrim.current.style.opacity = String(tc * (1 - dismiss * 0.85));
    chrome.current.forEach((el) => el && (el.style.opacity = String(tc * (1 - dismiss))));

    // the track
    const x0 = s.off.x + s.drag;
    slides.current.forEach((el, j) => {
      el.style.transform = `translate3d(${((j - s.cur) * (s.W + GAP) + x0).toFixed(1)}px, 0, 0)`;
    });

    // the current picture: FLIP from its thumbnail + the pull-down
    const f = flip.current.get(s.cur);
    const T = s.to;
    if (!f || !T) return;
    const F = s.from;
    const shrink = 1 - clamp(s.dy.x / (s.H || 1), 0, 1) * 0.5;
    if (F) {
      const s0 = Math.max(F.w / T.w, F.h / T.h);
      const scale = s0 + (1 - s0) * t;
      const tx = (F.x + F.w / 2 - (T.x + T.w / 2)) * (1 - t);
      const ty = (F.y + F.h / 2 - (T.y + T.h / 2)) * (1 - t);
      const iw = F.w / s0 + (T.w - F.w / s0) * tc;
      const ih = F.h / s0 + (T.h - F.h / s0) * tc;
      const ix = Math.max(0, (T.w - iw) / 2);
      const iy = Math.max(0, (T.h - ih) / 2);
      const r = F.r / s0 + (T.r - F.r / s0) * tc;
      f.style.transform = `translate3d(${tx.toFixed(2)}px, ${(ty + s.dy.x).toFixed(2)}px, 0) scale(${(scale * shrink).toFixed(4)})`;
      f.style.clipPath = `inset(${iy.toFixed(2)}px ${ix.toFixed(2)}px round ${r.toFixed(2)}px)`;
      f.style.opacity = "1";
    } else {
      // nowhere to fly from (or to): grow and fade in place
      f.style.transform = `translate3d(0, ${s.dy.x.toFixed(2)}px, 0) scale(${((0.86 + 0.14 * t) * shrink).toFixed(4)})`;
      f.style.clipPath = "none";
      f.style.opacity = String(tc);
    }
  };

  const loop = useRef<ReturnType<typeof createLoop> | null>(null);
  const tickRef = useRef<(dt: number) => boolean>(() => false);
  if (!loop.current) loop.current = createLoop((dt) => tickRef.current(dt));
  useEffect(() => () => loop.current?.stop(), []);

  const finishClose = useRef<() => void>(() => {});
  finishClose.current = () => {
    S.current.closing = false;
    setShown(false);
    onClose();
  };

  tickRef.current = (dt) => {
    const s = S.current;
    const a = stepSpring(s.p, s.pTune, dt);
    const b = stepSpring(s.off, TRACK_TUNE, dt);
    const c = stepSpring(s.dy, s.closing ? CLOSE_TUNE : 55, dt);
    paint();
    if (s.closing && s.p.x <= 0.6) {
      finishClose.current();
      return false;
    }
    return a || b || c || s.measure;
  };

  /* ── open / close ─────────────────────────────────────── */
  const beginClose = useCallback(() => {
    const s = S.current;
    if (s.closing) return;
    s.closing = true;
    const calm = isCalm(stage.current);
    soundRef.current.play("drop", { strength: 0.4 });
    if (calm) {
      finishClose.current();
      return;
    }
    const el = findOrigin(s.cur);
    s.from = visible(el) ? rectOf(el) : null;
    s.measure = true; // the picture may have been swiped; lay it out again before flying home
    s.pTune = CLOSE_TUNE;
    s.p.to = 0;
    s.dy.to = 0;
    loop.current!.kick();
  }, [findOrigin]);

  // opening: index goes from null to a number
  useLayoutEffect(() => {
    const s = S.current;
    if (index === null) {
      if (shown && !s.closing) beginClose();
      return;
    }
    if (!shown || s.closing) {
      const el = origin && visible(origin) ? origin : findOrigin(index);
      s.closing = false;
      s.opener = document.activeElement as HTMLElement | null;
      s.cur = index;
      setCur(index);
      s.from = visible(el) ? rectOf(el) : null;
      s.to = null;
      s.measure = true;
      setSpring(s.off, 0);
      setSpring(s.dy, 0);
      s.drag = 0;
      s.pTune = OPEN_TUNE;
      if (isCalm(document.documentElement) || (origin && isCalm(origin))) {
        setSpring(s.p, 100);
      } else {
        setSpring(s.p, 0);
        s.p.to = 100;
      }
      setShown(true);
      soundRef.current.play("pop", { strength: 0.5 });
      loop.current!.kick();
    } else if (index !== s.cur) {
      go(index - s.cur, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  /* ── stepping ─────────────────────────────────────────── */
  const go = (delta: number, fromProp = false) => {
    const s = S.current;
    const next = clamp(s.cur + delta, 0, n - 1);
    if (next === s.cur) {
      soundRef.current.detent(0.6, { pitch: 0.6 });
      return;
    }
    const calm = isCalm(stage.current);
    // keep what is on screen where it is: the new track offset starts one slide (per step) back
    s.off.x = calm ? 0 : s.off.x + s.drag + (next - s.cur) * (s.W + GAP);
    s.off.to = 0;
    s.off.v = 0;
    s.drag = 0;
    s.cur = next;
    s.to = null;
    s.from = null; // the fly-out rect belonged to the picture it flew out of
    s.measure = true;
    setCur(next);
    if (!fromProp) onIndexChange(next);
    soundRef.current.play("whoosh", { strength: 0.3, pitch: 1.1 });
    loop.current!.kick();
  };

  // stage resizes: re-measure
  useEffect(() => {
    if (!shown) return;
    const onResize = () => {
      S.current.measure = true;
      loop.current!.kick();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [shown]);

  /* ── drag: sideways to step, down to dismiss ──────────── */
  const drag = useRef<{ id: number; x0: number; y0: number; axis: "x" | "y" | null; samples: { t: number; x: number; y: number }[] } | null>(null);
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || S.current.closing) return;
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, axis: null, samples: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }] };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const s = S.current;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.axis) {
      if (Math.hypot(dx, dy) < 8) return;
      d.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : isCalm(stage.current) ? null : "y";
      if (!d.axis) return;
      // take over from wherever the track spring was
      s.drag = 0;
    }
    d.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    if (d.samples.length > 6) d.samples.shift();
    if (d.axis === "x") {
      const atEnd = (s.cur === 0 && dx > 0) || (s.cur === n - 1 && dx < 0);
      s.drag = atEnd ? rubber(dx, s.W) : dx;
    } else {
      setSpring(s.dy, dy > 0 ? dy : rubber(dy, s.H * 0.5));
    }
    loop.current!.kick();
    paint();
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const s = S.current;
    if (!d.axis) {
      // a tap on the dark around the picture closes; a tap on the picture does nothing
      const onPicture = (e.target as HTMLElement).closest("[data-slot=lightbox-picture]");
      if (e.type === "pointerup" && !onPicture) beginClose();
      return;
    }
    const a = d.samples[0];
    const b = d.samples[d.samples.length - 1];
    const ms = Math.max(1, b.t - a.t);
    const vx = (b.x - a.x) / ms;
    const vy = (b.y - a.y) / ms;
    if (d.axis === "x") {
      const dx = e.clientX - d.x0;
      const dir = Math.abs(vx) > 0.4 ? -Math.sign(vx) : Math.abs(dx) > s.W * 0.18 ? -Math.sign(dx) : 0;
      const target = clamp(s.cur + dir, 0, n - 1);
      if (dir && target !== s.cur && e.type === "pointerup") go(dir);
      else {
        if (dir) soundRef.current.detent(0.6, { pitch: 0.6 });
        s.off.x += s.drag;
        s.off.to = 0;
        s.drag = 0;
        loop.current!.kick();
      }
    } else {
      if (e.type === "pointerup" && (s.dy.x > 110 || vy > 0.5)) beginClose();
      else {
        s.dy.to = 0;
        loop.current!.kick();
      }
    }
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -n, End: n };
    if (e.key in map) {
      e.preventDefault();
      go(map[e.key]);
    }
  };

  /* ── rail ─────────────────────────────────────────────── */
  const railRef = useRef<HTMLDivElement>(null);
  const [activeThumb, setActiveThumb] = useState<HTMLElement | null>(null);
  const glide = useGlide(railRef, activeThumb, { lead: 55, trail: 14 });
  useEffect(() => {
    const r = railRef.current;
    if (!r || !activeThumb) return;
    const target = activeThumb.offsetLeft + activeThumb.offsetWidth / 2 - r.clientWidth / 2;
    r.scrollTo({ left: target, behavior: isCalm(r) ? "auto" : "smooth" });
  }, [activeThumb]);

  const item = items[cur];
  const window2 = [cur - 2, cur - 1, cur, cur + 1, cur + 2].filter((j) => j >= 0 && j < n);

  return (
    <DialogPrimitive.Root
      open={shown}
      onOpenChange={(o) => {
        if (!o) beginClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          ref={scrim}
          data-slot="lightbox-scrim"
          className="fixed inset-0 z-1000 bg-black/95 opacity-0"
        />
        <DialogPrimitive.Content
          data-slot="lightbox"
          aria-describedby={undefined}
          onKeyDown={onKey}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            beginClose();
          }}
          onCloseAutoFocus={(e) => {
            // Radix would focus a DialogTrigger; there is none, so hand focus back to the
            // thumbnail of the picture you ended on (or whatever opened it)
            e.preventDefault();
            const el = findOrigin(S.current.cur);
            const target = el?.matches("button, a[href], [tabindex]") && visible(el) ? el : S.current.opener;
            target?.focus({ preventScroll: true });
          }}
          className="fixed inset-0 z-1001 flex flex-col overflow-hidden font-sans text-white outline-none select-none"
        >
          <DialogPrimitive.Title data-slot="lightbox-title" className="sr-only">{label}</DialogPrimitive.Title>

          <header
            ref={(el) => {
              chrome.current[0] = el;
            }}
            data-slot="lightbox-header"
            className="relative z-2 flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 opacity-0"
          >
            <span data-slot="lightbox-counter" className="px-3.5 py-1.5 rounded-pill bg-white/10 text-[0.875rem] font-medium tabular-nums tracking-[-0.01em]" aria-live="polite">
              {cur + 1} / {n}
            </span>
            <DialogPrimitive.Close
              data-slot="lightbox-close"
              aria-label="Close"
              className={cn(
                "grid place-items-center size-control p-0 border-0 rounded-full bg-white/10 text-white cursor-pointer",
                "transition-[background-color,rotate] duration-(--rap-dur-fast) ease-spring hover:bg-white/20 fun:hover:rotate-90",
                "outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-5",
              )}
            >
              <X aria-hidden />
            </DialogPrimitive.Close>
          </header>

          <div
            ref={stage}
            data-slot="lightbox-stage"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            /* not clipped: a picture pulled down (or flying in from a thumbnail) passes over the header and rail */
            className="relative z-3 flex-1 min-h-0 touch-none [container-type:size] cursor-grab active:cursor-grabbing"
          >
            {window2.map((j) => {
              const it = items[j];
              const r = it.ratio ?? 4 / 5;
              return (
                <div
                  key={galleryItemKey(it, j)}
                  ref={(el) => {
                    if (el) slides.current.set(j, el);
                    else slides.current.delete(j);
                  }}
                  data-slot="lightbox-slide"
                  aria-hidden={j !== cur}
                  className="absolute inset-0 grid place-items-center will-change-transform"
                >
                  <div
                    ref={(el) => {
                      if (el) flip.current.set(j, el);
                      else flip.current.delete(j);
                    }}
                    data-slot="lightbox-picture"
                    role="img"
                    aria-label={it.alt}
                    className="relative overflow-hidden rounded-sm bg-white/5 will-change-transform [transform-origin:50%_50%]"
                    style={
                      {
                        "--lb-r": r,
                        width: "min(calc(100cqw - 32px), calc((100cqh - 24px) * var(--lb-r)))",
                        aspectRatio: String(r),
                      } as CSSProperties
                    }
                  >
                    <GalleryMedia item={it} />
                  </div>
                </div>
              );
            })}

            <div
              ref={(el) => {
                chrome.current[1] = el;
              }}
              data-slot="lightbox-nav"
              className="max-sm:hidden opacity-0"
            >
              <button
                type="button"
                data-slot="lightbox-prev"
                aria-label="Previous picture"
                disabled={cur === 0}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => go(-1)}
                className={cn(navClass, "left-5")}
              >
                <ArrowLeft aria-hidden />
              </button>
              <button
                type="button"
                data-slot="lightbox-next"
                aria-label="Next picture"
                disabled={cur === n - 1}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => go(1)}
                className={cn(navClass, "right-5")}
              >
                <ArrowRight aria-hidden />
              </button>
            </div>
          </div>

          <footer
            ref={(el) => {
              chrome.current[2] = el;
            }}
            data-slot="lightbox-footer"
            className="relative z-2 flex flex-col items-center gap-3 px-4 pb-4 pt-2 sm:pb-5 opacity-0"
          >
            {(item?.title || item?.caption) && (
              <div data-slot="lightbox-caption" className="flex flex-col items-center text-center tracking-[-0.01em] min-h-10">
                {item.title && <span className="text-[1rem] font-medium leading-tight">{item.title}</span>}
                {item.caption && <span className="text-[0.8125rem] text-white/60">{item.caption}</span>}
              </div>
            )}
            {rail && n > 1 && (
              <div
                ref={railRef}
                data-slot="lightbox-rail"
                role="group"
                aria-label="Thumbnails"
                className="relative flex gap-1.5 max-w-full overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {/* the travelling indicator: one ring that crawls from thumbnail to thumbnail */}
                <span
                  data-slot="lightbox-rail-indicator"
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-0 z-1 rounded-[10px] shadow-[0_0_0_2px_var(--rap-paper-2)]"
                  style={glide.style}
                />
                {items.map((it, j) => (
                  <button
                    key={galleryItemKey(it, j)}
                    ref={j === cur ? setActiveThumb : undefined}
                    type="button"
                    data-slot="lightbox-thumb"
                    aria-label={it.alt}
                    aria-current={j === cur || undefined}
                    onClick={() => go(j - S.current.cur)}
                    className={cn(
                      "relative shrink-0 h-12 p-0 border-0 overflow-hidden rounded-[10px] bg-white/10 cursor-pointer",
                      "opacity-55 transition-opacity duration-(--rap-dur-fast) ease-rm hover:opacity-90 aria-[current]:opacity-100",
                      "outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
                    )}
                    style={{ width: Math.round(48 * clamp(it.ratio ?? 4 / 5, 0.6, 1.6)) }}
                  >
                    <GalleryMedia item={it} />
                  </button>
                ))}
              </div>
            )}
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const navClass = cn(
  "absolute top-1/2 -translate-y-1/2 z-2 grid place-items-center size-control-lg p-0 border-0 rounded-full bg-white/10 text-white cursor-pointer",
  "transition-[background-color,opacity] duration-(--rap-dur-fast) ease-rm hover:bg-white/20 disabled:opacity-0 disabled:pointer-events-none",
  "outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-5",
);
