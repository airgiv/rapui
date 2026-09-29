import { Toaster as Sonner, toast, type ToasterProps as SonnerProps } from "sonner";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "../icons";
import { cx } from "../utils";
import { Spinner } from "./Spinner";
import "./Toast.css";

export type ToasterProps = SonnerProps;

/**
 * Mount once near the root, then call `toast()` from anywhere.
 * Toasts are rounded ink slabs (they invert in dark mode) with a pill action.
 */
export function Toaster({ className, toastOptions, icons, position = "bottom-right", gap = 8, ...rest }: ToasterProps) {
  const cn = toastOptions?.classNames ?? {};
  return (
    <Sonner
      className={cx("rap-toaster", className)}
      position={position}
      gap={gap}
      icons={{
        success: <CircleCheck />,
        error: <CircleAlert />,
        warning: <TriangleAlert />,
        info: <Info />,
        loading: <Spinner size="sm" label="Working" />,
        close: <X />,
        ...icons,
      }}
      toastOptions={{
        ...toastOptions,
        unstyled: true,
        classNames: {
          ...cn,
          toast: cx("rap-toast", cn.toast),
          title: cx("rap-toast__title", cn.title),
          description: cx("rap-toast__desc", cn.description),
          content: cx("rap-toast__content", cn.content),
          icon: cx("rap-toast__icon", cn.icon),
          actionButton: cx("rap-toast__btn", "rap-toast__btn--action", cn.actionButton),
          cancelButton: cx("rap-toast__btn", "rap-toast__btn--cancel", cn.cancelButton),
          closeButton: cx("rap-toast__close", cn.closeButton),
        },
      }}
      {...rest}
    />
  );
}

export { toast };
