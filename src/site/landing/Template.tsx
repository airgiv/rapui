/* A whole landing page made of the blocks, for one fictional product —
   Commons, an assistant that answers questions about a city from its own
   open data. The same JSX in every preset: what changes between fun, civic,
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
  InlineMedia,
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
  { url: "https://example.org/sweeping", title: "Street sweeping schedule, District 4", site: "Public Works", snippet: "Alder St (400–900 blocks): second and fourth Tuesday, 8–11 am, April through November." },
  { url: "https://example.org/permits", title: "Temporary no-parking permits", site: "Transportation", snippet: "Posted 72 hours ahead. Vehicles left in a posted zone may be towed." },
  { url: "https://example.org/311", title: "311 service requests, last 90 days", site: "Open data portal", snippet: "14 requests on Alder St; 11 closed, median time to close 3.2 days." },
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

/* the picture in the headline: a small city at dusk, drawn in the preset's own colours
   (sky, a low sun in flame, the blocks in blue and ink) so it belongs in every look */
function Skyline() {
  return (
    <svg viewBox="0 0 70 28" preserveAspectRatio="xMidYMax slice" aria-hidden className="block size-full">
      <defs>
        <linearGradient id="commons-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--rap-sky)" />
          <stop offset="1" stopColor="var(--rap-bubble)" />
        </linearGradient>
      </defs>
      <rect width="70" height="28" fill="url(#commons-sky)" />
      <circle cx="47" cy="17" r="6" fill="var(--rap-flame)" opacity="0.85" />
      <path fill="var(--rap-blue)" opacity="0.55" d="M0 28V17h5v-3h4v6h4v-8h5v9h3v-5h6v8h4v-11h5v11h4v-6h5v4h5v-9h4v12h7v4z" />
      <path fill="var(--rap-ink)" d="M0 28v-6h3v-4h5v5h3v-9h6v3h2v-6h4v12h3v-4h5v7h2v-9h3v-3h3v3h2v8h3v-5h5v4h3v-6h4v5h6v6z" />
    </svg>
  );
}

/* the product in one picture: a resident's question, answered with sources */
function AnswerCard() {
  return (
    <SourcesProvider sources={SOURCES}>
      <div className="flex w-full flex-col gap-4 rounded-card bg-surface p-(--rap-space-md) text-left shadow-[inset_0_0_0_1px_var(--rap-edge)]">
        <ChatMessage role="user" time="08:12">
          When do they sweep Alder Street? I park on the 600 block.
        </ChatMessage>
        <ChatMessage role="assistant" name="Commons">
          The 600 block of Alder St is swept on the second and fourth Tuesday of the month, 8–11 am, April through November
          <Citation index={1} />. The next one is <strong>Tuesday 22 April</strong> — move your car the night before; posted zones are towed
          <Citation index={2} />.
        </ChatMessage>
        <Sources layout="row" max={3} label={null} />
      </div>
    </SourcesProvider>
  );
}

/* the staff side: this week's questions nobody could answer yet, as a ranked list */
const DIGEST = [
  ["Can I put a fence on the property line?", 212, "Planning"],
  ["Why is my water bill higher this month?", 187, "Utilities"],
  ["When does the Elm St bridge reopen?", 140, "Transportation"],
  ["Do I need a permit for a backyard chicken coop?", 96, "Animal Services"],
] as const;

function Digest() {
  const max = DIGEST[0][1];
  return (
    <div className="flex w-full flex-col gap-3 rounded-card bg-surface p-(--rap-space-md) text-left shadow-[inset_0_0_0_1px_var(--rap-edge)]">
      <div className="flex items-baseline justify-between gap-4 text-[0.8125rem] text-mute">
        <span className="font-medium text-ink">Unanswered this week</span>
        <span>asked · routed to</span>
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {DIGEST.map(([q, n, dept]) => (
          <li key={q} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
              <span className="min-w-0 text-ink">{q}</span>
              <span className="shrink-0 tabular-nums text-ink-2">{n}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 rounded-pill bg-accent" style={{ width: `${(n / max) * 70}%` }} />
              <span className="text-[0.75rem] text-mute">{dept}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const FEATURES: FeatureItem[] = [
  { title: "Answers from the source", text: "Every answer cites the city dataset, ordinance or page it came from, so you can check it yourself.", icon: "document" },
  { title: "Your street, not the city's", text: "Ask about an address and get the schedules, permits and requests for that block — not a PDF for the district.", icon: "map" },
  { title: "Plain words, 40 languages", text: "Questions in Spanish, Tagalog or Vietnamese get answers in kind, with the official terms kept alongside.", icon: "chat-round-dots" },
  { title: "Live, not last year's", text: "Commons reads the open data portal as it updates: closures, outages and 311 requests show up within minutes.", icon: "bolt" },
  { title: "Nothing to sign up for", text: "Residents just ask. No account, no tracking; questions are kept for 30 days to improve answers, then deleted.", icon: "shield" },
  { title: "Staff stay in the loop", text: "When Commons isn't sure, it says so and routes the question to the right department with the context attached.", icon: "inbox" },
];

/* product shows the thing itself in its wide bento cards: live parts, not pictures */
const LIVE_FEATURES: FeatureItem[] = FEATURES.map((f, i) =>
  i === 0
    ? { ...f, media: <div className="w-full max-w-[17rem] p-3"><SourceCard source={SOURCES[0]} index={1} /></div> }
    : i === FEATURES.length - 1
      ? { ...f, media: <div className="rounded-pill bg-surface px-4 py-2.5 shadow-pop"><AILoader label="Routing to Public Works" timer /></div> }
      : f,
);

const STATS: StatItem[] = [
  { value: 182, suffix: "k", label: "questions answered", note: "since the March pilot" },
  { value: 94, suffix: "%", label: "with a cited source", note: "the rest go to a person" },
  { value: 41, label: "languages", note: "auto-detected" },
  { value: 3.2, suffix: "s", label: "median answer time" },
];

const QUOTES: TestimonialItem[] = [
  { quote: "Our 311 line used to spend half its day reading the sweeping schedule aloud. Now people ask Commons and call us about real problems.", name: "Dana Whitfield", role: "Director, 311 Service Center" },
  { quote: "I asked in Tagalog whether my mother's building had a heat complaint open. It found the request, the inspector's visit and what happens next.", name: "Ramon Aquino", role: "Resident, Ward 6" },
  { quote: "The citations sold it. Council members could click through to the ordinance instead of taking the chatbot's word for it.", name: "Priya Natarajan", role: "Chief Data Officer" },
];

const QUESTIONS: FAQItem[] = [
  { q: "Where do the answers come from?", a: "Only from your city's published sources: the open data portal, the municipal code, department pages and meeting minutes. Commons doesn't search the wider web." },
  { q: "What happens when it doesn't know?", a: "It says so, shows what it found, and offers to send the question to the department that owns the topic — with the conversation attached, so the resident doesn't repeat themselves." },
  { q: "Is it accessible?", a: "Yes: WCAG 2.2 AA, full keyboard use, screen-reader live regions for answers, and a plain-text mode. Every release is tested with residents who use assistive technology." },
  { q: "How long does a launch take?", a: "Most cities go live in six to eight weeks: two to connect the data, two to review answers with departments, and a public pilot." },
  { q: "Who can see the questions?", a: "Your staff, in aggregate and without names. Questions are deleted after 30 days unless a resident asks for a follow-up." },
];

const PLANS: PricingPlan[] = [
  {
    name: "Town",
    price: { monthly: 900, yearly: 720 },
    currency: "$",
    period: "/mo",
    description: "Up to 50,000 residents",
    features: ["Open data + municipal code", "12 languages", "Email routing to staff", "Monthly answer review"],
    cta: { label: "Start a pilot" },
  },
  {
    name: "City",
    price: { monthly: 3400, yearly: 2720 },
    currency: "$",
    period: "/mo",
    description: "Up to 1 million residents",
    features: ["Everything in Town", "All 41 languages", "311 and CRM integration", "Weekly answer review", "Accessibility audit"],
    cta: { label: "Talk to us" },
    featured: true,
    badge: "Most cities",
  },
  {
    name: "Region",
    price: { monthly: "Custom" },
    description: "Counties, transit, utilities",
    features: ["Everything in City", "Several agencies, one assistant", "On-premise option", "Dedicated team"],
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
        logo={<span className="font-display text-[1.375rem] [font-weight:var(--rap-display-weight)] tracking-[-0.03em]">Commons</span>}
        links={[
          { label: "How it works", href: "#how" },
          { label: "Cities", href: "#cities" },
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
        eyebrow="Now live in 38 cities"
        title={
          <>
            Ask your city <InlineMedia>
              <Skyline />
            </InlineMedia> <Accent>anything</Accent>
          </>
        }
        lead="Commons answers residents' questions from the city's own open data — schedules, permits, closures, 311 — in plain words, with the source one tap away."
        actions={
          <>
            <Button variant="accent" icon={arrows || undefined}>
              Book a demo
            </Button>
            <Button variant="soft">Try it on Port Allen</Button>
          </>
        }
        media={<Scene><AnswerCard /></Scene>}
        meta={[
          { label: "Cities", value: "38" },
          { label: "Sources", value: "2,140 datasets" },
          { label: "Uptime", value: "99.98%" },
        ]}
      />
      <LogoCloud
        title="Answering for residents of"
        logos={[{ name: "Port Allen" }, { name: "Cedar Falls" }, { name: "Marlow County" }, { name: "Eastbrook" }, { name: "Two Rivers Transit" }, { name: "Linden" }]}
      />
      <Features
        id="how"
        index="01"
        eyebrow="How it works"
        title={<>The city's knowledge, <Accent tone="mute">at the level of your street</Accent></>}
        lead="Commons reads what the city already publishes and answers like the most patient clerk you've met."
        items={preset === "product" ? LIVE_FEATURES : FEATURES}
      />
      <FeatureSplit
        index="02"
        eyebrow="For staff"
        title={<>Fewer calls about schedules, <Accent tone="mute">more time for real problems</Accent></>}
        lead="Every question residents ask is a signal. Commons groups them, shows what people couldn't find, and hands off the ones that need a person."
        points={["A weekly digest of the top unanswered questions", "Routing rules per department, with context attached", "Answer review: approve, correct, or pin an answer"]}
        media={<Scene><Digest /></Scene>}
        caption="Port Allen, first 90 days"
      />
      <Stats id="cities" index="03" eyebrow="In numbers" title={<>A year <Accent tone="mute">of answers</Accent></>} items={STATS} />
      <Testimonials index="04" eyebrow="From the field" title={<>What cities <Accent tone="mute">say</Accent></>} items={QUOTES} />
      <Pricing
        id="pricing"
        index="05"
        eyebrow="Pricing"
        title={<>Priced by population, <Accent tone="mute">not by question</Accent></>}
        lead="Every plan includes unlimited questions, every data source you publish, and a pilot before you commit."
        plans={PLANS}
      />
      <FAQ id="faq" index="06" eyebrow="Questions" title={<>Before you ask Commons, <Accent tone="mute">ask us</Accent></>} items={QUESTIONS} />
      <CTA
        eyebrow="Pilot in six weeks"
        title={<>Give your residents a clerk <Accent tone="mute">who never closes</Accent></>}
        lead="We'll connect a few of your datasets and show you Commons answering real questions from your city."
        actions={
          <>
            <Button variant="accent" icon={arrows || undefined}>
              Book a demo
            </Button>
            <Button variant="soft">Read the pilot report</Button>
          </>
        }
      />
      <SiteFooter
        logo={<span className="font-display text-[1.375rem] [font-weight:var(--rap-display-weight)] tracking-[-0.03em]">Commons</span>}
        tagline="Public answers from public data."
        wordmark="Commons"
        columns={[
          { title: "Product", links: [{ label: "How it works", href: "#how" }, { label: "Pricing", href: "#pricing" }, { label: "Security", href: "#" }, { label: "Accessibility", href: "#" }] },
          { title: "Cities", links: [{ label: "Port Allen", href: "#" }, { label: "Cedar Falls", href: "#" }, { label: "Pilot report", href: "#" }] },
          { title: "Company", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }] },
        ]}
        bottom={<span>© 2026 Commons, a fictional company made for the rapui docs.</span>}
      />
      <Container className="h-6" />
    </div>
  );
}
