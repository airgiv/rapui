import { createElement, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../utils";
import "./Typography.css";

type DisplaySize = "mega" | "xxl" | "xl" | "lg" | "md";

/* The sizes come after `tight` so their own tracking wins where they set
   one: mega is tighter still (-0.06em, and a lighter 450 weight, because
   at that size a 500 face reads bold), md relaxes back to -0.02em because
   at body-ish sizes tight tracking starts to clot. Line height shrinks as
   the size grows: giant lines need less air between them. */
/* (leading sits after the size in every variant: tailwind-merge lets a
   later `text-*` size drop an earlier `leading-*`) */
/* weight, tracking, case and leading are tokens, so a preset can retune them for its
   face (a serif wants less negative tracking than a grotesk, Plex a lighter weight,
   fun's Anton capitals and no negative tracking at all). Each falls back to the
   value the sizes always had, so a preset that leaves a token unset is unchanged. */
const displayVariants = cva(
  "m-0 font-display [font-weight:var(--rap-display-weight,500)] [text-transform:var(--rap-display-case,none)] tracking-[-0.02em] text-balance",
  {
    variants: {
      tight: { true: "tracking-[var(--rap-display-tracking,-0.045em)]", false: "" },
      size: {
        mega: "text-display-mega leading-[var(--rap-display-leading,0.86)] [font-weight:var(--rap-display-weight-mega,450)] tracking-[var(--rap-display-tracking-mega,-0.06em)]",
        xxl: "text-display-xxl leading-[var(--rap-display-leading,0.88)]",
        xl: "text-display-xl leading-[var(--rap-display-leading,0.92)]",
        lg: "text-display-lg leading-[var(--rap-display-leading,1)]",
        md: "text-display-md leading-[1.1] tracking-[var(--rap-display-tracking-md,-0.02em)]",
      },
    },
    defaultVariants: { size: "xl", tight: true },
  },
);

/* face="poster": the extra narrow grotesk (--rap-font-poster, Anton) in capitals. Its
   letters are narrower and its caps taller than the display face's, so each step is the
   display size times --rap-poster-scale (a poster line fills about the width a normal one
   would); one weight, so no faked bold; it is drawn tight already, so a hair of positive
   tracking; and capitals stack close, 0.88. Each class replaces the size's own weight,
   tracking, size and leading in tailwind-merge (the leading comes after the size). */
/* (each size spelled out in full: Tailwind only builds classes it can read in the source) */
const posterSize: Record<DisplaySize, string> = {
  mega: "text-[length:calc(var(--rap-size-mega)*var(--rap-poster-scale,1.25))]",
  xxl: "text-[length:calc(var(--rap-size-xxl)*var(--rap-poster-scale,1.25))]",
  xl: "text-[length:calc(var(--rap-size-xl)*var(--rap-poster-scale,1.25))]",
  lg: "text-[length:calc(var(--rap-size-lg)*var(--rap-poster-scale,1.25))]",
  md: "text-[length:calc(var(--rap-size-md)*var(--rap-poster-scale,1.25))]",
};
const poster = (size: DisplaySize) =>
  cn("font-poster [font-weight:400] [font-synthesis:none] [text-transform:uppercase] tracking-[0.005em]", posterSize[size], "leading-[0.88]");

export interface DisplayProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: DisplaySize;
  /** display: the preset's headline face. poster: the extra narrow grotesk (Anton) in capitals, scaled up to fill the line. */
  face?: "display" | "poster";
  /** Tight, slightly condensed tracking for giant headlines. */
  tight?: boolean;
  children?: ReactNode;
}

/** Huge editorial headline set in the display face. */
export function Display({ as = "h2", size = "xl", tight = true, face = "display", className, ...rest }: DisplayProps) {
  return createElement(as, {
    "data-slot": "display",
    "data-size": size,
    "data-face": face === "poster" ? "poster" : undefined,
    className: cn(displayVariants({ size, tight }), face === "poster" && poster(size), className),
    ...rest,
  });
}

export type AccentTone = "flame" | "blue" | "plum" | "mute";

const accentTones: Record<AccentTone, string> = {
  flame: "text-flame",
  blue: "text-blue",
  plum: "text-plum",
  mute: "text-mute",
};

/**
 * Same face, different colour — how rap/ui marks the word that matters.
 * `mute` gives a two-tone grey/ink headline.
 */
export function Accent({ className, tone = "flame", ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: AccentTone }) {
  return <span data-slot="accent" data-tone={tone} className={cn(accentTones[tone], className)} {...rest} />;
}

/** Small label with a live dot. Calm: the dot holds steady — a ring that breathes forever is a loop with no job. */
export function Eyebrow({ className, dot = true, children, ...rest }: HTMLAttributes<HTMLSpanElement> & { dot?: boolean }) {
  return (
    <span
      data-slot="eyebrow"
      className={cn("inline-flex items-center gap-[0.6em] text-[0.875rem] font-medium tracking-[-0.01em] text-ink", className)}
      {...rest}
    >
      {dot && (
        /* the live dot: a ring of accent breathes out of it every 2.2s (Typography.css), fun only */
        <span
          data-slot="eyebrow-dot"
          aria-hidden
          className="size-[0.55em] rounded-full bg-accent shadow-[0_0_0_0_var(--rap-accent)] fun:animate-[rap-eyebrow-pulse_2.2s_var(--rap-ease-out)_infinite]"
        />
      )}
      {children}
    </span>
  );
}

/** Airy lead paragraph. */
export function Lead({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="lead"
      className={cn("m-0 max-w-[32ch] text-display-md leading-[1.35] tracking-[-0.015em] text-ink-2", className)}
      {...rest}
    />
  );
}

type HighlightColor = "acid" | "flame" | "blue" | "plum" | "bubble" | "sky";

/* dark marker colours take white text; the light ones keep a fixed near-black
   (#282828, not --rap-ink) so the word stays legible on acid in dark mode too */
const highlightColors: Record<HighlightColor, string> = {
  acid: "[--rap-hl:var(--rap-acid)]",
  flame: "[--rap-hl:var(--rap-flame)] text-white",
  blue: "[--rap-hl:var(--rap-blue)] text-white",
  plum: "[--rap-hl:var(--rap-plum)] text-white",
  bubble: "[--rap-hl:var(--rap-bubble)]",
  sky: "[--rap-hl:var(--rap-sky)]",
};

/** Text with a hand-drawn-ish highlighter swipe behind it. */
export function Highlight({
  className,
  color = "acid",
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { color?: HighlightColor }) {
  return (
    <span
      data-slot="highlight"
      data-color={color}
      className={cn(
        /* the swipe: a 100° gradient with soft 2% ends reads as a marker
           stroke, not a box; 70% tall and sat low, so it covers the x-height
           and leaves the ascenders clear. `box-decoration-clone` redraws the
           ends on every line when the phrase wraps. */
        "bg-[linear-gradient(100deg,transparent_1%,var(--rap-hl)_3%,var(--rap-hl)_97%,transparent_99%)]",
        "bg-size-[100%_70%] bg-position-[0_70%] bg-no-repeat px-[0.15em] mx-[-0.05em] text-[#282828] box-decoration-clone",
        highlightColors[color],
        className,
      )}
      {...rest}
    />
  );
}
