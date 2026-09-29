import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check, Minus } from "lucide-react";
import { cx } from "../utils";
import "./Checkbox.css";

export interface CheckboxProps extends ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  size?: "sm" | "md" | "lg";
}

/**
 * Soft-cornered checkbox (Radix). Unticked it is a quiet ring; ticked it fills
 * with the selection blue and the mark pops in. Supports `checked="indeterminate"`.
 */
export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(function Checkbox(
  { className, size = "md", ...rest },
  ref,
) {
  return (
    <CheckboxPrimitive.Root ref={ref} className={cx("rap-checkbox", `rap-checkbox--${size}`, className)} {...rest}>
      <CheckboxPrimitive.Indicator className="rap-checkbox__mark">
        {rest.checked === "indeterminate" ? <Minus strokeWidth={3} /> : <Check strokeWidth={3} />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
