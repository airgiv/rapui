import type { HTMLAttributes } from "react";
import { useMagnetic } from "../hooks/useMagnetic";
import { cx } from "../utils";

export interface MagneticProps extends HTMLAttributes<HTMLDivElement> {
  strength?: number;
}

/** Wrap anything to make it follow the pointer a little. */
export function Magnetic({ strength = 0.35, className, style, ...rest }: MagneticProps) {
  const ref = useMagnetic<HTMLDivElement>(strength);
  return <div ref={ref} className={cx("rap-magnetic", className)} style={{ display: "inline-block", ...style }} {...rest} />;
}
