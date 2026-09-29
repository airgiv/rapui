import {
  forwardRef,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
} from "react";
import { cva } from "class-variance-authority";
import { cn } from "../utils";
import { springEasing } from "./galleryKit";
import { stickerGeometry, tagHole, ticketTear, type ShapeKey } from "./stickerShapes";
import "./Sticker.css";

/* ══ Sticker ══════════════════════════════════════════════
   A piece of printed vinyl slapped onto the page.

   ── THE IDEA ────────────────────────────────────────────
   Stickers are cut, not styled: every outline is computed in
   the sticker's own pixels (stickerShapes.ts — the same ray-
   traced polygons as ShapeGallery), so a pill, a scalloped seal
   or a stamp's perforation stays crisp at any size and the
   die-cut border keeps one thickness all the way round. Because
   every shape of one box has the same points on the same rays,
   the outline MORPHS under the hand: the circle ruffles into a
   scallop, the "hot drop" burst puffs its lobes, the arch rounds
   into a capsule. Labels peel a corner instead.

   ── PAPER ───────────────────────────────────────────────
   Two soft drop shadows (1px contact + 3/8px lift: it lies ON
   the page, it doesn't float), a 1.5px rim of light along the
   top edge clipped inside the shape, an optional grain. `flat`
   drops all three for print-like stickers.

   ── MOTION (all behind `fun:`) ─────────────────────────
   Hover: the tilt flips and it swells 8% on the library's spring
   (the same `linear()` easing ShapeGallery samples, tune 55,
   ~700ms), carrying the morph with it so they overshoot as one.
   `slap`: lands from 1.55× with a 10° twist and a big blurred
   shadow that snaps in to the contact shadow — 560ms, the squash
   (0.95) at 45% is the thumb pressing it down. `spin`: 24s per
   turn, words included (or just the ring, for seals). Calm and
   reduced motion: every sticker holds still, fully drawn. */

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
  | "squircle"
  | "seal"
  | "ticket"
  | "bubble"
  | "arch"
  | "stamp"
  | "label";
export type StickerHover = "wobble" | "peel" | "none";

export interface StickerProps extends HTMLAttributes<HTMLSpanElement> {
  color?: StickerColor;
  shape?: StickerShape;
  /** Resting rotation in degrees. */
  rotate?: number;
  /** Size of the sticker text (CSS length). */
  size?: string;
  /** What the hand does: flip the tilt and swell ("wobble"), lift a corner ("peel"), or nothing. Default: "peel" for `label`, else "wobble". */
  hover?: StickerHover;
  /** Outline to morph into under the hand. `true` picks the shape's partner (circle → scallop, burst → puffed…). Default true. */
  morph?: boolean | StickerShape;
  /** The classic vinyl sticker: a white die-cut border around the shape. */
  diecut?: boolean;
  /** Paper grain over the print. */
  grain?: boolean;
  /** No shadow, no rim of light — flat print. */
  flat?: boolean;
  /** Running text round the edge (round shapes: seal, circle, burst…). */
  ring?: string;
  /** Slow turn: `true` turns the whole sticker, words included; `"ring"` turns the shape and its ring text, the middle stays upright. Default: on for burst and flower, "ring" for a seal with ring text. */
  spin?: boolean | "ring";
  /** Slapped onto the page when it mounts. A number waits that many ms first (stagger a pile). */
  slap?: boolean | number;
  /** A small dot before the words, like a "live" pill. */
  dot?: boolean;
  /** The price tag's string. Default true for `tag`. */
  string?: boolean;
}

const ROUND = new Set<StickerShape>(["circle", "burst", "flower", "clover", "blob", "heart", "squircle", "star", "seal"]);

/* the shape each one turns into under the hand */
const PARTNER: Partial<Record<StickerShape, ShapeKey>> = {
  circle: "scallop",
  seal: "seal-puff",
  burst: "burst-puff",
  flower: "circle",
  clover: "circle",
  blob: "circle",
  squircle: "circle",
  star: "star-puff",
  arch: "capsule",
};

/* how far in the ring text runs, as a share of the half-size */
const RING: Partial<Record<StickerShape, number>> = {
  circle: 0.8,
  seal: 0.73,
  burst: 0.7,
  squircle: 0.8,
  blob: 0.72,
  clover: 0.58,
  flower: 0.56,
  star: 0.44,
  heart: 0.5,
};

const EASE = springEasing(55);

const stickerVariants = cva(
  [
    "group/st relative inline-grid place-items-center font-display font-semibold text-[1rem] leading-none tracking-[-0.03em] whitespace-nowrap",
    "text-(--st-fg) [-webkit-tap-highlight-color:transparent]",
    /* paper: a contact shadow and a soft lift, stronger on the dark page */
    "[--st-shadow:drop-shadow(0_1px_0.5px_rgb(0_0_0/0.14))_drop-shadow(0_3px_7px_rgb(0_0_0/0.11))]",
    "dark:[--st-shadow:drop-shadow(0_1px_0.5px_rgb(0_0_0/0.5))_drop-shadow(0_4px_9px_rgb(0_0_0/0.45))]",
    /* the tilt lives on `transform`; the slap uses the individual scale/rotate/translate so they stack */
    "[transform:rotate(var(--rap-st-rot))] [transition:transform_var(--st-dur)_var(--st-ease)]",
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
        paper: "[--st-bg:var(--rap-paper-2)] [--st-fg:var(--rap-ink)] [--st-edge:var(--rap-line)]",
      },
      /* Optical centring. A line box centres the whole em (ascender to
         descender), so lowercase words sit visibly low. Where `text-box`
         trims the label to cap height and baseline, pad symmetrically;
         elsewhere pad more at the bottom to lift the text. Asymmetric sides
         leave room for the tag's hole, the ticket's stub, the bubble's tail. */
      pad: {
        pill: "pt-[0.4em] px-[0.95em] pb-[0.52em] supports-[text-box:trim-both_cap_alphabetic]:py-[0.5em]",
        label: "pt-[0.55em] pl-[1em] pr-[1.25em] pb-[0.67em] supports-[text-box:trim-both_cap_alphabetic]:py-[0.62em]",
        tag: "pt-[0.4em] pr-[0.95em] pb-[0.52em] pl-[1.6em] supports-[text-box:trim-both_cap_alphabetic]:py-[0.5em]",
        ticket: "pt-[0.6em] pl-[1.15em] pr-[2.55em] pb-[0.72em] supports-[text-box:trim-both_cap_alphabetic]:py-[0.66em]",
        stamp: "pt-[0.95em] px-[1.1em] pb-[1.07em] supports-[text-box:trim-both_cap_alphabetic]:py-[1em]",
        /* 0.62em of the bottom is the tail (stickerShapes tailOf) */
        bubble: "pt-[0.5em] px-[1em] pb-[1.24em] supports-[text-box:trim-both_cap_alphabetic]:pt-[0.55em] supports-[text-box:trim-both_cap_alphabetic]:pb-[1.17em]",
        /* the arch's middle is low: the round top is mostly air */
        arch: "aspect-[4/5] px-[0.9em] pt-[1.45em] pb-[0.95em] whitespace-normal text-center leading-[1.05]",
        round: "aspect-square p-[1.6em] whitespace-normal text-center leading-[1.05]",
        ring: "aspect-square p-[2.6em] whitespace-normal text-center leading-[1.05]",
      },
      hover: {
        wobble: "fun:hover:[transform:rotate(calc(var(--rap-st-rot)*-1))_scale(1.08)]",
        /* a peel keeps its angle and just lifts a little off the page */
        peel: "fun:hover:[transform:rotate(var(--rap-st-rot))_scale(1.03)]",
        none: "",
      },
      slap: { true: "fun:animate-[rap-sticker-slap_560ms_var(--rap-ease-out)_var(--st-delay)_both]", false: "" },
    },
    defaultVariants: { color: "acid", pad: "pill", hover: "wobble", slap: false },
  },
);

const TURN = "fun:animate-[rap-sticker-turn_24s_linear_infinite]";
/* every outline path: its `d` comes from CSS so it can be interpolated (Chromium, Firefox);
   Safari keeps the `d` attribute and simply doesn't morph */
const MORPH = "[d:var(--st-d0)] fun:group-hover/st:[d:var(--st-d1)] [transition:d_var(--st-dur)_var(--st-ease)]";
const FLAP = "[d:var(--st-f0)] fun:group-hover/st:[d:var(--st-f1)] [transition:d_var(--st-dur)_var(--st-ease)]";

type Box = { w: number; h: number; em: number };

/* the sticker's layout size (transforms don't change it) and its font size */
function useBox(ref: React.RefObject<HTMLSpanElement | null>) {
  const [box, setBox] = useState<Box | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const em = Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10 || 16;
      setBox((p) => (p && p.w === w && p.h === h && p.em === em ? p : { w, h, em }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}

function setRefs<T>(el: T | null, ...refs: (ForwardedRef<T | null> | undefined)[]) {
  for (const r of refs) {
    if (typeof r === "function") r(el);
    else if (r) r.current = el;
  }
}

/** Printed vinyl sticker: crisp cut shapes, a paper finish, and a wobble, morph or peel under the hand. */
export const Sticker = forwardRef<HTMLSpanElement, StickerProps>(function Sticker(
  {
    color = "acid",
    shape = "pill",
    rotate = -6,
    size,
    hover,
    morph = true,
    diecut = false,
    grain = false,
    flat = false,
    ring,
    spin,
    slap = false,
    dot = false,
    string: withString,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const own = useRef<HTMLSpanElement>(null);
  const box = useBox(own);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const round = ROUND.has(shape);
  const hasRing = !!ring && round;
  const how: StickerHover = hover ?? (shape === "label" ? "peel" : "wobble");
  const turn = spin ?? (shape === "burst" || shape === "flower" ? true : shape === "seal" && hasRing ? "ring" : false);
  const showString = shape === "tag" && withString !== false;

  const target: ShapeKey | null =
    how !== "wobble" || morph === false ? null : morph === true ? (PARTNER[shape] ?? null) : morph === shape ? null : morph;

  const geo =
    box &&
    stickerGeometry(shape, box.w, box.h, box.em, {
      morph: target,
      peel: how === "peel" ? [shape === "label" ? 0.5 * box.em : 0, 1.35 * box.em] : shape === "label" ? [0.5 * box.em, 0.5 * box.em] : null,
    });

  const pad = hasRing ? "ring" : round ? "round" : shape;
  const vars = {
    "--rap-st-rot": `${rotate}deg`,
    "--st-ease": EASE.easing,
    "--st-dur": `${EASE.ms}ms`,
    "--st-delay": `${typeof slap === "number" ? slap : 0}ms`,
    ...(geo && {
      "--st-d0": `path("${geo.d0}")`,
      "--st-d1": `path("${geo.d1}")`,
      ...(geo.flap0 && { "--st-f0": `path("${geo.flap0}")`, "--st-f1": `path("${geo.flap1}")` }),
    }),
    fontSize: size,
  } as CSSProperties;

  const id = (s: string) => `st-${uid}-${s}`;
  const m = box ? Math.min(box.w, box.h) / 2 : 0;
  const ringR = m * (RING[shape] ?? 0.7);
  const ringFs = m * 0.14;
  /* repeat the ring text until it goes round once at about its natural spacing
     (a Onest semibold character is ~0.58em wide), then fit it exactly */
  const ringText = ring ? ring.repeat(Math.max(1, Math.round((2 * Math.PI * ringR) / (ring.length * 0.58 * ringFs || 1)))) : "";
  const hole = box && shape === "tag" ? tagHole(box.h, box.em) : null;

  return (
    <span
      ref={(el) => setRefs(el, own, ref)}
      data-slot="sticker"
      data-color={color}
      data-shape={shape}
      data-hover={how}
      className={cn(
        stickerVariants({ color, pad: pad as "pill", hover: how, slap: slap !== false }),
        shape === "heart" && "pt-[1.3em] pb-[1.9em]",
        className,
      )}
      style={{ ...vars, ...style }}
      {...rest}
    >
      {geo && box && (
        <span
          data-slot="sticker-art"
          aria-hidden
          className={cn(
            "absolute inset-0 pointer-events-none",
            !flat && "[filter:var(--st-shadow)]",
            !flat && slap !== false && "fun:animate-[rap-sticker-slap-shadow_560ms_var(--rap-ease-out)_var(--st-delay)_both]",
          )}
        >
          <svg
            data-slot="sticker-shape"
            viewBox={`0 0 ${box.w} ${box.h}`}
            className={cn("absolute inset-0 size-full overflow-visible", turn && TURN)}
          >
            <defs>
              <clipPath id={id("clip")}>
                <path d={geo.d0} className={MORPH} clipRule="evenodd" />
              </clipPath>
              {!flat && (
                <linearGradient id={id("rim")} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
                  <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.75" stopColor="#000" stopOpacity="0" />
                  <stop offset="1" stopColor="#000" stopOpacity="0.14" />
                </linearGradient>
              )}
              {!flat && (
                <linearGradient id={id("sheen")} x1="0" y1="0" x2="0.35" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
                  <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              )}
              {grain && (
                <filter id={id("grain")} filterUnits="userSpaceOnUse" x="0" y="0" width={box.w} height={box.h}>
                  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
              )}
              {geo.flap0 && (
                <filter id={id("lift")} x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="-1" dy="1.5" stdDeviation="1.4" floodOpacity="0.28" />
                </filter>
              )}
              {hasRing && (
                <path id={id("ring")} d={`M${box.w / 2} ${box.h / 2 - ringR}a${ringR} ${ringR} 0 1 1 0 ${2 * ringR}a${ringR} ${ringR} 0 1 1 0 ${-2 * ringR}`} />
              )}
            </defs>

            {/* the string's far strand runs behind the tag, out of the hole */}
            {showString && hole && <TagString hole={hole} em={box.em} part="back" />}

            {/* the print, with the die-cut border painted under it */}
            <path
              data-slot="sticker-body"
              d={geo.d0}
              fillRule="evenodd"
              className={cn(
                MORPH,
                "fill-(--st-bg)",
                diecut && "stroke-white [stroke-width:0.62em] [stroke-linejoin:round] [paint-order:stroke]",
                !diecut && color === "paper" && "stroke-(--st-edge) stroke-[1.5] [paint-order:stroke]",
              )}
            />

            {(!flat || grain) && (
              <g clipPath={`url(#${id("clip")})`}>
                {!flat && (
                  <path d={geo.d0} fill={`url(#${id("sheen")})`} stroke={`url(#${id("rim")})`} strokeWidth="3" fillRule="evenodd" className={MORPH} />
                )}
                {grain && <rect width={box.w} height={box.h} filter={`url(#${id("grain")})`} className="opacity-[0.22] mix-blend-multiply" />}
              </g>
            )}

            {/* printed details */}
            {hole && (
              <circle cx={hole.cx} cy={hole.cy} r={hole.r + 1.6} fill="none" className="stroke-(--st-fg) opacity-25" strokeWidth="1.2" />
            )}
            {shape === "ticket" && (
              <line
                x1={ticketTear(box.w, box.em)}
                x2={ticketTear(box.w, box.em)}
                y1={0.26 * box.em + 5}
                y2={box.h - 0.26 * box.em - 5}
                className="stroke-(--st-fg) opacity-45"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="0.1 4.2"
              />
            )}
            {shape === "stamp" && (
              <rect
                x={0.45 * box.em}
                y={0.45 * box.em}
                width={box.w - 0.9 * box.em}
                height={box.h - 0.9 * box.em}
                rx="2"
                fill="none"
                className="stroke-(--st-fg) opacity-35"
                strokeWidth="1.2"
              />
            )}
            {hasRing && (
              <g className="fill-(--st-fg)">
                <circle cx={box.w / 2} cy={box.h / 2} r={ringR + ringFs * 0.95} fill="none" className="stroke-(--st-fg) opacity-30" strokeWidth="1" />
                <circle cx={box.w / 2} cy={box.h / 2} r={ringR - ringFs * 0.95} fill="none" className="stroke-(--st-fg) opacity-30" strokeWidth="1" />
                <text
                  className="font-sans font-semibold tracking-[0.02em]"
                  style={{ fontSize: ringFs }}
                  dominantBaseline="central"
                >
                  <textPath href={`#${id("ring")}`} textLength={2 * Math.PI * ringR * 0.985} lengthAdjust="spacing">
                    {ringText}
                  </textPath>
                </text>
              </g>
            )}

            {/* the folded-back corner shows the sticker's pale back */}
            {geo.flap0 && (
              <path
                data-slot="sticker-flap"
                d={geo.flap0}
                filter={`url(#${id("lift")})`}
                className={cn(FLAP, "fill-[color-mix(in_oklab,var(--st-bg)_18%,#fff)]", diecut && "fill-white")}
              />
            )}

            {showString && hole && <TagString hole={hole} em={box.em} part="front" />}
          </svg>
        </span>
      )}
      <span
        data-slot="sticker-label"
        className={cn(
          "relative supports-[text-box:trim-both_cap_alphabetic]:[text-box:trim-both_cap_alphabetic]",
          turn === true && TURN,
        )}
      >
        {dot && (
          <span
            data-slot="sticker-dot"
            aria-hidden
            className="inline-block size-[0.42em] mr-[0.38em] align-[0.1em] rounded-full bg-current fun:animate-[rap-sticker-dot_1.6s_ease-in-out_infinite]"
          />
        )}
        {children}
      </span>
      {hasRing && <span className="sr-only">{ring}</span>}
    </span>
  );
});

/* A bit of string through the tag's hole: one strand over the front, one
   behind, knotted just past the tip, and a loose end curling off. */
function TagString({ hole, em, part }: { hole: { cx: number; cy: number }; em: number; part: "front" | "back" }) {
  const { cx, cy } = hole;
  const kx = -0.75 * em;
  const ky = cy - 1.05 * em;
  const d =
    part === "front"
      ? `M${cx} ${cy}C${cx - 0.3 * em} ${cy - 0.5 * em} ${-0.05 * em} ${ky + 0.3 * em} ${kx} ${ky}` +
        `C${kx - 0.45 * em} ${ky - 0.35 * em} ${kx - 0.95 * em} ${ky + 0.05 * em} ${kx - 0.85 * em} ${ky + 0.8 * em}`
      : `M${cx} ${cy}C${cx - 0.25 * em} ${cy + 0.45 * em} ${-0.4 * em} ${cy + 0.15 * em} ${kx} ${ky}`;
  return (
    <path
      data-slot={`sticker-string-${part}`}
      d={d}
      fill="none"
      strokeWidth="1.3"
      strokeLinecap="round"
      className={cn("stroke-ink", part === "front" ? "opacity-60" : "opacity-35")}
    />
  );
}
