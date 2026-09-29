import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { cx } from "../utils";
import "./Collapsible.css";

/* <Collapsible><CollapsibleTrigger>Title</CollapsibleTrigger><CollapsibleContent>…</CollapsibleContent></Collapsible> */

export const Collapsible = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Root>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>
>(function Collapsible({ className, ...rest }, ref) {
  return <CollapsiblePrimitive.Root ref={ref} className={cx("rap-collapsible", className)} {...rest} />;
});

export interface CollapsibleTriggerProps extends ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> {
  /** Append a chevron that turns when open. Default true; ignored with `asChild`. */
  chevron?: boolean;
  size?: "sm" | "md" | "lg";
}

/** A filled pill row by default. Use `asChild` to make any element the trigger. */
export const CollapsibleTrigger = forwardRef<ElementRef<typeof CollapsiblePrimitive.Trigger>, CollapsibleTriggerProps>(
  function CollapsibleTrigger({ className, children, chevron = true, size = "md", asChild, ...rest }, ref) {
    if (asChild)
      return (
        <CollapsiblePrimitive.Trigger ref={ref} asChild className={className} {...rest}>
          {children}
        </CollapsiblePrimitive.Trigger>
      );
    return (
      <CollapsiblePrimitive.Trigger
        ref={ref}
        className={cx("rap-collapsible__trigger", `rap-collapsible__trigger--${size}`, className)}
        {...rest}
      >
        <span className="rap-collapsible__label">{children}</span>
        {chevron && <ChevronDown className="rap-collapsible__chevron" aria-hidden />}
      </CollapsiblePrimitive.Trigger>
    );
  },
);

export const CollapsibleContent = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Content>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(function CollapsibleContent({ className, children, ...rest }, ref) {
  return (
    <CollapsiblePrimitive.Content ref={ref} className={cx("rap-collapsible__content", className)} {...rest}>
      {children}
    </CollapsiblePrimitive.Content>
  );
});
