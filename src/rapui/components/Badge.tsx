import { forwardRef, useLayoutEffect, useRef, type AnimationEvent, type HTMLAttributes } from "react";
import { useReplay } from "../hooks/useReplay";
import { useSound } from "../sound";
import { cx } from "../utils";
import "./Badge.css";

/* ── Badge ─────────────────────────────────────────────────
   Delight: a badge is a tiny sign pinned to something, and when
   what it says changes (3 → 4 comments, Draft → Live) it HOPS —
   the shared `rap-hop` keyframe, 5px up and a 1px dip on landing —
   so the eye catches the update without a toast. The change is
   read from the rendered text, not from `children`, so it works
   for any content and never fires on the first render.

   A `live` badge's dot breathes: it swells a hair and lets a
   ring expand off it every 2.4s — slow enough to read as "on
   air", not "error". Both are switched off under calm and
   reduced motion (motion.css + the rules at the end of Badge.css).
   With a SoundProvider on, the hop comes with a soft tick (0.4). */

export type BadgeVariant = "neutral" | "ink" | "blue" | "flame" | "success" | "warning" | "danger" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  /** A small status dot before the label. */
  dot?: boolean;
  /** The dot breathes to say "this is live right now". Implies `dot`. */
  live?: boolean;
}

/** Small status pill. Text is optically centred on the cap height, not the line box. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", size = "md", dot = false, live = false, className, children, onAnimationEnd, ...rest },
  ref,
) {
  const label = useRef<HTMLSpanElement>(null);
  const last = useRef<string | null>(null);
  const hop = useReplay();
  const sound = useSound();

  // hop when the visible text (or the status colour) changes — never on mount
  useLayoutEffect(() => {
    const sig = `${variant}|${label.current?.textContent ?? ""}`;
    if (last.current !== null && last.current !== sig) {
      hop.play();
      sound.play("tick", { strength: 0.4 });
    }
    last.current = sig;
  });

  const ended = (e: AnimationEvent<HTMLSpanElement>) => {
    if (e.target === e.currentTarget) hop.done();
    onAnimationEnd?.(e);
  };

  return (
    <span
      ref={ref}
      className={cx(
        "rap-badge",
        `rap-badge--${variant}`,
        `rap-badge--${size}`,
        live && "rap-badge--live",
        hop.cls("rap-anim-hop"),
        className,
      )}
      onAnimationEnd={ended}
      {...rest}
    >
      {(dot || live) && <span className="rap-badge__dot" aria-hidden />}
      <span ref={label} className="rap-badge__label">
        {children}
      </span>
    </span>
  );
});
