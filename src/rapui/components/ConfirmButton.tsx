import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties } from "react";
import { cva } from "class-variance-authority";
import { useSpring } from "../hooks/useSpring";
import { useSound } from "../sound";
import { cn } from "../utils";
import { isCalm } from "./ScrubNumber";

/* ══ Confirm button ═══════════════════════════════════════
   Two steps, one pill. The first click does not act: the pill
   changes its mind in front of you — its width springs to fit
   "Sure?", the words roll over like a split-flap sign, and a
   ring starts draining around its rim. Click again before the
   ring is empty to confirm; let it run out and the pill quietly
   rolls back to what it was.

   ── WHY THE WIDTH IS A SPRING ───────────────────────────
   The pill is one object that becomes another, not one pill
   swapped for a second. A width that springs (Bencho's spring at
   tune 30: stiffness 0.128, decay 0.68 — one overshoot of about
   a tenth of the change, 11px when "Delete workspace" becomes
   "Sure?"; tune 50 overshot by a fifth and read as a wobble)
   keeps it the same object: it visibly breathes in or out to fit
   what it now has to say. The labels are measured, so the width
   is exact, never guessed.

   ── THE HIT AREA DOES NOT MOVE ──────────────────────────
   Only the visible pill springs. The button itself keeps the
   width of its widest label, so the second click lands where the
   first one did — a pill that shrank out from under the pointer
   would turn "click twice" into "click, then chase" — and the
   layout around it never reflows while the pill breathes. The
   pill is centred in that box (hero: pinned left, like the label).

   ── EVERY WORD SITS IN THE PILL'S MIDDLE ────────────────
   Each label is centred in the pill, not hung off its left
   padding. The width is measured to fit, so at rest that is the
   same place — but a label pinned left went wrong wherever the
   pill is wider than its word: mid-spring, and always in hero,
   whose 14rem floor left a short "Sure?" pressed against the left
   end of a long pill. Centred, it stays in the visual middle while
   the pill breathes, whatever the size.

   ── THE ROLL ────────────────────────────────────────────
   States are ordered idle → sure → done. A newer state comes
   up from below and the old one leaves upward; going back (the
   ring ran out) runs the other way, so "undo" reads as undo.
   Letters are staggered 18ms apart — RollText's rhythm — on
   --rap-ease-spring so each one lands with a small hop.

   ── THE RING ────────────────────────────────────────────
   A pill-shaped stroke 3px inside the rim, drawn with
   pathLength 1 and emptied by a linear dash offset over
   timeoutMs (3s by default: long enough to read "Sure?" and
   move the pointer back, short enough that a stray first click
   does not sit armed). Linear because it is a clock. A tick
   every second is the clock you can hear.

   Calm / reduced motion: no width spring (the width jumps), no
   letter roll (the labels swap), but the ring still drains — it
   is the information, not the flourish. */

/* letter stagger, ms — as RollText */
const STAGGER = 18;
/* the width spring's tune (see above) */
const TUNE = 30;

/* the button: an invisible, fixed-size hit area that carries the
   variables, the type and the focus ring */
const confirmVariants = cva(
  [
    "group/confirm relative inline-block align-middle cursor-pointer select-none outline-none",
    "h-(--cb-h) min-w-(--cb-min)",
    "font-sans text-(length:--cb-fs) font-medium tracking-[-0.01em] whitespace-nowrap",
    "disabled:opacity-40 disabled:pointer-events-none [-webkit-tap-highlight-color:transparent]",
    "data-[state=done]:cursor-default",
  ],
  {
    variants: {
      /* rest colours, and the armed ones — Button's hover-blob pairs */
      variant: {
        accent: "[--cb-bg:var(--rap-accent)] [--cb-fg:var(--rap-accent-ink)] [--cb-arm:var(--rap-ink)] [--cb-arm-fg:var(--rap-paper)]",
        blue: "[--cb-bg:var(--rap-blue)] [--cb-fg:#fff] [--cb-arm:var(--rap-ink)] [--cb-arm-fg:var(--rap-paper)]",
        ink: "[--cb-bg:var(--rap-ink)] [--cb-fg:var(--rap-paper)] [--cb-arm:var(--rap-accent)] [--cb-arm-fg:var(--rap-accent-ink)]",
        danger: "[--cb-bg:var(--rap-paper-3)] [--cb-fg:var(--rap-danger)] [--cb-arm:var(--rap-danger)] [--cb-arm-fg:#fff]",
      },
      /* md/lg are Button's; hero is 88px, flush left, and never
         narrower than 14rem so a short word still reads as a hero */
      size: {
        md: "[--cb-h:3.25rem] [--cb-px:1.6rem] [--cb-fs:1rem] [--cb-min:0px]",
        lg: "[--cb-h:4.25rem] [--cb-px:2.2rem] [--cb-fs:1.25rem] [--cb-min:0px]",
        hero: "[--cb-h:5.5rem] [--cb-px:2rem] [--cb-fs:1.25rem] [--cb-min:14rem]",
      },
    },
    defaultVariants: { variant: "accent", size: "md" },
  },
);

/* the visible pill inside it: armed takes the arm colours, done is success */
const PILL = cn(
  "absolute inset-y-0 isolate overflow-hidden rounded-pill min-w-(--cb-min) bg-(--cb-bg) text-(--cb-fg)",
  "transition-[background-color,color,scale] duration-(--rap-dur) ease-soft group-active/confirm:scale-96",
  "group-data-[state=sure]/confirm:bg-(--cb-arm) group-data-[state=sure]/confirm:text-(--cb-arm-fg)",
  "group-data-[state=done]/confirm:bg-success group-data-[state=done]/confirm:text-white",
  "group-focus-visible/confirm:outline-2 group-focus-visible/confirm:outline-offset-3 group-focus-visible/confirm:outline-ring",
);

export type ConfirmButtonVariant = "accent" | "blue" | "ink" | "danger";
export type ConfirmButtonSize = "md" | "lg" | "hero";

export interface ConfirmButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label?: string;
  /** Shown while armed. */
  confirmLabel?: string;
  /** Shown (with a drawn check) after confirming. */
  doneLabel?: string;
  /** How long the second click is waited for, ms. */
  timeoutMs?: number;
  /** Back to idle after this many ms; `false` stays done. */
  resetAfter?: number | false;
  variant?: ConfirmButtonVariant;
  size?: ConfirmButtonSize;
  onConfirm?: () => void;
}

type Step = "idle" | "sure" | "done";
const ORDER: Record<Step, number> = { idle: 0, sure: 1, done: 2 };

/* a word whose letters roll in and out with the state */
function Rolling({ text, at, current, check }: { text: string; at: Step; current: Step; check?: boolean }) {
  const d = ORDER[at] - ORDER[current];
  /* out of the way by 70% of the pill's height: far enough to leave the
     window, near enough that the spring's hop is still seen landing */
  const pos =
    d === 0
      ? "translate-y-0 opacity-100"
      : d < 0
        ? "-translate-y-[calc(var(--cb-h)*0.7)] opacity-0"
        : "translate-y-[calc(var(--cb-h)*0.7)] opacity-0";
  return (
    <span
      data-slot="confirm-button-label"
      data-at={at}
      aria-hidden={d !== 0 || undefined}
      className="absolute inset-0 flex items-center justify-center gap-[0.4em]"
    >
      {check && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={cn("size-[1.1em] -ml-[0.15em] transition-opacity duration-(--rap-dur-fast)", d !== 0 && "opacity-0")}
        >
          <path
            d="M5.6 12.6l4.1 4.1 8.7-9.1"
            pathLength={1}
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "[stroke-dasharray:1] transition-[stroke-dashoffset] ease-soft",
              d === 0 ? "[stroke-dashoffset:0] duration-(--rap-dur) delay-150" : "[stroke-dashoffset:1] duration-0",
            )}
          />
        </svg>
      )}
      <span className="inline-flex">
        {Array.from(text).map((ch, i) => (
          <span
            key={i}
            className={cn("inline-block transition-[translate,opacity] duration-(--rap-dur) ease-spring calm:transition-none", pos)}
            style={{ transitionDelay: `${i * STAGGER}ms` } as CSSProperties}
          >
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Two-step confirm: the first click arms it ("Sure?") with a draining ring; the second confirms. */
export const ConfirmButton = forwardRef<HTMLButtonElement, ConfirmButtonProps>(function ConfirmButton(
  {
    label = "Delete",
    confirmLabel = "Sure?",
    doneLabel = "Done",
    timeoutMs = 3000,
    resetAfter = 2400,
    variant = "accent",
    size = "md",
    onConfirm,
    onClick,
    onKeyDown,
    className,
    style,
    disabled,
    ...rest
  },
  forwarded,
) {
  const ref = useRef<HTMLButtonElement>(null);
  useImperativeHandle(forwarded, () => ref.current as HTMLButtonElement);
  const sound = useSound();
  const [step, setStep] = useState<Step>("idle");
  const measure = useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = useState<Record<Step, number> | null>(null);

  /* measure each label (the done one with its check) at the pill's own
     font; re-measure when the fonts finish loading or the size changes */
  useLayoutEffect(() => {
    const el = measure.current;
    if (!el) return;
    const read = () => {
      const kids = el.children;
      setWidths({
        idle: (kids[0] as HTMLElement).offsetWidth,
        sure: (kids[1] as HTMLElement).offsetWidth,
        done: (kids[2] as HTMLElement).offsetWidth,
      });
    };
    read();
    const ro = new ResizeObserver(read);
    Array.from(el.children).forEach((k) => ro.observe(k));
    return () => ro.disconnect();
  }, [label, confirmLabel, doneLabel, size]);

  const [live, setLive] = useState(false);
  const calm = isCalm(ref.current);
  const target = widths ? widths[step] : 0;
  const at = useSpring(target, TUNE, !live || calm);
  useEffect(() => {
    if (widths) setLive(true);
  }, [widths]);

  /* the clock: a tick each second, and the pill rolls back when it runs out */
  useEffect(() => {
    if (step !== "sure") return;
    const started = performance.now();
    const tick = window.setInterval(() => {
      if (performance.now() - started < timeoutMs - 200) sound.play("tick", { strength: 0.5, pitch: 0.85 });
    }, 1000);
    const out = window.setTimeout(() => {
      sound.play("drop", { strength: 0.5 });
      setStep("idle");
    }, timeoutMs);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(out);
    };
  }, [step, timeoutMs, sound]);

  useEffect(() => {
    if (step !== "done" || resetAfter === false) return;
    const id = window.setTimeout(() => setStep("idle"), resetAfter);
    return () => window.clearTimeout(id);
  }, [step, resetAfter]);

  const current = step === "idle" ? label : step === "sure" ? confirmLabel : doneLabel;

  return (
    <button
      ref={ref}
      type="button"
      data-slot="confirm-button"
      data-state={step}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      aria-disabled={step === "done" || undefined}
      aria-label={current}
      className={cn(confirmVariants({ variant, size }), className)}
      style={
        {
          ...style,
          width: widths ? `calc(${Math.max(widths.idle, widths.sure, widths.done).toFixed(2)}px + var(--cb-px) * 2)` : undefined,
          "--cb-t": `${timeoutMs}ms`,
        } as CSSProperties
      }
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (step === "idle") {
          setStep("sure");
          sound.play("tap");
        } else if (step === "sure") {
          setStep("done");
          sound.play("success");
          onConfirm?.();
        }
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === "Escape" && step === "sure") {
          e.preventDefault();
          setStep("idle");
        }
      }}
    >
      {/* keeps the pill its height and gives the unmeasured first frame a width */}
      <span className={cn("invisible px-(--cb-px) leading-(--cb-h)", widths && "hidden")}>{label}</span>
      {/* the ruler: every label laid out once, off-stage */}
      <span ref={measure} aria-hidden className="absolute invisible left-0 top-0 flex whitespace-nowrap pointer-events-none">
        <span>{label}</span>
        <span>{confirmLabel}</span>
        <span className="inline-flex items-center gap-[0.4em]">
          <span className="inline-block w-[0.95em]" />
          {doneLabel}
        </span>
      </span>
      <span
        data-slot="confirm-button-pill"
        className={cn(PILL, size === "hero" ? "left-0" : "left-1/2 -translate-x-1/2")}
        style={{
          width: widths ? `calc(${(live ? at : target).toFixed(2)}px + var(--cb-px) * 2)` : "100%",
        }}
      >
        <Rolling text={label} at="idle" current={step} />
        <Rolling text={confirmLabel} at="sure" current={step} />
        <Rolling text={doneLabel} at="done" current={step} check />
        {/* the countdown: a pill-shaped ring inside the rim, emptied by a
          linear dash offset over --cb-t; snaps back full when not armed */}
        <svg aria-hidden data-slot="confirm-button-ring" className="absolute inset-0 size-full pointer-events-none overflow-visible" fill="none">
          <rect
            pathLength={1}
            className={cn(
              "[x:3px] [y:3px] [width:calc(100%-6px)] [height:calc(100%-6px)] [rx:calc(var(--cb-h)/2-3px)]",
              "stroke-current [stroke-width:2px] [stroke-linecap:round] [stroke-dasharray:1] opacity-0",
              "group-data-[state=sure]/confirm:opacity-100 group-data-[state=sure]/confirm:[stroke-dashoffset:-1]",
              "group-data-[state=sure]/confirm:[transition:stroke-dashoffset_var(--cb-t)_linear,opacity_var(--rap-dur-fast)_ease]",
            )}
          />
        </svg>
      </span>
      <span role="status" className="sr-only">
        {step === "sure" ? `${confirmLabel} Press again to confirm, or Escape to cancel.` : step === "done" ? doneLabel : ""}
      </span>
    </button>
  );
});
