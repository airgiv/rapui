import { forwardRef, useEffect, useImperativeHandle, useRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { cn } from "../utils";
import { createSpring, isCalm } from "./ProductTabs";

export interface ScrollAreaProps extends ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /** Which scrollbars to render. Default "vertical". */
  orientation?: "vertical" | "horizontal" | "both";
  /** Class for the inner viewport (the element that actually scrolls). */
  viewportClassName?: string;
}

/**
 * Custom-scrollbar container (Radix ScrollArea): native scrolling, a thin round
 * thumb on a clear track. Give it a height (or max-height) to make it scroll.
 *
 * Delight: the thumb is a soft bead. Keep scrolling after you hit the top or the end
 * and it squashes against that end — shorter along the track, a little fatter across
 * (volume kept, roughly) — by as much as you push, up to 35%. Let go and it springs
 * back (tune 70: one visible rebound, so for a moment it's taller than at rest). The
 * content itself never moves past the end; only the bead tells you "that's all".
 * Wheel and touch both push. The drawn thumb is the ::after of Radix's thumb, so the
 * squash can pivot on the end it's pressed against without fighting Radix's own
 * translate. Calm / reduced motion: no squash.
 */
const MAX_SQUASH = 35; // % of the thumb's length

export const ScrollArea = forwardRef<ElementRef<typeof ScrollAreaPrimitive.Root>, ScrollAreaProps>(function ScrollArea(
  { className, children, orientation = "vertical", viewportClassName, type = "hover", ...rest },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current as HTMLDivElement);

  useEffect(() => {
    const r = root.current;
    const v = viewport.current;
    if (!r || !v) return;
    const make = (axis: "x" | "y") => {
      let push = 0;
      let timer = 0;
      const spring = createSpring((n) => r.style.setProperty(`--sc-sq-${axis}`, (n / 100).toFixed(4)), 70);
      const release = () => {
        push = 0;
        spring.to(0);
      };
      return {
        press(amount: number, end: "start" | "end") {
          r.setAttribute(`data-squash-${axis}`, end);
          push = Math.min(MAX_SQUASH, push + amount);
          spring.to(push);
          window.clearTimeout(timer);
          timer = window.setTimeout(release, 140);
        },
        release,
        stop() {
          window.clearTimeout(timer);
          spring.stop();
        },
      };
    };
    const sq = { x: make("x"), y: make("y") };
    const edge = (axis: "x" | "y", delta: number): "start" | "end" | null => {
      const pos = axis === "y" ? v.scrollTop : v.scrollLeft;
      const max = axis === "y" ? v.scrollHeight - v.clientHeight : v.scrollWidth - v.clientWidth;
      if (max <= 1) return null;
      if (delta < 0 && pos <= 0) return "start";
      if (delta > 0 && pos >= max - 1) return "end";
      return null;
    };
    const allowed = (axis: "x" | "y") => (axis === "y" ? orientation !== "horizontal" : orientation !== "vertical");

    const onWheel = (e: WheelEvent) => {
      if (isCalm(r)) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? v.clientHeight : 1;
      const axis = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? "y" : "x";
      const delta = (axis === "y" ? e.deltaY : e.deltaX) * unit;
      if (!allowed(axis) || !delta) return;
      const end = edge(axis, delta);
      if (end) sq[axis].press(Math.min(12, Math.abs(delta) * 0.12), end);
    };

    let touch: { x: number; y: number } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch || isCalm(r)) return;
      const t = e.touches[0];
      const dx = touch.x - t.clientX;
      const dy = touch.y - t.clientY;
      touch = { x: t.clientX, y: t.clientY };
      const axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
      const delta = axis === "y" ? dy : dx;
      if (!allowed(axis) || !delta) return;
      const end = edge(axis, delta);
      if (end) sq[axis].press(Math.abs(delta) * 0.5, end);
    };
    const onTouchEnd = () => {
      touch = null;
    };

    v.addEventListener("wheel", onWheel, { passive: true });
    v.addEventListener("touchstart", onTouchStart, { passive: true });
    v.addEventListener("touchmove", onTouchMove, { passive: true });
    v.addEventListener("touchend", onTouchEnd);
    return () => {
      v.removeEventListener("wheel", onWheel);
      v.removeEventListener("touchstart", onTouchStart);
      v.removeEventListener("touchmove", onTouchMove);
      v.removeEventListener("touchend", onTouchEnd);
      sq.x.stop();
      sq.y.stop();
    };
  }, [orientation]);

  return (
    <ScrollAreaPrimitive.Root
      ref={root}
      type={type}
      data-slot="scroll-area"
      className={cn(
        // --sc-inset keeps the thumb clear of rounded corners
        "group/scroll relative overflow-hidden [--sc-size:6px] [--sc-pad:3px] [--sc-inset:10px]",
        className,
      )}
      {...rest}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewport}
        data-slot="scroll-area-viewport"
        className={cn(
          "size-full rounded-[inherit] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
          viewportClassName,
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" && <ScrollBar orientation="vertical" />}
      {orientation !== "vertical" && <ScrollBar orientation="horizontal" />}
      <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" className="bg-transparent" />
    </ScrollAreaPrimitive.Root>
  );
});

export const ScrollBar = forwardRef<
  ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(function ScrollBar({ className, orientation = "vertical", ...rest }, ref) {
  const vertical = orientation === "vertical";
  return (
    <ScrollAreaPrimitive.Scrollbar
      ref={ref}
      orientation={orientation}
      data-slot="scroll-area-scrollbar"
      className={cn(
        "group/bar flex p-(--sc-pad) touch-none select-none transition-opacity duration-(--rap-dur-fast) ease-rm data-[state=hidden]:opacity-0",
        vertical
          ? "w-[calc(var(--sc-size)+var(--sc-pad)*2)] h-full py-(--sc-inset)"
          : "flex-col h-[calc(var(--sc-size)+var(--sc-pad)*2)] px-(--sc-inset)",
        className,
      )}
      {...rest}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={cn(
          "relative flex-1 rounded-pill",
          // the bead you see: the ::after, so it can squash against the end it is pushed into
          // (pivoting on that end) without fighting Radix's own translate on the thumb
          "after:absolute after:inset-0 after:rounded-[inherit] after:bg-fill-strong",
          "after:transition-[background-color] after:duration-(--rap-dur-fast) after:ease-rm",
          // darker on hover; pressed-dark only once the pointer has left the bar (hover wins over it)
          "group-hover/bar:after:bg-mute group-[:not(:hover)]/bar:active:after:bg-ink-2",
          vertical
            ? "after:[scale:calc(1+var(--sc-sq-y,0)*0.6)_calc(1-var(--sc-sq-y,0))] after:origin-top group-data-[squash-y=end]/scroll:after:origin-bottom"
            : "after:[scale:calc(1-var(--sc-sq-x,0))_calc(1+var(--sc-sq-x,0)*0.6)] after:origin-left group-data-[squash-x=end]/scroll:after:origin-right",
          // bigger hit area than the visible thumb
          "before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-w-6 before:min-h-6 before:[transform:translate(-50%,-50%)]",
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
});
