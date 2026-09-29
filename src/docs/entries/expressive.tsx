import { useState } from "react";
import {
  Accent,
  FANCY_ICONS,
  FancyIcon,
  icons,
  CanvasToolbar,
  Checklist,
  Counter,
  Display,
  Eyebrow,
  FeatureCard,
  Highlight,
  Lead,
  Magnetic,
  Marquee,
  RollText,
  RotatingBadge,
  SplitReveal,
  Sticker,
  Tabs,
  TiltCard,
} from "../../rapui";
import type { AccentTone, FancyIconName, FancyTone, IconComponent, StickerColor, StickerShape } from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

const COLORS = ["acid", "flame", "blue", "plum", "bubble", "sky", "ink", "paper"] as const;
const SHAPES = ["pill", "circle", "tag", "burst", "star", "flower", "clover", "blob", "heart", "squircle"] as const;

const typeControls: Control[] = [
  { type: "select", prop: "size", options: ["md", "lg", "xl", "xxl", "mega"], default: "xxl" },
  { type: "text", prop: "text", default: "Make it" },
  { type: "text", prop: "accent", default: "unforgettable" },
  { type: "select", prop: "tone", options: ["flame", "blue", "plum", "mute"], default: "mute" },
];

const stickerControls: Control[] = [
  { type: "select", prop: "shape", options: SHAPES, default: "burst", codeDefault: "pill" },
  { type: "select", prop: "color", options: COLORS, default: "flame", codeDefault: "acid" },
  { type: "text", prop: "label", default: "hot drop" },
  { type: "number", prop: "rotate", min: -30, max: 30, default: -6 },
];

const marqueeControls: Control[] = [
  { type: "number", prop: "duration", label: "seconds per loop", min: 6, max: 60, default: 20, codeDefault: 22 },
  { type: "number", prop: "rotate", min: -8, max: 8, default: -2, codeDefault: 0 },
  { type: "boolean", prop: "reverse", default: false },
  { type: "boolean", prop: "pauseOnHover", label: "pause on hover", default: true },
];

const badgeControls: Control[] = [
  { type: "text", prop: "text", default: "open for projects ✳ open for projects ✳ ", codeDefault: null },
  { type: "select", prop: "color", options: ["ink", "flame", "acid", "blue"], default: "acid", codeDefault: "ink" },
  { type: "number", prop: "size", min: 100, max: 260, step: 10, default: 180, codeDefault: 140 },
  { type: "number", prop: "duration", label: "seconds per turn", min: 4, max: 40, default: 14 },
];

const revealControls: Control[] = [
  { type: "select", prop: "by", options: ["word", "char"], default: "word" },
  { type: "number", prop: "stagger", label: "stagger, ms", min: 10, max: 150, step: 5, default: 60 },
  { type: "text", prop: "text", default: "Every word earns its entrance" },
];

const tiltControls: Control[] = [
  { type: "select", prop: "tone", options: ["paper", "ink", "flame", "blue", "plum", "acid", "bubble", "sky"], default: "flame", codeDefault: "paper" },
  { type: "number", prop: "max", label: "max tilt, °", min: 0, max: 25, default: 10 },
  { type: "boolean", prop: "spotlight", default: true },
];

const featureControls: Control[] = [
  { type: "select", prop: "tone", options: ["white", "grey", "ink", "flame", "blue", "plum", "acid"], default: "white" },
  { type: "text", prop: "title", default: "Built-in animations" },
  { type: "text", prop: "text", default: "Craft engaging storytelling and interactive experiences" },
];

const counterControls: Control[] = [
  { type: "number", prop: "to", min: 0, max: 1000, step: 10, default: 248, codeDefault: null },
  { type: "text", prop: "suffix", default: "+", codeDefault: "" },
  { type: "number", prop: "duration", label: "duration, ms", min: 300, max: 4000, step: 100, default: 1800 },
];

const checklistControls: Control[] = [
  { type: "number", prop: "bounce", min: 0, max: 100, default: 50 },
  { type: "number", prop: "box", min: 16, max: 28, default: 24 },
  { type: "number", prop: "corner", min: 0, max: 40, default: 28 },
];

const toolbarControls: Control[] = [
  { type: "number", prop: "corner", min: 0, max: 32, default: 27 },
  { type: "select", prop: "surface", options: ["flat", "glass"], default: "flat" },
];

const TECH = Object.entries(icons).filter(([, v]) => typeof v === "object") as [string, IconComponent][];

const iconControls: Control[] = [
  { type: "select", prop: "weight", options: ["thin", "light", "regular", "bold"], default: "light", codeDefault: "light" },
  { type: "number", prop: "size", min: 16, max: 40, default: 24, codeDefault: 24 },
];

const fancyControls: Control[] = [
  { type: "select", prop: "icon", options: Object.keys(FANCY_ICONS), default: "rocket", codeDefault: null },
  { type: "select", prop: "tone", options: ["flame", "blue", "plum", "acid", "bubble", "sky", "ink"], default: "flame", codeDefault: "blue" },
  { type: "select", prop: "variant", options: ["tint", "duo"], default: "duo", codeDefault: "tint" },
  { type: "number", prop: "size", min: 24, max: 160, step: 4, default: 96, codeDefault: 32 },
  { type: "boolean", prop: "badge", default: true, codeDefault: false },
  { type: "boolean", prop: "float", default: true, codeDefault: false },
];

export const entries: DocEntry[] = [
  {
    slug: "icons",
    name: "Icons",
    group: "Expressive",
    basedOn: "Phosphor, Light",
    description:
      "Interface glyphs: thin and technical, one import path for the whole library, so the set can be swapped in one file. Names follow the familiar lucide/shadcn vocabulary.",
    controls: iconControls,
    Demo: ({ p }) => (
      <div className="doc-icon-grid">
        {TECH.map(([name, I]) => (
          <div className="doc-icon-cell" key={name} title={name}>
            <I size={Number(p.size)} weight={p.weight as "light"} />
            <span>{name}</span>
          </div>
        ))}
      </div>
    ),
    code: (p) => `import { Check, ChevronDown, Search } from "rapui/icons"; // or: import { icons } from "rapui"

<Search${attrs(p, iconControls)} />`,
  },
  {
    slug: "fancy-icon",
    name: "Fancy icon",
    group: "Expressive",
    basedOn: "Solar, Bold Duotone",
    description:
      "Illustrative icons for empty states, feature tiles, milestones and marketing blocks. Tinted with a rap/ui accent: one colour in two strengths, or ink over a full accent.",
    controls: fancyControls,
    Demo: ({ p }) => (
      <FancyIcon
        icon={p.icon as FancyIconName}
        tone={p.tone as FancyTone}
        variant={p.variant as "tint"}
        size={Number(p.size)}
        badge={Boolean(p.badge)}
        float={Boolean(p.float)}
      />
    ),
    code: (p) => `import { FancyIcon } from "rapui";

<FancyIcon${attrs(p, fancyControls)} />`,
    examples: [
      {
        title: "The curated set",
        Demo: () => (
          <div className="doc-icon-grid doc-icon-grid--fancy">
            {(Object.keys(FANCY_ICONS) as FancyIconName[]).map((n, i) => (
              <div className="doc-icon-cell" key={n}>
                <FancyIcon icon={n} tone={(["flame", "blue", "plum", "acid", "bubble", "sky"] as FancyTone[])[i % 6]} size={36} />
                <span>{n}</span>
              </div>
            ))}
          </div>
        ),
        code: `<FancyIcon icon="rocket" />  // any key of FANCY_ICONS, or any Solar icon component`,
      },
    ],
  },
  {
    slug: "typography",
    name: "Typography",
    group: "Expressive",
    description:
      "Display sizes from md to mega in one typeface, Onest. Accent recolours a word instead of switching font; mute gives the two-tone headline.",
    controls: typeControls,
    Demo: ({ p }) => (
      <div className="doc-stack" style={{ width: "100%" }}>
        <Eyebrow>Chapter one</Eyebrow>
        <Display size={p.size as "xl"}>
          {String(p.text)} <Accent tone={p.tone as AccentTone}>{String(p.accent)}</Accent>
        </Display>
        <Lead>
          Big type, lots of air, and a <Highlight>highlighter</Highlight> swipe when a phrase has to stand out.
        </Lead>
      </div>
    ),
    code: (p) => `import { Display, Accent, Eyebrow, Lead, Highlight } from "rapui";

<Eyebrow>Chapter one</Eyebrow>
<Display size="${p.size}">${p.text} <Accent${p.tone !== "flame" ? ` tone="${p.tone}"` : ""}>${p.accent}</Accent></Display>
<Lead>Big type and a <Highlight>highlighter</Highlight> swipe.</Lead>`,
  },
  {
    slug: "sticker",
    name: "Sticker",
    group: "Expressive",
    description: "A rotated label that wobbles when touched. Ten soft shapes with no sharp corners, in every accent colour.",
    controls: stickerControls,
    Demo: ({ p }) => {
      const svg = !["pill", "tag"].includes(String(p.shape));
      return (
        <Sticker
          shape={p.shape as StickerShape}
          color={p.color as StickerColor}
          rotate={Number(p.rotate)}
          size={svg ? "1.3rem" : "2rem"}
          style={svg ? { width: "11rem" } : undefined}
        >
          {String(p.label)}
        </Sticker>
      );
    },
    code: (p) => `import { Sticker } from "rapui";

<Sticker${attrs(p, stickerControls, ["label"])}>${p.label}</Sticker>`,
    examples: [
      {
        title: "All shapes",
        Demo: () => (
          <div className="doc-row" style={{ gap: "1.5rem", justifyContent: "center" }}>
            {SHAPES.map((s, i) => {
              const svg = !["pill", "tag"].includes(s);
              return (
                <Sticker
                  key={s}
                  shape={s}
                  color={COLORS[i % 6]}
                  rotate={i % 2 ? 6 : -6}
                  size="1rem"
                  style={svg ? { width: "7.5rem" } : undefined}
                >
                  {s}
                </Sticker>
              );
            })}
          </div>
        ),
        code: SHAPES.map((s) => `<Sticker shape="${s}">${s}</Sticker>`).join("\n"),
      },
    ],
  },
  {
    slug: "marquee",
    name: "Marquee",
    group: "Expressive",
    description: "A seamless infinite ticker. Tilt it, reverse it, or stack two running in opposite directions.",
    controls: marqueeControls,
    Demo: ({ p }) => (
      <div style={{ width: "calc(100% + 6rem)", margin: "0 -3rem" }}>
        <Marquee
          duration={Number(p.duration)}
          rotate={Number(p.rotate)}
          reverse={Boolean(p.reverse)}
          pauseOnHover={Boolean(p.pauseOnHover)}
          className="doc-marquee"
        >
          <span>Available for work</span>
          <Sticker color="acid" rotate={-6}>
            fresh
          </Sticker>
          <span>Motion</span>
          <Accent tone="mute">✳</Accent>
        </Marquee>
      </div>
    ),
    code: (p) => `import { Marquee } from "rapui";

<Marquee${attrs(p, marqueeControls)}>
  <span>Available for work</span>
  <Sticker color="acid">fresh</Sticker>
</Marquee>`,
  },
  {
    slug: "rotating-badge",
    name: "Rotating badge",
    group: "Expressive",
    description: "Running circular text around a mark in the middle. Spins faster on hover; works as a scroll hint or a stamp.",
    controls: badgeControls,
    Demo: ({ p }) => (
      <RotatingBadge text={String(p.text)} color={p.color as "acid"} size={Number(p.size)} duration={Number(p.duration)} />
    ),
    code: (p) => `import { RotatingBadge } from "rapui";

<RotatingBadge${attrs(p, badgeControls)} />`,
  },
  {
    slug: "split-reveal",
    name: "Split reveal",
    group: "Expressive",
    description: "Words or letters rise from behind a mask as the block scrolls into view.",
    controls: revealControls,
    Demo: ({ p }) => (
      <Display size="xl" key={`${p.by}-${p.stagger}-${p.text}`}>
        <SplitReveal by={p.by as "word"} stagger={Number(p.stagger)}>
          {String(p.text)}
        </SplitReveal>
      </Display>
    ),
    code: (p) => `import { SplitReveal, Display } from "rapui";

<Display size="xl">
  <SplitReveal${attrs(p, revealControls, ["text"])}>${p.text}</SplitReveal>
</Display>`,
  },
  {
    slug: "roll-text",
    name: "Roll text",
    group: "Expressive",
    description: "Letters roll up and are replaced from below on hover. Buttons and nav links use it; any parent with .rap-roll-host triggers it.",
    Demo: () => (
      <Display size="lg">
        <RollText>Hover this line</RollText>
      </Display>
    ),
    code: () => `import { RollText } from "rapui";

<a className="rap-roll-host" href="/work"><RollText>Work</RollText></a>`,
  },
  {
    slug: "tilt-card",
    name: "Tilt card",
    group: "Expressive",
    description: "A card that leans toward the pointer in 3D with a soft spotlight.",
    controls: tiltControls,
    Demo: ({ p }) => (
      <div style={{ width: "min(100%, 22rem)" }}>
        <TiltCard tone={p.tone as "flame"} max={Number(p.max)} spotlight={Boolean(p.spotlight)}>
          <div className="doc-stack" style={{ minHeight: "16rem", justifyContent: "space-between" }}>
            <span className="doc-value">Case 01</span>
            <Display size="lg">Brand for a bakery on Mars</Display>
            <span className="doc-value">Identity, 2026</span>
          </div>
        </TiltCard>
      </div>
    ),
    code: (p) => `import { TiltCard } from "rapui";

<TiltCard${attrs(p, tiltControls)}>…</TiltCard>`,
  },
  {
    slug: "feature-card",
    name: "Feature card",
    group: "Expressive",
    description: "An airy tile with a big media slot, a short title and a small caption. The media zooms and the card lifts on hover.",
    controls: featureControls,
    Demo: ({ p }) => (
      <div style={{ width: "min(100%, 18rem)" }}>
        <FeatureCard tone={p.tone as "white"} title={String(p.title)} media={<span className="doc-emoji">↻</span>}>
          {String(p.text)}
        </FeatureCard>
      </div>
    ),
    code: (p) => `import { FeatureCard } from "rapui";

<FeatureCard${attrs(p, featureControls, ["text", "title"])} title="${p.title}" media={<img src="/anim.webp" alt="" />}>
  ${p.text}
</FeatureCard>`,
  },
  {
    slug: "counter",
    name: "Counter",
    group: "Expressive",
    description: "A number that counts up with an exponential ease once it scrolls into view.",
    controls: counterControls,
    Demo: ({ p }) => (
      <Display size="mega" key={`${p.to}-${p.duration}`}>
        <Counter to={Number(p.to)} suffix={String(p.suffix)} duration={Number(p.duration)} />
      </Display>
    ),
    code: (p) => `import { Counter, Display } from "rapui";

<Display size="mega"><Counter${attrs(p, counterControls)} /></Display>`,
  },
  {
    slug: "animated-tabs",
    name: "Animated tabs",
    group: "Expressive",
    description: "Pill tabs with an indicator that springs between options; panels blur in. For product UI tabs see Tabs.",
    Demo: () => {
      const [v, setV] = useState("brand");
      return (
        <Tabs
          value={v}
          onValueChange={setV}
          items={[
            { value: "all", label: "All work", content: <Lead>42 projects this year.</Lead> },
            { value: "brand", label: "Branding", content: <Lead>Logos, systems and very big type.</Lead> },
            { value: "web", label: "Web", content: <Lead>Sites that scroll like magazines.</Lead> },
          ]}
        />
      );
    },
    code: () => `import { Tabs } from "rapui";

<Tabs items={[
  { value: "all", label: "All work", content: <Grid /> },
  { value: "brand", label: "Branding" },
]} />`,
  },
  {
    slug: "magnetic",
    name: "Magnetic",
    group: "Expressive",
    description: "Wrap anything to make it drift toward the pointer and spring back when it leaves.",
    controls: [{ type: "number", prop: "strength", min: 0, max: 1, step: 0.05, default: 0.5 }],
    Demo: ({ p }) => (
      <Magnetic strength={Number(p.strength)}>
        <Sticker shape="blob" color="acid" size="1.4rem" rotate={-8} style={{ width: "9rem" }}>
          pull me
        </Sticker>
      </Magnetic>
    ),
    code: (p) => `import { Magnetic } from "rapui";

<Magnetic strength={${p.strength}}>…</Magnetic>`,
  },
  {
    slug: "checklist",
    name: "Checklist",
    group: "Expressive",
    basedOn: "Bencho, MIT",
    description:
      "One spring per row drives the fill, the tick, the strike-through and the fading words. Tick the last task and the list falls into a heap, then resets.",
    controls: checklistControls,
    Demo: ({ p }) => (
      <div className="doc-ground">
        <Checklist bounce={Number(p.bounce)} box={Number(p.box)} corner={Number(p.corner)} />
      </div>
    ),
    code: (p) => `import { Checklist } from "rapui";

<Checklist${attrs(p, checklistControls)} />`,
  },
  {
    slug: "canvas-toolbar",
    name: "Canvas toolbar",
    group: "Expressive",
    basedOn: "Bencho, MIT",
    description: "A floating tool rail that remembers the last shape you picked. The selected tool gets a blue pad that scales in.",
    controls: toolbarControls,
    Demo: ({ p }) =>
      p.surface === "glass" ? (
        <div className="doc-ground doc-ground--glass" data-surface="glass">
          <CanvasToolbar corner={Number(p.corner)} />
        </div>
      ) : (
        <div className="doc-ground">
          <CanvasToolbar corner={Number(p.corner)} />
        </div>
      ),
    code: (p) => `import { CanvasToolbar } from "rapui";

${p.surface === "glass" ? `<div data-surface="glass">\n  <CanvasToolbar${attrs(p, toolbarControls, ["surface"])} />\n</div>` : `<CanvasToolbar${attrs(p, toolbarControls, ["surface"])} />`}`,
  },
];
