/* ══ Stats ════════════════════════════════════════════════
   Key numbers: a handful of figures with a label each, and an
   optional note. Give it a title for a SectionHeader on top.

     <Stats title="Kestrel in numbers" items={[{ value: 1.2, suffix: "M", label: "Sightings logged" }]} />

   fun      colourful tiles packed 4px apart, each a huge number
   civic    soft white cards, centred light serif numbers
   signal   on the square-cell ModGrid: the first figure in big white
            dots on a black DotScreen, the rest as black dot-matrix
            readouts on grey dot fields with {0002} tags
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
import { ModCell, ModGrid } from "./ModGrid";
import { DotScreen, SquareMarks, TickCircle } from "./TechMarks";

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
  // two up even on a phone: a number and its label are short, four stacked cards are a long scroll
  const cols: [number, number, number] = [Math.min(n, 2), Math.min(n, 2), n];
  const header = title ? (
    <SectionHeader eyebrow={eyebrow} index={index} title={title} lead={lead} align={look === "product" || look === "civic" ? "center" : "start"} size={look === "fun" ? "xl" : "lg"} />
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
              <div key={it.label} role="listitem" className="flex flex-col items-center gap-(--rap-space-xs) rounded-lg bg-surface px-(--rap-space-md) py-(--rap-space-xl) text-center">
                <Display as="p" size="xl" className="text-plum">
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

/* signal: the lead figure as big white dots on a black screen (four square cells), the
   rest as black dot-matrix readouts on grey dot fields, each in its own block of cells */
function SignalStats({ items }: { items: StatItem[] }) {
  const [first, ...more] = items;
  if (!first) return null;
  const tag = (i: number) => `{${String(i + 1).padStart(4, "0")}}`;
  return (
    <ModGrid marks role="list">
      <ModCell role="listitem" c={["1 / -1", "1 / span 4", "1 / span 3"]} r={[undefined, "1 / span 4", "1 / span 3"]} className="flex">
        <DotScreen className="flex aspect-square w-full flex-col justify-between p-[clamp(14px,2.2cqi,26px)]">
          <div className="flex items-center justify-between font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-mute">
            <span>{first.label}</span>
            <span className="tabular-nums">{tag(0)}</span>
          </div>
          <DotText matrix off field={{ cols: 20, rows: 9 }} pad={[1, 1]} align="center" className="w-full">
            {show(first)}
          </DotText>
          <span className="text-center font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-2">{first.note ?? "\u00a0"}</span>
        </DotScreen>
      </ModCell>
      {more.map((it, i) => (
        <ModCell
          key={it.label}
          role="listitem"
          ruled
          c={["1 / -1", "span 4", `${i % 2 ? 9 : 5} / span 3`]}
          r={[undefined, "span 2", `${Math.floor(i / 2) * 2 + 1} / span 2`]}
          className="flex flex-col justify-between gap-(--rap-space-sm)"
        >
          <div className="flex items-baseline justify-between gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.06em]">
            <span className="text-ink-2">{it.label}</span>
            <span className="text-mute tabular-nums">{tag(i + 1)}</span>
          </div>
          <DotText matrix off field={{ cols: 28, rows: 9 }} pad={[1, 1]} className="w-full text-ink">
            {show(it)}
          </DotText>
          {it.note && <span className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-mute">{it.note}</span>}
        </ModCell>
      ))}
      <ModCell aria-hidden c={[null, null, "12 / span 1"]} r={[undefined, undefined, "1"]} className="flex justify-end text-mute">
        <SquareMarks />
      </ModCell>
      <ModCell aria-hidden c={[null, null, "12 / span 1"]} r={[undefined, undefined, "3 / span 2"]} className="flex flex-col items-end justify-end gap-2 text-mute">
        <TickCircle size={34} />
        <TickCircle size={34} />
      </ModCell>
    </ModGrid>
  );
}
