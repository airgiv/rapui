import { forwardRef, useLayoutEffect, useRef, type ComponentPropsWithoutRef, type ElementRef, type ForwardedRef, type ReactNode } from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";
import { cx, prefersReducedMotion } from "../utils";
import "./Separator.css";

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
    return (
      <div ref={node} className={cx("rap-separator-labelled", className)} role={decorative ? "none" : "separator"}>
        <SeparatorPrimitive.Root ref={ref} decorative className="rap-separator rap-separator--horizontal" {...rest} />
        <span className="rap-separator__label">{label}</span>
        <SeparatorPrimitive.Root decorative className="rap-separator rap-separator--horizontal" />
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
      className={cx("rap-separator", `rap-separator--${orientation}`, className)}
      {...rest}
    />
  );
});
