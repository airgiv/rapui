/* ══ FAQ ══════════════════════════════════════════════════
   The questions people ask before they sign up, each one opening
   on its answer. The heading sits in a left column, the questions
   on the right; a `contact` slot under the heading catches the
   ones the list doesn't answer.

     <FAQ title="Questions, answered" items={[{ q: "Can I export my notes?", a: "…" }]}
          contact={<a href="/support">Talk to a person →</a>} />

   Built on the library's Collapsible (Radix): each question is a
   real button inside an h3, with aria-expanded and its panel.

   Per look:
     fun      bold rounded rows packed 4px apart; an open row turns
              acid and its + spins into an ×
     civic    centred: the heading on the centre line over a narrow
              list of soft white cards, serif questions, a plain chevron
     signal   airy ruled rows: a {0001} tag, the question in mono, a ⊕ that turns to × when open
     product  one centred narrow column: a hairline card, divided
     minimal  numbered questions between hairlines, a plain + / −

   Delight (fun): the + turns to × on the spring and the answer is
   dealt in line by line. Calm: the same turn on a plain ease; the
   answer just opens. */
import { useState, type ReactNode } from "react";
import { cn } from "../utils";
import { ChevronDown } from "../icons";
import { Grid, GridItem, Section, SectionHeader, Stack, useBlockLook, type BlockLook, type SectionProps } from "./Layout";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./Collapsible";
import { PlusMark } from "./TechMarks";

export interface FAQItem {
  q: string;
  a: ReactNode;
}

export interface FAQProps extends Omit<SectionProps, "title"> {
  eyebrow?: ReactNode;
  index?: string;
  title: ReactNode;
  lead?: ReactNode;
  items: FAQItem[];
  /** "Still have questions?" — shown under the heading (under the list in product). */
  contact?: ReactNode;
  /** Questions open at first, by position. */
  defaultOpen?: number[];
  look?: BlockLook;
}

export function FAQ({ eyebrow, index, title, lead, items, contact, defaultOpen = [], look: lookProp, className, ...rest }: FAQProps) {
  const { ref, look } = useBlockLook(lookProp);
  const list = <FAQList items={items} look={look} defaultOpen={defaultOpen} />;
  const contactBox = contact ? <FAQContact look={look}>{contact}</FAQContact> : null;

  if (look === "product" || look === "civic")
    return (
      <Section ref={ref} data-look={look} data-slot="faq" width="narrow" className={className} {...rest}>
        <Stack gap="xl">
          <SectionHeader eyebrow={eyebrow} index={index} title={title} lead={lead} align="center" />
          {list}
          {contactBox}
        </Stack>
      </Section>
    );

  // heading column / questions column, on the 12 tracks
  const [head, body, start] = look === "signal" ? [4, 8, 5] : look === "minimal" ? [4, 7, 6] : [5, 7, 6];
  return (
    <Section ref={ref} data-look={look} data-slot="faq" className={className} {...rest}>
      <Grid rowGap="xl">
        <GridItem span={head}>
          <Stack gap="lg" className="@min-[46rem]:sticky @min-[46rem]:top-(--rap-space-lg)">
            <SectionHeader eyebrow={eyebrow} index={index} title={title} lead={lead} size={look === "fun" ? "xl" : "lg"} />
            {contactBox}
          </Stack>
        </GridItem>
        <GridItem span={body} start={start}>
          {list}
        </GridItem>
      </Grid>
    </Section>
  );
}

function FAQContact({ look, children }: { look: BlockLook; children: ReactNode }) {
  return (
    <div
      data-slot="faq-contact"
      className={cn(
        "text-[1rem] leading-[1.5] text-ink-2 [&_a]:text-ink [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4",
        look === "fun" && "self-start rounded-card bg-sky p-(--rap-space-md) text-ink",
        look === "civic" && "self-start rounded-card bg-surface p-(--rap-space-md) shadow-[inset_0_0_0_1px_var(--rap-edge)]",
        look === "signal" && "border-t border-line pt-(--rap-space-sm) font-mono text-[0.75rem] uppercase tracking-[0.06em]",
        look === "product" && "text-center text-[0.9375rem] text-mute",
        look === "minimal" && "border-t border-line pt-(--rap-space-sm) text-[0.9375rem]",
      )}
      data-rap-theme={look === "fun" ? "light" : undefined}
    >
      {children}
    </div>
  );
}

/* the per-look dressing of a row, its trigger and its answer */
const ROW: Record<BlockLook, { list: string; item: string; trigger: string; q: string; a: string }> = {
  fun: {
    list: "flex flex-col gap-(--rap-gap-tile)",
    item: "rounded-card bg-surface text-ink transition-colors duration-(--rap-dur-fast) data-[state=open]:bg-acid",
    trigger: "gap-(--rap-space-md) px-(--rap-space-lg) py-(--rap-space-md) rounded-card",
    q: "font-display text-[clamp(1.125rem,1.8vw,1.5rem)] font-medium leading-[1.2] tracking-[-0.025em]",
    a: "px-(--rap-space-lg) pb-(--rap-space-lg) pr-[calc(var(--rap-space-lg)+3.5rem)] text-[1.0625rem] leading-[1.55]",
  },
  civic: {
    list: "flex flex-col gap-(--rap-space-xs)",
    item: "rounded-card bg-surface text-ink",
    trigger: "gap-(--rap-space-md) px-(--rap-space-lg) py-(--rap-space-md) rounded-card",
    q: "font-display text-[1.625rem] font-[var(--rap-display-weight)] leading-[1.2] tracking-[-0.005em]",
    a: "px-(--rap-space-lg) pb-(--rap-space-lg) text-[1rem] leading-[1.65] text-ink-2 max-w-[62ch]",
  },
  signal: {
    list: "flex flex-col border-t border-line",
    item: "border-b border-line text-ink",
    trigger: "grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-(--rap-space-xs) py-(--rap-space-md)",
    q: "text-[1rem] font-medium leading-[1.4] tracking-[-0.01em] group-hover/q:text-ink-2",
    a: "grid grid-cols-[4.5rem_minmax(0,1fr)] gap-(--rap-space-xs) pb-(--rap-space-lg) text-[0.875rem] leading-[1.7] text-ink-2 max-w-[70ch]",
  },
  product: {
    list: "flex flex-col overflow-hidden rounded-card bg-surface shadow-[inset_0_0_0_1px_var(--rap-line)] divide-y divide-line",
    item: "text-ink",
    trigger: "gap-(--rap-space-md) px-(--rap-space-md) py-(--rap-space-md) hover:bg-fill",
    q: "text-[1rem] font-medium leading-[1.4] tracking-[-0.01em]",
    a: "px-(--rap-space-md) pb-(--rap-space-md) text-[0.9375rem] leading-[1.6] text-mute",
  },
  minimal: {
    list: "flex flex-col border-t border-line",
    item: "border-b border-line text-ink",
    trigger: "grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-baseline gap-(--rap-space-sm) py-(--rap-space-md)",
    q: "text-[1.125rem] leading-[1.4] tracking-[-0.01em]",
    a: "pl-[calc(3.5rem+var(--rap-space-sm))] pb-(--rap-space-lg) text-[1rem] leading-[1.6] text-ink-2 max-w-[60ch]",
  },
};

function FAQList({ items, look, defaultOpen }: { items: FAQItem[]; look: BlockLook; defaultOpen: number[] }) {
  const s = ROW[look];
  return (
    <div data-slot="faq-list" className={s.list}>
      {items.map((item, i) => (
        <FAQRow key={i} item={item} i={i} look={look} defaultOpen={defaultOpen.includes(i)} />
      ))}
    </div>
  );
}

function FAQRow({ item, i, look, defaultOpen }: { item: FAQItem; i: number; look: BlockLook; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const s = ROW[look];
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-slot="faq-item"
      data-rap-theme={look === "fun" ? "light" : undefined}
      className={cn("gap-0", s.item)}
    >
      <h3 className="m-0">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            data-slot="faq-trigger"
            className={cn(
              "group/q flex w-full items-center justify-between border-0 bg-transparent p-0 text-left text-inherit font-[inherit] cursor-pointer",
              "transition-colors duration-(--rap-dur-fast) focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--rap-ring)]",
              s.trigger,
            )}
          >
            {look === "signal" && <span aria-hidden className="font-mono text-[0.75rem] text-mute tabular-nums">{`{${String(i + 1).padStart(4, "0")}}`}</span>}
            {look === "minimal" && <span aria-hidden className="text-[0.875rem] text-mute tabular-nums">{String(i + 1).padStart(2, "0")}</span>}
            <span className={cn("min-w-0 flex-1", s.q)}>{item.q}</span>
            <Marker look={look} open={open} />
          </button>
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent>
        <div className={s.a}>
          {look === "signal" && <span aria-hidden className="font-mono text-[0.6875rem] leading-[2.2] uppercase tracking-[0.06em] text-mute">Re:</span>}
          <div className="min-w-0 [&_p]:m-0 [&_p+p]:mt-(--rap-space-xs)">{item.a}</div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* the open/closed marker at the row's end */
function Marker({ look, open }: { look: BlockLook; open: boolean }) {
  if (look === "fun")
    return (
      <span
        aria-hidden
        className={cn(
          "relative flex-none size-11 rounded-full bg-ink text-paper",
          "[transition:rotate_var(--rap-dur)_var(--rap-ease-spring)] calm:[transition:rotate_var(--rap-dur)_var(--rap-ease-out)]",
          "before:absolute before:left-1/2 before:top-1/2 before:w-[40%] before:h-0.5 before:-translate-1/2 before:bg-current",
          "after:absolute after:left-1/2 after:top-1/2 after:w-[40%] after:h-0.5 after:-translate-1/2 after:rotate-90 after:bg-current",
          open && "rotate-[135deg]",
        )}
      />
    );
  if (look === "minimal")
    return (
      <span aria-hidden className="w-4 text-center text-[1.25rem] leading-none text-ink-2">
        {open ? "−" : "+"}
      </span>
    );
  if (look === "civic")
    return (
      <ChevronDown aria-hidden size={20} className={cn("flex-none text-ink-2 transition-transform duration-(--rap-dur-fast)", open && "rotate-180")} />
    );
  if (look === "signal")
    return (
      <PlusMark size={22} className={cn("flex-none text-ink transition-transform duration-(--rap-dur)", open && "rotate-45")} />
    );
  return <ChevronDown aria-hidden size={18} className={cn("flex-none text-mute transition-transform duration-(--rap-dur-fast)", open && "rotate-180")} />;
}
