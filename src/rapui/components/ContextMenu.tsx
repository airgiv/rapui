import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import { Check, ChevronRight } from "lucide-react";
import { cx } from "../utils";
import type { MenuItemExtras } from "./DropdownMenu";
import "./DropdownMenu.css";
import "./ContextMenu.css";

/* Right-click menu. Same parts as DropdownMenu: <ContextMenu><ContextMenuTrigger>area</ContextMenuTrigger><ContextMenuContent>… */

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;
export const ContextMenuPortal = ContextMenuPrimitive.Portal;
export const ContextMenuSub = ContextMenuPrimitive.Sub;
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

export const ContextMenuContent = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(function ContextMenuContent({ className, collisionPadding = 8, ...rest }, ref) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        ref={ref}
        collisionPadding={collisionPadding}
        className={cx("rap-pop", "rap-menu", "rap-context-menu", className)}
        {...rest}
      />
    </ContextMenuPrimitive.Portal>
  );
});


export const ContextMenuItem = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.Item>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & MenuItemExtras
>(function ContextMenuItem({ className, inset, variant = "default", ...rest }, ref) {
  return (
    <ContextMenuPrimitive.Item
      ref={ref}
      className={cx("rap-menu-item", inset && "rap-menu-item--inset", variant === "danger" && "rap-menu-item--danger", className)}
      {...rest}
    />
  );
});

export const ContextMenuCheckboxItem = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(function ContextMenuCheckboxItem({ className, children, ...rest }, ref) {
  return (
    <ContextMenuPrimitive.CheckboxItem ref={ref} className={cx("rap-menu-item", "rap-menu-item--inset", className)} {...rest}>
      <span className="rap-menu-indicator">
        <ContextMenuPrimitive.ItemIndicator>
          <Check strokeWidth={2.5} />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
});

export const ContextMenuRadioItem = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(function ContextMenuRadioItem({ className, children, ...rest }, ref) {
  return (
    <ContextMenuPrimitive.RadioItem ref={ref} className={cx("rap-menu-item", "rap-menu-item--inset", className)} {...rest}>
      <span className="rap-menu-indicator">
        <ContextMenuPrimitive.ItemIndicator>
          <span className="rap-menu-dot" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
});

export const ContextMenuLabel = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & { inset?: boolean }
>(function ContextMenuLabel({ className, inset, ...rest }, ref) {
  return <ContextMenuPrimitive.Label ref={ref} className={cx("rap-menu-label", inset && "rap-menu-label--inset", className)} {...rest} />;
});

export const ContextMenuSeparator = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(function ContextMenuSeparator({ className, ...rest }, ref) {
  return <ContextMenuPrimitive.Separator ref={ref} className={cx("rap-menu-separator", className)} {...rest} />;
});

export function ContextMenuShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("rap-menu-shortcut", className)} {...rest} />;
}

export const ContextMenuSubTrigger = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & { inset?: boolean }
>(function ContextMenuSubTrigger({ className, inset, children, ...rest }, ref) {
  return (
    <ContextMenuPrimitive.SubTrigger
      ref={ref}
      className={cx("rap-menu-item", "rap-menu-subtrigger", inset && "rap-menu-item--inset", className)}
      {...rest}
    >
      {children}
      <ChevronRight className="rap-menu-chevron" aria-hidden />
    </ContextMenuPrimitive.SubTrigger>
  );
});

export const ContextMenuSubContent = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.SubContent>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(function ContextMenuSubContent({ className, sideOffset = 6, alignOffset = -4, collisionPadding = 8, ...rest }, ref) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        ref={ref}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className={cx("rap-pop", "rap-menu", className)}
        {...rest}
      />
    </ContextMenuPrimitive.Portal>
  );
});
