import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from "react";
import { Menubar as MenubarPrimitive } from "radix-ui";
import { Check } from "../icons";
import { useGlide } from "../hooks/useGlide";
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

/* App menu bar: a pill track of menu triggers. <Menubar><MenubarMenu><MenubarTrigger/><MenubarContent>…

   Delight: one highlight everywhere. Inside each menu the rows are dealt in and
   a single highlight glides between them (useRowGlide, as in DropdownMenu). On
   the bar itself the ink pill of the open menu is ONE pill too: move to the next
   menu (hover or ←/→ while open) and it travels there like a caterpillar
   (useGlide, axis x — the ToggleGroup glider), instead of one trigger going
   dark as another goes light. When every menu closes it fades where it is.
   Under calm the pill is hidden and the triggers paint their own state. */

export const Menubar = forwardRef<
  ElementRef<typeof MenubarPrimitive.Root>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Root> & { size?: "sm" | "md" | "lg" }
>(function Menubar({ className, size = "md", children, ...rest }, ref) {
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current as HTMLDivElement);
  const [active, setActive] = useState<HTMLElement | null>(null);
  const [on, setOn] = useState(false);

  // follow whichever trigger Radix marks open
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const find = () => {
      const t = el.querySelector<HTMLElement>('[data-slot="menubar-trigger"][data-state="open"]');
      setOn(!!t);
      if (t) setActive(t);
    };
    find();
    const mo = new MutationObserver(find);
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["data-state"], childList: true });
    return () => mo.disconnect();
  }, []);
  const glide = useGlide(root, active);

  return (
    <MenubarPrimitive.Root
      ref={root}
      data-slot="menubar"
      data-size={size}
      className={cn(
        "relative isolate inline-flex items-center gap-tight p-[3px] rounded-pill bg-fill font-sans",
        size === "sm" && "[--mb-h:var(--rap-control-h-sm)]",
        size === "md" && "[--mb-h:var(--rap-control-h)]",
        size === "lg" && "[--mb-h:var(--rap-control-h-lg)]",
        className,
      )}
      {...rest}
    >
      {/* the open menu's ink pill, travelling between triggers; hidden under calm */}
      <span
        data-slot="menubar-glider"
        className={cn(
          "absolute top-0 left-0 -z-1 rounded-pill bg-ink pointer-events-none opacity-0 data-[on]:opacity-100",
          "transition-opacity duration-160 ease-rm calm:hidden",
        )}
        style={glide.style}
        data-on={on && glide.ready ? "" : undefined}
        aria-hidden
      />
      {children}
    </MenubarPrimitive.Root>
  );
});

export const MenubarMenu = MenubarPrimitive.Menu;

export const MenubarTrigger = forwardRef<
  ElementRef<typeof MenubarPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(function MenubarTrigger({ className, ...rest }, ref) {
  return (
    <MenubarPrimitive.Trigger
      ref={ref}
      data-slot="menubar-trigger"
      className={cn(
        "inline-flex items-center gap-[0.4rem] h-[calc(var(--mb-h)-6px)] px-4 border-0 rounded-pill bg-transparent text-ink",
        "font-sans text-[0.9375rem] font-medium tracking-[-0.01em] whitespace-nowrap cursor-pointer outline-none",
        "transition-[background,color] duration-(--rap-dur-fast) ease-rm",
        "not-data-[state=open]:hover:bg-fill not-data-[state=open]:data-[highlighted]:bg-fill",
        // open: ink text; the glider draws the ink pill behind it (the trigger paints it itself under calm)
        "data-[state=open]:text-paper calm:data-[state=open]:bg-ink",
        "focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
        "data-[disabled]:opacity-40 data-[disabled]:pointer-events-none [&_svg]:size-[18px]",
        className,
      )}
      {...rest}
    />
  );
});
export const MenubarGroup = MenubarPrimitive.Group;
export const MenubarPortal = MenubarPrimitive.Portal;
export const MenubarSub = MenubarPrimitive.Sub;
export const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

export const MenubarContent = forwardRef<
  ElementRef<typeof MenubarPrimitive.Content>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(function MenubarContent(
  { className, sideOffset = 8, align = "start", alignOffset = -3, collisionPadding = 8, children, onFocusOutside, onPointerDownOutside, ...rest },
  ref,
) {
  const { attach, glider } = useRowGlide({ pop: 0.7 });
  const node = useRef<HTMLDivElement | null>(null);
  const local = useCallback(
    (el: HTMLDivElement | null) => {
      node.current = el;
      attach(el);
    },
    [attach],
  );
  const setRef = useMergedRef(ref, local);
  // A menu that is already closing (playing its exit animation) is still a
  // mounted DismissableLayer. When you move to the next menu, focus lands in
  // the new menu, the old one sees "focus outside" and dismisses — and Radix
  // turns that into "close the menubar", shutting the menu you just opened.
  // A closing menu has nothing left to dismiss, so it ignores outside events.
  const closing = () => node.current?.getAttribute("data-state") === "closed";
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={setRef}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        data-slot="menubar-content"
        className={cn(menuContentClass, "max-h-[var(--radix-menubar-content-available-height,none)]", className)}
        onFocusOutside={(e) => {
          onFocusOutside?.(e);
          if (closing()) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          onPointerDownOutside?.(e);
          if (closing()) e.preventDefault();
        }}
        {...rest}
      >
        {glider}
        {children}
      </MenubarPrimitive.Content>
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
      data-slot="menubar-item"
      data-inset={inset ? "" : undefined}
      data-variant={variant}
      className={cn(menuItemClass, className)}
      {...rest}
    />
  );
});

export const MenubarCheckboxItem = forwardRef<
  ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(function MenubarCheckboxItem({ className, children, ...rest }, ref) {
  return (
    <MenubarPrimitive.CheckboxItem ref={ref} data-slot="menubar-checkbox-item" data-inset="" className={cn(menuItemClass, className)} {...rest}>
      <MenuIndicator>
        <MenubarPrimitive.ItemIndicator>
          <Check strokeWidth={2.5} />
        </MenubarPrimitive.ItemIndicator>
      </MenuIndicator>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
});

export const MenubarRadioItem = forwardRef<
  ElementRef<typeof MenubarPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(function MenubarRadioItem({ className, children, ...rest }, ref) {
  return (
    <MenubarPrimitive.RadioItem ref={ref} data-slot="menubar-radio-item" data-inset="" className={cn(menuItemClass, className)} {...rest}>
      <MenuIndicator>
        <MenubarPrimitive.ItemIndicator>
          <MenuDot />
        </MenubarPrimitive.ItemIndicator>
      </MenuIndicator>
      {children}
    </MenubarPrimitive.RadioItem>
  );
});

export const MenubarLabel = forwardRef<
  ElementRef<typeof MenubarPrimitive.Label>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & { inset?: boolean }
>(function MenubarLabel({ className, inset, ...rest }, ref) {
  return (
    <MenubarPrimitive.Label
      ref={ref}
      data-slot="menubar-label"
      data-inset={inset ? "" : undefined}
      className={cn(menuLabelClass, className)}
      {...rest}
    />
  );
});

export const MenubarSeparator = forwardRef<
  ElementRef<typeof MenubarPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(function MenubarSeparator({ className, ...rest }, ref) {
  return <MenubarPrimitive.Separator ref={ref} data-slot="menubar-separator" className={cn(menuSeparatorClass, className)} {...rest} />;
});

export function MenubarShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="menubar-shortcut" className={cn("menu-shortcut", className)} {...rest} />;
}

export const MenubarSubTrigger = forwardRef<
  ElementRef<typeof MenubarPrimitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & { inset?: boolean }
>(function MenubarSubTrigger({ className, inset, children, ...rest }, ref) {
  return (
    <MenubarPrimitive.SubTrigger
      ref={ref}
      data-slot="menubar-sub-trigger"
      data-inset={inset ? "" : undefined}
      className={cn(menuItemClass, className)}
      {...rest}
    >
      {children}
      <MenuChevron />
    </MenubarPrimitive.SubTrigger>
  );
});

export const MenubarSubContent = forwardRef<
  ElementRef<typeof MenubarPrimitive.SubContent>,
  ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(function MenubarSubContent({ className, sideOffset = 6, alignOffset = -4, collisionPadding = 8, children, ...rest }, ref) {
  const { attach, glider } = useRowGlide({ pop: 0.5 });
  const setRef = useMergedRef(ref, attach);
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.SubContent
        ref={setRef}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        data-slot="menubar-sub-content"
        className={cn(menuContentClass, "max-h-[var(--radix-dropdown-menu-content-available-height,none)]", className)}
        {...rest}
      >
        {glider}
        {children}
      </MenubarPrimitive.SubContent>
    </MenubarPrimitive.Portal>
  );
});
