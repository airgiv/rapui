import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { AspectRatio as AspectRatioPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./AspectRatio.css";

export interface AspectRatioProps extends ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root> {
  /** Corner rounding of the frame. */
  radius?: "none" | "sm" | "md" | "lg";
}

/** Keeps its content at a fixed ratio (Radix AspectRatio). Children fill the frame. */
export const AspectRatio = forwardRef<ElementRef<typeof AspectRatioPrimitive.Root>, AspectRatioProps>(function AspectRatio(
  { radius = "md", className, ...rest },
  ref,
) {
  return <AspectRatioPrimitive.Root ref={ref} className={cx("rap-aspect", `rap-aspect--${radius}`, className)} {...rest} />;
});
