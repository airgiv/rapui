import { forwardRef, useLayoutEffect, useRef, type ComponentPropsWithoutRef, type ElementRef, type ForwardedRef, type ReactNode } from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";
import { cn, prefersReducedMotion } from "../utils";

/* ── Separator ─────────────────────────────────────────────
   Delight: the rule is drawn, like a pen stroke from the middle
   of the page out to both margins, the first time it scrolls
   into view — a divider that arrives with the content it
   divides. `scale` from 0 around its centre over 700ms on the
   out-ease: quick to leave the centre, slow to reach the edges.
   A labelled rule draws its two halves away from the label, so
   the word appears to push them apart.

   The hidden start state is set from JS (data-draw="wait") only
   when an IntersectionObserver is there to finish it, so without
   JS, under calm or with reduced motion the line is simply on
   the page. Once drawn it stays drawn. */

const isCalm = (el: Element | null) => prefersReducedMotion() || !!el?.closest('[data-rap-motion="calm"]');

function setRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** Draw `el` once it is on screen. */
function useDrawIn(node: { current: HTMLElement | null }) {
  useLayoutEffect(() => {
    const el = node.current;
    if (!el || typeof IntersectionObserver === "undefined" || isCalm(el)) return;
    el.setAttribute("data-draw", "wait");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // a frame in the wait state first, so the transition has somewhere to start from
        requestAnimationFrame(() => el.setAttribute("data-draw", "in"));
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.removeAttribute("data-draw");
    };
  }, [node]);
}

const LINE = "flex-none bg-line";

export interface SeparatorProps extends ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /** Text in the middle of a horizontal rule, e.g. "or". */
  label?: ReactNode;
}

/** Hairline divider (Radix Separator). Horizontal or vertical; optional centred label. */
export const Separator = forwardRef<ElementRef<typeof SeparatorPrimitive.Root>, SeparatorProps>(function Separator(
  { orientation = "horizontal", decorative = true, label, className, ...rest },
  ref,
) {
  const node = useRef<HTMLDivElement | null>(null);
  useDrawIn(node);
  const labelled = label != null && orientation === "horizontal";

  if (labelled) {
    // labelled: each half grows away from the label (origin at the label side),
    // and the label fades up as they part — the word pushes them apart
    const half = cn(
      LINE,
      "flex-1 w-auto h-px",
      "group-data-draw/sep:transition-[scale] group-data-draw/sep:duration-700 group-data-draw/sep:ease-soft",
      "group-data-[draw=wait]/sep:scale-x-0 calm:group-data-[draw=wait]/sep:scale-none",
    );
    return (
      <div
        ref={node}
        data-slot="separator-labelled"
        className={cn("group/sep flex items-center gap-3.5 w-full", className)}
        role={decorative ? "none" : "separator"}
      >
        <SeparatorPrimitive.Root ref={ref} decorative data-slot="separator" className={cn(half, "group-data-draw/sep:origin-right")} {...rest} />
        <span
          data-slot="separator-label"
          className={cn(
            "flex-none font-sans text-[0.8125rem] font-medium tracking-[-0.01em] text-mute",
            "group-data-draw/sep:[transition:opacity_400ms_var(--rap-ease-out),scale_500ms_var(--rap-ease-spring)]",
            "group-data-[draw=wait]/sep:opacity-0 group-data-[draw=wait]/sep:scale-80",
            "calm:group-data-[draw=wait]/sep:opacity-100 calm:group-data-[draw=wait]/sep:scale-none",
          )}
        >
          {label}
        </span>
        <SeparatorPrimitive.Root decorative data-slot="separator" className={cn(half, "group-data-draw/sep:origin-left")} />
      </div>
    );
  }
  return (
    <SeparatorPrimitive.Root
      ref={(el: HTMLDivElement | null) => {
        node.current = el;
        setRef(ref, el);
      }}
      orientation={orientation}
      decorative={decorative}
      data-slot="separator"
      className={cn(
        LINE,
        orientation === "horizontal" ? "w-full h-px" : "w-px h-auto self-stretch min-h-[1em]",
        // delight: drawn from the centre out, 700ms on the out-ease
        "data-draw:transition-[scale] data-draw:duration-700 data-draw:ease-soft calm:data-[draw=wait]:scale-none",
        orientation === "horizontal" ? "data-[draw=wait]:scale-x-0" : "data-[draw=wait]:scale-y-0",
        className,
      )}
      {...rest}
    />
  );
});
