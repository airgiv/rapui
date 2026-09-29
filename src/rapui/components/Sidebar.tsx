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
import { PanelLeft } from "../icons";
import { useSpring } from "../hooks/useSpring";
import { cx } from "../utils";
import { useSound } from "../sound";
import { Glider, useActiveElement, useActiveTap, useCalm } from "./ProductTabs";
import "./Sidebar.css";

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
 *    max()), so the rail bumps its stop like a drawer instead of clipping its icons. The spring drives a 0..100 progress (`--sb-p`) that CSS maps onto
 *    --sb-rail..--sb-w, so custom widths keep working and nothing re-renders per frame
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
      <div ref={ref} data-collapsed={collapsed || undefined} className={cx("rap-shell", className)} {...rest} />
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
      className={cx("rap-sidebar", className)}
      style={calm ? style : { ["--sb-p" as string]: (p / 100).toFixed(4), ...style }}
      {...rest}
    />
  );
});

export const SidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarHeader({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("rap-sidebar__header", className)} {...rest} />;
});

export const SidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarContent(
  { className, children, ...rest },
  ref,
) {
  const local = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => local.current as HTMLDivElement);
  const active = useActiveElement(local, ".rap-sidebar__button[data-active]", ["data-active"]);
  useActiveTap(local, active, ".rap-sidebar__button");
  return (
    <div ref={local} className={cx("rap-sidebar__content", className)} data-glide={active ? "" : undefined} {...rest}>
      <Glider container={local} target={active} axis="y" className="rap-sidebar__glider" />
      {children}
    </div>
  );
});

export const SidebarFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarFooter({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("rap-sidebar__footer", className)} {...rest} />;
});

export const SidebarGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarGroup({ className, ...rest }, ref) {
  return <div ref={ref} role="group" className={cx("rap-sidebar__group", className)} {...rest} />;
});

export const SidebarGroupLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarGroupLabel(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("rap-sidebar__label", className)} {...rest} />;
});

export const SidebarMenu = forwardRef<HTMLUListElement, ComponentPropsWithoutRef<"ul">>(function SidebarMenu({ className, ...rest }, ref) {
  return <ul ref={ref} className={cx("rap-sidebar__menu", className)} {...rest} />;
});

export const SidebarMenuItem = forwardRef<HTMLLIElement, ComponentPropsWithoutRef<"li">>(function SidebarMenuItem(
  { className, ...rest },
  ref,
) {
  return <li ref={ref} className={cx("rap-sidebar__item", className)} {...rest} />;
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
      {icon != null && <span className="rap-sidebar__icon">{icon}</span>}
      <span className="rap-sidebar__text">{label}</span>
      {badge != null && <span className="rap-sidebar__badge">{badge}</span>}
    </>
  );
  const common = {
    ref,
    "data-active": isActive || undefined,
    "aria-current": isActive ? ("page" as const) : undefined,
    title: title ?? (collapsed ? (tooltip ?? (typeof label === "string" ? label : undefined)) : undefined),
    className: cx("rap-sidebar__button", `rap-sidebar__button--${size}`, className),
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
  return <hr ref={ref} className={cx("rap-sidebar__sep", className)} {...rest} />;
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
      className={cx("rap-sidebar__trigger", className)}
      {...rest}
    >
      {children ?? <PanelLeft />}
    </button>
  );
});

/** The main area next to the sidebar: a rounded surface that takes the remaining width. */
export const SidebarInset = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function SidebarInset({ className, ...rest }, ref) {
  return <main ref={ref} className={cx("rap-sidebar-inset", className)} {...rest} />;
});
