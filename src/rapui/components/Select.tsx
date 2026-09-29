import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "../icons";
import { cx } from "../utils";
import "./Select.css";

/* Composable, shadcn-style: <Select><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem/>… */

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { size?: "sm" | "md" | "lg" }
>(function SelectTrigger({ className, children, size = "md", ...rest }, ref) {
  return (
    <SelectPrimitive.Trigger ref={ref} className={cx("rap-select-trigger", `rap-select-trigger--${size}`, className)} {...rest}>
      <span className="rap-select-trigger__value">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="rap-select-trigger__icon" aria-hidden />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = "popper", sideOffset = 6, ...rest }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={sideOffset}
        className={cx("rap-pop", "rap-select-content", className)}
        {...rest}
      >
        <SelectPrimitive.Viewport className="rap-select-viewport">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef<ElementRef<typeof SelectPrimitive.Item>, ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  function SelectItem({ className, children, ...rest }, ref) {
    return (
      <SelectPrimitive.Item ref={ref} className={cx("rap-menu-item", "rap-select-item", className)} {...rest}>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className="rap-select-item__check">
          <Check size={16} strokeWidth={2.5} />
        </SelectPrimitive.ItemIndicator>
      </SelectPrimitive.Item>
    );
  },
);

export const SelectLabel = forwardRef<ElementRef<typeof SelectPrimitive.Label>, ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(
  function SelectLabel({ className, ...rest }, ref) {
    return <SelectPrimitive.Label ref={ref} className={cx("rap-menu-label", className)} {...rest} />;
  },
);

export const SelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator({ className, ...rest }, ref) {
  return <SelectPrimitive.Separator ref={ref} className={cx("rap-menu-separator", className)} {...rest} />;
});
