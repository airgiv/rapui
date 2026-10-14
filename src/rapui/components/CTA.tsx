/* ══ CTA ═════════════════════════════════════════════════
   The closing call to action: the last thing a landing page asks.

     <CTA eyebrow="Ready when you are" title="Start shipping on Friday"
          lead="Free for 14 days." actions={<Button icon>Start free</Button>}
          form={<Input placeholder="you@company.com" />} />

   `actions` are buttons or links, `form` an optional field (an email
   input and a button, an "Ask anything" pill), `media` an image or a
   mock beside the words. Each look stages it its own way:

   fun      a huge accent tile with a giant headline, the actions
            set low and right like a round button waiting to be hit
   civic    a navy dark island (Section tone="dark"): serif headline,
            red kicker, a pill field in the middle
   signal   a band with a dot-matrix texture along its top, a mono
            [kicker] and the actions in a ruled side cell
   product  centred and quiet, on a faint grid that fades out from
            the middle
   minimal  one large line of text and an underlined link, on a rule

   Delight (fun): the tile breathes in a hair as the pointer arrives.
   Calm: it stays put. */
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../utils";
import { DotMatrix } from "./DotMatrix";
import { Grid, GridItem, Section, Stack, useBlockLook, type BlockLook, type SectionProps } from "./Layout";
import { Display } from "./Typography";

export interface CTAProps extends Omit<SectionProps, "title" | "children"> {
  eyebrow?: ReactNode;
  /** "07": the section number, in the kicker of the looks that number their sections (signal, minimal). */
  index?: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Buttons or links. */
  actions?: ReactNode;
  /** An image, a mock or a sticker beside the words. */
  media?: ReactNode;
  /** A field to fill in: an email input with a button, an "Ask anything" pill. */
  form?: ReactNode;
  look?: BlockLook;
}

type Parts = Pick<CTAProps, "eyebrow" | "index" | "title" | "lead" | "actions" | "media" | "form">;

const Row = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div data-slot="cta-actions" className={cn("flex flex-wrap items-center gap-(--rap-space-sm)", className)}>
    {children}
  </div>
);

function FunCTA({ eyebrow, title, lead, actions, media, form }: Parts) {
  return (
    <div
      data-slot="cta-tile"
      className={cn(
        "@container relative overflow-hidden rounded-lg bg-accent text-accent-ink p-(--rap-space-xl) @min-[46rem]:p-(--rap-space-2xl)",
        "transition-[scale] duration-(--rap-dur-slow) ease-spring fun:hover:scale-[1.006]",
      )}
    >
      <Grid gap="column" rowGap="xl" className="items-end">
        <GridItem span={media ? 8 : 12} className="flex flex-col gap-(--rap-space-lg)">
          {eyebrow && <p className="m-0 text-[1rem] font-medium tracking-[-0.01em] opacity-85">{eyebrow}</p>}
          <Display size="xxl" className="max-w-[14ch]">
            {title}
          </Display>
        </GridItem>
        {media && (
          <GridItem span={4} data-slot="cta-media" className="flex justify-end">
            {media}
          </GridItem>
        )}
        <GridItem span={6} className="flex flex-col gap-(--rap-space-md)">
          {lead && <p className="m-0 text-display-md leading-[1.3] tracking-[-0.015em] max-w-[30ch] opacity-90">{lead}</p>}
          {form && <div data-slot="cta-form" className="max-w-md">{form}</div>}
        </GridItem>
        {actions && (
          <GridItem span={6}>
            {/* on an accent ground an accent button would vanish: inside the row "accent" means ink */}
            <Row className="@min-[46rem]:justify-end gap-(--rap-space-md) [--rap-accent:var(--rap-ink)] [--rap-accent-ink:var(--rap-paper-2)]">{actions}</Row>
          </GridItem>
        )}
      </Grid>
    </div>
  );
}

function CivicCTA({ eyebrow, title, lead, actions, media, form }: Parts) {
  const words = (
    <Stack gap="lg" align={media ? "start" : "center"} className={cn(!media && "text-center mx-auto max-w-3xl")}>
      {eyebrow && <p className="m-0 text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-flame">{eyebrow}</p>}
      <Display size="xl" className="tracking-[-0.03em]">
        {title}
      </Display>
      {lead && <p className="m-0 max-w-[46ch] text-[1.125rem] leading-relaxed text-ink-2">{lead}</p>}
      {form && (
        <div data-slot="cta-form" className="w-full max-w-xl">
          {form}
        </div>
      )}
      {actions && <Row className={cn(!media && "justify-center")}>{actions}</Row>}
    </Stack>
  );
  if (!media) return words;
  return (
    <Grid gap="column" rowGap="xl" className="items-center">
      <GridItem span={7}>{words}</GridItem>
      <GridItem span={5} data-slot="cta-media" className="overflow-hidden rounded-lg">
        {media}
      </GridItem>
    </Grid>
  );
}

/* the dot texture: a slow twinkle along the band's top edge */
const dots = (c: number, r: number) => (c * 7 + r * 13) % 11 === 0 || (r === 2 && c % 4 === 0);

function SignalCTA({ eyebrow, index, title, lead, actions, media, form }: Parts) {
  return (
    <div data-slot="cta-band" className="relative overflow-hidden rounded-xs bg-paper-2 shadow-[inset_0_0_0_1px_var(--rap-line)]">
      <div aria-hidden className="overflow-hidden border-b border-line px-(--rap-space-md) py-(--rap-space-sm) text-ink-2">
        <DotMatrix cols={180} rows={5} size={3} gap={5} shape="square" pattern={dots} animation="twinkle" period={3200} dim={0.14} />
      </div>
      <Grid gap="tile" className="bg-line">
        <GridItem span={actions || form ? 8 : 12} className="bg-paper-2 p-(--rap-space-lg) flex flex-col gap-(--rap-space-md)">
          {(eyebrow || index) && (
            <p className="m-0 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-2">
              <span className="text-flame">[{index ?? "→"}]</span> {eyebrow}
            </p>
          )}
          <Display size="lg" className="max-w-[18ch]">
            {title}
          </Display>
          {lead && <p className="m-0 max-w-[52ch] text-ink-2 leading-relaxed">{lead}</p>}
          {media && <div data-slot="cta-media">{media}</div>}
        </GridItem>
        {(actions || form) && (
          <GridItem span={4} className="bg-paper-2 p-(--rap-space-lg) flex flex-col justify-end gap-(--rap-space-md)">
            {form && <div data-slot="cta-form">{form}</div>}
            {actions && <Row>{actions}</Row>}
          </GridItem>
        )}
      </Grid>
    </div>
  );
}

/* a faint grid that fades out from the middle: two hairline gradients, masked */
const productBackdrop: CSSProperties = {
  backgroundImage: "linear-gradient(var(--rap-line) 1px, transparent 1px), linear-gradient(90deg, var(--rap-line) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  backgroundPosition: "center center",
  maskImage: "radial-gradient(ellipse 60% 70% at 50% 50%, #000 20%, transparent 75%)",
  WebkitMaskImage: "radial-gradient(ellipse 60% 70% at 50% 50%, #000 20%, transparent 75%)",
};

function ProductCTA({ eyebrow, title, lead, actions, media, form }: Parts) {
  return (
    <div className="relative isolate py-(--rap-space-xl)">
      <div aria-hidden data-slot="cta-backdrop" className="absolute inset-0 -z-1" style={productBackdrop} />
      <Stack gap="md" align="center" className="text-center mx-auto max-w-2xl">
        {eyebrow && (
          <span className="inline-flex items-center h-7 px-3 rounded-pill bg-surface text-[0.8125rem] font-medium text-ink-2 shadow-[inset_0_0_0_1px_var(--rap-edge)]">
            {eyebrow}
          </span>
        )}
        <Display size="xl">{title}</Display>
        {lead && <p className="m-0 max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink-2">{lead}</p>}
        {form && (
          <div data-slot="cta-form" className="w-full max-w-md pt-(--rap-space-xs)">
            {form}
          </div>
        )}
        {actions && <Row className="justify-center pt-(--rap-space-xs)">{actions}</Row>}
        {media && (
          <div data-slot="cta-media" className="w-full pt-(--rap-space-lg)">
            {media}
          </div>
        )}
      </Stack>
    </div>
  );
}

function MinimalCTA({ eyebrow, index, title, lead, actions, media, form }: Parts) {
  return (
    <Stack gap="lg">
      {(eyebrow || index) && (
        <p className="m-0 text-[0.875rem] text-ink-2">
          {index && <span className="text-mute tabular-nums">{index} — </span>}
          {eyebrow}
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-(--rap-space-xl) gap-y-(--rap-space-md)">
        <Display size="lg" className="max-w-[24ch]">
          {title}
        </Display>
        {actions && (
          <Row className="gap-(--rap-space-md) [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 [&_a:hover]:decoration-2">{actions}</Row>
        )}
      </div>
      {(lead || form) && (
        <div className="flex flex-wrap items-start justify-between gap-(--rap-space-md) border-t border-line pt-(--rap-space-md)">
          {lead && <p className="m-0 max-w-[48ch] text-ink-2 leading-relaxed">{lead}</p>}
          {form && <div data-slot="cta-form" className="w-full max-w-sm">{form}</div>}
        </div>
      )}
      {media && <div data-slot="cta-media">{media}</div>}
    </Stack>
  );
}

const LOOKS = { fun: FunCTA, civic: CivicCTA, signal: SignalCTA, product: ProductCTA, minimal: MinimalCTA } as const;

export function CTA({ eyebrow, index, title, lead, actions, media, form, look: lookProp, tone, size, className, ...rest }: CTAProps) {
  const { ref, look } = useBlockLook<HTMLElement>(lookProp);
  const Look = LOOKS[look] ?? FunCTA;
  // civic is a dark island of its own; the others sit on the page (fun brings its own tile)
  const sectionTone = tone ?? (look === "civic" ? "dark" : "plain");
  return (
    <Section
      ref={ref}
      data-look={look}
      data-slot="cta"
      tone={sectionTone}
      size={size ?? (look === "civic" || look === "minimal" ? "lg" : "md")}
      className={cn("rap-cta", className)}
      {...rest}
    >
      <Look eyebrow={eyebrow} index={index} title={title} lead={lead} actions={actions} media={media} form={form} />
    </Section>
  );
}
