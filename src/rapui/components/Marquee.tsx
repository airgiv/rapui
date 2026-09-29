import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";
import "./Marquee.css";

export interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Seconds for one full loop. */
  duration?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  /** Gap between repeats (any CSS length). */
  gap?: string;
  /** Tilt the whole band, degrees. */
  rotate?: number;
  /** How many copies to render in the track. */
  repeat?: number;
}

/** Infinite ticker band. Put anything inside: words, stickers, images. */
export function Marquee({
  children,
  duration = 22,
  reverse = false,
  pauseOnHover = true,
  gap = "3rem",
  rotate = 0,
  repeat = 4,
  className,
  style,
  ...rest
}: MarqueeProps) {
  const vars = { "--rap-mq-dur": `${duration}s`, "--rap-mq-gap": gap, "--rap-mq-rot": `${rotate}deg` } as CSSProperties;
  return (
    <div
      data-slot="marquee"
      className={cn("group/marquee flex overflow-hidden gap-(--rap-mq-gap) rotate-(--rap-mq-rot) select-none", className)}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {/* two identical tracks side by side, each at least as wide as the band:
          when the first has slid fully out (-100% minus the gap, Marquee.css)
          the second sits exactly where the first began, so the loop has no seam.
          Under reduced motion the band still drifts, at 120s a loop — the text
          stays legible and the band still reads as a ticker. */}
      {[0, 1].map((track) => (
        <div
          key={track}
          data-slot="marquee-track"
          aria-hidden={track === 1 || undefined}
          className={cn(
            "flex flex-none items-center gap-(--rap-mq-gap) min-w-full",
            "animate-[rap-marquee_var(--rap-mq-dur)_linear_infinite] motion-reduce:[animation-duration:120s]",
            reverse && "[animation-direction:reverse]",
            pauseOnHover && "group-hover/marquee:[animation-play-state:paused]",
          )}
        >
          {Array.from({ length: repeat }, (_, i) => (
            <div key={i} data-slot="marquee-item" className="flex flex-none items-center gap-(--rap-mq-gap)">
              {children}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
