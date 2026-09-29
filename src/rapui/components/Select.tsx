/* ══ Select ═══════════════════════════════════════════════
   Composable, shadcn-style:
   <Select><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem/>…

   DELIGHT — A HAND OF CARDS AND A SLOT WINDOW.

   Opening DEALS the options: each row drops in 22ms after the one
   above it (motion.css `rap-deal-in`), so the list arrives as a
   hand being laid down rather than a panel appearing. The stagger
   is capped at the 12th row — past that nobody is watching the
   top any more and a long list must not take a second to arrive.

   Picking ROLLS the value into the trigger: the old text slides
   up and out of a clipped window while the new one comes up from
   below, like a slot-machine reel landing. The trigger learns the
   new text by watching its own value node (Radix portals the
   item's text into it), so it rolls however the value changed;
   the first quarter-second after mount is ignored so the initial
   value does not roll in on page load.

   The value and the list are immediate — the roll and the deal
   are decoration riding on the state change, and both are off
   under reduced motion / data-rap-motion="calm".
   Sound (with a <SoundProvider enabled>): "pop" on open, "tick"
   on pick. */
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "../icons";
import { useSound } from "../sound";
import { cx } from "../utils";
import { isMotionCalm } from "./FormField";
import "./Select.css";

/** Radix Select root, plus the pop / tick sounds. Same props. */
export function Select({ onOpenChange, onValueChange, ...rest }: ComponentProps<typeof SelectPrimitive.Root>) {
  const sound = useSound();
  return (
    <SelectPrimitive.Root
      {...rest}
      onOpenChange={(o) => {
        if (o) sound.play("pop");
        onOpenChange?.(o);
      }}
      onValueChange={(v) => {
        sound.play("tick");
        onValueChange?.(v);
      }}
    />
  );
}
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

/* ── the slot window ─────────────────────────────────────
   Shared with Combobox: give it the text that is showing and it
   keeps the outgoing text as a ghost that rolls up and away. */
export function useRoll(watch: RefObject<HTMLElement | null>, opts: { observe?: boolean; text?: string } = {}) {
  const [ghost, setGhost] = useState<{ text: string; muted: boolean; n: number } | null>(null);
  const [rolls, setRolls] = useState(0);
  const last = useRef<{ text: string; muted: boolean } | null>(null);
  const born = useRef(0);

  const seen = useCallback(
    (text: string, muted: boolean) => {
      const prev = last.current;
      last.current = { text, muted };
      if (!prev || prev.text === text) return;
      if (performance.now() - born.current < 250 || isMotionCalm(watch.current)) return;
      setGhost({ text: prev.text, muted: prev.muted, n: performance.now() });
      setRolls((r) => r + 1);
    },
    [watch],
  );

  // mode 1: watch the DOM (Radix writes the value text itself)
  useEffect(() => {
    born.current = performance.now();
    const el = watch.current;
    if (!el || !opts.observe) return;
    const muted = () => !!el.closest("[data-placeholder]");
    last.current = { text: el.textContent ?? "", muted: muted() };
    const mo = new MutationObserver(() => seen(el.textContent ?? "", muted()));
    mo.observe(el, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, [watch, opts.observe, seen]);

  // mode 2: we are told the text
  const { text } = opts;
  useEffect(() => {
    if (text === undefined) return;
    seen(text, !!watch.current?.closest("[data-placeholder]"));
  }, [text, seen, watch]);

  const valueClass = rolls > 0 ? (rolls % 2 ? "is-roll-a" : "is-roll-b") : undefined;
  const ghostEl: ReactNode = ghost ? (
    <span
      key={ghost.n}
      className={cx("rap-select-trigger__ghost", ghost.muted && "is-muted")}
      aria-hidden
      onAnimationEnd={() => setGhost(null)}
    >
      {ghost.text}
    </span>
  ) : null;
  return { valueClass, ghost: ghostEl };
}

export const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { size?: "sm" | "md" | "lg" }
>(function SelectTrigger({ className, children, size = "md", ...rest }, ref) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const roll = useRoll(valueRef, { observe: true });
  return (
    <SelectPrimitive.Trigger ref={ref} className={cx("rap-select-trigger", `rap-select-trigger--${size}`, className)} {...rest}>
      <span className="rap-select-trigger__window">
        <span ref={valueRef} className={cx("rap-select-trigger__value", roll.valueClass)}>
          {children}
        </span>
        {roll.ghost}
      </span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="rap-select-trigger__icon" aria-hidden />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

/** Number every row of a freshly opened list (--i) so the CSS can deal them in, capped at 12. */
export function dealRows(node: HTMLElement | null, selector = ".rap-menu-item, .rap-menu-label, .rap-menu-separator") {
  if (!node) return;
  node.querySelectorAll<HTMLElement>(selector).forEach((row, i) => row.style.setProperty("--i", String(Math.min(i, 12))));
}

export const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = "popper", sideOffset = 6, ...rest }, ref) {
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      dealRows(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={setRef}
        position={position}
        sideOffset={sideOffset}
        className={cx("rap-pop", "rap-select-content", className)}
        {...rest}
      >
        <SelectPrimitive.Viewport className="rap-select-viewport">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef<ElementRef<typeof SelectPrimitive.Item>, ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  function SelectItem({ className, children, ...rest }, ref) {
    return (
      <SelectPrimitive.Item ref={ref} className={cx("rap-menu-item", "rap-select-item", className)} {...rest}>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className="rap-select-item__check">
          <Check size={16} strokeWidth={2.5} />
        </SelectPrimitive.ItemIndicator>
      </SelectPrimitive.Item>
    );
  },
);

export const SelectLabel = forwardRef<ElementRef<typeof SelectPrimitive.Label>, ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(
  function SelectLabel({ className, ...rest }, ref) {
    return <SelectPrimitive.Label ref={ref} className={cx("rap-menu-label", className)} {...rest} />;
  },
);

export const SelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator({ className, ...rest }, ref) {
  return <SelectPrimitive.Separator ref={ref} className={cx("rap-menu-separator", className)} {...rest} />;
});
