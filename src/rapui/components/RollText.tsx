import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "../utils";

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
    <span
      data-slot="roll-text"
      /* the window: one line tall (1.15 so descenders are not cut), clipping
         the copy that waits below each letter */
      className={cn("group/roll inline-flex overflow-hidden leading-[1.15] align-bottom", className)}
      aria-label={children}
      {...rest}
    >
      {chars.map((ch, i) => (
        <span
          key={i}
          data-slot="roll-text-char"
          aria-hidden
          className={cn(
            /* each letter carries its twin in ::after, one line below; rolling
               the letter up by its own height brings the twin into the window.
               Staggered by --i so the word ripples left to right. */
            "relative inline-block transition-[translate] duration-(--rap-dur) ease-soft delay-[calc(var(--i)*var(--stagger))]",
            "after:absolute after:left-0 after:top-full after:content-[attr(data-char)]",
            /* the host contract: any ancestor with .rap-roll-host rolls it */
            "group-hover/roll:-translate-y-full in-[.rap-roll-host:hover]:-translate-y-full in-[.rap-roll-host:focus-visible]:-translate-y-full",
          )}
          style={{ "--i": i, "--stagger": `${stagger}ms` } as CSSProperties}
          data-char={ch === " " ? " " : ch}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}
