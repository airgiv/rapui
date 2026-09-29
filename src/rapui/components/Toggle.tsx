/* ══ Toggle ═══════════════════════════════════════════════
   A single on/off pill button (Radix Toggle) — Bold, Snap to grid,
   Show guides. On = ink.

   DELIGHT — A PHYSICAL KEY. At rest (off) the pill stands 2px
   proud of the surface on a darker lip, like a keycap. Pressing
   it pushes it down onto the surface; if that turned it ON, it
   STAYS down — sunk 2px, lip gone, with a soft inset shade along
   its top edge where the surround overhangs it — the way a
   latching key (caps lock, a radio button on an old tape deck)
   tells you it is engaged without a light. Turning it off lets
   it spring back up past level and settle (--rap-ease-back).

   2px because that is the lip: it is exactly as far as the key
   can go before it would be under the surface. Ghost toggles
   (toolbars) have no lip at rest — they only sink.

   The state is immediate; the travel is 90ms down and a 380ms
   spring up. Reduced motion / data-rap-motion="calm": the key
   still shows up or down (that is the state), with no overshoot.
   Sound: "toggleOn" / "toggleOff". */
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Toggle as TogglePrimitive } from "radix-ui";
import { useSound } from "../sound";
import { cva } from "class-variance-authority";
import { cn } from "../utils";

/* The key's travel is written once, reading two local properties:
   --tg-travel / --tg-curve are 380ms on the back-out curve (springs up past
   level and settles) at rest, and 90ms on --rap-ease-rm while pressed or
   engaged (going down is quick and dead). Calm / reduced motion keep the
   up/down (that is the state) but drop the overshoot. */
const toggleVariants = cva(
  [
    "inline-flex items-center justify-center gap-[0.45rem] h-(--tg-h) min-w-(--tg-h) px-[calc(var(--tg-h)*0.36)]",
    "border-0 rounded-pill bg-fill text-ink font-sans font-medium tracking-[-0.01em] whitespace-nowrap cursor-pointer",
    // the keycap's travel: it stands this far proud of the surface when up
    "[--tg-lip:2px] [--tg-travel:380ms] [--tg-curve:cubic-bezier(0.34,1.8,0.64,1)]",
    "[transition:background-color_var(--rap-dur-fast)_var(--rap-ease-rm),color_var(--rap-dur-fast)_var(--rap-ease-rm),translate_var(--tg-travel)_var(--tg-curve),box-shadow_var(--tg-travel)_var(--tg-curve)]",
    "active:[--tg-travel:90ms] active:[--tg-curve:var(--rap-ease-rm)] data-[state=on]:[--tg-travel:90ms] data-[state=on]:[--tg-curve:var(--rap-ease-rm)]",
    "calm:[--tg-curve:var(--rap-ease-rm)]! motion-reduce:[--tg-curve:var(--rap-ease-rm)]!",
    "not-data-[state=on]:hover:bg-fill-hover data-[state=on]:bg-ink data-[state=on]:text-paper",
    // down: on the surface, lip gone, the surround's shadow along the top edge (lighter for a
    // press that has not latched)
    "data-[state=on]:shadow-[0_0_0_transparent,inset_0_2px_3px_rgb(0_0_0/0.28),inset_0_-1px_0_rgb(255_255_255/0.06)]",
    "active:not-data-[state=on]:shadow-[0_0_0_transparent,inset_0_2px_3px_rgb(0_0_0/0.12)]",
    "focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-ring!",
    "disabled:opacity-40 disabled:pointer-events-none [&_svg]:size-[18px] [&_svg]:flex-none",
  ],
  {
    variants: {
      size: {
        sm: "[--tg-h:var(--rap-control-h-sm)] text-[0.875rem] [&_svg]:size-4",
        md: "[--tg-h:var(--rap-control-h)] text-[0.9375rem]",
        lg: "[--tg-h:var(--rap-control-h-lg)] text-[1rem]",
      },
      variant: {
        // up: lifted by the lip, standing on it; down: level; a held press on an
        // engaged key goes the last pixel further
        default: [
          "-translate-y-(--tg-lip) shadow-[0_var(--tg-lip)_0_var(--rap-fill-strong)]",
          "active:translate-y-0 data-[state=on]:translate-y-0 data-[state=on]:active:translate-y-px",
        ],
        // toolbars: no lip at rest, it only sinks
        ghost: "bg-transparent active:translate-y-px data-[state=on]:translate-y-px",
      },
    },
    defaultVariants: { size: "md", variant: "default" },
  },
);

export interface ToggleProps extends ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
  size?: "sm" | "md" | "lg";
  /** `default` sits on a fill; `ghost` is transparent until hovered (for toolbars). */
  variant?: "default" | "ghost";
}

/** A single on/off pill key (Radix Toggle) — Bold, Snap to grid, Show guides. On = ink, and it stays pressed down. */
export const Toggle = forwardRef<ElementRef<typeof TogglePrimitive.Root>, ToggleProps>(function Toggle(
  { className, size = "md", variant = "default", onPressedChange, ...rest },
  ref,
) {
  const sound = useSound();
  return (
    <TogglePrimitive.Root
      ref={ref}
      data-slot="toggle"
      data-size={size}
      data-variant={variant}
      className={cn(toggleVariants({ size, variant }), className)}
      onPressedChange={(on) => {
        sound.play(on ? "toggleOn" : "toggleOff");
        onPressedChange?.(on);
      }}
      {...rest}
    />
  );
});
