import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./Popover.css";

/* Rich floating panel anchored to a trigger. <Popover><PopoverTrigger/><PopoverContent/></Popover> */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className, sideOffset = 8, align = "center", collisionPadding = 12, ...rest }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        className={cx("rap-pop", "rap-popover", className)}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
});
