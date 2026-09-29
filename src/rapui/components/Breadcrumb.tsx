import { forwardRef, type ComponentPropsWithoutRef, type HTMLAttributes, type ReactNode } from "react";
import { Slot } from "radix-ui";
import { ChevronRight, MoreHorizontal } from "../icons";
import { cx } from "../utils";
import "./Breadcrumb.css";

/* Composable, shadcn-style:
   <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink/></BreadcrumbItem><BreadcrumbSeparator/>… */

export const Breadcrumb = forwardRef<HTMLElement, ComponentPropsWithoutRef<"nav"> & { size?: "sm" | "md" | "lg" }>(
  function Breadcrumb({ className, size = "md", ...rest }, ref) {
    return <nav ref={ref} aria-label="Breadcrumb" className={cx("rap-crumbs", `rap-crumbs--${size}`, className)} {...rest} />;
  },
);

export const BreadcrumbList = forwardRef<HTMLOListElement, ComponentPropsWithoutRef<"ol">>(function BreadcrumbList(
  { className, ...rest },
  ref,
) {
  return <ol ref={ref} className={cx("rap-crumbs__list", className)} {...rest} />;
});

export const BreadcrumbItem = forwardRef<HTMLLIElement, ComponentPropsWithoutRef<"li">>(function BreadcrumbItem(
  { className, ...rest },
  ref,
) {
  return <li ref={ref} className={cx("rap-crumbs__item", className)} {...rest} />;
});

export const BreadcrumbLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<"a"> & { asChild?: boolean }>(
  function BreadcrumbLink({ className, asChild, ...rest }, ref) {
    const Comp = asChild ? Slot.Root : "a";
    return <Comp ref={ref} className={cx("rap-crumbs__link", className)} {...rest} />;
  },
);

export const BreadcrumbPage = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<"span">>(function BreadcrumbPage(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} role="link" aria-disabled="true" aria-current="page" className={cx("rap-crumbs__page", className)} {...rest} />;
});

/** Chevron by default; pass `variant="slash"` or your own children. */
export function BreadcrumbSeparator({
  className,
  children,
  variant = "chevron",
  ...rest
}: HTMLAttributes<HTMLLIElement> & { variant?: "chevron" | "slash"; children?: ReactNode }) {
  return (
    <li role="presentation" aria-hidden className={cx("rap-crumbs__sep", `rap-crumbs__sep--${variant}`, className)} {...rest}>
      {children ?? (variant === "slash" ? "/" : <ChevronRight />)}
    </li>
  );
}

export function BreadcrumbEllipsis({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span role="presentation" aria-hidden className={cx("rap-crumbs__ellipsis", className)} {...rest}>
      <MoreHorizontal />
    </span>
  );
}
