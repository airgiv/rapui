import type { CSSProperties, HTMLAttributes } from "react";
import { cx } from "../utils";
import "./Sticker.css";

export type StickerColor = "flame" | "acid" | "blue" | "plum" | "bubble" | "sky" | "ink" | "paper";
export type StickerShape =
  | "pill"
  | "circle"
  | "tag"
  | "star"
  | "burst"
  | "flower"
  | "clover"
  | "blob"
  | "heart"
  | "squircle";

export interface StickerProps extends HTMLAttributes<HTMLSpanElement> {
  color?: StickerColor;
  shape?: StickerShape;
  /** Resting rotation in degrees. */
  rotate?: number;
  /** Size of the sticker text (CSS length). */
  size?: string;
}

/* ── shapes ────────────────────────────────────────────────
   Every outline is sampled from a smooth function, so there are
   no sharp points anywhere: lobes and petals come out round, the
   way Readymag's stickers are. All live in a 100×100 box around
   (50, 50). */

const polar = (r: (t: number) => number, n = 240) => {
  let d = "";
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    const k = r(t);
    d += `${i ? "L" : "M"}${(50 + k * Math.cos(t)).toFixed(2)} ${(50 + k * Math.sin(t)).toFixed(2)}`;
  }
  return d + "Z";
};

/* the star is a polygon drawn with a thick round-joined stroke of its
   own colour (see .rap-sticker__shape--stroke), which rounds every tip */
const STAR = (() => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const t = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 20 : 40;
    d += `${i ? "L" : "M"}${(50 + r * Math.cos(t)).toFixed(2)} ${(52 + r * Math.sin(t)).toFixed(2)}`;
  }
  return d + "Z";
})();

const HEART = (() => {
  let d = "";
  const n = 200;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    d += `${i ? "L" : "M"}${(50 + x * 2.75).toFixed(2)} ${(46 - y * 2.75).toFixed(2)}`;
  }
  return d + "Z";
})();

const PATHS: Partial<Record<StickerShape, string>> = {
  /* soft scallop: ten shallow rounded lobes, the "hot drop" badge */
  burst: polar((t) => 45 + 4 * Math.cos(10 * t)),
  flower: polar((t) => 34 + 14 * Math.cos(6 * t)),
  clover: polar((t) => 33 + 15 * Math.cos(4 * t)),
  blob: polar((t) => 44 + 3 * Math.sin(3 * t + 1) + 2.5 * Math.cos(5 * t) - 2 * Math.sin(2 * t)),
  squircle: polar((t) => 47 / Math.pow(Math.abs(Math.cos(t)) ** 4 + Math.abs(Math.sin(t)) ** 4, 1 / 4)),
  star: STAR,
  heart: HEART,
};

/** Playful rotated label that wobbles on hover. */
export function Sticker({ color = "acid", shape = "pill", rotate = -6, size, className, style, children, ...rest }: StickerProps) {
  const vars = { "--rap-st-rot": `${rotate}deg`, fontSize: size } as CSSProperties;
  const d = PATHS[shape];
  return (
    <span
      className={cx("rap-sticker", `rap-sticker--${color}`, `rap-sticker--${shape}`, d && "rap-sticker--svg", className)}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {d && (
        <svg className="rap-sticker__shape" viewBox="0 0 100 100" aria-hidden>
          <path d={d} className={shape === "star" ? "rap-sticker__shape--stroke" : undefined} />
        </svg>
      )}
      <span className="rap-sticker__label">{children}</span>
    </span>
  );
}
