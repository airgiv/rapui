/* A whole landing page made of the blocks, five times over: the same JSX in
   every preset, but each preset gets its own copy (content.tsx) — a page that
   talks about itself in that preset's voice — and its own hero picture made of
   live components. What changes between them is the preset on <html> and the
   words; the layout is the blocks' own doing. */
import { isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { usePreset } from "../../rapui/hooks/usePreset";
import { cn } from "../../rapui/utils";
import {
  AILoader,
  BudgetBar,
  Button,
  Container,
  CTA,
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
import house from "./house.webp";
import { CONTENT, type LandingContent } from "./content";

/* a UI shot as a picture: centred on a soft wash of the preset's own colours,
   filling whatever box the block gives its media */
function Scene({ children, flat }: { children: ReactNode; flat?: boolean }) {
  return (
    <div
      className="grid size-full min-h-full grid-cols-[minmax(0,1fr)] place-items-center p-[clamp(12px,4%,40px)]"
      style={{
        // signal is flat: the darker sage tile, no wash
        background: flat
          ? "var(--rap-paper-3)"
          : "radial-gradient(120% 90% at 20% 0%, var(--rap-sky), transparent 60%), radial-gradient(90% 80% at 100% 100%, var(--rap-bubble), transparent 55%), var(--rap-paper-3)",
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
/* signal: the page as a tape on a pocket player — two reels in dotted rings, the title
   and its artist in LCD capitals, a filled waveform split at the playhead, and square
   transport keys on darker sage tiles. The reels turn (a compositor-only spin) while it plays. */
function Reel({ spin, offset = 0 }: { spin: boolean; offset?: number }) {
  return (
    <div className="relative aspect-square w-full text-ink">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="0.8" strokeDasharray="0.01 2.4" strokeLinecap="round" />
        <circle cx="50" cy="50" r="10" fill="var(--rap-fill-strong)" />
      </svg>
      <div
        className={cn("absolute inset-0 motion-reduce:animate-none", spin && "animate-[spin_6s_linear_infinite]")}
        style={{ rotate: `${offset}deg` }}
      >
        <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
          {[90, 210, 330].map((a) => {
            const r = (a * Math.PI) / 180;
            return <line key={a} x1={50 + Math.cos(r) * 14} y1={50 + Math.sin(r) * 14} x2={50 + Math.cos(r) * 40} y2={50 + Math.sin(r) * 40} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />;
          })}
          <circle cx="50" cy="50" r="2.6" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

/* a filled waveform, mirrored about its centre line: the same path twice, the played part in ink */
const WAVE = (() => {
  const n = 120;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * 400;
    const s = Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.113) + 0.45 * Math.sin(i * 1.71)) * 0.75 + 0.12;
    const env = 0.55 + 0.45 * Math.sin((i / n) * Math.PI * 3 + 0.6) ** 2;
    const h = Math.min(30, 30 * s * env) * (i % 2 ? 0.7 : 1);
    top.push(`${x.toFixed(1)} ${(32 - h).toFixed(1)}`);
    bottom.unshift(`${x.toFixed(1)} ${(32 + h * 0.85).toFixed(1)}`);
  }
  return `M0 32L${top.join("L")}L${bottom.join("L")}Z`;
})();

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function TransportKey({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-[clamp(2.75rem,8cqi,4.5rem)] cursor-pointer place-items-center rounded-sm border-0 bg-paper-3 text-ink transition-colors duration-(--rap-dur-fast) hover:bg-fill-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <svg viewBox="0 0 24 24" className="size-[clamp(1.25rem,3cqi,1.75rem)]" fill="currentColor" aria-hidden>
        {children}
      </svg>
    </button>
  );
}

function Player() {
  const total = 120;
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(50);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setT((v) => (v + 1) % total), 1000);
    return () => window.clearInterval(id);
  }, [playing]);
  const played = (t / total) * 400;
  return (
    <div className="@container flex size-full flex-col justify-between gap-4 p-[clamp(16px,3.2cqi,40px)]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-[0.75rem] uppercase text-mute">Tape 004 · side A</span>
        <MatrixStatus label="Receiving" timer={false} className="max-[24rem]:hidden" />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-[5cqi] gap-y-4 @2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="mx-auto grid w-full max-w-[16rem] grid-cols-2 gap-[4cqi] @2xl:max-w-[30rem]">
          <Reel spin={playing} />
          <Reel spin={playing} offset={40} />
        </div>
        <div className="flex min-w-0 flex-col gap-[clamp(10px,2cqi,20px)]">
          <div className="text-center font-display uppercase leading-[1.25] @2xl:text-left">
            <p className="m-0 text-[clamp(1.125rem,2.6cqi,1.75rem)] text-ink">This page</p>
            <p className="m-0 text-[clamp(0.875rem,1.8cqi,1.25rem)] text-mute">Fieldkit</p>
          </div>
          <svg viewBox="0 0 400 64" className="block h-auto w-full" preserveAspectRatio="none" aria-hidden>
            <defs>
              <clipPath id="fk-played">
                <rect width={played} height="64" />
              </clipPath>
            </defs>
            <path d={WAVE} fill="var(--rap-mute)" opacity="0.55" />
            <path d={WAVE} fill="var(--rap-ink)" clipPath="url(#fk-played)" />
            <rect x={played - 0.75} width="1.5" height="64" fill="var(--rap-ink)" />
          </svg>
          <div className="flex justify-between font-display text-[clamp(0.8125rem,1.6cqi,1.0625rem)] tabular-nums">
            <span>
              <span className="text-mute">00:</span>
              {fmt(t)}
            </span>
            <span>
              <span className="text-mute">00:</span>
              {fmt(total)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <TransportKey label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)}>
              {playing ? <path d="M7 5h2.6v14H7zM14.4 5H17v14h-2.6z" /> : <path d="M8 5l11 7-11 7z" />}
            </TransportKey>
            <TransportKey label="Back" onClick={() => setT(0)}>
              <path d="M5 5h2.4v14H5zM8 12l6-6.5v13zM14 12l6-6.5v13z" />
            </TransportKey>
            <TransportKey label="Forward" onClick={() => setT((v) => Math.min(total - 1, v + 15))}>
              <path d="M16.6 5H19v14h-2.4zM4 5.5l6 6.5-6 6.5zM10 5.5l6 6.5-6 6.5z" />
            </TransportKey>
          </div>
        </div>
      </div>
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
  signal: () => <Player />,
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
            HERO_PICTURE.signal()
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
          <Scene flat={preset === "signal"}>
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

