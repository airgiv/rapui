import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../utils";
import "./Kbd.css";

/** A keyboard key. Put several side by side for a chord, or use `KbdGroup`. */
export const Kbd = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & { size?: "sm" | "md" }>(function Kbd(
  { size = "md", className, ...rest },
  ref,
) {
  return <kbd ref={ref} className={cx("rap-kbd", `rap-kbd--${size}`, className)} {...rest} />;
});

/** Keys of one shortcut, packed 2px apart. */
export function KbdGroup({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("rap-kbd-group", className)} {...rest} />;
}
