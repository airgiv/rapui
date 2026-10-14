/* ══ Stats ════════════════════════════════════════════════
   Key numbers: a handful of figures with a label each, and an
   optional note. Give it a title for a SectionHeader on top.

     <Stats title="Kestrel in numbers" items={[{ value: 1.2, suffix: "M", label: "Sightings logged" }]} />

   fun      colourful tiles packed 4px apart, each a huge number
   civic    soft white cards, a short red rule, serif numbers
   signal   hairline-ruled cells with mono labels; the first figure
            is drawn in dots (DotText) beside a dot-matrix bar chart
   product  the numbers in a row, hairlines between them
   minimal  a list: big numbers on the left, words on the right,
            a rule above each row

   Delight (fun): numeric values count up from zero as they scroll
   into view. Calm: the figure is simply there (Counter fades it in
   only in fun; other looks print it). */
import type { ReactNode } from "react";
import { cn } from "../utils";
import { Grid, Section, SectionHeader, Stack, useBlockLook, type BlockLook, type SectionProps } from "./Layout";
import { Display } from "./Typography";
import { Counter } from "./Counter";
import { DotText } from "./DotText";
import { DotMatrix } from "./DotMatrix";

export interface StatItem {
  value: string | number;
  label: string;
  note?: string;
  prefix?: string;
  suffix?: string;
}

export interface StatsProps extends Omit<SectionProps, "title"> {
  eyebrow?: ReactNode;
  /** "02" — the header's index where the preset numbers sections. */
  index?: string;
  title?: ReactNode;
  lead?: ReactNode;
  items: StatItem[];
  look?: BlockLook;
}

/* the figure as text: numbers get thousands separators */
const show = (it: StatItem) => `${it.prefix ?? ""}${typeof it.value === "number" ? it.value.toLocaleString("en-US") : it.value}${it.suffix ?? ""}`;

/* fun: rolls up when it comes into view */
function Figure({ item }: { item: StatItem }) {
  if (typeof item.value !== "number") return <>{show(item)}</>;
  const decimals = String(item.value).split(".")[1]?.length ?? 0;
  return <Counter to={item.value} decimals={decimals} prefix={item.prefix} suffix={item.suffix} />;
}

/* fun tiles: the loud colours with the ink each takes (the light ones keep a
   fixed near-black, as Highlight does, so they stay legible in dark mode) */
const TILES = ["bg-flame text-white", "bg-acid text-[#282828]", "bg-sky text-[#282828]", "bg-bubble text-[#282828]", "bg-blue text-white"];

const ruled = "overflow-hidden [&>*]:shadow-[-1px_0_0_var(--rap-line),0_-1px_0_var(--rap-line)]";

export function Stats({ eyebrow, index, title, lead, items, look: lookProp, className, ...rest }: StatsProps) {
  const { ref, look } = useBlockLook<HTMLElement>(lookProp);
  const n = Math.max(1, Math.min(items.length, 4));
  const cols: [number, number, number] = [1, Math.min(n, 2), n];
  const header = title ? (
    <SectionHeader eyebrow={eyebrow} index={index} title={title} lead={lead} align={look === "product" ? "center" : "start"} size={look === "fun" ? "xl" : "lg"} />
  ) : null;

  return (
    <Section ref={ref} data-look={look} data-slot="stats" className={cn("rap-stats", className)} {...rest}>
      <Stack gap="xl">
        {header}
        {look === "fun" && (
          <Grid cols={cols} gap="tile" role="list">
            {items.map((it, i) => (
              <div
                key={it.label}
                role="listitem"
                className={cn(
                  "@container flex min-h-[15rem] flex-col justify-between gap-(--rap-space-lg) rounded-lg p-(--rap-space-lg)",
                  "transition-[rotate,scale] duration-(--rap-dur) ease-spring fun:hover:-rotate-1 fun:hover:scale-[1.015]",
                  TILES[i % TILES.length],
                )}
              >
                <Display as="p" size="xxl" className="text-[length:clamp(3rem,24cqi,8rem)] leading-[0.88]">
                  <Figure item={it} />
                </Display>
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-lg font-medium leading-tight">{it.label}</p>
                  {it.note && <p className="m-0 text-sm opacity-75">{it.note}</p>}
                </div>
              </div>
            ))}
          </Grid>
        )}

        {look === "civic" && (
          <Grid cols={cols} role="list">
            {items.map((it) => (
              <div key={it.label} role="listitem" className="flex flex-col gap-(--rap-space-sm) rounded-lg bg-surface p-(--rap-space-lg) shadow-[inset_0_0_0_1px_var(--rap-edge)]">
                <span aria-hidden className="h-[3px] w-8 bg-flame" />
                <Display as="p" size="xl" className="pt-(--rap-space-xs) text-plum">
                  {show(it)}
                </Display>
                <p className="m-0 text-base font-semibold text-ink">{it.label}</p>
                {it.note && <p className="m-0 text-sm leading-normal text-ink-2">{it.note}</p>}
              </div>
            ))}
          </Grid>
        )}

        {look === "signal" && <SignalStats items={items} />}

        {look === "product" && (
          <Grid cols={cols} gap="none" role="list" className={ruled}>
            {items.map((it) => (
              <div key={it.label} role="listitem" className="flex flex-col gap-2 px-(--rap-space-lg) py-(--rap-space-md) text-center">
                <Display as="p" size="lg" className="tabular-nums">
                  {show(it)}
                </Display>
                <p className="m-0 text-sm font-medium text-ink">{it.label}</p>
                {it.note && <p className="m-0 text-sm text-mute">{it.note}</p>}
              </div>
            ))}
          </Grid>
        )}

        {look === "minimal" && (
          <ol className="m-0 list-none border-b border-line p-0">
            {items.map((it, i) => (
              <li key={it.label} className="grid grid-cols-1 items-baseline gap-x-(--rap-column-gap) gap-y-2 border-t border-line py-(--rap-space-md) @3xl:grid-cols-[3rem_minmax(0,7fr)_minmax(0,5fr)]">
                <span aria-hidden className="hidden text-xs tabular-nums text-mute @3xl:block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Display as="p" size="xl" className="tabular-nums">
                  {show(it)}
                </Display>
                <div className="flex flex-col gap-1 text-sm">
                  <p className="m-0 text-ink">{it.label}</p>
                  {it.note && <p className="m-0 text-ink-2">{it.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Stack>
    </Section>
  );
}

/* signal: the lead figure drawn in dots across a full-width cell, the rest as a row of ruled readouts */
function SignalStats({ items }: { items: StatItem[] }) {
  const [first, ...more] = items;
  if (!first) return null;
  const m = Math.max(1, Math.min(more.length, 4));
  /* bars that climb, like a level meter */
  const bars = (c: number, r: number) => r >= 6 - Math.round(1 + ((c * 7) % 11) / 2.2);
  return (
    <div className="border-y border-line">
      <Grid cols={[1, Math.min(m, 2), m]} gap="none" role="list" className={ruled}>
        <div role="listitem" className="col-span-full flex flex-col gap-(--rap-space-md) p-(--rap-space-md) @3xl:flex-row @3xl:items-end @3xl:justify-between">
          <div className="flex min-w-0 flex-col gap-(--rap-space-sm)">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-2">
              <span aria-hidden className="text-flame">[01] </span>
              {first.label}
            </span>
            <DotText fontSize={150} weight={500} className="max-w-full text-flame">
              {show(first)}
            </DotText>
          </div>
          <div className="flex flex-col items-start gap-(--rap-space-sm) @3xl:items-end">
            <DotMatrix cols={22} rows={6} size={5} gap={3} shape="square" pattern={bars} animation="scan" period={1400} className="text-ink" />
            {first.note && <span className="font-mono text-xs uppercase tracking-[0.06em] text-mute">{first.note}</span>}
          </div>
        </div>
        {more.map((it, i) => (
          <div key={it.label} role="listitem" className="flex flex-col gap-(--rap-space-sm) p-(--rap-space-md)">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-2">
              <span aria-hidden className="text-flame">[{String(i + 2).padStart(2, "0")}] </span>
              {it.label}
            </span>
            <Display as="p" size="lg" className="tabular-nums">
              {show(it)}
            </Display>
            {it.note && <span className="font-mono text-xs uppercase tracking-[0.06em] text-mute">{it.note}</span>}
          </div>
        ))}
      </Grid>
    </div>
  );
}
