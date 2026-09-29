import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "../utils";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string;
  size?: "md" | "lg" | "xl";
}

/* Floated = focused, or holding a value (the placeholder is a single space, so
   :placeholder-shown means "empty"). The label sits exactly on the input's text
   line: the field's rem padding plus the input's own top padding (0.15 of its
   font size). Both in absolute units — an em here would be the label's own, huge. */
const floated =
  "peer-focus:top-0 peer-focus:font-sans peer-focus:text-[0.875rem] peer-focus:font-medium peer-focus:tracking-[-0.01em] peer-focus:text-ink " +
  "peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:font-sans peer-not-placeholder-shown:text-[0.875rem] peer-not-placeholder-shown:font-medium peer-not-placeholder-shown:tracking-[-0.01em] peer-not-placeholder-shown:text-ink";

/** Giant underline input. Label floats up, the line draws itself on focus. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, size = "lg", className, id, placeholder, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  return (
    <div
      data-slot="field"
      data-size={size}
      data-invalid={error ? true : undefined}
      className={cn(
        // rap-field: a stable marker the site CSS still sizes the field through.
        // pt: room above the input for the floated label
        "rap-field relative flex flex-col pt-[1.6rem] text-[1rem]",
        size === "md" && "[--f-fs:1.25rem]",
        size === "lg" && "[--f-fs:clamp(1.5rem,3vw,2.5rem)]",
        size === "xl" && "[--f-fs:clamp(2rem,5vw,4.5rem)]",
        className,
      )}
    >
      <input
        ref={ref}
        id={inputId}
        data-slot="field-input"
        className={cn(
          "peer w-full border-0 border-b-[1.5px] border-solid border-line bg-transparent px-0 pt-[0.15em] pb-[0.25em]",
          "text-ink font-display font-normal text-(length:--f-fs) tracking-[-0.04em] leading-[1.2] caret-accent",
          // the drawn accent line is this field's focus indicator; no extra box
          "outline-none focus-visible:outline-none placeholder:text-transparent",
        )}
        placeholder={placeholder ?? " "}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? msgId : undefined}
        {...rest}
      />
      <label
        htmlFor={inputId}
        data-slot="field-label"
        className={cn(
          "absolute left-0 top-[calc(1.6rem+var(--f-fs)*0.15)] font-display text-(length:--f-fs) leading-[1.2] tracking-[-0.04em] text-mute",
          "pointer-events-none origin-top-left",
          "[transition:transform_var(--rap-dur)_var(--rap-ease-out),color_var(--rap-dur)_var(--rap-ease-out),font-size_var(--rap-dur)_var(--rap-ease-out),top_var(--rap-dur)_var(--rap-ease-out)]",
          floated,
        )}
      >
        {label}
      </label>
      {/* the line draws itself from the left on focus; an error keeps it drawn, in flame */}
      <span
        data-slot="field-line"
        className={cn(
          "relative h-[3px] -mt-0.5 bg-accent scale-x-0 origin-left [transition:scale_var(--rap-dur-slow)_var(--rap-ease-out)] peer-focus:scale-x-100",
          error && "scale-x-100 bg-flame",
        )}
        aria-hidden
      />
      {(hint || error) && (
        <span id={msgId} data-slot="field-message" className={cn("mt-[0.6rem] text-[0.875rem] text-mute", error && "text-flame")}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
});
