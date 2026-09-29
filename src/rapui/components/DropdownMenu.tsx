import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { useGlide } from "../hooks/useGlide";
import { Check, ChevronRight } from "../icons";
import { useSound } from "../sound";
import { cn } from "../utils";
import { useMergedRef } from "./Dialog";

/* Composable, shadcn-style: <DropdownMenu><DropdownMenuTrigger/><DropdownMenuContent><DropdownMenuItem/>…

   Delight (shared by DropdownMenu, ContextMenu, Menubar and Command):
   the rows are DEALT onto the panel as it opens — the shared `rap-deal-in`,
   22ms apart, top to bottom, like cards off a deck — and there is ONE
   highlight, a soft pill that glides from row to row like a caterpillar
   (useGlide, axis "y": the leading edge races ahead on a quick spring, the
   tail follows 70ms later on a heavy one) instead of every row lighting up on
   its own. It follows Radix's `data-highlighted` (or cmdk's `data-selected`)
   through a MutationObserver, so keyboard, pointer and typeahead all drive it
   and the menu's behaviour is untouched. It turns red over `danger` rows, and
   when the pointer leaves the menu it fades where it is, so the next row it
   visits is reached by a glide rather than a pop. The per-row highlight comes
   back under calm (the glider is hidden) and reduced motion (springs snap).
   Sound (inside an enabled <SoundProvider>): pop on open, a very soft detent
   as the highlight moves row to row, a tick when a row is chosen. */

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/* ── shared menu styling (internal; also used by ContextMenu, Menubar, Command) ── */

/** Rows dealt onto the panel, top to bottom (--i is set in document order by useRowGlide). */
export const menuRowDeal = "fun:animate-[rap-deal-in_240ms_var(--rap-ease-out)_calc(var(--i,0)*22ms)_both]";

/** The panel: a `pop` surface; relative + isolate so the glider can sit under the rows. */
export const menuContentClass = "pop relative isolate min-w-[220px] p-1 overflow-y-auto outline-none";

/* A row. The glider paints the highlight, not the row (transparent), except
   under calm, where the glider is hidden and rows light up on their own again.
   Icons are ink-2 (ink when highlighted); `danger` rows are red throughout. */
export const menuItemClass = cn(
  "menu-item",
  menuRowDeal,
  "data-[inset]:pl-[2.4rem]",
  "[&>svg:not([data-slot=menu-chevron])]:text-ink-2 data-[highlighted]:[&>svg:not([data-slot=menu-chevron])]:text-ink",
  "data-[variant=danger]:text-danger data-[variant=danger]:[&>svg:not([data-slot=menu-chevron])]:text-danger",
  "data-[variant=danger]:data-[highlighted]:[&>svg:not([data-slot=menu-chevron])]:text-danger",
  "data-[highlighted]:bg-transparent calm:data-[highlighted]:bg-fill",
  "calm:data-[variant=danger]:data-[highlighted]:bg-[color-mix(in_srgb,var(--rap-danger)_12%,transparent)]",
  // a sub-menu trigger stays lit while its sub-menu is open (the glider does it outside calm)
  "calm:data-[state=open]:bg-fill",
  // the sub-menu chevron is smaller than row icons
  "[&>[data-slot=menu-chevron]]:size-4",
);
export const menuLabelClass = cn("menu-label", menuRowDeal, "data-[inset]:pl-[2.4rem]");
export const menuSeparatorClass = cn("menu-separator", menuRowDeal);

/** Check / radio mark, in the inset gutter on the left. */
export function MenuIndicator({ children }: { children: ReactNode }) {
  return (
    <span
      data-slot="menu-indicator"
      className="absolute left-[0.8rem] inline-grid place-items-center size-[18px] text-select *:inline-grid *:place-items-center [&_svg]:size-4"
    >
      {children}
    </span>
  );
}
export const MenuDot = () => <span data-slot="menu-dot" className="block size-2 rounded-full bg-current" />;
/** Sub-menu chevron; sits after the shortcut when there is one. */
export const MenuChevron = () => (
  <ChevronRight data-slot="menu-chevron" className="ml-auto text-mute [[data-slot$=shortcut]+&]:ml-2" aria-hidden />
);

/* ── the row glider (internal; also used by ContextMenu, Menubar, Command) ── */

const RADIX_ROWS = '[data-slot$="-item"], [data-slot$="-sub-trigger"], [data-slot$="-label"], [data-slot$="-separator"]';
const RADIX_WATCH = ["data-highlighted", "data-state"];
const pickRadix = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-slot$="-item"][data-highlighted], [data-slot$="-sub-trigger"][data-highlighted]') ??
  root.querySelector<HTMLElement>('[data-slot$="-sub-trigger"][data-state="open"]');

/**
 * One gliding highlight for a list of rows, plus the deal-in stagger.
 * `attach` goes on the scroll container (it must be position: relative +
 * isolation: isolate, see menuContentClass), `glider` is rendered as its first child.
 */
export function useRowGlide(
  options: {
    pick?: (root: HTMLElement) => HTMLElement | null;
    watch?: string[];
    rows?: string;
    /** Play `pop` when the list appears (menus), strength 0..1; 0 = silent (inline Command). */
    pop?: number;
  } = {},
) {
  const { pick = pickRadix, watch = RADIX_WATCH, rows = RADIX_ROWS, pop = 0.7 } = options;
  const sound = useSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const rootRef = useRef<HTMLElement | null>(null);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [active, setActive] = useState<HTMLElement | null>(null);
  const [on, setOn] = useState(false);
  const attach = useCallback((node: HTMLElement | null) => {
    rootRef.current = node;
    setRoot(node);
  }, []);
  const pickRef = useRef(pick);
  pickRef.current = pick;
  const watchKey = watch.join(",");

  useLayoutEffect(() => {
    if (!root) {
      setActive(null);
      setOn(false);
      return;
    }
    // deal order = document order, capped so a long menu doesn't take forever
    root.querySelectorAll<HTMLElement>(rows).forEach((r, i) => r.style.setProperty("--i", String(Math.min(i, 14))));
    if (pop) soundRef.current.play("pop", { strength: pop });
    // sound: a very soft notch each time the highlight moves on to another row,
    // a tick when a row is chosen (Radix bubbles "menu.itemSelect")
    let lastRow: HTMLElement | null = null;
    const onSelect = () => soundRef.current.play("tick");
    root.addEventListener("menu.itemSelect", onSelect);
    const update = () => {
      const t = pickRef.current(root);
      if (t && lastRow && t !== lastRow) soundRef.current.detent(0.3);
      if (t) lastRow = t;
      setOn(!!t);
      // with nothing highlighted, the glider stays (faded) where it was
      setActive((prev) => t ?? (prev && prev.isConnected && root.contains(prev) ? prev : null));
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: watchKey.split(",") });
    return () => {
      mo.disconnect();
      root.removeEventListener("menu.itemSelect", onSelect);
    };
  }, [root, rows, watchKey, pop]);

  const glide = useGlide(rootRef, active, { axis: "y" });
  const danger = active?.getAttribute("data-variant") === "danger";
  const glider = (
    <span
      data-slot="menu-glider"
      className={cn(
        "absolute top-0 left-0 -z-1 rounded-row bg-fill pointer-events-none opacity-0 data-[on]:opacity-100",
        "[transition:opacity_160ms_var(--rap-ease-rm),background-color_var(--rap-dur-fast)_var(--rap-ease-rm)]",
        "data-[tone=danger]:bg-[color-mix(in_srgb,var(--rap-danger)_12%,transparent)]",
        // calm: no glide — rows light up on their own again
        "calm:hidden",
      )}
      style={glide.style}
      data-on={on && glide.ready ? "" : undefined}
      data-tone={danger ? "danger" : undefined}
      aria-hidden
    />
  );
  return { attach, glider };
}

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, collisionPadding = 8, children, ...rest }, ref) {
  const { attach, glider } = useRowGlide();
  const setRef = useMergedRef(ref, attach);
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={setRef}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        data-slot="dropdown-menu-content"
        className={cn(menuContentClass, "max-h-[var(--radix-dropdown-menu-content-available-height,none)]", className)}
        {...rest}
      >
        {glider}
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
});

export interface MenuItemExtras {
  /** Indent the text to line up with checkbox/radio items. */
  inset?: boolean;
  /** `danger` paints the row red (delete, remove…). */
  variant?: "default" | "danger";
}

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & MenuItemExtras
>(function DropdownMenuItem({ className, inset, variant = "default", ...rest }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      data-inset={inset ? "" : undefined}
      data-variant={variant}
      className={cn(menuItemClass, className)}
      {...rest}
    />
  );
});

export const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, ...rest }, ref) {
  return (
    <DropdownMenuPrimitive.CheckboxItem ref={ref} data-slot="dropdown-menu-checkbox-item" data-inset="" className={cn(menuItemClass, className)} {...rest}>
      <MenuIndicator>
        <DropdownMenuPrimitive.ItemIndicator>
          <Check strokeWidth={2.5} />
        </DropdownMenuPrimitive.ItemIndicator>
      </MenuIndicator>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

export const DropdownMenuRadioItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...rest }, ref) {
  return (
    <DropdownMenuPrimitive.RadioItem ref={ref} data-slot="dropdown-menu-radio-item" data-inset="" className={cn(menuItemClass, className)} {...rest}>
      <MenuIndicator>
        <DropdownMenuPrimitive.ItemIndicator>
          <MenuDot />
        </DropdownMenuPrimitive.ItemIndicator>
      </MenuIndicator>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }
>(function DropdownMenuLabel({ className, inset, ...rest }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      data-slot="dropdown-menu-label"
      data-inset={inset ? "" : undefined}
      className={cn(menuLabelClass, className)}
      {...rest}
    />
  );
});

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...rest }, ref) {
  return <DropdownMenuPrimitive.Separator ref={ref} data-slot="dropdown-menu-separator" className={cn(menuSeparatorClass, className)} {...rest} />;
});

export function DropdownMenuShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="dropdown-menu-shortcut" className={cn("menu-shortcut", className)} {...rest} />;
}

export const DropdownMenuSubTrigger = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }
>(function DropdownMenuSubTrigger({ className, inset, children, ...rest }, ref) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset ? "" : undefined}
      className={cn(menuItemClass, className)}
      {...rest}
    >
      {children}
      <MenuChevron />
    </DropdownMenuPrimitive.SubTrigger>
  );
});

export const DropdownMenuSubContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(function DropdownMenuSubContent({ className, sideOffset = 6, alignOffset = -4, collisionPadding = 8, children, ...rest }, ref) {
  const { attach, glider } = useRowGlide({ pop: 0.5 });
  const setRef = useMergedRef(ref, attach);
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        ref={setRef}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        data-slot="dropdown-menu-sub-content"
        className={cn(menuContentClass, "max-h-[var(--radix-dropdown-menu-content-available-height,none)]", className)}
        {...rest}
      >
        {glider}
        {children}
      </DropdownMenuPrimitive.SubContent>
    </DropdownMenuPrimitive.Portal>
  );
});
