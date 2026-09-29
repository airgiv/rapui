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
const displayVariants = cva("m-0 font-display font-medium tracking-[-0.02em] text-balance", {
  variants: {
    tight: { true: "tracking-[-0.045em]", false: "" },
    size: {
      mega: "text-display-mega leading-[0.86] font-[450] tracking-[-0.06em]",
      xxl: "text-display-xxl leading-[0.88]",
      xl: "text-display-xl leading-[0.92]",
      lg: "text-display-lg leading-none",
      md: "text-display-md leading-[1.1] tracking-[-0.02em]",
    },
  },
  defaultVariants: { size: "xl", tight: true },
});

export interface DisplayProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: DisplaySize;
  /** Tight, slightly condensed tracking for giant headlines. */
  tight?: boolean;
  children?: ReactNode;
}

/** Huge editorial headline set in the display face. */
export function Display({ as = "h2", size = "xl", tight = true, className, ...rest }: DisplayProps) {
  return createElement(as, {
    "data-slot": "display",
    "data-size": size,
    className: cn(displayVariants({ size, tight }), className),
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

/** Small label with a live dot. */
export function Eyebrow({ className, dot = true, children, ...rest }: HTMLAttributes<HTMLSpanElement> & { dot?: boolean }) {
  return (
    <span
      data-slot="eyebrow"
      className={cn("inline-flex items-center gap-[0.6em] text-[0.875rem] font-medium tracking-[-0.01em] text-ink", className)}
      {...rest}
    >
      {dot && (
        /* the live dot: a ring of accent breathes out of it every 2.2s (Typography.css) */
        <span
          data-slot="eyebrow-dot"
          aria-hidden
          className="size-[0.55em] rounded-full bg-accent shadow-[0_0_0_0_var(--rap-accent)] animate-[rap-eyebrow-pulse_2.2s_var(--rap-ease-out)_infinite]"
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
