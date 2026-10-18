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
   signal   an editorial index sheet on a numbered grid of square
            cells (ModGrid numbered): a light grotesk headline, the
            lead and `meta` notes placed sparsely, then a wide field —
            the picture as a backdrop, or a soft dark green — with four
            big dial faces (a dot screen with the time, a compass with
            a red needle, dot readouts of the first meta value and the
            index), tiny pale dot text (`dots`, the meta) scattered over
            it and leader lines out to small part labels
   product  centred: a pill badge, headline, lead, two buttons, then
            the picture in a framed window with a soft glow under it
   minimal  a big left-aligned headline over nine columns, a small
            lead to the right below it, buttons as text links, and a
            hairline under

   Delight (fun): the picture tile is tossed onto the page and the
   sticker spins on its corner; an inline picture tilts under the
   pointer. Calm: everything is simply in place. */
import { useEffect, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";
import { Grid, GridItem, Section, Stack, useBlockLook, type BlockLook, type SectionProps } from "./Layout";
import { Display, Eyebrow } from "./Typography";
import { ModGrid, ModCell } from "./ModGrid";
import { DotText } from "./DotText";
import { CompassDial, Dial, DotScreen, LeaderLines, SideLabel, TechClock } from "./TechMarks";
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
        {index && (
          <span aria-hidden className="text-mute tabular-nums normal-case">
            {"{"}
            {/^\d+$/.test(index) ? index.padStart(4, "0") : index}
            {"}"}
          </span>
        )}
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
        // exactly as tall as the capitals, sitting on the baseline: an inline-block that clips
        // takes its bottom edge as its baseline, so 1cap tall spans baseline to cap height
        "relative inline-block h-[0.7em] supports-[height:1cap]:h-[1cap] w-[1.6em] mx-[0.08em] overflow-hidden rounded-pill bg-paper-3 align-baseline",
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
  /** signal: the text spelled in the wide dot-matrix field (default: the first meta value). */
  dots?: string;
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

export function Hero({ eyebrow, eyebrowHref, index, title, lead, actions, media, sticker, meta, dots, look: lookProp, tone, className, ...rest }: HeroProps) {
  const { ref, look } = useBlockLook<HTMLElement>(lookProp);
  const parts = { eyebrow, eyebrowHref, index, title, lead, actions, media, sticker, meta, dots };
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

type Parts = Pick<HeroProps, "eyebrow" | "eyebrowHref" | "index" | "title" | "lead" | "actions" | "media" | "sticker" | "meta" | "dots">;

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
        <div data-slot="hero-media" className="@container w-full text-left">
          <div className="aspect-[3/4] @md:aspect-[4/3] @3xl:aspect-[16/8] overflow-hidden rounded-lg bg-paper-3">
            <div className={fill}>{media}</div>
          </div>
        </div>
      )}
    </Stack>
  );
}


/* signal: an editorial index sheet — a numbered grid of square cells with a light grotesk
   headline, notes and the lead placed sparsely in a few cells, then a wide field (the picture,
   or a soft dark-green backdrop) carrying a cluster of four big circular dial faces — a dot
   screen with the time, a compass with a red needle, two dot-type readouts — tiny pale dot
   text scattered over the rest, and thin leader lines out to small part labels */
function useMinute() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function SignalHero({ eyebrow, index, title, lead, actions, media, meta = [], dots }: Parts) {
  const now = useMinute();
  const time = now ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` : "--:--";
  const day = !now || (now.getHours() >= 6 && now.getHours() < 20);
  const [lead0, ...notes] = meta;
  const reading = typeof lead0?.value === "string" ? lead0.value.split(" ")[0] : "00";
  const tag = `X - ${String(index ?? "0").padStart(3, "0")}`;
  const field = (dots ?? (typeof eyebrow === "string" ? eyebrow : "")).toUpperCase();
  const tiny = "text-[color:rgb(240_244_236/0.92)]";
  return (
    <ModGrid numbered>
      <ModCell c={["1 / -1", "1 / span 5", "1 / span 4"]} r={[undefined, undefined, "1"]}>
        <BlockKicker look="signal" index={index}>
          {eyebrow}
        </BlockKicker>
      </ModCell>
      {lead0 && (
        <ModCell c={[null, "7 / span 2", "10 / span 2"]} r={[undefined, undefined, "1"]} className="flex flex-col gap-1 text-[0.75rem] leading-[1.5]">
          <span className="uppercase tracking-[0.08em] text-ink">{lead0.label}</span>
          <span className="text-mute">{lead0.value}</span>
        </ModCell>
      )}
      <ModCell c={["1 / -1", "1 / span 6", "1 / span 6"]} r={[undefined, undefined, "2 / span 2"]}>
        <Display as="h1" size="mega" className="max-w-[22ch] text-[length:clamp(1.625rem,2.9cqi,2.5rem)] leading-[1.12]">
          {title}
        </Display>
      </ModCell>
      {(lead || actions) && (
        <ModCell c={["1 / -1", "1 / span 6", "9 / span 4"]} r={[undefined, undefined, "3 / span 2"]} className="flex flex-col gap-(--rap-space-lg)">
          {lead && <p className="m-0 max-w-[46ch] text-[0.8125rem] leading-[1.7] text-ink-2 text-pretty">{lead}</p>}
          {actions && <Actions>{actions}</Actions>}
        </ModCell>
      )}
      {notes.length > 0 && (
        <ModCell c={["1 / -1", "1 / span 4", "4 / span 3"]} r={[undefined, undefined, "4"]}>
          <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2">
            {notes.map((m, i) => (
              <div key={m.label} className="flex flex-col gap-1">
                <dt className="text-[0.625rem] text-mute tabular-nums">
                  {"{"}
                  {String(i + 2).padStart(4, "0")}
                  {"}"} {m.label}
                </dt>
                <dd className="m-0 text-[0.75rem] uppercase tracking-[0.04em] text-ink">{m.value}</dd>
              </div>
            ))}
          </dl>
        </ModCell>
      )}
      <ModCell c={[null, null, "8 / span 1"]} r={[undefined, undefined, "4"]} className="flex items-start justify-center">
        <TechClock className="h-auto w-full max-w-[4.5rem]" size="100%" />
      </ModCell>
      <ModCell c={["1 / -1", "1 / -1", "1 / -1"]} r={[undefined, undefined, "5 / span 5"]} inset={false}>
        <div data-slot="hero-field" className="@container relative isolate flex flex-col overflow-hidden bg-[#141c15] @3xl:flex-row">
          {/* the picture, or a soft out-of-focus green (gradients only, no filter) */}
          <div aria-hidden className="absolute inset-0 -z-1 [&>:is(img,video,svg)]:size-full [&>:is(img,video)]:object-cover">
            {media || (
              <div className="size-full bg-[radial-gradient(40%_55%_at_70%_30%,#2f4a33,transparent_70%),radial-gradient(35%_45%_at_88%_75%,#3c5a37,transparent_70%),radial-gradient(30%_60%_at_52%_80%,#1f3323,transparent_70%),radial-gradient(22%_30%_at_95%_12%,#4f6e45,transparent_70%),linear-gradient(180deg,#121a13,#18241a_60%,#203222)]" />
            )}
          </div>
          <div data-rap-theme="light" className="grid aspect-square w-full shrink-0 grid-cols-2 grid-rows-2 @3xl:w-[44%]">
            <Dial>
              <DotScreen className="absolute inset-[11%_17%_50%_17%] flex items-center justify-center rounded-[16%]">
                <DotText matrix off pad={[1, 1]} className="w-[62%]">
                  {time}
                </DotText>
                <span className="absolute right-[6%] top-1/2 -translate-y-1/2 font-mono text-[0.5rem] tracking-[0.2em] text-[color:var(--rap-needle)] [writing-mode:vertical-rl]">NOW</span>
              </DotScreen>
              <DotText matrix className="absolute bottom-[26%] left-[16%] w-[26%]">
                {day ? "IT IS DAY" : "IT IS NIGHT"}
              </DotText>
            </Dial>
            <CompassDial />
            <Dial>
              <DotText matrix className="absolute left-[30%] top-[48%] w-[22%]">
                {reading}
              </DotText>
              <DotText matrix className="absolute right-[12%] top-[34%] w-[14%]">
                {reading}
              </DotText>
            </Dial>
            <Dial>
              <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 size-full">
                {Array.from({ length: 22 }, (_, i) => {
                  const t = i / 21;
                  return <circle key={i} cx={30 + t * 34 + Math.sin(t * 9) * 4 + (i % 2) * 1.6} cy={4 + t * 92} r="0.55" fill="currentColor" />;
                })}
              </svg>
              <DotText matrix className="absolute left-[40%] top-[48%] w-[26%]">
                {tag}
              </DotText>
              <DotText matrix className="absolute right-[6%] top-[33%] w-[24%]">
                {tag}
              </DotText>
            </Dial>
          </div>
          <div className={cn("relative flex min-h-[16rem] flex-1 flex-col justify-between gap-6 p-[clamp(16px,2.4cqi,32px)]", tiny)}>
            <DotText matrix wrap={70} className="ml-auto w-full max-w-[17rem]">
              {field || "SIGNAL"}
            </DotText>
            {lead0 && (
              <DotText matrix className="ml-auto w-full max-w-[9rem]">
                {`${lead0.label} >>`.toUpperCase()}
              </DotText>
            )}
            <DotText matrix wrap={70} className="ml-auto w-full max-w-[14rem]">
              {notes.map((m) => `${m.label} ${m.value}`).join("  ").toUpperCase() || "C/O RAPUI"}
            </DotText>
            <SideLabel className="absolute right-[clamp(8px,1cqi,14px)] top-1/2 -translate-y-1/2 opacity-70">{typeof eyebrow === "string" ? eyebrow : "In review"}</SideLabel>
          </div>
          <LeaderLines
            className={cn("hidden @3xl:block", tiny)}
            from={[33, 25]}
            labels={[
              { text: "NDL 104", x: 56, y: 12 },
              { text: "LMR-2026", x: 60, y: 46 },
              { text: "DOT 5×7", x: 52, y: 70 },
              { text: "C/O RAPUI", x: 66, y: 90 },
            ]}
          />
        </div>
      </ModCell>
    </ModGrid>
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
