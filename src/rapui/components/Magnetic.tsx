import { useEffect, useState, type HTMLAttributes } from "react";
import { useMagnetic } from "../hooks/useMagnetic";
import { isCalm } from "../hooks/useGlide";
import { cn } from "../utils";

export interface MagneticProps extends HTMLAttributes<HTMLDivElement> {
  strength?: number;
}

/**
 * Wrap anything to make it follow the pointer a little.
 * Calm: no pull — the pull is pure play, and whatever is wrapped keeps its own hover.
 */
export function Magnetic({ strength = 0.35, className, style, ...rest }: MagneticProps) {
  /* read once mounted: the hook only switches on when nothing above us is calm */
  const [calm, setCalm] = useState(true);
  const ref = useMagnetic<HTMLDivElement>(strength, !calm);
  useEffect(() => setCalm(isCalm(ref.current)), [ref]);
  return <div ref={ref} className={cn("rap-magnetic", className)} style={{ display: "inline-block", ...style }} {...rest} />;
}
