/* A whole landing page made of the blocks, five times over: the same JSX in
   every preset, but each preset gets its own copy (content.tsx) — a page that
   talks about itself in that preset's voice — and its own hero picture made of
   live components. What changes between them is the preset on <html> and the
   words; the layout is the blocks' own doing. */
import { isValidElement, useRef, useState, type ReactNode } from "react";
import { usePreset } from "../../rapui/hooks/usePreset";
import { cn } from "../../rapui/utils";
import {
  AILoader,
  BudgetBar,
  Button,
  Container,
  CTA,
  DotMatrix,
  FAQ,
  Features,
  FeatureSplit,
  Hero,
  Laurel,
  LogoCloud,
  MatrixStatus,
  Pricing,
  Rating,
  Receipt,
  Redact,
  SiteFooter,
  SiteHeader,
  Slider,
  SourceCard,
  Statement,
  StatementSlot,
  Stats,
  Switch,
  Testimonials,
  type CitationSource,
  type FeatureItem,
  type RapPreset,
} from "../../rapui";
import { Foliage } from "./foliage";
import house from "./house.webp";
import { CONTENT, type LandingContent } from "./content";

/* a UI shot as a picture: centred on a soft wash of the preset's own colours,
   filling whatever box the block gives its media */
function Scene({ children }: { children: ReactNode }) {
  return (
    <div
      className="grid size-full min-h-full grid-cols-[minmax(0,1fr)] place-items-center p-[clamp(12px,4%,40px)]"
      style={{
        background:
          "radial-gradient(120% 90% at 20% 0%, var(--rap-sky), transparent 60%), radial-gradient(90% 80% at 100% 100%, var(--rap-bubble), transparent 55%), var(--rap-paper-3)",
      }}
    >
      <div className="w-full max-w-[34rem]">{children}</div>
    </div>
  );
}

const card = "flex w-full flex-col gap-4 rounded-card bg-surface p-(--rap-space-md) text-left shadow-[inset_0_0_0_1px_var(--rap-edge)]";

/* the award each landing gives itself, framed in the preset's laurels */
const LAUREL: Record<RapPreset, { eyebrow: string; text: string; caption: string }> = {
  fun: { eyebrow: "Self-awarded", text: "Loudest landing page of the year", caption: "Hollr · 2026" },
  civic: { eyebrow: "In the matter of this page", text: "Every component, working together", caption: "Precedent · so ordered" },
  signal: { eyebrow: "Field report", text: "Page received in full", caption: "Fieldkit · 104.2 MHz" },
  product: { eyebrow: "Editors’ Choice", text: "#1 in Landing pages", caption: "Shiplog · shipped itself" },
  minimal: { eyebrow: "Award", text: "Less", caption: "2026" },
};

/* ── the hero pictures, one per preset, all live ── */

/* fun: a tray of parts to poke */
function Playground() {
  return (
    <div className="grid w-full grid-cols-2 gap-1">
      <div className="grid min-h-28 place-items-center rounded-card bg-surface p-4">
        <Switch defaultChecked onText="ON" offText="OFF" aria-label="A switch" />
      </div>
      <div className="grid min-h-28 place-items-center rounded-card bg-acid p-4" data-rap-theme="light">
        <Rating defaultValue={4} size={26} aria-label="A rating" />
      </div>
      <div className="grid min-h-28 place-items-center rounded-card bg-sky p-6" data-rap-theme="light">
        <Slider defaultValue={[64]} aria-label="A slider" className="w-full" />
      </div>
      <div className="grid min-h-28 place-items-center rounded-card bg-surface p-4">
        <Button icon>Poke me</Button>
      </div>
    </div>
  );
}

/* the little striped flag in front of civic's "unofficial website" line */
function Pennant() {
  return (
    <svg viewBox="0 0 16 11" width="16" height="11" aria-hidden className="shrink-0 rounded-[1px]">
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} y={(i * 11) / 7} width="16" height={11 / 14} fill="var(--rap-flame)" />
      ))}
      <rect width="7" height="6" fill="var(--rap-plum)" />
    </svg>
  );
}

/* civic: the page asks counsel about itself */
const CIVIC_SOURCES: CitationSource[] = [
  { url: "https://rapui.dev/#docs", title: "The civic preset, tokens and type", site: "rapui docs", snippet: "A transitional serif, navy ink, soft white cards, calm motion." },
  { url: "https://www.w3.org/TR/WCAG22/", title: "WCAG 2.2, 1.4.3 Contrast (Minimum)", site: "W3C", snippet: "Text has a contrast ratio of at least 4.5:1." },
  { url: "https://rapui.dev/#landing", title: "This page", site: "rapui", snippet: "A landing page, respectfully submitted." },
];
/* civic: a photograph on the front page, hung like an exhibit — a museum label in
   its corner, and on the label a switch that calls an evening session (the light drops) */
function Counsel() {
  const [evening, setEvening] = useState(false);
  return (
    <div className="relative grid size-full grid-cols-[minmax(0,1fr)] content-start @md:content-end justify-items-start p-[clamp(12px,4%,40px)]">
      <img
        src={house}
        alt="A white house with a red roof on a green field by a fjord"
        className={cn("absolute inset-0 size-full object-cover object-[68%_50%] transition-[filter] duration-(--rap-dur-slow)", evening && "brightness-[0.55] saturate-[0.8] hue-rotate-[12deg]")}
      />
      <figure className="relative m-0 flex w-full max-w-[17rem] @md:max-w-[19rem] flex-col gap-2 rounded-card bg-surface/95 p-(--rap-space-md) text-left shadow-pop backdrop-blur-sm">
        <span className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-2">Exhibit B · Plate I</span>
        <figcaption className="font-display text-[1.375rem] @md:text-[1.625rem] leading-[1.1] text-ink">A house, entered into evidence</figcaption>
        <p className="m-0 hidden text-[0.875rem] leading-snug text-ink-2 @md:block">Photograph on landing page. On loan from the record; please do not touch, except the switch.</p>
        <div className="mt-1 border-t border-line pt-3">
          <Switch checked={evening} onCheckedChange={setEvening} label="Evening session" />
        </div>
      </figure>
    </div>
  );
}
/* signal: the page receiving itself */
function Transmission() {
  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-4 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-2">
        <span>RX · 104.2 MHz</span>
        <span className="text-flame">● live</span>
      </div>
      <MatrixStatus label="Receiving page 1 of 1" timer />
      <Redact as="p" className="m-0 text-[0.9375rem] leading-[1.6] text-ink-2">
        {"This page is a [landing page] wearing the {signal preset}. It describes itself in [fragments], some of them {classified} for effect."}
      </Redact>
      <DotMatrix cols={32} rows={4} size={4} gap={3} animation="wave" aria-hidden />
    </div>
  );
}

/* product: the page's own dashboard */
function Console() {
  return (
    <div className={card}>
      <BudgetBar
        label="Attention budget"
        budget={100}
        currency="USD"
        pace={0.62}
        categories={[
          { name: "Headline", amount: 38 },
          { name: "Bento", amount: 21 },
          { name: "Pricing", amount: 14 },
          { name: "FAQ", amount: 6 },
        ]}
        compact
      />
      <div className="flex items-center justify-between gap-3 rounded-sm bg-fill px-3 py-2">
        <AILoader label="Deploying landing page" timer />
      </div>
    </div>
  );
}

/* minimal: an itemised bill for the page */
function Bill() {
  return (
    <Receipt
      merchant="Less."
      date={new Date(2026, 9, 14, 9, 0)}
      items={[
        { name: "Headline", qty: 1, price: 0 },
        { name: "Hairlines", qty: 14, price: 0 },
        { name: "White space", qty: 1, price: 0, note: "most of it" },
        { name: "Colour", qty: 0, price: 0 },
      ]}
      payment="Attention"
      code="barcode"
      reference="LESS-0001"
      footer="Thank you for scrolling."
    />
  );
}

const HERO_PICTURE: Record<RapPreset, () => ReactNode> = {
  fun: () => <Playground />,
  civic: () => <Counsel />,
  signal: () => <Transmission />,
  product: () => <Console />,
  minimal: () => <Bill />,
};

/* the split's picture: a ranked board, the page's own numbers in the page's own voice */
function Board({ board }: { board: LandingContent["split"]["board"] }) {
  const max = Math.max(...board.rows.map((r) => r[1]), 1);
  return (
    <div className={cn3(card, "gap-3")}>
      <div className="flex items-baseline justify-between gap-4 text-[0.8125rem] text-mute">
        <span className="font-medium text-ink">{board.title}</span>
        <span>{board.unit}</span>
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {board.rows.map(([label, n, tag]) => (
          <li key={label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
              <span className="min-w-0 text-ink">{label}</span>
              <span className="shrink-0 tabular-nums text-ink-2">{n.toLocaleString("en-US")}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 rounded-pill bg-accent" style={{ width: `${Math.max(2, (n / max) * 70)}%` }} />
              <span className="text-[0.75rem] text-mute">{tag}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
const cn3 = (...c: string[]) => c.join(" ");

/* product shows the thing itself in its wide bento cards: live parts, not pictures */
function liveFeatures(items: FeatureItem[]): FeatureItem[] {
  return items.map((f, i) =>
    i === 0
      ? { ...f, media: <div className="w-full max-w-[17rem] p-3"><SourceCard source={CIVIC_SOURCES[0]} index={1} /></div> }
      : i === items.length - 1
        ? { ...f, media: <div className="rounded-pill bg-surface px-4 py-2.5 shadow-pop"><AILoader label="Hovering back" timer /></div> }
        : f,
  );
}

/* a space before the words after a part — unless they open with punctuation, which then
   gets a word joiner so a comma or full stop never wraps to the start of the next line */
function gap(next: ReactNode): string {
  const first = typeof next === "string" ? next : isValidElement<{ children?: ReactNode }>(next) ? [next.props.children].flat()[0] : "";
  return typeof first === "string" && /^[.,;:!?]/.test(first) ? "\u2060" : " ";
}

const href = (s: string) => `#${s.toLowerCase().replace(/[^a-z]+/g, "-")}`;

export function LandingTemplate() {
  const ref = useRef<HTMLDivElement>(null);
  const { preset } = usePreset(ref);
  const c = CONTENT[preset];
  // the arrow in a bubble is rapui's own button; the quieter presets keep a plain one
  const arrows = preset === "fun" || preset === "product";
  const logo = <span className="font-display text-[1.375rem] [font-weight:var(--rap-display-weight)] tracking-[-0.03em]">{c.brand}</span>;
  const [lFeatures, lSplit, lPricing, lFaq] = c.links;
  return (
    <div ref={ref} data-slot="landing" className="bg-paper text-ink font-sans">
      <SiteHeader
        logo={logo}
        notice={
          preset === "civic" ? (
            <>
              <Pennant />
              <span>
                An unofficial website of the Precedent landing page. <a href="#faq" className="text-blue underline underline-offset-2">Here’s how you know</a>
              </span>
            </>
          ) : undefined
        }
        links={[
          { label: lFeatures, href: "#features" },
          { label: lSplit, href: "#split" },
          { label: lPricing, href: "#pricing" },
          { label: lFaq, href: "#faq" },
        ]}
        actions={
          // fun's bar is a tall pill: a full-size button with the arrow, inset as far from the
          // right end as from the top and bottom; the slimmer bars take a small one
          <Button size={preset === "fun" ? "md" : "sm"} variant="accent" icon={preset === "fun" || undefined}>
            {c.hero.primary}
          </Button>
        }
      />
      <Hero
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        lead={c.hero.lead}
        actions={
          <>
            <Button variant="accent" icon={arrows || undefined}>
              {c.hero.primary}
            </Button>
            <Button variant="soft">{c.hero.secondary}</Button>
          </>
        }
        media={
          preset === "signal" ? (
            // signal's plate is a scanned photograph (soft foliage) with the live readout laid on it
            <div className="relative grid size-full place-items-center p-[clamp(12px,4%,40px)]">
              <div className="absolute inset-0 [&>svg]:size-full">
                <Foliage />
              </div>
              <div className="relative w-full max-w-[30rem]">{HERO_PICTURE.signal()}</div>
            </div>
          ) : preset === "civic" ? (
            HERO_PICTURE.civic()
          ) : (
            <Scene>{HERO_PICTURE[preset]()}</Scene>
          )
        }
        meta={c.hero.meta.length ? c.hero.meta : undefined}
      />
      <LogoCloud title={c.logosTitle} logos={c.logos.map((name) => ({ name }))} />
      <Features id="features" index="01" eyebrow={c.features.eyebrow} title={c.features.title} lead={c.features.lead} items={preset === "product" ? liveFeatures(c.features.items) : c.features.items} />
      <Statement eyebrow={c.statement.eyebrow} size="lg">
        {c.statement.before}
        {" "}
        <StatementSlot>
          <Switch defaultChecked aria-label="A switch" />
        </StatementSlot>
        {gap(c.statement.afterSwitch)}
        {c.statement.afterSwitch}{" "}
        <StatementSlot>
          <Button size="sm" icon={arrows || undefined}>
            {c.statement.button}
          </Button>
        </StatementSlot>
        {gap(c.statement.afterButton)}
        {c.statement.afterButton}{" "}
        <StatementSlot>
          <Slider defaultValue={[62]} aria-label="A slider" className="w-28" />
        </StatementSlot>
        {gap(c.statement.afterSlider)}
        {c.statement.afterSlider}{" "}
        <StatementSlot>
          <Rating defaultValue={4} size={28} aria-label="A rating" />
        </StatementSlot>
        {gap(c.statement.end)}
        {c.statement.end}
      </Statement>
      <FeatureSplit
        id="split"
        index="02"
        eyebrow={c.split.eyebrow}
        title={c.split.title}
        lead={c.split.lead}
        points={c.split.points}
        media={
          <Scene>
            <Board board={c.split.board} />
          </Scene>
        }
        caption={c.split.caption}
      />
      <Stats index="03" eyebrow={c.stats.eyebrow} title={c.stats.title} items={c.stats.items} />
      <Testimonials index="04" eyebrow={c.quotes.eyebrow} title={c.quotes.title} items={c.quotes.items} />
      <Pricing id="pricing" index="05" eyebrow={c.pricing.eyebrow} title={c.pricing.title} lead={c.pricing.lead} plans={c.pricing.plans} />
      <FAQ id="faq" index="06" eyebrow={c.faq.eyebrow} title={c.faq.title} items={c.faq.items} />
      {/* a laurel line between the questions and the close, each preset's own wreath */}
      <Container className="flex justify-center py-(--rap-space-xl)">
        <Laurel size="lg" eyebrow={LAUREL[preset].eyebrow} caption={LAUREL[preset].caption}>
          {LAUREL[preset].text}
        </Laurel>
      </Container>
      <CTA
        eyebrow={c.cta.eyebrow}
        title={c.cta.title}
        lead={c.cta.lead}
        actions={
          <>
            <Button variant="accent" icon={arrows || undefined}>
              {c.cta.primary}
            </Button>
            <Button variant="soft">{c.cta.secondary}</Button>
          </>
        }
      />
      <SiteFooter
        logo={logo}
        tagline={c.tagline}
        wordmark={c.brand}
        columns={c.footer.columns.map((col) => ({ title: col.title, links: col.links.map((l) => ({ label: l, href: href(l) })) }))}
        bottom={<span>{c.footer.fine}</span>}
      />
      <Container className="h-6" />
    </div>
  );
}

