/* ══ Statement ════════════════════════════════════════════
   A big line of words with live parts set in among them — a
   switch between two words, a button where a verb would be, a
   slider in the middle of a sentence. The product, said and
   shown at once.

     <Statement eyebrow="Why rapui">
       Interfaces that <StatementSlot><Switch defaultChecked /></StatementSlot>
       switch on, <StatementSlot><Button size="sm">press</Button></StatementSlot> back…
     </Statement>

   Each look sets the composition its own way:
     fun      huge and flush left; every part sits a little askew
              and straightens when you reach for it
     civic    centred, a large light serif; the parts sit bare in
              the line, a slider on a soft white pill
     signal   flush left in LCD capitals; each part held in segment [brackets]
     product  centred, tight and heavy; a slider or stars on a round chip
     minimal  flush left and large, the parts bare

   The parts are real and keyboard-reachable; the text is one <p>
   (or the heading you pass as `as`), so it reads as a sentence.
   Calm: the fun tilt stays, without the hover swell. */
import { createElement, useLayoutEffect, useRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";
import { Section, type BlockLook, type SectionProps, useBlockLook } from "./Layout";
import { BlockKicker } from "./Hero";
import "./Statement.css";

export interface StatementProps extends Omit<SectionProps, "title"> {
  /** A short kicker above the words. */
  eyebrow?: ReactNode;
  /** The words, with <StatementSlot>s in among them. */
  children: ReactNode;
  /** Element for the words: a paragraph by default, or a heading. */
  textAs?: ElementType;
  /** Something under the words: a link, buttons. */
  footer?: ReactNode;
  look?: BlockLook;
}

export function Statement({ eyebrow, children, textAs = "p", footer, look: lookProp, className, ...rest }: StatementProps) {
  const { ref, look } = useBlockLook<HTMLElement>(lookProp);
  const centred = look === "civic" || look === "product";
  // the live parts scale with the words: zoom = the line's font size over a per-look
  // base (signal's parts sit smaller in its lighter line), never below their own size
  const text = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = text.current;
    if (!el) return;
    const base = look === "signal" ? 52 : look === "civic" ? 62 : 58;
    const fit = () => el.style.setProperty("--slot-zoom", String(Math.max(1, Math.min(2.2, parseFloat(getComputedStyle(el).fontSize) / base)).toFixed(3)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [look]);
  return (
    <Section ref={ref} data-look={look} data-slot="statement" className={cn("rap-statement", className)} {...rest}>
      <div className={cn("@container flex flex-col gap-(--rap-space-lg)", centred && "items-center text-center")}>
        {eyebrow && (
          <BlockKicker look={look} className="rap-statement-kicker">
            {eyebrow}
          </BlockKicker>
        )}
        {createElement(textAs, { ref: text, "data-slot": "statement-text", className: "rap-statement-text" }, children)}
        {footer && <div className={cn("flex flex-wrap gap-3 pt-(--rap-space-xs)", centred && "justify-center")}>{footer}</div>}
      </div>
    </Section>
  );
}

/** A live part inside a Statement's line: set at body size, centred on the line. */
export function StatementSlot({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="statement-slot" className={cn("rap-statement-slot", className)} {...rest} />;
}
