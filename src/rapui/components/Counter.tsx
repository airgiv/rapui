import { useEffect, useState, type HTMLAttributes } from "react";
import { useInView } from "../hooks/useInView";
import { cn, prefersReducedMotion } from "../utils";

export interface CounterProps extends HTMLAttributes<HTMLSpanElement> {
  to: number;
  from?: number;
  /** ms */
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

/** Number that counts up with an expo ease once it scrolls into view. */
export function Counter({ to, from = 0, duration = 1800, decimals = 0, prefix = "", suffix = "", className, style, ...rest }: CounterProps) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.5 });
  const [val, setVal] = useState(from);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setVal(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setVal(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, from, duration]);

  return (
    <span ref={ref} className={cn("rap-counter", className)} style={{ fontVariantNumeric: "tabular-nums", ...style }} {...rest}>
      {prefix}
      {val.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
