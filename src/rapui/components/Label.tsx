import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "../utils";

/** Form label (Radix Label: clicking it focuses the control). */
export const Label = forwardRef<ElementRef<typeof LabelPrimitive.Root>, ComponentPropsWithoutRef<typeof LabelPrimitive.Root>>(
  function Label({ className, ...rest }, ref) {
    return (
      <LabelPrimitive.Root
        ref={ref}
        data-slot="label"
        className={cn(
          "font-sans text-[0.9375rem] font-medium tracking-[-0.01em] leading-[1.3] text-ink cursor-default",
          // a label dims with the control right after it, or when Radix marks it disabled
          "[&:has(+:disabled)]:opacity-50 data-[disabled]:opacity-50",
          className,
        )}
        {...rest}
      />
    );
  },
);
