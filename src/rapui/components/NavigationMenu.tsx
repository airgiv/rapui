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
import { ChevronDown } from "../icons";
import { useSound } from "../sound";
import { cx } from "../utils";
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

export const NavigationMenu = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Root>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root> & {
    size?: "sm" | "md" | "lg";
    /** Render the shared animated viewport under the list. Default true. */
    viewport?: boolean;
  }
>(function NavigationMenu({ className, children, size = "md", viewport = true, ...rest }, ref) {
  return (
    <NavigationMenuPrimitive.Root ref={ref} className={cx("rap-nav", `rap-nav--${size}`, className)} {...rest}>
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  );
});

export const NavigationMenuList = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.List>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(function NavigationMenuList({ className, children, onPointerMove, onPointerLeave, ...rest }, ref) {
  const list = useRef<HTMLUListElement>(null);
  useImperativeHandle(ref, () => list.current as HTMLUListElement);
  const open = useActiveElement(list, '.rap-nav__trigger[data-state="open"]');
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
      className={cx("rap-nav__list", className)}
      data-glide=""
      onPointerMove={(e) => {
        onPointerMove?.(e);
        if (e.pointerType !== "mouse") return;
        const t = (e.target as HTMLElement).closest<HTMLElement>(".rap-nav__trigger");
        if (t && list.current?.contains(t) && t !== hover) setHover(t);
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        setHover(null);
      }}
      {...rest}
    >
      <Glider key={epoch} as="li" container={list} target={target ?? last} hidden={hidden} className="rap-nav__glider" />
      {children}
    </NavigationMenuPrimitive.List>
  );
});

export const NavigationMenuItem = NavigationMenuPrimitive.Item;

export const NavigationMenuTrigger = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(function NavigationMenuTrigger({ className, children, ...rest }, ref) {
  return (
    <NavigationMenuPrimitive.Trigger ref={ref} className={cx("rap-nav__trigger", className)} {...rest}>
      {children}
      <ChevronDown className="rap-nav__chevron" aria-hidden />
    </NavigationMenuPrimitive.Trigger>
  );
});

export const NavigationMenuContent = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(function NavigationMenuContent({ className, ...rest }, ref) {
  return <NavigationMenuPrimitive.Content ref={ref} className={cx("rap-nav__content", className)} {...rest} />;
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
      className={cx(variant === "pill" ? "rap-nav__trigger" : "rap-nav__row", className)}
      {...rest}
    />
  );
});

/** A grid of links inside a content panel. `columns` defaults to 2. */
export const NavigationMenuGrid = forwardRef<HTMLUListElement, ComponentPropsWithoutRef<"ul"> & { columns?: 1 | 2 | 3 }>(
  function NavigationMenuGrid({ className, columns = 2, style, ...rest }, ref) {
    return (
      <ul
        ref={ref}
        className={cx("rap-nav__grid", className)}
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
      <NavigationMenuPrimitive.Link ref={ref} className={cx("rap-nav__card", className)} {...rest}>
        {icon != null && <span className="rap-nav__card-icon">{icon}</span>}
        <span className="rap-nav__card-text">
          <span className="rap-nav__card-title">{title}</span>
          {description != null && <span className="rap-nav__card-desc">{description}</span>}
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
    <div className="rap-nav__viewport-wrap">
      <NavigationMenuPrimitive.Viewport ref={ref} className={cx("rap-pop", "rap-nav__viewport", className)} {...rest} />
    </div>
  );
});

export const NavigationMenuIndicator = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(function NavigationMenuIndicator({ className, ...rest }, ref) {
  return (
    <NavigationMenuPrimitive.Indicator ref={ref} className={cx("rap-nav__indicator", className)} {...rest}>
      <span className="rap-nav__indicator-dot" />
    </NavigationMenuPrimitive.Indicator>
  );
});
