import { createContext, forwardRef, useContext, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "../utils";
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
        data-slot="tooltip-content"
        className={cn(
          "group/tooltip z-1100 inline-flex items-center gap-2 max-w-[260px] py-[0.4rem] px-[0.8rem] rounded-pill bg-ink text-paper",
          "font-sans text-[0.8125rem] font-medium leading-[1.3] tracking-[-0.01em] origin-(--radix-tooltip-content-transform-origin)",
          // calm: a plain quick scale; reduced motion: 1ms
          "animate-[rap-tooltip-in_180ms_var(--rap-ease-spring)] motion-reduce:animate-[rap-tooltip-in_1ms_linear]",
          // pop with overshoot: useSpring tune 40 (k .144, d .70) sampled every 2 frames
          "fun:animate-[rap-tooltip-pop_360ms_linear(0,0.262,0.636,0.94,1.109,1.156,1.127,1.07,1.019,0.988,0.977,0.979,0.987,0.995,1)]",
          // sweeping along a row of triggers: a smaller, quicker pop
          "fun:data-[state=instant-open]:[animation-name:rap-tooltip-pop-small] fun:data-[state=instant-open]:[animation-duration:240ms]",
          "data-[state=closed]:animate-[rap-tooltip-out_120ms_var(--rap-ease-rm)_forwards]",
          "motion-reduce:data-[state=closed]:animate-[rap-tooltip-out_1ms_linear_forwards]",
          // shortcut hint inside a tooltip
          "[&_kbd]:[font-family:inherit] [&_kbd]:text-[0.75rem] [&_kbd]:opacity-60",
          className,
        )}
        {...rest}
      >
        {children}
        {arrow && (
          <TooltipPrimitive.Arrow
            data-slot="tooltip-arrow"
            className={cn(
              // wags about its base (the edge touching the pill), once the pill has nearly arrived
              "fill-ink origin-[50%_0] fun:animate-[rap-tooltip-wag_520ms_var(--rap-ease-out)_120ms_both]",
              "group-data-[state=instant-open]/tooltip:animate-none",
            )}
            width={12}
            height={6}
          />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
