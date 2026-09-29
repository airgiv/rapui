import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../utils";
import "./RotatingBadge.css";

export interface RotatingBadgeProps extends HTMLAttributes<HTMLDivElement> {
  /** Text written around the circle. Repeat separators like " • " for rhythm. */
  text: string;
  size?: number;
  /** Seconds per revolution. */
  duration?: number;
  center?: ReactNode;
  color?: "ink" | "flame" | "acid" | "blue";
}

/** Circular running text with something in the middle — classic editorial stamp. */
export function RotatingBadge({ text, size = 140, duration = 14, center, color = "ink", className, style, ...rest }: RotatingBadgeProps) {
  const id = useId().replace(/:/g, "");
  return (
    <div
      className={cx("rap-rbadge", `rap-rbadge--${color}`, className)}
      style={{ width: size, height: size, "--rap-rb-dur": `${duration}s`, ...style } as CSSProperties}
      role="img"
      aria-label={text}
      {...rest}
    >
      <svg viewBox="0 0 100 100" className="rap-rbadge__ring" aria-hidden>
        <defs>
          <path id={`rb-${id}`} d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1 -76 0" />
        </defs>
        <text>
          <textPath href={`#rb-${id}`} textLength={238} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <div className="rap-rbadge__center">{center ?? <span className="rap-rbadge__star">✳</span>}</div>
    </div>
  );
}
