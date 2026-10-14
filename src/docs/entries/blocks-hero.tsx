import { Accent, Button, RotatingBadge } from "../../rapui";
import { Hero, InlineMedia, type HeroMeta } from "../../rapui/components/Hero";
import { LogoCloud, type LogoCloudLogo } from "../../rapui/components/LogoCloud";
import { Stats, type StatItem } from "../../rapui/components/Stats";
import type { BlockLook } from "../../rapui";
import { BlockFrame } from "../blockFrame";
import { attrs } from "../codegen";
import type { Control, DocEntry, Props } from "../types";

/* ── shared ── */

const LOOKS = ["preset", "fun", "civic", "signal", "product", "minimal"] as const;
const lookControl: Control = { type: "select", prop: "look", options: LOOKS, default: "preset", codeDefault: "preset" };
const lookOf = (p: Props) => (p.look === "preset" ? undefined : (p.look as BlockLook));

/* ── Kestrel: a fictional field-notes app for ecologists ── */

/* contour rings round two summits, wobbled so they read as terrain */
function ring(cx: number, cy: number, r: number, k: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const w = 1 + 0.11 * Math.sin(3 * a + k) + 0.06 * Math.sin(5 * a - k * 1.7);
    pts.push(`${(cx + Math.cos(a) * r * w * 1.25).toFixed(1)},${(cy + Math.sin(a) * r * w * 0.8).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}
const CONTOURS = [
  ...[1, 2, 3, 4, 5, 6, 7].map((k) => ring(300, 220, k * 34, k)),
  ...[1, 2, 3, 4].map((k) => ring(640, 120, k * 30, k + 2)),
];
const PINS: [number, number][] = [
  [228, 300],
  [330, 196],
  [452, 262],
  [585, 150],
];

/** The Kestrel app's map: contours, a river, a walked trail and pins, with a note card floating over it. */
function FieldMap() {
  return (
    <div className="@container relative size-full overflow-hidden bg-sky font-sans text-ink">
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden className="absolute inset-0 size-full">
        {CONTOURS.map((d, i) => (
          <path key={i} d={d} className="fill-none stroke-ink" strokeOpacity={0.16} strokeWidth={1.4} />
        ))}
        <path d="M-20 420 C 120 380, 180 460, 320 420 S 520 330, 640 380 S 780 470, 840 430" className="fill-none stroke-blue" strokeOpacity={0.55} strokeWidth={10} strokeLinecap="round" />
        <path d={`M${PINS.map((p) => p.join(" ")).join(" L")}`} className="fill-none stroke-ink" strokeWidth={2.5} strokeDasharray="2 9" strokeLinecap="round" />
        {PINS.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={i === 2 ? 22 : 0} className="fill-flame" fillOpacity={0.2} />
            <circle cx={x} cy={y} r={9} className="fill-flame stroke-paper-2" strokeWidth={3.5} />
          </g>
        ))}
      </svg>
      <span className="absolute right-[4%] top-[6%] inline-flex items-center gap-1.5 rounded-pill bg-surface px-2.5 py-1 text-[clamp(0.625rem,1.6cqi,0.8125rem)] font-medium shadow-pop">
        <span className="size-1.5 rounded-pill bg-success" />
        Offline · 23 notes queued
      </span>
      <div className="absolute bottom-[6%] left-[4%] flex w-[min(19rem,62%)] flex-col gap-[0.5em] rounded-card bg-surface p-[1em] text-[clamp(0.625rem,1.7cqi,0.875rem)] shadow-pop">
        <span className="text-mute">Ridge Pond · 06:42 · 57.119° N</span>
        <span className="text-[1.35em] font-semibold leading-tight tracking-[-0.02em]">Grey heron ×2, one kingfisher</span>
        <span className="flex flex-wrap gap-[0.4em]">
          {["Photo", "Audio 0:14", "Water 11°C"].map((t) => (
            <span key={t} className="rounded-pill bg-fill px-[0.6em] py-[0.2em] text-ink-2">
              {t}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/** A dawn over the hills, for an inline pill in a headline. */
function Dawn() {
  return (
    <svg viewBox="0 0 120 60" preserveAspectRatio="xMidYMid slice">
      <rect width="120" height="60" className="fill-bubble" />
      <circle cx="78" cy="30" r="13" className="fill-flame" />
      <path d="M0 44 Q 30 26 60 40 T 120 36 V60 H0Z" className="fill-blue" />
      <path d="M0 52 Q 40 40 80 50 T 120 48 V60 H0Z" className="fill-acid" />
    </svg>
  );
}

const META: HeroMeta[] = [
  { label: "Lat", value: "57.1194° N" },
  { label: "Lon", value: "3.6421° W" },
  { label: "Logged today", value: "1,284" },
  { label: "Sync", value: "Offline-ready" },
];

const heroControls: Control[] = [
  lookControl,
  { type: "text", prop: "eyebrow", default: "Kestrel 2 · offline maps are here" },
  { type: "text", prop: "title", default: "Field notes that map themselves" },
  { type: "text", prop: "lead", default: "Every sighting, sample and sketch becomes a pin on a living map — offline on the ridge, synced by the time you're back at the van." },
  { type: "boolean", prop: "inlineMedia", label: "inline picture", default: false },
  { type: "boolean", prop: "media", default: true },
  { type: "boolean", prop: "sticker", label: "sticker (fun)", default: true },
];

/* the title with an inline picture after its second word */
function heroTitle(text: string, inline: boolean) {
  if (!inline) return text;
  const words = text.split(" ");
  return (
    <>
      {words.slice(0, 2).join(" ")} <InlineMedia>
        <Dawn />
      </InlineMedia>{" "}
      {words.slice(2).join(" ")}
    </>
  );
}

/* ── Open Harbour: a fictional city-data portal ── */

function Harbour() {
  const towers: [number, number, number][] = [
    [40, 70, 150], [120, 50, 210], [180, 80, 120], [270, 60, 260], [340, 70, 170], [420, 50, 230], [480, 90, 140], [580, 60, 200], [650, 80, 120],
  ];
  return (
    <svg viewBox="0 0 760 520" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="760" height="520" className="fill-sky" />
      <circle cx="590" cy="120" r="54" className="fill-paper-2" />
      {towers.map(([x, w, h], i) => (
        <rect key={i} x={x} y={360 - h} width={w} height={h} rx={4} className={i % 3 === 1 ? "fill-flame" : i % 2 ? "fill-plum" : "fill-blue"} />
      ))}
      <rect y="360" width="760" height="160" className="fill-plum" />
      {[390, 420, 455, 492].map((y, i) => (
        <path key={y} d={`M${60 + i * 40} ${y} h${260 - i * 30} M${420 - i * 20} ${y + 8} h${180 + i * 20}`} className="stroke-paper-2" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" />
      ))}
    </svg>
  );
}

/* ── Logo cloud ── */

const NAMES = ["Northfield Trust", "Ardent Labs", "Halcyon", "Marrow & Co", "Pinegate", "Lumen Survey", "Odeon Parks", "Brightwater"];
const SHAPES = [
  <circle key="c" cx="10" cy="10" r="8" />,
  <path key="t" d="M10 2 18 17H2Z" />,
  <rect key="s" x="4" y="4" width="12" height="12" rx="2" transform="rotate(45 10 10)" />,
  <path key="b" d="M3 3h5v14H3zM12 3h5v14h-5z" />,
];
const withMarks = (names: string[]): LogoCloudLogo[] =>
  names.map((name, i) => ({
    name,
    logo: (
      <span className="inline-flex items-center gap-[0.4em] font-sans font-semibold tracking-[-0.03em]">
        <svg viewBox="0 0 20 20" className="fill-current" aria-hidden>
          {SHAPES[i % SHAPES.length]}
        </svg>
        {name}
      </span>
    ),
  }));

const logoControls: Control[] = [
  lookControl,
  { type: "text", prop: "title", default: "Trusted by field teams at" },
  { type: "number", prop: "count", label: "logos", min: 3, max: 8, default: 6, codeDefault: null },
  { type: "boolean", prop: "marks", label: "logo marks", default: false, codeDefault: null },
];

/* ── Stats ── */

const ITEMS: StatItem[] = [
  { value: 1.2, suffix: "M", label: "Sightings logged", note: "across 41 countries" },
  { value: 38400, label: "Surveys synced", note: "this season, most from no signal" },
  { value: 4, prefix: "<", suffix: "s", label: "From pin to shared map", note: "median, on a 3G link" },
  { value: 99.9, suffix: "%", label: "Notes kept through a dead battery", note: "autosaved on every keystroke" },
  { value: "Free", label: "For students and volunteers", note: "no seat limits, ever" },
];

const statsControls: Control[] = [
  lookControl,
  { type: "boolean", prop: "header", default: true, codeDefault: null },
  { type: "text", prop: "title", default: "Kestrel, a season in" },
  { type: "number", prop: "count", label: "figures", min: 2, max: 5, default: 4, codeDefault: null },
];

const itemsCode = (n: number) =>
  ITEMS.slice(0, n)
    .map((it) => {
      const v = typeof it.value === "number" ? String(it.value) : `"${it.value}"`;
      const extra = `${it.prefix ? `, prefix: "${it.prefix}"` : ""}${it.suffix ? `, suffix: "${it.suffix}"` : ""}`;
      return `    { value: ${v}${extra}, label: "${it.label}"${it.note ? `, note: "${it.note}"` : ""} },`;
    })
    .join("\n");

export const entries: DocEntry[] = [
  {
    slug: "hero",
    name: "Hero",
    group: "Blocks",
    description:
      "The page's first screen: a kicker, the page's one h1, a lead, buttons and a picture — laid out five ways. Fun stacks a giant headline over a big rounded picture tile with a sticker on its corner; civic splits a serif headline from a photo in a soft card (drop an InlineMedia pill between the headline's words); signal puts the picture behind scan lines over a ruled row of coordinates; product centres everything under a pill badge with the product in a framed window; minimal sets one big headline on the grid with text-link actions and a hairline under.",
    controls: heroControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <Hero
          look={lookOf(p)}
          eyebrow={String(p.eyebrow) || undefined}
          eyebrowHref="#"
          title={heroTitle(String(p.title), Boolean(p.inlineMedia))}
          lead={String(p.lead) || undefined}
          actions={
            <>
              <Button icon>Start a field log</Button>
              <Button variant="soft">See a sample survey</Button>
            </>
          }
          media={p.media ? <FieldMap /> : undefined}
          sticker={p.sticker ? <RotatingBadge text="OFFLINE FIRST • FREE FOR STUDENTS • " color="acid" size={132} center="✳" /> : undefined}
          meta={META}
        />
      </BlockFrame>
    ),
    code: (p) => `import { Hero, InlineMedia, Button, RotatingBadge } from "@rapui/react";

<Hero${attrs(p, heroControls, ["title", "inlineMedia", "media", "sticker"])}
  title=${p.inlineMedia ? `{<>Field notes <InlineMedia src="/dawn.jpg" /> that map themselves</>}` : `"${p.title}"`}
  actions={<>
    <Button icon>Start a field log</Button>
    <Button variant="soft">See a sample survey</Button>
  </>}${p.media ? `\n  media={<img src="/kestrel-map.png" alt="The Kestrel map with today's sightings" />}` : ""}${
    p.sticker ? `\n  sticker={<RotatingBadge text="OFFLINE FIRST • FREE FOR STUDENTS • " color="acid" />}` : ""
  }
  meta={[{ label: "Lat", value: "57.1194° N" }, { label: "Lon", value: "3.6421° W" }]}
/>`,
    examples: [
      {
        title: "A city-data portal, civic, with a picture in the headline",
        Demo: () => (
          <BlockFrame>
            <Hero
              look="civic"
              eyebrow="Port Allen open data"
              title={
                <>
                  Your city's numbers, <InlineMedia>
                    <Harbour />
                  </InlineMedia>{" "}
                  open to <Accent>everyone</Accent>
                </>
              }
              lead="Budgets, bus times, permits and air quality — published the day they're recorded, free to download, chart and reuse."
              actions={
                <>
                  <Button icon>Explore the data</Button>
                  <Button variant="ghost">How we publish</Button>
                </>
              }
              media={<Harbour />}
            />
          </BlockFrame>
        ),
        code: `<Hero
  look="civic"
  eyebrow="Port Allen open data"
  title={<>Your city's numbers, <InlineMedia src="/harbour.jpg" /> open to <Accent>everyone</Accent></>}
  lead="Budgets, bus times, permits and air quality — published the day they're recorded, free to download, chart and reuse."
  actions={<>
    <Button icon>Explore the data</Button>
    <Button variant="ghost">How we publish</Button>
  </>}
  media={<img src="/harbour.jpg" alt="Port Allen's waterfront at dusk" />}
/>`,
      },
    ],
  },
  {
    slug: "logo-cloud",
    name: "Logo cloud",
    group: "Blocks",
    description:
      "The \"trusted by\" row. Pass marks, or just names — a name with no mark is set as a wordmark that fits the look. Fun runs them as a marquee across a loud tile; civic centres them in a soft card; signal rules them into numbered mono cells; product greys them out under a quiet caption until hovered; minimal lists the names between hairlines.",
    controls: logoControls,
    Demo: ({ p }) => {
      const names = NAMES.slice(0, Number(p.count));
      return (
        <BlockFrame>
          <LogoCloud look={lookOf(p)} title={String(p.title) || undefined} logos={p.marks ? withMarks(names) : names.map((name) => ({ name }))} />
        </BlockFrame>
      );
    },
    code: (p) => `import { LogoCloud } from "@rapui/react";

<LogoCloud${attrs(p, logoControls, ["count", "marks"])}
  logos={[
${NAMES.slice(0, Number(p.count))
  .map((n) => `    { name: "${n}"${p.marks ? `, logo: <img src="/logos/${n.toLowerCase().replace(/[^a-z]+/g, "-")}.svg" alt="" />` : ""} },`)
  .join("\n")}
  ]}
/>`,
  },
  {
    slug: "stats",
    name: "Stats",
    group: "Blocks",
    description:
      "Key numbers: a few figures with a label and an optional note, under an optional SectionHeader. Fun packs them into colourful tiles whose numbers count up as they come into view; civic sets serif figures in soft cards; signal draws the lead figure in dots beside a dot-matrix meter over ruled mono readouts; product lines them up between hairlines; minimal lists big numbers against small words, a rule above each.",
    controls: statsControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <Stats
          look={lookOf(p)}
          eyebrow={p.header ? "By the numbers" : undefined}
          index="02"
          title={p.header ? String(p.title) : undefined}
          lead={p.header ? "What ecologists, rangers and student surveyors logged with Kestrel between March and October." : undefined}
          items={ITEMS.slice(0, Number(p.count))}
        />
      </BlockFrame>
    ),
    code: (p) => `import { Stats } from "@rapui/react";

<Stats${attrs(p, statsControls, ["header", "title", "count"])}${
      p.header
        ? `
  eyebrow="By the numbers"
  index="02"
  title="${p.title}"
  lead="What ecologists, rangers and student surveyors logged with Kestrel between March and October."`
        : ""
    }
  items={[
${itemsCode(Number(p.count))}
  ]}
/>`,
  },
];
