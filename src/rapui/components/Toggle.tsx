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
import { cx } from "../utils";
import "./Toggle.css";

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
      className={cx("rap-toggle", `rap-toggle--${size}`, `rap-toggle--${variant}`, className)}
      onPressedChange={(on) => {
        sound.play(on ? "toggleOn" : "toggleOff");
        onPressedChange?.(on);
      }}
      {...rest}
    />
  );
});
