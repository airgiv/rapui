import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./ScrollArea.css";

export interface ScrollAreaProps extends ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /** Which scrollbars to render. Default "vertical". */
  orientation?: "vertical" | "horizontal" | "both";
  /** Class for the inner viewport (the element that actually scrolls). */
  viewportClassName?: string;
}

/**
 * Custom-scrollbar container (Radix ScrollArea): native scrolling, a thin round
 * thumb on a clear track. Give it a height (or max-height) to make it scroll.
 */
export const ScrollArea = forwardRef<ElementRef<typeof ScrollAreaPrimitive.Root>, ScrollAreaProps>(function ScrollArea(
  { className, children, orientation = "vertical", viewportClassName, type = "hover", ...rest },
  ref,
) {
  return (
    <ScrollAreaPrimitive.Root ref={ref} type={type} className={cx("rap-scroll", className)} {...rest}>
      <ScrollAreaPrimitive.Viewport className={cx("rap-scroll__viewport", viewportClassName)}>{children}</ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" && <ScrollBar orientation="vertical" />}
      {orientation !== "vertical" && <ScrollBar orientation="horizontal" />}
      <ScrollAreaPrimitive.Corner className="rap-scroll__corner" />
    </ScrollAreaPrimitive.Root>
  );
});

export const ScrollBar = forwardRef<
  ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(function ScrollBar({ className, orientation = "vertical", ...rest }, ref) {
  return (
    <ScrollAreaPrimitive.Scrollbar ref={ref} orientation={orientation} className={cx("rap-scroll__bar", className)} {...rest}>
      <ScrollAreaPrimitive.Thumb className="rap-scroll__thumb" />
    </ScrollAreaPrimitive.Scrollbar>
  );
});
