import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { cx } from "../utils";
import { DialogCloseButton, DialogOverlay, useMergedRef, useOpenCloseSound } from "./Dialog";
import "./Dialog.css";
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
   Sound (inside an enabled <SoundProvider>): a whoosh in and out. */

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetPortal = SheetPrimitive.Portal;

export type SheetSide = "right" | "left" | "top" | "bottom";

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
      <DialogOverlay className="rap-sheet-scrim" />
      <SheetPrimitive.Content ref={setRef} className={cx("rap-sheet", `rap-sheet--${side}`, className)} {...rest}>
        {children}
        {showClose && <DialogCloseButton className="rap-sheet__x" />}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
});

export function SheetHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-dialog-header", className)} {...rest} />;
}

/** Scrollable middle section. */
export function SheetBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-sheet-body", className)} {...rest} />;
}

/** Pinned to the bottom of the panel; buttons 2px apart. */
export function SheetFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-dialog-footer", "rap-sheet-footer", className)} {...rest} />;
}

export const SheetTitle = forwardRef<ElementRef<typeof SheetPrimitive.Title>, ComponentPropsWithoutRef<typeof SheetPrimitive.Title>>(
  function SheetTitle({ className, ...rest }, ref) {
    return <SheetPrimitive.Title ref={ref} className={cx("rap-dialog-title", className)} {...rest} />;
  },
);

export const SheetDescription = forwardRef<
  ElementRef<typeof SheetPrimitive.Description>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(function SheetDescription({ className, ...rest }, ref) {
  return <SheetPrimitive.Description ref={ref} className={cx("rap-dialog-description", className)} {...rest} />;
});
