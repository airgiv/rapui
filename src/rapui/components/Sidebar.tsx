import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Slot } from "radix-ui";
import { cva } from "class-variance-authority";
import { PanelLeft } from "../icons";
import { useSpring } from "../hooks/useSpring";
import { cn } from "../utils";
import { useSound } from "../sound";
import { Glider, useActiveElement, useActiveTap, useCalm } from "./ProductTabs";

/*
 * App shell for admin pages. It is a normal flex layout (no position: fixed), so it
 * fills whatever box you put it in: the viewport, a card, a docs stage.
 *
 * <SidebarProvider>
 *   <Sidebar> <SidebarHeader/> <SidebarContent> <SidebarGroup> <SidebarGroupLabel/> <SidebarMenu>
 *     <SidebarMenuItem><SidebarMenuButton icon={…} isActive>Projects</SidebarMenuButton></SidebarMenuItem>
 *   </SidebarMenu> </SidebarGroup> </SidebarContent> <SidebarFooter/> </Sidebar>
 *   <SidebarInset> <SidebarTrigger/> … </SidebarInset>
 * </SidebarProvider>
 *
 * Delight, one idea in two places — the rail is a physical thing on a spring:
 *  - The ink "you are here" row is ONE pill that crawls between rows like a caterpillar
 *    (useGlide, axis y): pick a row far down and the pill stretches toward it, then its
 *    tail catches up. SidebarContent owns it and follows `isActive` (data-active) through a
 *    MutationObserver; rows in the header/footer keep their own ink.
 *  - Collapsing/expanding runs the width on useSpring (tune 20: one overshoot of ~8%,
 *    settled in ~0.5s) instead of an ease. Opening, the panel swings a few px past its
 *    width and settles; shutting, the undershoot is clamped to 4px under the rail (CSS
 *    max()), so the rail bumps its stop like a drawer instead of clipping its icons. The spring drives a 0..100 progress (`--sb-p`) that the
 *    width utility maps onto --sb-rail..--sb-w, so custom widths keep working and nothing re-renders per frame
 *    except the <aside> itself (its children are the same elements, React skips them).
 * The collapsed state flips immediately (labels fade, aria updates); only the width is late.
 * Calm / reduced motion: the old eased width transition and a plain slide.
 * Sound (opt-in via SoundProvider): tap when the active row changes, whoosh on collapse.
 */

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
}
const SidebarCtx = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebar must be used within <SidebarProvider>");
  return ctx;
}

export interface SidebarProviderProps extends HTMLAttributes<HTMLDivElement> {
  /** Controlled collapsed state. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Toggle with ⌘B / Ctrl+B. Default true. */
  shortcut?: boolean;
}

export const SidebarProvider = forwardRef<HTMLDivElement, SidebarProviderProps>(function SidebarProvider(
  { collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange, shortcut = true, className, ...rest },
  ref,
) {
  const [inner, setInner] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? inner;
  const setCollapsed = useCallback(
    (v: boolean) => {
      if (collapsedProp === undefined) setInner(v);
      onCollapsedChange?.(v);
    },
    [collapsedProp, onCollapsedChange],
  );
  const toggle = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut, toggle]);

  const value = useMemo(() => ({ collapsed, setCollapsed, toggle }), [collapsed, setCollapsed, toggle]);
  return (
    <SidebarCtx.Provider value={value}>
      <div
        ref={ref}
        data-slot="sidebar-wrapper"
        data-collapsed={collapsed || undefined}
        className={cn(
          // app shell: sidebar + inset, a plain flex row that fills its parent
          "group/shell flex w-full h-full min-h-0 gap-tile p-tile overflow-hidden",
          "bg-paper text-ink font-sans tracking-[-0.01em]",
          "[--sb-w:260px] [--sb-rail:56px] [--sb-row:40px]",
          className,
        )}
        {...rest}
      />
    </SidebarCtx.Provider>
  );
});

export const Sidebar = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function Sidebar({ className, style, ...rest }, ref) {
  const { collapsed } = useSidebar();
  const local = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => local.current as HTMLElement);
  const calm = useCalm(local);
  const p = useSpring(collapsed ? 0 : 100, 20, calm);
  // sound: a whoosh when the rail opens or shuts (not on mount)
  const sound = useSound();
  const was = useRef(collapsed);
  useEffect(() => {
    if (was.current === collapsed) return;
    was.current = collapsed;
    sound.play("whoosh", { strength: 0.6, pitch: collapsed ? 0.9 : 1.1 });
  }, [collapsed, sound]);
  return (
    <aside
      ref={local}
      data-state={collapsed ? "collapsed" : "expanded"}
      data-spring={calm ? undefined : ""}
      data-slot="sidebar"
      className={cn(
        "flex flex-col flex-none min-h-0 p-2 overflow-hidden duration-(--rap-dur) ease-rm",
        calm
          ? // calm / reduced motion: the plain eased width
            cn("transition-[width,padding]", collapsed ? "w-(--sb-rail)" : "w-(--sb-w)")
          : // sprung width: --sb-p runs 0 (rail) .. 1 (open) and may overshoot a hair either way;
            // the max() keeps the undershoot to 4px under the rail
            "transition-[padding] w-[max(calc(var(--sb-rail)_-_4px),calc(var(--sb-rail)_+_(var(--sb-w)_-_var(--sb-rail))_*_var(--sb-p,1)))]",
        className,
      )}
      style={calm ? style : { ["--sb-p" as string]: (p / 100).toFixed(4), ...style }}
      {...rest}
    />
  );
});

export const SidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarHeader({ className, ...rest }, ref) {
  return <div ref={ref} data-slot="sidebar-header" className={cn("flex flex-col gap-tight flex-none pb-3", className)} {...rest} />;
});

export const SidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarContent(
  { className, children, ...rest },
  ref,
) {
  const local = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => local.current as HTMLDivElement);
  const active = useActiveElement(local, '[data-slot="sidebar-menu-button"][data-active]', ["data-active"]);
  useActiveTap(local, active, '[data-slot="sidebar-menu-button"]');
  return (
    <div
      ref={local}
      data-slot="sidebar-content"
      className={cn(
        "group/sbc relative isolate flex flex-col gap-[1.1rem] flex-1 min-h-0 overflow-x-hidden overflow-y-auto",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      data-glide={active ? "" : undefined}
      {...rest}
    >
      {/* the travelling ink row; the active button goes clear under it */}
      <Glider container={local} target={active} axis="y" className="-z-1 rounded-pill bg-ink" />
      {children}
    </div>
  );
});

export const SidebarFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarFooter({ className, ...rest }, ref) {
  return <div ref={ref} data-slot="sidebar-footer" className={cn("flex flex-col gap-tight flex-none pt-3", className)} {...rest} />;
});

export const SidebarGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarGroup({ className, ...rest }, ref) {
  return <div ref={ref} role="group" data-slot="sidebar-group" className={cn("flex flex-col gap-1", className)} {...rest} />;
});

export const SidebarGroupLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarGroupLabel(
  { className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="sidebar-group-label"
      className={cn(
        // padded like the row icons so the label lines up with them
        "h-6 px-[calc((var(--sb-rail)_-_16px_-_18px)/2)] text-[0.8125rem] font-medium leading-6 text-mute",
        "whitespace-nowrap overflow-hidden transition-opacity duration-(--rap-dur-fast) ease-rm group-data-collapsed/shell:opacity-0",
        className,
      )}
      {...rest}
    />
  );
});

export const SidebarMenu = forwardRef<HTMLUListElement, ComponentPropsWithoutRef<"ul">>(function SidebarMenu({ className, ...rest }, ref) {
  return <ul ref={ref} data-slot="sidebar-menu" className={cn("flex flex-col gap-tight m-0 p-0 list-none", className)} {...rest} />;
});

export const SidebarMenuItem = forwardRef<HTMLLIElement, ComponentPropsWithoutRef<"li">>(function SidebarMenuItem(
  { className, ...rest },
  ref,
) {
  return <li ref={ref} data-slot="sidebar-menu-item" className={cn("flex min-w-0", className)} {...rest} />;
});

export interface SidebarMenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  isActive?: boolean;
  /** Text after the label (a count, a shortcut). Hidden when collapsed. */
  badge?: ReactNode;
  /** Hover title shown when the rail is collapsed. Defaults to the label when it is a string. */
  tooltip?: string;
  size?: "sm" | "md";
  /** Render your own element (e.g. a router <a>) — its children become the label. */
  asChild?: boolean;
}

/* label, badge and group labels fade out when the rail collapses (the icon stays) */
const fade = "transition-opacity duration-(--rap-dur-fast) ease-rm group-data-collapsed/shell:opacity-0 group-data-collapsed/shell:pointer-events-none";

const sidebarMenuButtonVariants = cva(
  [
    // the icon sits in a fixed slot (--sb-icon-pad) so it stays put while the rail shrinks
    "group/sbb [--sb-icon-pad:calc((var(--sb-rail)_-_16px_-_18px)/2)]",
    "flex items-center gap-[0.7rem] w-full min-w-0 h-(--sb-row) pr-[0.8rem] pl-(--sb-icon-pad) border-0 rounded-pill",
    "bg-transparent text-ink font-[inherit] tracking-[-0.01em] text-left no-underline whitespace-nowrap cursor-pointer overflow-hidden",
    "transition-[background-color,color] duration-(--rap-dur-fast) ease-rm hover:not-data-active:bg-fill",
    "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
    // active = ink; inside SidebarContent the glider draws the ink instead
    "data-active:bg-ink data-active:text-paper group-data-glide/sbc:data-active:bg-transparent",
    "disabled:opacity-40 disabled:pointer-events-none",
  ],
  {
    variants: {
      size: { sm: "[--sb-row:var(--rap-control-h-sm)] text-[0.875rem]", md: "text-[0.9375rem]" },
    },
    defaultVariants: { size: "md" },
  },
);

/** A pill row: icon + label. Active = ink. Collapses to a round icon button. */
export const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(function SidebarMenuButton(
  { icon, isActive, badge, tooltip, size = "md", asChild, className, children, title, ...rest },
  ref,
) {
  const { collapsed } = useSidebar();
  const label =
    asChild && isValidElement<{ children?: ReactNode }>(children) ? children.props.children : children;
  const inner = (
    <>
      {icon != null && (
        <span data-slot="sidebar-menu-icon" className="inline-flex items-center justify-center flex-none size-[18px] [&_svg]:size-[18px]">
          {icon}
        </span>
      )}
      <span data-slot="sidebar-menu-text" className={cn("flex-1 min-w-0 overflow-hidden text-ellipsis", fade)}>
        {label}
      </span>
      {badge != null && (
        <span
          data-slot="sidebar-menu-badge"
          className={cn(
            "flex-none min-w-6 py-[0.05rem] px-[0.45rem] rounded-pill bg-fill text-[0.75rem] font-medium tabular-nums text-center",
            "group-data-active/sbb:bg-[color-mix(in_srgb,var(--rap-paper)_18%,transparent)]",
            fade,
          )}
        >
          {badge}
        </span>
      )}
    </>
  );
  const common = {
    ref,
    "data-active": isActive || undefined,
    "aria-current": isActive ? ("page" as const) : undefined,
    title: title ?? (collapsed ? (tooltip ?? (typeof label === "string" ? label : undefined)) : undefined),
    "data-slot": "sidebar-menu-button",
    "data-size": size,
    className: cn(sidebarMenuButtonVariants({ size }), className),
    ...rest,
  };
  if (asChild && isValidElement(children))
    return (
      <Slot.Root {...(common as HTMLAttributes<HTMLElement>)}>{cloneElement(children, undefined, inner)}</Slot.Root>
    );
  return (
    <button type="button" {...common}>
      {inner}
    </button>
  );
});

export const SidebarSeparator = forwardRef<HTMLHRElement, HTMLAttributes<HTMLHRElement>>(function SidebarSeparator(
  { className, ...rest },
  ref,
) {
  return <hr ref={ref} data-slot="sidebar-separator" className={cn("w-full h-px my-1 border-0 bg-line", className)} {...rest} />;
});

/** Toggles the sidebar. Icon-only round button unless you pass children. */
export const SidebarTrigger = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function SidebarTrigger(
  { className, onClick, children, ...rest },
  ref,
) {
  const { collapsed, toggle } = useSidebar();
  return (
    <button
      ref={ref}
      type="button"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      title={`${collapsed ? "Expand" : "Collapse"} sidebar (⌘B)`}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) toggle();
      }}
      data-slot="sidebar-trigger"
      className={cn(
        "inline-grid place-items-center flex-none size-control-sm p-0 border-0 rounded-full bg-transparent text-ink cursor-pointer",
        "transition-[background-color] duration-(--rap-dur-fast) ease-rm hover:bg-fill",
        "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)] [&_svg]:size-[18px]",
        className,
      )}
      {...rest}
    >
      {children ?? <PanelLeft />}
    </button>
  );
});

/** The main area next to the sidebar: a rounded surface that takes the remaining width. */
export const SidebarInset = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function SidebarInset({ className, ...rest }, ref) {
  return (
    <main
      ref={ref}
      data-slot="sidebar-inset"
      className={cn("flex flex-col flex-1 min-w-0 min-h-0 rounded-pop bg-surface overflow-auto", className)}
      {...rest}
    />
  );
});
