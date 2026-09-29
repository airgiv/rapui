import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { AspectRatio as AspectRatioPrimitive } from "radix-ui";
import { cva } from "class-variance-authority";
import { cn } from "../utils";

export interface AspectRatioProps extends ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root> {
  /** Corner rounding of the frame. */
  radius?: "none" | "sm" | "md" | "lg";
}

const aspectVariants = cva(
  // an image or video child simply fills the frame
  "overflow-hidden bg-fill [&>img]:block [&>img]:size-full [&>img]:object-cover [&>video]:block [&>video]:size-full [&>video]:object-cover",
  {
    variants: {
      radius: { none: "rounded-none", sm: "rounded-sm", md: "rounded-pop", lg: "rounded-card" },
    },
    defaultVariants: { radius: "md" },
  },
);

/** Keeps its content at a fixed ratio (Radix AspectRatio). Children fill the frame. */
export const AspectRatio = forwardRef<ElementRef<typeof AspectRatioPrimitive.Root>, AspectRatioProps>(function AspectRatio(
  { radius = "md", className, ...rest },
  ref,
) {
  return (
    <AspectRatioPrimitive.Root
      ref={ref}
      data-slot="aspect-ratio"
      className={cn(aspectVariants({ radius }), className)}
      {...rest}
    />
  );
});
