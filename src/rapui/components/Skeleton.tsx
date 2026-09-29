import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../utils";
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

const skeletonVariants = cva(
  [
    "relative flex-none h-4 overflow-hidden bg-fill",
    // the band is more of the fill: a sheen that reads on white paper and on dark alike
    "[--sk-glint:color-mix(in_srgb,var(--rap-fill-strong)_85%,transparent)]",
    // delight: one soft diagonal light over the whole page. The band is fixed to the
    // viewport, so all skeletons show slices of the same light (keyframes: Skeleton.css)
    "after:absolute after:inset-0 after:bg-no-repeat after:bg-fixed after:bg-size-[150vw_100vh] after:bg-position-[-150vw_0]",
    "after:bg-[linear-gradient(115deg,transparent_0%,transparent_40%,var(--sk-glint)_50%,transparent_60%,transparent_100%)]",
    "after:animate-[rap-skeleton-light_2.8s_cubic-bezier(0.4,0,0.6,1)_infinite]",
    // calm / reduced motion: the placeholders stay still
    "calm:after:hidden motion-reduce:after:hidden",
  ],
  {
    variants: {
      shape: { round: "rounded-sm", pill: "rounded-pill", circle: "rounded-full" },
    },
    defaultVariants: { shape: "round" },
  },
);

/** Placeholder block, swept by a soft diagonal light. Size it with width/height or CSS. */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { width, height, shape = "round", className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden
      data-slot="skeleton"
      data-shape={shape}
      className={cn(skeletonVariants({ shape }), className)}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
});

/** A paragraph of placeholder lines; the last one is shorter. */
export function SkeletonText({ lines = 3, className, ...rest }: HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div data-slot="skeleton-text" className={cn("flex flex-col gap-[0.6em] w-full text-[1rem]", className)} aria-hidden {...rest}>
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
