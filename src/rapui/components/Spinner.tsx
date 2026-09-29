import { forwardRef, type SVGAttributes } from "react";
import { cn } from "../utils";
import "./Spinner.css";

/* ── Spinner ───────────────────────────────────────────────
   Delight: not an arc on a turntable but a small squishy ball
   running laps. Each lap eases in and out (it accelerates down
   the far side and slows at the top), and the ball stretches
   along its path in proportion to that speed — a round dot at
   the slow point, a 26%-of-the-lap smear at full speed — and
   thins as it stretches (3 → 2.2 stroke) so it keeps its
   volume. Both are one 1s cycle on the same easing, so the
   stretch always peaks exactly where the speed does. The dash
   is recentred as it grows (offset = −half its length), so it
   stretches both ways about the ball rather than growing a tail.

   A faint track shows the orbit. Spinning is information, so
   reduced motion keeps it turning — slowly, as a plain arc — and
   calm does the same. */

export interface SpinnerProps extends SVGAttributes<SVGSVGElement> {
  size?: "sm" | "md" | "lg" | number;
  /** Accessible label; defaults to "Loading". */
  label?: string;
}

const PX = { sm: 16, md: 20, lg: 28 } as const;

/* one 1s cycle for both the lap and the squish, on the same easing, so the
   stretch always peaks exactly where the speed does (keyframes: Spinner.css).
   Calm and reduced motion: a steady arc, turning slowly — spinning is
   information, so it never stops. */
const LAP = "animate-[rap-spinner-lap_1s_cubic-bezier(0.55,0.1,0.45,0.9)_infinite]";
const SQUISH = "animate-[rap-spinner-squish_1s_cubic-bezier(0.55,0.1,0.45,0.9)_infinite]";
const STEADY_ARC = [
  "motion-reduce:animate-none motion-reduce:[stroke-dasharray:25_100] motion-reduce:[stroke-width:2.5px]",
  "calm:animate-none calm:[stroke-dasharray:25_100] calm:[stroke-width:2.5px]",
];

/** A squishy dot orbiting in the current text colour. */
export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(function Spinner(
  { size = "md", label = "Loading", className, ...rest },
  ref,
) {
  const px = typeof size === "number" ? size : PX[size];
  return (
    <svg
      ref={ref}
      role="status"
      aria-label={label}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      data-slot="spinner"
      className={cn(
        "flex-none align-middle",
        LAP,
        "motion-reduce:animate-[rap-spinner-lap_2s_linear_infinite] calm:animate-[rap-spinner-lap_1.2s_linear_infinite]",
        className,
      )}
      {...rest}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.16" />
      <circle
        data-slot="spinner-ball"
        // the ball: a dash on the orbit that stretches with speed, recentred as it grows
        className={cn("[stroke-dasharray:0.01_100]", SQUISH, STEADY_ARC)}
        cx="12"
        cy="12"
        r="9"
        pathLength={100}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
});
