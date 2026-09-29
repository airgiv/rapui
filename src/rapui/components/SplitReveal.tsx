import { createElement, type CSSProperties, type ElementType, type HTMLAttributes } from "react";
import { useInView } from "../hooks/useInView";
import { cn } from "../utils";

export interface SplitRevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: string;
  /** Split by word or by char. */
  by?: "word" | "char";
  /** ms between pieces */
  stagger?: number;
  delay?: number;
}

/** Text rises word-by-word (or char-by-char) from behind a mask when it scrolls into view. */
export function SplitReveal({ as = "span", children, by = "word", stagger = 60, delay = 0, className, ...rest }: SplitRevealProps) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.3 });
  const pieces = by === "word" ? children.split(/(\s+)/) : Array.from(children);
  let n = 0;

  return createElement(
    as,
    {
      ref,
      "data-slot": "split-reveal",
      "data-state": inView ? "in" : "out",
      className: cn("group/split inline", className),
      "aria-label": children,
      ...rest,
    },
    pieces.map((p, i) => {
      if (/^\s+$/.test(p)) return " ";
      const idx = n++;
      return (
        <span
          key={i}
          data-slot="split-reveal-mask"
          aria-hidden
          /* the mask: padded out (and pulled back by the same margin) to leave
             room for descenders and italic overhang, so nothing is clipped */
          className="inline-block overflow-hidden align-top pt-[0.04em] px-[0.06em] pb-[0.1em] -mt-[0.04em] -mx-[0.06em] -mb-[0.1em]"
        >
          <span
            data-slot="split-reveal-piece"
            /* parked just below the mask and tipped 6° about its bottom-left
               corner, so each word swings up into place rather than sliding */
            className={cn(
              "inline-block translate-y-[110%] rotate-6 origin-bottom-left",
              "transition-[translate,rotate] duration-(--rap-dur-slow) ease-soft delay-(--d)",
              "group-data-[state=in]/split:translate-none group-data-[state=in]/split:rotate-none",
            )}
            style={{ "--d": `${delay + idx * stagger}ms` } as CSSProperties}
          >
            {p}
          </span>
        </span>
      );
    }),
  );
}
