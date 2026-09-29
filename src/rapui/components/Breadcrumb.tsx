import { forwardRef, type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode } from "react";
import { Slot } from "radix-ui";
import { ChevronRight, MoreHorizontal } from "../icons";
import { cn } from "../utils";

/* Composable, shadcn-style:
   <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink/></BreadcrumbItem><BreadcrumbSeparator/>…

   Delight: the separators are signposts. Point at (or tab to) a crumb and every chevron
   after it turns round to point back at it — "the way back is here" — one after the
   other, 45ms apart, like a row of dominoes, on a springy ease; slashes flip to lean the
   other way. Move off and they turn back. Pure CSS (sibling selectors — the long
   `[<item that holds the hovered/focused crumb>~…~&]` variants on BreadcrumbSeparator —
   so no props and no JS); the separators are aria-hidden, so nothing changes for
   assistive tech.
   Calm / reduced motion: the signposts stay put. */

export const Breadcrumb = forwardRef<HTMLElement, ComponentPropsWithoutRef<"nav"> & { size?: "sm" | "md" | "lg" }>(
  function Breadcrumb({ className, size = "md", ...rest }, ref) {
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        data-slot="breadcrumb"
        data-size={size}
        className={cn(
          "font-sans tracking-[-0.01em]",
          size === "sm" && "text-[0.8125rem]",
          size === "md" && "text-[0.9375rem]",
          size === "lg" && "text-[1.0625rem]",
          className,
        )}
        {...rest}
      />
    );
  },
);

export const BreadcrumbList = forwardRef<HTMLOListElement, ComponentPropsWithoutRef<"ol">>(function BreadcrumbList(
  { className, ...rest },
  ref,
) {
  return (
    <ol
      ref={ref}
      data-slot="breadcrumb-list"
      className={cn("flex flex-wrap items-center gap-[0.35rem] m-0 p-0 list-none text-mute", className)}
      {...rest}
    />
  );
});

export const BreadcrumbItem = forwardRef<HTMLLIElement, ComponentPropsWithoutRef<"li">>(function BreadcrumbItem(
  { className, ...rest },
  ref,
) {
  return <li ref={ref} data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-[0.35rem] min-w-0", className)} {...rest} />;
});

export const BreadcrumbLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<"a"> & { asChild?: boolean }>(
  function BreadcrumbLink({ className, asChild, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "a";
    return (
      <Comp
        ref={ref}
        data-slot="breadcrumb-link"
        className={cn(
          // negative margin: the hover/focus pill reaches past the text without moving it
          "inline-flex items-center gap-[0.35rem] -mx-[0.4rem] py-[0.2rem] px-[0.4rem] rounded-pill text-mute no-underline",
          "transition-[color,background-color] duration-(--rap-dur-fast) ease-rm hover:text-ink",
          "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)] [&_svg]:size-[1.05em]",
          className,
        )}
        {...rest}
      />
    );
  },
);

export const BreadcrumbPage = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function BreadcrumbPage(
  { className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      data-slot="breadcrumb-page"
      className={cn("inline-flex items-center gap-[0.35rem] text-ink font-medium [&_svg]:size-[1.05em]", className)}
      {...rest}
    />
  );
});

/** Chevron by default; pass `variant="slash"` or your own children. */
export function BreadcrumbSeparator({
  className,
  children,
  variant = "chevron",
  ...rest
}: HTMLAttributes<HTMLLIElement> & { variant?: "chevron" | "slash"; children?: ReactNode }) {
  return (
    <li
      role="presentation"
      aria-hidden
      data-slot="breadcrumb-separator"
      data-variant={variant}
      className={cn(
        "inline-flex items-center text-mute opacity-70 [&_svg]:size-[1em]",
        "*:inline-block *:[transition:rotate_420ms_var(--rap-ease-back),scale_420ms_var(--rap-ease-back)]",
        // signposts: separators after the crumb you point at turn to point back at it…
        variant === "chevron" && "fun:[[data-slot=breadcrumb-item]:has(:is([data-slot=breadcrumb-link],[data-slot=breadcrumb-ellipsis]):is(:hover,:focus-visible))~&]:*:rotate-180",
        variant === "slash" &&
          "opacity-50 px-[0.1rem] [transition:scale_420ms_var(--rap-ease-back)] fun:[[data-slot=breadcrumb-item]:has(:is([data-slot=breadcrumb-link],[data-slot=breadcrumb-ellipsis]):is(:hover,:focus-visible))~&]:[scale:-1_1]",
        // …one after the other, 45ms apart, like dominoes
        "[[data-slot=breadcrumb-item]:has(:is([data-slot=breadcrumb-link],[data-slot=breadcrumb-ellipsis]):is(:hover,:focus-visible))~[data-slot=breadcrumb-separator]~&]:delay-45 [[data-slot=breadcrumb-item]:has(:is([data-slot=breadcrumb-link],[data-slot=breadcrumb-ellipsis]):is(:hover,:focus-visible))~[data-slot=breadcrumb-separator]~&]:*:delay-45",
        "[[data-slot=breadcrumb-item]:has(:is([data-slot=breadcrumb-link],[data-slot=breadcrumb-ellipsis]):is(:hover,:focus-visible))~[data-slot=breadcrumb-separator]~[data-slot=breadcrumb-separator]~&]:delay-90 [[data-slot=breadcrumb-item]:has(:is([data-slot=breadcrumb-link],[data-slot=breadcrumb-ellipsis]):is(:hover,:focus-visible))~[data-slot=breadcrumb-separator]~[data-slot=breadcrumb-separator]~&]:*:delay-90",
        "[[data-slot=breadcrumb-item]:has(:is([data-slot=breadcrumb-link],[data-slot=breadcrumb-ellipsis]):is(:hover,:focus-visible))~[data-slot=breadcrumb-separator]~[data-slot=breadcrumb-separator]~[data-slot=breadcrumb-separator]~&]:delay-135 [[data-slot=breadcrumb-item]:has(:is([data-slot=breadcrumb-link],[data-slot=breadcrumb-ellipsis]):is(:hover,:focus-visible))~[data-slot=breadcrumb-separator]~[data-slot=breadcrumb-separator]~[data-slot=breadcrumb-separator]~&]:*:delay-135",
        "calm:transition-none calm:*:transition-none",
        className,
      )}
      {...rest}
    >
      {children ?? (variant === "slash" ? "/" : <ChevronRight />)}
    </li>
  );
}

export function BreadcrumbEllipsis({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="presentation"
      aria-hidden
      data-slot="breadcrumb-ellipsis"
      className={cn(
        "inline-grid place-items-center size-[1.75em] rounded-pill text-mute [&_svg]:size-[1.1em]",
        // clickable when it is a menu trigger (asChild)
        "[button&]:cursor-pointer data-state:cursor-pointer",
        className,
      )}
      {...rest}
    >
      <MoreHorizontal />
    </span>
  );
}
