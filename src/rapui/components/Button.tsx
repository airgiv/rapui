import { forwardRef, useImperativeHandle, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { useMagnetic } from "../hooks/useMagnetic";
import { cx } from "../utils";
import { RollText } from "./RollText";
import "./Button.css";

export type ButtonVariant = "solid" | "accent" | "blue" | "soft" | "outline" | "ghost" | "acid";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading/trailing icon. Pass `true` for the default arrow. */
  icon?: ReactNode | true;
  iconPosition?: "start" | "end";
  /** Follow the pointer a little. */
  magnetic?: boolean;
  /** Letters roll on hover (only when children is a string). */
  roll?: boolean;
}

/* One continuous stroke — head and shaft meet at a single round join, so
   there is no overlap seam where two square-capped lines used to cross. */
export const Arrow = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" aria-hidden>
    <path
      d="M7.5 6.5h10v10M17.5 6.5 6.5 17.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Pill button. On hover a colour blob swells from the bottom, letters roll,
 * the icon bubble spins. Optional magnetic pull.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "solid", size = "md", icon, iconPosition = "end", magnetic = false, roll = true, className, children, ...rest },
  forwarded,
) {
  const ref = useMagnetic<HTMLButtonElement>(0.25, magnetic);
  useImperativeHandle(forwarded, () => ref.current as HTMLButtonElement);

  const iconNode = icon === true ? <Arrow /> : icon;
  const label =
    typeof children === "string" && roll ? <RollText>{children}</RollText> : <span className="rap-btn__label">{children}</span>;

  return (
    <button
      ref={ref}
      className={cx(
        "rap-btn",
        "rap-roll-host",
        `rap-btn--${variant}`,
        `rap-btn--${size}`,
        iconNode != null && "rap-btn--has-icon",
        iconPosition === "start" && "rap-btn--icon-start",
        className,
      )}
      {...rest}
    >
      <span className="rap-btn__blob" aria-hidden />
      {label}
      {iconNode != null && <span className="rap-btn__icon">{iconNode}</span>}
    </button>
  );
});

export interface CircleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: number | string;
  variant?: "accent" | "blue" | "ink" | "acid" | "outline";
}

/** Big round call-to-action — text around, arrow in the middle. */
export function CircleButton({ size = 160, variant = "accent", className, children, style, ...rest }: CircleButtonProps) {
  const ref = useMagnetic<HTMLButtonElement>(0.4);
  return (
    <button
      ref={ref}
      className={cx("rap-cbtn", `rap-cbtn--${variant}`, className)}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      <span className="rap-cbtn__fill" aria-hidden />
      <span className="rap-cbtn__label">{children ?? <Arrow />}</span>
    </button>
  );
}

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Stack vertically instead of in a row. */
  vertical?: boolean;
  /** Stretch the buttons to share the full width equally. */
  fill?: boolean;
}

/**
 * Buttons packed edge to edge with a 2px seam, the way Readymag lays out
 * its actions: a group reads as one object rather than a row of loose pills.
 */
export function ButtonGroup({ vertical = false, fill = false, className, ...rest }: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={cx("rap-btn-group", vertical && "rap-btn-group--vertical", fill && "rap-btn-group--fill", className)}
      {...rest}
    />
  );
}
