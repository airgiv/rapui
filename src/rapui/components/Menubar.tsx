import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { Menubar as MenubarPrimitive } from "radix-ui";
import { Check, ChevronRight } from "../icons";
import { cx } from "../utils";
import type { MenuItemExtras } from "./DropdownMenu";
import "./DropdownMenu.css";
import "./Menubar.css";

/* App menu bar: a pill track of menu triggers. <Menubar><MenubarMenu><MenubarTrigger/><MenubarContent>… */

export const Menubar = forwardRef<
  ElementRef<typeof MenubarPrimitive.Root>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Root> & { size?: "sm" | "md" | "lg" }
>(function Menubar({ className, size = "md", ...rest }, ref) {
  return <MenubarPrimitive.Root ref={ref} className={cx("rap-menubar", `rap-menubar--${size}`, className)} {...rest} />;
});

export const MenubarMenu = MenubarPrimitive.Menu;

export const MenubarTrigger = forwardRef<
  ElementRef<typeof MenubarPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(function MenubarTrigger({ className, ...rest }, ref) {
  return <MenubarPrimitive.Trigger ref={ref} className={cx("rap-menubar__trigger", className)} {...rest} />;
});
export const MenubarGroup = MenubarPrimitive.Group;
export const MenubarPortal = MenubarPrimitive.Portal;
export const MenubarSub = MenubarPrimitive.Sub;
export const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

export const MenubarContent = forwardRef<
  ElementRef<typeof MenubarPrimitive.Content>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(function MenubarContent({ className, sideOffset = 8, align = "start", alignOffset = -3, collisionPadding = 8, ...rest }, ref) {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className={cx("rap-pop", "rap-menu", "rap-menubar-menu", className)}
        {...rest}
      />
    </MenubarPrimitive.Portal>
  );
});


export const MenubarItem = forwardRef<
  ElementRef<typeof MenubarPrimitive.Item>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & MenuItemExtras
>(function MenubarItem({ className, inset, variant = "default", ...rest }, ref) {
  return (
    <MenubarPrimitive.Item
      ref={ref}
      className={cx("rap-menu-item", inset && "rap-menu-item--inset", variant === "danger" && "rap-menu-item--danger", className)}
      {...rest}
    />
  );
});

export const MenubarCheckboxItem = forwardRef<
  ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(function MenubarCheckboxItem({ className, children, ...rest }, ref) {
  return (
    <MenubarPrimitive.CheckboxItem ref={ref} className={cx("rap-menu-item", "rap-menu-item--inset", className)} {...rest}>
      <span className="rap-menu-indicator">
        <MenubarPrimitive.ItemIndicator>
          <Check strokeWidth={2.5} />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
});

export const MenubarRadioItem = forwardRef<
  ElementRef<typeof MenubarPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(function MenubarRadioItem({ className, children, ...rest }, ref) {
  return (
    <MenubarPrimitive.RadioItem ref={ref} className={cx("rap-menu-item", "rap-menu-item--inset", className)} {...rest}>
      <span className="rap-menu-indicator">
        <MenubarPrimitive.ItemIndicator>
          <span className="rap-menu-dot" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  );
});

export const MenubarLabel = forwardRef<
  ElementRef<typeof MenubarPrimitive.Label>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & { inset?: boolean }
>(function MenubarLabel({ className, inset, ...rest }, ref) {
  return <MenubarPrimitive.Label ref={ref} className={cx("rap-menu-label", inset && "rap-menu-label--inset", className)} {...rest} />;
});

export const MenubarSeparator = forwardRef<
  ElementRef<typeof MenubarPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(function MenubarSeparator({ className, ...rest }, ref) {
  return <MenubarPrimitive.Separator ref={ref} className={cx("rap-menu-separator", className)} {...rest} />;
});

export function MenubarShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("rap-menu-shortcut", className)} {...rest} />;
}

export const MenubarSubTrigger = forwardRef<
  ElementRef<typeof MenubarPrimitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & { inset?: boolean }
>(function MenubarSubTrigger({ className, inset, children, ...rest }, ref) {
  return (
    <MenubarPrimitive.SubTrigger
      ref={ref}
      className={cx("rap-menu-item", "rap-menu-subtrigger", inset && "rap-menu-item--inset", className)}
      {...rest}
    >
      {children}
      <ChevronRight className="rap-menu-chevron" aria-hidden />
    </MenubarPrimitive.SubTrigger>
  );
});

export const MenubarSubContent = forwardRef<
  ElementRef<typeof MenubarPrimitive.SubContent>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(function MenubarSubContent({ className, sideOffset = 6, alignOffset = -4, collisionPadding = 8, ...rest }, ref) {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.SubContent
        ref={ref}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className={cx("rap-pop", "rap-menu", className)}
        {...rest}
      />
    </MenubarPrimitive.Portal>
  );
});
