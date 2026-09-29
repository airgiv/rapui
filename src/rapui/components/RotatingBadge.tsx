import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";

export interface RotatingBadgeProps extends HTMLAttributes<HTMLDivElement> {
  /** Text written around the circle. Repeat separators like " • " for rhythm. */
  text: string;
  size?: number;
  /** Seconds per revolution. */
  duration?: number;
  center?: ReactNode;
  color?: "ink" | "flame" | "acid" | "blue";
}

const badgeColors = {
  ink: "[--rb-bg:transparent] [--rb-fg:var(--rap-ink)]",
  flame: "[--rb-bg:var(--rap-flame)] [--rb-fg:#fff]",
  acid: "[--rb-bg:var(--rap-acid)] [--rb-fg:#282828]",
  blue: "[--rb-bg:var(--rap-blue)] [--rb-fg:#fff]",
} as const;

/** Circular running text with something in the middle — classic editorial stamp. */
export function RotatingBadge({ text, size = 140, duration = 14, center, color = "ink", className, style, ...rest }: RotatingBadgeProps) {
  const id = useId().replace(/:/g, "");
  return (
    <div
      data-slot="rotating-badge"
      data-color={color}
      className={cn(
        "group/rbadge relative inline-grid place-items-center rounded-full bg-(--rb-bg) text-(--rb-fg)",
        badgeColors[color],
        className,
      )}
      style={{ width: size, height: size, "--rap-rb-dur": `${duration}s`, ...style } as CSSProperties}
      role="img"
      aria-label={text}
      {...rest}
    >
      <svg
        data-slot="rotating-badge-ring"
        viewBox="0 0 100 100"
        aria-hidden
        className={cn(
          "absolute inset-0 size-full animate-[spin_var(--rap-rb-dur)_linear_infinite] transition-[animation-duration] duration-(--rap-dur)",
          /* hover spins it up to four times the speed */
          "group-hover/rbadge:[animation-duration:calc(var(--rap-rb-dur)/4)]",
          /* the running text, in user units of the 100-unit viewBox */
          "[&_text]:font-sans [&_text]:text-[9px] [&_text]:font-semibold [&_text]:uppercase [&_text]:fill-current",
        )}
      >
        <defs>
          <path id={`rb-${id}`} d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1 -76 0" />
        </defs>
        <text>
          <textPath href={`#rb-${id}`} textLength={238} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <div data-slot="rotating-badge-center" className="relative text-[2rem] leading-none">
        {center ?? <span className="inline-block animate-[spin_6s_linear_infinite_reverse]">✳</span>}
      </div>
    </div>
  );
}
