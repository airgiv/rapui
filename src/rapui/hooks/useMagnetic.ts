import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../utils";

/** Pulls the element toward the pointer while hovered, springs back on leave. */
export function useMagnetic<T extends HTMLElement>(strength = 0.35, enabled = true) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || prefersReducedMotion()) return;
    let frame = 0;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transition = "transform 120ms linear";
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      el.style.transition = "transform 700ms var(--rap-ease-spring)";
      el.style.transform = "translate3d(0, 0, 0)";
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength, enabled]);

  return ref;
}
