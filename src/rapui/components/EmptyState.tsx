import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../utils";
import "./EmptyState.css";

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
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
  return (
    <div ref={ref} className={cx("rap-empty", `rap-empty--${size}`, className)} {...rest}>
      {icon != null && <span className="rap-empty__icon">{icon}</span>}
      <div className="rap-empty__text">
        <h3 className="rap-empty__title">{title}</h3>
        {description != null && <p className="rap-empty__desc">{description}</p>}
      </div>
      {action != null && <div className="rap-empty__action">{action}</div>}
    </div>
  );
});
