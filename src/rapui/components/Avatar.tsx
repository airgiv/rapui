import { Children, cloneElement, forwardRef, isValidElement, type ReactElement, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./Avatar.css";

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
export function AvatarGroup({ max, size = "md", ring = "paper", className, children, ...rest }: AvatarGroupProps) {
  const items = Children.toArray(children).filter(isValidElement);
  const sized = items.map((el) => cloneElement(el as ReactElement<{ size?: AvatarSize }>, { size }));
  const shown = max != null ? sized.slice(0, max) : sized;
  const extra = items.length - shown.length;
  return (
    <div className={cx("rap-avatar-group", ring === "surface" && "rap-avatar-group--on-surface", className)} {...rest}>
      {shown}
      {extra > 0 && (
        <span className={cx("rap-avatar", `rap-avatar--${size}`, "rap-avatar--more")} aria-label={`${extra} more`}>
          +{extra}
        </span>
      )}
    </div>
  );
}
