/* A whole landing page made of the blocks, for one fictional product —
   Docket, an AI research desk for lawyers: it reads every new ruling, filing
   and regulation overnight and answers like a good newspaper, every claim
   cited to its page. The same JSX in every preset: what changes between fun, civic,
   signal, product and minimal is only the preset on <html>. */
import { useRef, type ReactNode } from "react";
import { usePreset } from "../../rapui/hooks/usePreset";
import {
  Accent,
  AILoader,
  SourceCard,
  Button,
  ChatMessage,
  Citation,
  Container,
  CTA,
  Pricing,
  SiteFooter,
  SiteHeader,
  type PricingPlan,
  Features,
  FeatureSplit,
  FAQ,
  Hero,
  LogoCloud,
  Sources,
  SourcesProvider,
  Stats,
  Testimonials,
  type CitationSource,
  type FeatureItem,
  type FAQItem,
  type StatItem,
  type TestimonialItem,
} from "../../rapui";

const SOURCES: CitationSource[] = [
  { url: "https://example.org/hartwell", title: "Hartwell v. Ono Systems, Cal. Ct. App. (2026)", site: "Court of Appeal", snippet: "A covenant void under §16600 cannot be revived by a choice-of-law clause naming another state." },
  { url: "https://example.org/16600-5", title: "Bus. & Prof. Code §16600.5", site: "California Code", snippet: "Any contract that is void under this chapter is unenforceable regardless of where and when the contract was signed." },
  { url: "https://example.org/alert", title: "Non-competes after Hartwell: what to tell clients", site: "Alder & Finch LLP", snippet: "Employers should review notice obligations for current and former employees by 14 February." },
];

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

/* the product in one picture: an associate's question, answered with sources */
function AnswerCard() {
  return (
    <SourcesProvider sources={SOURCES}>
      <div className="flex w-full flex-col gap-4 rounded-card bg-surface p-(--rap-space-md) text-left shadow-[inset_0_0_0_1px_var(--rap-edge)]">
        <ChatMessage role="user" time="07:42">
          Did anything change this quarter on enforcing an out-of-state non-compete in California?
        </ChatMessage>
        <ChatMessage role="assistant" name="Docket">
          Yes. On Tuesday the Court of Appeal held that a choice-of-law clause can't revive a covenant that §16600 voids
          <Citation index={1} /> — in line with §16600.5, which reaches contracts signed anywhere
          <Citation index={2} />. <strong>Two of your matters</strong> rely on Delaware clauses.
        </ChatMessage>
        <Sources layout="row" max={3} label={null} />
      </div>
    </SourcesProvider>
  );
}

/* the partner's side: what moved overnight on the firm's own matters, as a ranked front page */
const DIGEST = [
  ["Hartwell v. Ono Systems", 4, "Employment"],
  ["SEC climate disclosure rule, stay lifted", 3, "Securities"],
  ["Delaware Ch. on advance-notice bylaws", 2, "Corporate"],
  ["EU AI Act: GPAI code of practice", 1, "Technology"],
] as const;

function Digest() {
  const max = DIGEST[0][1];
  return (
    <div className="flex w-full flex-col gap-3 rounded-card bg-surface p-(--rap-space-md) text-left shadow-[inset_0_0_0_1px_var(--rap-edge)]">
      <div className="flex items-baseline justify-between gap-4 text-[0.8125rem] text-mute">
        <span className="font-medium text-ink">Overnight, on your matters</span>
        <span>matters · practice</span>
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {DIGEST.map(([q, n, area]) => (
          <li key={q} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
              <span className="min-w-0 text-ink">{q}</span>
              <span className="shrink-0 tabular-nums text-ink-2">{n}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 rounded-pill bg-accent" style={{ width: `${(n / max) * 70}%` }} />
              <span className="text-[0.75rem] text-mute">{area}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const FEATURES: FeatureItem[] = [
  { title: "Every claim, cited", text: "Each sentence links to the page of the ruling, statute or filing it came from. If Docket can't cite it, it doesn't say it.", icon: "document" },
  { title: "Read overnight", text: "New opinions, dockets, agency rules and client alerts across 41 jurisdictions, read while you sleep and briefed by 7 am.", icon: "notebook" },
  { title: "Your matters, not the news", text: "Docket knows what the firm is working on, so the brief leads with what touches your clients — not what trended.", icon: "case" },
  { title: "Plain words, exact terms", text: "Answers read like a good newspaper, with the holding, the statute and the standard of review kept word for word.", icon: "chat-round-dots" },
  { title: "Privileged by design", text: "Your questions and matters never train a model and never leave your tenancy. SOC 2 Type II, EU and US data residency.", icon: "lock" },
  { title: "Knows when to ask a person", text: "When the law is unsettled, Docket says so, shows both lines of authority and routes the question to the right partner.", icon: "inbox" },
];

/* product shows the thing itself in its wide bento cards: live parts, not pictures */
const LIVE_FEATURES: FeatureItem[] = FEATURES.map((f, i) =>
  i === 0
    ? { ...f, media: <div className="w-full max-w-[17rem] p-3"><SourceCard source={SOURCES[0]} index={1} /></div> }
    : i === FEATURES.length - 1
      ? { ...f, media: <div className="rounded-pill bg-surface px-4 py-2.5 shadow-pop"><AILoader label="Reading 3 new filings" timer /></div> }
      : f,
);

const STATS: StatItem[] = [
  { value: 2.4, suffix: "M", label: "rulings read", note: "and counting, nightly" },
  { value: 98, suffix: "%", label: "of claims cited", note: "the rest are flagged" },
  { value: 41, label: "jurisdictions", note: "US, UK and the EU" },
  { value: 6, suffix: " min", label: "to read the morning brief" },
];

const QUOTES: TestimonialItem[] = [
  { quote: "I used to start every morning with forty tabs of alerts. Now I read one brief over coffee and know which three things need me today.", name: "Helena Marsh", role: "Partner, Employment" },
  { quote: "The citations are what made it usable. I can drop a Docket answer into a memo and every line already points at the page.", name: "Tomás Reyes", role: "Senior associate, Litigation" },
  { quote: "It told us a ruling touched two live matters before opposing counsel had finished their client alert.", name: "Grace Okonkwo", role: "General counsel, Lumen Health" },
];

const QUESTIONS: FAQItem[] = [
  { q: "Where do the answers come from?", a: "Only from primary and trusted secondary sources: court opinions and dockets, statutes and regulations, agency guidance, and the alerts of firms you choose to follow. Docket does not answer from the open web." },
  { q: "What about hallucinations?", a: "Every claim is tied to a cited passage, and a second model checks each citation against its source before the answer is shown. Anything it can't verify is marked as unverified, not stated as fact." },
  { q: "Is our work product confidential?", a: "Yes. Matters and questions stay in your firm's tenancy, are encrypted at rest and in transit, and are never used for training. We sign your outside counsel guidelines." },
  { q: "Which jurisdictions do you cover?", a: "All US federal courts and the fifty states, England and Wales, and the EU institutions — 41 jurisdictions in all, with more added each quarter." },
  { q: "Does it work with our document system?", a: "Docket connects to iManage, NetDocuments and SharePoint to learn which matters are live, and posts briefs to Teams or Slack if you'd rather not open another tab." },
];

const PLANS: PricingPlan[] = [
  {
    name: "Solo",
    price: { monthly: 89, yearly: 72 },
    currency: "$",
    period: "/seat/mo",
    description: "For a single practitioner",
    features: ["Morning brief, 3 practice areas", "Cited answers", "US federal + 1 state", "Email support"],
    cta: { label: "Start a 14-day trial" },
  },
  {
    name: "Firm",
    price: { monthly: 149, yearly: 119 },
    currency: "$",
    period: "/seat/mo",
    description: "From 10 to 500 lawyers",
    features: ["Everything in Solo", "All 41 jurisdictions", "Matter-aware briefs", "iManage & NetDocuments", "Partner routing"],
    cta: { label: "Book a demo" },
    featured: true,
    badge: "Most firms",
  },
  {
    name: "Enterprise",
    price: { monthly: "Custom" },
    description: "In-house teams and large firms",
    features: ["Everything in Firm", "Private deployment", "Custom sources", "Dedicated counsel success"],
    cta: { label: "Contact sales" },
  },
];

export function LandingTemplate() {
  // the arrow in a bubble is rapui's own button; the quieter presets keep a plain one
  const ref = useRef<HTMLDivElement>(null);
  const { preset } = usePreset(ref);
  const arrows = preset === "fun" || preset === "product";
  return (
    <div ref={ref} data-slot="landing" className="bg-paper text-ink font-sans">
      <SiteHeader
        logo={<span className="font-display text-[1.375rem] [font-weight:var(--rap-display-weight)] tracking-[-0.03em]">Docket</span>}
        links={[
          { label: "How it works", href: "#how" },
          { label: "Coverage", href: "#cities" },
          { label: "Pricing", href: "#pricing" },
          { label: "FAQ", href: "#faq" },
        ]}
        actions={
          <Button size="sm" variant="accent">
            Book a demo
          </Button>
        }
      />
      <Hero
        eyebrow="The morning edition for 300 firms"
        title={
          <>
            The law changed overnight. <Accent>Here’s your brief.</Accent>
          </>
        }
        lead="Docket reads every new ruling, filing and regulation while you sleep, and answers your questions in plain words — every claim cited to the page it came from."
        actions={
          <>
            <Button variant="accent" icon={arrows || undefined}>
              Book a demo
            </Button>
            <Button variant="soft">Read today’s brief</Button>
          </>
        }
        media={<Scene><AnswerCard /></Scene>}
        meta={[
          { label: "Edition", value: "No. 1,214" },
          { label: "Read overnight", value: "18,402 documents" },
          { label: "Jurisdictions", value: "41" },
        ]}
      />
      <LogoCloud
        title="Read every morning at"
        logos={[{ name: "Alder & Finch" }, { name: "Morrow Kline" }, { name: "Hale Partners" }, { name: "Vantage Legal" }, { name: "Briar & Stone" }, { name: "Lowell Chambers" }]}
      />
      <Features
        id="how"
        index="01"
        eyebrow="How it works"
        title={<>A research desk <Accent tone="mute">that never goes home</Accent></>}
        lead="Docket reads what the courts, legislatures and agencies publish, and writes it up for the matters on your desk."
        items={preset === "product" ? LIVE_FEATURES : FEATURES}
      />
      <FeatureSplit
        index="02"
        eyebrow="For partners"
        title={<>Fewer hours on research, <Accent tone="mute">more on judgement</Accent></>}
        lead="Docket ranks the night's developments by how many of your live matters they touch, so the front page is the part that needs you."
        points={["A front page per practice group, every morning", "Matter alerts the moment a ruling lands", "Hand-offs to the right partner, with the sources attached"]}
        media={<Scene><Digest /></Scene>}
        caption="Alder & Finch, Tuesday edition"
      />
      <Stats id="cities" index="03" eyebrow="In numbers" title={<>A year <Accent tone="mute">of mornings</Accent></>} items={STATS} />
      <Testimonials index="04" eyebrow="From the bar" title={<>What lawyers <Accent tone="mute">say</Accent></>} items={QUOTES} />
      <Pricing
        id="pricing"
        index="05"
        eyebrow="Pricing"
        title={<>Priced by the seat, <Accent tone="mute">not by the question</Accent></>}
        lead="Every plan includes unlimited questions, the morning brief and a 14-day trial on your own matters."
        plans={PLANS}
      />
      <FAQ id="faq" index="06" eyebrow="Questions" title={<>Before you ask Docket, <Accent tone="mute">ask us</Accent></>} items={QUESTIONS} />
      <CTA
        eyebrow="Trial on your own matters"
        title={<>Wake up to a brief <Accent tone="mute">that has read everything</Accent></>}
        lead="Connect a practice group and tomorrow's edition will be about your clients — with every line cited."
        actions={
          <>
            <Button variant="accent" icon={arrows || undefined}>
              Book a demo
            </Button>
            <Button variant="soft">See a sample edition</Button>
          </>
        }
      />
      <SiteFooter
        logo={<span className="font-display text-[1.375rem] [font-weight:var(--rap-display-weight)] tracking-[-0.03em]">Docket</span>}
        tagline="The law, read for you every morning."
        wordmark="Docket"
        columns={[
          { title: "Product", links: [{ label: "How it works", href: "#how" }, { label: "Pricing", href: "#pricing" }, { label: "Security", href: "#" }, { label: "Accessibility", href: "#" }] },
          { title: "Coverage", links: [{ label: "United States", href: "#" }, { label: "England & Wales", href: "#" }, { label: "European Union", href: "#" }] },
          { title: "Company", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }] },
        ]}
        bottom={<span>© 2026 Docket, a fictional company made for the rapui docs.</span>}
      />
      <Container className="h-6" />
    </div>
  );
}
