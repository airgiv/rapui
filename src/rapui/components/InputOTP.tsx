/* ══ InputOTP ═════════════════════════════════════════════
   One-time code input (input-otp): a single hidden input drives a
   row of filled cells, so paste, autofill and SMS codes just work.

   DELIGHT — TILES THAT ANSWER BACK.
   · Each slot HOPS as a character lands in it (motion.css
     `rap-hop`, 5px) — typing a code feels like dropping tiles
     into a tray, and the hop tells you which slot took the key.
   · When the last slot is filled the whole row does a WAVE: each
     tile lifts a little higher than a hop, 45ms after the one on
     its left, so the code reads left to right once more before
     it is checked. 45ms × 6 slots is about a quarter-second —
     done before any server could answer.
   · When `invalid` turns on (the code was wrong) the row SHAKES
     "no" once (`rap-shake`), on the rising edge only.

   All of it is CSS keyed off classes, so the characters and the
   caret are never delayed. Reduced motion / data-rap-motion=
   "calm": none of it. Sound: "type" per character, "success"
   when complete, "error" when invalid turns on. */
import {
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type HTMLAttributes,
} from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { useSound } from "../sound";
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
  { className, containerClassName, size = "md", invalid, onChange, onComplete, ...rest },
  ref,
) {
  const sound = useSound();
  // the "no": count rising edges; the parity restarts a running shake
  const [shakes, setShakes] = useState(0);
  const was = useRef(!!invalid);
  useEffect(() => {
    if (invalid && !was.current) {
      setShakes((n) => n + 1);
      sound.play("error");
    }
    was.current = !!invalid;
  }, [invalid, sound]);
  useEffect(() => {
    if (!shakes) return;
    const id = window.setTimeout(() => setShakes(0), 450);
    return () => window.clearTimeout(id);
  }, [shakes]);

  const typed = useRef(0);
  return (
    <OTPInput
      ref={ref}
      containerClassName={cx(
        "rap-otp",
        `rap-otp--${size}`,
        invalid && "is-invalid",
        shakes > 0 && (shakes % 2 ? "is-shaking-a" : "is-shaking-b"),
        containerClassName,
      )}
      className={cx("rap-otp__input", className)}
      aria-invalid={invalid || undefined}
      onChange={(v: string) => {
        if (v.length > typed.current) sound.play("type");
        typed.current = v.length;
        onChange?.(v);
      }}
      onComplete={(...args: unknown[]) => {
        sound.play("success");
        onComplete?.(...args);
      }}
      {...(rest as ComponentPropsWithoutRef<typeof OTPInput>)}
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
    const complete = ctx.slots.length > 0 && ctx.slots.every((s) => s.char != null);
    // hop only when a character LANDS here (empty → filled), and forget it once done, so
    // un-completing the code or deleting elsewhere never replays it
    const char = slot?.char ?? null;
    const [hops, setHops] = useState(0);
    const had = useRef(char);
    useEffect(() => {
      if (char != null && had.current == null) setHops((n) => n + 1);
      had.current = char;
    }, [char]);
    return (
      <div
        ref={ref}
        className={cx(
          "rap-otp__slot",
          slot?.isActive && "is-active",
          char != null && "is-filled",
          hops > 0 && (hops % 2 ? "is-hop-a" : "is-hop-b"),
          complete && "is-complete",
          className,
        )}
        data-active={slot?.isActive || undefined}
        {...rest}
        style={{ "--i": index, ...rest.style } as CSSProperties}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setHops(0);
          rest.onAnimationEnd?.(e);
        }}
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
