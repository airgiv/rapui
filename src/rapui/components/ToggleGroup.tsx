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
import { cx } from "../utils";
import { useSound } from "../sound";
import "./ToggleGroup.css";

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
    const find = () => setActive(el.querySelector<HTMLElement>('.rap-tgroup__item[data-state="on"]'));
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
      const items = Array.from(root.current?.querySelectorAll(".rap-tgroup__item") ?? []);
      sound.play("tap", { pitch: 0.9 + items.indexOf(active) * 0.08 });
    }
    prevActive.current = active;
  }, [active, sound]);

  return (
    <ToggleGroupPrimitive.Root
      ref={root}
      className={cx("rap-tgroup", `rap-tgroup--${size}`, single && "rap-tgroup--glide", className)}
      {...(rest as ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>)}
    >
      {single && <span className="rap-tgroup__glider" style={glide.style} aria-hidden />}
      {children}
    </ToggleGroupPrimitive.Root>
  );
});

export const ToggleGroupItem = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(function ToggleGroupItem({ className, ...rest }, ref) {
  return <ToggleGroupPrimitive.Item ref={ref} className={cx("rap-tgroup__item", className)} {...rest} />;
});
