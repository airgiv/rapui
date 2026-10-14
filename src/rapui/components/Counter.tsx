import { useEffect, useState, type HTMLAttributes } from "react";
import { useInView } from "../hooks/useInView";
import { isCalm } from "../hooks/useGlide";
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

/**
 * Number that counts up with an expo ease once it scrolls into view.
 * Calm: no ticking digits — the final figure fades in and settles up 4px.
 */
export function Counter({ to, from = 0, duration = 1800, decimals = 0, prefix = "", suffix = "", className, style, ...rest }: CounterProps) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.5 });
  const [val, setVal] = useState(from);

  useEffect(() => {
    if (!inView) return;
    /* calm: the value is simply there; the fade-in below is the arrival */
    if (prefersReducedMotion() || isCalm(ref.current)) {
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
    <span
      ref={ref}
      data-state={inView ? "in" : "out"}
      className={cn(
        "rap-counter",
        /* calm: held back (invisible, 4px low) until it is in view, then eases up */
        "calm:inline-block calm:transition-[opacity,translate] calm:duration-(--rap-dur-slow) calm:ease-soft",
        "calm:data-[state=out]:opacity-0 calm:data-[state=out]:translate-y-1",
        className,
      )}
      style={{ fontVariantNumeric: "tabular-nums", ...style }}
      {...rest}
    >
      {prefix}
      {val.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
