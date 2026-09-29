import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { useGlide } from "../hooks/useGlide";
import { cn } from "../utils";
import { useSound } from "../sound";

/**
 * Segmented control (Radix ToggleGroup). `type="single"` for one choice,
 * `type="multiple"` for a set of toggles. Items sit 2px apart on a filled track.
 *
 * Delight: in single mode one ink pill travels between options like a
 * caterpillar (useGlide) — its leading edge reaches the new option first and
 * the tail catches up — instead of each option lighting up on its own.
 */
export const ToggleGroup = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Root>,
  ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & { size?: "sm" | "md" | "lg" }
>(function ToggleGroup({ className, size = "md", children, ...rest }, ref) {
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current as HTMLDivElement);
  const single = rest.type === "single";
  const [active, setActive] = useState<HTMLElement | null>(null);

  // follow Radix's data-state="on" wherever the value comes from
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !single) return;
    const find = () => setActive(el.querySelector<HTMLElement>('[data-slot="toggle-group-item"][data-state="on"]'));
    find();
    const mo = new MutationObserver(find);
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["data-state"], childList: true });
    return () => mo.disconnect();
  }, [single]);

  const glide = useGlide(root, active);
  // a tap when the choice moves, pitched by position so the row reads as a scale
  const sound = useSound();
  const prevActive = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (prevActive.current && active && prevActive.current !== active) {
      const items = Array.from(root.current?.querySelectorAll('[data-slot="toggle-group-item"]') ?? []);
      sound.play("tap", { pitch: 0.9 + items.indexOf(active) * 0.08 });
    }
    prevActive.current = active;
  }, [active, sound]);

  return (
    <ToggleGroupPrimitive.Root
      ref={root}
      data-slot="toggle-group"
      data-size={size}
      data-glide={single || undefined}
      className={cn(
        "group/tg relative isolate inline-flex gap-tight p-[3px] rounded-pill bg-fill",
        size === "sm" && "[--tg-h:var(--rap-control-h-sm)]",
        size === "md" && "[--tg-h:var(--rap-control-h)]",
        size === "lg" && "[--tg-h:var(--rap-control-h-lg)]",
        className,
      )}
      {...(rest as ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>)}
    >
      {single && (
        <span className="absolute top-0 left-0 -z-1 rounded-pill bg-ink pointer-events-none" style={glide.style} aria-hidden />
      )}
      {children}
    </ToggleGroupPrimitive.Root>
  );
});

export const ToggleGroupItem = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(function ToggleGroupItem({ className, ...rest }, ref) {
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-[calc(var(--tg-h)-6px)] min-w-[calc(var(--tg-h)-6px)] px-4",
        "rounded-pill border-0 bg-transparent text-ink font-sans text-[0.9375rem] font-medium tracking-[-0.01em] whitespace-nowrap cursor-pointer",
        "transition-[background-color,color] duration-(--rap-dur-fast) ease-rm",
        "hover:bg-fill data-[state=on]:bg-ink data-[state=on]:text-paper",
        // with the glider the pill is drawn by it, not by the item
        "group-data-[glide]/tg:data-[state=on]:bg-transparent group-data-[glide]/tg:data-[state=on]:hover:bg-transparent",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        "disabled:opacity-40 disabled:pointer-events-none [&_svg]:size-[18px]",
        className,
      )}
      {...rest}
    />
  );
});
