import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cx } from "../utils";
import "./Stepper.css";

export interface StepperStep {
  title: ReactNode;
  description?: ReactNode;
}

export interface StepperProps extends Omit<HTMLAttributes<HTMLOListElement>, "onChange"> {
  steps: StepperStep[];
  /** Index of the current step (0-based). Steps before it are done; `steps.length` means all done. */
  current: number;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  /** Makes finished steps clickable (to go back). */
  onStepClick?: (index: number) => void;
}

/**
 * Progress through a multi-step flow. Numbered circles: done = blue with a check,
 * current = ink, upcoming = fill; connectors fill in as you go.
 */
export const Stepper = forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  { steps, current, orientation = "horizontal", size = "md", onStepClick, className, ...rest },
  ref,
) {
  return (
    <ol
      ref={ref}
      aria-orientation={orientation}
      className={cx("rap-stepper", `rap-stepper--${orientation}`, `rap-stepper--${size}`, className)}
      {...rest}
    >
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        const clickable = onStepClick && state === "done";
        const Marker = clickable ? "button" : "span";
        return (
          <li key={i} className="rap-stepper__step" data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <div className="rap-stepper__rail">
              <Marker
                className="rap-stepper__dot"
                {...(clickable ? { type: "button" as const, onClick: () => onStepClick(i), "aria-label": `Back to step ${i + 1}` } : {})}
              >
                {state === "done" ? <Check strokeWidth={3} aria-hidden /> : i + 1}
              </Marker>
              {i < steps.length - 1 && <span className="rap-stepper__line" aria-hidden />}
            </div>
            <div className="rap-stepper__text">
              <span className="rap-stepper__title">{s.title}</span>
              {s.description != null && <span className="rap-stepper__desc">{s.description}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
});
