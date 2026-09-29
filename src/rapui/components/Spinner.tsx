import { forwardRef, type SVGAttributes } from "react";
import { cx } from "../utils";
import "./Spinner.css";

export interface SpinnerProps extends SVGAttributes<SVGSVGElement> {
  size?: "sm" | "md" | "lg" | number;
  /** Accessible label; defaults to "Loading". */
  label?: string;
}

const PX = { sm: 16, md: 20, lg: 28 } as const;

/** Rotating arc in the current text colour. */
export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(function Spinner(
  { size = "md", label = "Loading", className, ...rest },
  ref,
) {
  const px = typeof size === "number" ? size : PX[size];
  return (
    <svg
      ref={ref}
      role="status"
      aria-label={label}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className={cx("rap-spinner", className)}
      {...rest}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2.5" opacity="0.18" />
      <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
});
