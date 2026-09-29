import { forwardRef, useCallback, useEffect, useRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { HoverCard as HoverCardPrimitive } from "radix-ui";
import { clamp, cx } from "../utils";
import { createSpring, isCalm, useMergedRef, useOpenCloseSound } from "./Dialog";
import "./Popover.css";
import "./HoverCard.css";

/* Preview card that opens on hover/focus. For sighted pointer users; keep the trigger a real link.

   Delight: the card is aware of your pointer. It swings out of the link like
   a Popover (shared `.rap-pop--swing`), and while it is open it TILTS TOWARD
   THE POINTER in 3D — the edge nearest the pointer dips away, as if your
   finger were resting on it — so as you move from the link onto the card it
   turns to "look" at you and follows you across its face. At most 6°, with a
   700px perspective: enough to read as a physical card, not enough to blur
   text. Outside the card the lean is the pointer's direction at full strength,
   inside it scales with distance from the centre. Two imperative springs
   (useSpring maths, tune 50) write CSS variables, so pointer moves never
   re-render the card; they park when settled and stop on close. Off under
   calm and reduced motion. Sound: a soft pop (0.4). */

const MAX_TILT = 6; // degrees

export function HoverCard({ openDelay = 300, closeDelay = 150, ...rest }: ComponentPropsWithoutRef<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root openDelay={openDelay} closeDelay={closeDelay} {...rest} />;
}
export const HoverCardTrigger = HoverCardPrimitive.Trigger;

function usePointerTilt() {
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);
  return useCallback((node: HTMLElement | null) => {
    if (!node) return;
    cleanup.current?.();
    cleanup.current = null;
    if (isCalm(node)) return;
    const rx = createSpring((v) => node.style.setProperty("--hc-rx", `${v.toFixed(2)}deg`));
    const ry = createSpring((v) => node.style.setProperty("--hc-ry", `${v.toFixed(2)}deg`));
    const move = (e: PointerEvent) => {
      if (node.getAttribute("data-state") === "closed" || !node.isConnected) return;
      const r = node.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // tilt about the card's centre, not about Radix's origin at the link
      const [ox, oy] = getComputedStyle(node).transformOrigin.split(" ").map(parseFloat);
      node.style.setProperty("--hc-ox", `${(node.offsetWidth / 2 - (ox || 0)).toFixed(1)}px`);
      node.style.setProperty("--hc-oy", `${(node.offsetHeight / 2 - (oy || 0)).toFixed(1)}px`);
      let nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const inside = Math.abs(nx) <= 1 && Math.abs(ny) <= 1;
      if (!inside) {
        // outside: lean fully toward where the pointer is
        const m = Math.max(Math.abs(nx), Math.abs(ny));
        nx /= m;
        ny /= m;
      }
      // right of centre → right edge recedes (+rotateY); below → bottom recedes (-rotateX)
      ry.to(clamp(nx, -1, 1) * MAX_TILT);
      rx.to(-clamp(ny, -1, 1) * MAX_TILT);
    };
    const settle = () => {
      rx.to(0);
      ry.to(0);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", settle);
    // flatten as it closes so it folds back into the link level
    const mo = new MutationObserver(() => node.getAttribute("data-state") === "closed" && settle());
    mo.observe(node, { attributes: true, attributeFilter: ["data-state"] });
    cleanup.current = () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", settle);
      mo.disconnect();
      rx.stop();
      ry.stop();
    };
  }, []);
}

export const HoverCardContent = forwardRef<
  ElementRef<typeof HoverCardPrimitive.Content>,
  ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(function HoverCardContent({ className, sideOffset = 8, align = "center", collisionPadding = 12, ...rest }, ref) {
  const tilt = usePointerTilt();
  const sound = useOpenCloseSound("pop", undefined, 0.4);
  const local = useCallback(
    (node: HTMLDivElement | null) => {
      tilt(node);
      sound(node);
    },
    [tilt, sound],
  );
  const setRef = useMergedRef(ref, local);
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        ref={setRef}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        className={cx("rap-pop", "rap-pop--swing", "rap-hovercard", className)}
        {...rest}
      />
    </HoverCardPrimitive.Portal>
  );
});
