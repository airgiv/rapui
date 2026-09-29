import { forwardRef, useEffect, useState, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { clamp, cx } from "../utils";
import "./NumberField.css";

export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step" | "type" | "prefix"> {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Multiplier for Shift+Arrow and PageUp/PageDown (default 10). */
  largeStep?: number;
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  /** Unit shown after the number, e.g. "px" or "%". */
  unit?: ReactNode;
  /** Label for the − / + buttons (screen readers). */
  decrementLabel?: string;
  incrementLabel?: string;
}

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

/**
 * Number stepper: a pill with round −/+ buttons sitting 2px inside the ends.
 * Arrow keys step, Shift+Arrow and PageUp/Down step ×10, Home/End jump to min/max.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  {
    value,
    defaultValue = null,
    onValueChange,
    min = -Infinity,
    max = Infinity,
    step = 1,
    largeStep = 10,
    size = "md",
    invalid,
    unit,
    disabled,
    readOnly,
    className,
    decrementLabel = "Decrease",
    incrementLabel = "Increase",
    onKeyDown,
    onBlur,
    ...rest
  },
  ref,
) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState<number | null>(defaultValue);
  const current = controlled ? value : inner;
  const [text, setText] = useState(current == null ? "" : String(current));

  // keep the text in sync when the value changes from outside
  useEffect(() => {
    setText(current == null ? "" : String(current));
  }, [current]);

  const precision = Math.max(decimals(step), Number.isFinite(min) ? decimals(min) : 0);
  const normalise = (n: number) => Number(clamp(n, min, max).toFixed(precision));

  const commit = (n: number | null) => {
    const next = n == null || Number.isNaN(n) ? null : normalise(n);
    if (!controlled) setInner(next);
    setText(next == null ? "" : String(next));
    if (next !== current) onValueChange?.(next);
  };

  const stepBy = (dir: 1 | -1, mult = 1) => {
    const base = current ?? (Number.isFinite(min) ? min : 0);
    commit(current == null ? base : base + dir * step * mult);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || readOnly) return;
    const big = e.shiftKey ? largeStep : 1;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        stepBy(1, big);
        break;
      case "ArrowDown":
        e.preventDefault();
        stepBy(-1, big);
        break;
      case "PageUp":
        e.preventDefault();
        stepBy(1, largeStep);
        break;
      case "PageDown":
        e.preventDefault();
        stepBy(-1, largeStep);
        break;
      case "Home":
        if (Number.isFinite(min)) {
          e.preventDefault();
          commit(min);
        }
        break;
      case "End":
        if (Number.isFinite(max)) {
          e.preventDefault();
          commit(max);
        }
        break;
      case "Enter":
        commit(text.trim() === "" ? null : Number(text.replace(",", ".")));
        break;
    }
  };

  const atMin = current != null && current <= min;
  const atMax = current != null && current >= max;

  return (
    <div
      className={cx("rap-numberfield", `rap-numberfield--${size}`, invalid && "is-invalid", disabled && "is-disabled", className)}
    >
      <button
        type="button"
        tabIndex={-1}
        className="rap-numberfield__btn"
        aria-label={decrementLabel}
        disabled={disabled || readOnly || atMin}
        onClick={() => stepBy(-1)}
      >
        <Minus aria-hidden />
      </button>
      <span className="rap-numberfield__value">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          role="spinbutton"
          autoComplete="off"
          className="rap-numberfield__input"
          aria-valuenow={current ?? undefined}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          aria-invalid={invalid || rest["aria-invalid"] || undefined}
          disabled={disabled}
          readOnly={readOnly}
          value={text}
          size={Math.max(2, text.length || 2)}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          onBlur={(e) => {
            commit(text.trim() === "" ? null : Number(text.replace(",", ".")));
            onBlur?.(e);
          }}
          {...rest}
        />
        {unit != null && <span className="rap-numberfield__unit">{unit}</span>}
      </span>
      <button
        type="button"
        tabIndex={-1}
        className="rap-numberfield__btn"
        aria-label={incrementLabel}
        disabled={disabled || readOnly || atMax}
        onClick={() => stepBy(1)}
      >
        <Plus aria-hidden />
      </button>
    </div>
  );
});
