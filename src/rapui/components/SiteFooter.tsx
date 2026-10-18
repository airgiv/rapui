/* ══ SiteFooter ══════════════════════════════════════════
   The foot of a landing page: the brand, columns of links, the
   fine print.

     <SiteFooter logo={<Logo />} tagline="Field notes for teams."
                 columns={[{ title: "Product", links: [{ label: "Pricing", href: "#pricing" }] }]}
                 bottom="© 2026 Fieldnote Ltd." social={<SocialLinks />} />

   The columns sit in one `<nav aria-label="Footer">`, each a
   heading over a list. Each look sets it its own way:

   fun      a dark rounded tile, the columns up top and the brand's
            name across the bottom at wordmark size (`wordmark`)
   civic    a navy dark island: a seal slot (`mark`) by the logo,
            columns, then the fine print under a rule
   signal   the last band of the square grid: name and tagline, link
            columns with {0001} tags, a dial clock, and the `wordmark`
            across the width in dots above the fine print
   product  quiet grey columns under a hairline
   minimal  a single row: the logo, every link, the year

   Delight (fun): the giant wordmark leans in a touch under the hand.
   Calm: it stays still; the dot strip glows without a pulse. */
import type { ReactNode } from "react";
import { cn } from "../utils";
import { DotText } from "./DotText";
import { ModCell, ModGrid } from "./ModGrid";
import { TechClock } from "./TechMarks";
import { Grid, GridItem, Section, Stack, useBlockLook, type BlockLook, type SectionProps } from "./Layout";

export interface SiteFooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface SiteFooterProps extends Omit<SectionProps, "title" | "children"> {
  logo: ReactNode;
  tagline?: ReactNode;
  columns?: SiteFooterColumn[];
  /** The fine print: copyright, legal links, an address. */
  bottom?: ReactNode;
  /** Social links or icons. */
  social?: ReactNode;
  /** fun: the brand's name, set across the bottom at wordmark size. */
  wordmark?: string;
  /** civic: a seal or emblem beside the logo. */
  mark?: ReactNode;
  look?: BlockLook;
}

type Parts = Omit<SiteFooterProps, "look" | keyof SectionProps>;

function Columns({
  columns,
  look,
  heading,
  link,
  gridClass,
  cellClass,
}: {
  columns: SiteFooterColumn[];
  look: BlockLook;
  heading: string;
  link: string;
  gridClass?: string;
  cellClass?: string;
}) {
  return (
    <nav aria-label="Footer" data-slot="site-footer-nav">
      <Grid cols={[2, Math.min(columns.length, 4), Math.min(columns.length, 4)] as [number, number, number]} gap={look === "signal" ? "tile" : "column"} rowGap={look === "signal" ? "tile" : "lg"} className={gridClass}>
        {columns.map((col) => (
          <div key={col.title} data-slot="site-footer-column" className={cn("flex flex-col gap-(--rap-space-sm)", cellClass)}>
            <h2 className={cn("m-0", heading)}>
              {col.title}
            </h2>
            <ul className="m-0 p-0 list-none flex flex-col gap-(--rap-space-xs)">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <a href={l.href} className={cn("transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", link)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Grid>
    </nav>
  );
}

function FunFooter({ logo, tagline, columns = [], bottom, social, wordmark }: Parts) {
  return (
    <Stack gap="xl">
      <Grid gap="column" rowGap="xl">
        <GridItem span={4} className="flex flex-col gap-(--rap-space-md)">
          <div className="text-[1.75rem]">{logo}</div>
          {tagline && <p className="m-0 max-w-[30ch] text-[1.0625rem] leading-snug text-ink-2">{tagline}</p>}
          {social && <div className="flex flex-wrap gap-(--rap-space-xs)">{social}</div>}
        </GridItem>
        <GridItem span={8}>
          <Columns
            columns={columns}
            look="fun"
            heading="text-[0.875rem] font-medium text-mute"
            link="text-[1.0625rem] font-medium text-ink hover:text-flame"
          />
        </GridItem>
      </Grid>
      {bottom && <div className="flex flex-wrap justify-between gap-(--rap-space-sm) border-t border-line pt-(--rap-space-md) text-[0.875rem] text-ink-2">{bottom}</div>}
      {wordmark && (
        /* sized from the room (cqi) and the word's length, so any name runs edge to edge */
        <p
          aria-hidden
          data-slot="site-footer-wordmark"
          className="m-0 font-display font-[450] leading-[0.9] tracking-[var(--rap-display-tracking-mega,-0.06em)] [text-transform:var(--rap-display-case,none)] whitespace-nowrap origin-bottom-left transition-[scale] duration-(--rap-dur-slow) ease-spring fun:hover:scale-[1.015]"
          style={{ fontSize: `clamp(3rem, ${(100 / (Math.max(wordmark.length, 3) * 0.5)).toFixed(1)}cqi, 22rem)` }}
        >
          {wordmark}
        </p>
      )}
    </Stack>
  );
}

function CivicFooter({ logo, tagline, columns = [], bottom, social, mark }: Parts) {
  return (
    <Stack gap="xl">
      <Grid gap="column" rowGap="xl">
        <GridItem span={4} className="flex flex-col gap-(--rap-space-md)">
          <div className="flex items-center gap-(--rap-space-sm)">
            {mark && <div data-slot="site-footer-mark" className="grid place-items-center shrink-0 size-14 rounded-full shadow-[inset_0_0_0_1px_var(--rap-line)]">{mark}</div>}
            <div className="text-[1.25rem] font-semibold">{logo}</div>
          </div>
          {tagline && <p className="m-0 max-w-[30ch] font-display text-[1.75rem] leading-[1.2] tracking-[-0.005em] text-ink">{tagline}</p>}
        </GridItem>
        <GridItem span={8}>
          <Columns
            columns={columns}
            look="civic"
            heading="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-mute"
            link="text-[0.9375rem] text-ink-2 hover:text-ink hover:underline underline-offset-4"
          />
        </GridItem>
      </Grid>
      {(bottom || social) && (
        <div className="flex flex-wrap items-center justify-between gap-(--rap-space-md) border-t border-line pt-(--rap-space-md) text-[0.875rem] text-ink-2">
          <div>{bottom}</div>
          {social && <div className="flex flex-wrap gap-(--rap-space-xs)">{social}</div>}
        </div>
      )}
    </Stack>
  );
}

function SignalFooter({ logo, tagline, columns = [], bottom, social, wordmark }: Parts) {
  /* the last band of the square grid: the name and tagline, a column of links per cell
     pair, a clock in the corner, then the name again across the width in dots */
  return (
    <ModGrid marks>
      <ModCell c={["1 / -1", "1 / span 4", "1 / span 4"]} r={[undefined, "span 2", "1 / span 2"]} className="flex flex-col gap-(--rap-space-sm)">
        <div>{logo}</div>
        {tagline && <p className="m-0 max-w-[30ch] text-[0.9375rem] leading-snug text-mute">{tagline}</p>}
        {social && <div className="mt-auto flex flex-wrap gap-(--rap-space-xs)">{social}</div>}
      </ModCell>
      <ModCell c={["1 / -1", "5 / span 4", "5 / span 6"]} r={[undefined, "span 2", "1 / span 2"]} inset={false}>
        <nav aria-label="Footer" data-slot="site-footer-nav" className="grid grid-cols-2 @min-[40rem]:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
          {columns.map((col, i) => (
            <div key={col.title} data-slot="site-footer-column" className="flex flex-col gap-(--rap-space-sm) p-(--mod-pad)">
              <h2 className="m-0 font-mono text-[0.75rem] font-normal uppercase tracking-[0.06em] text-ink">
                <span className="text-mute tabular-nums">{`{${String(i + 1).padStart(4, "0")}}`}</span> {col.title}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-(--rap-space-xs) p-0">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <a href={l.href} className="text-[0.9375rem] text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ModCell>
      <ModCell aria-hidden c={[null, null, "12 / span 1"]} r={[undefined, undefined, "1"]} className="flex justify-end">
        <TechClock size="100%" className="h-auto w-full max-w-[5.5rem]" />
      </ModCell>
      {wordmark && (
        <ModCell c={["1 / -1", "1 / -1", "1 / -1"]} className="flex items-end">
          <DotText matrix off aria-hidden field={{ cols: 96, rows: 11 }} pad={[2, 2]} className="w-full text-ink">
            {wordmark.toUpperCase()}
          </DotText>
        </ModCell>
      )}
      {bottom && (
        <ModCell c={["1 / -1", "1 / -1", "1 / -1"]} className="flex flex-wrap items-end justify-between gap-(--rap-space-sm) font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-mute">
          {bottom}
        </ModCell>
      )}
    </ModGrid>
  );
}

function ProductFooter({ logo, tagline, columns = [], bottom, social, wordmark }: Parts) {
  return (
    <Stack gap="xl" className="@container">
      <Grid gap="column" rowGap="xl">
        <GridItem span={4} className="flex flex-col gap-(--rap-space-sm)">
          <div>{logo}</div>
          {tagline && <p className="m-0 max-w-[30ch] text-[0.875rem] leading-relaxed text-mute">{tagline}</p>}
          {social && <div className="flex flex-wrap gap-(--rap-space-2xs) pt-(--rap-space-xs) text-mute">{social}</div>}
        </GridItem>
        <GridItem span={8}>
          <Columns columns={columns} look="product" heading="text-[0.875rem] font-medium text-ink" link="text-[0.875rem] text-mute hover:text-ink" />
        </GridItem>
      </Grid>
      {bottom && <div className="flex flex-wrap justify-between gap-(--rap-space-sm) border-t border-line pt-(--rap-space-md) text-[0.8125rem] text-mute">{bottom}</div>}
      {wordmark && (
        /* the name, edge to edge, fading into the page: a signature, not a shout */
        <p
          aria-hidden
          data-slot="site-footer-wordmark"
          className="m-0 -mb-[0.12em] font-display font-semibold leading-[0.85] tracking-[-0.06em] whitespace-nowrap text-transparent bg-clip-text bg-[linear-gradient(to_bottom,var(--rap-fill-strong),transparent_85%)] select-none"
          style={{ fontSize: `clamp(3rem, ${(100 / (Math.max(wordmark.length, 3) * 0.64)).toFixed(1)}cqi, 22rem)` }}
        >
          {wordmark}
        </p>
      )}
    </Stack>
  );
}

function MinimalFooter({ logo, columns = [], bottom, social }: Parts) {
  const links = columns.flatMap((c) => c.links);
  return (
    <div className="flex flex-wrap items-baseline gap-x-(--rap-space-lg) gap-y-(--rap-space-sm) text-[0.875rem]">
      <div className="text-ink">{logo}</div>
      {links.length > 0 && (
        <nav aria-label="Footer" data-slot="site-footer-nav">
          <ul className="m-0 p-0 list-none flex flex-wrap gap-x-(--rap-space-md) gap-y-(--rap-space-2xs)">
            {links.map((l) => (
              <li key={l.href + l.label}>
                <a href={l.href} className="text-ink-2 decoration-1 underline-offset-4 hover:text-ink hover:underline">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {social}
      <div className="ml-auto text-ink-2">{bottom ?? <>© {new Date().getFullYear()}</>}</div>
    </div>
  );
}

const LOOKS = { fun: FunFooter, civic: CivicFooter, signal: SignalFooter, product: ProductFooter, minimal: MinimalFooter } as const;

export function SiteFooter({ logo, tagline, columns, bottom, social, wordmark, mark, look: lookProp, tone, size, className, ...rest }: SiteFooterProps) {
  const { ref, look } = useBlockLook<HTMLElement>(lookProp);
  const Look = LOOKS[look] ?? FunFooter;
  // fun and civic are dark islands; the others sit on the page, under the preset's rule
  const sectionTone = tone ?? (look === "fun" || look === "civic" ? "dark" : "plain");
  return (
    <Section
      ref={ref}
      as="footer"
      data-look={look}
      data-slot="site-footer"
      tone={sectionTone}
      size={size ?? (look === "minimal" ? "sm" : look === "fun" ? "md" : "sm")}
      className={cn("rap-site-footer", look === "product" && "shadow-[inset_0_1px_0_var(--rap-line)]", look === "fun" && "pb-(--rap-space-lg)", className)}
      {...rest}
    >
      <Look logo={logo} tagline={tagline} columns={columns} bottom={bottom} social={social} wordmark={wordmark} mark={mark} />
    </Section>
  );
}
