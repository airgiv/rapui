import type { HTMLAttributes } from "react";
import { useMagnetic } from "../hooks/useMagnetic";
import { cn } from "../utils";

export interface MagneticProps extends HTMLAttributes<HTMLDivElement> {
  strength?: number;
}

/** Wrap anything to make it follow the pointer a little. */
export function Magnetic({ strength = 0.35, className, style, ...rest }: MagneticProps) {
  const ref = useMagnetic<HTMLDivElement>(strength);
  return <div ref={ref} className={cn("rap-magnetic", className)} style={{ display: "inline-block", ...style }} {...rest} />;
}
