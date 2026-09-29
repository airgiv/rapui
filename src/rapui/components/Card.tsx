import { forwardRef, type HTMLAttributes, type PointerEvent } from "react";
import { cx } from "../utils";
import "./Card.css";

/* ── Card ──────────────────────────────────────────────────
   Delight: card stock on a soft desk. A card you can click
   gives under the finger — it squashes 1.5% toward the exact
   point you pressed (transform-origin follows the pointer), so
   pressing a corner dips that corner, and on release it springs
   back past flat and settles (--rap-ease-back). 1.5% is the
   most a surface holding text can move without the text
   visibly swimming; the press lands in 90ms so it feels like
   contact, the release takes 450ms so you see the rebound.

   Only for cards that are a target: `pressable`, or any card
   with an onClick. A card that just holds content stays still. */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  /** Squash under the pointer like card stock. Defaults to true when `onClick` is set. */
  pressable?: boolean;
}

/** White surface with the big 28px radius. No border, no shadow — it sits on paper. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, size = "md", pressable, onPointerDown, ...rest },
  ref,
) {
  const press = pressable ?? rest.onClick != null;
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (press) {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--card-ox", `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty("--card-oy", `${e.clientY - r.top}px`);
    }
    onPointerDown?.(e);
  };
  return (
    <div
      ref={ref}
      className={cx("rap-card", `rap-card--${size}`, press && "rap-card--pressable", className)}
      onPointerDown={down}
      {...rest}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("rap-card__header", className)} {...rest} />;
});

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function CardTitle({ className, ...rest }, ref) {
  return <h3 ref={ref} className={cx("rap-card__title", className)} {...rest} />;
});

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(function CardDescription(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("rap-card__desc", className)} {...rest} />;
});

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardContent({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("rap-card__content", className)} {...rest} />;
});

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardFooter({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("rap-card__footer", className)} {...rest} />;
});
