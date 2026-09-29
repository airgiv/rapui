import { useEffect, useRef, useState } from "react";
import { cn, prefersReducedMotion } from "../utils";
import "./Cursor.css";

export interface CursorProps {
  /** Blend with the page (inverts colours underneath). */
  blend?: boolean;
  size?: number;
}

/**
 * Custom trailing cursor. Grows over links/buttons; shows a label over
 * any element with `data-rap-cursor="Label"`. Hidden on touch devices.
 */
export function Cursor({ blend = true, size = 18 }: CursorProps) {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || prefersReducedMotion()) return;
    setEnabled(true);
    document.documentElement.classList.add("rap-has-cursor");

    let x = -100, y = -100, cx = x, cy = y, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target as Element | null;
      const labelled = t?.closest?.("[data-rap-cursor]");
      setLabel(labelled?.getAttribute("data-rap-cursor") || null);
      setHover(!!t?.closest?.("a, button, [role=button], [role=tab], [role=switch], input, label, textarea, select"));
    };
    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      if (dot.current) dot.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("rap-has-cursor");
    };
  }, []);

  if (!enabled) return null;
  const state = label ? "label" : hover ? "hover" : "idle";
  return (
    <div
      ref={dot}
      data-slot="cursor"
      data-state={state}
      /* difference-blended white inverts whatever it passes over; a label
         turns the blend off so the acid disc and its words read as they are */
      className={cn("group/cursor fixed left-0 top-0 z-9999 pointer-events-none", blend && !label && "mix-blend-difference")}
      style={{ ["--c-size" as string]: `${size}px` }}
      aria-hidden
    >
      <div
        data-slot="cursor-dot"
        className={cn(
          "grid place-items-center size-(--c-size) rounded-full bg-white -translate-x-1/2 -translate-y-1/2",
          "[transition:width_var(--rap-dur)_var(--rap-ease-out),height_var(--rap-dur)_var(--rap-ease-out),background_var(--rap-dur-fast)]",
          "group-data-[state=hover]/cursor:size-[calc(var(--c-size)*3.4)]",
          "group-data-[state=label]/cursor:size-28 group-data-[state=label]/cursor:bg-acid",
        )}
      >
        {label && (
          <span
            data-slot="cursor-label"
            className="font-display text-[0.85rem] font-medium tracking-[-0.02em] text-[#282828] text-center animate-[rap-cursor-in_300ms_var(--rap-ease-out)]"
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
