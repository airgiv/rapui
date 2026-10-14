import { icons } from "../../rapui";
import { Citation, SourceCard, Sources, SourcesProvider, type CitationSource } from "../../rapui/components/Sources";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* sample sources: real public sites, obviously sample pages */
const SOURCES: CitationSource[] = [
  {
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/container-queries",
    site: "MDN Web Docs",
    title: "CSS container queries — sizing components by their container",
    snippet:
      "Container queries let you apply styles to an element based on the size of its container rather than the viewport, so a component can adapt wherever it is placed.",
  },
  {
    url: "https://en.wikipedia.org/wiki/Responsive_web_design",
    site: "Wikipedia",
    title: "Responsive web design",
    snippet:
      "Responsive web design is an approach that makes pages render well on a variety of devices and window sizes, using fluid grids, flexible images and media queries.",
  },
  {
    url: "https://web.dev/articles/cq-stable",
    site: "web.dev",
    title: "Container queries land in stable browsers",
    snippet: "Size container queries are now supported in all modern engines, which means you can ship them without a polyfill for most audiences.",
  },
  {
    url: "https://caniuse.com/css-container-queries",
    site: "Can I use",
    title: "CSS Container Queries (Size) — browser support tables",
    snippet: "Global usage of browsers with full support: about 93%. Partial support in older Safari releases is limited to the size queries.",
  },
  {
    url: "https://news.example.com/2026/frontend/container-queries-one-year-on",
    site: "Example News",
    title: "One year on: how teams actually use container queries",
    snippet: "We asked twelve design-system teams what changed. Most replaced breakpoint props with containers; a few regret nesting them too deep.",
  },
  {
    url: "https://docs.example.org/design/layout/cards",
    site: "Example Design Docs",
    title: "Layout guide: cards that fit any column",
    snippet: "A card should not know where it lives. Give its wrapper `container-type: inline-size` and let the card pick its own layout.",
  },
];

/* the composition: an answer with inline citations, then the sources row */
function AnswerWithSources({ layout = "row", max = 4 }: { layout?: "row" | "grid"; max?: number }) {
  return (
    <SourcesProvider sources={SOURCES}>
      <div className="flex w-full max-w-xl flex-col gap-5">
        <div className="flex flex-col gap-3 text-[1.0625rem] leading-[1.6] text-ink">
          <p>
            Use a container query when a component should adapt to the space it is given rather than to the window
            <Citation index={1} />. It is the same idea as responsive design<Citation index={2} />, moved down from the page to
            the component.
          </p>
          <p>
            Support is no longer the blocker: size queries work in every modern engine<Citation index={3} />, covering roughly
            93% of users<Citation index={4} />. Teams that adopted them mostly dropped breakpoint props from their cards
            <Citation index={5} /> <Citation index={6} />.
          </p>
        </div>
        <Sources layout={layout} max={max} />
      </div>
    </SourcesProvider>
  );
}

const controls: Control[] = [
  { type: "select", prop: "layout", options: ["row", "grid"], default: "row" },
  { type: "number", prop: "max", label: "cards before +N", min: 1, max: 6, default: 3, codeDefault: 4 },
];

export const entries: DocEntry[] = [
  {
    slug: "ai-sources",
    name: "Sources & citations",
    group: "AI",
    description:
      "Answers that show their work. `Citation` is the numbered chip inside the answer — hover or focus it for a card with the source, click to open it. `Sources` is the row (or two-column grid) of source cards underneath, with \"+N more\". Inside a `SourcesProvider` they are linked: point at a citation and its card lights up, and the other way round.",
    basedOn: "rapui HoverCard (Radix)",
    controls,
    Demo: ({ p }) => <AnswerWithSources layout={p.layout as "row" | "grid"} max={Number(p.max)} />,
    code: (p) => `import { Citation, Sources, SourcesProvider } from "@rapui/react";

const sources = [
  { url: "https://developer.mozilla.org/…/container-queries", site: "MDN Web Docs",
    title: "CSS container queries", snippet: "Container queries let you…" },
  { url: "https://en.wikipedia.org/wiki/Responsive_web_design", site: "Wikipedia",
    title: "Responsive web design", snippet: "…" },
  // …
];

<SourcesProvider sources={sources}>
  <p>
    Use a container query when a component should adapt to its space<Citation index={1} />.
    Same idea as responsive design<Citation index={2} />, moved down to the component.
  </p>
  <Sources${attrs(p, controls)} />
</SourcesProvider>`,
    examples: [
      {
        title: "A single citation, no provider",
        Demo: () => (
          <p className="max-w-md text-[1.0625rem] leading-[1.6] text-ink">
            The Web Content Accessibility Guidelines ask for a contrast ratio of at least 4.5:1 for body text
            <Citation
              index={1}
              source={{
                url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum",
                site: "W3C WAI",
                title: "Understanding Success Criterion 1.4.3: Contrast (Minimum)",
                snippet: "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except for large text, incidental text and logotypes.",
              }}
            />
            .
          </p>
        ),
        code: `<p>
  …at least 4.5:1 for body text
  <Citation index={1} source={{ url: "https://www.w3.org/WAI/…", site: "W3C WAI",
    title: "Understanding SC 1.4.3", snippet: "…" }} />.
</p>`,
      },
      {
        title: "Cards with your own icons, in a grid",
        Demo: () => (
          <div className="grid w-full max-w-md grid-cols-2 gap-tight">
            <SourceCard
              index={1}
              source={{ ...SOURCES[0], icon: <icons.Code2 size={14} /> }}
            />
            <SourceCard
              index={2}
              source={{ ...SOURCES[1], icon: <icons.Globe size={14} /> }}
            />
            <SourceCard
              index={3}
              source={{ ...SOURCES[4], icon: <icons.Newspaper size={14} /> }}
            />
            <SourceCard index={4} source={SOURCES[5]} />
          </div>
        ),
        code: `import { icons } from "@rapui/react";

<SourceCard index={1} source={{ ...mdn, icon: <icons.Code2 size={14} /> }} />
<SourceCard index={2} source={{ ...wikipedia, icon: <icons.Globe size={14} /> }} />
<SourceCard index={3} source={{ ...news, icon: <icons.Newspaper size={14} /> }} />
<SourceCard index={4} source={designDocs} />  {/* letter avatar */}`,
      },
    ],
  },
];
