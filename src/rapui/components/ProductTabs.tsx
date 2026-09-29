import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type RefObject,
} from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cva } from "class-variance-authority";
import { useGlide } from "../hooks/useGlide";
import { springOf } from "../hooks/useSpring";
import { useSound } from "../sound";
import { cn, prefersReducedMotion } from "../utils";
import "./ProductTabs.css";

/*
 * Product-UI tabs (Radix Tabs). Named TabsRoot/TabsList/TabsTrigger/TabsContent because
 * `Tabs` is already the animated showcase component.
 *   variant "pill": segmented, ink active pill on a filled track, items 2px apart
 *   variant "line": text tabs with a 2px ink underline
 *
 * Delight: the pill (or the underline) is ONE object that travels between tabs like
 * a caterpillar (useGlide) — the edge in the direction of travel reaches the new tab
 * first, the tail lets go ~70ms later and catches up on a heavier spring, so a long
 * jump visibly stretches and then contracts. It follows Radix's data-state through a
 * MutationObserver (the ToggleGroup pattern), so controlled, uncontrolled and keyboard
 * changes all glide. The selection itself is immediate; only the ink is late.
 * Under calm / reduced motion it falls back to a plain eased slide.
 * Sound (opt-in via SoundProvider): a tap on change, pitched up per tab position.
 */

/* ══ navigation-group motion helpers ═══════════════════════
   Shared by ProductTabs, Pagination, Sidebar, NavigationMenu, Carousel, ScrollArea and
   Resizable. Not exported from the group barrel — candidates for hooks/ once the rest of
   the system wants them. */

/** True under prefers-reduced-motion or inside `data-rap-motion="calm"`; live-updates. */
export function useCalm(ref: RefObject<HTMLElement | null>) {
  const [calm, setCalm] = useState(false);
  useLayoutEffect(() => {
    const check = () => setCalm(isCalm(ref.current));
    check();
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["data-rap-motion"] });
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener?.("change", check);
    return () => {
      mo.disconnect();
      mq.removeEventListener?.("change", check);
    };
  }, [ref]);
  return calm;
}

/** One-off check for event handlers and imperative loops. */
export function isCalm(el: Element | null | undefined) {
  return prefersReducedMotion() || !!el?.closest('[data-rap-motion="calm"]');
}

/** The first element under `container` matching `selector`, kept current as attributes change. */
export function useActiveElement(
  container: RefObject<HTMLElement | null>,
  selector: string,
  attributes: string[] = ["data-state"],
  enabled = true,
) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const attrKey = attributes.join(",");
  useLayoutEffect(() => {
    const c = container.current;
    if (!c || !enabled) {
      setEl(null);
      return;
    }
    const find = () => setEl(c.querySelector<HTMLElement>(selector));
    find();
    const mo = new MutationObserver(find);
    mo.observe(c, { subtree: true, childList: true, attributes: true, attributeFilter: attrKey.split(",") });
    return () => mo.disconnect();
  }, [container, selector, attrKey, enabled]);
  return el;
}

/**
 * Sound: a `tap` whenever the active item changes (not on mount), pitched up a hair per
 * position so walking along a row plays a little scale. Silent without a SoundProvider.
 */
export function useActiveTap(container: RefObject<HTMLElement | null>, active: HTMLElement | null, itemSelector: string) {
  const sound = useSound();
  const prev = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const was = prev.current;
    prev.current = active;
    if (!active || !was || was === active) return;
    const items = Array.from(container.current?.querySelectorAll(itemSelector) ?? []);
    const i = Math.max(0, items.indexOf(active));
    sound.play("tap", { pitch: 1 + Math.min(i, 10) * 0.035 });
  }, [active, container, itemSelector, sound]);
}

/**
 * The travelling highlight: useGlide under calm-awareness. Render it inside `container`
 * (position: relative) and pass its look (colour, radius, z-index) as `className`.
 * `data-calm` + `data-settled` add a plain transition when the springs are off.
 */
export function Glider({
  container,
  target,
  axis = "x",
  className,
  as: Tag = "span",
  hidden,
  style: extra,
}: {
  container: RefObject<HTMLElement | null>;
  target: HTMLElement | null | undefined;
  axis?: "x" | "y";
  className?: string;
  as?: "span" | "li" | "div";
  hidden?: boolean;
  style?: CSSProperties;
}) {
  const calm = useCalm(container);
  const g = useGlide(container, target, { axis });
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!g.ready || settled) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setSettled(true)));
    return () => cancelAnimationFrame(id);
  }, [g.ready, settled]);
  const style: CSSProperties =
    calm && g.box
      ? { transform: `translate(${g.box.x}px, ${g.box.y}px)`, width: g.box.w, height: g.box.h }
      : g.style;
  return (
    <Tag
      aria-hidden
      role={Tag === "li" ? "presentation" : undefined}
      data-slot="glider"
      className={cn(
        // shared by every travelling highlight in the navigation group
        "absolute top-0 left-0 pointer-events-none transition-opacity duration-(--rap-dur-fast) ease-rm data-hidden:opacity-0",
        // calm / reduced motion: no caterpillar, just an eased slide (durations drop to 0 under reduced motion)
        "data-calm:data-settled:transition-[transform,width,height,opacity]",
        className,
      )}
      data-calm={calm || undefined}
      data-settled={settled || undefined}
      data-hidden={hidden || !g.ready || undefined}
      style={{ ...style, ...extra }}
    />
  );
}

/**
 * A tiny imperative spring for effects that must not re-render React every frame
 * (scroll squash, carousel lean, grip stretch). Same maths as useSpring; parks at rest.
 */
export function createSpring(apply: (v: number, vel: number) => void, tune = 50) {
  let cur = 0;
  let vel = 0;
  let target = 0;
  let raf = 0;
  let prev = 0;
  const { k, d } = springOf(tune);
  const tick = (t: number) => {
    const dt = prev ? Math.min(2.5, Math.max(0, (t - prev) / 16.67)) : 1;
    prev = t;
    vel += (target - cur) * k * dt;
    vel *= Math.pow(d, dt);
    cur += vel * dt;
    if (Math.abs(target - cur) < 0.02 && Math.abs(vel) < 0.02) {
      cur = target;
      vel = 0;
      raf = 0;
      apply(cur, 0);
      return;
    }
    apply(cur, vel);
    raf = requestAnimationFrame(tick);
  };
  const run = () => {
    if (!raf) {
      prev = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  return {
    /** Move the target; the value follows on the spring. */
    to(v: number) {
      target = v;
      run();
    },
    /** Jump value and target, no motion. */
    set(v: number) {
      cancelAnimationFrame(raf);
      raf = 0;
      cur = target = v;
      vel = 0;
      apply(v, 0);
    },
    get value() {
      return cur;
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

/* ══ Tabs ═════════════════════════════════════════════════ */

type Variant = "pill" | "line";
type Size = "sm" | "md" | "lg";
const TabsCtx = createContext<{ variant: Variant; size: Size; orientation: "horizontal" | "vertical" }>({
  variant: "pill",
  size: "md",
  orientation: "horizontal",
});

export interface TabsRootProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: Variant;
  size?: Size;
}

/* --pt-h is the control height every part reads (pill items sit 3px inside it). */
const tabsRootVariants = cva("flex flex-col gap-4 font-sans data-[orientation=vertical]:flex-row", {
  variants: {
    size: {
      sm: "[--pt-h:var(--rap-control-h-sm)]",
      md: "[--pt-h:var(--rap-control-h)]",
      lg: "[--pt-h:var(--rap-control-h-lg)]",
    },
  },
  defaultVariants: { size: "md" },
});

export const TabsRoot = forwardRef<ElementRef<typeof TabsPrimitive.Root>, TabsRootProps>(function TabsRoot(
  { className, variant = "pill", size = "md", orientation = "horizontal", ...rest },
  ref,
) {
  return (
    <TabsCtx.Provider value={{ variant, size, orientation }}>
      <TabsPrimitive.Root
        ref={ref}
        orientation={orientation}
        data-slot="tabs"
        data-variant={variant}
        data-size={size}
        className={cn(tabsRootVariants({ size }), className)}
        {...rest}
      />
    </TabsCtx.Provider>
  );
});

const tabsListVariants = cva("relative inline-flex self-start max-w-full", {
  variants: {
    // pill: segmented on a filled track; line: text tabs over a hairline
    variant: { pill: "gap-tight p-[3px] rounded-pill bg-fill", line: "" },
    orientation: { horizontal: "", vertical: "flex-col" },
  },
  compoundVariants: [
    { variant: "pill", orientation: "vertical", className: "rounded-[22px]" },
    { variant: "line", orientation: "horizontal", className: "gap-6 shadow-[inset_0_-1px_0_var(--rap-line)]" },
    { variant: "line", orientation: "vertical", className: "gap-0 shadow-[inset_1px_0_0_var(--rap-line)]" },
  ],
});

/* line: a 2px ink underline (a side bar when vertical) that slides with the glider */
const tabsIndicatorVariants = cva("z-0", {
  variants: {
    variant: {
      pill: "rounded-pill bg-ink",
      line: "after:absolute after:rounded-pill after:bg-ink",
    },
    orientation: { horizontal: "", vertical: "" },
  },
  compoundVariants: [
    { variant: "line", orientation: "horizontal", className: "after:inset-x-0 after:bottom-0 after:h-0.5" },
    { variant: "line", orientation: "vertical", className: "after:inset-y-0 after:left-0 after:w-0.5" },
  ],
});

export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  function TabsList({ className, children, ...rest }, forwardedRef) {
    const { variant, orientation } = useContext(TabsCtx);
    const local = useRef<HTMLDivElement | null>(null);

    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        local.current = el;
        if (typeof forwardedRef === "function") forwardedRef(el);
        else if (forwardedRef) forwardedRef.current = el;
      },
      [forwardedRef],
    );

    const active = useActiveElement(local, '[role="tab"][data-state="active"]');
    useActiveTap(local, active, '[role="tab"]');

    return (
      <TabsPrimitive.List
        ref={setRef}
        data-slot="tabs-list"
        className={cn(tabsListVariants({ variant, orientation }), className)}
        data-ready={active ? "" : undefined}
        {...rest}
      >
        <Glider
          container={local}
          target={active}
          axis={orientation === "vertical" ? "y" : "x"}
          className={tabsIndicatorVariants({ variant, orientation })}
        />
        {children}
      </TabsPrimitive.List>
    );
  },
);

const tabsTriggerVariants = cva(
  [
    "relative z-1 inline-flex items-center justify-center gap-[0.45rem] border-0 bg-transparent text-ink",
    "font-[inherit] font-medium tracking-[-0.01em] whitespace-nowrap cursor-pointer",
    "transition-[color,background-color] duration-(--rap-dur-fast) ease-rm",
    "disabled:opacity-40 disabled:pointer-events-none [&_svg]:size-[18px] [&_svg]:flex-none",
  ],
  {
    variants: {
      variant: {
        // the ink pill is the glider behind; the active item only turns its text paper
        pill: [
          "h-[calc(var(--pt-h)-6px)] px-[1.05rem] rounded-pill",
          "hover:not-data-[state=active]:bg-fill data-[state=active]:text-paper",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        ],
        line: [
          "h-(--pt-h) px-[0.1rem] text-mute hover:text-ink data-[state=active]:text-ink",
          "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)] focus-visible:rounded-[10px]",
        ],
      },
      size: { sm: "text-[0.875rem]", md: "text-[0.9375rem]", lg: "text-[1rem]" },
      orientation: { horizontal: "", vertical: "justify-start" },
    },
    compoundVariants: [{ variant: "line", orientation: "vertical", className: "h-[calc(var(--pt-h)-4px)] px-4" }],
  },
);

export const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  function TabsTrigger({ className, ...rest }, ref) {
    const { variant, size, orientation } = useContext(TabsCtx);
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        data-slot="tabs-trigger"
        className={cn(tabsTriggerVariants({ variant, size, orientation }), className)}
        {...rest}
      />
    );
  },
);

export const TabsContent = forwardRef<ElementRef<typeof TabsPrimitive.Content>, ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  function TabsContent({ className, ...rest }, ref) {
    return (
      <TabsPrimitive.Content
        ref={ref}
        data-slot="tabs-content"
        className={cn(
          "flex-1 min-w-0 outline-none focus-visible:rounded-sm focus-visible:shadow-[0_0_0_2px_var(--rap-ring)]",
          // the panel rises 4px into place (ProductTabs.css)
          "data-[state=active]:animate-[rap-ptabs-in_var(--rap-dur-fast)_var(--rap-ease-out)]",
          className,
        )}
        {...rest}
      />
    );
  },
);
