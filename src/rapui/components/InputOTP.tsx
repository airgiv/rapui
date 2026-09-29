/* ══ InputOTP ═════════════════════════════════════════════
   One-time code input (input-otp): a single hidden input drives a
   row of filled cells, so paste, autofill and SMS codes just work.

   DELIGHT — TILES THAT ANSWER BACK.
   · Each slot HOPS as a character lands in it (`animate-hop`:
     5px) — typing a code feels like dropping tiles
     into a tray, and the hop tells you which slot took the key.
   · When the last slot is filled the whole row does a WAVE: each
     tile lifts a little higher than a hop, 45ms after the one on
     its left, so the code reads left to right once more before
     it is checked. 45ms × 6 slots is about a quarter-second —
     done before any server could answer.
   · When `invalid` turns on (the code was wrong) the row SHAKES
     "no" once (`rap-shake`), on the rising edge only.

   All of it is `fun:` animation classes, so the characters and the
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
import { cn } from "../utils";
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
      data-slot="input-otp-input"
      containerClassName={cn(
        "flex items-center gap-2.5 font-sans has-[input:disabled]:opacity-50 has-[input:disabled]:cursor-not-allowed",
        // --otp-cell sizes the slots (and their digits); corners grow with them
        size === "sm" && "[--otp-cell:var(--rap-control-h)] [--otp-radius:14px]",
        size === "md" && "[--otp-cell:var(--rap-control-h-lg)] [--otp-radius:16px]",
        size === "lg" && "[--otp-cell:60px] [--otp-radius:18px]",
        // wrong code: every slot is ringed red (over the active ring too)
        invalid && "[&_[data-slot=input-otp-slot]]:shadow-[inset_0_0_0_2px_var(--rap-danger)]!",
        // …and the row shakes "no" (two names so a second "no" restarts it)
        shakes > 0 && (shakes % 2 ? "fun:animate-shake" : "fun:animate-[rap-otp-shake_420ms_var(--rap-ease-rm)]"),
        containerClassName,
      )}
      className={cn("focus-visible:outline-none", className)}
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
  return <div ref={ref} data-slot="input-otp-group" className={cn("flex items-center gap-tile", className)} {...rest} />;
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
        data-slot="input-otp-slot"
        data-filled={char != null || undefined}
        className={cn(
          "relative grid place-items-center size-(--otp-cell) rounded-(--otp-radius) bg-fill text-ink",
          "text-[length:calc(var(--otp-cell)*0.42)] font-medium tracking-[-0.02em] tabular-nums",
          "transition-[background-color,box-shadow] duration-(--rap-dur-fast) ease-rm",
          "data-[active]:z-1 data-[active]:bg-surface data-[active]:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
          // a character lands: the slot hops (two names so fast typing into one slot restarts it)
          hops > 0 && (hops % 2 ? "fun:animate-hop" : "fun:animate-[rap-otp-hop-b_360ms_var(--rap-ease-out)]"),
          // the code is complete: a wave from left to right (45ms a slot), a bit higher than a hop
          complete && "fun:animate-[rap-otp-wave_460ms_var(--rap-ease-out)_calc(var(--i,0)*45ms)_both]",
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
          <span data-slot="input-otp-char" className="fun:animate-[rap-otp-pop_260ms_var(--rap-ease-spring)]">
            {slot.char}
          </span>
        ) : slot?.placeholderChar ? (
          <span data-slot="input-otp-placeholder" className="text-mute">
            {slot.placeholderChar}
          </span>
        ) : null}
        {slot?.hasFakeCaret && (
          <span
            data-slot="input-otp-caret"
            className="absolute w-0.5 h-[42%] rounded-[2px] bg-ring animate-[rap-otp-blink_1.1s_step-end_infinite] motion-reduce:animate-none"
            aria-hidden
          />
        )}
      </div>
    );
  },
);

export const InputOTPSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function InputOTPSeparator(
  { className, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="separator" data-slot="input-otp-separator" className={cn("grid place-items-center w-3.5", className)} {...rest}>
      <span className="w-2.5 h-0.5 rounded-[2px] bg-fill-strong" />
    </div>
  );
});
