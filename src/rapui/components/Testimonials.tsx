/* ══ Testimonials ═════════════════════════════════════════
   What people say about it: quotes with a name, a role, a face
   or a logo, set the way the preset would set them.

     <Testimonials title="Teams that switched" items={[
       { quote: "…", name: "Ana Ruiz", role: "Head of Research, Kettle", avatar: "/ana.jpg" },
     ]} />

   Per look:
     fun      the first quote huge on a coloured tile with a Sticker
              quote mark slapped on its corner; the rest small tiles,
              packed 4px apart
     civic    a centred serif pull-quote with the speaker's face,
              the others as soft white cards below
     signal   ruled cells, mono attribution (— NAME / ROLE). A
              string quote may mark words like Redact does:
              [on a bar], {blacked out}
     product  a masonry-ish wall of hairline-bordered cards
     minimal  one quote at a time, large, with a plain "1 / 3" pager
              (buttons; ← and → work when the quote has focus)

   Delight (fun): the quote-mark sticker is slapped on when the
   block mounts and wobbles under the hand. Calm: the sticker just
   sits there; the minimal pager swaps quotes without a fade. */
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils";
import { ArrowLeft, ArrowRight } from "../icons";
import { Grid, Section, SectionHeader, Stack, useBlockLook, type BlockLook, type SectionProps } from "./Layout";
import { Avatar } from "./Avatar";
import { Redact } from "./Redact";
import { Sticker } from "./Sticker";

export interface TestimonialItem {
  quote: ReactNode;
  name: string;
  role?: string;
  /** Image URL for the speaker's face; initials on a colour otherwise. */
  avatar?: string;
  /** The company's logo (a small SVG or <img>). */
  logo?: ReactNode;
}

export interface TestimonialsProps extends Omit<SectionProps, "title"> {
  eyebrow?: ReactNode;
  index?: string;
  title?: ReactNode;
  lead?: ReactNode;
  items: TestimonialItem[];
  look?: BlockLook;
}

export function Testimonials({ eyebrow, index, title, lead, items, look: lookProp, className, ...rest }: TestimonialsProps) {
  const { ref, look } = useBlockLook(lookProp);
  const Body = { fun: FunQuotes, civic: CivicQuotes, signal: SignalQuotes, product: ProductQuotes, minimal: MinimalQuotes }[look];
  const header = title ? (
    <SectionHeader eyebrow={eyebrow} index={index} title={title} lead={lead} align={look === "civic" || look === "product" ? "center" : "start"} />
  ) : null;
  return (
    <Section ref={ref} data-look={look} data-slot="testimonials" className={className} {...rest}>
      <Stack gap={look === "minimal" ? "2xl" : "xl"}>
        {header}
        {items.length > 0 && <Body items={items} />}
      </Stack>
    </Section>
  );
}

type BodyProps = { items: TestimonialItem[] };

/** The quote as given; a string in the signal look may carry Redact marks. */
function QuoteText({ quote, redact }: { quote: ReactNode; redact?: boolean }) {
  if (redact && typeof quote === "string" && /[[{]/.test(quote)) return <Redact as="span">{quote}</Redact>;
  return <>{quote}</>;
}

/** A face (or initials) with the name and role beside it. */
function Byline({ item, size = "md", className, center }: { item: TestimonialItem; size?: "sm" | "md" | "lg"; className?: string; center?: boolean }) {
  return (
    <figcaption data-slot="testimonial-byline" className={cn("flex items-center gap-(--rap-space-sm) min-w-0", center && "flex-col text-center", className)}>
      <Avatar name={item.name} src={item.avatar} size={size} />
      <span className="flex flex-col min-w-0">
        <cite className="not-italic font-medium text-[0.9375rem] leading-[1.3]">{item.name}</cite>
        {item.role && <span className="text-[0.875rem] leading-[1.35] opacity-75">{item.role}</span>}
      </span>
      {item.logo && !center && <span className="ml-auto flex-none opacity-80 [&_svg]:h-5 [&_svg]:w-auto">{item.logo}</span>}
    </figcaption>
  );
}

/* fun: one huge quote on a tile with a sticker, the rest small tiles. The big
   tile spans two columns and two rows once the grid has three columns. */
const SMALL_TILES = [
  { bg: "bg-acid", theme: "light" as const },
  { bg: "bg-sky", theme: "light" as const },
  { bg: "bg-surface", theme: "light" as const },
  { bg: "bg-bubble", theme: "light" as const },
];

function FunQuotes({ items }: BodyProps) {
  const [first, ...rest] = items;
  return (
    <Grid cols={3} gap="tile" className="[grid-auto-flow:row_dense]">
      <figure
        data-slot="testimonial"
        data-rap-theme="dark"
        className="relative m-0 flex flex-col justify-between gap-(--rap-space-xl) min-h-[22rem] p-(--rap-space-lg) @min-[40rem]:p-(--rap-space-xl) rounded-card bg-flame text-ink @min-[40rem]:col-span-2 @min-[60rem]:row-span-2"
      >
        <Sticker shape="burst" color="acid" rotate={-10} size="2.6rem" slap aria-hidden className="absolute -top-3 -right-2 w-[5.5rem] font-display z-1">
          “
        </Sticker>
        <blockquote className="m-0 font-display text-display-lg font-medium leading-[1.02] tracking-[-0.04em] text-balance pr-(--rap-space-xl)">
          {first.quote}
        </blockquote>
        <Byline item={first} size="lg" />
      </figure>
      {rest.map((item, i) => {
        const t = SMALL_TILES[i % SMALL_TILES.length];
        return (
          <figure
            key={i}
            data-slot="testimonial"
            data-rap-theme={t.theme}
            className={cn("m-0 flex flex-col justify-between gap-(--rap-space-lg) p-(--rap-space-lg) rounded-card text-ink", t.bg)}
          >
            <blockquote className="m-0 text-[1.125rem] font-medium leading-[1.4] tracking-[-0.01em]">{item.quote}</blockquote>
            <Byline item={item} size="sm" />
          </figure>
        );
      })}
    </Grid>
  );
}

/* civic: a centred serif pull-quote, the others as soft cards below */
function CivicQuotes({ items }: BodyProps) {
  const [first, ...rest] = items;
  return (
    <Stack gap="xl">
      <figure data-slot="testimonial" className="m-0 mx-auto flex flex-col items-center gap-(--rap-space-lg) max-w-[52rem] text-center text-ink">
        <span aria-hidden className="font-display text-[5rem] leading-[0.5] h-[2.2rem] text-flame">“</span>
        <blockquote className="m-0 font-display text-display-md @min-[48rem]:text-[2.25rem] font-normal leading-[1.3] tracking-[-0.015em] text-balance">
          {first.quote}
        </blockquote>
        <Byline item={first} size="lg" center />
      </figure>
      {rest.length > 0 && (
        <Grid cols={Math.min(rest.length, 3)} gap="tile">
          {rest.map((item, i) => (
            <figure key={i} data-slot="testimonial" className="m-0 flex flex-col justify-between gap-(--rap-space-lg) p-(--rap-space-lg) rounded-card bg-surface text-ink shadow-[inset_0_0_0_1px_var(--rap-edge)]">
              <blockquote className="m-0 font-display text-[1.25rem] leading-[1.45] tracking-[-0.01em]">“{item.quote}”</blockquote>
              <Byline item={item} />
            </figure>
          ))}
        </Grid>
      )}
    </Stack>
  );
}

/* signal: ruled cells, mono attribution */
function SignalQuotes({ items }: BodyProps) {
  return (
    <Grid cols={Math.min(items.length, 3)} gap="tile" className="bg-line border-[length:var(--rap-gap-tile)] border-line">
      {items.map((item, i) => (
        <figure key={i} data-slot="testimonial" className="m-0 flex flex-col justify-between gap-(--rap-space-xl) p-(--rap-space-md) bg-paper text-ink min-h-[16rem]">
          <div className="flex flex-col gap-(--rap-space-sm)">
            <span aria-hidden className="font-mono text-[0.75rem] tracking-[0.08em] text-flame">[{String(i + 1).padStart(2, "0")}] TRANSCRIPT</span>
            <blockquote className="m-0 text-[1.125rem] leading-[1.5] tracking-[-0.005em]">
              <QuoteText quote={item.quote} redact />
            </blockquote>
          </div>
          <figcaption className="flex items-end justify-between gap-(--rap-space-sm) pt-(--rap-space-sm) border-t border-line font-mono text-[0.6875rem] uppercase tracking-[0.1em] leading-[1.5]">
            <span className="min-w-0">
              <cite className="not-italic text-ink">— {item.name}</cite>
              {item.role && <span className="block text-ink-2">{item.role}</span>}
            </span>
            {item.logo && <span className="flex-none text-ink-2 [&_svg]:h-4 [&_svg]:w-auto">{item.logo}</span>}
          </figcaption>
        </figure>
      ))}
    </Grid>
  );
}

/* product: a masonry-ish wall of bordered cards (CSS columns keep each card whole) */
function ProductQuotes({ items }: BodyProps) {
  return (
    <div data-slot="testimonial-wall" className="columns-1 @min-[40rem]:columns-2 @min-[60rem]:columns-3 gap-(--rap-column-gap)">
      {items.map((item, i) => (
        <figure
          key={i}
          data-slot="testimonial"
          className="m-0 mb-(--rap-column-gap) break-inside-avoid flex flex-col gap-(--rap-space-md) p-(--rap-space-lg) rounded-card bg-surface text-ink shadow-[inset_0_0_0_1px_var(--rap-line)]"
        >
          {item.logo && <span className="text-mute [&_svg]:h-5 [&_svg]:w-auto">{item.logo}</span>}
          <blockquote className="m-0 text-[0.9375rem] leading-[1.6] text-ink-2">{item.quote}</blockquote>
          <Byline item={{ ...item, logo: undefined }} size="sm" />
        </figure>
      ))}
    </div>
  );
}

/* minimal: one at a time, large, with a plain pager */
function MinimalQuotes({ items }: BodyProps) {
  const [at, setAt] = useState(0);
  const n = items.length;
  useEffect(() => {
    if (at >= n) setAt(0);
  }, [at, n]);
  const item = items[Math.min(at, n - 1)];
  const go = (d: number) => setAt((i) => (i + d + n) % n);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") (e.preventDefault(), go(1));
    if (e.key === "ArrowLeft") (e.preventDefault(), go(-1));
  };
  const btn =
    "grid place-items-center size-10 border border-line bg-transparent text-ink cursor-pointer hover:bg-fill disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  return (
    <div data-slot="testimonial-pager" role="group" aria-roledescription="carousel" aria-label="Testimonials" className="flex flex-col gap-(--rap-space-xl)">
      <figure
        data-slot="testimonial"
        tabIndex={n > 1 ? 0 : undefined}
        onKeyDown={n > 1 ? onKey : undefined}
        aria-live="polite"
        className="m-0 flex flex-col gap-(--rap-space-lg) max-w-[60rem] text-ink focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-ring"
      >
        <blockquote key={at} className="animate-[rap-fade-in_var(--rap-dur)_var(--rap-ease-out)] calm:animate-none m-0 font-display text-display-lg font-medium leading-[1.1] tracking-[-0.035em] text-balance">“{item.quote}”</blockquote>
        <figcaption className="text-[0.9375rem] text-ink-2">
          <cite className="not-italic text-ink">{item.name}</cite>
          {item.role && <span>, {item.role}</span>}
        </figcaption>
      </figure>
      {n > 1 && (
        <div className="flex items-center gap-(--rap-space-sm) pt-(--rap-space-md) border-t border-line">
          <button type="button" className={btn} onClick={() => go(-1)} aria-label="Previous quote">
            <ArrowLeft size={16} />
          </button>
          <button type="button" className={btn} onClick={() => go(1)} aria-label="Next quote">
            <ArrowRight size={16} />
          </button>
          <span className="ml-auto text-[0.875rem] text-mute tabular-nums">
            <span className="sr-only">Quote </span>
            {at + 1} <span aria-hidden>/</span>
            <span className="sr-only"> of</span> {n}
          </span>
        </div>
      )}
    </div>
  );
}
