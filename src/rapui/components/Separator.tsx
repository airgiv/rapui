import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./Separator.css";

export interface SeparatorProps extends ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /** Text in the middle of a horizontal rule, e.g. "or". */
  label?: ReactNode;
}

/** Hairline divider (Radix Separator). Horizontal or vertical; optional centred label. */
export const Separator = forwardRef<ElementRef<typeof SeparatorPrimitive.Root>, SeparatorProps>(function Separator(
  { orientation = "horizontal", decorative = true, label, className, ...rest },
  ref,
) {
  if (label != null && orientation === "horizontal") {
    return (
      <div className={cx("rap-separator-labelled", className)} role={decorative ? "none" : "separator"}>
        <SeparatorPrimitive.Root ref={ref} decorative className="rap-separator rap-separator--horizontal" {...rest} />
        <span className="rap-separator__label">{label}</span>
        <SeparatorPrimitive.Root decorative className="rap-separator rap-separator--horizontal" />
      </div>
    );
  }
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      className={cx("rap-separator", `rap-separator--${orientation}`, className)}
      {...rest}
    />
  );
});
