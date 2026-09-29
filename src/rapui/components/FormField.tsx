/* ══ FormField ════════════════════════════════════════════
   Label, control, hint and error in one stack.

   DELIGHT — THE FIELD SAYS "NO". When an error turns on, the
   control shakes its head once (`animate-shake`: seven
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
import { cn, prefersReducedMotion } from "../utils";
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
      <div
        ref={ref}
        data-slot="form-field"
        data-invalid={invalid || undefined}
        className={cn(
          "[--ff-gap:6px] flex flex-col gap-(--ff-gap) min-w-0 font-sans",
          // the field's error state paints known rap/ui controls red
          invalid && [
            "[&_:is([data-slot=input],[data-slot=select-trigger],[data-slot=combobox-trigger],[data-slot=date-picker-trigger],[data-slot=textarea],[data-slot=number-field],[data-slot=input-otp-slot])]:shadow-[inset_0_0_0_2px_var(--rap-danger)]",
            "[&_:is([data-slot=checkbox],[data-slot=radio-group-item],[data-slot=radio-group-card]):not([data-state=checked])]:shadow-[inset_0_0_0_1.5px_var(--rap-danger)]",
          ],
          className,
        )}
        {...rest}
      >
        {(label != null || aside != null) && (
          <div data-slot="form-field-head" className="flex items-baseline justify-between gap-3 px-0.5">
            {label != null && (
              <Label htmlFor={id} data-slot="form-field-label" className="inline-flex items-baseline gap-[0.4rem]">
                {label}
                {required && (
                  <span data-slot="form-field-required" className="text-danger -ml-[0.3rem]" aria-hidden>
                    {" "}
                    *
                  </span>
                )}
                {optional && (
                  <span data-slot="form-field-optional" className="text-[0.8125rem] font-normal text-mute">
                    Optional
                  </span>
                )}
              </Label>
            )}
            {aside != null && (
              <span data-slot="form-field-aside" className="text-[0.8125rem] tracking-[-0.01em] text-mute tabular-nums">
                {aside}
              </span>
            )}
          </div>
        )}
        {/* the control, in its own box so the shake moves the answer and not the question;
            two names for one shake so a second "no" mid-shake restarts it */}
        <div
          data-slot="form-field-control"
          className={cn(
            "flex flex-col min-w-0",
            shake > 0 && (shake % 2 ? "fun:animate-shake" : "fun:animate-[rap-ff-shake_420ms_var(--rap-ease-rm)]"),
          )}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) setShake(0);
          }}
        >
          {control}
        </div>
        {hint != null && (
          <p id={hintId} data-slot="form-field-hint" className={cn(messageClass, "text-mute")}>
            {hint}
          </p>
        )}
        {errorId && (
          /* the message slides down out of the gap: its row opens from 0 while the text
             drops in from above, so nothing below jumps. Under a hint the pair sits
             tight (2px), so the row opens from that tighter gap. */
          <div
            data-slot="form-field-error-slot"
            className={cn(
              "grid grid-rows-[1fr]",
              hint != null
                ? "mt-[calc(var(--rap-gap-tight)-var(--ff-gap))] fun:animate-[rap-ff-open-tight_320ms_var(--rap-ease-out)]"
                : "fun:animate-[rap-ff-open_320ms_var(--rap-ease-out)]",
            )}
          >
            <p
              id={errorId}
              data-slot="form-field-error"
              className={cn(messageClass, "text-danger font-medium min-h-0 overflow-hidden fun:animate-[rap-ff-drop_380ms_var(--rap-ease-spring)]")}
              role="alert"
            >
              {error}
            </p>
          </div>
        )}
      </div>
    </FormFieldContext.Provider>
  );
});

const messageClass = "m-0 px-0.5 text-[0.8125rem] leading-[1.4] tracking-[-0.01em]";

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
    <fieldset
      ref={ref}
      data-slot="field-group"
      className={cn("min-w-0 m-0 p-0 border-0 font-sans disabled:opacity-60", className)}
      {...rest}
    >
      {legend != null && (
        <legend data-slot="field-group-legend" className="px-0.5 mb-1 text-[1.0625rem] font-medium tracking-[-0.02em] text-ink">
          {legend}
        </legend>
      )}
      {description != null && (
        <p data-slot="field-group-description" className="mt-0 mx-0 mb-4 px-0.5 text-sm leading-[1.45] text-mute">
          {description}
        </p>
      )}
      <div
        data-slot="field-group-body"
        className={cn(
          "grid gap-5",
          // right under the legend (no description between) the body keeps 12px off it
          legend != null && description == null && "mt-3",
          columns === 2 && "grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-x-3",
        )}
      >
        {children}
      </div>
    </fieldset>
  );
});
