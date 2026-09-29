import { createElement, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../utils";
import "./Typography.css";

type DisplaySize = "mega" | "xxl" | "xl" | "lg" | "md";

export interface DisplayProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: DisplaySize;
  /** Tight, slightly condensed tracking for giant headlines. */
  tight?: boolean;
  children?: ReactNode;
}

/** Huge editorial headline set in the display face. */
export function Display({ as = "h2", size = "xl", tight = true, className, ...rest }: DisplayProps) {
  return createElement(as, {
    className: cx("rap-display", `rap-display--${size}`, tight && "rap-display--tight", className),
    ...rest,
  });
}

export type AccentTone = "flame" | "blue" | "plum" | "mute";

/**
 * Same face, different colour — how rap/ui marks the word that matters.
 * `mute` gives the two-tone grey/ink headline Readymag uses a lot.
 */
export function Accent({ className, tone = "flame", ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: AccentTone }) {
  return <span className={cx("rap-accent", `rap-accent--${tone}`, className)} {...rest} />;
}

/** Small label with a live dot. */
export function Eyebrow({ className, dot = true, children, ...rest }: HTMLAttributes<HTMLSpanElement> & { dot?: boolean }) {
  return (
    <span className={cx("rap-eyebrow", className)} {...rest}>
      {dot && <span className="rap-eyebrow__dot" aria-hidden />}
      {children}
    </span>
  );
}

/** Airy lead paragraph. */
export function Lead({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("rap-lead", className)} {...rest} />;
}

/** Text with a hand-drawn-ish highlighter swipe behind it. */
export function Highlight({
  className,
  color = "acid",
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { color?: "acid" | "flame" | "blue" | "plum" | "bubble" | "sky" }) {
  return <span className={cx("rap-highlight", `rap-highlight--${color}`, className)} {...rest} />;
}
