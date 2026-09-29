import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { isCalm } from "../hooks/useGlide";
import { ArrowLeft, ArrowRight } from "../icons";
import { useSound } from "../sound";
import { cn } from "../utils";
import {
  GalleryMedia,
  createLoop,
  galleryItemKey,
  galleryNavClass,
  setSpring,
  spring,
  stepSpring,
  wobble,
  type GalleryItem,
  type GalleryOpen,
  type Spring,
} from "./galleryKit";

/* ══ Card stack ═══════════════════════════════════════════
   A messy pile of prints on a desk. Grab the top one and flick
   it away: it flies off with the speed and spin your hand gave
   it, the pile shuffles up, and the print slides back in UNDER
   the pile — nothing is lost, it just went to the bottom.

   ── A PILE, NOT A DECK ──────────────────────────────────
   Each card has its own resting turn (±`mess`°, the same every
   render — a seeded wobble, not Math.random) and a 3px sideways
   nudge, and each layer sits 7px lower and 4% smaller: enough
   to read four layers of paper under the top print, not so much
   that the pile looks like a staircase. The top card keeps only
   a third of its turn, so the picture you are looking at is
   nearly straight but still clearly lying on the others.

   ── THE THROW ───────────────────────────────────────────
   While you hold it the card is under your hand exactly (no
   spring — lag under a finger feels broken) and turns with the
   drag, more if you grabbed it near an edge: a card pivots
   around your fingertip. Let go past a third of its width, or
   faster than 0.45px/ms, and it is thrown: it keeps the release
   velocity (at least 18px a frame, so a slow-but-far drag still
   leaves decisively), spins in proportion, and loses 1% a frame
   to air. Once it has cleared its own width it drops to the
   bottom of the z-order and a softer spring (tune 38: heavy
   paper, one small settle — at 50 a card coming back from
   300px out overshoots by 60px and looks thrown twice) brings it home under the pile.
   Short of the threshold it springs back (tune 55).
   Going BACK does the same in reverse: the bottom card slides
   out to the left under the pile, is lifted on top, and lands
   (tune 36, for the same reason).

   One rAF loop for every card, writing transforms directly;
   it parks as soon as the last card settles.

   Calm / reduced motion: a straight, tidy stack; next/prev swap
   the top card at once; a drag still follows the hand and
   still decides next/prev on release. Sound (opt-in): a whoosh
   pitched by the throw's speed, and a soft drop when the
   card lands back in the pile. */

const LAYER_Y = 7;
const LAYER_SCALE = 4; // % per layer
const THROW_FRACTION = 0.33;
const THROW_SPEED = 0.45; // px/ms
const MIN_FLY = 18; // px/frame

export interface CardStackProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  items: GalleryItem[];
  /** Card width in px (shrinks to fit narrow containers). */
  width?: number;
  /** Card aspect ratio (width / height). */
  ratio?: number;
  /** How many layers under the top card stay visible. */
  depth?: number;
  /** Resting turn of each card, degrees (0 = a tidy deck). */
  mess?: number;
  /** Show the prev/next buttons and the counter. */
  controls?: boolean;
  /** Show the top card's title and caption under the pile. */
  captions?: boolean;
  /** Called when the top card is clicked (not thrown) or Enter is pressed. */
  onOpen?: GalleryOpen;
  /** Called with the index of the new top card. */
  onChange?: (index: number) => void;
}

type Mode = "rest" | "drag" | "fly" | "out";
type Card = { x: Spring; y: Spring; r: Spring; s: Spring; vx: number; vy: number; vr: number; mode: Mode; tune: number; landing: boolean; z: number };

export const CardStack = forwardRef<HTMLDivElement, CardStackProps>(function CardStack(
  { items, width = 280, ratio = 3 / 4, depth = 4, mess = 6, controls = true, captions = true, onOpen, onChange, className, style, onKeyDown, ...rest },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current!);
  const sound = useSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const n = items.length;
  const [order, setOrderState] = useState(() => items.map((_, i) => i));
  const orderRef = useRef(order);
  const els = useRef<(HTMLElement | null)[]>([]);
  const cards = useRef<Card[]>([]);
  const [w, setW] = useState(width);
  const h = w / ratio;

  // a new item list starts a fresh pile
  if (orderRef.current.length !== n) {
    orderRef.current = items.map((_, i) => i);
    setOrderState(orderRef.current);
  }

  /* fit the card to the container on narrow screens */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.min(width, Math.max(160, el.clientWidth - 48))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const restOf = useCallback(
    (i: number, d: number, calm: boolean) => {
      const turn = calm ? 0 : wobble(i, 1.3) * mess * (d === 0 ? 0.35 : 1);
      const nudge = calm ? 0 : wobble(i, 2.1) * 3;
      const dd = Math.min(d, depth);
      return { x: nudge, y: dd * LAYER_Y, r: turn, s: 100 - dd * LAYER_SCALE };
    },
    [depth, mess],
  );

  const paint = useCallback(() => {
    const ord = orderRef.current;
    cards.current.forEach((c, i) => {
      const el = els.current[i];
      if (!el) return;
      const d = ord.indexOf(i);
      el.style.transform = `translate3d(${c.x.x.toFixed(2)}px, ${c.y.x.toFixed(2)}px, 0) rotate(${c.r.x.toFixed(2)}deg) scale(${(c.s.x / 100).toFixed(4)})`;
      el.style.zIndex = String(c.z);
      el.style.opacity = d > depth && c.mode === "rest" && !c.landing ? "0" : "1";
    });
  }, [depth]);

  const loop = useRef<ReturnType<typeof createLoop> | null>(null);
  const loopTick = useRef<(dt: number) => boolean>(() => false);
  if (!loop.current) loop.current = createLoop((dt) => loopTick.current(dt));
  useEffect(() => () => loop.current?.stop(), []);

  /* aim every resting card at its layer; z follows the order unless a card is in the air */
  const settle = useCallback(
    (instant = false) => {
      const calm = isCalm(root.current);
      const ord = orderRef.current;
      ord.forEach((i, d) => {
        const c = cards.current[i];
        if (!c) return;
        if (c.mode === "rest") {
          const t = restOf(i, d, calm);
          c.x.to = t.x;
          c.y.to = t.y;
          c.r.to = t.r;
          c.s.to = t.s;
          c.z = n - d;
          if (instant || calm) {
            setSpring(c.x, t.x);
            setSpring(c.y, t.y);
            setSpring(c.r, t.r);
            setSpring(c.s, t.s);
            c.landing = false;
          }
        }
      });
      paint();
      loop.current!.kick();
    },
    [n, paint, restOf],
  );

  if (cards.current.length !== n) {
    cards.current = items.map((_, i) => {
      const t = restOf(i, i, false);
      return { x: spring(t.x), y: spring(t.y), r: spring(t.r), s: spring(t.s), vx: 0, vy: 0, vr: 0, mode: "rest" as Mode, tune: 55, landing: false, z: n - i };
    });
  }

  loopTick.current = (dt) => {
    let moving = false;
    const limit = w * 1.15;
    cards.current.forEach((c, i) => {
      if (c.mode === "drag") return;
      if (c.mode === "fly") {
        c.x.x += c.vx * dt;
        c.y.x += c.vy * dt;
        c.r.x += c.vr * dt;
        c.vx *= Math.pow(0.99, dt);
        c.vy *= Math.pow(0.99, dt);
        moving = true;
        if (Math.abs(c.x.x) > limit) {
          // cleared its own width: under the pile it goes, and home on heavy paper
          c.mode = "rest";
          c.tune = 38;
          c.landing = true;
          c.x.v = c.vx * 0.35;
          c.y.v = c.vy * 0.35;
          c.r.v = 0;
          settle();
        }
        return;
      }
      if (c.mode === "out") {
        // sliding out from under the pile; once clear, lift it on top and land it
        const m = [stepSpring(c.x, 60, dt), stepSpring(c.y, 60, dt), stepSpring(c.r, 60, dt), stepSpring(c.s, 60, dt)].some(Boolean);
        moving = true;
        if (Math.abs(c.x.x) > w * 0.95 || !m) {
          c.mode = "rest";
          c.tune = 36;
          c.landing = true;
          settle();
        }
        return;
      }
      const m = [stepSpring(c.x, c.tune, dt), stepSpring(c.y, c.tune, dt), stepSpring(c.r, c.tune, dt), stepSpring(c.s, c.tune, dt)].some(Boolean);
      if (c.landing && Math.hypot(c.x.x - c.x.to, c.y.x - c.y.to) < 14) {
        c.landing = false;
        soundRef.current.play("drop", { strength: 0.35 });
      }
      if (!m) c.tune = 55;
      moving ||= m;
      void i;
    });
    paint();
    return moving;
  };

  const setOrder = (next: number[]) => {
    orderRef.current = next;
    setOrderState(next);
    onChange?.(next[0]);
  };

  /** Throw the top card toward `dir` with a velocity in px/frame. */
  const throwTop = useCallback(
    (dir: 1 | -1, vx = 0, vy = 0) => {
      const ord = orderRef.current;
      if (ord.length < 2) return;
      const top = ord[0];
      const c = cards.current[top];
      const calm = isCalm(root.current);
      setOrder([...ord.slice(1), top]);
      if (calm) {
        c.mode = "rest";
        settle(true);
        return;
      }
      const speed = Math.max(MIN_FLY, Math.abs(vx));
      c.mode = "fly";
      c.vx = dir * speed;
      c.vy = vy;
      c.vr = dir * (1.1 + speed * 0.05);
      c.z = n + 1;
      soundRef.current.play("whoosh", { strength: Math.min(1, 0.35 + speed / 60), pitch: 0.9 + Math.min(0.4, speed / 100) });
      settle();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [n, settle],
  );

  /** Pull the bottom card out from under the pile and put it back on top. */
  const pullBack = useCallback(() => {
    const ord = orderRef.current;
    if (ord.length < 2) return;
    const bottom = ord[ord.length - 1];
    const c = cards.current[bottom];
    setOrder([bottom, ...ord.slice(0, -1)]);
    if (isCalm(root.current)) {
      settle(true);
      return;
    }
    c.mode = "out";
    c.z = 0;
    c.x.to = -w * 1.1;
    c.y.to = LAYER_Y * 2;
    c.r.to = -14;
    c.s.to = 96;
    // lift it on top a moment before it is clear, so it lands over the pile
    window.setTimeout(() => {
      c.z = n + 1;
    }, 140);
    soundRef.current.play("whoosh", { strength: 0.4, pitch: 0.85 });
    settle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, settle, w]);

  /* ── dragging the top card ───────────────────────────────── */
  const drag = useRef<{ id: number; x0: number; y0: number; grabY: number; samples: { t: number; x: number; y: number }[]; moved: boolean } | null>(null);

  const onDown = (i: number) => (e: ReactPointerEvent<HTMLElement>) => {
    if (orderRef.current[0] !== i || e.button !== 0) return;
    const c = cards.current[i];
    if (c.mode !== "rest") return;
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = { id: e.pointerId, x0: e.clientX - c.x.x, y0: e.clientY - c.y.x, grabY: (e.clientY - r.top) / r.height - 0.5, samples: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }], moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (i: number) => (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const c = cards.current[i];
    const x = e.clientX - d.x0;
    const y = e.clientY - d.y0;
    if (!d.moved && Math.hypot(e.clientX - d.samples[0].x, e.clientY - d.samples[0].y) < 4) return;
    if (!d.moved) {
      d.moved = true;
      c.mode = "drag";
      c.z = n + 1;
    }
    d.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    if (d.samples.length > 6) d.samples.shift();
    const calm = isCalm(root.current);
    const rest0 = restOf(i, 0, calm);
    // a card pivots round your fingertip: grabbed low, it turns the other way
    const turn = calm ? 0 : (x / w) * 16 * (d.grabY > 0.15 ? -1 : 1);
    setSpring(c.x, x);
    setSpring(c.y, y);
    setSpring(c.r, rest0.r + turn);
    c.s.to = 100;
    paint();
  };
  const onUp = (i: number) => (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const c = cards.current[i];
    if (!d.moved) {
      if (e.type === "pointerup" && onOpen) {
        soundRef.current.play("tap", { strength: 0.5 });
        onOpen(i, e.currentTarget);
      }
      return;
    }
    const a = d.samples[0];
    const b = d.samples[d.samples.length - 1];
    const dtMs = Math.max(1, b.t - a.t);
    const vx = (b.x - a.x) / dtMs;
    const vy = (b.y - a.y) / dtMs;
    const x = c.x.x;
    c.mode = "rest";
    if (e.type === "pointerup" && (Math.abs(x) > w * THROW_FRACTION || (Math.abs(vx) > THROW_SPEED && Math.sign(vx) === Math.sign(x)))) {
      const dir = (Math.abs(vx) > THROW_SPEED ? Math.sign(vx) : Math.sign(x)) as 1 | -1;
      throwTop(dir, vx * 16.67, vy * 16.67);
    } else {
      c.tune = 55;
      settle();
    }
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      throwTop(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      pullBack();
    } else if ((e.key === "Enter" || e.key === " ") && onOpen && e.target === e.currentTarget) {
      e.preventDefault();
      const top = orderRef.current[0];
      onOpen(top, els.current[top]);
    }
  };

  useEffect(() => settle(true), [settle]);

  const top = order[0] ?? 0;
  const topItem = items[top];
  const pad = LAYER_Y * depth + 12;

  return (
    <div
      ref={root}
      data-slot="card-stack"
      data-gallery=""
      role="region"
      aria-roledescription="card stack"
      aria-label={rest["aria-label"] ?? "Gallery"}
      tabIndex={0}
      onKeyDown={onKey}
      className={cn("flex flex-col items-center gap-5 w-full outline-none group/cs", className)}
      style={style}
      {...rest}
    >
      <div
        data-slot="card-stack-pile"
        className="relative rounded-card group-focus-visible/cs:outline-2 group-focus-visible/cs:outline-ring group-focus-visible/cs:outline-offset-8"
        style={{ width: w, height: h + pad }}
      >
        {items.map((item, i) => {
          const d = order.indexOf(i);
          const isTop = d === 0;
          return (
            <div
              key={galleryItemKey(item, i)}
              ref={(el) => {
                els.current[i] = el;
              }}
              data-slot="card-stack-card"
              data-gallery-index={i}
              data-top={isTop || undefined}
              aria-hidden={!isTop}
              aria-label={isTop ? item.alt : undefined}
              role={isTop ? "img" : undefined}
              onPointerDown={onDown(i)}
              onPointerMove={onMove(i)}
              onPointerUp={onUp(i)}
              onPointerCancel={onUp(i)}
              className={cn(
                "absolute left-0 top-0 overflow-hidden rounded-card bg-paper-3 select-none will-change-transform",
                "shadow-[0_1px_2px_rgb(0_0_0/0.06),0_10px_30px_-12px_rgb(0_0_0/0.3)] transition-opacity duration-(--rap-dur-fast)",
                isTop ? "cursor-grab active:cursor-grabbing touch-pan-y" : "pointer-events-none",
              )}
              style={{ width: w, height: h, transformOrigin: "50% 100%" } as CSSProperties}
            >
              <GalleryMedia item={item} />
            </div>
          );
        })}
      </div>

      <div data-slot="card-stack-footer" className="flex items-center gap-3 w-full max-w-(--cs-w) justify-between" style={{ "--cs-w": `${Math.max(w, 280)}px` } as CSSProperties}>
        {controls && (
          <button type="button" data-slot="card-stack-prev" className={galleryNavClass} aria-label="Previous card" onClick={pullBack}>
            <ArrowLeft aria-hidden />
          </button>
        )}
        <div data-slot="card-stack-caption" className="flex flex-1 flex-col items-center text-center min-w-0 font-sans tracking-[-0.01em]" aria-live="polite">
          {captions && topItem?.title && <span className="text-[0.9375rem] font-medium text-ink leading-tight truncate max-w-full">{topItem.title}</span>}
          <span className="flex gap-1.5 max-w-full text-[0.8125rem] text-mute">
            {captions && topItem?.caption ? <span className="truncate">{topItem.caption}</span> : null}
            {captions && topItem?.caption ? <span aria-hidden>·</span> : null}
            <span className="tabular-nums whitespace-nowrap">
              {top + 1} / {n}
            </span>
          </span>
        </div>
        {controls && (
          <button type="button" data-slot="card-stack-next" className={galleryNavClass} aria-label="Next card" onClick={() => throwTop(1)}>
            <ArrowRight aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
});
