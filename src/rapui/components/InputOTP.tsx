import { forwardRef, useContext, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { cx } from "../utils";
import "./InputOTP.css";

export { REGEXP_ONLY_DIGITS, REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type InputOTPProps = DistributiveOmit<ComponentPropsWithoutRef<typeof OTPInput>, "size"> & {
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
};

/**
 * One-time code input (input-otp). A single hidden input drives a row of filled
 * cells, so paste, autofill and SMS codes just work.
 * `<InputOTP maxLength={6}><InputOTPGroup><InputOTPSlot index={0} />…`
 */
export const InputOTP = forwardRef<ElementRef<typeof OTPInput>, InputOTPProps>(function InputOTP(
  { className, containerClassName, size = "md", invalid, ...rest },
  ref,
) {
  return (
    <OTPInput
      ref={ref}
      containerClassName={cx("rap-otp", `rap-otp--${size}`, invalid && "is-invalid", containerClassName)}
      className={cx("rap-otp__input", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export const InputOTPGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function InputOTPGroup(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("rap-otp__group", className)} {...rest} />;
});

export const InputOTPSlot = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { index: number }>(
  function InputOTPSlot({ index, className, ...rest }, ref) {
    const ctx = useContext(OTPInputContext);
    const slot = ctx.slots[index];
    return (
      <div
        ref={ref}
        className={cx("rap-otp__slot", slot?.isActive && "is-active", slot?.char != null && "is-filled", className)}
        data-active={slot?.isActive || undefined}
        {...rest}
      >
        {slot?.char != null ? (
          <span className="rap-otp__char">{slot.char}</span>
        ) : slot?.placeholderChar ? (
          <span className="rap-otp__placeholder">{slot.placeholderChar}</span>
        ) : null}
        {slot?.hasFakeCaret && <span className="rap-otp__caret" aria-hidden />}
      </div>
    );
  },
);

export const InputOTPSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function InputOTPSeparator(
  { className, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="separator" className={cx("rap-otp__sep", className)} {...rest}>
      <span />
    </div>
  );
});
