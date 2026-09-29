import { createContext, useCallback, useContext, useEffect, useRef, type Ref } from "react";
import { Group, Panel, Separator, type GroupProps, type PanelProps, type SeparatorProps } from "react-resizable-panels";
import { useSound } from "../sound";
import { cn } from "../utils";
import { createSpring, isCalm } from "./ProductTabs";

/*
 * Built on react-resizable-panels v4 (Group / Panel / Separator).
 * Size props: numbers are PIXELS, strings are percentages ("25" or "25%") or CSS units ("16rem").
 *
 * Delight: the grip is a little rubber tab. Grab it and it stretches 25% along its length
 * (and thins, keeping its volume); drag fast and it stretches further with your speed, up
 * to ~90%; pull it into a panel's min or max and it jolts long for an instant — the stop
 * you just hit. Let go and it snaps back on a lively spring (tune 80: two small rebounds),
 * like elastic. Panels resize exactly as before; only the grip is rubber. It is driven
 * imperatively (a CSS variable on the handle) so dragging never re-renders React.
 * Calm / reduced motion: the grip just lights up.
 * Sound (opt-in via SoundProvider): a firm detent when a panel hits its min or max.
 */

export interface ResizablePanelGroupProps extends GroupProps {
  /** "tiles" gives each panel a filled, rounded surface 4px apart; "plain" leaves them bare. */
  variant?: "tiles" | "plain";
}

/* the group's orientation, so each handle knows which way its gap and grip run */
const OrientationCtx = createContext<"horizontal" | "vertical">("horizontal");

export function ResizablePanelGroup({ className, variant = "tiles", orientation = "horizontal", ...rest }: ResizablePanelGroupProps) {
  return (
    <OrientationCtx.Provider value={orientation}>
      <Group
        orientation={orientation}
        data-slot="resizable-panel-group"
        data-variant={variant}
        className={cn(
          "size-full font-sans",
          // tiles: each panel's own box (the library's inner div) is a filled, rounded surface
          variant === "tiles" && "[&>[data-panel]>*]:rounded-pop [&>[data-panel]>*]:bg-fill",
          className,
        )}
        {...rest}
      />
    </OrientationCtx.Provider>
  );
}

/** `className` styles the panel's content box; the outer flex item carries data-slot. */
export function ResizablePanel({ className, ...rest }: PanelProps) {
  return <Panel data-slot="resizable-panel" className={className} {...rest} />;
}

export interface ResizableHandleProps extends SeparatorProps {
  /** Show a small grip pill in the gap. */
  withHandle?: boolean;
}

export function ResizableHandle({ className, withHandle, children, elementRef, ...rest }: ResizableHandleProps) {
  const horizontal = useContext(OrientationCtx) === "horizontal";
  const el = useRef<HTMLDivElement | null>(null);
  const sound = useSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      el.current = node;
      const r = elementRef as Ref<HTMLDivElement> | undefined;
      if (typeof r === "function") r(node);
      else if (r) (r as { current: HTMLDivElement | null }).current = node;
    },
    [elementRef],
  );

  useEffect(() => {
    const h = el.current;
    if (!h) return;
    const spring = createSpring((v) => h.style.setProperty("--grip-s", v.toFixed(4)), 80);
    let active = false;
    let last: { p: number; t: number } | null = null;
    let atLimit = false;
    const axis = () => (h.getAttribute("aria-orientation") === "horizontal" ? "y" : "x");
    const limit = () => {
      const now = Number(h.getAttribute("aria-valuenow"));
      const min = Number(h.getAttribute("aria-valuemin"));
      const max = Number(h.getAttribute("aria-valuemax"));
      if (!Number.isFinite(now)) return false;
      return Math.abs(now - min) < 0.05 || Math.abs(now - max) < 0.05;
    };
    const onMove = (e: PointerEvent) => {
      const p = axis() === "x" ? e.clientX : e.clientY;
      const t = performance.now();
      const calm = isCalm(h);
      if (last && !calm) {
        const v = Math.abs(p - last.p) / Math.max(8, t - last.t); // px per ms
        spring.to(0.25 + Math.min(0.65, v * 0.35));
      }
      last = { p, t };
      // the stop: fires once on the way into a limit
      const hit = limit();
      if (hit && !atLimit) {
        soundRef.current.detent(1);
        if (!calm) spring.to(1);
      }
      atLimit = hit;
    };
    const sync = () => {
      const now = h.getAttribute("data-separator") === "active";
      if (now === active) return;
      active = now;
      if (active) {
        last = null;
        atLimit = limit();
        if (!isCalm(h)) spring.to(0.25);
        window.addEventListener("pointermove", onMove);
      } else {
        window.removeEventListener("pointermove", onMove);
        spring.to(0);
      }
    };
    const mo = new MutationObserver(sync);
    mo.observe(h, { attributes: true, attributeFilter: ["data-separator"] });
    sync();
    return () => {
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      spring.stop();
    };
  }, []);

  return (
    <Separator
      elementRef={setRef}
      data-slot="resizable-handle"
      className={cn(
        // the handle is the 4px gap between tiles; it lights up on hover and while dragging
        "group/handle relative flex items-center justify-center flex-none outline-none",
        "after:absolute after:rounded-pill after:bg-transparent after:transition-[background-color] after:duration-(--rap-dur-fast) after:ease-rm",
        horizontal ? "w-tile after:inset-y-3 after:inset-x-px" : "h-tile after:inset-x-3 after:inset-y-px",
        "data-[separator=hover]:after:bg-fill-strong data-[separator=active]:after:bg-select data-[separator=focus]:after:bg-select",
        "data-[separator=disabled]:pointer-events-none",
        className,
      )}
      {...rest}
    >
      {withHandle && (
        <span
          data-slot="resizable-grip"
          aria-hidden
          className={cn(
            "relative z-1 flex-none rounded-pill bg-mute",
            "[transition:background_var(--rap-dur-fast)_var(--rap-ease-rm),transform_var(--rap-dur-fast)_var(--rap-ease-spring)]",
            "group-data-[separator=hover]/handle:bg-ink-2 group-data-[separator=active]/handle:bg-select group-data-[separator=focus]/handle:bg-select",
            // rubber: --grip-s (0 rest … ~1 at a hard stop) is sprung from the effect above.
            // Calm / reduced motion: the old fixed stretch while dragging, no rubber.
            horizontal
              ? "w-1 h-8 [scale:calc(1-var(--grip-s,0)*0.3)_calc(1+var(--grip-s,0))] calm:group-data-[separator=active]/handle:[transform:scaleY(1.25)]"
              : "w-8 h-1 [scale:calc(1+var(--grip-s,0))_calc(1-var(--grip-s,0)*0.3)] calm:group-data-[separator=active]/handle:[transform:scaleX(1.25)]",
            "calm:[scale:none]",
          )}
        />
      )}
      {children}
    </Separator>
  );
}

export type { PanelImperativeHandle, GroupImperativeHandle, Layout as ResizableLayout } from "react-resizable-panels";
export { usePanelRef, useGroupRef } from "react-resizable-panels";
