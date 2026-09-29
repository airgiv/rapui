import type { CSSProperties, HTMLAttributes } from "react";
import { cx } from "../utils";
import "./Sticker.css";

export type StickerColor = "flame" | "acid" | "blue" | "plum" | "bubble" | "sky" | "ink" | "paper";

export interface StickerProps extends HTMLAttributes<HTMLSpanElement> {
  color?: StickerColor;
  shape?: "pill" | "circle" | "star" | "burst" | "tag";
  /** Resting rotation in degrees. */
  rotate?: number;
  /** Size of the sticker text (CSS length). */
  size?: string;
}

const STAR = "M50 0 61 35 98 35 68 57 79 91 50 70 21 91 32 57 2 35 39 35Z";
const BURST = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  const r = i % 2 ? 42 : 50;
  return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
}).join(" L");

/** Playful rotated label that wobbles on hover. */
export function Sticker({ color = "acid", shape = "pill", rotate = -6, size, className, style, children, ...rest }: StickerProps) {
  const vars = { "--rap-st-rot": `${rotate}deg`, fontSize: size } as CSSProperties;
  const svgShape = shape === "star" || shape === "burst";
  return (
    <span
      className={cx("rap-sticker", `rap-sticker--${color}`, `rap-sticker--${shape}`, className)}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {svgShape && (
        <svg className="rap-sticker__shape" viewBox="0 0 100 100" aria-hidden>
          <path d={shape === "star" ? STAR : `M${BURST}Z`} />
        </svg>
      )}
      <span className="rap-sticker__label">{children}</span>
    </span>
  );
}
