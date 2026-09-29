import { forwardRef, useEffect, useRef, type ForwardedRef, type HTMLAttributes, type ReactNode } from "react";
import { cn, prefersReducedMotion } from "../utils";
import "./EmptyState.css";

/* ── EmptyState ────────────────────────────────────────────
   Delight: nothing is here yet, so the one thing that IS here
   drifts. The icon floats (shared `rap-float`: 6px up, ±3° of
   sway, 3.6s — slow enough to be ambient, never a spinner) and
   its shadow on the floor below shrinks and fades as it rises,
   which is what sells "floating" rather than "bobbing".

   After a 1.8s pause — long enough to have read the title — the
   first button in `action` wiggles once (`rap-wiggle`): a nudge
   toward the way forward, once, never on a loop. It is skipped if
   the pointer is already inside, since then you have found it.

   Pass a FancyIcon (Solar duotone) for the icon — this is an
   illustrative spot. Calm / reduced motion: still icon, no nudge. */

const isCalm = (el: Element | null) => prefersReducedMotion() || !!el?.closest('[data-rap-motion="calm"]');
const NUDGE_AFTER = 1800;
/** the shared one-off wiggle, added from JS (still behind `fun:` in case calm arrives later) */
const WIGGLE = "fun:animate-wiggle";

function setRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Ideally a `<FancyIcon icon="folder" />`; any node works. */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Buttons under the text. */
  action?: ReactNode;
  size?: "sm" | "md";
}

/** What to show when a list has nothing in it yet: icon, one line of why, one way forward. */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { icon, title, description, action, size = "md", className, ...rest },
  ref,
) {
  const root = useRef<HTMLDivElement | null>(null);
  const actions = useRef<HTMLDivElement>(null);
  const hasAction = action != null;

  useEffect(() => {
    if (!hasAction) return;
    const t = window.setTimeout(() => {
      const r = root.current;
      const target = actions.current?.querySelector<HTMLElement>("button:not(:disabled), a[href]");
      if (!r || !target || isCalm(r) || r.matches(":hover")) return;
      target.classList.remove(WIGGLE);
      void target.offsetWidth;
      target.classList.add(WIGGLE);
      target.addEventListener("animationend", () => target.classList.remove(WIGGLE), { once: true });
    }, NUDGE_AFTER);
    return () => window.clearTimeout(t);
  }, [hasAction]);

  return (
    <div
      ref={(el) => {
        root.current = el;
        setRef(ref, el);
      }}
      data-slot="empty-state"
      data-size={size}
      className={cn(
        "flex flex-col items-center max-w-[26rem] mx-auto px-4 text-center font-sans text-ink",
        size === "sm" ? "gap-3.5 py-5" : "gap-5 py-8",
        className,
      )}
      {...rest}
    >
      {icon != null && (
        // delight: the one thing here floats. The wrapper carries the shadow on the "floor"
        // (it shrinks and fades as the icon rises, keyframes in EmptyState.css); the badge
        // above it drifts on the shared rap-float, slowed to 3.6s to stay ambient
        <span
          data-slot="empty-state-float"
          className={cn(
            "relative grid place-items-center pb-2.5",
            "after:absolute after:bottom-0 after:left-1/2 after:w-[60%] after:h-1.5 after:-ml-[30%] after:rounded-[50%]",
            "after:bg-[color-mix(in_srgb,var(--rap-ink)_12%,transparent)] after:blur-[2px]",
            "fun:after:animate-[rap-empty-shadow_3.6s_var(--rap-ease-in-out)_infinite]",
          )}
        >
          <span
            data-slot="empty-state-icon"
            className={cn(
              "grid place-items-center rounded-full bg-fill text-ink-2",
              "fun:animate-[rap-float_3.6s_var(--rap-ease-in-out)_infinite]",
              // a FancyIcon brings its own size: give it room, and it must not float twice
              "[&>[data-slot=fancy-icon]]:animate-none",
              size === "sm"
                ? "size-12 [&>svg]:size-5 has-[>[data-slot=fancy-icon]]:size-13"
                : "size-16 [&>svg]:size-[26px] has-[>[data-slot=fancy-icon]]:size-18",
            )}
          >
            {icon}
          </span>
        </span>
      )}
      <div data-slot="empty-state-text" className="flex flex-col gap-[0.4rem]">
        <h3
          data-slot="empty-state-title"
          className={cn("m-0 font-medium tracking-[-0.02em]", size === "sm" ? "text-[1.0625rem]/[1.2]" : "text-[1.25rem]/[1.2]")}
        >
          {title}
        </h3>
        {description != null && (
          <p data-slot="empty-state-description" className="m-0 text-[0.9375rem] leading-[1.45] tracking-[-0.01em] text-mute">
            {description}
          </p>
        )}
      </div>
      {action != null && (
        <div ref={actions} data-slot="empty-state-action" className="flex flex-wrap justify-center gap-tight">
          {action}
        </div>
      )}
    </div>
  );
});
