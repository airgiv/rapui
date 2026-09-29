import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import { Check } from "../icons";
import { cn } from "../utils";
import { useMergedRef } from "./Dialog";
import {
  MenuChevron,
  MenuDot,
  MenuIndicator,
  menuContentClass,
  menuItemClass,
  menuLabelClass,
  menuSeparatorClass,
  useRowGlide,
  type MenuItemExtras,
} from "./DropdownMenu";

/* Right-click menu. Same parts as DropdownMenu: <ContextMenu><ContextMenuTrigger>area</ContextMenuTrigger><ContextMenuContent>…

   Delight: the same as DropdownMenu (see useRowGlide there) — rows are dealt
   onto the panel as it opens at the pointer, and ONE highlight glides between
   rows like a caterpillar instead of each row lighting up. Sound: pop on open,
   a soft detent per row, tick on choose. */

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;
export const ContextMenuPortal = ContextMenuPrimitive.Portal;
export const ContextMenuSub = ContextMenuPrimitive.Sub;
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

export const ContextMenuContent = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(function ContextMenuContent({ className, collisionPadding = 8, children, ...rest }, ref) {
  const { attach, glider } = useRowGlide({ pop: 0.7 });
  const setRef = useMergedRef(ref, attach);
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        ref={setRef}
        collisionPadding={collisionPadding}
        data-slot="context-menu-content"
        className={cn(menuContentClass, "max-h-[var(--radix-context-menu-content-available-height,none)]", className)}
        {...rest}
      >
        {glider}
        {children}
      </ContextMenuPrimitive.Content>
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
      data-slot="context-menu-item"
      data-inset={inset ? "" : undefined}
      data-variant={variant}
      className={cn(menuItemClass, className)}
      {...rest}
    />
  );
});

export const ContextMenuCheckboxItem = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(function ContextMenuCheckboxItem({ className, children, ...rest }, ref) {
  return (
    <ContextMenuPrimitive.CheckboxItem ref={ref} data-slot="context-menu-checkbox-item" data-inset="" className={cn(menuItemClass, className)} {...rest}>
      <MenuIndicator>
        <ContextMenuPrimitive.ItemIndicator>
          <Check strokeWidth={2.5} />
        </ContextMenuPrimitive.ItemIndicator>
      </MenuIndicator>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
});

export const ContextMenuRadioItem = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(function ContextMenuRadioItem({ className, children, ...rest }, ref) {
  return (
    <ContextMenuPrimitive.RadioItem ref={ref} data-slot="context-menu-radio-item" data-inset="" className={cn(menuItemClass, className)} {...rest}>
      <MenuIndicator>
        <ContextMenuPrimitive.ItemIndicator>
          <MenuDot />
        </ContextMenuPrimitive.ItemIndicator>
      </MenuIndicator>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
});

export const ContextMenuLabel = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & { inset?: boolean }
>(function ContextMenuLabel({ className, inset, ...rest }, ref) {
  return (
    <ContextMenuPrimitive.Label
      ref={ref}
      data-slot="context-menu-label"
      data-inset={inset ? "" : undefined}
      className={cn(menuLabelClass, className)}
      {...rest}
    />
  );
});

export const ContextMenuSeparator = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(function ContextMenuSeparator({ className, ...rest }, ref) {
  return <ContextMenuPrimitive.Separator ref={ref} data-slot="context-menu-separator" className={cn(menuSeparatorClass, className)} {...rest} />;
});

export function ContextMenuShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="context-menu-shortcut" className={cn("menu-shortcut", className)} {...rest} />;
}

export const ContextMenuSubTrigger = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & { inset?: boolean }
>(function ContextMenuSubTrigger({ className, inset, children, ...rest }, ref) {
  return (
    <ContextMenuPrimitive.SubTrigger
      ref={ref}
      data-slot="context-menu-sub-trigger"
      data-inset={inset ? "" : undefined}
      className={cn(menuItemClass, className)}
      {...rest}
    >
      {children}
      <MenuChevron />
    </ContextMenuPrimitive.SubTrigger>
  );
});

export const ContextMenuSubContent = forwardRef<
  ElementRef<typeof ContextMenuPrimitive.SubContent>,
  ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(function ContextMenuSubContent({ className, sideOffset = 6, alignOffset = -4, collisionPadding = 8, children, ...rest }, ref) {
  const { attach, glider } = useRowGlide({ pop: 0.5 });
  const setRef = useMergedRef(ref, attach);
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        ref={setRef}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        data-slot="context-menu-sub-content"
        className={cn(menuContentClass, "max-h-[var(--radix-dropdown-menu-content-available-height,none)]", className)}
        {...rest}
      >
        {glider}
        {children}
      </ContextMenuPrimitive.SubContent>
    </ContextMenuPrimitive.Portal>
  );
});
