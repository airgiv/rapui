import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cx } from "../utils";
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
      className={cx("rap-marquee", reverse && "rap-marquee--reverse", pauseOnHover && "rap-marquee--pause", className)}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {[0, 1].map((track) => (
        <div className="rap-marquee__track" key={track} aria-hidden={track === 1 || undefined}>
          {Array.from({ length: repeat }, (_, i) => (
            <div className="rap-marquee__item" key={i}>
              {children}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
