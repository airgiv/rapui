import { forwardRef, useRef, type ForwardedRef, type HTMLAttributes, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "../icons";
import { useSound } from "../sound";
import { cva } from "class-variance-authority";
import { cn, prefersReducedMotion } from "../utils";
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

/* delight: unpinned, it swings on one corner (the pin at 14px,14px) and falls —
   keyframes in Alert.css. Calm / reduced motion never make a ghost; the classes
   hide one anyway if the mode changes mid-fall. */
const GHOST = [
  "z-[2147483000]",
  "pointer-events-none",
  "origin-[14px_14px]",
  "animate-[rap-alert-fall_640ms_linear_forwards]",
  "calm:hidden",
  "motion-reduce:hidden",
];

/** Leave a falling copy of `el` where it stands. */
function dropGhost(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const ghost = el.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("id");
  ghost.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  ghost.setAttribute("aria-hidden", "true");
  ghost.setAttribute("inert", "");
  ghost.removeAttribute("role");
  ghost.setAttribute("data-ghost", "");
  ghost.classList.add(...GHOST);
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

const alertVariants = cva(
  [
    "flex items-start gap-3 w-full py-4 px-[1.125rem] rounded-pop text-ink font-sans tracking-[-0.01em]",
    "bg-[color-mix(in_srgb,var(--al-color)_10%,var(--rap-surface))]",
    // narrow: the action wraps onto its own row, under the text
    "max-[560px]:flex-wrap",
  ],
  {
    variants: {
      variant: {
        info: "[--al-color:var(--rap-blue)]",
        success: "[--al-color:var(--rap-success)]",
        warning: "[--al-color:var(--rap-warning)]",
        danger: "[--al-color:var(--rap-danger)]",
        neutral: "[--al-color:var(--rap-ink)] bg-fill",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

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
      data-slot="alert"
      data-variant={variant}
      className={cn(alertVariants({ variant }), className)}
      {...rest}
    >
      {icon !== false && (
        <span
          data-slot="alert-icon"
          className={cn(
            "inline-flex flex-none mt-px text-(--al-color) [&_svg]:size-5",
            variant === "neutral" && "text-ink-2",
            variant === "warning" && "text-[color-mix(in_srgb,var(--rap-warning)_85%,var(--rap-ink))]",
          )}
        >
          {icon ?? ICONS[variant]}
        </span>
      )}
      <div data-slot="alert-body" className="flex flex-col gap-[0.2rem] flex-1 min-w-0">
        {title != null && <AlertTitle>{title}</AlertTitle>}
        {children != null && <AlertDescription>{children}</AlertDescription>}
      </div>
      {action != null && (
        <div
          data-slot="alert-action"
          className="flex items-center gap-tight flex-none self-center max-[560px]:order-3 max-[560px]:w-full max-[560px]:pl-[calc(20px+0.75rem)]"
        >
          {action}
        </div>
      )}
      {onDismiss && (
        <button
          type="button"
          data-slot="alert-close"
          className={cn(
            "inline-grid place-items-center flex-none size-7 -my-1 -mr-1.5 ml-0 p-0 border-0 rounded-full bg-transparent text-ink-2 cursor-pointer",
            "transition-[background-color] duration-(--rap-dur-fast) ease-rm hover:bg-fill [&_svg]:size-4",
            "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
          )}
          onClick={dismiss}
          aria-label="Dismiss"
        >
          <X />
        </button>
      )}
    </div>
  );
});

export const AlertTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function AlertTitle({ className, ...rest }, ref) {
  return <div ref={ref} data-slot="alert-title" className={cn("text-[0.9375rem] font-medium leading-[1.35]", className)} {...rest} />;
});

export const AlertDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function AlertDescription(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} data-slot="alert-description"
      className={cn(
        "text-[0.9375rem] leading-[1.45] text-ink-2 [&_a]:text-inherit [&_a]:underline [&_a]:underline-offset-[0.2em]",
        className,
      )} {...rest} />;
});
