/* ══ Select ═══════════════════════════════════════════════
   Composable, shadcn-style:
   <Select><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem/>…

   DELIGHT — A HAND OF CARDS AND A SLOT WINDOW.

   Opening DEALS the options: each row drops in 22ms after the one
   above it (`rap-deal-in`, the theme keyframe), so the list arrives as a
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
import { cva } from "class-variance-authority";
import { cn } from "../utils";
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

  // two names for one roll-in so a pick that lands mid-roll restarts it
  const valueClass =
    rolls > 0
      ? rolls % 2
        ? "fun:animate-[rap-roll-in-a_420ms_var(--rap-ease-spring)]"
        : "fun:animate-[rap-roll-in-b_420ms_var(--rap-ease-spring)]"
      : undefined;
  const ghostEl: ReactNode = ghost ? (
    <span
      key={ghost.n}
      data-slot="select-ghost"
      className={cn(
        "overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none",
        "fun:animate-[rap-roll-out_300ms_var(--rap-ease-rm)_forwards] calm:hidden motion-reduce:hidden",
        ghost.muted && "text-mute",
      )}
      aria-hidden
      onAnimationEnd={() => setGhost(null)}
    >
      {ghost.text}
    </span>
  ) : null;
  return { valueClass, ghost: ghostEl };
}

/* ── the trigger, shared by Select, Combobox and DatePicker ──
   --in-h drives the height and the side padding together (the same
   pill maths as Input). Focus and open draw the inset ring; the open
   trigger lifts to the surface colour like a focused field. */
export const selectTriggerVariants = cva(
  [
    "group/trigger inline-flex items-center justify-between gap-2 w-full h-(--in-h) pl-[calc(var(--in-h)*0.4)] pr-[calc(var(--in-h)*0.3)]",
    "border-0 rounded-pill bg-fill text-ink font-sans text-[1rem] tracking-[-0.01em] text-left cursor-pointer",
    "transition-[background-color,box-shadow] duration-(--rap-dur-fast) ease-rm",
    "hover:not-data-[state=open]:bg-fill-hover focus-visible:outline-none! focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
    "data-[state=open]:bg-surface data-[state=open]:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
    "disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      size: {
        sm: "[--in-h:var(--rap-control-h-sm)] text-[0.875rem]",
        md: "[--in-h:var(--rap-control-h)]",
        lg: "[--in-h:var(--rap-control-h-lg)] text-[1.0625rem]",
      },
      invalid: {
        // wins over focus and open, as it did when it came last in the cascade
        true: "shadow-[inset_0_0_0_2px_var(--rap-danger)] focus-visible:shadow-[inset_0_0_0_2px_var(--rap-danger)] data-[state=open]:shadow-[inset_0_0_0_2px_var(--rap-danger)]",
        false: "",
      },
    },
    defaultVariants: { size: "md", invalid: false },
  },
);

/* the slot window: the value rolls in from below, the old one rolls up and away.
   A little headroom (0.3em each way) so the reel is clipped by a window, not by the glyphs. */
export const selectWindowClass =
  "relative grid grid-cols-[minmax(0,1fr)] flex-[1_1_auto] min-w-0 overflow-hidden py-[0.3em] -my-[0.3em] *:[grid-area:1/1]";
export const selectValueClass = "overflow-hidden text-ellipsis whitespace-nowrap group-data-[placeholder]/trigger:text-mute";
export const selectIconClass =
  "size-[18px] flex-none opacity-60 transition-[rotate] duration-(--rap-dur-fast) ease-rm group-data-[state=open]/trigger:rotate-180";

/* the deal: rows of a freshly opened list drop in one after another, 22ms apart (--i set in JS) */
export const dealRowClass = "fun:animate-[rap-deal-in_260ms_var(--rap-ease-out)_calc(var(--i,0)*22ms)_both]";

export const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { size?: "sm" | "md" | "lg" }
>(function SelectTrigger({ className, children, size = "md", ...rest }, ref) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const roll = useRoll(valueRef, { observe: true });
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      data-slot="select-trigger"
      data-size={size}
      className={cn(selectTriggerVariants({ size }), className)}
      {...rest}
    >
      <span data-slot="select-window" className={selectWindowClass}>
        <span ref={valueRef} data-slot="select-value" className={cn(selectValueClass, roll.valueClass)}>
          {children}
        </span>
        {roll.ghost}
      </span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown data-slot="select-icon" className={selectIconClass} aria-hidden />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

/** Number every row of a freshly opened list (--i) so the CSS can deal them in, capped at 12. */
export function dealRows(
  node: HTMLElement | null,
  selector = '[data-slot="select-item"], [data-slot="select-label"], [data-slot="select-separator"]',
) {
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
        data-slot="select-content"
        className={cn(
          "pop min-w-(--radix-select-trigger-width) max-h-[min(var(--radix-select-content-available-height),320px)]",
          className,
        )}
        {...rest}
      >
        <SelectPrimitive.Viewport data-slot="select-viewport" className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef<ElementRef<typeof SelectPrimitive.Item>, ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  function SelectItem({ className, children, ...rest }, ref) {
    return (
      <SelectPrimitive.Item ref={ref} data-slot="select-item" className={cn("menu-item pr-9", dealRowClass, className)} {...rest}>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator data-slot="select-item-indicator" className="absolute right-3 inline-flex text-select">
          <Check size={16} strokeWidth={2.5} />
        </SelectPrimitive.ItemIndicator>
      </SelectPrimitive.Item>
    );
  },
);

export const SelectLabel = forwardRef<ElementRef<typeof SelectPrimitive.Label>, ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(
  function SelectLabel({ className, ...rest }, ref) {
    return <SelectPrimitive.Label ref={ref} data-slot="select-label" className={cn("menu-label", dealRowClass, className)} {...rest} />;
  },
);

export const SelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator({ className, ...rest }, ref) {
  return <SelectPrimitive.Separator ref={ref} data-slot="select-separator" className={cn("menu-separator", dealRowClass, className)} {...rest} />;
});
