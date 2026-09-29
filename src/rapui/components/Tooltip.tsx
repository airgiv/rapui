import { createContext, forwardRef, useContext, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cx } from "../utils";
import { useMergedRef, useOpenCloseSound } from "./Dialog";
import "./Tooltip.css";

/**
 * Ink pill label on hover/focus. Wrap the app in <TooltipProvider> to share the
 * open delay across tooltips; a lone <Tooltip> brings its own provider.
 *
 * Delight: the pill pops out of the trigger with a real overshoot (useSpring
 * tune 40 sampled into CSS `linear()`: from 50% to ~105% and back), and then
 * the arrow WAGS once — a quick ±16° swing about its base that dies out, like
 * a finger pointing "this one". The wag starts 120ms in, once the pill has
 * nearly arrived, so the two read as cause and effect rather than one blur.
 * When tooltips open instantly one after another (Radix `instant-open`, the
 * pointer sweeping along a toolbar) the pop is quicker and smaller, so a
 * sweep feels like flicking through labels rather than a string of bounces.
 * Calm and reduced motion keep the plain quick scale. Sound: a soft pop (0.4).
 */
// Tells a <Tooltip> that a shared provider is already above it, so it must not
// bring its own: a private provider per tooltip would reset the skip-delay and
// a sweep along a toolbar would wait the full delay on every button.
const InProvider = createContext(false);

export function TooltipProvider({ delayDuration = 300, ...rest }: ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) {
  return (
    <InProvider.Provider value>
      <TooltipPrimitive.Provider delayDuration={delayDuration} {...rest} />
    </InProvider.Provider>
  );
}

export function Tooltip({ delayDuration, ...rest }: ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) {
  const shared = useContext(InProvider);
  if (shared) return <TooltipPrimitive.Root delayDuration={delayDuration} {...rest} />;
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
  const setRef = useMergedRef(ref, useOpenCloseSound("pop", undefined, 0.4));
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={setRef}
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
