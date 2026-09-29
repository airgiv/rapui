import { useRef, type HTMLAttributes, type PointerEvent } from "react";
import { cx, prefersReducedMotion } from "../utils";
import "./TiltCard.css";

export interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Max tilt, degrees. */
  max?: number;
  tone?: "paper" | "ink" | "flame" | "acid" | "blue" | "plum" | "bubble" | "sky";
  /** Show the cursor-following glow. */
  spotlight?: boolean;
}

/** 3D-tilting card with a spotlight glow that follows the pointer. */
export function TiltCard({ max = 10, tone = "paper", spotlight = true, className, children, onPointerMove, onPointerLeave, ...rest }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };
  const leave = (e: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e);
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="rap-tilt-wrap">
      <div
        ref={ref}
        className={cx("rap-tilt", `rap-tilt--${tone}`, spotlight && "rap-tilt--spot", className)}
        onPointerMove={move}
        onPointerLeave={leave}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}
