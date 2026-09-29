import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type RefObject,
} from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { useSpring } from "../hooks/useSpring";
import { useSound } from "../sound";
import { cx, prefersReducedMotion } from "../utils";
import "./Avatar.css";

/* ── Avatar ────────────────────────────────────────────────
   Delight lives in AvatarGroup: the overlapping stack is a hand
   of cards, and pointing at it FANS it out. One spring (0→100,
   tune 55: one friendly overshoot) drives a single `--fan`
   variable; every face reads it as `translate: i × 22% of its
   own size`, so the first face stays put and the last travels
   furthest — the spread is a hand opening, not a slide. 22%
   turns the -18% overlap into a 4% gap, just enough to see each
   face whole. Translate, not margin: nothing around the group
   reflows while it breathes.

   The face under the pointer lifts (4px, 1.08×) on the
   overshooting ease so you can tell whom you are about to click.
   Calm / reduced motion: the stack stays stacked. With a
   SoundProvider on, each lift is a very soft detent (0.25). */

/** true under prefers-reduced-motion or inside data-rap-motion="calm" (kept live). */
function useCalm(ref: RefObject<Element | null>) {
  const [calm, setCalm] = useState(false);
  useLayoutEffect(() => {
    const check = () => setCalm(prefersReducedMotion() || !!ref.current?.closest('[data-rap-motion="calm"]'));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-rap-motion"], subtree: true });
    return () => mo.disconnect();
  }, [ref]);
  return calm;
}

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const TONES = ["flame", "blue", "plum", "acid", "bubble", "sky"] as const;
export type AvatarTone = (typeof TONES)[number];

/** Same name → same colour, every time. */
export function avatarTone(name: string): AvatarTone {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

/** "Mira Okafor" → "MO", "studio" → "ST". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export interface AvatarProps extends ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: AvatarSize;
  /** Full name — drives the initials and the fallback colour. */
  name?: string;
  src?: string;
  alt?: string;
}

/**
 * Round avatar (Radix Avatar). Pass `name` and optionally `src`; while the image loads
 * or if it fails, the initials show on a colour picked from the name.
 * For custom content compose `AvatarImage` + `AvatarFallback` as children.
 */
export const Avatar = forwardRef<ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(function Avatar(
  { size = "md", name, src, alt, className, children, ...rest },
  ref,
) {
  return (
    <AvatarPrimitive.Root ref={ref} className={cx("rap-avatar", `rap-avatar--${size}`, className)} {...rest}>
      {children ?? (
        <>
          {src && <AvatarImage src={src} alt={alt ?? name ?? ""} />}
          <AvatarFallback name={name} delayMs={src ? 400 : undefined} />
        </>
      )}
    </AvatarPrimitive.Root>
  );
});

export const AvatarImage = forwardRef<ElementRef<typeof AvatarPrimitive.Image>, ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>>(
  function AvatarImage({ className, ...rest }, ref) {
    return <AvatarPrimitive.Image ref={ref} className={cx("rap-avatar__img", className)} {...rest} />;
  },
);

export const AvatarFallback = forwardRef<
  ElementRef<typeof AvatarPrimitive.Fallback>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & { name?: string; tone?: AvatarTone }
>(function AvatarFallback({ className, name, tone, children, ...rest }, ref) {
  const t = tone ?? (name ? avatarTone(name) : undefined);
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cx("rap-avatar__fallback", t && `rap-avatar__fallback--${t}`, className)}
      aria-label={name}
      {...rest}
    >
      {children ?? (name ? initials(name) : null)}
    </AvatarPrimitive.Fallback>
  );
});

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Show at most this many avatars, then a "+N" bubble. */
  max?: number;
  size?: AvatarSize;
  /** Colour of the 2px ring between avatars: match what the group sits on. */
  ring?: "paper" | "surface";
}

/** Overlapping stack of avatars, each ringed in the page colour. */
export function AvatarGroup({
  max,
  size = "md",
  ring = "paper",
  className,
  style,
  children,
  onPointerEnter,
  onPointerLeave,
  onPointerOver,
  ...rest
}: AvatarGroupProps) {
  const root = useRef<HTMLDivElement>(null);
  const face = useRef<Element | null>(null);
  const sound = useSound();
  const calm = useCalm(root);
  const [open, setOpen] = useState(false);
  const fan = useSpring(open && !calm ? 100 : 0, 55, calm);

  const items = Children.toArray(children).filter(isValidElement);
  const limit = max != null ? Math.min(max, items.length) : items.length;
  const shown = items.slice(0, limit).map((el, i) => {
    const e = el as ReactElement<{ size?: AvatarSize; style?: CSSProperties }>;
    return cloneElement(e, { size, style: { ...e.props.style, "--i": i } as CSSProperties });
  });
  const extra = items.length - shown.length;
  return (
    <div
      ref={root}
      className={cx("rap-avatar-group", ring === "surface" && "rap-avatar-group--on-surface", className)}
      style={{ ...style, "--fan": fan / 100 } as CSSProperties}
      data-fanned={open && !calm ? "" : undefined}
      onPointerEnter={(e) => {
        setOpen(true);
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        setOpen(false);
        face.current = null;
        onPointerLeave?.(e);
      }}
      onPointerOver={(e) => {
        const a = (e.target as Element).closest(".rap-avatar");
        if (a && a !== face.current && a.parentElement === root.current) {
          face.current = a;
          if (!calm) sound.detent(0.25);
        }
        onPointerOver?.(e);
      }}
      {...rest}
    >
      {shown}
      {extra > 0 && (
        <span
          className={cx("rap-avatar", `rap-avatar--${size}`, "rap-avatar--more")}
          style={{ "--i": shown.length } as CSSProperties}
          aria-label={`${extra} more`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
