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
     civic    centred, a large light serif; each part rests on a
              soft white pill, the way a public-service front page
              sets small round pictures into its sentences
     signal   flush left in Plex; each part held in rust [brackets]
     product  centred, tight and heavy; each part in a hairline chip
     minimal  flush left and large, the parts bare

   The parts are real and keyboard-reachable; the text is one <p>
   (or the heading you pass as `as`), so it reads as a sentence.
   Calm: the fun tilt stays, without the hover swell. */
import { createElement, type ElementType, type HTMLAttributes, type ReactNode } from "react";
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
  return (
    <Section ref={ref} data-look={look} data-slot="statement" className={cn("rap-statement", className)} {...rest}>
      <div className={cn("@container flex flex-col gap-(--rap-space-lg)", centred && "items-center text-center")}>
        {eyebrow && <BlockKicker look={look}>{eyebrow}</BlockKicker>}
        {createElement(textAs, { "data-slot": "statement-text", className: "rap-statement-text" }, children)}
        {footer && <div className={cn("flex flex-wrap gap-3 pt-(--rap-space-xs)", centred && "justify-center")}>{footer}</div>}
      </div>
    </Section>
  );
}

/** A live part inside a Statement's line: set at body size, centred on the line. */
export function StatementSlot({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="statement-slot" className={cn("rap-statement-slot", className)} {...rest} />;
}
