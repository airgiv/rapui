/* ══ Input ════════════════════════════════════════════════
   The everyday filled pill.

   DELIGHT — TWO SMALL GESTURES, ONE IDEA: THE PILL IS A THING
   YOU HOLD A PEN TO.

   Focus DRAWS the ring. The 2px ring is not switched on; it is
   drawn around the pill, clockwise from the left end where the
   caret sits, in 460ms — the time it takes to notice where you
   clicked, not long enough to wait for. It is a conic gradient
   masked down to a 2px band (so it follows the pill's round
   ends exactly), swept by one registered custom property. When
   it has finished it is exactly the old inset ring, so the
   resting focus state is unchanged; on blur it lifts off at
   once rather than un-drawing, because leaving a field is not
   an event worth watching.

   Invalid SHAKES "no" (motion.css `rap-shake`) each time
   `invalid` turns on — the rising edge only, so a field that
   stays wrong while you retype does not keep nagging. The red
   ring itself is immediate; the shake rides on top.

   Both switch off under reduced motion and data-rap-motion="calm"
   (the ring then simply appears). With a <SoundProvider enabled>
   the "no" is also heard ("error"). */
import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useSound } from "../sound";
import { cx } from "../utils";
import "./Input.css";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  size?: "sm" | "md" | "lg";
  /** Marks the field as invalid (red ring + aria-invalid). The field shakes each time it turns on. */
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
  // count rising edges of `invalid`; the parity picks one of two identical keyframes so a
  // second "no" that lands mid-shake restarts it instead of being swallowed
  const [shakes, setShakes] = useState(0);
  const [shaking, setShaking] = useState(false);
  const was = useRef(!!invalid);
  const sound = useSound();
  useEffect(() => {
    if (invalid && !was.current) {
      setShakes((n) => n + 1);
      setShaking(true);
      sound.play("error");
    }
    was.current = !!invalid;
  }, [invalid, sound]);

  return (
    <span
      className={cx(
        "rap-input",
        `rap-input--${size}`,
        invalid && "is-invalid",
        disabled && "is-disabled",
        shaking && (shakes % 2 ? "is-shaking-a" : "is-shaking-b"),
        className,
      )}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setShaking(false);
      }}
    >
      {prefix != null && <span className="rap-input__affix">{prefix}</span>}
      <input ref={ref} className="rap-input__el" disabled={disabled} aria-invalid={invalid || undefined} {...rest} />
      {suffix != null && <span className="rap-input__affix">{suffix}</span>}
    </span>
  );
});
