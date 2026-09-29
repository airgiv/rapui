import { forwardRef, useRef, type ForwardedRef, type HTMLAttributes, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "../icons";
import { useSound } from "../sound";
import { cx, prefersReducedMotion } from "../utils";
import "./Alert.css";

/* ── Alert ─────────────────────────────────────────────────
   Delight: an alert is a slip pinned to the page, and dismissing
   it unpins ONE corner. It swings on the pin that is left (top
   left, 6°), then falls away under gravity, turning, like a
   Checklist slip dropping into the heap.

   The state change is not held back for the show: onDismiss runs
   immediately, the app removes the alert and the layout closes
   up at once. What falls is a GHOST — a clone of the alert's
   pixels, fixed where it stood, inert and hidden from assistive
   tech — and it removes itself when it lands. So an app that
   unmounts on dismiss (the usual way) still gets the fall, and
   the page is never waiting on an animation.

   The fall: 160ms swing on the out-ease, then 480ms of gravity
   (--rap-ease-gravity: starts at nothing and gains), 150px and a
   further 10°, fading over the last half. Calm / reduced motion:
   no ghost, it just goes. With a SoundProvider on it plays "drop". */

const isCalm = (el: Element | null) => prefersReducedMotion() || !!el?.closest('[data-rap-motion="calm"]');

function setRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** Leave a falling copy of `el` where it stands. */
function dropGhost(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const ghost = el.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("id");
  ghost.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  ghost.setAttribute("aria-hidden", "true");
  ghost.setAttribute("inert", "");
  ghost.removeAttribute("role");
  ghost.classList.add("rap-alert--ghost");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    margin: "0",
  });
  // keep a scoped theme (data-rap-theme on a wrapper) by landing inside it
  const host = el.parentElement?.closest("[data-rap-theme]") ?? document.body;
  host.appendChild(ghost);
  const done = () => ghost.remove();
  ghost.addEventListener("animationend", done, { once: true });
  window.setTimeout(done, 1200); // belt and braces if animations are off
}

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
  const node = useRef<HTMLDivElement | null>(null);
  const sound = useSound();
  const dismiss = () => {
    const el = node.current;
    if (el && !isCalm(el)) dropGhost(el);
    sound.play("drop");
    onDismiss?.();
  };
  return (
    <div
      ref={(el) => {
        node.current = el;
        setRef(ref, el);
      }}
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
        <button type="button" className="rap-alert__close" onClick={dismiss} aria-label="Dismiss">
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
