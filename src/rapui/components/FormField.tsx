import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../utils";
import { Label } from "./Label";
import "./FormField.css";

interface FormFieldContextValue {
  id: string;
  hintId?: string;
  errorId?: string;
  invalid: boolean;
}
const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/** Inside a `FormField`: the control id and the ids to use for aria-describedby. For custom controls. */
export function useFormField() {
  return useContext(FormFieldContext);
}

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label?: ReactNode;
  /** Quiet helper text under the control. */
  hint?: ReactNode;
  /** Error message. Replaces nothing — it shows under the hint, turns the control red and sets aria-invalid. */
  error?: ReactNode;
  /** Adds a quiet “Optional” / required marker next to the label. */
  required?: boolean;
  optional?: boolean;
  /** Id for the control. Defaults to the child's `id`, or a generated one. */
  htmlFor?: string;
  /** Extra content on the label row, right-aligned (e.g. a counter or a link). */
  aside?: ReactNode;
  /** One control. It receives `id`, `aria-describedby`, `aria-invalid` and `aria-required`. */
  children: ReactElement;
}

/**
 * Label + control + hint + error, stacked 6px apart. Wires the control's id,
 * aria-describedby and aria-invalid for you.
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  { label, hint, error, required, optional, htmlFor, aside, className, children, ...rest },
  ref,
) {
  const auto = useId();
  const child = Children.only(children);
  const childProps = (isValidElement(child) ? child.props : {}) as Record<string, unknown>;
  const id = htmlFor ?? (childProps.id as string | undefined) ?? `ff${auto}`;
  const hintId = hint != null ? `${id}-hint` : undefined;
  const errorId = error != null && error !== false ? `${id}-error` : undefined;
  const invalid = errorId != null;
  const describedBy = [childProps["aria-describedby"] as string | undefined, hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = cloneElement(child, {
    id,
    "aria-describedby": describedBy,
    ...(invalid ? { "aria-invalid": true } : {}),
    ...(required ? { "aria-required": true } : {}),
  } as Record<string, unknown>);

  return (
    <FormFieldContext.Provider value={{ id, hintId, errorId, invalid }}>
      <div ref={ref} className={cx("rap-form-field", invalid && "is-invalid", className)} {...rest}>
        {(label != null || aside != null) && (
          <div className="rap-form-field__head">
            {label != null && (
              <Label htmlFor={id} className="rap-form-field__label">
                {label}
                {required && <span className="rap-form-field__req" aria-hidden> *</span>}
                {optional && <span className="rap-form-field__opt">Optional</span>}
              </Label>
            )}
            {aside != null && <span className="rap-form-field__aside">{aside}</span>}
          </div>
        )}
        {control}
        {hint != null && (
          <p id={hintId} className="rap-form-field__hint">
            {hint}
          </p>
        )}
        {errorId && (
          <p id={errorId} className="rap-form-field__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  );
});

export interface FieldGroupProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  /** Section title (rendered as the fieldset's legend). */
  legend?: ReactNode;
  description?: ReactNode;
  /** Lay fields out in 2 columns on wide containers. */
  columns?: 1 | 2;
}

/** A fieldset that stacks FormFields with even spacing, with an optional legend. */
export const FieldGroup = forwardRef<HTMLFieldSetElement, FieldGroupProps>(function FieldGroup(
  { legend, description, columns = 1, className, children, ...rest },
  ref,
) {
  return (
    <fieldset ref={ref} className={cx("rap-field-group", className)} {...rest}>
      {legend != null && <legend className="rap-field-group__legend">{legend}</legend>}
      {description != null && <p className="rap-field-group__desc">{description}</p>}
      <div className={cx("rap-field-group__body", columns === 2 && "rap-field-group__body--2")}>{children}</div>
    </fieldset>
  );
});
