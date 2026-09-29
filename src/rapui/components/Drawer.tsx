import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cx } from "../utils";
import { createSpring, isCalm, useMergedRef, useOpenCloseSound } from "./Dialog";
import "./Dialog.css";
import "./Drawer.css";

/**
 * Bottom drawer (vaul): drag it down or flick to dismiss. Good for mobile-first
 * pickers and quick settings. <Drawer><DrawerTrigger/><DrawerContent>…
 *
 * Delight: the grab handle is taffy. Press the drawer and the handle widens a
 * little (you've got hold of it); drag and it stretches with the distance —
 * longer and thinner, keeping roughly its area, the way a rubber band gets
 * thin — and when you let go it snaps back on a lively spring (tune 80) and
 * wobbles once. Stretch is 0.35px per px dragged and capped at +90px, so it
 * reads clearly at a short tug but never runs across the whole drawer; dragging
 * up (against vaul's resistance) stretches it too. It's written straight to
 * CSS variables by an imperative spring (same maths as useSpring) so a drag
 * doesn't re-render the drawer 60 times a second. Off under calm / reduced motion.
 * Sound (inside an enabled <SoundProvider>): a whoosh in and out.
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

const GRAB = 6; // px wider the moment you take hold
const PER_PX = 0.35; // stretch per px dragged
const MAX = 90; // px

export const DrawerContent = forwardRef<ElementRef<typeof DrawerPrimitive.Content>, DrawerContentProps>(function DrawerContent(
  { className, children, handle = true, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, ...rest },
  ref,
) {
  const handleRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef<number | null>(null);
  const spring = useRef<ReturnType<typeof createSpring> | null>(null);

  const setHandle = useCallback((node: HTMLDivElement | null) => {
    handleRef.current = node;
    spring.current?.stop();
    spring.current = node
      ? createSpring((v) => {
          const s = Math.max(-8, v);
          node.style.setProperty("--drawer-stretch", `${s.toFixed(2)}px`);
          // thinner as it gets longer: keep about the same area (height 5px → ~2.8px at full stretch)
          node.style.setProperty("--drawer-thin", (44 / (44 + s)).toFixed(3));
        }, 80)
      : null;
  }, []);
  useEffect(() => () => spring.current?.stop(), []);

  const grab = (e: ReactPointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e);
    if (!handleRef.current || isCalm(handleRef.current)) return;
    startY.current = e.clientY;
    spring.current?.to(GRAB);
  };
  const pull = (e: ReactPointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    if (startY.current === null || !handleRef.current) return;
    // only while vaul is really dragging (not when the drawer's content is scrolling)
    const dragging = e.currentTarget.classList.contains("vaul-dragging");
    const dy = Math.abs(e.clientY - startY.current);
    spring.current?.to(dragging ? Math.min(MAX, GRAB + dy * PER_PX) : GRAB);
  };
  const setRef = useMergedRef(ref, useOpenCloseSound("whoosh", "whoosh"));
  const release = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.type === "pointercancel") onPointerCancel?.(e);
    else onPointerUp?.(e);
    if (startY.current === null) return;
    startY.current = null;
    spring.current?.to(0);
  };

  return (
    <DrawerPrimitive.Portal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={setRef}
        className={cx("rap-drawer", className)}
        onPointerDown={grab}
        onPointerMove={pull}
        onPointerUp={release}
        onPointerCancel={release}
        {...rest}
      >
        {handle && <div ref={setHandle} className="rap-drawer__handle" aria-hidden />}
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
