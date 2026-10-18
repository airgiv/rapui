/* ══ Features ═════════════════════════════════════════════
   What the product does: a header and a set of features, laid
   out the way the preset would lay them out — not one card grid
   in five palettes.

     <Features eyebrow="Why Fieldnote" title="…" items={[
       { title: "Capture anywhere", text: "…", icon: "notebook" },
     ]} />
     <FeatureSplit title="…" lead="…" points={[…]} media={<img … />} reverse />

   Features, per look:
     fun      packed colourful tiles 4px apart (flame, acid, sky,
              bubble, white, each with its right ink), a big
              duotone FancyIcon and a display-face title
     civic    soft white rounded cards on grey paper, the icon in a
              tinted circle, serif card titles, plenty of air
     signal   4×2 blocks of square cells on the full-width ModGrid, two
              per band with {0001} tags and a small technical mark each,
              the third slot left empty but for a bigger mark (TechMarks)
     product  tidy cards with a hairline edge: a small icon, a
              title, muted text and "Learn more →" when linked
     minimal  no cards, no icons: a numbered list in two columns,
              each entry under a rule

   FeatureSplit is one feature at length: the words on one side
   (eyebrow, title, lead, bullet points, actions), the picture on
   the other (`reverse` swaps them). The picture is dressed per
   look: a rounded tile on a coloured ground (fun), a soft card
   (civic), a scanlined MediaFrame (signal), a framed app window
   (product), a plain figure with a caption (minimal).

   An item with `href` is a link: its title carries the link and
   stretches it over the whole card.

   Delight (fun): a tile lifts and tips a degree under the hand,
   on the spring; the split's picture tilts back the other way.
   Calm: tiles stay put — only the link underline answers. */
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../utils";
import { ArrowRight, Check } from "../icons";
import { Grid, GridItem, Section, SectionHeader, Stack, useBlockLook, type BlockLook, type SectionProps } from "./Layout";
import { FANCY_ICONS, FancyIcon, type FancyIconName, type FancyTone } from "./FancyIcon";
import { MediaFrame } from "./MediaFrame";
import { ModCell, ModGrid } from "./ModGrid";
import { Asterisk, CrossGrid, Horizon, Molecule, OutlineBlob, PlusMark, SquareMarks, TickCircle } from "./TechMarks";

/* ── shared bits ── */

export interface FeatureItem {
  title: string;
  text: ReactNode;
  /** A node, or the name of a FancyIcon ("rocket", "lock"…). */
  icon?: ReactNode | FancyIconName;
  /** A picture or mock shown with the feature. */
  media?: ReactNode;
  /** Makes the whole item a link. */
  href?: string;
}

const isFancy = (icon: unknown): icon is FancyIconName => typeof icon === "string" && icon in FANCY_ICONS;

/** A FancyIcon for a name, the node as given otherwise. */
function FeatureIcon({ icon, tone, size }: { icon: FeatureItem["icon"]; tone: FancyTone; size: number }) {
  if (icon == null) return null;
  return isFancy(icon) ? <FancyIcon icon={icon} tone={tone} size={size} /> : <>{icon}</>;
}

/** The title, as a link stretched over the item when there is an href. */
function ItemTitle({ item, className }: { item: FeatureItem; className?: string }) {
  return (
    <h3 data-slot="feature-title" className={cn("m-0", className)}>
      {item.href ? (
        <a
          href={item.href}
          className="text-inherit no-underline after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none focus-visible:after:shadow-[inset_0_0_0_2px_var(--rap-ring)]"
        >
          {item.title}
        </a>
      ) : (
        item.title
      )}
    </h3>
  );
}

const pad = (i: number) => String(i + 1).padStart(2, "0");

/* ── Features ── */

export interface FeaturesProps extends Omit<SectionProps, "title"> {
  eyebrow?: ReactNode;
  /** "01" — the section number, where the look shows one. */
  index?: string;
  title: ReactNode;
  lead?: ReactNode;
  items: FeatureItem[];
  /** Columns at full width (they collapse as room runs out). Minimal always uses two. */
  cols?: number;
  /** Whose arrangement to use; the preset in effect by default. */
  look?: BlockLook;
}

export function Features({ eyebrow, index, title, lead, items, cols = 3, look: lookProp, className, ...rest }: FeaturesProps) {
  const { ref, look } = useBlockLook(lookProp);
  const Body = { fun: FunTiles, civic: CivicCards, signal: SignalCells, product: ProductCards, minimal: MinimalList }[look];
  return (
    <Section ref={ref} data-look={look} data-slot="features" className={className} {...rest}>
      <Stack gap={look === "minimal" ? "2xl" : "xl"}>
        <SectionHeader eyebrow={eyebrow} index={index} title={title} lead={lead} align={look === "civic" ? "center" : "start"} size={look === "fun" ? "xl" : "lg"} />
        <Body items={items} cols={cols} />
      </Stack>
    </Section>
  );
}

type BodyProps = { items: FeatureItem[]; cols: number };

/* fun: a packed wall of colour. Each tile is a light or dark island, so its ink
   is right for its ground in any preset's palette. */
const FUN_TILES: { bg: string; theme: "light" | "dark"; tone: FancyTone }[] = [
  { bg: "bg-flame", theme: "dark", tone: "ink" },
  { bg: "bg-acid", theme: "light", tone: "blue" },
  { bg: "bg-sky", theme: "light", tone: "flame" },
  { bg: "bg-bubble", theme: "light", tone: "plum" },
  { bg: "bg-surface", theme: "light", tone: "flame" },
];

function FunTiles({ items, cols }: BodyProps) {
  return (
    <Grid cols={cols} gap="tile" role="list">
      {items.map((item, i) => {
        const t = FUN_TILES[i % FUN_TILES.length];
        return (
          <div
            key={i}
            role="listitem"
            data-slot="feature"
            data-rap-theme={t.theme}
            className={cn(
              "relative flex flex-col justify-between gap-(--rap-space-xl) min-h-[17rem] p-(--rap-space-lg) rounded-card text-ink",
              t.bg,
              // delight: the tile lifts and tips a degree, on the spring
              "transition-[translate,rotate] duration-(--rap-dur) ease-(--rap-ease-spring)",
              "fun:hover:-translate-y-2 fun:hover:rotate-[-1deg] fun:hover:z-1",
            )}
          >
            <div className="flex items-start justify-between gap-(--rap-space-sm)">
              <FeatureIcon icon={item.icon ?? "stars"} tone={t.tone} size={56} />
              {item.href && <ArrowRight aria-hidden size={28} className="opacity-70" />}
            </div>
            {item.media && <div className="overflow-hidden rounded-sm">{item.media}</div>}
            <div className="flex flex-col gap-(--rap-space-xs)">
              <ItemTitle item={item} className="font-display text-display-md font-medium leading-[1.05] tracking-[var(--rap-display-tracking-md,-0.03em)] [text-transform:var(--rap-display-case,none)]" />
              <div className="text-[1rem] leading-[1.45] opacity-85 max-w-[34ch]">{item.text}</div>
            </div>
          </div>
        );
      })}
    </Grid>
  );
}

/* civic: soft white cards, nothing but an icon, a serif title and the words */
function CivicCards({ items, cols }: BodyProps) {
  return (
    <Grid cols={cols} gap="tile" role="list">
      {items.map((item, i) => (
        <div
          key={i}
          role="listitem"
          data-slot="feature"
          className="group/card relative flex flex-col gap-(--rap-space-sm) p-(--rap-space-lg) rounded-lg bg-surface text-ink"
        >
          {item.media ? (
            <div className="overflow-hidden rounded-sm -mx-(--rap-space-xs) -mt-(--rap-space-xs)">{item.media}</div>
          ) : (
            <span aria-hidden className="text-accent [&_svg]:size-7">
              <FeatureIcon icon={item.icon ?? "star"} tone="ink" size={32} />
            </span>
          )}
          <ItemTitle item={item} className="font-display text-[1.875rem] font-[var(--rap-display-weight)] leading-[1.1] tracking-[-0.01em]" />
          <div className="text-[1rem] leading-[1.6] text-ink-2">{item.text}</div>
          {item.href && (
            <span aria-hidden className="mt-auto inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-accent underline-offset-4 group-hover/card:underline">
              Read more <ArrowRight size={16} />
            </span>
          )}
        </div>
      ))}
    </Grid>
  );
}

/* signal: square-cell blocks on the ModGrid */
function SignalCells({ items }: BodyProps) {
  /* on the desk's 12 columns each item is a 4×2 block of square cells; a band of three
     slots holds two items and one empty slot that carries a technical mark instead, the
     empty slot moving along each band, so the page reads modular and airy, not tabular */
  const placed: { item?: FeatureItem; i: number; c: string; r: string }[] = [];
  let k = 0;
  for (let band = 0; k < items.length; band++) {
    const skip = [2, 0, 1][band % 3];
    for (let slot = 0; slot < 3; slot++) {
      const c = `${slot * 4 + 1} / span 4`, r = `${band * 2 + 1} / span 2`;
      if (slot === skip || k >= items.length) placed.push({ i: -1 - band * 3 - slot, c, r });
      else placed.push({ item: items[k], i: k++, c, r });
    }
  }
  return (
    <ModGrid marks role="list">
      {placed.map(({ item, i, c, r }) =>
        item ? (
          <ModCell key={i} role="listitem" data-slot="feature" ruled c={["1 / -1", "span 4", c]} r={[undefined, "span 2", r]} className="group/cell flex flex-col gap-(--rap-space-md) bg-paper transition-colors duration-(--rap-dur-fast) hover:bg-surface">
            <div className="flex items-start justify-between gap-(--rap-space-sm)">
              <span className="font-mono text-[0.75rem] text-mute tabular-nums">
                {"{"}
                {String(i + 1).padStart(4, "0")}
                {"}"}
              </span>
              <span aria-hidden className="text-ink">{MARKS[i % MARKS.length]}</span>
            </div>
            {item.media && <div className="overflow-hidden rounded-sm">{item.media}</div>}
            <div className="mt-auto flex flex-col gap-(--rap-space-xs)">
              <ItemTitle item={item} className="text-[1rem] font-medium leading-[1.3] tracking-[-0.01em]" />
              <div className="max-w-[40ch] text-[0.8125rem] leading-[1.65] text-ink-2">{item.text}</div>
              {item.href && (
                <span aria-hidden className="pt-(--rap-space-2xs) font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-mute group-hover/cell:text-ink">
                  Open →
                </span>
              )}
            </div>
          </ModCell>
        ) : (
          <ModCell key={i} aria-hidden c={[null, null, c]} r={[undefined, undefined, r]} className="flex items-center justify-center text-mute">
            {EMPTY[(-i) % EMPTY.length]}
          </ModCell>
        ),
      )}
    </ModGrid>
  );
}
/* the marks an item carries, and the ones an empty slot shows */
const MARKS = [<CrossGrid key="a" cols={3} rows={2} x={4} size={54} />, <TickCircle key="b" size={30} />, <PlusMark key="c" size={24} />, <Asterisk key="d" size={30} />, <SquareMarks key="e" />, <TickCircle key="f" size={30} />];
const EMPTY = [<CrossGrid key="a" size={120} />, <OutlineBlob key="b" size={70} />, <Horizon key="c" className="w-3/5" />, <Molecule key="d" size={70} />];

/* product: tidy cards with a hairline edge */
function ProductCards({ items, cols }: BodyProps) {
  const spans = bento(items.length, cols);
  return (
    <Grid cols={cols} gap="tile" role="list" className="[grid-auto-flow:row_dense]">
      {items.map((item, i) => {
        const wide = spans[i] > 1;
        return (
          <div
            key={i}
            role="listitem"
            data-slot="feature"
            data-wide={wide || undefined}
            style={{ "--span": spans[i] } as CSSProperties}
            className={cn(
              "@container group/card relative grid gap-(--rap-space-md) p-(--rap-space-lg) rounded-card bg-surface text-ink",
              "shadow-[inset_0_0_0_1px_var(--rap-line)] transition-[translate,box-shadow] duration-(--rap-dur) ease-(--rap-ease-out)",
              "fun:hover:-translate-y-1 fun:hover:shadow-[inset_0_0_0_1px_var(--rap-line),var(--rap-shadow-pop)]",
              // spans: a wide card fills the row at two columns, its share at three
              wide && "@min-[40rem]/grid:col-span-2 @min-[60rem]/grid:col-[span_var(--span)]",
              wide && "@min-[34rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @min-[34rem]:items-stretch",
            )}
          >
            <div className="flex flex-col gap-(--rap-space-sm)">
              {item.icon != null && (
                // the chip: ink on paper, inverted; it flips to flame and tips over when the card is hovered
                <span
                  aria-hidden
                  data-rap-theme="dark"
                  className={cn(
                    "grid place-items-center size-10 rounded-sm bg-paper text-ink [&_svg]:size-5",
                    "transition-[background-color,rotate] duration-(--rap-dur) ease-(--rap-ease-spring)",
                    "group-hover/card:bg-flame fun:group-hover/card:-rotate-8",
                  )}
                >
                  <FeatureIcon icon={item.icon} tone="ink" size={22} />
                </span>
              )}
              <ItemTitle item={item} className={cn("pt-(--rap-space-xs) font-display font-semibold leading-[1.2] tracking-[-0.025em]", wide ? "text-[1.5rem]" : "text-[1.125rem]")} />
              <div className="max-w-[46ch] text-[0.9375rem] leading-[1.55] text-ink-2">{item.text}</div>
              {item.href && (
                <span aria-hidden className="mt-auto pt-(--rap-space-xs) inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-ink">
                  Learn more <ArrowRight size={14} className="transition-transform duration-(--rap-dur-fast) group-hover/card:translate-x-0.5" />
                </span>
              )}
            </div>
            {wide && (
              // the wide card's other half: the picture, or the icon blown up on an editor's dot grid
              <div
                aria-hidden={!item.media}
                className="relative grid min-h-40 place-items-center overflow-hidden rounded-sm bg-paper [background-image:radial-gradient(circle,var(--rap-fill-strong)_1px,transparent_1.3px)] [background-size:16px_16px] shadow-[inset_0_0_0_1px_var(--rap-line)]"
              >
                {item.media ?? (
                  <span className="text-ink opacity-90 transition-transform duration-(--rap-dur-slow) ease-(--rap-ease-spring) fun:group-hover/card:scale-110 fun:group-hover/card:rotate-6 [&_svg]:size-24">
                    <FeatureIcon icon={item.icon ?? "star"} tone="flame" size={96} />
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </Grid>
  );
}

/* bento spans for a row of `cols`: a wide card, then a row of singles, then wide on the
   other side… and whatever is left over fills its row, so no card sits alone */
function bento(n: number, cols: number): number[] {
  if (cols < 3) return Array(n).fill(1);
  const rows = [[2, 1], [1, 1, 1], [1, 2], [1, 1, 1]];
  const out: number[] = [];
  let r = 0;
  while (out.length < n) {
    const left = n - out.length;
    const row = rows[r++ % rows.length];
    if (left >= row.length) out.push(...row);
    else out.push(...(left === 1 ? [3] : [2, 1]));
  }
  return out;
}

/* minimal: a numbered list in two columns, each entry under a rule */
function MinimalList({ items }: BodyProps) {
  return (
    <Grid cols={[1, 2, 2]} rowGap="none" role="list">
      {items.map((item, i) => (
        <div
          key={i}
          role="listitem"
          data-slot="feature"
          className="group/row relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-(--rap-space-sm) py-(--rap-space-lg) border-t border-line text-ink"
        >
          <span className="text-[0.875rem] text-mute tabular-nums leading-[1.6]">{pad(i)}</span>
          <div className="flex flex-col gap-(--rap-space-xs)">
            <ItemTitle item={item} className="text-[1.125rem] font-medium leading-[1.35] tracking-[-0.01em] [&_a]:underline-offset-4 group-hover/row:[&_a]:underline" />
            <div className="text-[1rem] leading-[1.6] text-ink-2 max-w-[48ch]">{item.text}</div>
            {item.media && <div className="pt-(--rap-space-xs)">{item.media}</div>}
          </div>
        </div>
      ))}
    </Grid>
  );
}

/* ── FeatureSplit ── */

export interface FeatureSplitProps extends Omit<SectionProps, "title"> {
  eyebrow?: ReactNode;
  index?: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Short bullet points under the lead. */
  points?: ReactNode[];
  /** Buttons or links under the points. */
  actions?: ReactNode;
  /** The picture: an <img>, a video, a mock. */
  media?: ReactNode;
  /** A caption for the picture (shown by the minimal look; the alt text stays on the media). */
  caption?: ReactNode;
  /** Picture on the left, words on the right. */
  reverse?: boolean;
  look?: BlockLook;
}

export function FeatureSplit({
  eyebrow,
  index,
  title,
  lead,
  points,
  actions,
  media,
  caption,
  reverse = false,
  look: lookProp,
  className,
  ...rest
}: FeatureSplitProps) {
  const { ref, look } = useBlockLook(lookProp);
  // words / picture share of the 12 tracks: civic halves, the rest give the picture more
  const [textSpan, mediaSpan] = look === "civic" ? [6, 6] : look === "minimal" ? [5, 6] : [5, 7];
  // minimal leaves a track of air between the two
  const gapTrack = 12 - textSpan - mediaSpan;
  const textStart = reverse ? mediaSpan + gapTrack + 1 : 1;
  const mediaStart = reverse ? 1 : textSpan + gapTrack + 1;

  return (
    <Section ref={ref} data-look={look} data-slot="feature-split" data-reverse={reverse || undefined} className={className} {...rest}>
      {/* dense flow lets the picture take the first tracks of the row when reversed,
          while the words stay first in reading order (and first when stacked) */}
      <Grid rowGap="xl" className={cn("[grid-auto-flow:row_dense]", look === "minimal" ? "items-start" : "items-center")}>
        <GridItem span={textSpan} start={textStart}>
          <Stack gap="lg">
            <SectionHeader eyebrow={eyebrow} index={index} title={title} lead={lead} size={look === "fun" ? "xl" : "lg"} />
            {points && points.length > 0 && <SplitPoints points={points} look={look} />}
            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </Stack>
        </GridItem>
        {media && (
          <GridItem span={mediaSpan} start={mediaStart}>
            <SplitMedia look={look} caption={caption} reverse={reverse}>
              {media}
            </SplitMedia>
          </GridItem>
        )}
      </Grid>
    </Section>
  );
}

function SplitPoints({ points, look }: { points: ReactNode[]; look: BlockLook }) {
  if (look === "signal")
    return (
      <ul data-slot="feature-points" className="m-0 p-0 list-none border-t border-line">
        {points.map((p, i) => (
          <li key={i} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-(--rap-space-sm) py-(--rap-space-sm) border-b border-line text-[0.9375rem] leading-[1.5]">
            <span className="font-mono text-[0.75rem] leading-[1.9] text-mute tabular-nums">{`{${String(i + 1).padStart(4, "0")}}`}</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    );
  if (look === "minimal")
    return (
      <ul data-slot="feature-points" className="m-0 p-0 list-none">
        {points.map((p, i) => (
          <li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)] py-(--rap-space-xs) border-t border-line text-[1rem] leading-[1.55] text-ink-2">
            <span aria-hidden className="text-mute">—</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    );
  const mark = {
    fun: "size-7 rounded-full bg-acid text-ink [&_svg]:size-4",
    civic: "size-5 text-ink-2 [&_svg]:size-4",
    product: "size-5 text-mute [&_svg]:size-4",
  }[look as "fun" | "civic" | "product"];
  return (
    <ul data-slot="feature-points" className="m-0 p-0 list-none flex flex-col gap-(--rap-space-sm)">
      {points.map((p, i) => (
        <li key={i} className={cn("flex items-start gap-(--rap-space-sm) leading-[1.5]", look === "fun" ? "text-[1.0625rem] font-medium" : "text-[1rem] text-ink-2")}>
          <span aria-hidden className={cn("grid place-items-center flex-none mt-[-0.1em]", mark)} data-rap-theme={look === "fun" ? "light" : undefined}>
            <Check strokeWidth={2.4} />
          </span>
          <span className="min-w-0 pt-[0.1em]">{p}</span>
        </li>
      ))}
    </ul>
  );
}

function SplitMedia({ look, caption, reverse, children }: { look: BlockLook; caption?: ReactNode; reverse: boolean; children: ReactNode }) {
  const fill = "[&>:is(img,video,svg)]:block [&>:is(img,video,svg)]:w-full [&>:is(img,video,svg)]:h-full [&>:is(img,video)]:object-cover";
  if (look === "fun")
    return (
      <div data-slot="feature-media" className="relative rounded-lg bg-bubble p-[clamp(1rem,4cqi,3rem)] @container">
        <div
          className={cn(
            "overflow-hidden rounded-card bg-surface aspect-[3/4] @md:aspect-[4/3] shadow-(--rap-shadow-pop)",
            "transition-[rotate] duration-(--rap-dur) ease-(--rap-ease-spring)",
            reverse ? "fun:hover:rotate-[1.5deg]" : "fun:hover:rotate-[-1.5deg]",
            fill,
          )}
        >
          {children}
        </div>
      </div>
    );
  if (look === "civic")
    return (
      <figure data-slot="feature-media" className="m-0 flex flex-col gap-(--rap-space-sm)">
        <div className={cn("overflow-hidden rounded-lg aspect-[3/4] @md:aspect-[4/3]", fill)}>{children}</div>
        {caption && <figcaption className="text-[0.875rem] text-ink-2">{caption}</figcaption>}
      </figure>
    );
  if (look === "signal")
    return (
      <figure data-slot="feature-media" className="m-0 flex flex-col gap-(--rap-space-xs)">
        <MediaFrame picture={children} className="aspect-[4/3] rounded-xs" />
        {caption && <figcaption className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-2">{caption}</figcaption>}
      </figure>
    );
  if (look === "product")
    return (
      <div data-slot="feature-media" className="overflow-hidden rounded-card bg-surface shadow-[inset_0_0_0_1px_var(--rap-line),var(--rap-shadow-pop)]">
        {/* the window's title bar */}
        <div aria-hidden className="flex items-center gap-1.5 h-9 px-3.5 border-b border-line bg-paper">
          {[0, 1, 2].map((d) => (
            <span key={d} className="size-2.5 rounded-full bg-fill-strong" />
          ))}
          {caption && <span className="ml-3 truncate text-[0.75rem] text-mute">{caption}</span>}
        </div>
        <div className={cn("aspect-[4/5] @md:aspect-[16/10]", fill)}>{children}</div>
      </div>
    );
  return (
    <figure data-slot="feature-media" className="m-0 flex flex-col gap-(--rap-space-sm)">
      <div className={cn("aspect-[4/3] overflow-hidden bg-paper-3", fill)}>
        {children}
      </div>
      {caption && <figcaption className="text-[0.8125rem] text-mute border-t border-line pt-(--rap-space-xs)">{caption}</figcaption>}
    </figure>
  );
}
