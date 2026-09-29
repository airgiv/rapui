import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { cva } from "class-variance-authority";
import { cn } from "../utils";
import {
  DialogCloseButton,
  dialogDescriptionClass,
  dialogFooterClass,
  dialogHeaderClass,
  dialogTitleClass,
  useMergedRef,
  useOpenCloseSound,
} from "./Dialog";
import "./Sheet.css";

/* A dialog that slides in from an edge as a floating panel, inset 8px from the viewport.

   Delight: the panel arrives on a spring — it runs ~5% past its resting place
   and settles back, like a drawer pushed a touch too hard — and then its
   contents are DEALT in one after another (header, body rows, footer) with the
   shared `rap-deal-in`, as if laid out on the panel once it has stopped.
   The easing is Bencho's spring (useSpring, tune 20) sampled into a CSS
   `linear()` curve, so it is the same physics as every JS spring in rap/ui but
   runs on the compositor with no JS at all. Tune 20 because the panel is big:
   5% of 420px is already a ~20px overshoot; at tune 50 it would be 90px and
   look broken. The deal waits ~120ms so the rows land after the panel, not with
   it. Closing is a plain quick slide; calm and reduced motion drop all of it.
   Sound (inside an enabled <SoundProvider>): a whoosh in and out.

   Styling: utilities below; Sheet.css keeps the per-side slide keyframes and
   the deal choreography (a stagger over the caller's children, see there). */

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetPortal = SheetPrimitive.Portal;

export type SheetSide = "right" | "left" | "top" | "bottom";

/* Open: 440ms on useSpring tune 20 (k .112, d .66) sampled per 2 frames — ~5%
   overshoot, one settle. Closed: a plain 260ms slide out. Calm: the plain
   ease-out slide over --rap-dur. Reduced motion: 1ms. */
const sheetVariants = cva(
  [
    "group/sheet fixed z-1000 flex flex-col gap-5 p-7 overflow-hidden [--sheet-inset:8px] [--sheet-size:420px]",
    "rounded-card bg-surface text-ink shadow-pop font-sans focus:outline-none",
    "[animation-duration:440ms]",
    "[animation-timing-function:linear(0,0.191,0.469,0.717,0.893,0.995,1.041,1.051,1.043,1.029,1.016,1.007,1)]",
    "data-[state=closed]:[animation-duration:260ms] data-[state=closed]:[animation-timing-function:var(--rap-ease-rm)]",
    "data-[state=closed]:[animation-fill-mode:forwards]",
    "calm:[animation-duration:var(--rap-dur)] calm:[animation-timing-function:var(--rap-ease-out)]",
    "motion-reduce:[animation-duration:1ms]!",
  ],
  {
    variants: {
      side: {
        right: [
          "top-(--sheet-inset) bottom-(--sheet-inset) right-(--sheet-inset) w-[min(var(--sheet-size),calc(100vw-var(--sheet-inset)*2))]",
          "[animation-name:rap-sheet-in-right] data-[state=closed]:[animation-name:rap-sheet-out-right]",
        ],
        left: [
          "top-(--sheet-inset) bottom-(--sheet-inset) left-(--sheet-inset) w-[min(var(--sheet-size),calc(100vw-var(--sheet-inset)*2))]",
          "[animation-name:rap-sheet-in-left] data-[state=closed]:[animation-name:rap-sheet-out-left]",
        ],
        top: [
          "left-(--sheet-inset) right-(--sheet-inset) top-(--sheet-inset) max-h-[calc(100vh-var(--sheet-inset)*2)]",
          "[animation-name:rap-sheet-in-top] data-[state=closed]:[animation-name:rap-sheet-out-top]",
        ],
        bottom: [
          "left-(--sheet-inset) right-(--sheet-inset) bottom-(--sheet-inset) max-h-[calc(100vh-var(--sheet-inset)*2)]",
          "[animation-name:rap-sheet-in-bottom] data-[state=closed]:[animation-name:rap-sheet-out-bottom]",
        ],
      },
    },
    defaultVariants: { side: "right" },
  },
);

export interface SheetContentProps extends ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: SheetSide;
  /** Show the round close button in the top-right corner. */
  showClose?: boolean;
}

export const SheetContent = forwardRef<ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(function SheetContent(
  { className, children, side = "right", showClose = true, ...rest },
  ref,
) {
  const setRef = useMergedRef(ref, useOpenCloseSound("whoosh", "whoosh"));
  return (
    <SheetPrimitive.Portal>
      {/* the scrim leaves with the panel (260ms), not with a falling dialog */}
      <SheetPrimitive.Overlay data-slot="sheet-overlay" className="scrim data-[state=closed]:[animation-duration:260ms]" />
      <SheetPrimitive.Content
        ref={setRef}
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetVariants({ side }), className)}
        {...rest}
      >
        {children}
        {showClose && <DialogCloseButton data-slot="sheet-close" />}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
});

export function SheetHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sheet-header" className={cn(dialogHeaderClass, className)} {...rest} />;
}

/** Scrollable middle section. */
export function SheetBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sheet-body" className={cn("flex-1 min-h-0 overflow-auto -mx-7 px-7", className)} {...rest} />;
}

/** Pinned to the bottom of the panel; buttons 2px apart. */
export function SheetFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        dialogFooterClass,
        "mt-auto group-data-[side=top]/sheet:mt-0 group-data-[side=bottom]/sheet:mt-0",
        className,
      )}
      {...rest}
    />
  );
}

export const SheetTitle = forwardRef<ElementRef<typeof SheetPrimitive.Title>, ComponentPropsWithoutRef<typeof SheetPrimitive.Title>>(
  function SheetTitle({ className, ...rest }, ref) {
    return <SheetPrimitive.Title ref={ref} data-slot="sheet-title" className={cn(dialogTitleClass, className)} {...rest} />;
  },
);

export const SheetDescription = forwardRef<
  ElementRef<typeof SheetPrimitive.Description>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(function SheetDescription({ className, ...rest }, ref) {
  return (
    <SheetPrimitive.Description ref={ref} data-slot="sheet-description" className={cn(dialogDescriptionClass, className)} {...rest} />
  );
});
