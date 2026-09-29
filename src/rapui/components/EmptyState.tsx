import { forwardRef, useEffect, useRef, type ForwardedRef, type HTMLAttributes, type ReactNode } from "react";
import { cx, prefersReducedMotion } from "../utils";
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
      target.classList.remove("rap-anim-wiggle");
      void target.offsetWidth;
      target.classList.add("rap-anim-wiggle");
      target.addEventListener("animationend", () => target.classList.remove("rap-anim-wiggle"), { once: true });
    }, NUDGE_AFTER);
    return () => window.clearTimeout(t);
  }, [hasAction]);

  return (
    <div
      ref={(el) => {
        root.current = el;
        setRef(ref, el);
      }}
      className={cx("rap-empty", `rap-empty--${size}`, className)}
      {...rest}
    >
      {icon != null && (
        <span className="rap-empty__float">
          <span className="rap-empty__icon">{icon}</span>
        </span>
      )}
      <div className="rap-empty__text">
        <h3 className="rap-empty__title">{title}</h3>
        {description != null && <p className="rap-empty__desc">{description}</p>}
      </div>
      {action != null && (
        <div ref={actions} className="rap-empty__action">
          {action}
        </div>
      )}
    </div>
  );
});
