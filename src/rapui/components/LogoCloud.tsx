/* ══ LogoCloud ════════════════════════════════════════════
   The "trusted by" row: the names of the people who use it. Pass
   logos as nodes, or just names — a name with no logo is set as a
   wordmark in a style that fits the look.

     <LogoCloud title="Trusted by field teams at" logos={[{ name: "Halcyon" }, { name: "Pinegate", logo: <PinegateMark /> }]} />

   fun      a marquee of wordmarks running across a loud toned tile
   civic    a centred row in a soft white card, serif wordmarks
   signal   hairline-ruled cells, each a mono name with its index
   product  a quiet caption over a greyscale row that wakes on hover
   minimal  a plain list of names, separated by hairlines

   Delight (fun): the band runs, and pauses under the pointer so a
   name can be read. Calm: it runs slower, level, its ends feathered
   (Marquee's own calm). Screen readers get the names once, as a list. */
import type { ReactNode } from "react";
import { cn } from "../utils";
import { Grid, GridItem, Section, Stack, useBlockLook, type BlockLook, type SectionProps } from "./Layout";
import { Marquee } from "./Marquee";
import { BlockKicker } from "./Hero";

export interface LogoCloudLogo {
  name: string;
  /** The mark. Without one, the name is set as a wordmark. */
  logo?: ReactNode;
}

export interface LogoCloudProps extends Omit<SectionProps, "title"> {
  /** A short line above the logos, e.g. "Trusted by teams at". */
  title?: ReactNode;
  logos: LogoCloudLogo[];
  look?: BlockLook;
}

/* wordmarks: a name set four different ways in turn, so a row of plain names
   still reads as a row of different brands */
const WORDMARK = [
  "font-display font-semibold tracking-[-0.04em]",
  "font-sans font-bold uppercase tracking-[0.18em] text-[0.72em]",
  "font-display italic font-medium tracking-[-0.02em]",
  "font-sans font-medium lowercase tracking-[-0.03em]",
];

function Mark({ logo, i, plain, className }: { logo: LogoCloudLogo; i: number; plain?: boolean; className?: string }) {
  return (
    <span data-slot="logo" className={cn("inline-flex items-center whitespace-nowrap leading-none [&_svg]:h-[1.1em] [&_svg]:w-auto", !logo.logo && !plain && WORDMARK[i % WORDMARK.length], className)}>
      {logo.logo ?? logo.name}
    </span>
  );
}

/* the names once, for assistive tech, when the visible row is decoration (a marquee) */
const SrList = ({ logos }: { logos: LogoCloudLogo[] }) => (
  <ul className="sr-only">
    {logos.map((l) => (
      <li key={l.name}>{l.name}</li>
    ))}
  </ul>
);

export function LogoCloud({ title, logos, look: lookProp, size, className, ...rest }: LogoCloudProps) {
  const { ref, look } = useBlockLook<HTMLElement>(lookProp);
  const label = typeof title === "string" ? title : "Customers";
  return (
    <Section ref={ref} data-look={look} data-slot="logo-cloud" size={size ?? "sm"} aria-label={label} className={cn("rap-logo-cloud", className)} {...rest}>
      {look === "fun" && (
        <div className="overflow-hidden rounded-lg bg-blue py-(--rap-space-xl) text-white">
          <Stack gap="lg">
            {title && <p className="m-0 px-(--rap-space-lg) text-center text-sm font-medium opacity-80">{title}</p>}
            <SrList logos={logos} />
            <Marquee aria-hidden duration={30} gap="clamp(2rem,5vw,4.5rem)" className="text-display-lg">
              {logos.map((l, i) => (
                <Mark key={l.name} logo={l} i={i} className="transition-transform duration-(--rap-dur) ease-spring fun:hover:-rotate-3 fun:hover:scale-105" />
              ))}
            </Marquee>
          </Stack>
        </div>
      )}

      {look === "civic" && (
        <div className="rounded-lg bg-surface px-(--rap-space-lg) py-(--rap-space-xl) shadow-[inset_0_0_0_1px_var(--rap-edge)]">
          <Stack gap="lg" align="center">
            {title && <BlockKicker look="civic">{title}</BlockKicker>}
            <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-x-(--rap-space-xl) gap-y-(--rap-space-md) p-0 text-[1.5rem] text-ink-2">
              {logos.map((l, i) => (
                <li key={l.name}>
                  <Mark logo={l} i={i} />
                </li>
              ))}
            </ul>
          </Stack>
        </div>
      )}

      {look === "signal" && (
        <Stack gap="md">
          {title && <BlockKicker look="signal" index="—">{title}</BlockKicker>}
          <div className="border-y border-line">
            <Grid cols={[2, 3, Math.min(Math.max(logos.length, 1), 6)]} gap="none" role="list" className="overflow-hidden [&>*]:shadow-[-1px_0_0_var(--rap-line),0_-1px_0_var(--rap-line)]">
              {logos.map((l, i) => (
                <div key={l.name} role="listitem" className="flex min-h-24 flex-col justify-between gap-3 p-(--rap-space-sm)">
                  <span aria-hidden className="font-mono text-[0.6875rem] text-mute">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Mark logo={l} i={i} plain className="font-mono text-sm uppercase tracking-[0.08em] text-ink [&_svg]:grayscale" />
                </div>
              ))}
            </Grid>
          </div>
        </Stack>
      )}

      {look === "product" && (
        <Stack gap="lg" align="center">
          {title && <p className="m-0 text-center text-sm text-mute">{title}</p>}
          <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-x-(--rap-space-xl) gap-y-(--rap-space-md) p-0 text-[1.375rem] text-ink-2">
            {logos.map((l, i) => (
              <li key={l.name} className="opacity-60 grayscale transition-[opacity,filter] duration-(--rap-dur) ease-soft hover:opacity-100 hover:grayscale-0">
                <Mark logo={l} i={i} />
              </li>
            ))}
          </ul>
        </Stack>
      )}

      {look === "minimal" && (
        <Grid rowGap="md">
          {title && (
            <GridItem span={3}>
              <p className="m-0 text-sm text-ink-2">{title}</p>
            </GridItem>
          )}
          <GridItem span={title ? 9 : 12}>
            <ul className="m-0 grid list-none grid-cols-1 gap-x-(--rap-column-gap) p-0 @md:grid-cols-2 @3xl:grid-cols-3">
              {logos.map((l, i) => (
                <li key={l.name} className="flex items-baseline justify-between gap-4 border-t border-line py-(--rap-space-sm) text-base text-ink">
                  <Mark logo={l} i={i} plain />
                  <span aria-hidden className="text-xs tabular-nums text-mute">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </li>
              ))}
            </ul>
          </GridItem>
        </Grid>
      )}
    </Section>
  );
}
