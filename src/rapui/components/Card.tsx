import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../utils";
import "./Card.css";

/** White surface with the big 28px radius. No border, no shadow — it sits on paper. */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { size?: "sm" | "md" | "lg" }>(function Card(
  { className, size = "md", ...rest },
  ref,
) {
  return <div ref={ref} className={cx("rap-card", `rap-card--${size}`, className)} {...rest} />;
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
