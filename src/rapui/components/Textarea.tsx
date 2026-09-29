import { forwardRef, useCallback, useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import { cx } from "../utils";
import "./Textarea.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: "sm" | "md" | "lg";
  /** Marks the field as invalid (red ring + aria-invalid). */
  invalid?: boolean;
  /** Grow with the content instead of scrolling. `rows` becomes the minimum; cap it with CSS `max-height`. */
  autoGrow?: boolean;
}

/** Filled multi-line text field with 20px corners. Optional auto-grow. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = "md", invalid, autoGrow = false, className, rows = 3, onInput, ...rest },
  forwarded,
) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      inner.current = node;
      if (typeof forwarded === "function") forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [forwarded],
  );

  const fit = useCallback(() => {
    const el = inner.current;
    if (!el || !autoGrow) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [autoGrow]);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    if (autoGrow) fit();
    else el.style.height = "";
  }, [autoGrow, fit, rest.value]);

  return (
    <textarea
      ref={setRef}
      rows={rows}
      className={cx("rap-textarea", `rap-textarea--${size}`, autoGrow && "rap-textarea--grow", invalid && "is-invalid", className)}
      aria-invalid={invalid || rest["aria-invalid"] || undefined}
      onInput={(e) => {
        fit();
        onInput?.(e);
      }}
      {...rest}
    />
  );
});
