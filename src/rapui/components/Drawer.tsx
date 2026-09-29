import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cx } from "../utils";
import "./Dialog.css";
import "./Drawer.css";

/**
 * Bottom drawer (vaul): drag it down or flick to dismiss. Good for mobile-first
 * pickers and quick settings. <Drawer><DrawerTrigger/><DrawerContent>…
 */
export function Drawer({ shouldScaleBackground = false, ...rest }: ComponentPropsWithoutRef<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...rest} />;
}

export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerPortal = DrawerPrimitive.Portal;
export const DrawerClose = DrawerPrimitive.Close;

export const DrawerOverlay = forwardRef<
  ElementRef<typeof DrawerPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(function DrawerOverlay({ className, ...rest }, ref) {
  return <DrawerPrimitive.Overlay ref={ref} className={cx("rap-scrim", "rap-drawer-scrim", className)} {...rest} />;
});

export interface DrawerContentProps extends ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> {
  /** Show the grab handle at the top. */
  handle?: boolean;
}

export const DrawerContent = forwardRef<ElementRef<typeof DrawerPrimitive.Content>, DrawerContentProps>(function DrawerContent(
  { className, children, handle = true, ...rest },
  ref,
) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerOverlay />
      <DrawerPrimitive.Content ref={ref} className={cx("rap-drawer", className)} {...rest}>
        {handle && <div className="rap-drawer__handle" aria-hidden />}
        <div className="rap-drawer__inner">{children}</div>
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
});

export function DrawerHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-dialog-header", "rap-drawer-header", className)} {...rest} />;
}

export function DrawerFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rap-dialog-footer", "rap-drawer-footer", className)} {...rest} />;
}

export const DrawerTitle = forwardRef<ElementRef<typeof DrawerPrimitive.Title>, ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>>(
  function DrawerTitle({ className, ...rest }, ref) {
    return <DrawerPrimitive.Title ref={ref} className={cx("rap-dialog-title", className)} {...rest} />;
  },
);

export const DrawerDescription = forwardRef<
  ElementRef<typeof DrawerPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(function DrawerDescription({ className, ...rest }, ref) {
  return <DrawerPrimitive.Description ref={ref} className={cx("rap-dialog-description", className)} {...rest} />;
});
