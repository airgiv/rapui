import { forwardRef, useLayoutEffect, useRef, type AnimationEvent, type HTMLAttributes } from "react";
import { useReplay } from "../hooks/useReplay";
import { useSound } from "../sound";
import { cva } from "class-variance-authority";
import { cn } from "../utils";
import "./Badge.css";

/* ── Badge ─────────────────────────────────────────────────
   Delight: a badge is a tiny sign pinned to something, and when
   what it says changes (3 → 4 comments, Draft → Live) it HOPS —
   the shared `rap-hop` keyframe, 5px up and a 1px dip on landing —
   so the eye catches the update without a toast. The change is
   read from the rendered text, not from `children`, so it works
   for any content and never fires on the first render.

   A `live` badge's dot breathes: it swells a hair and lets a
   ring expand off it every 2.4s — slow enough to read as "on
   air", not "error". Both are switched off under calm and
   reduced motion (both sit behind the `fun:` variant).
   With a SoundProvider on, the hop comes with a soft tick (0.4). */

export type BadgeVariant = "neutral" | "ink" | "blue" | "flame" | "success" | "warning" | "danger" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  /** A small status dot before the label. */
  dot?: boolean;
  /** The dot breathes to say "this is live right now". Implies `dot`. */
  live?: boolean;
}

const badgeVariants = cva(
  [
    "inline-flex items-center gap-[0.4em] h-(--bd-h) px-[0.7em] rounded-pill bg-(--bd-bg) text-(--bd-ink)",
    "font-sans text-[0.8125rem] font-medium leading-none tracking-[-0.01em] whitespace-nowrap align-middle tabular-nums",
    "[--bd-bg:var(--rap-fill)] [--bd-ink:var(--rap-ink)] [--bd-dot:currentColor]",
  ],
  {
    variants: {
      variant: {
        neutral: "[--bd-dot:var(--rap-mute)]",
        ink: "[--bd-bg:var(--rap-ink)] [--bd-ink:var(--rap-paper)]",
        blue: "[--bd-bg:var(--rap-blue)] [--bd-ink:#ffffff]",
        flame: "[--bd-bg:var(--rap-flame)] [--bd-ink:#ffffff]",
        // semantic ones are tinted so a column of statuses stays calm
        success:
          "[--bd-bg:color-mix(in_srgb,var(--rap-success)_14%,transparent)] [--bd-ink:color-mix(in_srgb,var(--rap-success)_78%,var(--rap-ink))] [--bd-dot:var(--rap-success)]",
        warning:
          "[--bd-bg:color-mix(in_srgb,var(--rap-warning)_20%,transparent)] [--bd-ink:color-mix(in_srgb,var(--rap-warning)_55%,var(--rap-ink))] [--bd-dot:var(--rap-warning)]",
        danger:
          "[--bd-bg:color-mix(in_srgb,var(--rap-danger)_13%,transparent)] [--bd-ink:color-mix(in_srgb,var(--rap-danger)_82%,var(--rap-ink))] [--bd-dot:var(--rap-danger)]",
        outline: "[--bd-bg:transparent] shadow-[inset_0_0_0_1px_var(--rap-fill-strong)] [--bd-dot:var(--rap-mute)]",
      },
      size: {
        sm: "[--bd-h:22px] text-[0.75rem]/none px-[0.6em]",
        md: "[--bd-h:26px]",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

/** Small status pill. Text is optically centred on the cap height, not the line box. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", size = "md", dot = false, live = false, className, children, onAnimationEnd, ...rest },
  ref,
) {
  const label = useRef<HTMLSpanElement>(null);
  const last = useRef<string | null>(null);
  const hop = useReplay();
  const sound = useSound();

  // hop when the visible text (or the status colour) changes — never on mount
  useLayoutEffect(() => {
    const sig = `${variant}|${label.current?.textContent ?? ""}`;
    if (last.current !== null && last.current !== sig) {
      hop.play();
      sound.play("tick", { strength: 0.4 });
    }
    last.current = sig;
  });

  const ended = (e: AnimationEvent<HTMLSpanElement>) => {
    if (e.target === e.currentTarget) hop.done();
    onAnimationEnd?.(e);
  };

  return (
    <span
      ref={ref}
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), hop.cls("fun:animate-hop"), className)}
      onAnimationEnd={ended}
      {...rest}
    >
      {(dot || live) && (
        <span
          data-slot="badge-dot"
          aria-hidden
          className={cn(
            "relative flex-none size-1.5 rounded-full bg-(--bd-dot)",
            // delight: the live dot breathes (2.4s) and lets a ring expand off it — keyframes in Badge.css
            live && [
              "fun:animate-[rap-badge-breathe_2.4s_var(--rap-ease-in-out)_infinite]",
              "after:absolute after:inset-0 after:rounded-full after:bg-(--bd-dot) after:opacity-0",
              "fun:after:animate-[rap-badge-ring_2.4s_var(--rap-ease-out)_infinite]",
            ],
          )}
        />
      )}
      {/* fallback: the line box is taller below the baseline than above the caps, so nudge
          the label up a touch to sit in the optical middle; with text-box, trim to the caps */}
      <span
        ref={label}
        data-slot="badge-label"
        className="block -translate-y-[0.05em] supports-[text-box:trim-both_cap_alphabetic]:translate-none supports-[text-box:trim-both_cap_alphabetic]:[text-box:trim-both_cap_alphabetic]"
      >
        {children}
      </span>
    </span>
  );
});
