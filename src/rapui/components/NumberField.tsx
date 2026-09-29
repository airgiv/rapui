/* ══ NumberField ══════════════════════════════════════════
   Number stepper: a pill with round −/+ buttons 2px inside the ends.

   DELIGHT — AN ODOMETER WITH END STOPS.

   Stepping (buttons, arrows, PageUp/Down, Home/End) ROLLS the
   digits: every digit that changed turns over on its own little
   reel — up when the number grows, down when it shrinks — with a
   spring overshoot, and each reel to the left starts 30ms after
   the one to its right, so 199 → 200 visibly CARRIES from the
   ones to the hundreds like a mechanical counter. The reels are
   an overlay laid exactly over the input for the half-second of
   the roll (the input's own text is transparent meanwhile, its
   caret is not), so typing, selection and screen readers always
   deal with the real input.

   Pushing past min or max BONKS: the number knocks against the
   end it hit — a 5px nudge toward that side with a squash, and
   back — instead of the button simply going dead. So the limit
   buttons stay pressable (aria-disabled, dimmed) just to be able
   to say "that's the end". Typing a value past a limit bonks too
   when it is clamped on commit.

   The value itself is immediate. Reduced motion /
   data-rap-motion="calm": no reels, no bonk.
   Sound: a detent per step, "error" on a bonk. */
import { forwardRef, useEffect, useRef, useState, type CSSProperties, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { Minus, Plus } from "../icons";
import { useSound } from "../sound";
import { clamp, cn } from "../utils";
import { isMotionCalm } from "./FormField";
import "./NumberField.css";

export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step" | "type" | "prefix"> {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Multiplier for Shift+Arrow and PageUp/PageDown (default 10). */
  largeStep?: number;
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  /** Unit shown after the number, e.g. "px" or "%". */
  unit?: ReactNode;
  /** Label for the − / + buttons (screen readers). */
  decrementLabel?: string;
  incrementLabel?: string;
}

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

interface Roll {
  from: string;
  to: string;
  dir: 1 | -1;
  n: number;
}

/* The reels: laid exactly over the input while they turn. Up: the old digit leaves
   upward and the new one comes up from below; down: the reverse. Each reel to the
   left waits 30ms more (--carry) — the carry. A digit that disappears (100 → 99)
   folds its width away as it turns. */
const reelTurn = {
  up: "fun:animate-[rap-nf-reel-up_460ms_var(--rap-ease-spring)_calc(var(--carry,0)*30ms)_both]",
  down: "fun:animate-[rap-nf-reel-down_460ms_var(--rap-ease-spring)_calc(var(--carry,0)*30ms)_both]",
};

/** The reels: old and new text right-aligned, every changed character turning over. */
function Odometer({ roll }: { roll: Roll }) {
  const len = Math.max(roll.from.length, roll.to.length);
  const a = roll.from.padStart(len, " ");
  const b = roll.to.padStart(len, " ");
  return (
    <span
      data-slot="number-field-odometer"
      className="absolute inset-0 flex items-center justify-center font-medium tabular-nums tracking-[-0.01em] whitespace-pre pointer-events-none"
      aria-hidden
    >
      {Array.from(b).map((ch, i) => {
        const fromRight = len - 1 - i;
        if (a[i] === ch) {
          return ch === " " ? null : (
            <span key={`${roll.n}-${fromRight}`} data-slot="number-field-reel" className="inline-block leading-[1.3]">
              {ch}
            </span>
          );
        }
        const strip = roll.dir > 0 ? [a[i], ch] : [ch, a[i]];
        return (
          <span
            key={`${roll.n}-${fromRight}`}
            data-slot="number-field-reel"
            className={cn(
              "inline-block leading-[1.3] h-[1.3em] overflow-hidden align-middle",
              ch === " " && "fun:animate-[rap-nf-fold_460ms_var(--rap-ease-rm)_both]",
            )}
            style={{ "--carry": fromRight } as CSSProperties}
          >
            <span className={cn("flex flex-col *:h-[1.3em] *:leading-[1.3] *:text-center", roll.dir > 0 ? reelTurn.up : reelTurn.down)}>
              <span>{strip[0] === " " ? "\u00a0" : strip[0]}</span>
              <span>{strip[1] === " " ? "\u00a0" : strip[1]}</span>
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * Number stepper: a pill with round −/+ buttons sitting 2px inside the ends.
 * Arrow keys step, Shift+Arrow and PageUp/Down step ×10, Home/End jump to min/max.
 * Digits roll like an odometer; pushing past a limit bonks.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  {
    value,
    defaultValue = null,
    onValueChange,
    min = -Infinity,
    max = Infinity,
    step = 1,
    largeStep = 10,
    size = "md",
    invalid,
    unit,
    disabled,
    readOnly,
    className,
    decrementLabel = "Decrease",
    incrementLabel = "Increase",
    onKeyDown,
    onBlur,
    ...rest
  },
  ref,
) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState<number | null>(defaultValue);
  const current = controlled ? value : inner;
  const [text, setText] = useState(current == null ? "" : String(current));

  // keep the text in sync when the value changes from outside
  useEffect(() => {
    setText(current == null ? "" : String(current));
  }, [current]);

  const precision = Math.max(decimals(step), Number.isFinite(min) ? decimals(min) : 0);
  const normalise = (n: number) => Number(clamp(n, min, max).toFixed(precision));

  const box = useRef<HTMLDivElement>(null);
  const sound = useSound();
  const [roll, setRoll] = useState<Roll | null>(null);
  const [bonk, setBonk] = useState<{ dir: 1 | -1; n: number } | null>(null);
  useEffect(() => {
    if (!roll) return;
    const id = window.setTimeout(() => setRoll(null), 560 + 30 * Math.max(roll.to.length, roll.from.length));
    return () => window.clearTimeout(id);
  }, [roll]);

  const commit = (n: number | null, stepped = false) => {
    const next = n == null || Number.isNaN(n) ? null : normalise(n);
    const calm = isMotionCalm(box.current);
    if (n != null && !Number.isNaN(n) && (n > max || n < min)) {
      sound.play("error");
      if (!calm) setBonk((b) => ({ dir: n > max ? 1 : -1, n: (b?.n ?? 0) + 1 }));
    } else if (stepped && next !== current) {
      sound.detent(next === min || next === max ? 1 : 0.7);
    }
    if (stepped && !calm && next != null && current != null && next !== current) {
      setRoll((r) => ({ from: String(current), to: String(next), dir: next > current ? 1 : -1, n: (r?.n ?? 0) + 1 }));
    }
    if (!controlled) setInner(next);
    setText(next == null ? "" : String(next));
    if (next !== current) onValueChange?.(next);
  };

  const stepBy = (dir: 1 | -1, mult = 1) => {
    const base = current ?? (Number.isFinite(min) ? min : 0);
    commit(current == null ? base : base + dir * step * mult, true);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || readOnly) return;
    const big = e.shiftKey ? largeStep : 1;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        stepBy(1, big);
        break;
      case "ArrowDown":
        e.preventDefault();
        stepBy(-1, big);
        break;
      case "PageUp":
        e.preventDefault();
        stepBy(1, largeStep);
        break;
      case "PageDown":
        e.preventDefault();
        stepBy(-1, largeStep);
        break;
      case "Home":
        if (Number.isFinite(min)) {
          e.preventDefault();
          commit(min, true);
        }
        break;
      case "End":
        if (Number.isFinite(max)) {
          e.preventDefault();
          commit(max, true);
        }
        break;
      case "Enter":
        commit(text.trim() === "" ? null : Number(text.replace(",", ".")));
        break;
    }
  };

  const atMin = current != null && current <= min;
  const atMax = current != null && current >= max;

  /* --nf-h drives the height and the round buttons, which sit --nf-inset (2px)
     inside the ends. Focused, the pill lifts to the surface and the buttons drop to
     the fill so they stay visible on it. */
  return (
    <div
      ref={box}
      data-slot="number-field"
      data-size={size}
      data-invalid={invalid || undefined}
      className={cn(
        "group/nf inline-flex items-center justify-between gap-1 w-full min-w-[9.5rem] max-w-48 h-(--nf-h) p-(--nf-inset)",
        "rounded-pill bg-fill text-ink font-sans text-[1rem] [--nf-inset:var(--rap-gap-tight)]",
        "transition-[background-color,box-shadow] duration-(--rap-dur-fast) ease-rm",
        "hover:not-focus-within:bg-fill-hover focus-within:bg-surface focus-within:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
        size === "sm" && "[--nf-h:var(--rap-control-h-sm)] text-[0.875rem]",
        size === "md" && "[--nf-h:var(--rap-control-h)]",
        size === "lg" && "[--nf-h:var(--rap-control-h-lg)] text-[1.0625rem]",
        invalid && "shadow-[inset_0_0_0_2px_var(--rap-danger)] focus-within:shadow-[inset_0_0_0_2px_var(--rap-danger)]",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        data-slot="number-field-decrement"
        className={cn(buttonClass, size === "sm" && "[&_svg]:size-3.5")}
        aria-label={decrementLabel}
        aria-disabled={atMin || undefined}
        disabled={disabled || readOnly}
        onClick={() => stepBy(-1)}
      >
        <Minus aria-hidden />
      </button>
      {/* the bonk: the number knocks against the end it hit (--bonk: 1 right, -1 left);
          two names so a second bonk mid-bonk restarts it */}
      <span
        data-slot="number-field-value"
        className={cn(
          "inline-flex items-center justify-center gap-[0.2em] flex-1 min-w-0 h-full self-stretch",
          bonk &&
            (bonk.n % 2
              ? "fun:animate-[rap-nf-bonk-a_320ms_var(--rap-ease-out)]"
              : "fun:animate-[rap-nf-bonk-b_320ms_var(--rap-ease-out)]"),
        )}
        style={bonk ? ({ "--bonk": bonk.dir } as CSSProperties) : undefined}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setBonk(null);
        }}
      >
        <span data-slot="number-field-slot" className="relative inline-flex items-center h-full max-w-full">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          role="spinbutton"
          autoComplete="off"
          data-slot="number-field-input"
          className={cn(
            "min-w-[2ch] max-w-full w-auto h-full p-0 border-0 bg-transparent text-inherit font-medium tabular-nums",
            // the pill's font, spelled out: a `font` shorthand would also reset weight and tabular-nums
            "[font-family:inherit] [font-size:inherit] [line-height:inherit] [font-style:inherit]",
            "tracking-[-0.01em] text-center outline-none focus-visible:outline-none [field-sizing:content]",
            // while the reels turn over it, the input's own text is hidden — its caret is not
            roll && "text-transparent caret-ink",
          )}
          aria-valuenow={current ?? undefined}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          aria-invalid={invalid || rest["aria-invalid"] || undefined}
          disabled={disabled}
          readOnly={readOnly}
          value={text}
          size={Math.max(2, text.length || 2)}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          onBlur={(e) => {
            commit(text.trim() === "" ? null : Number(text.replace(",", ".")));
            onBlur?.(e);
          }}
          {...rest}
        />
        {roll && <Odometer roll={roll} />}
        </span>
        {unit != null && (
          <span data-slot="number-field-unit" className="text-mute text-[0.9em]">
            {unit}
          </span>
        )}
      </span>
      <button
        type="button"
        tabIndex={-1}
        data-slot="number-field-increment"
        className={cn(buttonClass, size === "sm" && "[&_svg]:size-3.5")}
        aria-label={incrementLabel}
        aria-disabled={atMax || undefined}
        disabled={disabled || readOnly}
        onClick={() => stepBy(1)}
      >
        <Plus aria-hidden />
      </button>
    </div>
  );
});

/* the round −/+ buttons: surface on the fill, fill on the focused (surface) pill; ink on
   hover. At a limit the button looks spent but still answers — with a bonk — so it keeps
   its resting colour under the pointer. */
const buttonClass = cn(
  "grid place-items-center flex-none size-[calc(var(--nf-h)-var(--nf-inset)*2)] p-0 border-0 rounded-full",
  "bg-surface text-ink cursor-pointer group-focus-within/nf:bg-fill",
  "transition-[background-color,color,scale] duration-(--rap-dur-fast) ease-rm",
  "not-aria-disabled:hover:bg-ink not-aria-disabled:hover:text-paper active:scale-90",
  "disabled:opacity-35 disabled:pointer-events-none aria-disabled:opacity-35 [&_svg]:size-4",
);
