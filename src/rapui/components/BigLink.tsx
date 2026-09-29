import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";
import { Arrow } from "./Button";

export interface BigLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  /** Small caption on the right: count, year, tag. */
  meta?: ReactNode;
  size?: "lg" | "xl" | "xxl";
}

const sizes = {
  lg: "[--bl-fs:var(--rap-size-lg)]",
  xl: "[--bl-fs:var(--rap-size-xl)]",
  xxl: "[--bl-fs:var(--rap-size-xxl)]",
} as const;

/* The colour change is written on the parts, not only on the <a>: a page's
   own `a { color: inherit }` (unlayered) would otherwise beat the layered
   utility on the anchor itself. */
const ink = "text-ink transition-[color] duration-(--rap-dur) ease-rm group-hover/biglink:text-flame";

/**
 * Giant text link — the Readymag move: a headline-sized word that turns
 * orange on hover while an arrow slides in and the row shifts.
 */
export function BigLink({ children, meta, size = "xl", className, ...rest }: BigLinkProps) {
  return (
    <a
      data-slot="big-link"
      data-size={size}
      className={cn(
        "group/biglink relative flex items-baseline gap-[0.2em] py-[0.12em] border-b border-line no-underline",
        "font-display font-normal text-(length:--bl-fs) leading-none tracking-[-0.05em]",
        ink,
        "focus-visible:text-flame",
        sizes[size],
        className,
      )}
      {...rest}
    >
      {/* the arrow opens from nothing: zero width, tipped back 45° and at 40%,
          so it grows into the gap and the word is pushed along as it does */}
      <span
        data-slot="big-link-arrow"
        aria-hidden
        className={cn(
          "inline-grid place-items-center self-center w-0 overflow-hidden text-[0.7em] opacity-0 -rotate-45 scale-40",
          "transition-[width,opacity,rotate,scale] duration-(--rap-dur) ease-rm",
          "group-hover/biglink:w-[0.9em] group-hover/biglink:opacity-100 group-hover/biglink:rotate-0 group-hover/biglink:scale-100",
          "group-focus-visible/biglink:w-[0.9em] group-focus-visible/biglink:opacity-100 group-focus-visible/biglink:rotate-0 group-focus-visible/biglink:scale-100",
          ink,
          "group-focus-visible/biglink:text-flame",
        )}
      >
        <Arrow />
      </span>
      <span data-slot="big-link-text" className={cn(ink, "group-focus-visible/biglink:text-flame")}>
        {children}
      </span>
      {meta != null && (
        <span
          data-slot="big-link-meta"
          className={cn(
            "ml-auto self-center font-sans text-[0.875rem] font-medium tracking-[-0.01em]",
            ink,
            "text-mute",
          )}
        >
          {meta}
        </span>
      )}
    </a>
  );
}
