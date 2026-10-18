import { Button, type BlockLook } from "../../rapui";
import { FeatureSplit, Features, type FeatureItem } from "../../rapui/components/Features";
import { FAQ, type FAQItem } from "../../rapui/components/FAQ";
import { Testimonials, type TestimonialItem } from "../../rapui/components/Testimonials";
import { BlockFrame } from "../blockFrame";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* The sample product throughout: Fieldnote, a shared research notebook for
   product teams — interviews in, findings out. */

const LOOKS = ["preset", "fun", "civic", "signal", "product", "minimal"] as const;
const lookControl: Control = { type: "select", prop: "look", options: LOOKS, default: "preset", codeDefault: "preset" };
const lookOf = (p: Record<string, unknown>) => (p.look === "preset" ? undefined : (p.look as BlockLook));
const TONES = ["plain", "surface", "muted", "dark"] as const;
const toneControl: Control = { type: "select", prop: "tone", options: TONES, default: "plain" };

/* a drawn mock of the app — a notebook page with highlights and tags — so the
   demos have a picture without shipping an image */
function NotebookMock() {
  return (
    <svg viewBox="0 0 640 400" role="img" aria-label="A Fieldnote page: an interview transcript with highlighted quotes tagged by theme">
      <rect width="640" height="400" fill="var(--rap-paper)" />
      <rect x="0" y="0" width="150" height="400" fill="var(--rap-paper-3)" />
      {[40, 70, 100, 130, 160].map((y, i) => (
        <rect key={y} x="20" y={y} width={i === 1 ? 96 : 80 + ((i * 17) % 30)} height="10" rx="5" fill="var(--rap-ink)" opacity={i === 1 ? 0.7 : 0.22} />
      ))}
      <rect x="185" y="36" width="260" height="22" rx="6" fill="var(--rap-ink)" opacity="0.85" />
      <rect x="185" y="72" width="120" height="10" rx="5" fill="var(--rap-ink)" opacity="0.3" />
      {[110, 134, 158, 206, 230, 254, 302, 326].map((y, i) => (
        <rect key={y} x="185" y={y} width={i % 3 === 2 ? 260 : 410} height="10" rx="5" fill="var(--rap-ink)" opacity="0.16" />
      ))}
      <rect x="181" y="150" width="300" height="18" rx="4" fill="var(--rap-acid)" opacity="0.9" />
      <rect x="181" y="246" width="220" height="18" rx="4" fill="var(--rap-sky)" opacity="0.9" />
      <rect x="500" y="148" width="92" height="22" rx="11" fill="var(--rap-flame)" />
      <rect x="500" y="244" width="78" height="22" rx="11" fill="var(--rap-blue)" />
    </svg>
  );
}

/* ── Features ── */

const FEATURES: FeatureItem[] = [
  { title: "Record, then forget about it", text: "Drop in a call recording and Fieldnote transcribes it, speaker by speaker, before you've refilled your coffee.", icon: "clapperboard" },
  { title: "Highlight what matters", text: "Select a line, tag it with a theme. Every tag becomes a living board you can sort, filter and share.", icon: "pen" },
  { title: "Find it in a year", text: "Search across every interview your team has ever run — by quote, by customer, by feeling.", icon: "notebook" },
  { title: "Patterns, not piles", text: "Themes surface on their own as you tag: see which problems come up in nine calls out of ten.", icon: "graph-up" },
  { title: "Share a finding, not a folder", text: "Send a single insight with its evidence attached. Stakeholders read the quote, not a 40-page doc.", icon: "letter", href: "#share" },
  { title: "Private by default", text: "Recordings stay in your region, consent is tracked per participant, and redaction is one click.", icon: "shield", href: "#security" },
];

const featuresControls: Control[] = [
  lookControl,
  { type: "number", prop: "cols", min: 2, max: 4, default: 3 },
  { type: "number", prop: "count", label: "items", min: 2, max: 6, default: 6, codeDefault: null },
  { type: "text", prop: "title", default: "Everything between the interview and the insight" },
  toneControl,
];

/* ── FeatureSplit ── */

const POINTS = [
  "Highlights carry the timestamp — click one to hear it said",
  "Tags are shared across projects, so themes add up over months",
  "Export a board to Slides or Notion in its own layout",
];

const splitControls: Control[] = [
  lookControl,
  { type: "boolean", prop: "reverse", default: false },
  { type: "text", prop: "title", default: "Turn a week of calls into one page" },
  { type: "boolean", prop: "points", label: "bullet points", default: true, codeDefault: null },
  toneControl,
];

/* ── Testimonials ── */

const QUOTES: TestimonialItem[] = [
  {
    quote: "We stopped arguing about what customers want. Now we just open the board and look.",
    name: "Priya Raman",
    role: "Head of Product, Kettle",
  },
  {
    quote: "Synthesis used to eat my Fridays. Fieldnote gives me the first draft before lunch.",
    name: "Tomás Herrera",
    role: "Senior Researcher, Lumen Bank",
  },
  {
    quote: "Our engineers actually watch the clips now. Thirty seconds of a real person beats any ticket.",
    name: "Hana Sato",
    role: "Design Lead, Waypost",
  },
  {
    quote: "Forty interviews, one search box. I found the quote I needed for the board deck in under a minute.",
    name: "Daniel Okoye",
    role: "VP Product, Brightfield",
  },
  {
    quote: "Consent tracking per participant got us through our privacy review without a single follow-up.",
    name: "Lena Fischer",
    role: "Research Ops, Northvale Health",
  },
];

const testimonialsControls: Control[] = [
  lookControl,
  { type: "number", prop: "count", label: "quotes", min: 1, max: 5, default: 5, codeDefault: null },
  { type: "text", prop: "title", default: "Teams that stopped losing what customers said" },
  toneControl,
];

/* ── FAQ ── */

const QUESTIONS: FAQItem[] = [
  { q: "Which recording tools does Fieldnote work with?", a: "Zoom, Google Meet and Teams connect in a click and send recordings over as soon as a call ends. Anything else — a phone memo, a usability video — you can drag in as a file." },
  { q: "How accurate is the transcription?", a: "Around 95% on clear English audio, with speakers told apart automatically. Every line links back to its moment in the recording, so you can always check what was really said." },
  { q: "Can participants ask to be removed?", a: "Yes. Consent is stored per participant; withdrawing it removes their recordings, transcripts and every highlight that quotes them, across all projects." },
  { q: "What happens to our data if we cancel?", a: "You keep read access for 90 days and can export everything — audio, transcripts and boards — as plain files. After that it is deleted from our servers and backups." },
  { q: "Is there a plan for small teams?", a: "The Team plan covers up to five editors and unlimited viewers for $49 a month. Nonprofits and students get it free." },
];

const faqControls: Control[] = [
  lookControl,
  { type: "number", prop: "count", label: "questions", min: 2, max: 5, default: 5, codeDefault: null },
  { type: "text", prop: "title", default: "Questions, answered" },
  { type: "boolean", prop: "contact", label: "contact slot", default: true, codeDefault: null },
  toneControl,
];

const contactNode = (
  <>
    Still wondering? <a href="#support">Talk to a person</a> — we answer within a working day.
  </>
);

export const entries: DocEntry[] = [
  {
    slug: "features",
    name: "Features",
    group: "Blocks",
    description:
      "What the product does: a section header over a set of features, arranged per preset — packed colourful tiles in fun, soft cards with serif titles in civic, blocks of square cells with {0001} tags and technical marks, one empty slot per band, in signal, hairline cards in product, a numbered two-column list in minimal. Items with an href become whole-card links.",
    controls: featuresControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <Features
          look={lookOf(p)}
          tone={p.tone as "plain"}
          eyebrow="Why Fieldnote"
          index="02"
          title={String(p.title)}
          lead="Fieldnote keeps every customer conversation searchable, tagged and ready to quote — so research stops living in someone's drive."
          cols={Number(p.cols)}
          items={FEATURES.slice(0, Number(p.count))}
        />
      </BlockFrame>
    ),
    code: (p) => `import { Features } from "@rapui/react";

<Features${attrs(p, [lookControl, toneControl])}${Number(p.cols) !== 3 ? ` cols={${p.cols}}` : ""}
  eyebrow="Why Fieldnote"
  index="02"
  title="${p.title}"
  lead="Fieldnote keeps every customer conversation searchable…"
  items={[
    { title: "Record, then forget about it", text: "…", icon: "clapperboard" },
    { title: "Highlight what matters", text: "…", icon: "pen" },
    { title: "Share a finding, not a folder", text: "…", icon: "letter", href: "/share" },
  ]}
/>`,
  },
  {
    slug: "feature-split",
    name: "Feature split",
    group: "Blocks",
    description:
      "One feature at length: eyebrow, title, lead, bullet points and actions on one side, a picture on the other (`reverse` swaps them). The picture is dressed per preset — a tile on a coloured ground, a soft card, a scanlined MediaFrame, a framed app window, or a plain captioned figure.",
    controls: splitControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <FeatureSplit
          look={lookOf(p)}
          tone={p.tone as "plain"}
          reverse={Boolean(p.reverse)}
          eyebrow="Synthesis"
          index="03"
          title={String(p.title)}
          lead="Tag as you listen, and Fieldnote groups the highlights into themes you can hand straight to the team."
          points={p.points ? POINTS : undefined}
          actions={
            <>
              <Button>Start free</Button>
              <Button variant="soft">See a sample board</Button>
            </>
          }
          media={<NotebookMock />}
          caption="fieldnote.app — Onboarding study, call 7"
        />
      </BlockFrame>
    ),
    code: (p) => `import { FeatureSplit, Button } from "@rapui/react";

<FeatureSplit${attrs(p, [lookControl, splitControls[1], toneControl])}
  eyebrow="Synthesis"
  title="${p.title}"
  lead="Tag as you listen, and Fieldnote groups the highlights into themes…"${
    p.points
      ? `
  points={[
    "Highlights carry the timestamp — click one to hear it said",
    "Tags are shared across projects, so themes add up over months",
  ]}`
      : ""
  }
  actions={<><Button>Start free</Button><Button variant="soft">See a sample board</Button></>}
  media={<img src="/board.png" alt="A Fieldnote board of tagged highlights" />}
  caption="fieldnote.app — Onboarding study, call 7"
/>`,
    examples: [
      {
        title: "A pair, alternating sides",
        Demo: () => (
          <BlockFrame>
            <FeatureSplit
              eyebrow="Capture"
              title="Every call, transcribed by the time you hang up"
              lead="Connect Zoom or Meet once. Recordings arrive on their own, split by speaker."
              points={["Speakers told apart automatically", "Jump from any line to its moment in the audio"]}
              media={<NotebookMock />}
              caption="Interview — Kettle, March"
            />
            <FeatureSplit
              reverse
              eyebrow="Share"
              title="Send the quote, not the folder"
              lead="A finding travels with its evidence: the clip, the transcript line and who said it."
              points={["Links open without an account", "Viewers see only what you share"]}
              media={<NotebookMock />}
              caption="Shared finding — pricing confusion"
            />
          </BlockFrame>
        ),
        code: `<FeatureSplit eyebrow="Capture" title="…" media={…} />
<FeatureSplit reverse eyebrow="Share" title="…" media={…} />`,
      },
    ],
  },
  {
    slug: "testimonials",
    name: "Testimonials",
    group: "Blocks",
    description:
      "Quotes from people who use it, with a name, role, face or logo. Fun sets the first one huge on a coloured tile with a sticker; civic as a centred serif pull-quote; signal in ruled cells with mono attribution (a string quote may use Redact marks); product as a masonry wall of bordered cards; minimal one at a time with a plain 1 / 3 pager.",
    controls: testimonialsControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <Testimonials
          look={lookOf(p)}
          tone={p.tone as "plain"}
          eyebrow="Customers"
          index="04"
          title={String(p.title) || undefined}
          items={QUOTES.slice(0, Number(p.count))}
        />
      </BlockFrame>
    ),
    code: (p) => `import { Testimonials } from "@rapui/react";

<Testimonials${attrs(p, [lookControl, toneControl])}
  eyebrow="Customers"
  title="${p.title}"
  items={[
    { quote: "We stopped arguing about what customers want…", name: "Priya Raman", role: "Head of Product, Kettle" },
    { quote: "Synthesis used to eat my Fridays…", name: "Tomás Herrera", role: "Senior Researcher, Lumen Bank" },
  ]}
/>`,
    examples: [
      {
        title: "Signal, with redaction marks",
        Demo: () => (
          <BlockFrame>
            <Testimonials
              look="signal"
              items={[
                { quote: "Fieldnote found the [pricing complaint] hiding in {eleven} of our calls before we [shipped the change].", name: "Priya Raman", role: "Kettle" },
                { quote: "The transcript is the [source of truth] now — not my {memory of the call}.", name: "Tomás Herrera", role: "Lumen Bank" },
                { quote: "We [redact names in one click] and share the rest without a second thought.", name: "Lena Fischer", role: "Northvale Health" },
              ]}
            />
          </BlockFrame>
        ),
        code: `<Testimonials look="signal" items={[
  { quote: "Fieldnote found the [pricing complaint] hiding in {eleven} of our calls…", name: "Priya Raman", role: "Kettle" },
]} />`,
      },
    ],
  },
  {
    slug: "faq",
    name: "FAQ",
    group: "Blocks",
    description:
      "The questions people ask before they sign up. The heading sits in a left column with a \"still have questions\" slot, the questions on the right (a centred narrow column in product). Each question is a button in an h3 that opens its answer: bold rounded rows in fun, soft cards in civic, {0001} tags, bold questions and a ⊕ marker in signal, numbered hairline rows in minimal.",
    basedOn: "Radix Collapsible",
    controls: faqControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <FAQ
          look={lookOf(p)}
          tone={p.tone as "plain"}
          eyebrow="FAQ"
          index="05"
          title={String(p.title)}
          lead="The short version of what teams ask us on their first call."
          items={QUESTIONS.slice(0, Number(p.count))}
          contact={p.contact ? contactNode : undefined}
          defaultOpen={[0]}
        />
      </BlockFrame>
    ),
    code: (p) => `import { FAQ } from "@rapui/react";

<FAQ${attrs(p, [lookControl, toneControl])}
  eyebrow="FAQ"
  title="${p.title}"
  items={[
    { q: "Which recording tools does Fieldnote work with?", a: "Zoom, Google Meet and Teams connect in a click…" },
    { q: "Can participants ask to be removed?", a: "Yes. Consent is stored per participant…" },
  ]}${
    p.contact
      ? `
  contact={<>Still wondering? <a href="/support">Talk to a person</a></>}`
      : ""
  }
  defaultOpen={[0]}
/>`,
  },
];
