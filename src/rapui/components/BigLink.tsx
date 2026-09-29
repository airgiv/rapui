import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cx } from "../utils";
import { Arrow } from "./Button";
import "./BigLink.css";

export interface BigLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  /** Small caption on the right: count, year, tag. */
  meta?: ReactNode;
  size?: "lg" | "xl" | "xxl";
}

/**
 * Giant text link — the Readymag move: a headline-sized word that turns
 * orange on hover while an arrow slides in and the row shifts.
 */
export function BigLink({ children, meta, size = "xl", className, ...rest }: BigLinkProps) {
  return (
    <a className={cx("rap-biglink", `rap-biglink--${size}`, className)} {...rest}>
      <span className="rap-biglink__arrow" aria-hidden>
        <Arrow />
      </span>
      <span className="rap-biglink__text">{children}</span>
      {meta != null && <span className="rap-biglink__meta">{meta}</span>}
    </a>
  );
}
