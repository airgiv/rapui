import { forwardRef, useEffect, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { Check } from "../icons";
import { useSound } from "../sound";
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
 *
 * Delight — completing a step is a little pour. When `current` moves forward:
 *  1. the finished circle turns blue and its check is DRAWN left to right (a clip wipe:
 *     the glyph comes from icons.tsx, which is filled, so it can't be stroked);
 *  2. blue runs down the connector like liquid — a slow start, a fast middle, and the
 *     line swells to twice its weight halfway, like a slug of water through a hose
 *     (380ms per connector; several steps at once pour one after the other);
 *  3. as the liquid arrives, the next circle turns ink and splats — a local variant of
 *     rap-splat that starts from full size (a squish, then the wobble), because the
 *     circle is already there; rap-splat's 0.4 start is for things that appear.
 * The state (colours, aria-current) changes at once; the pour only re-reveals it.
 * Going back is instant: nothing pours uphill. Calm / reduced motion: no pour.
 * Sound (opt-in via SoundProvider): `success` as the step completes.
 */
const POUR_MS = 380;

export const Stepper = forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  { steps, current, orientation = "horizontal", size = "md", onStepClick, className, style, ...rest },
  ref,
) {
  // remember where we came from, so only a forward move pours (and only the new stretch)
  const [last, setLast] = useState(current);
  const [pour, setPour] = useState<{ from: number; to: number } | null>(null);
  if (current !== last) {
    setPour(current > last ? { from: Math.max(0, last), to: current } : null);
    setLast(current);
  }
  const sound = useSound();
  useEffect(() => {
    if (pour) sound.play("success", { strength: 0.7 });
  }, [pour, sound]);
  return (
    <ol
      ref={ref}
      aria-orientation={orientation}
      className={cx("rap-stepper", `rap-stepper--${orientation}`, `rap-stepper--${size}`, className)}
      style={{ ["--st-pour" as string]: `${POUR_MS}ms`, ...style }}
      {...rest}
    >
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        const clickable = onStepClick && state === "done";
        const Marker = clickable ? "button" : "span";
        const pouring = pour && i >= pour.from && i < pour.to;
        const arriving = pour && i === pour.to && i < steps.length;
        // order in the pour; the arriving circle keys off the last connector's timing
        const k = pour ? i - pour.from - (arriving ? 1 : 0) : 0;
        return (
          <li
            key={i}
            className="rap-stepper__step"
            data-state={state}
            data-pour={pouring ? (k === 0 ? "first" : "") : undefined}
            data-arrive={arriving ? "" : undefined}
            style={pouring || arriving ? ({ "--st-k": k } as CSSProperties) : undefined}
            aria-current={state === "current" ? "step" : undefined}
          >
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
