import type { CSSProperties, HTMLAttributes } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../utils";
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
   own colour (the `stroke-12` path below), which rounds every tip */
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

const stickerVariants = cva(
  [
    "relative inline-grid place-items-center font-display font-semibold text-[1rem] leading-none tracking-[-0.03em] whitespace-nowrap",
    "rounded-pill text-(--st-fg)",
    /* the tilt and the hover wobble live on `transform`, so the burst's and
       flower's slow turn (the separate `rotate` property) stacks with them */
    "[transform:rotate(var(--rap-st-rot))] transition-transform duration-(--rap-dur) ease-spring",
    "hover:[transform:rotate(calc(var(--rap-st-rot)*-1))_scale(1.08)]",
  ],
  {
    variants: {
      color: {
        acid: "[--st-bg:var(--rap-acid)] [--st-fg:#282828]",
        flame: "[--st-bg:var(--rap-flame)] [--st-fg:#fff]",
        plum: "[--st-bg:var(--rap-plum)] [--st-fg:#fff]",
        blue: "[--st-bg:var(--rap-blue)] [--st-fg:#fff]",
        bubble: "[--st-bg:var(--rap-bubble)] [--st-fg:#282828]",
        sky: "[--st-bg:var(--rap-sky)] [--st-fg:#282828]",
        ink: "[--st-bg:var(--rap-ink)] [--st-fg:var(--rap-paper)]",
        paper: "[--st-bg:var(--rap-paper-2)] [--st-fg:var(--rap-ink)] shadow-[inset_0_0_0_1.5px_var(--rap-line)]",
      },
      /* Optical centring. A line box centres the whole em (ascender to
         descender), so lowercase words sit visibly low inside a pill. Where
         `text-box` trims the label to cap height and baseline, pad
         symmetrically; elsewhere pad more at the bottom to lift the text. */
      pad: {
        pill: "pt-[0.4em] px-[0.95em] pb-[0.52em] supports-[text-box:trim-both_cap_alphabetic]:py-[0.5em]",
        tag: "pt-[0.4em] pr-[0.95em] pb-[0.52em] pl-[1.4em] supports-[text-box:trim-both_cap_alphabetic]:py-[0.5em]",
        circle: "p-[0.8em]",
        /* drawn shapes: the SVG is the background, the words sit well inside it */
        svg: "p-[1.6em]",
      },
      shape: {
        pill: "bg-(--st-bg)",
        circle: "bg-(--st-bg) aspect-square rounded-full text-center whitespace-normal",
        /* a luggage tag: squarer at the punched end, with the hole in paper */
        tag: [
          "bg-(--st-bg) rounded-[0.35em_1.2em_1.2em_0.35em]",
          "before:absolute before:left-[0.55em] before:top-1/2 before:-mt-[0.175em] before:size-[0.35em] before:rounded-full before:bg-paper before:content-['']",
        ],
        svg: "aspect-square whitespace-normal text-center leading-[1.05]",
      },
      /* Spinning shapes turn as one piece, words included, on `rotate`. */
      turn: { true: "fun:animate-[rap-sticker-turn_24s_linear_infinite]", false: "" },
    },
    defaultVariants: { color: "acid", pad: "pill", shape: "pill", turn: false },
  },
);

/** Playful rotated label that wobbles on hover. */
export function Sticker({ color = "acid", shape = "pill", rotate = -6, size, className, style, children, ...rest }: StickerProps) {
  const vars = { "--rap-st-rot": `${rotate}deg`, fontSize: size } as CSSProperties;
  const d = PATHS[shape];
  const kind = d ? "svg" : shape === "circle" ? "circle" : shape === "tag" ? "tag" : "pill";
  return (
    <span
      data-slot="sticker"
      data-color={color}
      data-shape={shape}
      className={cn(stickerVariants({ color, pad: kind, shape: kind, turn: shape === "burst" || shape === "flower" }), className)}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {d && (
        <svg data-slot="sticker-shape" className="absolute inset-0 size-full fill-(--st-bg) overflow-visible" viewBox="0 0 100 100" aria-hidden>
          <path d={d} className={shape === "star" ? "stroke-(--st-bg) stroke-12 [stroke-linejoin:round]" : undefined} />
        </svg>
      )}
      <span
        data-slot="sticker-label"
        className={cn(
          "relative supports-[text-box:trim-both_cap_alphabetic]:[text-box:trim-both_cap_alphabetic]",
          /* the heart's visual middle is above its box's: its lobes are the bulk */
          shape === "heart" && "-translate-y-[0.2em]",
        )}
      >
        {children}
      </span>
    </span>
  );
}
