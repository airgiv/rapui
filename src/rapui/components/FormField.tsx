/* ══ FormField ════════════════════════════════════════════
   Label, control, hint and error in one stack.

   DELIGHT — THE FIELD SAYS "NO". When an error turns on, the
   control shakes its head once (motion.css `rap-shake`: seven
   pixels, dying out over 420ms — long enough to read as a
   gesture, short enough that you are already looking at the
   message by the time it stops) and the message slides down
   out of the gap under it instead of popping in, so the eye is
   carried from the control to the reason. It happens on the
   RISING edge only — a field that stays wrong does not keep
   shaking while you type into it — and again whenever a string
   error changes to a different one (a second, different "no").

   The control gets a wrapper so the shake moves the control and
   not the label: the label is the question, the control is the
   answer being refused. The wrapper is a column flexbox, so
   controls that stretch in the field still stretch.

   Also home to `useMotionCalm` / `isMotionCalm`, the one check
   every form control makes before running a JS-driven flourish
   (reduced motion, or an ancestor with data-rap-motion="calm").
   It belongs in hooks/ — kept here so the forms group owns it
   until it moves. */
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx, prefersReducedMotion } from "../utils";
import { Label } from "./Label";
import "./FormField.css";

/** True when playful motion should be skipped for this element: reduced motion, or a calm ancestor. */
export function isMotionCalm(el: Element | null | undefined): boolean {
  return prefersReducedMotion() || !!el?.closest('[data-rap-motion="calm"]');
}

/**
 * `isMotionCalm` as render state, re-read after every render (a `closest()` is cheap).
 * Feed it to `useSpring(…, instant)`: the spring snaps instead of settling.
 */
export function useMotionCalm(ref: RefObject<Element | null>): boolean {
  const [calm, setCalm] = useState(false);
  useLayoutEffect(() => {
    const next = isMotionCalm(ref.current);
    if (next !== calm) setCalm(next);
  });
  return calm;
}

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

  // the "no": replay the shake on the rising edge of the error (and when a string error changes)
  const [shake, setShake] = useState(0);
  const last = useRef<{ invalid: boolean; text: unknown }>({ invalid, text: error });
  useEffect(() => {
    const prev = last.current;
    last.current = { invalid, text: error };
    const changed = typeof error === "string" && typeof prev.text === "string" && error !== prev.text;
    if (invalid && (!prev.invalid || changed)) setShake((n) => n + 1);
  }, [invalid, error]);

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
        <div
          className={cx("rap-form-field__control", shake > 0 && (shake % 2 ? "is-shaking-a" : "is-shaking-b"))}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) setShake(0);
          }}
        >
          {control}
        </div>
        {hint != null && (
          <p id={hintId} className="rap-form-field__hint">
            {hint}
          </p>
        )}
        {errorId && (
          <div className="rap-form-field__error-slot">
            <p id={errorId} className="rap-form-field__error" role="alert">
              {error}
            </p>
          </div>
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
