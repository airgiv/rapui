import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cx } from "../utils";
import "./Skeleton.css";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  /** `round` (default) for blocks, `pill` for text, `circle` for avatars. */
  shape?: "round" | "pill" | "circle";
}

/** Shimmering placeholder block. Size it with width/height or CSS. */
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
