import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./Label.css";

/** Form label (Radix Label: clicking it focuses the control). */
export const Label = forwardRef<ElementRef<typeof LabelPrimitive.Root>, ComponentPropsWithoutRef<typeof LabelPrimitive.Root>>(
  function Label({ className, ...rest }, ref) {
    return <LabelPrimitive.Root ref={ref} className={cx("rap-label", className)} {...rest} />;
  },
);
