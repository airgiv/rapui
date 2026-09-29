import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cx } from "../utils";
import "./ProductTabs.css";

/*
 * Product-UI tabs (Radix Tabs). Named TabsRoot/TabsList/TabsTrigger/TabsContent because
 * `Tabs` is already the animated showcase component.
 *   variant "pill": segmented, ink active pill slides on a filled track, items 2px apart
 *   variant "line": text tabs with a 2px ink underline that slides
 */

type Variant = "pill" | "line";
type Size = "sm" | "md" | "lg";
const TabsCtx = createContext<{ variant: Variant; size: Size }>({ variant: "pill", size: "md" });

export interface TabsRootProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: Variant;
  size?: Size;
}

export const TabsRoot = forwardRef<ElementRef<typeof TabsPrimitive.Root>, TabsRootProps>(function TabsRoot(
  { className, variant = "pill", size = "md", ...rest },
  ref,
) {
  return (
    <TabsCtx.Provider value={{ variant, size }}>
      <TabsPrimitive.Root ref={ref} className={cx("rap-ptabs", `rap-ptabs--${variant}`, `rap-ptabs--${size}`, className)} {...rest} />
    </TabsCtx.Provider>
  );
});

export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  function TabsList({ className, children, ...rest }, forwardedRef) {
    const { variant } = useContext(TabsCtx);
    const local = useRef<HTMLDivElement | null>(null);
    const indicator = useRef<HTMLSpanElement>(null);
    const ready = useRef(false);

    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        local.current = el;
        if (typeof forwardedRef === "function") forwardedRef(el);
        else if (forwardedRef) forwardedRef.current = el;
      },
      [forwardedRef],
    );

    useLayoutEffect(() => {
      const list = local.current;
      const ind = indicator.current;
      if (!list || !ind) return;
      const place = () => {
        const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
        if (!active) {
          ind.style.opacity = "0";
          return;
        }
        ind.style.opacity = "1";
        ind.style.width = `${active.offsetWidth}px`;
        ind.style.height = `${active.offsetHeight}px`;
        ind.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
        if (!ready.current) {
          // first placement: jump, don't slide in from 0
          ready.current = true;
          requestAnimationFrame(() => list.setAttribute("data-ready", ""));
        }
      };
      place();
      const mo = new MutationObserver(place);
      mo.observe(list, { attributes: true, subtree: true, attributeFilter: ["data-state"] });
      const ro = new ResizeObserver(place);
      ro.observe(list);
      list.querySelectorAll('[role="tab"]').forEach((t) => ro.observe(t));
      return () => {
        mo.disconnect();
        ro.disconnect();
      };
    }, [variant]);

    return (
      <TabsPrimitive.List ref={setRef} className={cx("rap-ptabs__list", className)} {...rest}>
        <span ref={indicator} className="rap-ptabs__indicator" aria-hidden />
        {children}
      </TabsPrimitive.List>
    );
  },
);

export const TabsTrigger = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  function TabsTrigger({ className, ...rest }, ref) {
    return <TabsPrimitive.Trigger ref={ref} className={cx("rap-ptabs__trigger", className)} {...rest} />;
  },
);

export const TabsContent = forwardRef<ElementRef<typeof TabsPrimitive.Content>, ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  function TabsContent({ className, ...rest }, ref) {
    return <TabsPrimitive.Content ref={ref} className={cx("rap-ptabs__content", className)} {...rest} />;
  },
);
