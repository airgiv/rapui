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
import { cva } from "class-variance-authority";
import { cn, prefersReducedMotion } from "../utils";
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

const avatarVariants = cva(
  [
    "relative inline-grid place-items-center flex-none size-(--av) overflow-hidden rounded-full bg-fill text-ink",
    "font-sans text-[length:calc(var(--av)*0.38)] font-medium tracking-[-0.02em] leading-none select-none align-middle",
  ],
  {
    variants: {
      size: { sm: "[--av:28px]", md: "[--av:40px]", lg: "[--av:56px]", xl: "[--av:80px]" },
    },
    defaultVariants: { size: "md" },
  },
);

const fallbackVariants = cva("grid place-items-center size-full bg-fill-strong text-ink", {
  variants: {
    tone: {
      none: "",
      flame: "bg-flame text-white",
      blue: "bg-blue text-white",
      plum: "bg-plum text-white",
      acid: "bg-acid text-[#282828]",
      bubble: "bg-bubble text-[#282828]",
      sky: "bg-sky text-[#282828]",
    },
  },
  defaultVariants: { tone: "none" },
});

/* Faces inside a group (direct children only): ringed in the page colour,
   overlapping by 18% of their size.
   Delight: the hand of faces fans out — each face is translated i × 22% of its own
   size × --fan (0→1 on the group's spring), so the -18% overlap opens to a 4% gap.
   The face under the pointer lifts 4px and swells 1.08× on the spring ease; the
   lift is a registered property (Avatar.css) so it can transition inside the
   same `translate` that carries the fan. Calm: the stack stays stacked. */
const GROUP_FACES = [
  "[&>[data-slot=avatar]]:shadow-[0_0_0_2px_var(--av-ring)] [&>[data-slot=avatar]]:ml-[calc(var(--av)*-0.18)]",
  "[&>[data-slot=avatar]]:text-[length:calc(var(--av)*0.34)] [&>[data-slot=avatar]:first-child]:ml-0",
  "[&>[data-slot=avatar]]:[translate:calc(var(--i,0)*var(--av)*0.22*var(--fan))_var(--rap-av-lift)]",
  "[&>[data-slot=avatar]]:[transition:scale_var(--rap-dur-fast)_var(--rap-ease-back),--rap-av-lift_var(--rap-dur-fast)_var(--rap-ease-back)]",
  "data-fanned:[&>[data-slot=avatar]:hover]:[--rap-av-lift:-4px] data-fanned:[&>[data-slot=avatar]:hover]:scale-108 data-fanned:[&>[data-slot=avatar]:hover]:z-1",
  "calm:[&>[data-slot=avatar]]:translate-none calm:[&>[data-slot=avatar]]:scale-none",
];

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
    <AvatarPrimitive.Root
      ref={ref}
      data-slot="avatar"
      data-size={size}
      className={cn(avatarVariants({ size }), className)}
      {...rest}
    >
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
    return <AvatarPrimitive.Image
        ref={ref}
        data-slot="avatar-image"
        className={cn("size-full object-cover", className)}
        {...rest}
      />;
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
      data-slot="avatar-fallback"
      className={cn(fallbackVariants({ tone: t ?? "none" }), className)}
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
      data-slot="avatar-group"
      className={cn(
        "inline-flex items-center [--fan:0]",
        ring === "surface" ? "[--av-ring:var(--rap-surface)]" : "[--av-ring:var(--rap-paper)]",
        GROUP_FACES,
        className,
      )}
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
        const a = (e.target as Element).closest('[data-slot="avatar"]');
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
          data-slot="avatar"
          data-size={size}
          data-more=""
          className={cn(avatarVariants({ size }), "bg-paper-3 text-ink-2 text-[length:calc(var(--av)*0.32)]/none tabular-nums")}
          style={{ "--i": shown.length } as CSSProperties}
          aria-label={`${extra} more`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
