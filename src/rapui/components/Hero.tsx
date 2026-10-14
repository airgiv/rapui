/* ══ Hero ═════════════════════════════════════════════════
   The page's first screen: a kicker, the one h1 on the page, a
   lead, the buttons and a picture. The same props are laid out
   five ways — the look (or the preset in effect) decides:

     <Hero
       eyebrow="Kestrel 2 · offline maps"
       title={<>Field notes that <Accent>map</Accent> themselves</>}
       lead="Every sighting becomes a pin…"
       actions={<><Button icon>Start a log</Button><Button variant="soft">Sample</Button></>}
       media={<img src="/map.jpg" alt="" />}
     />

   fun      a giant stacked headline, the lead and buttons in a row
            under it, the picture as a big rounded tile with a sticker
            slapped on its corner
   civic    centred on a soft white card, like a public-service
            front page: a big light serif headline, the lead and
            buttons under it, the picture in a wide rounded card below;
            drop an <InlineMedia> between the headline's words
   signal   a split with a mono "[ 00 ]" kicker, the picture behind
            scan lines (MediaFrame) and a ruled meta row of
            coordinates ending in a dot-matrix strip
   product  centred: a pill badge, headline, lead, two buttons, then
            the picture in a framed window with a soft glow under it
   minimal  a big left-aligned headline over nine columns, a small
            lead to the right below it, buttons as text links, and a
            hairline under

   Delight (fun): the picture tile is tossed onto the page and the
   sticker spins on its corner; an inline picture tilts under the
   pointer. Calm: everything is simply in place. */
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";
import { Grid, GridItem, Section, Stack, useBlockLook, type BlockLook, type SectionProps } from "./Layout";
import { Display, Eyebrow } from "./Typography";
import { MediaFrame } from "./MediaFrame";
import { DotMatrix } from "./DotMatrix";
import { ArrowRight } from "../icons";
import "./Hero.css";

/* ── BlockKicker ── the small line above a block's title, set the look's way
   (SectionHeader styles its kicker by the preset; a block styles by its look) */

export function BlockKicker({ look, index, className, children }: { look: BlockLook; index?: string; className?: string; children?: ReactNode }) {
  if (!children && !index) return null;
  if (look === "fun") return <Eyebrow className={className}>{children}</Eyebrow>;
  if (look === "civic")
    return (
      <span data-slot="kicker" className={cn("text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-ink-2", className)}>
        {children}
      </span>
    );
  if (look === "signal")
    return (
      <span data-slot="kicker" className={cn("inline-flex items-center gap-[1ch] font-mono text-xs uppercase tracking-[0.08em] text-ink-2", className)}>
        {index && <span aria-hidden className="text-flame">[ {index} ]</span>}
        {children}
      </span>
    );
  if (look === "minimal")
    return (
      <span data-slot="kicker" className={cn("text-sm text-ink-2", className)}>
        {index && <span aria-hidden className="text-mute tabular-nums">{index} — </span>}
        {children}
      </span>
    );
  return (
    <span data-slot="kicker" className={cn("text-sm font-medium text-plum", className)}>
      {children}
    </span>
  );
}

/* ── InlineMedia ── a pill of picture set between the words of a headline */

export interface InlineMediaProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  /** Describe the picture, or leave empty when it is decoration. */
  alt?: string;
  /** Any picture node instead of src (an <img>, <video>, <svg>). */
  children?: ReactNode;
}

/** A small pill-shaped picture that sits inline in a headline, cap-height tall. Fun: it tilts under the pointer. */
export function InlineMedia({ src, alt = "", className, children, ...rest }: InlineMediaProps) {
  return (
    <span
      data-slot="inline-media"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn(
        "relative inline-block h-[0.74em] w-[1.75em] mx-[0.06em] overflow-hidden rounded-pill bg-paper-3 align-baseline",
        "[&>:is(img,video,svg)]:block [&>:is(img,video,svg)]:size-full [&>:is(img,video)]:object-cover",
        "transition-[rotate,scale] duration-(--rap-dur) ease-spring fun:hover:-rotate-6 fun:hover:scale-110",
        className,
      )}
      {...rest}
    >
      {src ? <img src={src} alt="" /> : children}
    </span>
  );
}

/* ── Hero ── */

export interface HeroMeta {
  label: string;
  value: ReactNode;
}

export interface HeroProps extends Omit<SectionProps, "title"> {
  /** The kicker: a line above the title (a pill badge in product). */
  eyebrow?: ReactNode;
  /** Makes the product look's pill badge a link. */
  eyebrowHref?: string;
  /** "00" — the kicker's index in the signal and minimal looks. */
  index?: string;
  /** The page's h1. May carry an <Accent> or an <InlineMedia>. */
  title: ReactNode;
  lead?: ReactNode;
  /** Buttons. Minimal sets them as text links. */
  actions?: ReactNode;
  /** The picture: an <img>, <video>, <svg> or a mock; it fills its frame. */
  media?: ReactNode;
  /** Slapped on the media's corner in the fun look: a RotatingBadge or a Sticker. */
  sticker?: ReactNode;
  /** Small facts: a ruled row in signal, a quiet line in minimal. */
  meta?: HeroMeta[];
  look?: BlockLook;
}

/* the media fills whatever frame the look gives it */
const fill = "size-full [&>:is(img,video,svg)]:block [&>:is(img,video,svg)]:size-full [&>:is(img,video)]:object-cover";

/* a lead that is not the big Typography Lead: the size the looks other than fun want */
const leadText = "m-0 text-[clamp(1.0625rem,1.3vw,1.25rem)] leading-[1.5] text-ink-2 text-pretty";

const Actions = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div data-slot="hero-actions" className={cn("flex flex-wrap items-center gap-3", className)}>
    {children}
  </div>
);

export function Hero({ eyebrow, eyebrowHref, index, title, lead, actions, media, sticker, meta, look: lookProp, tone, className, ...rest }: HeroProps) {
  const { ref, look } = useBlockLook<HTMLElement>(lookProp);
  const parts = { eyebrow, eyebrowHref, index, title, lead, actions, media, sticker, meta };
  return (
    <Section
      ref={ref}
      data-look={look}
      data-slot="hero"
      tone={tone ?? (look === "civic" ? "surface" : "plain")}
      className={cn("rap-hero", className)}
      {...rest}
    >
      {look === "fun" && <FunHero {...parts} />}
      {look === "civic" && <CivicHero {...parts} />}
      {look === "signal" && <SignalHero {...parts} index={index ?? "00"} />}
      {look === "product" && <ProductHero {...parts} />}
      {look === "minimal" && <MinimalHero {...parts} index={index ?? "00"} />}
    </Section>
  );
}

type Parts = Pick<HeroProps, "eyebrow" | "eyebrowHref" | "index" | "title" | "lead" | "actions" | "media" | "sticker" | "meta">;

/* fun: the headline is the page — set it by the container's width so it never outgrows a narrow preview */
function FunHero({ eyebrow, title, lead, actions, media, sticker }: Parts) {
  return (
    <Stack gap="lg">
      <BlockKicker look="fun">{eyebrow}</BlockKicker>
      <Display as="h1" size="mega" className="max-w-[15ch] text-[length:clamp(3rem,12.5cqi,14rem)] leading-[0.86]">
        {title}
      </Display>
      {(lead || actions) && (
        <div className="flex flex-col gap-(--rap-space-lg) @3xl:flex-row @3xl:items-end @3xl:justify-between">
          {lead && <p className="m-0 max-w-[30ch] text-display-md leading-[1.3] tracking-[-0.015em] text-ink-2 text-pretty">{lead}</p>}
          {actions && <Actions className="@3xl:justify-end">{actions}</Actions>}
        </div>
      )}
      {media && (
        <div data-slot="hero-media" className="relative mt-(--rap-space-md)">
          <div className={cn("aspect-[4/3] @3xl:aspect-[21/9] overflow-hidden rounded-lg bg-paper-3", "fun:animate-toss-in")}>
            <div className={fill}>{media}</div>
          </div>
          {sticker && (
            <div data-slot="hero-sticker" className="absolute right-[5%] top-0 z-1 -translate-y-1/2">
              {sticker}
            </div>
          )}
        </div>
      )}
    </Stack>
  );
}

/* civic: a public-service front page — everything on the centre line, a big light
   serif headline, then the picture as a wide soft card under the words */
function CivicHero({ eyebrow, title, lead, actions, media }: Parts) {
  return (
    <Stack gap="xl" align="center" className="text-center">
      <Stack gap="lg" align="center" className="py-(--rap-space-md)">
        <BlockKicker look="civic">{eyebrow}</BlockKicker>
        <Display as="h1" size="xxl" className="max-w-[14ch]">
          {title}
        </Display>
        {lead && <p className={cn(leadText, "max-w-[46ch]")}>{lead}</p>}
        {actions && <Actions className="justify-center pt-(--rap-space-xs)">{actions}</Actions>}
      </Stack>
      {media && (
        <div data-slot="hero-media" className="w-full max-w-5xl text-left">
          <div className="aspect-[3/4] @md:aspect-[4/3] @3xl:aspect-[16/9] overflow-hidden rounded-lg bg-paper-3">
            <div className={fill}>{media}</div>
          </div>
        </div>
      )}
    </Stack>
  );
}

/* the hairline-ruled cell grid: every cell draws a rule on its left and top,
   and the grid clips the ones at its outer edges */
const ruled = "overflow-hidden [&>*]:shadow-[-1px_0_0_var(--rap-line),0_-1px_0_var(--rap-line)]";

/* signal: an instrument readout — a mono kicker, the picture on a scanned screen, coordinates under it */
function SignalHero({ eyebrow, index, title, lead, actions, media, meta = [] }: Parts) {
  return (
    <Stack gap="xl">
      <Grid rowGap="lg" className="items-end">
        <GridItem span={media ? 7 : 10}>
          <Stack gap="lg">
            <BlockKicker look="signal" index={index}>
              {eyebrow}
            </BlockKicker>
            <Display as="h1" size="xl" className="max-w-[18ch]">
              {title}
            </Display>
            {lead && <p className={cn(leadText, "max-w-[46ch]")}>{lead}</p>}
            {actions && <Actions>{actions}</Actions>}
          </Stack>
        </GridItem>
        {media && (
          <GridItem span={5}>
            <MediaFrame data-slot="hero-media" picture={<div className={fill}>{media}</div>} className="aspect-[4/5] rounded-xs">
              <CropMarks />
            </MediaFrame>
          </GridItem>
        )}
      </Grid>
      <div className="border-y border-line">
        <Grid cols={[1, 2, Math.min(meta.length + 1, 5)]} gap="none" role="list" aria-label="Details" className={ruled}>
          {meta.map((m) => (
            <div key={m.label} role="listitem" className="flex flex-col gap-1 px-(--rap-space-sm) py-(--rap-space-sm) font-mono text-xs uppercase tracking-[0.06em]">
              <span className="text-mute">{m.label}</span>
              <span className="text-ink">{m.value}</span>
            </div>
          ))}
          <div aria-hidden className="flex items-center overflow-hidden px-(--rap-space-sm) py-(--rap-space-sm) text-flame">
            <DotMatrix cols={40} rows={3} size={3} gap={3} shape="square" animation="wave" period={900} />
          </div>
        </Grid>
      </div>
    </Stack>
  );
}

/* four corner ticks over the screen, like a viewfinder */
function CropMarks() {
  const tick = "absolute size-4 border-paper-2/70";
  return (
    <div aria-hidden className="absolute inset-(--rap-space-sm)">
      <span className={cn(tick, "left-0 top-0 border-l border-t")} />
      <span className={cn(tick, "right-0 top-0 border-r border-t")} />
      <span className={cn(tick, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(tick, "bottom-0 right-0 border-b border-r")} />
    </div>
  );
}

/* product: a launch page — everything centred, the product in a window */
function ProductHero({ eyebrow, eyebrowHref, title, lead, actions, media }: Parts) {
  const pill = cn(
    "inline-flex h-8 items-center gap-2 rounded-pill border border-line bg-surface px-3 text-sm font-medium text-ink",
    "transition-colors duration-(--rap-dur-fast) ease-soft",
  );
  return (
    <Stack gap="2xl">
      <Stack gap="lg" align="center" className="text-center">
        {eyebrow &&
          (eyebrowHref ? (
            <a href={eyebrowHref} data-slot="hero-badge" className={cn(pill, "group/pill no-underline hover:bg-fill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring")}>
              {eyebrow}
              <ArrowRight aria-hidden className="size-3.5 text-mute transition-transform duration-(--rap-dur-fast) ease-soft group-hover/pill:translate-x-0.5" />
            </a>
          ) : (
            <span data-slot="hero-badge" className={pill}>
              {eyebrow}
            </span>
          ))}
        <Display as="h1" size="xl" className="max-w-[17ch]">
          {title}
        </Display>
        {lead && <p className={cn(leadText, "max-w-[52ch]")}>{lead}</p>}
        {actions && <Actions className="justify-center">{actions}</Actions>}
      </Stack>
      {media && (
        /* the window sits on an editor's canvas: a dot grid, and the window selected on it —
           a flame frame with corner handles and a size tag, the way a design tool marks
           the thing you are working on (rapui's own origin) */
        <div data-slot="hero-media" className="group/canvas relative rounded-lg bg-paper-2 p-[clamp(14px,4cqi,56px)] shadow-[inset_0_0_0_1px_var(--rap-line)] [background-image:radial-gradient(circle,var(--rap-fill-strong)_1.1px,transparent_1.4px)] [background-size:20px_20px] [background-position:center]">
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute -inset-[7px] z-1 border border-flame">
              {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map((pos) => (
                <span key={pos} className={cn("absolute size-[7px] border border-flame bg-surface", pos)} />
              ))}
              <span className="absolute -top-[1.6rem] left-[-1px] rounded-xs bg-flame px-1.5 py-0.5 font-mono text-[0.6875rem] leading-[1.2] text-white tabular-nums">Hero · 1440 × 900</span>
            </span>
          <div className="relative rounded-lg border border-line bg-surface p-1.5 shadow-pop">
            <div aria-hidden className="flex h-7 items-center gap-1.5 px-2.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2.5 rounded-pill bg-fill-strong" />
              ))}
            </div>
            <div className="aspect-[4/5] @md:aspect-[16/10] overflow-hidden rounded-sm border border-line bg-paper">
              <div className={fill}>{media}</div>
            </div>
          </div>
          </div>
        </div>
      )}
    </Stack>
  );
}

/* minimal: type on the grid — one big headline, small words beside it, a rule */
function MinimalHero({ eyebrow, index, title, lead, actions, media, meta = [] }: Parts) {
  return (
    <Stack gap="xl">
      <Grid rowGap="xl">
        <GridItem span={12}>
          <BlockKicker look="minimal" index={index}>
            {eyebrow}
          </BlockKicker>
        </GridItem>
        <GridItem span={10}>
          <Display as="h1" size="xxl" className="max-w-[16ch] text-[length:clamp(2.75rem,8.5cqi,8.5rem)] leading-[0.9]">
            {title}
          </Display>
        </GridItem>
        {(lead || actions) && (
          <GridItem span={5} start={8}>
            <Stack gap="md">
              {lead && <p className="m-0 max-w-[40ch] text-base leading-[1.6] text-ink-2 text-pretty">{lead}</p>}
              {actions && <Actions className="gap-x-(--rap-space-lg) gap-y-2">{actions}</Actions>}
            </Stack>
          </GridItem>
        )}
      </Grid>
      {media && (
        <div data-slot="hero-media" className="aspect-[16/9] @3xl:aspect-[21/9] overflow-hidden bg-paper-3">
          <div className={fill}>{media}</div>
        </div>
      )}
      <div className="border-b border-line">
        {meta.length > 0 && (
          <dl className="m-0 flex flex-wrap gap-x-(--rap-space-xl) gap-y-2 pb-(--rap-space-sm) text-sm">
            {meta.map((m) => (
              <div key={m.label} className="flex gap-2">
                <dt className="text-mute">{m.label}</dt>
                <dd className="m-0 text-ink">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Stack>
  );
}
