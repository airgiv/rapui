import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { ChevronDown } from "../icons";
import { useSound } from "../sound";
import { cx } from "../utils";
import "./Collapsible.css";

/* <Collapsible><CollapsibleTrigger>Title</CollapsibleTrigger><CollapsibleContent>…</CollapsibleContent></Collapsible>

   Delight: opening deals the contents in like cards onto a table — each child drops
   6px into place and fades up, 35ms after the one above (rap-deal-in), riding on the
   height animation rather than waiting for it. If the content is a single wrapper (a
   card with rows in it), its rows are dealt instead, so the idea survives the usual
   markup. Only a real open deals: content that starts open just sits there, and closing
   is the plain collapse, because putting things away shouldn't put on a show.
   Calm / reduced motion: no dealing.
   Sound (opt-in via SoundProvider): pop on open, drop on close, both at half strength. */

export const Collapsible = forwardRef<
  ElementRef<typeof CollapsiblePrimitive.Root>,
  ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>
>(function Collapsible({ className, ...rest }, ref) {
  return <CollapsiblePrimitive.Root ref={ref} className={cx("rap-collapsible", className)} {...rest} />;
});

export interface CollapsibleTriggerProps extends ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> {
  /** Append a chevron that turns when open. Default true; ignored with `asChild`. */
  chevron?: boolean;
  size?: "sm" | "md" | "lg";
}

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
        className={cx("rap-collapsible__trigger", `rap-collapsible__trigger--${size}`, className)}
        {...rest}
      >
        <span className="rap-collapsible__label">{children}</span>
        {chevron && <ChevronDown className="rap-collapsible__chevron" aria-hidden />}
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
    <CollapsiblePrimitive.Content ref={el} className={cx("rap-collapsible__content", className)} {...rest}>
      {children}
    </CollapsiblePrimitive.Content>
  );
});
