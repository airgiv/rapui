import type { HTMLAttributes, ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../utils";

export interface FeatureCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  children?: ReactNode;
  /** Visual on top: an image, an emoji, an SVG, a video. */
  media?: ReactNode;
  tone?: "white" | "grey" | "ink" | "flame" | "blue" | "plum" | "acid";
}

/* each tone sets the card, its ink and the media well; on the saturated
   tones the well is a translucent white so the card's colour shows through */
const cardVariants = cva(
  [
    "group/fcard flex flex-col gap-[1.1rem] pt-[0.6rem] px-[0.6rem] pb-[1.4rem] rounded-card bg-(--fc-bg) text-(--fc-fg)",
    "transition-transform duration-(--rap-dur) ease-rm hover:-translate-y-1",
  ],
  {
    variants: {
      tone: {
        white: "[--fc-bg:var(--rap-paper-2)] [--fc-fg:var(--rap-ink)] [--fc-media:var(--rap-paper)]",
        grey: "[--fc-bg:var(--rap-paper-3)] [--fc-fg:var(--rap-ink)] [--fc-media:var(--rap-paper-2)]",
        ink: "[--fc-bg:var(--rap-ink)] [--fc-fg:var(--rap-paper)] [--fc-media:color-mix(in_srgb,var(--rap-paper)_10%,var(--rap-ink))]",
        flame: "[--fc-bg:var(--rap-flame)] [--fc-fg:#fff] [--fc-media:rgb(255_255_255/0.14)]",
        blue: "[--fc-bg:var(--rap-blue)] [--fc-fg:#fff] [--fc-media:rgb(255_255_255/0.14)]",
        plum: "[--fc-bg:var(--rap-plum)] [--fc-fg:#fff] [--fc-media:rgb(255_255_255/0.14)]",
        acid: "[--fc-bg:var(--rap-acid)] [--fc-fg:#282828] [--fc-media:rgb(255_255_255/0.4)]",
      },
    },
    defaultVariants: { tone: "white" },
  },
);

/**
 * Airy white card with a big media slot, a short bold title and a tiny
 * caption — a feature-grid tile. Media gently zooms on hover.
 */
export function FeatureCard({ title, children, media, tone = "white", className, ...rest }: FeatureCardProps) {
  return (
    <div data-slot="feature-card" data-tone={tone} className={cn(cardVariants({ tone }), className)} {...rest}>
      {media != null && (
        <div
          data-slot="feature-card-media"
          /* inner radius = card radius less the 0.6rem inset, so the corners run parallel */
          className={cn(
            "grid place-items-center aspect-[4/3] overflow-hidden rounded-[calc(var(--rap-radius)-0.6rem)] bg-(--fc-media)",
            "*:transition-transform *:duration-(--rap-dur-slow) *:ease-rm group-hover/fcard:*:scale-106",
            "[&_img]:size-full [&_img]:object-cover [&_video]:size-full [&_video]:object-cover",
          )}
        >
          {media}
        </div>
      )}
      <div data-slot="feature-card-body" className="flex flex-col gap-[0.35rem] px-[0.8rem]">
        <div data-slot="feature-card-title" className="font-semibold text-[1rem] tracking-[-0.02em]">
          {title}
        </div>
        {children != null && (
          <div
            data-slot="feature-card-text"
            /* a caption, so it recedes — a little less on the saturated tones */
            className={cn(
              "text-[0.8125rem] leading-[1.4] opacity-60 max-w-[34ch]",
              (tone === "flame" || tone === "blue" || tone === "plum") && "opacity-80",
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
