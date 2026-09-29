import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { useGlide } from "../hooks/useGlide";
import { Check, ChevronRight } from "../icons";
import { useSound } from "../sound";
import { cx } from "../utils";
import { useMergedRef } from "./Dialog";
import "./DropdownMenu.css";

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

/* ── the row glider (internal; also used by ContextMenu, Menubar, Command) ── */

const RADIX_ROWS = ".rap-menu-item, .rap-menu-label, .rap-menu-separator";
const RADIX_WATCH = ["data-highlighted", "data-state"];
const pickRadix = (root: HTMLElement) =>
  root.querySelector<HTMLElement>(".rap-menu-item[data-highlighted]") ??
  root.querySelector<HTMLElement>('.rap-menu-subtrigger[data-state="open"]');

/**
 * One gliding highlight for a list of rows, plus the deal-in stagger.
 * `attach` goes on the scroll container (it must be position: relative +
 * isolation: isolate, see .rap-menu), `glider` is rendered as its first child.
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
  const danger = !!active?.classList.contains("rap-menu-item--danger");
  const glider = (
    <span
      className="rap-menu-glider"
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
        className={cx("rap-pop", "rap-menu", "rap-menu--glide", className)}
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
      className={cx("rap-menu-item", inset && "rap-menu-item--inset", variant === "danger" && "rap-menu-item--danger", className)}
      {...rest}
    />
  );
});

export const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, ...rest }, ref) {
  return (
    <DropdownMenuPrimitive.CheckboxItem ref={ref} className={cx("rap-menu-item", "rap-menu-item--inset", className)} {...rest}>
      <span className="rap-menu-indicator">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check strokeWidth={2.5} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

export const DropdownMenuRadioItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...rest }, ref) {
  return (
    <DropdownMenuPrimitive.RadioItem ref={ref} className={cx("rap-menu-item", "rap-menu-item--inset", className)} {...rest}>
      <span className="rap-menu-indicator">
        <DropdownMenuPrimitive.ItemIndicator>
          <span className="rap-menu-dot" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }
>(function DropdownMenuLabel({ className, inset, ...rest }, ref) {
  return <DropdownMenuPrimitive.Label ref={ref} className={cx("rap-menu-label", inset && "rap-menu-label--inset", className)} {...rest} />;
});

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...rest }, ref) {
  return <DropdownMenuPrimitive.Separator ref={ref} className={cx("rap-menu-separator", className)} {...rest} />;
});

export function DropdownMenuShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("rap-menu-shortcut", className)} {...rest} />;
}

export const DropdownMenuSubTrigger = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }
>(function DropdownMenuSubTrigger({ className, inset, children, ...rest }, ref) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cx("rap-menu-item", "rap-menu-subtrigger", inset && "rap-menu-item--inset", className)}
      {...rest}
    >
      {children}
      <ChevronRight className="rap-menu-chevron" aria-hidden />
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
        className={cx("rap-pop", "rap-menu", "rap-menu--glide", className)}
        {...rest}
      >
        {glider}
        {children}
      </DropdownMenuPrimitive.SubContent>
    </DropdownMenuPrimitive.Portal>
  );
});
