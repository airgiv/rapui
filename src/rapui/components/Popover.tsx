import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cx } from "../utils";
import { useMergedRef, useOpenCloseSound } from "./Dialog";
import "./Popover.css";

/* Rich floating panel anchored to a trigger. <Popover><PopoverTrigger/><PopoverContent/></Popover>

   Delight: it swings out of the trigger. The panel grows from the point where
   it touches the trigger (Radix's transform origin) on a spring, starting
   turned 5° and shifted 10px back toward the trigger, so it swings open like a
   sign on a hinge toward the side it opens to, overshoots a hair and settles.
   The spring is useSpring's (tune 30, ~4% overshoot on scale) sampled into a
   CSS `linear()` curve, so it runs on the compositor. Closing is quick: it
   folds back into the trigger in 150ms. The tilt direction is keyed off
   Radix's `data-side`, so a popover that flips to fit the screen still swings
   the right way. Calm and reduced motion keep the plain fade. Sound: pop. */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className, sideOffset = 8, align = "center", collisionPadding = 12, ...rest }, ref) {
  const setRef = useMergedRef(ref, useOpenCloseSound("pop"));
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={setRef}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        className={cx("rap-pop", "rap-pop--swing", "rap-popover", className)}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
});
