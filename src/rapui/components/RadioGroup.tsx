/* ══ RadioGroup ═══════════════════════════════════════════
   One choice from a short list (Radix RadioGroup). Round dots, or
   `variant="card"` tiles with a blue ring.

   DELIGHT — ONE MARBLE. A radio group can only ever have one
   thing chosen, so there is only ever one "chosen" dot: a blue
   marble with a white pip that sits in the chosen socket. Pick
   another option and the marble LEAVES the old socket and hops
   into the new one — it is not a second dot fading in.

   The path is two springs (useSpring on x and y, in pixels,
   tune 42: arrives with one small overshoot, like a marble
   rocking in its cup) plus a hop read off how far along the
   straight line the marble has got: sin(π·progress), so it lifts
   off, peaks halfway and comes down into the cup. The hop is
   drawn two ways at once because a list is usually vertical and
   an "up" arc along a vertical path is invisible:
   · a sideways bulge, perpendicular to the path, always upward
     for sideways moves and toward the labels for vertical ones,
     at most 40px and never more than 40% of the distance;
   · a lift toward you — the marble grows by a third at the apex
     and its shadow spreads and drops — so the hop reads even
     when the bulge is small.
   On landing it squashes once and (with a SoundProvider) taps.

   Radix owns the state; the chosen socket and the card's ring
   change immediately. Reduced motion / data-rap-motion="calm":
   the marble moves at once, no hop. Before JS has measured, each
   checked item paints its own dot, so nothing is ever missing. */
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type ReactNode,
} from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useSpring } from "../hooks/useSpring";
import { useSound } from "../sound";
import { clamp, cn } from "../utils";
import { isMotionCalm } from "./FormField";
import "./RadioGroup.css";

type RadioVariant = "default" | "card";
type RadioSize = "sm" | "md" | "lg";
const RadioCtx = createContext<{ variant: RadioVariant; size: RadioSize }>({ variant: "default", size: "md" });

export interface RadioGroupProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  /** `default` — dots with a label beside; `card` — each option is a filled tile. */
  variant?: RadioVariant;
  size?: RadioSize;
}

interface Socket {
  x: number;
  y: number;
  size: number;
}

const TUNE = 42;
const MAX_HOP = 40;

/** Where the chosen socket's centre is, in the group's own (unscaled) pixels. */
function measure(root: HTMLElement): Socket | null {
  const item = root.querySelector<HTMLElement>(
    '[data-slot="radio-group-item"][data-state="checked"], [data-slot="radio-group-card"][data-state="checked"] [data-slot="radio-group-socket"]',
  );
  if (!item) return null;
  const r = root.getBoundingClientRect();
  const s = item.getBoundingClientRect();
  const scale = root.offsetWidth ? r.width / root.offsetWidth : 1;
  return {
    x: (s.left + s.width / 2 - r.left) / scale,
    y: (s.top + s.height / 2 - r.top) / scale,
    size: item.offsetWidth,
  };
}

/**
 * One choice from a short list (Radix RadioGroup). A single blue marble sits in the
 * chosen socket and hops to the next one; or `variant="card"` tiles with a blue ring.
 */
export const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(function RadioGroup(
  { className, variant = "default", size = "md", children, ...rest },
  ref,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const [to, setTo] = useState<Socket | null>(null);
  const [from, setFrom] = useState<Socket | null>(null);
  const [instant, setInstant] = useState(true);
  const x = useSpring(to?.x ?? 0, TUNE, instant);
  const y = useSpring(to?.y ?? 0, TUNE, instant);
  const at = useRef({ x, y });
  at.current = { x, y };

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    let last: Socket | null = null;
    const find = (resize = false) => {
      const next = measure(el);
      const moved = !!(next && last && (Math.abs(next.x - last.x) > 0.5 || Math.abs(next.y - last.y) > 0.5));
      if (next && last && !moved && !resize) return; // same socket (an indicator mounting, focus…)
      if (!next) setTo(null);
      else if (!last || resize || isMotionCalm(el)) {
        setInstant(true);
        setFrom(null);
        setTo(next);
      } else {
        // leave from wherever the marble is right now, even mid-hop
        setInstant(false);
        setFrom({ x: at.current.x, y: at.current.y, size: next.size });
        setTo(next);
      }
      last = next;
    };
    find();
    const mo = new MutationObserver(() => find());
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["data-state"], childList: true });
    const ro = new ResizeObserver(() => find(true));
    ro.observe(el);
    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, [variant, size]);

  // the hop: how far along the straight line, as a 0..1 bump
  let hop = 0;
  let bx = 0;
  let by = 0;
  if (to && from && !instant) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const progress = clamp(1 - Math.hypot(to.x - x, to.y - y) / dist, 0, 1);
      hop = Math.sin(Math.PI * progress);
      // perpendicular, pointing up; for a straight vertical move, toward the labels (right)
      let px = dy / dist;
      let py = -dx / dist;
      if (py > 0.01 || (Math.abs(py) <= 0.01 && px < 0)) {
        px = -px;
        py = -py;
      }
      const h = Math.min(MAX_HOP, dist * 0.4) * (Math.abs(py) > 0.3 ? 1 : 0.5);
      bx = px * h * hop;
      by = py * h * hop;
    }
  }

  // landing: once per move, when the marble is nearly home
  const sound = useSound();
  const [lands, setLands] = useState(0);
  const flying = useRef(false);
  useEffect(() => {
    if (from && !instant) flying.current = true;
  }, [from, instant]);
  const near = to && from && !instant ? Math.hypot(to.x - x, to.y - y) < 1.5 : false;
  useEffect(() => {
    if (near && flying.current) {
      flying.current = false;
      setLands((n) => n + 1);
      sound.play("tap", { pitch: 1.1 });
    }
  }, [near, sound]);

  const d = to?.size ?? 0;
  const marble: CSSProperties = to
    ? {
        width: d,
        height: d,
        transform: `translate(${x + bx - d / 2}px, ${y + by - d / 2}px) scale(${1 + 0.34 * hop})`,
        boxShadow: hop > 0.01 ? `0 ${2 + 10 * hop}px ${4 + 14 * hop}px rgb(0 0 0 / ${0.1 + 0.16 * hop})` : undefined,
      }
    : { opacity: 0 };

  return (
    <RadioCtx.Provider value={{ variant, size }}>
      <RadioGroupPrimitive.Root
        ref={setRef}
        data-slot="radio-group"
        data-variant={variant}
        data-marbled={to ? "" : undefined}
        className={cn(
          "group/radio relative grid font-sans",
          variant === "default" &&
            "gap-3 data-[orientation=horizontal]:grid-flow-col data-[orientation=horizontal]:justify-start data-[orientation=horizontal]:gap-5",
          variant === "card" &&
            "gap-tile data-[orientation=horizontal]:grid-flow-col data-[orientation=horizontal]:auto-cols-fr data-[orientation=horizontal]:justify-stretch",
          className,
        )}
        {...rest}
      >
        {children}
        {/* the marble: one blue ball with a white pip, positioned by JS over the chosen socket.
            While it is there the sockets stay empty rings. */}
        <span
          data-slot="radio-group-marble"
          className={cn(
            "absolute top-0 left-0 z-2 rounded-full pointer-events-none origin-center",
            "[transition:opacity_var(--rap-dur-fast)_var(--rap-ease-rm)] group-data-[disabled]/radio:opacity-45",
          )}
          style={marble}
          aria-hidden
        >
          {/* the landing squash; two names so a quick second landing restarts it */}
          <span
            className={cn(
              "grid place-items-center size-full rounded-full bg-select",
              lands > 0 &&
                (lands % 2
                  ? "fun:animate-[rap-radio-land-a_300ms_var(--rap-ease-out)]"
                  : "fun:animate-[rap-radio-land-b_300ms_var(--rap-ease-out)]"),
            )}
          >
            <span className="size-[38%] rounded-full bg-select-ink" />
          </span>
        </span>
      </RadioGroupPrimitive.Root>
    </RadioCtx.Provider>
  );
});

/* ── the socket: the round dot ───────────────────────────
   In the default variant it is the radio button itself; in a card it is a
   span inside the tile. Either way it reads two local properties set by
   whichever element carries the state (the item, or the card), so the
   states are written once: an empty ring, a darker ring on hover, blue when
   chosen — and back to an empty ring while the marble sits in it. */
const socketClass = cn(
  "relative inline-grid place-items-center flex-none size-(--rd) p-0 border-0 rounded-full",
  "bg-(--sock-bg) shadow-[inset_0_0_0_1.5px_var(--sock-ring)]",
  "[transition:background_var(--rap-dur-fast)_var(--rap-ease-rm),box-shadow_var(--rap-dur-fast)_var(--rap-ease-rm),scale_var(--rap-dur-fast)_var(--rap-ease-rm)]",
);
const socketStates = cn(
  "[--sock-bg:transparent] [--sock-ring:var(--rap-fill-strong)] hover:not-data-[state=checked]:[--sock-ring:var(--rap-mute)]",
  "data-[state=checked]:[--sock-bg:var(--rap-select)] data-[state=checked]:[--sock-ring:transparent]",
  "group-data-[marbled]/radio:data-[state=checked]:[--sock-bg:transparent] group-data-[marbled]/radio:data-[state=checked]:[--sock-ring:var(--rap-fill-strong)]",
);
const socketSize = { sm: "[--rd:18px]", md: "[--rd:22px]", lg: "[--rd:28px]" } as const;
/* the dot Radix mounts in the chosen socket (pops in on the spring); hidden once the marble has measured */
const dotClass =
  "size-[calc(var(--rd)*0.38)] rounded-full bg-select-ink animate-[rap-radio-pop_360ms_var(--rap-ease-spring)] group-data-[marbled]/radio:invisible";
const focusRing = "focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-ring! disabled:opacity-45 disabled:pointer-events-none";

export interface RadioGroupItemProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  /** Card variant: the option's title. In the default variant, wrap the item with a `Label` instead. */
  label?: ReactNode;
  /** Card variant: a line of secondary text under the label. */
  description?: ReactNode;
}

export const RadioGroupItem = forwardRef<ElementRef<typeof RadioGroupPrimitive.Item>, RadioGroupItemProps>(
  function RadioGroupItem({ className, label, description, children, ...rest }, ref) {
    const { variant, size } = useContext(RadioCtx);
    if (variant === "card") {
      // a filled tile, label + description, the socket on the right
      return (
        <RadioGroupPrimitive.Item
          ref={ref}
          data-slot="radio-group-card"
          className={cn(
            "flex items-start justify-between gap-4 w-full py-4 pr-4 pl-5 border-0 rounded-pop bg-fill text-ink [font:inherit] text-left cursor-pointer",
            "[transition:background_var(--rap-dur-fast)_var(--rap-ease-rm),box-shadow_var(--rap-dur-fast)_var(--rap-ease-rm)]",
            "hover:not-data-[state=checked]:bg-fill-hover data-[state=checked]:bg-surface data-[state=checked]:shadow-[inset_0_0_0_2px_var(--rap-select)]",
            socketStates,
            focusRing,
            className,
          )}
          {...rest}
        >
          <span data-slot="radio-group-card-text" className="flex flex-col gap-0.5 min-w-0">
            {label != null && (
              <span data-slot="radio-group-card-label" className="text-[0.9375rem] font-medium tracking-[-0.01em] leading-[1.35]">
                {label}
              </span>
            )}
            {description != null && (
              <span data-slot="radio-group-card-description" className="text-[0.8125rem] tracking-[-0.01em] leading-[1.4] text-mute">
                {description}
              </span>
            )}
            {children}
          </span>
          <span data-slot="radio-group-socket" className={cn(socketClass, socketSize[size])} aria-hidden>
            <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className={dotClass} />
          </span>
        </RadioGroupPrimitive.Item>
      );
    }
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        data-slot="radio-group-item"
        data-size={size}
        className={cn(socketClass, socketSize[size], socketStates, "cursor-pointer active:scale-92", focusRing, className)}
        {...rest}
      >
        <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className={dotClass} />
      </RadioGroupPrimitive.Item>
    );
  },
);
