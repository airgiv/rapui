import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "../icons";
import { cx } from "../utils";
import "./Dialog.css";

/* Composable, shadcn-style: <Dialog><DialogTrigger/><DialogContent><DialogHeader><DialogTitle/>… */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...rest }, ref) {
  return <DialogPrimitive.Overlay ref={ref} className={cx("rap-scrim", className)} {...rest} />;
});

/** The round 36px close button used by Dialog and Sheet. */
export const DialogCloseButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(function DialogCloseButton(
  { className, ...rest },
  ref,
) {
  return (
    <DialogPrimitive.Close ref={ref} className={cx("rap-dialog-x", className)} aria-label="Close" {...rest}>
      <X aria-hidden />
    </DialogPrimitive.Close>
  );
});

export interface DialogContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Card width: sm 400px, md 520px, lg 720px. */
  size?: "sm" | "md" | "lg";
  /** Show the round close button in the top-right corner. */
  showClose?: boolean;
}

/** Centred card on a scrim. Focus is trapped; Esc and a click outside close it. */
export const DialogContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(function DialogContent(
  { className, children, size = "md", showClose = true, ...rest },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content ref={ref} className={cx("rap-dialog", `rap-dialog--${size}`, className)} {...rest}>
        {children}
        {showClose && <DialogCloseButton />}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-dialog-header", className)} {...rest} />;
}

/** Actions row: right-aligned, buttons 2px apart. */
export function DialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-dialog-footer", className)} {...rest} />;
}

export const DialogTitle = forwardRef<ElementRef<typeof DialogPrimitive.Title>, ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
  function DialogTitle({ className, ...rest }, ref) {
    return <DialogPrimitive.Title ref={ref} className={cx("rap-dialog-title", className)} {...rest} />;
  },
);

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...rest }, ref) {
  return <DialogPrimitive.Description ref={ref} className={cx("rap-dialog-description", className)} {...rest} />;
});
