import { forwardRef, useEffect, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { Check } from "../icons";
import { useSound } from "../sound";
import { cn } from "../utils";
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

/* the pour's timings (keyframes in Stepper.css), all keyed off --st-pour and --st-k (order in the pour):
   the finished circle recolours and its check is drawn at k × pour; the liquid starts 60ms later;
   the arriving circle waits grey, then turns ink and splats as the liquid is 80% down the line */
const POUR_DOT = "fun:animate-[rap-stepper-fill_var(--rap-dur-fast)_var(--rap-ease-rm)_calc(var(--st-k,0)*var(--st-pour))_both]";
const POUR_DOT_FIRST = "fun:animate-[rap-stepper-fill-first_var(--rap-dur-fast)_var(--rap-ease-rm)_calc(var(--st-k,0)*var(--st-pour))_both]";
const POUR_CHECK = "fun:[&_svg]:animate-[rap-stepper-draw_calc(var(--st-pour)*0.7)_var(--rap-ease-out)_calc(var(--st-k,0)*var(--st-pour))_both]";
const POUR_LINE_X = "fun:after:animate-[rap-stepper-pour-x_var(--st-pour)_cubic-bezier(0.55,0,0.35,1)_calc(var(--st-k,0)*var(--st-pour)+60ms)_both]";
const POUR_LINE_Y = "fun:after:animate-[rap-stepper-pour-y_var(--st-pour)_cubic-bezier(0.55,0,0.35,1)_calc(var(--st-k,0)*var(--st-pour)+60ms)_both]";
const ARRIVE_DOT =
  "fun:[animation:rap-stepper-wait_calc(var(--st-k,0)*var(--st-pour)+60ms+var(--st-pour)*0.8)_step-end_both,rap-stepper-splat_520ms_var(--rap-ease-out)_calc(var(--st-k,0)*var(--st-pour)+60ms+var(--st-pour)*0.8)]";

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
  const horizontal = orientation === "horizontal";
  return (
    <ol
      ref={ref}
      aria-orientation={orientation}
      data-slot="stepper"
      data-orientation={orientation}
      data-size={size}
      className={cn(
        "flex m-0 p-0 list-none font-sans tracking-[-0.01em] [--st-gap:0.6rem]",
        size === "sm" && "[--st-dot:26px]",
        size === "md" && "[--st-dot:32px]",
        size === "lg" && "[--st-dot:40px]",
        horizontal ? "w-full" : "flex-col",
        className,
      )}
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
        const last = i === steps.length - 1;
        return (
          <li
            key={i}
            data-slot="stepper-step"
            className={cn(
              "relative flex min-w-0",
              // horizontal: circle + connector on one line, text below; vertical: a column, text beside
              horizontal ? "flex-1 flex-col gap-(--st-gap) last:flex-[0_0_auto]" : "gap-[0.9rem]",
            )}
            data-state={state}
            data-pour={pouring ? (k === 0 ? "first" : "") : undefined}
            data-arrive={arriving ? "" : undefined}
            style={pouring || arriving ? ({ "--st-k": k } as CSSProperties) : undefined}
            aria-current={state === "current" ? "step" : undefined}
          >
            <div data-slot="stepper-rail" className={cn("flex items-center gap-1.5", !horizontal && "flex-col")}>
              <Marker
                data-slot="stepper-dot"
                className={cn(
                  "inline-grid place-items-center flex-none size-(--st-dot) p-0 border-0 rounded-full",
                  "font-[inherit] text-[length:calc(var(--st-dot)*0.42)] font-medium tabular-nums [&_svg]:size-[55%]",
                  "[transition:background_var(--rap-dur-fast)_var(--rap-ease-rm),color_var(--rap-dur-fast)_var(--rap-ease-rm),transform_var(--rap-dur-fast)_var(--rap-ease-spring)]",
                  state === "done" && "bg-select text-select-ink",
                  state === "current" && "bg-ink text-paper",
                  state === "upcoming" && "bg-fill text-ink-2",
                  clickable &&
                    "cursor-pointer hover:[transform:scale(1.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  pouring && cn(k === 0 ? POUR_DOT_FIRST : POUR_DOT, POUR_CHECK),
                  arriving && ARRIVE_DOT,
                )}
                {...(clickable ? { type: "button" as const, onClick: () => onStepClick(i), "aria-label": `Back to step ${i + 1}` } : {})}
              >
                {state === "done" ? <Check strokeWidth={3} aria-hidden /> : i + 1}
              </Marker>
              {!last && (
                <span
                  data-slot="stepper-line"
                  aria-hidden
                  className={cn(
                    "relative block flex-1 rounded-pill bg-fill-strong",
                    horizontal ? "h-0.5 mr-1.5" : "w-0.5 min-h-6 mb-1.5",
                    // the liquid: a blue fill inside the track, full on done steps
                    "after:absolute after:inset-0 after:rounded-[inherit] after:bg-select",
                    horizontal ? "after:origin-left" : "after:origin-top",
                    state === "done" ? "after:[scale:1]" : horizontal ? "after:[scale:0_1]" : "after:[scale:1_0]",
                    pouring && (horizontal ? POUR_LINE_X : POUR_LINE_Y),
                  )}
                />
              )}
            </div>
            <div
              data-slot="stepper-text"
              className={cn(
                "flex flex-col gap-[0.15rem] min-w-0 leading-[1.4]",
                horizontal ? !last && "pr-4" : cn("pt-[calc((var(--st-dot)_-_1.4em)/2)]", !last && "pb-6"),
              )}
            >
              <span
                data-slot="stepper-title"
                className={cn(
                  "font-medium",
                  size === "sm" ? "text-[0.875rem]" : size === "lg" ? "text-[1rem]" : "text-[0.9375rem]",
                  state === "upcoming" ? "text-mute" : "text-ink",
                )}
              >
                {s.title}
              </span>
              {s.description != null && (
                <span data-slot="stepper-description" className="text-[0.8125rem] text-mute">
                  {s.description}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
});
