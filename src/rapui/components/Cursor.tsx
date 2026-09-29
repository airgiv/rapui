import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../utils";
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
    <div ref={dot} className={`rap-cursor ${blend && !label ? "rap-cursor--blend" : ""}`} data-state={state} style={{ ["--c-size" as string]: `${size}px` }} aria-hidden>
      <div className="rap-cursor__dot">{label && <span className="rap-cursor__label">{label}</span>}</div>
    </div>
  );
}
