import type { ReactNode } from "react";
import { Button, Container, Grid, GridItem, GridOverlay, Section, SectionHeader, Stack, type SectionTone, type Space } from "../../rapui";
import { BlockFrame } from "../blockFrame";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* a labelled placeholder cell, so the grid's tracks and gaps are what you see */
function Cell({ children, tall }: { children: ReactNode; tall?: boolean }) {
  return (
    <div className={`grid place-items-center rounded-sm bg-fill text-[0.8125rem] font-medium text-ink-2 ${tall ? "min-h-40" : "min-h-20"}`}>{children}</div>
  );
}

const gridControls: Control[] = [
  { type: "select", prop: "cols", options: ["12-track", "2", "3", "4", "6"], default: "3", codeDefault: null },
  { type: "select", prop: "gap", options: ["column", "tile", "xs", "md", "xl"], default: "column" },
  { type: "boolean", prop: "overlay", label: "show grid", default: true },
];

const sectionControls: Control[] = [
  { type: "select", prop: "tone", options: ["plain", "surface", "muted", "dark"], default: "surface", codeDefault: "plain" },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "sm", codeDefault: "md" },
  { type: "select", prop: "width", options: ["narrow", "default", "full"], default: "default" },
];

const stackControls: Control[] = [
  { type: "select", prop: "direction", options: ["column", "row"], default: "row", codeDefault: "column" },
  { type: "select", prop: "gap", options: ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"], default: "md" },
  { type: "select", prop: "align", options: ["start", "center", "end", "stretch"], default: "center", codeDefault: null },
];

const headerControls: Control[] = [
  { type: "text", prop: "eyebrow", default: "How it works" },
  { type: "text", prop: "index", default: "02" },
  { type: "select", prop: "align", options: ["start", "center"], default: "start" },
  { type: "select", prop: "size", options: ["xl", "lg", "md"], default: "lg" },
];

export const entries: DocEntry[] = [
  {
    slug: "grid",
    name: "Grid",
    group: "Layout",
    description:
      "The page grid. Give it `cols` for equal columns — they fall to two, then one, as the room runs out — or leave it out for the 12-track grid and place `GridItem`s with a `span`. Widths and gaps come from the preset: product runs a 1160px column with 24px gaps, minimal 1280px with more air, and `gap=\"tile\"` packs cards the preset's way (4px in fun, 1px hairlines in minimal). It responds to its own width, not the window's, so it collapses the same in a sidebar. Toggle `GridOverlay` with Shift+G to see the columns over your page.",
    controls: gridControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <div className="relative py-10">
          {p.overlay && <GridOverlay visible position="absolute" />}
          <Container className="relative">
            {p.cols === "12-track" ? (
              <Grid gap={p.gap as Space} rowGap="column">
                <GridItem span={8}>
                  <Cell tall>span 8</Cell>
                </GridItem>
                <GridItem span={4}>
                  <Cell tall>span 4</Cell>
                </GridItem>
                <GridItem span={5}>
                  <Cell>span 5</Cell>
                </GridItem>
                <GridItem span={6} start={7}>
                  <Cell>span 6, start 7</Cell>
                </GridItem>
              </Grid>
            ) : (
              <Grid cols={Number(p.cols)} gap={p.gap as Space}>
                {Array.from({ length: Number(p.cols) * 2 }, (_, i) => (
                  <Cell key={i}>{i + 1}</Cell>
                ))}
              </Grid>
            )}
          </Container>
        </div>
      </BlockFrame>
    ),
    code: (p) =>
      p.cols === "12-track"
        ? `import { Grid, GridItem } from "@rapui/react";

<Grid${p.gap !== "column" ? ` gap="${p.gap}"` : ""}>
  <GridItem span={8}>…</GridItem>
  <GridItem span={4}>…</GridItem>
  <GridItem span={6} start={7}>…</GridItem>
</Grid>${p.overlay ? "\n\n// the columns over the page, toggled with Shift+G\n<GridOverlay />" : ""}`
        : `import { Grid } from "@rapui/react";

<Grid cols={${p.cols}}${p.gap !== "column" ? ` gap="${p.gap}"` : ""}>
  <Card>…</Card>
  <Card>…</Card>
  <Card>…</Card>
</Grid>${p.overlay ? "\n\n// the columns over the page, toggled with Shift+G\n<GridOverlay />" : ""}`,
    examples: [
      {
        title: "Your own steps: 2 on a phone, 3 on a tablet, 6 wide",
        Demo: () => (
          <BlockFrame>
            <Container className="py-8">
              <Grid cols={[2, 3, 6]} gap="tile">
                {Array.from({ length: 6 }, (_, i) => (
                  <Cell key={i}>{i + 1}</Cell>
                ))}
              </Grid>
            </Container>
          </BlockFrame>
        ),
        code: `<Grid cols={[2, 3, 6]} gap="tile">…</Grid>`,
      },
    ],
  },
  {
    slug: "section",
    name: "Section",
    group: "Layout",
    description:
      "One band of a page: the preset's vertical rhythm above and below, a container inside. A toned section is an object of its own — a big rounded card inset from the page edge in fun and civic, flush and square in signal, product and minimal; `dark` makes it a dark island in the preset's own dark palette. Plain sections in a row get the preset's rule between them: a hairline in signal and minimal, nothing elsewhere.",
    controls: sectionControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <Section size="sm" width={p.width as "default"}>
          <SectionHeader eyebrow="Before" title="A plain section" size="md" />
        </Section>
        <Section tone={p.tone as SectionTone} size={p.size as "md"} width={p.width as "default"}>
          <SectionHeader eyebrow="This one" index="02" title={`tone="${p.tone}"`} lead="The padding is a share of --rap-section-y; the width is the preset's container." size="md" />
        </Section>
        <Section size="sm" width={p.width as "default"}>
          <SectionHeader eyebrow="After" title="And another" size="md" />
        </Section>
      </BlockFrame>
    ),
    code: (p) => `import { Section, SectionHeader } from "@rapui/react";

<Section${attrs(p, sectionControls)}>
  <SectionHeader title="…" />
</Section>`,
  },
  {
    slug: "section-header",
    name: "Section header",
    group: "Layout",
    description:
      "The kicker, title and lead every block opens with. Each preset sets the kicker its own way: a live dot in fun, red capitals in civic, mono capitals with a {0002} tag in signal, iris in product, a quiet \"02 —\" in minimal. The index only shows where the preset numbers its sections.",
    controls: headerControls,
    Demo: ({ p }) => (
      <BlockFrame>
        <Section size="sm">
          <SectionHeader
            eyebrow={String(p.eyebrow) || undefined}
            index={String(p.index) || undefined}
            align={p.align as "start"}
            size={p.size as "lg"}
            title="Three steps from sketch to a page you can ship"
            lead="Pick a preset, drop in the blocks, write your words. The grid, the type and the spacing come along."
            actions={
              <>
                <Button variant="accent">Start a page</Button>
                <Button variant="soft">See the blocks</Button>
              </>
            }
          />
        </Section>
      </BlockFrame>
    ),
    code: (p) => `import { SectionHeader } from "@rapui/react";

<SectionHeader${attrs(p, headerControls)}
  title="Three steps from sketch to a page you can ship"
  lead="Pick a preset, drop in the blocks, write your words."
  actions={<Button variant="accent">Start a page</Button>}
/>`,
  },
  {
    slug: "stack",
    name: "Stack",
    group: "Layout",
    description:
      "A row or column with a gap from the spacing steps (2xs … 2xl). The steps scale with the preset's density — civic and minimal breathe more, signal packs tighter — so a layout built on them stays in proportion when the preset changes.",
    controls: stackControls,
    Demo: ({ p }) => (
      <Stack direction={p.direction as "row"} gap={p.gap as Space} align={p.align as "center"} wrap>
        <Cell>one</Cell>
        <div className="w-28">
          <Cell tall>two</Cell>
        </div>
        <Cell>three</Cell>
      </Stack>
    ),
    code: (p) => `import { Stack } from "@rapui/react";

<Stack${attrs(p, stackControls)}>
  …
</Stack>`,
  },
  {
    slug: "container",
    name: "Container",
    group: "Layout",
    description:
      "The content column: as wide as the preset's --rap-container, with --rap-gutter at the sides, centred. `narrow` is the reading width for long text; `full` drops the cap. Section puts one inside itself, so you mostly need this on its own for headers, footers and full-bleed bands.",
    controls: [{ type: "select", prop: "size", options: ["narrow", "default", "full"], default: "default" }],
    Demo: ({ p }) => (
      <BlockFrame>
        <div className="py-8">
          <Container size={p.size as "default"}>
            <div className="grid min-h-24 place-items-center rounded-sm bg-fill text-[0.875rem] text-ink-2">--rap-container{p.size === "narrow" ? "-narrow" : p.size === "full" ? ": none" : ""}</div>
          </Container>
        </div>
      </BlockFrame>
    ),
    code: (p) => `import { Container } from "@rapui/react";

<Container${p.size !== "default" ? ` size="${p.size}"` : ""}>…</Container>`,
  },
];
