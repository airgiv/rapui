import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { HoverCard as HoverCardPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./HoverCard.css";

/* Preview card that opens on hover/focus. For sighted pointer users; keep the trigger a real link. */

export function HoverCard({ openDelay = 300, closeDelay = 150, ...rest }: ComponentPropsWithoutRef<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root openDelay={openDelay} closeDelay={closeDelay} {...rest} />;
}
export const HoverCardTrigger = HoverCardPrimitive.Trigger;

export const HoverCardContent = forwardRef<
  ElementRef<typeof HoverCardPrimitive.Content>,
  ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(function HoverCardContent({ className, sideOffset = 8, align = "center", collisionPadding = 12, ...rest }, ref) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        className={cx("rap-pop", "rap-hovercard", className)}
        {...rest}
      />
    </HoverCardPrimitive.Portal>
  );
});
