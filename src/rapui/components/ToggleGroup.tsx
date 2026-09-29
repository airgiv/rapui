import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./ToggleGroup.css";

/**
 * Segmented control (Radix ToggleGroup). `type="single"` for one choice,
 * `type="multiple"` for a set of toggles. Items sit 2px apart on a filled track.
 */
export const ToggleGroup = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Root>,
  ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & { size?: "sm" | "md" | "lg" }
>(function ToggleGroup({ className, size = "md", ...rest }, ref) {
  return <ToggleGroupPrimitive.Root ref={ref} className={cx("rap-tgroup", `rap-tgroup--${size}`, className)} {...rest} />;
});

export const ToggleGroupItem = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(function ToggleGroupItem({ className, ...rest }, ref) {
  return <ToggleGroupPrimitive.Item ref={ref} className={cx("rap-tgroup__item", className)} {...rest} />;
});
