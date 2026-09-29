import { createElement, type CSSProperties, type ElementType, type HTMLAttributes } from "react";
import { useInView } from "../hooks/useInView";
import { cx } from "../utils";
import "./SplitReveal.css";

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
    { ref, className: cx("rap-split", inView && "is-in", className), "aria-label": children, ...rest },
    pieces.map((p, i) => {
      if (/^\s+$/.test(p)) return " ";
      const idx = n++;
      return (
        <span className="rap-split__mask" aria-hidden key={i}>
          <span className="rap-split__piece" style={{ "--d": `${delay + idx * stagger}ms` } as CSSProperties}>
            {p}
          </span>
        </span>
      );
    }),
  );
}
