import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { isCalm } from "../hooks/useGlide";
import { useSound } from "../sound";
import { clamp, cn } from "../utils";
import { GalleryMedia, galleryItemKey, springEasing, type GalleryItem, type GalleryOpen } from "./galleryKit";

/* ══ Fan gallery ══════════════════════════════════════════
   A hand of playing cards. The pictures fan out from a pivot
   below the hand; run a finger along them and the cards around
   it part to let it rise; pick one and the whole hand turns so
   that card stands upright in front, the others fanned behind.

   ── THE GEOMETRY ────────────────────────────────────────
   Every card turns about ONE point, 1.6 card-heights below the
   hand (transform-origin far under the card). That is roughly
   where a wrist is: shorter and the hand becomes a daisy,
   longer and it flattens into a row. The fan's half-angle is
   whatever fits the container — at most 34° — and the cards
   beyond it are eased in with tanh rather than clamped, so the
   far ends of a long hand bunch up like real cards instead of
   piling onto one angle.

   ── THE NUMBERS ─────────────────────────────────────────
   The chosen card rises 22px and grows 8%, and its neighbours
   step 0.6 of a gap further out so it is never covered. The
   hover spread is 0.7 of a gap, falling off by e^−0.7 per card:
   the immediate neighbours move clearly, three away barely,
   which is how cards held in one hand actually part. All of it
   is CSS transitions on a `linear()` easing sampled from the
   library's spring (tune 52), so a card that is re-aimed mid-
   flight continues from where it is, with one small overshoot.

   Keyboard: the hand is one tab stop; ←/→ pick the neighbour,
   Home/End the ends, Enter opens the chosen card.
   Calm / reduced motion: the same fan, still — no hover spread
   and no transitions. Sound (opt-in): a quiet notch as the
   hand passes over a card, a tap when one is chosen. */

const EASE = springEasing(52);
const PIVOT = 1.6; // card heights below the hand
const LIFT = 22;
const GROW = 1.08;

export interface FanGalleryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  items: GalleryItem[];
  /** Card width in px (shrinks to fit narrow containers). */
  size?: number;
  /** Card aspect ratio (width / height). */
  ratio?: number;
  /** The card in front (uncontrolled start). */
  defaultIndex?: number;
  /** Controlled: the card in front. */
  index?: number;
  onChange?: (index: number) => void;
  /** Called when the card that is already in front is clicked or Enter is pressed. */
  onOpen?: GalleryOpen;
  captions?: boolean;
}

export const FanGallery = forwardRef<HTMLDivElement, FanGalleryProps>(function FanGallery(
  { items, size = 200, ratio = 5 / 7, defaultIndex, index, onChange, onOpen, captions = true, className, style, "aria-label": ariaLabel = "Gallery", ...rest },
  ref,
) {
  const n = items.length;
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current!);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const sound = useSound();
  const [own, setOwn] = useState(() => clamp(defaultIndex ?? Math.floor((n - 1) / 2), 0, Math.max(0, n - 1)));
  const active = clamp(index ?? own, 0, Math.max(0, n - 1));
  const [hover, setHover] = useState(-1);
  const [cw, setCw] = useState(800);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCw(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const choose = (i: number, focus = false) => {
    const next = clamp(i, 0, n - 1);
    if (next !== active) {
      sound.play("tap", { strength: 0.45, pitch: 0.9 + (next / Math.max(1, n - 1)) * 0.3 });
      setOwn(next);
      onChange?.(next);
    }
    if (focus) btns.current[next]?.focus();
  };

  /* geometry: fit the hand to the width */
  const w = Math.round(Math.min(size, cw * 0.3));
  const h = w / ratio;
  const R = h * PIVOT;
  const half = Math.min(34, (Math.asin(clamp((cw / 2 - w * 0.55 - 8) / (R + h), 0.05, 1)) * 180) / Math.PI);
  const step = n > 1 ? Math.min(11, (half * 2) / (n - 1)) : 0;
  const soft = (a: number) => half * Math.tanh(a / half);
  const spread = step * 0.7;

  const angleOf = (i: number) => {
    const off = i - active;
    let a = off * step + Math.sign(off) * step * 0.6;
    if (hover >= 0 && hover !== i) {
      const d = i - hover;
      a += Math.sign(d) * spread * Math.exp(-(Math.abs(d) - 1) * 0.7);
    }
    return soft(a);
  };
  const height = h * GROW + LIFT + R * (1 - Math.cos((half * Math.PI) / 180)) + 24;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number> = { ArrowRight: active + 1, ArrowDown: active + 1, ArrowLeft: active - 1, ArrowUp: active - 1, Home: 0, End: n - 1 };
    if (e.key in map) {
      e.preventDefault();
      choose(map[e.key], true);
    }
  };

  const cur = items[active];

  return (
    <div
      ref={root}
      data-slot="fan-gallery"
      data-gallery=""
      role="group"
      aria-roledescription="fan"
      aria-label={ariaLabel}
      onKeyDown={onKey}
      className={cn("flex flex-col items-center gap-4 w-full", className)}
      style={{ "--fg-ease": EASE.easing, "--fg-dur": `${EASE.ms}ms`, ...style } as CSSProperties}
      {...rest}
    >
      <div data-slot="fan-gallery-hand" className="relative w-full" style={{ height }} onPointerLeave={() => setHover(-1)}>
        {items.map((item, i) => {
          const isActive = i === active;
          const lifted = isActive || i === hover;
          const z = isActive ? n + 2 : i === hover ? n + 1 : n - Math.abs(i - active);
          return (
            <button
              key={galleryItemKey(item, i)}
              ref={(el) => {
                btns.current[i] = el;
              }}
              type="button"
              data-slot="fan-gallery-card"
              data-gallery-index={i}
              data-active={isActive || undefined}
              aria-label={item.alt}
              aria-current={isActive || undefined}
              tabIndex={isActive ? 0 : -1}
              onPointerEnter={(e) => {
                if (e.pointerType === "touch" || isCalm(root.current)) return;
                setHover(i);
                sound.detent(0.2, { pitch: 0.9 + (i / Math.max(1, n - 1)) * 0.4 });
              }}
              onClick={(e) => {
                if (isActive) {
                  if (onOpen) {
                    sound.play("tap", { strength: 0.5 });
                    onOpen(i, e.currentTarget);
                  }
                } else choose(i);
              }}
              className={cn(
                "absolute left-1/2 top-(--fg-top) p-0 border-0 overflow-hidden rounded-[calc(var(--rap-radius)*0.75)] bg-paper-3 cursor-pointer",
                "shadow-[0_1px_2px_rgb(0_0_0/0.08),0_14px_30px_-14px_rgb(0_0_0/0.45)] will-change-transform",
                "[transform:translateX(-50%)_rotate(var(--fg-a))_translateY(var(--fg-lift))_scale(var(--fg-s))]",
                "[transition:transform_var(--fg-dur)_var(--fg-ease)] calm:transition-none motion-reduce:transition-none",
                "outline-offset-3 focus-visible:outline-2 focus-visible:outline-ring",
              )}
              style={
                {
                  width: w,
                  height: h,
                  zIndex: z,
                  transformOrigin: `50% ${(100 * (h + R)) / h}%`,
                  "--fg-top": `${LIFT + 8}px`,
                  "--fg-a": `${angleOf(i).toFixed(2)}deg`,
                  // scaling about the far pivot would push the card up by d·(s−1); take that back so it grows about its own centre
                  "--fg-lift": `${(isActive ? -LIFT + (R + h / 2) * (GROW - 1) : lifted ? -LIFT * 0.6 : 0).toFixed(1)}px`,
                  "--fg-s": isActive ? GROW : 1,
                } as CSSProperties
              }
            >
              <GalleryMedia item={item} />
            </button>
          );
        })}
      </div>
      {captions && cur && (
        <div data-slot="fan-gallery-caption" aria-live="polite" className="flex flex-col items-center text-center font-sans tracking-[-0.01em] min-h-11">
          {cur.title && <span className="text-[0.9375rem] font-medium text-ink leading-tight">{cur.title}</span>}
          <span className="text-[0.8125rem] text-mute">
            {cur.caption ? <>{cur.caption} · </> : null}
            <span className="tabular-nums">
              {active + 1} / {n}
            </span>
          </span>
        </div>
      )}
    </div>
  );
});
