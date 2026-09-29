import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "../utils";
import "./Input.css";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  size?: "sm" | "md" | "lg";
  /** Marks the field as invalid (red ring + aria-invalid). */
  invalid?: boolean;
  /** Icon or text inside the field, before the value. */
  prefix?: ReactNode;
  /** Icon or text inside the field, after the value. */
  suffix?: ReactNode;
}

/** Filled pill text field — the everyday input. For a giant editorial field see `Field`. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "md", invalid, prefix, suffix, className, disabled, ...rest },
  ref,
) {
  return (
    <span
      className={cx("rap-input", `rap-input--${size}`, invalid && "is-invalid", disabled && "is-disabled", className)}
    >
      {prefix != null && <span className="rap-input__affix">{prefix}</span>}
      <input ref={ref} className="rap-input__el" disabled={disabled} aria-invalid={invalid || undefined} {...rest} />
      {suffix != null && <span className="rap-input__affix">{suffix}</span>}
    </span>
  );
});
