import { Button } from "../../rapui";
import { AppStats, type AppStatItem } from "../../rapui/components/AppStats";
import { Laurel, LaurelWreath, type LaurelSize, type LaurelTone } from "../../rapui/components/Laurel";
import type { BlockLook } from "../../rapui/components/Layout";
import { RatingSummary, Stars } from "../../rapui/components/RatingSummary";
import { AwardBadge, ReviewCard } from "../../rapui/components/ReviewCard";
import { Globe, User } from "../../rapui/icons";
import { attrs } from "../codegen";
import type { Control, DocEntry, Props } from "../types";

/* ── shared ── */

const LOOKS = ["preset", "fun", "civic", "signal", "product", "minimal"] as const;
const lookControl: Control = { type: "select", prop: "look", options: LOOKS, default: "preset", codeDefault: "preset" };
const lookOf = (p: Props) => (p.look === "preset" ? undefined : (p.look as BlockLook));

/* a paper ground inside the white stage, like the finance pages */
const GROUND = "grid grid-cols-[minmax(0,1fr)] place-items-center w-full min-h-72 p-6 rounded-[calc(var(--rap-radius)-8px)] bg-paper";

/* ── Marlow: a fictional notes app by a fictional studio ── */

const APP = { name: "Marlow Notes", tagline: "Notes that keep up with you", dev: "Fernhill Studio" };
const DIST = [9620, 1840, 560, 210, 250];
const COUNT = DIST.reduce((a, b) => a + b, 0);

const STATS = (look?: BlockLook): AppStatItem[] => [
  { label: "12K Ratings", value: "4.8", sub: <Stars value={4.8} size={11} look={look} className="text-ink-2" />, description: "Rated 4.8 out of 5 from 12,480 ratings" },
  { label: "Age", value: "4+", sub: "Years" },
  { label: "Chart", value: "#2", sub: "Productivity" },
  { label: "Award", value: <LaurelWreath size={26} look={look} />, sub: "Editors' Choice", description: "Award: Editors' Choice" },
  { label: "Developer", icon: <User />, sub: APP.dev },
  { label: "Language", value: "EN", sub: "+ 12 More" },
  { label: "Size", value: "48.2", sub: "MB" },
];

const REVIEWS = [
  {
    title: "Finally, notes that keep up",
    rating: 5,
    date: "2026-09-02",
    author: "marsh_wren",
    body:
      "I've tried every notes app going and Marlow is the first one that doesn't make me file things before I've finished thinking. Quick capture from the lock screen is instant, the daily page fills itself with what I touched, and search actually finds the half-remembered thing from March. Syncs between my phone and the old laptop without a fuss. The only thing I'd ask for is a way to pin a note to the top of a folder.",
    response: {
      body: "Thank you! Pinning within folders is in testing now and lands in 4.3 — keep an eye on the What's New page.",
      date: "2026-09-04",
    },
  },
  {
    title: "Great, but the widget lags",
    rating: 4,
    date: "2026-08-18",
    author: "Priya K.",
    body:
      "Lovely to write in and the handwriting recognition is spookily good. Knocked one star off because the home-screen widget sometimes shows yesterday's page until I open the app. Otherwise it has replaced three apps for me.",
  },
];

/* the app's icon: a folded note on a warm tile */
function AppIcon({ size = 96 }: { size?: number }) {
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-[22%] bg-flame text-surface shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]" style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" className="size-[58%]" fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        <path d="M12 8h18l8 8v24H12z" />
        <path d="M30 8v8h8M18 24h14M18 31h10" />
      </svg>
    </span>
  );
}

/* ── Laurel ──────────────────────────────────────────────── */

const laurelControls: Control[] = [
  lookControl,
  { type: "text", prop: "text", default: "Every federal agency, working together" },
  { type: "text", prop: "eyebrow", default: "", codeDefault: "" },
  { type: "text", prop: "caption", default: "", codeDefault: "" },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "select", prop: "leaves", options: ["auto", "3", "4", "5", "6", "7", "8", "9", "10", "12"], default: "auto", codeDefault: "auto" },
  { type: "select", prop: "tone", options: ["auto", "ink", "accent", "flame", "blue", "plum", "acid", "mute"], default: "auto", codeDefault: "auto" },
];

function laurelCode(p: Props) {
  const leaves = p.leaves === "auto" ? "" : ` leaves={${p.leaves}}`;
  return `import { Laurel } from "@rapui/react";

<Laurel${attrs(p, laurelControls, ["text", "leaves", "tone"])}${leaves}${p.tone === "auto" ? "" : ` tone="${p.tone}"`}>
  ${p.text}
</Laurel>`;
}

/* ── App Store product page: everything together ── */

function ProductPage() {
  return (
    <div className={GROUND}>
      <div className="flex w-full max-w-[44rem] flex-col gap-6 rounded-card bg-surface px-5 py-6 text-ink sm:px-8">
        <header className="flex items-center gap-4 sm:gap-5">
          <AppIcon size={96} />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="m-0 truncate text-[1.5rem] font-semibold tracking-[-0.02em]">{APP.name}</h3>
            <p className="m-0 text-[0.9375rem] text-ink-2">{APP.tagline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm">Get</Button>
              <AwardBadge rank="#2" label="in Productivity" />
            </div>
          </div>
        </header>
        <AppStats items={STATS()} label={`${APP.name} at a glance`} />
        <div className="grid place-items-center border-y border-line py-6">
          <Laurel eyebrow="Editors' Choice" caption="App Store · 2026" size="md">
            The quickest way from thought to note
          </Laurel>
        </div>
        <section aria-labelledby="pp-ratings" className="flex flex-col gap-4">
          <h4 id="pp-ratings" className="m-0 text-[1.25rem] font-semibold tracking-[-0.01em]">
            Ratings &amp; Reviews
          </h4>
          <RatingSummary average={4.8} count={COUNT} distribution={DIST} />
          <div className="grid gap-4 md:grid-cols-2">
            {REVIEWS.map((r) => (
              <ReviewCard key={r.title} as="h5" {...r} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const productPageCode = `import { AppStats, AwardBadge, Laurel, LaurelWreath, RatingSummary, ReviewCard, Stars, Button } from "@rapui/react";
import { User } from "@rapui/react/icons";

<header className="flex items-center gap-5">
  <AppIcon size={96} />
  <div>
    <h1>Marlow Notes</h1>
    <p>Notes that keep up with you</p>
    <Button size="sm">Get</Button>
    <AwardBadge rank="#2" label="in Productivity" />
  </div>
</header>

<AppStats items={[
  { label: "12K Ratings", value: "4.8", sub: <Stars value={4.8} size={11} />, description: "Rated 4.8 out of 5 from 12,480 ratings" },
  { label: "Age", value: "4+", sub: "Years" },
  { label: "Chart", value: "#2", sub: "Productivity" },
  { label: "Award", value: <LaurelWreath size={26} />, sub: "Editors' Choice", description: "Award: Editors' Choice" },
  { label: "Developer", icon: <User />, sub: "Fernhill Studio" },
  { label: "Language", value: "EN", sub: "+ 12 More" },
]} />

<Laurel eyebrow="Editors' Choice" caption="App Store · 2026">
  The quickest way from thought to note
</Laurel>

<RatingSummary average={4.8} count={12480} distribution={[9620, 1840, 560, 210, 250]} />
<ReviewCard title="Finally, notes that keep up" rating={5} date="2026-09-02" author="marsh_wren"
  body="I've tried every notes app going…"
  response={{ body: "Thank you! Pinning within folders…", date: "2026-09-04" }} />
<ReviewCard title="Great, but the widget lags" rating={4} date="2026-08-18" author="Priya K." body="…" />`;

/* every look side by side, for comparing the branches */
function AllLooks() {
  return (
    <div className={GROUND}>
      <div className="grid w-full gap-3 sm:grid-cols-2">
        {(["civic", "fun", "signal", "product", "minimal"] as const).map((l) => (
          <div key={l} className="grid min-h-40 place-items-center rounded-card bg-surface px-4 py-6">
            <Laurel look={l} eyebrow="Editors' Choice" caption={`look="${l}"`}>
              App of the Year
            </Laurel>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── RatingSummary ───────────────────────────────────────── */

const ratingControls: Control[] = [
  lookControl,
  { type: "number", prop: "average", min: 1, max: 5, step: 0.1, default: 4.8, codeDefault: null },
  { type: "boolean", prop: "compact", default: false },
  { type: "select", prop: "locale", options: ["en-US", "en-GB", "de-DE", "fr-FR", "ja-JP"], default: "en-US", codeDefault: "en-US" },
];

/* ── AppStats ────────────────────────────────────────────── */

const statsControls: Control[] = [lookControl];

/* ── ReviewCard ──────────────────────────────────────────── */

const reviewControls: Control[] = [
  lookControl,
  { type: "number", prop: "rating", min: 0, max: 5, step: 1, default: 5, codeDefault: null },
  { type: "number", prop: "lines", min: 1, max: 8, step: 1, default: 3 },
  { type: "boolean", prop: "response", default: true, codeDefault: null },
];

/* ── AwardBadge ──────────────────────────────────────────── */

const badgeControls: Control[] = [
  lookControl,
  { type: "text", prop: "label", default: "in Productivity", codeDefault: null },
  { type: "text", prop: "rank", default: "#1", codeDefault: "" },
  { type: "text", prop: "kicker", default: "", codeDefault: "" },
];

export const entries: DocEntry[] = [
  {
    slug: "laurel",
    name: "Laurel",
    group: "Awards",
    description:
      "A line of text framed by two mirrored laurel branches, drawn procedurally: a stem curving out round the text, leaf pairs that alternate slightly and shrink toward the tip. Civic sets slender ink silhouettes round serif text; fun uses chunky flame leaves that pop on one by one and sway on hover; signal spells the branch in phosphor dots; product draws hairline outlines with midribs; minimal uses single straight strokes. The text stays real text.",
    controls: laurelControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div className="grid w-full place-items-center rounded-card bg-surface px-4 py-10">
          <Laurel
            look={lookOf(p)}
            size={p.size as LaurelSize}
            eyebrow={String(p.eyebrow) || undefined}
            caption={String(p.caption) || undefined}
            leaves={p.leaves === "auto" ? undefined : Number(p.leaves)}
            tone={p.tone === "auto" ? undefined : (p.tone as LaurelTone)}
          >
            {String(p.text)}
          </Laurel>
        </div>
      </div>
    ),
    code: laurelCode,
    examples: [
      { title: "App Store product page", Demo: ProductPage, code: productPageCode },
      {
        title: "Every look",
        Demo: AllLooks,
        code: `<Laurel look="civic" eyebrow="Editors' Choice" caption='look="civic"'>App of the Year</Laurel>
<Laurel look="fun" …>App of the Year</Laurel>
<Laurel look="signal" …>App of the Year</Laurel>
<Laurel look="product" …>App of the Year</Laurel>
<Laurel look="minimal" …>App of the Year</Laurel>`,
      },
      {
        title: "Sizes",
        Demo: () => (
          <div className={GROUND}>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 rounded-card bg-surface px-6 py-8">
              <Laurel size="sm">Best of 2026</Laurel>
              <Laurel size="md" caption="Design Award">Finalist</Laurel>
              <Laurel size="lg" eyebrow="Fieldwork Design Prize" leaves={9}>
                Winner
              </Laurel>
            </div>
          </div>
        ),
        code: `<Laurel size="sm">Best of 2026</Laurel>
<Laurel size="md" caption="Design Award">Finalist</Laurel>
<Laurel size="lg" eyebrow="Fieldwork Design Prize" leaves={9}>Winner</Laurel>`,
      },
    ],
  },
  {
    slug: "rating-summary",
    name: "RatingSummary",
    group: "Awards",
    description:
      "A store's ratings block: the big average, stars filled to the tenth, the number of ratings and a 5→1 histogram whose rows show their count on hover or focus. Compact folds it to one line. Exports Stars, the read-only fractional star row it is built on.",
    controls: ratingControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div className="w-full max-w-[30rem] rounded-card bg-surface px-6 py-6">
          <RatingSummary look={lookOf(p)} average={Number(p.average)} count={COUNT} distribution={DIST} compact={Boolean(p.compact)} locale={String(p.locale)} />
        </div>
      </div>
    ),
    code: (p) => `import { RatingSummary } from "@rapui/react";

<RatingSummary${attrs(p, ratingControls)}
  count={${COUNT}}
  distribution={[${DIST.join(", ")}]}
/>`,
    examples: [
      {
        title: "Stars on their own",
        Demo: () => (
          <div className={GROUND}>
            <div className="flex flex-col items-start gap-3 rounded-card bg-surface px-6 py-6">
              {(["civic", "fun", "signal", "product", "minimal"] as const).map((l) => (
                <span key={l} className="flex items-center gap-3 text-[0.8125rem] text-mute">
                  <Stars value={3.7} size={20} look={l} />
                  {l}
                </span>
              ))}
            </div>
          </div>
        ),
        code: `<Stars value={3.7} size={20} />   // reads as "3.7 out of 5"`,
      },
    ],
  },
  {
    slug: "app-stats",
    name: "AppStats",
    group: "Awards",
    description:
      "The strip under an app's title: short columns of label, value and sub, divided by hairlines — ratings, age, chart place, an award with a tiny laurel, developer, languages. On narrow widths it scrolls sideways with snap, and it is keyboard scrollable.",
    controls: statsControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div className="w-full max-w-[44rem] rounded-card bg-surface px-2 py-5">
          <AppStats look={lookOf(p)} items={STATS(lookOf(p))} />
        </div>
      </div>
    ),
    code: (p) => `import { AppStats, Stars, LaurelWreath } from "@rapui/react";
import { User, Globe } from "@rapui/react/icons";

<AppStats${attrs(p, statsControls)} items={[
  { label: "12K Ratings", value: "4.8", sub: <Stars value={4.8} size={11} />, description: "Rated 4.8 out of 5 from 12,480 ratings" },
  { label: "Age", value: "4+", sub: "Years" },
  { label: "Chart", value: "#2", sub: "Productivity" },
  { label: "Award", value: <LaurelWreath size={26} />, sub: "Editors' Choice", description: "Award: Editors' Choice" },
  { label: "Developer", icon: <User />, sub: "Fernhill Studio" },
  { label: "Language", value: "EN", sub: "+ 12 More" },
  { label: "Size", value: "48.2", sub: "MB" },
]} />`,
    examples: [
      {
        title: "Narrow: scrolls and snaps",
        Demo: () => (
          <div className={GROUND}>
            <div className="w-full max-w-[20rem] rounded-card bg-surface py-4">
              <AppStats
                items={[
                  { label: "Rating", value: "4.6", sub: <Stars value={4.6} size={11} className="text-ink-2" />, description: "Rated 4.6 out of 5" },
                  { label: "Age", value: "12+", sub: "Years" },
                  { label: "Award", value: <LaurelWreath size={26} />, sub: "App of the Day", description: "Award: App of the Day" },
                  { label: "Language", icon: <Globe />, sub: "EN + 30 more" },
                ]}
              />
            </div>
          </div>
        ),
        code: `<AppStats items={[…]} />  // swipe, or focus it and use the arrow keys`,
      },
    ],
  },
  {
    slug: "review-card",
    name: "ReviewCard",
    group: "Awards",
    description:
      "One customer review: a title, stars, date and author, the body clamped with a \"more\" that appears only when it is really cut off, and an optional developer response indented under its own label.",
    controls: reviewControls,
    Demo: ({ p }) => {
      const r = REVIEWS[0];
      return (
        <div className={GROUND}>
          <ReviewCard
            look={lookOf(p)}
            className="w-full max-w-[26rem]"
            title={r.title}
            rating={Number(p.rating)}
            date={r.date}
            author={r.author}
            body={r.body}
            lines={Number(p.lines)}
            response={p.response ? r.response : undefined}
          />
        </div>
      );
    },
    code: (p) => `import { ReviewCard } from "@rapui/react";

<ReviewCard${attrs(p, reviewControls, ["response"])}
  title="${REVIEWS[0].title}"
  date="${REVIEWS[0].date}"
  author="${REVIEWS[0].author}"
  body="I've tried every notes app going…"${
    p.response
      ? `
  response={{ body: "Thank you! Pinning within folders…", date: "${REVIEWS[0].response?.date}" }}`
      : ""
  }
/>`,
  },
  {
    slug: "award-badge",
    name: "AwardBadge",
    group: "Awards",
    description:
      "A compact plaque for an award or chart place: a small laurel wreath, with a rank inside if you give one, and one or two lines of text. Sits beside an app title, on a profile or in a hero.",
    controls: badgeControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-card bg-surface px-6 py-8">
          <AwardBadge look={lookOf(p)} label={String(p.label)} rank={String(p.rank) || undefined} kicker={String(p.kicker) || undefined} />
          <AwardBadge look={lookOf(p)} label="App of the Day" />
          <AwardBadge look={lookOf(p)} kicker="Editors' Choice" label="Marlow Notes" />
        </div>
      </div>
    ),
    code: (p) => `import { AwardBadge } from "@rapui/react";

<AwardBadge${attrs(p, badgeControls)} />
<AwardBadge label="App of the Day" />
<AwardBadge kicker="Editors' Choice" label="Marlow Notes" />`,
  },
];
