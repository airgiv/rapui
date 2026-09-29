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
import { clamp, cx } from "../utils";
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
    '.rap-radio-item[data-state="checked"], .rap-radio-card[data-state="checked"] .rap-radio',
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
        className={cx("rap-radio-group", `rap-radio-group--${variant}`, to && "is-marbled", className)}
        {...rest}
      >
        {children}
        <span className="rap-radio-marble" style={marble} aria-hidden>
          <span className={cx("rap-radio-marble__ball", lands > 0 && (lands % 2 ? "is-land-a" : "is-land-b"))}>
            <span className="rap-radio-marble__pip" />
          </span>
        </span>
      </RadioGroupPrimitive.Root>
    </RadioCtx.Provider>
  );
});

export interface RadioGroupItemProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  /** Card variant: the option's title. In the default variant, wrap the item with a `Label` instead. */
  label?: ReactNode;
  /** Card variant: a line of secondary text under the label. */
  description?: ReactNode;
}

export const RadioGroupItem = forwardRef<ElementRef<typeof RadioGroupPrimitive.Item>, RadioGroupItemProps>(
  function RadioGroupItem({ className, label, description, children, ...rest }, ref) {
    const { variant, size } = useContext(RadioCtx);
    const dot = (
      <span className={cx("rap-radio", `rap-radio--${size}`)} aria-hidden>
        <RadioGroupPrimitive.Indicator className="rap-radio__dot" />
      </span>
    );
    if (variant === "card") {
      return (
        <RadioGroupPrimitive.Item ref={ref} className={cx("rap-radio-card", className)} {...rest}>
          <span className="rap-radio-card__text">
            {label != null && <span className="rap-radio-card__label">{label}</span>}
            {description != null && <span className="rap-radio-card__desc">{description}</span>}
            {children}
          </span>
          {dot}
        </RadioGroupPrimitive.Item>
      );
    }
    return (
      <RadioGroupPrimitive.Item ref={ref} className={cx("rap-radio-item", `rap-radio-item--${size}`, className)} {...rest}>
        <RadioGroupPrimitive.Indicator className="rap-radio-item__dot" />
      </RadioGroupPrimitive.Item>
    );
  },
);
