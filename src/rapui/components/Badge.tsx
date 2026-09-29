import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../utils";
import "./Badge.css";

export type BadgeVariant = "neutral" | "ink" | "blue" | "flame" | "success" | "warning" | "danger" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  /** A small status dot before the label. */
  dot?: boolean;
}

/** Small status pill. Text is optically centred on the cap height, not the line box. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", size = "md", dot = false, className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx("rap-badge", `rap-badge--${variant}`, `rap-badge--${size}`, className)} {...rest}>
      {dot && <span className="rap-badge__dot" aria-hidden />}
      <span className="rap-badge__label">{children}</span>
    </span>
  );
});
