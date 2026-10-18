import { ArrowLine, Asterisk, CrossGrid, DotMatrix, DotScreen, DotText, Horizon, IndexTag, MatrixStatus, MediaFrame, ModCell, ModGrid, Molecule, OutlineBlob, PlusMark, Redact, SpacedLabel, SquareMarks, TechClock, TickCircle, type DotMatrixAnimation } from "../../rapui";
import reel from "../../site/media/reel.webm";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

export { Foliage } from "../../site/landing/foliage";
import { Foliage } from "../../site/landing/foliage";

const ANIMS = ["wave", "orbit", "scan", "twinkle", "none"] as const;
const matrixControls: Control[] = [
  { type: "select", prop: "animation", options: ANIMS, default: "wave", codeDefault: "none" },
  { type: "number", prop: "cols", min: 3, max: 24, default: 12, codeDefault: 5 },
  { type: "number", prop: "rows", min: 3, max: 12, default: 6, codeDefault: 5 },
  { type: "number", prop: "size", label: "dot, px", min: 2, max: 14, default: 6, codeDefault: 4 },
  { type: "number", prop: "gap", label: "gap, px", min: 1, max: 12, default: 5, codeDefault: 3 },
  { type: "select", prop: "shape", options: ["round", "square"], default: "round" },
  { type: "boolean", prop: "interactive", label: "light under pointer", default: true, codeDefault: false },
];

const statusControls: Control[] = [
  { type: "text", prop: "label", default: "Researching sources" },
  { type: "select", prop: "animation", options: ["wave", "orbit", "scan", "twinkle"], default: "wave" },
  { type: "boolean", prop: "round", label: "round dots", default: false },
  { type: "boolean", prop: "timer", default: true },
];

const dotTextControls: Control[] = [
  { type: "text", prop: "text", default: "Signal" },
  { type: "number", prop: "fontSize", label: "size, px", min: 60, max: 260, step: 10, default: 180, codeDefault: 120 },
  { type: "number", prop: "step", label: "pitch, px", min: 3, max: 20, default: 8, codeDefault: null },
  { type: "number", prop: "dot", label: "dot share", min: 0.3, max: 1, step: 0.05, default: 0.74 },
  { type: "boolean", prop: "matrix", label: "5×7 matrix font", default: false },
  { type: "boolean", prop: "off", label: "unlit field (matrix)", default: true, codeDefault: false },
];

const redactControls: Control[] = [
  { type: "text", prop: "text", default: "Searcy [locks] your {focus on} what [matters by mapping] every {dependency} before [you deploy]" },
  { type: "number", prop: "stagger", label: "stagger, ms", min: 0, max: 300, step: 10, default: 110 },
];

const frameControls: Control[] = [
  { type: "select", prop: "media", options: ["picture", "video"], default: "picture", codeDefault: null },
  { type: "number", prop: "blur", label: "blur, px", min: 0, max: 24, default: 6, codeDefault: 0 },
  { type: "number", prop: "linePitch", label: "line pitch, px", min: 2, max: 8, default: 3 },
  { type: "boolean", prop: "scanlines", default: true },
  { type: "boolean", prop: "grain", default: true },
];

export const entries: DocEntry[] = [
  {
    slug: "dot-matrix",
    name: "Dot matrix",
    group: "Expressive",
    description:
      "A grid of dots: dim ones in a faint ink, lit ones in currentColor. Light some for good with `pattern`, or run a pulse through the grid — a chevron wave, a comet round the edge, a scan, a twinkle. The pulse steps like a real LCD — 12 frames a second (8 in calm), none while the grid is off screen. Delight: with `interactive`, the dots under the pointer light up and fade back, a torch over a board. The heart of the signal preset's loaders.",
    controls: matrixControls,
    Demo: ({ p }) => (
      <DotMatrix
        cols={Number(p.cols)}
        rows={Number(p.rows)}
        size={Number(p.size)}
        gap={Number(p.gap)}
        shape={p.shape as "round" | "square"}
        animation={p.animation as DotMatrixAnimation}
        interactive={Boolean(p.interactive)}
        className="text-accent"
      />
    ),
    code: (p) => `import { DotMatrix } from "@rapui/react";

<DotMatrix${attrs(p, matrixControls)} className="text-accent" />`,
    examples: [
      {
        title: "Clusters with fixed patterns",
        Demo: () => (
          <div className="grid grid-cols-2 gap-6 text-flame">
            <DotMatrix pattern={["00100", "01000", "10101", "00010", "00100"]} />
            <DotMatrix pattern={["00010", "10100", "01001", "00100", "10010"]} />
            <DotMatrix pattern={["10001", "00100", "01010", "00100", "10001"]} />
            <DotMatrix pattern={["01000", "00011", "10100", "01000", "00101"]} animation="twinkle" />
          </div>
        ),
        code: `<DotMatrix pattern={["00100", "01000", "10101", "00010", "00100"]} className="text-flame" />`,
      },
    ],
  },
  {
    slug: "matrix-status",
    name: "Matrix status",
    group: "Feedback",
    description:
      "\"Working on it\" for long tasks — an AI answer, an export, a search: a 3×3 dot matrix pulsing, a label with a light passing through it, and the time so far in mono figures, so a wait reads as progress rather than a hang. Announced to screen readers as a status.",
    controls: statusControls,
    Demo: ({ p }) => (
      <MatrixStatus
        label={String(p.label)}
        animation={p.animation as Exclude<DotMatrixAnimation, "none">}
        round={Boolean(p.round)}
        timer={Boolean(p.timer)}
      />
    ),
    code: (p) => `import { MatrixStatus } from "@rapui/react";

<MatrixStatus${attrs(p, statusControls)} />`,
    examples: [
      {
        title: "Every animation",
        Demo: () => (
          <div className="flex flex-col gap-4">
            <MatrixStatus label="Thinking" animation="wave" />
            <MatrixStatus label="Searching 14 sources" animation="orbit" round />
            <MatrixStatus label="Reading the document" animation="scan" />
            <MatrixStatus label="Drafting" animation="twinkle" round timer={false} />
          </div>
        ),
        code: `<MatrixStatus label="Thinking" animation="wave" />
<MatrixStatus label="Searching 14 sources" animation="orbit" round />
<MatrixStatus label="Reading the document" animation="scan" />
<MatrixStatus label="Drafting" animation="twinkle" round timer={false} />`,
      },
    ],
  },
  {
    slug: "dot-text",
    name: "Dot text",
    group: "Expressive",
    description:
      "A word set in dots, like a stadium board: the text is drawn in the page's display face, sampled on a grid and turned into points — real type, made of dots, and still read out as text. Delight: the dots arrive, condensing from a scatter (calm: one quiet fade, left to right); in fun, the dots near the pointer swell like a lens dragged over the board. With `matrix`, the text is set in a built-in 5×7 dot-matrix font instead (a departures board, a Nothing screen); `off` draws the unlit dots of the field in grey, `field` and `pad` fix the field and place the text, `wrap` breaks lines — the signal preset's display type.",
    controls: dotTextControls,
    Demo: ({ p }) => (
      <DotText key={`${p.text}-${p.fontSize}-${p.step}-${p.dot}-${p.matrix}-${p.off}`} fontSize={Number(p.fontSize)} step={Number(p.step)} dot={Number(p.dot)} matrix={!!p.matrix} off={!!p.off} pad={p.matrix ? 1 : undefined} className="text-ink">
        {String(p.text)}
      </DotText>
    ),
    code: (p) => `import { DotText } from "@rapui/react";

<DotText${attrs(p, dotTextControls, ["text"])}>${p.text}</DotText>`,
  },
  {
    slug: "redact",
    name: "Redact",
    group: "Expressive",
    description:
      "Text set like a marked-up document: [words] printed on an ink bar, {words} blacked out. Write it inline. Delight: the bars are laid down one after another when the text scrolls into view, like a marker going over a page; hover a blacked-out word and it is declassified — the bar sinks to a hairline. Screen readers always read the full text.",
    controls: redactControls,
    Demo: ({ p }) => (
      <Redact key={String(p.text)} stagger={Number(p.stagger)} className="max-w-[22ch] font-sans text-[clamp(1.4rem,3vw,2.2rem)] uppercase leading-[1.12] tracking-[-0.01em]">
        {String(p.text)}
      </Redact>
    ),
    code: (p) => `import { Redact } from "@rapui/react";

<Redact${attrs(p, redactControls, ["text"])} className="uppercase">
  ${p.text}
</Redact>`,
  },
  {
    slug: "media-frame",
    name: "Media frame",
    group: "Expressive",
    description:
      "A photo or video seen through an old screen: scan lines, film grain, an optional blur and colour tint — the analogue texture of the signal preset, for heroes, cards and backgrounds. Anything can sit on top. Delight (fun): a faint bright band rolls down the screen every few seconds, the way a tube refreshes. In the signal preset it is a flat screen instead: a fine pixel grid, no grain, no band.",
    controls: frameControls,
    Demo: ({ p }) => (
      <MediaFrame
        className="w-full max-w-md aspect-[4/5]"
        blur={Number(p.blur)}
        linePitch={Number(p.linePitch)}
        scanlines={Boolean(p.scanlines)}
        grain={Boolean(p.grain)}
        {...(p.media === "video" ? { video: true, src: reel, alt: "Studio reel" } : { picture: <Foliage /> })}
      />
    ),
    code: (p) => `import { MediaFrame } from "@rapui/react";

<MediaFrame ${p.media === "video" ? "video " : ""}src="/leaves.jpg"${attrs(p, frameControls, ["media"])} className="aspect-[4/5]" />`,
    examples: [
      {
        title: "A signal card: all of it together",
        Demo: () => (
          <div className="grid w-full max-w-3xl grid-cols-[2fr_3fr] overflow-hidden rounded-card bg-paper max-[700px]:grid-cols-1">
            <MediaFrame picture={<Foliage />} blur={10} className="min-h-80 rounded-none">
              {/* the word runs off the frame's edge, cropped like a detail of a poster */}
              <div className="absolute -left-3 bottom-6 text-white">
                <DotText fontSize={170} step={8} className="max-w-none">Signal</DotText>
              </div>
            </MediaFrame>
            <div className="relative flex flex-col justify-between gap-10 p-7">
              <div className="flex items-start justify-between gap-6">
                <span className="font-medium text-[1.4rem] tracking-[-0.02em]">Signal</span>
                <div className="grid grid-cols-2 gap-2 text-ink">
                  <DotMatrix pattern={["00100", "01010", "10001", "00000", "01110"]} size={3} gap={4} dim={0.25} />
                  <DotMatrix pattern={["10000", "00101", "01000", "00010", "10100"]} size={3} gap={4} dim={0.25} animation="twinkle" />
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-sm bg-surface px-4 py-3 shadow-pop">
                <span className="size-2.5 rounded-[2px] bg-ink" />
                <span className="text-[1.05rem]">Continuous system clarity for seamless scaling.</span>
              </div>
              <MatrixStatus label="Mapping dependencies" />
            </div>
          </div>
        ),
        code: `<MediaFrame src="/leaves.jpg" blur={10}>
  <DotText fontSize={170} step={8}>Signal</DotText>
</MediaFrame>
<DotMatrix pattern={["00100", "01010", "10001", "00000", "01110"]} />
<MatrixStatus label="Mapping dependencies" />`,
      },
    ],
  },
  {
    slug: "tech-marks",
    name: "Tech marks",
    group: "Expressive",
    description:
      "Small technical graphics for annotating the empty cells of a page, sparingly — the signal preset's margin marks: a minimal clock (a disc with thin hands, live while on screen), a grid of crosses with one ×, a circle with a tick, ⊕, {0033} index tags, spaced capitals, an arrow line, ▪▪▪, a striped horizon, an outline blob, an asterisk and a molecule; plus ModGrid, the full-width grid of square cells they sit on, and DotScreen, a black screen for white dot type.",
    controls: [],
    Demo: () => (
      <div className="w-full max-w-[52rem]">
        <ModGrid marks>
          <ModCell c={["1 / span 2", "1 / span 2", "1 / span 3"]} r="span 2" className="flex items-center justify-center">
            <TechClock size="100%" className="h-auto w-full max-w-[9rem]" />
          </ModCell>
          <ModCell c={["3 / span 2", "3 / span 3", "4 / span 3"]} className="flex flex-col justify-between">
            <IndexTag>0033</IndexTag>
            <CrossGrid size={96} />
          </ModCell>
          <ModCell c={["1 / span 2", "6 / span 3", "7 / span 3"]} className="flex flex-col justify-between">
            <SpacedLabel>Diagnose</SpacedLabel>
            <div className="flex gap-2 text-ink">
              <TickCircle />
              <PlusMark size={40} />
              <Asterisk />
            </div>
          </ModCell>
          <ModCell c={["3 / span 2", "3 / span 3", "4 / span 3"]} className="flex flex-col justify-end gap-3">
            <Horizon />
          </ModCell>
          <ModCell c={["1 / span 2", "6 / span 3", "7 / span 3"]} className="flex items-center justify-between text-ink">
            <OutlineBlob size={56} />
            <Molecule size={64} />
          </ModCell>
          <ModCell c={["1 / -1", "1 / span 5", "1 / span 6"]} className="flex flex-col justify-center gap-3 text-ink">
            <ArrowLine />
            <SquareMarks />
          </ModCell>
          <ModCell c={["1 / -1", "6 / span 3", "7 / span 6"]} r="span 2">
            <DotScreen className="flex h-full min-h-40 items-center p-4">
              <DotText matrix off wrap={40} className="w-full">
                Time to air out
              </DotText>
            </DotScreen>
          </ModCell>
        </ModGrid>
      </div>
    ),
    code: () => `import { ModGrid, ModCell, TechClock, CrossGrid, IndexTag, DotScreen, DotText } from "@rapui/react";

<ModGrid marks>
  <ModCell c={["1 / -1", "1 / span 4", "1 / span 3"]} r="span 2"><TechClock /></ModCell>
  <ModCell c={[null, "5 / span 3", "4 / span 3"]}><IndexTag>0033</IndexTag><CrossGrid /></ModCell>
  <ModCell c={["1 / -1", "1 / span 6", "7 / span 6"]} r="span 2">
    <DotScreen><DotText matrix off>Time to air out</DotText></DotScreen>
  </ModCell>
</ModGrid>`,
  },
];
