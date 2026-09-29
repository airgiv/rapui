import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from "react";
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui";
import { cva } from "class-variance-authority";
import { ChevronDown } from "../icons";
import { useSound } from "../sound";
import { cn } from "../utils";
import { Glider, useActiveElement } from "./ProductTabs";
import "./NavigationMenu.css";

/* Site/app header menu (Radix NavigationMenu).
   <NavigationMenu><NavigationMenuList><NavigationMenuItem><NavigationMenuTrigger/><NavigationMenuContent/>…

   Delight: one soft fill travels along the bar like a caterpillar (useGlide) to whatever
   the pointer is over — or, when it isn't over the bar, to the trigger whose panel is
   open — instead of each pill lighting up by itself. Sweep across the bar and it
   stretches and gathers behind you; leave, and it fades where it was. When a panel
   opens, its cards/rows are dealt in (rap-deal-in, 22ms apart) like a hand of cards.
   Opening stays immediate; the fill and the dealing ride on top. Calm / reduced motion:
   plain slide, no dealing. Sound (opt-in via SoundProvider): a pop when a panel opens. */

/* --nav-h is the bar height; triggers are pills of it */
const navigationMenuVariants = cva("group/nav relative z-10 flex justify-center font-sans", {
  variants: {
    size: {
      sm: "[--nav-h:var(--rap-control-h-sm)]",
      md: "[--nav-h:var(--rap-control-h)]",
      lg: "[--nav-h:var(--rap-control-h-lg)]",
    },
  },
  defaultVariants: { size: "md" },
});

export const NavigationMenu = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Root>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root> & {
    size?: "sm" | "md" | "lg";
    /** Render the shared animated viewport under the list. Default true. */
    viewport?: boolean;
  }
>(function NavigationMenu({ className, children, size = "md", viewport = true, ...rest }, ref) {
  return (
    <NavigationMenuPrimitive.Root
      ref={ref}
      data-slot="navigation-menu"
      data-size={size}
      className={cn(navigationMenuVariants({ size }), className)}
      {...rest}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  );
});

/* what the glider follows: triggers, and links drawn as pills */
const TRIGGER = '[data-slot="navigation-menu-trigger"], [data-slot="navigation-menu-link"][data-variant="pill"]';

export const NavigationMenuList = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.List>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(function NavigationMenuList({ className, children, onPointerMove, onPointerLeave, ...rest }, ref) {
  const list = useRef<HTMLUListElement>(null);
  useImperativeHandle(ref, () => list.current as HTMLUListElement);
  const open = useActiveElement(list, '[data-slot="navigation-menu-trigger"][data-state="open"]');
  const [hover, setHover] = useState<HTMLElement | null>(null);
  const sound = useSound();
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) sound.play("pop", { strength: 0.6 });
    wasOpen.current = !!open;
  }, [open, sound]);
  const target = hover ?? open;
  // keep the last place while hidden, and start a fresh glider (no slide-in) when it reappears
  const [last, setLast] = useState<HTMLElement | null>(null);
  const [epoch, setEpoch] = useState(0);
  if (target && target !== last) {
    if (!last || !last.isConnected) setEpoch((n) => n + 1);
    setLast(target);
  }
  const hidden = !target;
  const [wasHidden, setWasHidden] = useState(true);
  if (hidden !== wasHidden) {
    if (!hidden && wasHidden && last) setEpoch((n) => n + 1);
    setWasHidden(hidden);
  }
  return (
    <NavigationMenuPrimitive.List
      ref={list}
      data-slot="navigation-menu-list"
      className={cn("group/navlist relative isolate flex items-center gap-tight m-0 p-0 list-none", className)}
      data-glide=""
      onPointerMove={(e) => {
        onPointerMove?.(e);
        if (e.pointerType !== "mouse") return;
        const t = (e.target as HTMLElement).closest<HTMLElement>(TRIGGER);
        if (t && list.current?.contains(t) && t !== hover) setHover(t);
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        setHover(null);
      }}
      {...rest}
    >
      {/* the travelling fill (hover / open); triggers go clear and let it show through */}
      <Glider key={epoch} as="li" container={list} target={target ?? last} hidden={hidden} className="-z-1 rounded-pill bg-fill" />
      {children}
    </NavigationMenuPrimitive.List>
  );
});

export const NavigationMenuItem = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Item>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Item>
>(function NavigationMenuItem(props, ref) {
  return <NavigationMenuPrimitive.Item ref={ref} data-slot="navigation-menu-item" {...props} />;
});

/* A pill on the bar: the triggers, and links with variant="pill". On their own they fill
   on hover/open; inside the list (data-glide) the glider draws that fill instead, so they
   stay clear. Active (data-active) is ink either way. */
const navigationMenuTriggerStyle = cn(
  "group/navtrig inline-flex items-center gap-[0.35rem] h-(--nav-h) px-[calc(var(--nav-h)*0.4)] border-0 rounded-pill",
  "has-[[data-slot=navigation-menu-chevron]]:pr-[calc(var(--nav-h)*0.3)]",
  "bg-transparent text-ink font-[inherit] font-medium tracking-[-0.01em] no-underline whitespace-nowrap cursor-pointer select-none",
  "text-[0.9375rem] group-data-[size=sm]/nav:text-[0.875rem] group-data-[size=lg]/nav:text-[1rem]",
  "transition-[background-color,color] duration-(--rap-dur-fast) ease-rm",
  "not-data-active:hover:bg-fill not-data-active:data-[state=open]:bg-fill",
  "group-data-glide/navlist:not-data-active:hover:bg-transparent group-data-glide/navlist:not-data-active:data-[state=open]:bg-transparent",
  "data-active:bg-ink data-active:text-paper",
  "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
);

export const NavigationMenuTrigger = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(function NavigationMenuTrigger({ className, children, ...rest }, ref) {
  return (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle, className)}
      {...rest}
    >
      {children}
      <ChevronDown
        data-slot="navigation-menu-chevron"
        className="size-4 opacity-60 transition-transform duration-(--rap-dur-fast) ease-rm group-data-[state=open]/navtrig:rotate-180"
        aria-hidden
      />
    </NavigationMenuPrimitive.Trigger>
  );
});

export const NavigationMenuContent = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(function NavigationMenuContent({ className, ...rest }, ref) {
  return (
    <NavigationMenuPrimitive.Content
      ref={ref}
      data-slot="navigation-menu-content"
      className={cn(
        "absolute top-0 left-0 w-max max-w-[calc(100vw_-_2rem)] p-1.5",
        // Radix's data-motion slides the panels past each other (keyframes in NavigationMenu.css)
        "data-[motion=from-start]:animate-[rap-nav-from-start_var(--rap-dur-fast)_var(--rap-ease-out)]",
        "data-[motion=from-end]:animate-[rap-nav-from-end_var(--rap-dur-fast)_var(--rap-ease-out)]",
        "data-[motion=to-start]:animate-[rap-nav-to-start_var(--rap-dur-fast)_var(--rap-ease-out)]",
        "data-[motion=to-end]:animate-[rap-nav-to-end_var(--rap-dur-fast)_var(--rap-ease-out)]",
        // panel contents are dealt in, 22ms apart (--i from the list, see dealOrder), not while leaving
        "fun:[&:not([data-motion^='to-'])_:is([data-slot=navigation-menu-grid],[data-slot=navigation-menu-content]>ul)>li]:animate-[rap-deal-in_260ms_var(--rap-ease-out)_calc(var(--i,0)*22ms+40ms)_both]",
        "[&>ul>li:nth-child(2)]:[--i:1] [&>ul>li:nth-child(3)]:[--i:2] [&>ul>li:nth-child(4)]:[--i:3] [&>ul>li:nth-child(5)]:[--i:4]",
        "[&>ul>li:nth-child(6)]:[--i:5] [&>ul>li:nth-child(7)]:[--i:6] [&>ul>li:nth-child(n+8)]:[--i:7]",
        className,
      )}
      {...rest}
    />
  );
});

/**
 * A link. `variant="pill"` matches the triggers (for top-level items without a panel);
 * the default `"row"` is a plain row for use inside content.
 */
export const NavigationMenuLink = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Link>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link> & { variant?: "row" | "pill" }
>(function NavigationMenuLink({ className, variant = "row", ...rest }, ref) {
  return (
    <NavigationMenuPrimitive.Link
      ref={ref}
      data-slot="navigation-menu-link"
      data-variant={variant}
      className={cn(
        variant === "pill"
          ? navigationMenuTriggerStyle
          : "flex items-center gap-[0.6rem] min-h-10 px-[0.9rem] rounded-row text-ink text-[0.9375rem] no-underline outline-none hover:bg-fill focus-visible:bg-fill",
        className,
      )}
      {...rest}
    />
  );
});

/* the dealing order of a list's rows: 0, 1, 2 … capped at 7 */
const dealOrder =
  "*:nth-2:[--i:1] *:nth-3:[--i:2] *:nth-4:[--i:3] *:nth-5:[--i:4] *:nth-6:[--i:5] *:nth-7:[--i:6] *:nth-[n+8]:[--i:7]";

/** A grid of links inside a content panel. `columns` defaults to 2. */
export const NavigationMenuGrid = forwardRef<HTMLUListElement, ComponentPropsWithoutRef<"ul"> & { columns?: 1 | 2 | 3 }>(
  function NavigationMenuGrid({ className, columns = 2, style, ...rest }, ref) {
    return (
      <ul
        ref={ref}
        data-slot="navigation-menu-grid"
        className={cn(
          "grid grid-cols-[repeat(var(--nav-cols,2),minmax(12rem,auto))] gap-tight m-0 p-0 list-none",
          dealOrder,
          className,
        )}
        style={{ ["--nav-cols" as string]: columns, ...style }}
        {...rest}
      />
    );
  },
);

/** One entry in a NavigationMenuGrid: title, one-line description, optional icon. */
export const NavigationMenuCard = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Link>,
  Omit<ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>, "title"> & {
    title: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
  }
>(function NavigationMenuCard({ className, title, description, icon, children, ...rest }, ref) {
  return (
    <li>
      <NavigationMenuPrimitive.Link
        ref={ref}
        data-slot="navigation-menu-card"
        className={cn(
          "flex max-w-64 items-start gap-3 py-3 px-[0.9rem] rounded-row text-ink no-underline outline-none",
          "transition-[background-color] duration-(--rap-dur-fast) ease-rm hover:bg-fill focus-visible:bg-fill data-active:bg-fill",
          className,
        )}
        {...rest}
      >
        {icon != null && (
          <span className="grid place-items-center flex-none size-9 rounded-sm bg-fill text-ink [&_svg]:size-[18px]">{icon}</span>
        )}
        <span className="flex flex-col gap-[0.15rem] min-w-0">
          <span className="text-[0.9375rem] font-medium tracking-[-0.01em]">{title}</span>
          {description != null && (
            <span className="text-[0.8125rem] leading-[1.35] text-mute overflow-hidden text-ellipsis whitespace-nowrap">{description}</span>
          )}
          {children}
        </span>
      </NavigationMenuPrimitive.Link>
    </li>
  );
});

export const NavigationMenuViewport = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(function NavigationMenuViewport({ className, ...rest }, ref) {
  return (
    <div className="absolute top-full inset-x-0 flex justify-center pointer-events-none">
      {/* one shared floating panel that morphs between contents (Radix sizes it with CSS vars) */}
      <NavigationMenuPrimitive.Viewport
        ref={ref}
        data-slot="navigation-menu-viewport"
        className={cn(
          "pop relative flex-none mt-2 pointer-events-auto origin-top",
          "w-(--radix-navigation-menu-viewport-width) h-(--radix-navigation-menu-viewport-height) max-w-[calc(100vw_-_2rem)]",
          "transition-[width,height] duration-(--rap-dur-fast) ease-rm",
          className,
        )}
        {...rest}
      />
    </div>
  );
});

export const NavigationMenuIndicator = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(function NavigationMenuIndicator({ className, ...rest }, ref) {
  return (
    <NavigationMenuPrimitive.Indicator
      ref={ref}
      data-slot="navigation-menu-indicator"
      className={cn(
        "top-full z-1 flex justify-center h-2 overflow-hidden",
        "transition-[width,transform] duration-(--rap-dur-fast) ease-rm data-[state=hidden]:opacity-0",
        className,
      )}
      {...rest}
    >
      <span className="size-1 mt-0.5 rounded-full bg-ink" />
    </NavigationMenuPrimitive.Indicator>
  );
});
