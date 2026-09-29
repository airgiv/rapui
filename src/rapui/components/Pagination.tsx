import { forwardRef, useImperativeHandle, useRef, type ComponentPropsWithoutRef, type HTMLAttributes } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "../icons";
import { cx } from "../utils";
import { Glider, useActiveElement, useActiveTap } from "./ProductTabs";
import "./Pagination.css";

type Size = "sm" | "md" | "lg";

/* Composable parts (shadcn-style) plus a ready-made <Paginator/>.

   Delight: the ink "you are here" pill is one object that crawls between page numbers
   like a caterpillar (useGlide via the navigation Glider): jump from 2 to 7 and it
   stretches across the row, then pulls its tail in. PaginationContent owns it and finds
   the link marked `isActive` (data-active) with a MutationObserver, so the composable
   parts glide too, with no new props. The page change is immediate; the ink follows.
   When the window of numbers shifts under a fixed middle slot the pill stays put —
   the numbers move, not the reader's place. Calm / reduced motion: a plain slide.
   Sound (opt-in via SoundProvider): a tap on page change, pitched up per slot. */

export const Pagination = forwardRef<HTMLElement, ComponentPropsWithoutRef<"nav"> & { size?: Size }>(function Pagination(
  { className, size = "md", ...rest },
  ref,
) {
  return <nav ref={ref} role="navigation" aria-label="Pagination" className={cx("rap-pager", `rap-pager--${size}`, className)} {...rest} />;
});

export const PaginationContent = forwardRef<HTMLUListElement, ComponentPropsWithoutRef<"ul">>(function PaginationContent(
  { className, children, ...rest },
  ref,
) {
  const list = useRef<HTMLUListElement>(null);
  useImperativeHandle(ref, () => list.current as HTMLUListElement);
  const active = useActiveElement(list, ".rap-pager__link[data-active]", ["data-active"]);
  useActiveTap(list, active, ".rap-pager__link:not(.rap-pager__step)");
  return (
    <ul ref={list} className={cx("rap-pager__list", className)} data-glide={active ? "" : undefined} {...rest}>
      <Glider as="li" container={list} target={active} className="rap-pager__glider" />
      {children}
    </ul>
  );
});

export const PaginationItem = forwardRef<HTMLLIElement, ComponentPropsWithoutRef<"li">>(function PaginationItem(
  { className, ...rest },
  ref,
) {
  return <li ref={ref} className={cx("rap-pager__item", className)} {...rest} />;
});

export interface PaginationLinkProps extends ComponentPropsWithoutRef<"a"> {
  isActive?: boolean;
  disabled?: boolean;
}

/** A round page number. Renders an <a>; give it `href` or `onClick`. */
export const PaginationLink = forwardRef<HTMLAnchorElement, PaginationLinkProps>(function PaginationLink(
  { className, isActive, disabled, onClick, onKeyDown, tabIndex, href, ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      href={href}
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled || undefined}
      data-active={isActive || undefined}
      tabIndex={disabled ? -1 : (tabIndex ?? 0)}
      role={href ? undefined : "button"}
      onClick={disabled ? (e) => e.preventDefault() : onClick}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        // an <a> without href is not keyboard-activatable by default
        if (!href && !disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      className={cx("rap-pager__link", className)}
      {...rest}
    />
  );
});

export const PaginationPrevious = forwardRef<HTMLAnchorElement, PaginationLinkProps & { label?: string }>(
  function PaginationPrevious({ className, label = "Previous", children, ...rest }, ref) {
    return (
      <PaginationLink ref={ref} aria-label="Go to previous page" className={cx("rap-pager__step", "rap-pager__step--prev", className)} {...rest}>
        <ChevronLeft aria-hidden />
        {children ?? (label ? <span>{label}</span> : null)}
      </PaginationLink>
    );
  },
);

export const PaginationNext = forwardRef<HTMLAnchorElement, PaginationLinkProps & { label?: string }>(function PaginationNext(
  { className, label = "Next", children, ...rest },
  ref,
) {
  return (
    <PaginationLink ref={ref} aria-label="Go to next page" className={cx("rap-pager__step", "rap-pager__step--next", className)} {...rest}>
      {children ?? (label ? <span>{label}</span> : null)}
      <ChevronRight aria-hidden />
    </PaginationLink>
  );
});

export function PaginationEllipsis({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span aria-hidden className={cx("rap-pager__ellipsis", className)} {...rest}>
      <MoreHorizontal />
    </span>
  );
}

/** Page numbers to show: first, last, current ± siblings; `null` marks a gap. Length stays constant. */
export function paginationRange(page: number, total: number, siblings = 1): (number | null)[] {
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  if (total <= siblings * 2 + 5) return range(1, total);
  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, total);
  const gapLeft = left > 3;
  const gapRight = right < total - 2;
  const edge = siblings * 2 + 3;
  if (!gapLeft && gapRight) return [...range(1, edge), null, total];
  if (gapLeft && !gapRight) return [1, null, ...range(total - edge + 1, total)];
  return [1, null, ...range(left, right), null, total];
}

export interface PaginatorProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  /** Current page, 1-based. */
  page: number;
  /** Number of pages. */
  total: number;
  onPageChange: (page: number) => void;
  /** Pages shown on each side of the current one. Default 1. */
  siblings?: number;
  size?: Size;
  /** Show "Previous"/"Next" text next to the chevrons. Default true. */
  labels?: boolean;
}

/** Convenience pager: renders prev/next and the right set of numbers with ellipses. */
export function Paginator({ page, total, onPageChange, siblings = 1, size = "md", labels = true, ...rest }: PaginatorProps) {
  const go = (n: number) => (e: { preventDefault(): void }) => {
    e.preventDefault();
    onPageChange(Math.min(total, Math.max(1, n)));
  };
  return (
    <Pagination size={size} {...rest}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={go(page - 1)} disabled={page <= 1} label={labels ? undefined : ""}
            className={labels ? undefined : "rap-pager__step--bare"}
          />
        </PaginationItem>
        {paginationRange(page, total, siblings).map((n, i) => (
          <PaginationItem key={n ?? `gap-${i}`}>
            {n == null ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink isActive={n === page} onClick={go(n)} aria-label={`Page ${n}`}>
                {n}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext onClick={go(page + 1)} disabled={page >= total} label={labels ? undefined : ""}
            className={labels ? undefined : "rap-pager__step--bare"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
