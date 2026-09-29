import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "../icons";
import { cx } from "../utils";
import "./Alert.css";

export type AlertVariant = "info" | "success" | "warning" | "danger" | "neutral";

const ICONS: Record<AlertVariant, ReactNode> = {
  info: <Info />,
  success: <CircleCheck />,
  warning: <TriangleAlert />,
  danger: <CircleAlert />,
  neutral: <Info />,
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  /** Replace the icon, or `false` to drop it. */
  icon?: ReactNode | false;
  title?: ReactNode;
  /** Buttons or links on the right (wrap below on narrow widths). */
  action?: ReactNode;
  /** Shows a close button that calls this. */
  onDismiss?: () => void;
}

/** Inline message on a tinted fill. Title + description; `children` is the description. */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = "info", icon, title, action, onDismiss, className, children, role, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role={role ?? (variant === "danger" || variant === "warning" ? "alert" : "status")}
      className={cx("rap-alert", `rap-alert--${variant}`, className)}
      {...rest}
    >
      {icon !== false && <span className="rap-alert__icon">{icon ?? ICONS[variant]}</span>}
      <div className="rap-alert__body">
        {title != null && <AlertTitle>{title}</AlertTitle>}
        {children != null && <AlertDescription>{children}</AlertDescription>}
      </div>
      {action != null && <div className="rap-alert__action">{action}</div>}
      {onDismiss && (
        <button type="button" className="rap-alert__close" onClick={onDismiss} aria-label="Dismiss">
          <X />
        </button>
      )}
    </div>
  );
});

export const AlertTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function AlertTitle({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("rap-alert__title", className)} {...rest} />;
});

export const AlertDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function AlertDescription(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("rap-alert__desc", className)} {...rest} />;
});
