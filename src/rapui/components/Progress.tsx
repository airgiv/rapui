import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes, type ReactNode } from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./Progress.css";

export type ProgressTone = "blue" | "flame" | "ink" | "success";

export interface ProgressProps extends ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  size?: "sm" | "md" | "lg";
  tone?: ProgressTone;
}

/** Pill progress bar (Radix Progress). Pass `value={null}` for an indeterminate sweep. */
export const Progress = forwardRef<ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(function Progress(
  { value, max = 100, size = "md", tone = "blue", className, ...rest },
  ref,
) {
  const pct = value == null ? null : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      max={max}
      className={cx("rap-progress", `rap-progress--${size}`, `rap-progress--${tone}`, pct == null && "is-indeterminate", className)}
      {...rest}
    >
      <ProgressPrimitive.Indicator className="rap-progress__bar" style={pct == null ? undefined : { width: `${pct}%` }} />
    </ProgressPrimitive.Root>
  );
});

export interface CircularProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: number;
  max?: number;
  /** Diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  tone?: ProgressTone;
  /** What sits in the middle. Defaults to the percentage; pass `null` for nothing. */
  label?: ReactNode;
}

/** Ring progress with the value in the middle. */
export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(function CircularProgress(
  { value, max = 100, size = 88, thickness = 8, tone = "blue", label, className, style, ...rest },
  ref,
) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cx("rap-cprogress", `rap-progress--${tone}`, className)}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.22), ...style }}
      {...rest}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className="rap-cprogress__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={thickness} />
        <circle
          className="rap-cprogress__bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={thickness}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          opacity={pct === 0 ? 0 : 1}
        />
      </svg>
      {label !== null && <span className="rap-cprogress__label">{label ?? `${Math.round(pct)}%`}</span>}
    </div>
  );
});
