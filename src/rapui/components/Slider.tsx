/* ══ Slider ═══════════════════════════════════════════════
   Range slider (Radix). One thumb per value — two values for a range.

   DELIGHT — THE THUMB IS A BALL, THE VALUE IS A BALLOON ON IT.

   While you drag, the thumb STRETCHES along the track in
   proportion to how fast it is going and, when you stop, the
   same spring carries it past round into a squash and back —
   a rubber ball that has been thrown and caught. The speed is
   measured from the value itself (per cent of the range per
   frame), so keyboard steps and drags feel the same; it is fed
   to useSpring as an impulse that drops to zero 70ms after the
   last change, and the spring does the rest (tune 60: one
   visible squash on the stop).

   A value bubble POPS up above the thumb while it is held
   (pointer drag, or stepping with the keys) and hangs off it like a
   balloon on a string: it leans back against the direction of
   travel and, when you stop, SWINGS through upright a couple of
   times before it settles — a second spring on the same impulse,
   tuned lively (78) because a pendulum that does not swing is
   not one. The lean is capped at 28°, past which the number is
   hard to read.

   Values are immediate; the stretch and swing only paint them.
   Reduced motion / data-rap-motion="calm": no stretch, no swing
   (the bubble still shows the value). Sound: a detent per step,
   firmer at the ends. */
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type ReactNode,
} from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { useSpring } from "../hooks/useSpring";
import { useSound } from "../sound";
import { clamp, cn } from "../utils";
import { useMotionCalm } from "./FormField";
import "./Slider.css";

export interface SliderProps extends ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Show the value bubble above a held thumb. Default true. */
  bubble?: boolean;
  /** Format the bubble's value, e.g. `(v) => `${v}%``. */
  formatValue?: (value: number) => ReactNode;
}

function Thumb({
  value,
  span,
  calm,
  vertical,
  bubble,
}: {
  value: number;
  span: number;
  calm: boolean;
  vertical: boolean;
  bubble: ReactNode;
}) {
  // impulse: signed speed in per cent of the range per frame, ×4, dropped to 0 once still
  const [impulse, setImpulse] = useState(0);
  const last = useRef({ v: value, t: 0 });
  useEffect(() => {
    const now = performance.now();
    const prev = last.current;
    last.current = { v: value, t: now };
    if (!prev.t || value === prev.v) return;
    const dt = clamp(now - prev.t, 8, 120);
    setImpulse(clamp((((value - prev.v) / span) * 100 * 16.67 * 4) / dt, -40, 40));
    const id = window.setTimeout(() => setImpulse(0), 70);
    return () => window.clearTimeout(id);
  }, [value, span]);

  const stretch = useSpring(calm ? 0 : Math.abs(impulse), 60, calm);
  const swing = useSpring(calm ? 0 : -impulse, 78, calm);
  const s = clamp(stretch * 0.012, -0.2, 0.35);
  const along = 1 + s;
  const across = 1 - s * 0.6;
  const style = {
    "--sq-x": vertical ? across : along,
    "--sq-y": vertical ? along : across,
  } as CSSProperties;

  return (
    /* the thumb element is an unscaled hit box; the ball is its ::before, so the
       stretch (--sq-x/--sq-y, from the spring) never distorts the bubble. --hold
       (registered in Slider.css so it can transition) swells it on hover and grab. */
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      className={cn(
        "group/thumb relative block size-[22px] rounded-full cursor-grab outline-none [--hold:1] hover:[--hold:1.1] active:[--hold:1.18] active:cursor-grabbing",
        "before:absolute before:inset-0 before:rounded-full before:bg-white",
        "before:shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_2px_8px_rgb(0_0_0/0.18)]",
        "focus-visible:before:shadow-[0_0_0_2px_var(--rap-surface),0_0_0_4px_var(--rap-ring),0_2px_8px_rgb(0_0_0/0.18)]",
        "before:[scale:calc(var(--sq-x,1)*var(--hold))_calc(var(--sq-y,1)*var(--hold))]",
        "before:[transition:--hold_var(--rap-dur-fast)_var(--rap-ease-spring)]",
      )}
      style={style}
    >
      {bubble != null && (
        /* the balloon: pops above a held thumb (pointer drag or keyboard steps), leans and
           swings about the thumb's centre — the string is tied to the middle of the ball:
           10px gap + half the thumb, hence the origin at 100% + 21px. Calm: no swing. */
        <span
          data-slot="slider-bubble"
          className={cn(
            "absolute left-1/2 bottom-[calc(100%+10px)] min-w-[34px] py-[5px] px-[9px] rounded-pill bg-ink text-paper",
            "font-sans text-[0.8125rem] font-medium leading-[1.2] tracking-[-0.01em] tabular-nums text-center whitespace-nowrap",
            "pointer-events-none -translate-x-1/2 origin-[50%_calc(100%+21px)] scale-0 opacity-0",
            "[transition:scale_240ms_cubic-bezier(0.34,1.8,0.64,1),opacity_120ms_var(--rap-ease-rm)]",
            "group-data-[held]/slider:group-focus/thumb:scale-100 group-data-[held]/slider:group-focus/thumb:opacity-100",
            "calm:rotate-none! calm:[transition:opacity_120ms_var(--rap-ease-rm)] motion-reduce:rotate-none!",
            // the string's knot: a small triangle under the balloon, in its colour
            "after:absolute after:left-1/2 after:top-[calc(100%-1px)] after:w-2 after:h-[5px] after:-translate-x-1/2",
            "after:bg-inherit after:[clip-path:polygon(0_0,100%_0,50%_100%)]",
          )}
          style={{ rotate: `${clamp(swing * 1.6, -28, 28)}deg` }}
          aria-hidden
        >
          {bubble}
        </span>
      )}
    </SliderPrimitive.Thumb>
  );
}

/** Range slider (Radix). One thumb per value — pass two values for a range. */
export const Slider = forwardRef<ElementRef<typeof SliderPrimitive.Root>, SliderProps>(function Slider(
  { className, value, defaultValue, onValueChange, min = 0, max = 100, bubble = true, formatValue, orientation, onPointerDown, onKeyDown, onBlur, ...rest },
  ref,
) {
  const [inner, setInner] = useState<number[]>(value ?? defaultValue ?? [min]);
  const vals = value ?? inner;

  const root = useRef<HTMLSpanElement | null>(null);
  const setRef = useCallback(
    (node: HTMLSpanElement | null) => {
      root.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const calm = useMotionCalm(root);

  const [dragging, setDragging] = useState(false);
  // the bubble also shows while stepping with the keyboard (not after a mouse drag leaves focus behind)
  const [keyed, setKeyed] = useState(false);
  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging]);

  const sound = useSound();

  return (
    <SliderPrimitive.Root
      ref={setRef}
      data-slot="slider"
      data-held={dragging || keyed || undefined}
      className={cn(
        // rap-slider: a stable marker the site CSS still sizes the slider through
        "rap-slider group/slider relative flex items-center w-full h-6 touch-none select-none data-[disabled]:opacity-50",
        className,
      )}
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      orientation={orientation}
      onPointerDown={(e) => {
        setDragging(true);
        setKeyed(false);
        onPointerDown?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key.startsWith("Arrow") || e.key.startsWith("Page") || e.key === "Home" || e.key === "End") setKeyed(true);
        onKeyDown?.(e);
      }}
      onBlur={(e) => {
        setKeyed(false);
        onBlur?.(e);
      }}
      onValueChange={(v) => {
        const edge = v.some((n) => n <= min || n >= max);
        sound.detent(edge ? 1 : 0.6);
        setInner(v);
        onValueChange?.(v);
      }}
      {...rest}
    >
      <SliderPrimitive.Track data-slot="slider-track" className="relative flex-1 h-1.5 rounded-pill bg-fill-strong overflow-hidden">
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-select rounded-[inherit]" />
      </SliderPrimitive.Track>
      {vals.map((v, i) => (
        <Thumb
          key={i}
          value={v}
          span={Math.max(1e-9, max - min)}
          calm={calm}
          vertical={orientation === "vertical"}
          bubble={bubble ? (formatValue ? formatValue(v) : v) : null}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
