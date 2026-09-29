/* ══ Checkbox ═════════════════════════════════════════════
   Soft-cornered checkbox (Radix). Supports checked="indeterminate".

   DELIGHT — A PRESS, NOT A STATE CHANGE (the Checklist's box,
   as a standalone control).

   Pressing SQUASHES the box — wider and shorter, as a thumb
   flattens it — and it springs back on release.

   Then ONE spring (useSpring, 0..100, tune 55) is read twice,
   exactly as in the Checklist:
   · the FILL takes it raw. It is a blue square scaled from the
     centre, so on the way in it swells past the box by a few
     per cent and settles — the overshoot is what makes a tick
     feel pressed rather than switched.
   · the TICK takes it clamped, and a little late (from 18 to 88
     of the travel): it is drawn with stroke-dashoffset as the box
     fills, and it never overdraws, because a tick that runs past
     its own end and pulls back reads as a glitch, not a bounce.
   Unticking runs the same number backwards: the tick is rubbed
   out first, then the fill shrinks away.

   The mark is a stroked path drawn here rather than an icon from
   ../icons: the icon set is filled outlines, which cannot be
   drawn with a dash offset.

   Radix still owns the state (aria-checked, keyboard, forms); the
   state is immediate and the spring only paints it. Reduced
   motion / data-rap-motion="calm": the spring snaps, no squash.
   Sound: "tick" on check, "release" on uncheck. */
import { forwardRef, useCallback, useRef, useState, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { useSpring } from "../hooks/useSpring";
import { useSound } from "../sound";
import { clamp, cx } from "../utils";
import { useMotionCalm } from "./FormField";
import "./Checkbox.css";

type CheckedState = boolean | "indeterminate";

export interface CheckboxProps extends ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  size?: "sm" | "md" | "lg";
}

/* how far the fill swells past the box, as a spring tune (0 dead … 100 lively) */
const BOUNCE = 55;
/* the window of the travel in which the tick is drawn */
const LAG = 18;
const RUN = 70;
/* how much of the spring's overshoot the fill shows */
const SWELL = 0.6;

/**
 * Soft-cornered checkbox (Radix). Unticked it is a quiet ring; ticked the blue fill
 * swells in past the box and the tick draws itself. Supports `checked="indeterminate"`.
 */
export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(function Checkbox(
  { className, size = "md", checked, defaultChecked, onCheckedChange, ...rest },
  ref,
) {
  const [inner, setInner] = useState<CheckedState>(defaultChecked ?? false);
  const state: CheckedState = checked !== undefined ? checked : inner;
  const on = state !== false;

  // keep drawing the last mark while it is rubbed out
  const [shape, setShape] = useState<"tick" | "dash">(state === "indeterminate" ? "dash" : "tick");
  const want = state === "indeterminate" ? "dash" : state === true ? "tick" : shape;
  if (want !== shape) setShape(want);

  const root = useRef<HTMLButtonElement | null>(null);
  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      root.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const calm = useMotionCalm(root);
  const v = useSpring(on ? 100 : 0, BOUNCE, calm);
  // raw: swells past full — the overshoot kept at 60% so a 22px box grows to ~25px, not 27
  const fill = v <= 100 ? Math.max(0, v) / 100 : 1 + ((v - 100) / 100) * SWELL;
  const draw = clamp((v - LAG) / RUN, 0, 1); // clamped: never overdraws

  const sound = useSound();

  return (
    <CheckboxPrimitive.Root
      ref={setRef}
      className={cx("rap-checkbox", `rap-checkbox--${size}`, className)}
      checked={state}
      onCheckedChange={(c) => {
        setInner(c);
        sound.play(c === false ? "release" : "tick");
        onCheckedChange?.(c);
      }}
      {...rest}
    >
      <span className="rap-checkbox__fill" style={{ scale: String(fill), opacity: fill > 0.01 ? 1 : 0 }} aria-hidden />
      <svg className="rap-checkbox__mark" viewBox="0 0 24 24" aria-hidden>
        <path
          d={shape === "dash" ? "M6.5 12h11" : "M5.6 12.6l4.1 4.1 8.7-9.1"}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - draw}
          style={{ opacity: draw > 0 ? 1 : 0 }}
        />
      </svg>
    </CheckboxPrimitive.Root>
  );
});
