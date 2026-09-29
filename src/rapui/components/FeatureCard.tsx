import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../utils";
import "./FeatureCard.css";

export interface FeatureCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  children?: ReactNode;
  /** Visual on top: an image, an emoji, an SVG, a video. */
  media?: ReactNode;
  tone?: "white" | "grey" | "ink" | "flame" | "blue" | "plum" | "acid";
}

/**
 * Airy white card with a big media slot, a short bold title and a tiny
 * caption — the Readymag feature-grid tile. Media gently zooms on hover.
 */
export function FeatureCard({ title, children, media, tone = "white", className, ...rest }: FeatureCardProps) {
  return (
    <div className={cx("rap-fcard", `rap-fcard--${tone}`, className)} {...rest}>
      {media != null && <div className="rap-fcard__media">{media}</div>}
      <div className="rap-fcard__body">
        <div className="rap-fcard__title">{title}</div>
        {children != null && <div className="rap-fcard__text">{children}</div>}
      </div>
    </div>
  );
}
