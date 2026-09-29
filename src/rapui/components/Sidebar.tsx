import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Slot } from "radix-ui";
import { PanelLeft } from "lucide-react";
import { cx } from "../utils";
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

export const Sidebar = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function Sidebar({ className, ...rest }, ref) {
  const { collapsed } = useSidebar();
  return (
    <aside
      ref={ref}
      data-state={collapsed ? "collapsed" : "expanded"}
      className={cx("rap-sidebar", className)}
      {...rest}
    />
  );
});

export const SidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarHeader({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("rap-sidebar__header", className)} {...rest} />;
});

export const SidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SidebarContent({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("rap-sidebar__content", className)} {...rest} />;
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
