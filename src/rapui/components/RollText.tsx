import type { CSSProperties, HTMLAttributes } from "react";
import { cx } from "../utils";
import "./RollText.css";

export interface RollTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: string;
  /** Delay between letters, ms. */
  stagger?: number;
}

/**
 * Letters roll up and are replaced by a copy from below.
 * Triggers when any ancestor with `.rap-roll-host` (or the text itself) is hovered/focused.
 */
export function RollText({ children, stagger = 18, className, ...rest }: RollTextProps) {
  const chars = Array.from(children);
  return (
    <span className={cx("rap-roll", className)} aria-label={children} {...rest}>
      {chars.map((ch, i) => (
        <span
          key={i}
          className="rap-roll__char"
          aria-hidden
          style={{ "--i": i, "--stagger": `${stagger}ms` } as CSSProperties}
          data-char={ch === " " ? " " : ch}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}
