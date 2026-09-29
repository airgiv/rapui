import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { cva } from "class-variance-authority";
import { ChevronDown } from "../icons";
import { useSound } from "../sound";
import { cn } from "../utils";
import "./Collapsible.css";

/* <Collapsible><CollapsibleTrigger>Title</CollapsibleTrigger><CollapsibleContent>…</CollapsibleContent></Collapsible>

   Delight: opening deals the contents in like cards onto a table — each child drops
   6px into place and fades up, 35ms after the one above (rap-deal-in), riding on the
   height animation rather than waiting for it. If the content is a single wrapper (a
   card with rows in it), its rows are dealt instead, so the idea survives the usual
   markup. Only a real open deals: content that starts open just sits there, and closing
   is the plain collapse, because putting things away shouldn't put on a show.
   Calm / reduced motion: no dealing.
   A chevron placed by hand (e.g. inside an asChild trigger) turns too: give it
   data-slot="collapsible-chevron".
   Sound (opt-in via SoundProvider): pop on open, drop on close, both at half strength. */

export const Collapsible = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Root>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>
>(function Collapsible({ className, ...rest }, ref) {
  return (
    <CollapsiblePrimitive.Root
      ref={ref}
      data-slot="collapsible"
      className={cn(
        "flex flex-col gap-tight font-sans",
        // chevrons: the trigger's own and any placed by hand inside an asChild trigger
        "[&_[data-slot=collapsible-chevron]]:size-[18px] [&_[data-slot=collapsible-chevron]]:flex-none [&_[data-slot=collapsible-chevron]]:opacity-60",
        "[&_[data-slot=collapsible-chevron]]:transition-transform [&_[data-slot=collapsible-chevron]]:duration-(--rap-dur-fast) [&_[data-slot=collapsible-chevron]]:ease-rm",
        "[&_[data-state=open]>[data-slot=collapsible-chevron]]:rotate-180 [&_[data-state=open]>*>[data-slot=collapsible-chevron]]:rotate-180",
        className,
      )}
      {...rest}
    />
  );
});

export interface CollapsibleTriggerProps extends ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> {
  /** Append a chevron that turns when open. Default true; ignored with `asChild`. */
  chevron?: boolean;
  size?: "sm" | "md" | "lg";
}

/* --co-h drives the height and the side padding together */
const collapsibleTriggerVariants = cva(
  [
    "flex items-center justify-between gap-2 w-full h-(--co-h) pr-[calc(var(--co-h)*0.3)] pl-[calc(var(--co-h)*0.4)]",
    "border-0 rounded-pill bg-fill text-ink font-[inherit] font-medium tracking-[-0.01em] text-left cursor-pointer",
    "transition-[background-color] duration-(--rap-dur-fast) ease-rm hover:bg-fill-hover",
    "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)] disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      size: {
        sm: "[--co-h:var(--rap-control-h-sm)] text-[0.875rem]",
        md: "[--co-h:var(--rap-control-h)] text-[0.9375rem]",
        lg: "[--co-h:var(--rap-control-h-lg)] text-[1rem]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/** A filled pill row by default. Use `asChild` to make any element the trigger. */
export const CollapsibleTrigger = forwardRef<ElementRef<typeof CollapsiblePrimitive.Trigger>, CollapsibleTriggerProps>(
  function CollapsibleTrigger({ className, children, chevron = true, size = "md", asChild, ...rest }, ref) {
    if (asChild)
      return (
        <CollapsiblePrimitive.Trigger ref={ref} asChild className={className} {...rest}>
          {children}
        </CollapsiblePrimitive.Trigger>
      );
    return (
      <CollapsiblePrimitive.Trigger
        ref={ref}
        data-slot="collapsible-trigger"
        data-size={size}
        className={cn(collapsibleTriggerVariants({ size }), className)}
        {...rest}
      >
        <span className="inline-flex items-center gap-2 min-w-0 [&_svg]:size-[18px] [&_svg]:flex-none">{children}</span>
        {chevron && <ChevronDown data-slot="collapsible-chevron" aria-hidden />}
      </CollapsiblePrimitive.Trigger>
    );
  },
);

export const CollapsibleContent = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Content>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(function CollapsibleContent({ className, children, ...rest }, ref) {
  const el = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => el.current as HTMLDivElement);
  const sound = useSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;

  // mark real opens (not the initial state) so only they deal; data-state is Radix's
  useLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    let was = node.getAttribute("data-state");
    const mo = new MutationObserver(() => {
      const now = node.getAttribute("data-state");
      if (now === was) return;
      was = now;
      if (now === "open") {
        node.setAttribute("data-deal", "");
        soundRef.current.play("pop", { strength: 0.5 });
      } else {
        node.removeAttribute("data-deal");
        soundRef.current.play("drop", { strength: 0.5 });
      }
    });
    mo.observe(node, { attributes: true, attributeFilter: ["data-state"] });
    return () => mo.disconnect();
  }, []);

  return (
    <CollapsiblePrimitive.Content
      ref={el}
      data-slot="collapsible-content"
      className={cn(
        // height follows Radix's measured content height (keyframes in Collapsible.css)
        "overflow-hidden data-[state=open]:animate-[rap-collapsible-open_var(--rap-dur)_var(--rap-ease-out)]",
        "data-[state=closed]:animate-[rap-collapsible-close_calc(var(--rap-dur)*0.6)_var(--rap-ease-rm)]",
        // dealt in on a real open (data-deal): the children, or a single wrapper's children, 35ms apart
        "fun:data-deal:data-[state=open]:[&>:not(:only-child)]:animate-[rap-deal-in_300ms_var(--rap-ease-out)_calc(var(--co-i,0)*35ms+30ms)_both]",
        "fun:data-deal:data-[state=open]:[&>:only-child>*]:animate-[rap-deal-in_300ms_var(--rap-ease-out)_calc(var(--co-i,0)*35ms+30ms)_both]",
        "*:nth-2:[--co-i:1] *:nth-3:[--co-i:2] *:nth-4:[--co-i:3] *:nth-5:[--co-i:4] *:nth-6:[--co-i:5] *:nth-7:[--co-i:6] *:nth-[n+8]:[--co-i:7]",
        "*:only:*:nth-2:[--co-i:1] *:only:*:nth-3:[--co-i:2] *:only:*:nth-4:[--co-i:3] *:only:*:nth-5:[--co-i:4]",
        "*:only:*:nth-6:[--co-i:5] *:only:*:nth-7:[--co-i:6] *:only:*:nth-[n+8]:[--co-i:7]",
        className,
      )}
      {...rest}
    >
      {children}
    </CollapsiblePrimitive.Content>
  );
});
