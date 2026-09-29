import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./Tooltip.css";

/**
 * Ink pill label on hover/focus. Wrap the app in <TooltipProvider> to share the
 * open delay across tooltips; a lone <Tooltip> brings its own provider.
 */
export function TooltipProvider({ delayDuration = 300, ...rest }: ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...rest} />;
}

export function Tooltip({ delayDuration, ...rest }: ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive.Root {...rest} />
    </TooltipProvider>
  );
}

export const TooltipTrigger = TooltipPrimitive.Trigger;

export interface TooltipContentProps extends ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  /** Draw a small arrow pointing at the trigger. */
  arrow?: boolean;
}

export const TooltipContent = forwardRef<ElementRef<typeof TooltipPrimitive.Content>, TooltipContentProps>(function TooltipContent(
  { className, children, sideOffset = 6, collisionPadding = 8, arrow = false, ...rest },
  ref,
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cx("rap-tooltip", className)}
        {...rest}
      >
        {children}
        {arrow && <TooltipPrimitive.Arrow className="rap-tooltip__arrow" width={12} height={6} />}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
