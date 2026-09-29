import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { cx } from "../utils";
import { DialogCloseButton, DialogOverlay } from "./Dialog";
import "./Dialog.css";
import "./Sheet.css";

/* A dialog that slides in from an edge as a floating panel, inset 8px from the viewport. */

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
  return (
    <SheetPrimitive.Portal>
      <DialogOverlay />
      <SheetPrimitive.Content ref={ref} className={cx("rap-sheet", `rap-sheet--${side}`, className)} {...rest}>
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
