import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "../utils";
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

/* ── delight: swing out of the trigger (also used by HoverCard) ──
   --swing-tilt / --swing-dx / --swing-dy come from Radix's data-side.
   Open: useSpring tune 30 (k .128, d .68) sampled every 2 frames — ~4%
   overshoot on scale; the keyframe (Popover.css) is one segment only, because
   a linear() easing applies per keyframe interval. Closed: folds back in 150ms.
   Calm keeps the `pop` utility's own fade; reduced motion makes it 1ms. */
export const popSwing = cn(
  "[--swing-tilt:-5deg] [--swing-dx:0px] [--swing-dy:-10px]",
  "data-[side=top]:[--swing-tilt:5deg] data-[side=top]:[--swing-dy:10px]",
  "data-[side=right]:[--swing-tilt:5deg] data-[side=right]:[--swing-dx:-10px] data-[side=right]:[--swing-dy:0px]",
  "data-[side=left]:[--swing-dx:10px] data-[side=left]:[--swing-dy:0px]",
  "fun:animate-[rap-pop-swing-in_480ms_linear(0,0.226,0.551,0.829,1.006,1.087,1.099,1.077,1.044,1.017,0.999,0.991,0.99,0.992,0.996,1)]",
  "fun:data-[state=closed]:animate-[rap-pop-swing-out_150ms_var(--rap-ease-rm)_forwards]",
  "motion-reduce:animate-[rap-pop-in_1ms_linear] motion-reduce:data-[state=closed]:animate-[rap-pop-out_1ms_linear_forwards]",
);

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
        data-slot="popover-content"
        className={cn(
          "pop w-[min(320px,calc(100vw-24px))] p-[18px] text-[0.9375rem] tracking-[-0.01em] outline-none",
          popSwing,
          className,
        )}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
});
