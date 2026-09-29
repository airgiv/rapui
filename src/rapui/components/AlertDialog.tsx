import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { cx } from "../utils";
import { Button, type ButtonProps, type ButtonVariant } from "./Button";
import { useMergedRef, useOpenCloseSound } from "./Dialog";
import "./Dialog.css";
import "./AlertDialog.css";

/**
 * A dialog that asks for a decision and can't be dismissed by clicking outside.
 * <AlertDialog><AlertDialogTrigger/><AlertDialogContent>…<AlertDialogCancel/><AlertDialogAction/>
 *
 * Delight: it is tossed in and falls away like Dialog (same `.rap-dialog` card),
 * and the `danger` action is nervous — while the pointer rests on it, it trembles
 * by about half a pixel and half a degree, as if it knows what it is about to do.
 * Small enough to stay perfectly clickable and readable; it only plays on hover
 * (not focus) so keyboard users aren't shown a jittering button, and it rides
 * on the individual `translate`/`rotate` properties so the Button's magnetic
 * `transform` still works underneath. Off under calm and reduced motion.
 * Sound (inside an enabled <SoundProvider>): pop as it lands; drop as it falls
 * away — which is also what confirming sounds like.
 */

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;

export const AlertDialogOverlay = forwardRef<
  ElementRef<typeof AlertDialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(function AlertDialogOverlay({ className, ...rest }, ref) {
  return <AlertDialogPrimitive.Overlay ref={ref} className={cx("rap-scrim", "rap-dialog-scrim", className)} {...rest} />;
});

export interface AlertDialogContentProps extends ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {
  size?: "sm" | "md" | "lg";
}

export const AlertDialogContent = forwardRef<ElementRef<typeof AlertDialogPrimitive.Content>, AlertDialogContentProps>(
  function AlertDialogContent({ className, size = "sm", ...rest }, ref) {
    const setRef = useMergedRef(ref, useOpenCloseSound("pop", "drop"));
    return (
      <AlertDialogPrimitive.Portal>
        <AlertDialogOverlay />
        <AlertDialogPrimitive.Content
          ref={setRef}
          className={cx("rap-dialog", `rap-dialog--${size}`, "rap-alertdialog", className)}
          {...rest}
        />
      </AlertDialogPrimitive.Portal>
    );
  },
);

export function AlertDialogHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-dialog-header", "rap-alertdialog-header", className)} {...rest} />;
}

export function AlertDialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-dialog-footer", className)} {...rest} />;
}

export const AlertDialogTitle = forwardRef<
  ElementRef<typeof AlertDialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(function AlertDialogTitle({ className, ...rest }, ref) {
  return <AlertDialogPrimitive.Title ref={ref} className={cx("rap-dialog-title", className)} {...rest} />;
});

export const AlertDialogDescription = forwardRef<
  ElementRef<typeof AlertDialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(function AlertDialogDescription({ className, ...rest }, ref) {
  return <AlertDialogPrimitive.Description ref={ref} className={cx("rap-dialog-description", className)} {...rest} />;
});

export interface AlertDialogActionProps extends Omit<ButtonProps, "variant"> {
  /** Any Button variant, or `danger` for destructive confirms (red, ink on hover). */
  variant?: ButtonVariant | "danger";
}

/** Confirms and closes. Renders the library Button. */
export const AlertDialogAction = forwardRef<HTMLButtonElement, AlertDialogActionProps>(function AlertDialogAction(
  { variant = "solid", className, ...rest },
  ref,
) {
  const danger = variant === "danger";
  return (
    <AlertDialogPrimitive.Action asChild>
      <Button
        ref={ref}
        variant={danger ? "solid" : variant}
        className={cx(danger && "rap-alertdialog-action--danger", className)}
        {...rest}
      />
    </AlertDialogPrimitive.Action>
  );
});

/** Closes without doing anything. A soft Button by default; gets focus when the dialog opens. */
export const AlertDialogCancel = forwardRef<HTMLButtonElement, ButtonProps>(function AlertDialogCancel(
  { variant = "soft", ...rest },
  ref,
) {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <Button ref={ref} variant={variant} {...rest} />
    </AlertDialogPrimitive.Cancel>
  );
});
