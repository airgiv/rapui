import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cx } from "../utils";
import "./Field.css";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string;
  size?: "md" | "lg" | "xl";
}

/** Giant underline input. Label floats up, the line draws itself on focus. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, size = "lg", className, id, placeholder, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  return (
    <div className={cx("rap-field", `rap-field--${size}`, error && "rap-field--error", className)}>
      <input
        ref={ref}
        id={inputId}
        className="rap-field__input"
        placeholder={placeholder ?? " "}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? msgId : undefined}
        {...rest}
      />
      <label htmlFor={inputId} className="rap-field__label">
        {label}
      </label>
      <span className="rap-field__line" aria-hidden />
      {(hint || error) && (
        <span id={msgId} className="rap-field__msg">
          {error ?? hint}
        </span>
      )}
    </div>
  );
});
