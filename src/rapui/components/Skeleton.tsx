import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cx } from "../utils";
import "./Skeleton.css";

/* ── Skeleton ──────────────────────────────────────────────
   Delight: one light, not a hundred shimmers. The glint is a
   soft diagonal band (115°, wide feathered edges — window light
   across a table, not a scanner bar) whose background is
   attached to the VIEWPORT, so every placeholder on the page
   shows its own slice of the same band at the same moment. A
   whole loading layout is swept by a single light passing over
   it, left to right: a near-linear 2.2s pass, then a pause, every
   2.8s — slow enough to read as light moving, and the pause makes
   it breathe rather than strobe.

   Calm / reduced motion: the placeholders stay still. */

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  /** `round` (default) for blocks, `pill` for text, `circle` for avatars. */
  shape?: "round" | "pill" | "circle";
}

/** Placeholder block, swept by a soft diagonal light. Size it with width/height or CSS. */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { width, height, shape = "round", className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden
      className={cx("rap-skeleton", `rap-skeleton--${shape}`, className)}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
});

/** A paragraph of placeholder lines; the last one is shorter. */
export function SkeletonText({ lines = 3, className, ...rest }: HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cx("rap-skeleton-text", className)} aria-hidden {...rest}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} shape="pill" height="0.75em" width={i === lines - 1 && lines > 1 ? "62%" : "100%"} />
      ))}
    </div>
  );
}

/** Round placeholder for an avatar or icon. */
export function SkeletonCircle({ size = 40, ...rest }: Omit<SkeletonProps, "shape" | "width" | "height"> & { size?: number | string }) {
  return <Skeleton shape="circle" width={size} height={size} {...rest} />;
}
