import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Toggle as TogglePrimitive } from "radix-ui";
import { cx } from "../utils";
import "./Toggle.css";

export interface ToggleProps extends ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
  size?: "sm" | "md" | "lg";
  /** `default` sits on a fill; `ghost` is transparent until hovered (for toolbars). */
  variant?: "default" | "ghost";
}

/** A single on/off pill button (Radix Toggle) — Bold, Snap to grid, Show guides. On = ink. */
export const Toggle = forwardRef<ElementRef<typeof TogglePrimitive.Root>, ToggleProps>(function Toggle(
  { className, size = "md", variant = "default", ...rest },
  ref,
) {
  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cx("rap-toggle", `rap-toggle--${size}`, `rap-toggle--${variant}`, className)}
      {...rest}
    />
  );
});
