import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { cn } from "../utils";
import { Button, type ButtonProps, type ButtonVariant } from "./Button";
import {
  dialogContentVariants,
  dialogDescriptionClass,
  dialogFooterClass,
  dialogHeaderClass,
  dialogTitleClass,
  useMergedRef,
  useOpenCloseSound,
} from "./Dialog";
import "./AlertDialog.css";

/**
 * A dialog that asks for a decision and can't be dismissed by clicking outside.
 * <AlertDialog><AlertDialogTrigger/><AlertDialogContent>…<AlertDialogCancel/><AlertDialogAction/>
 *
 * Delight: it is tossed in and falls away like Dialog (same card, `dialogContentVariants`),
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
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      data-slot="alert-dialog-overlay"
      className={cn(
        // the scrim stays dim while the card is falling (as Dialog's)
        "scrim fun:data-[state=closed]:[animation-duration:380ms] motion-reduce:data-[state=closed]:[animation-duration:1ms]",
        className,
      )}
      {...rest}
    />
  );
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
          data-slot="alert-dialog-content"
          data-size={size}
          className={cn(dialogContentVariants({ size }), "gap-6", className)}
          {...rest}
        />
      </AlertDialogPrimitive.Portal>
    );
  },
);

export function AlertDialogHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  // no close button to clear, so no right padding
  return <div data-slot="alert-dialog-header" className={cn(dialogHeaderClass, "pr-0", className)} {...rest} />;
}

export function AlertDialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="alert-dialog-footer" className={cn(dialogFooterClass, className)} {...rest} />;
}

export const AlertDialogTitle = forwardRef<
  ElementRef<typeof AlertDialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(function AlertDialogTitle({ className, ...rest }, ref) {
  return <AlertDialogPrimitive.Title ref={ref} data-slot="alert-dialog-title" className={cn(dialogTitleClass, className)} {...rest} />;
});

export const AlertDialogDescription = forwardRef<
  ElementRef<typeof AlertDialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(function AlertDialogDescription({ className, ...rest }, ref) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      data-slot="alert-dialog-description"
      className={cn(dialogDescriptionClass, className)}
      {...rest}
    />
  );
});

export interface AlertDialogActionProps extends Omit<ButtonProps, "variant"> {
  /** Any Button variant, or `danger` for destructive confirms (red, ink on hover). */
  variant?: ButtonVariant | "danger";
}

/* destructive confirm: a solid Button re-coloured through its own custom
   properties — red pill, ink blob on hover (cn/tailwind-merge replaces the
   solid variant's --btn-* values) — and marked data-variant="danger".
   Nervous: a small tremble while hovered (AlertDialog.css keyframes). `hover:`
   only applies to real pointers, and `translate`/`rotate` stack with the
   Button's magnetic transform. */
const dangerAction = cn(
  "[--btn-bg:var(--rap-danger)] [--btn-fg:#ffffff] [--btn-blob:var(--rap-ink)] [--btn-blob-fg:var(--rap-paper)]",
  "fun:enabled:hover:animate-[rap-alertdialog-tremble_240ms_linear_infinite]",
);

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
        {...(danger ? { "data-variant": "danger" } : null)}
        className={cn(danger && dangerAction, className)}
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
