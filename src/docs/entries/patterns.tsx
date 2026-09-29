import { Button, Pattern, type PatternFade, type PatternVariant } from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

const VARIANTS = ["dots", "grid", "lines", "cross", "checker", "stripes", "waves"] as const;
const TONE: Record<string, string> = {
  ink: "text-ink/15",
  flame: "text-flame/35",
  blue: "text-blue/30",
  acid: "text-acid",
};

const patternControls: Control[] = [
  { type: "select", prop: "variant", options: VARIANTS, default: "dots" },
  { type: "number", prop: "size", label: "cell, px", min: 8, max: 64, step: 2, default: 22 },
  { type: "select", prop: "fade", options: ["none", "radial", "edges", "top", "bottom"], default: "radial", codeDefault: "none" },
  { type: "select", prop: "tone", options: ["ink", "flame", "blue", "acid"], default: "ink" },
  { type: "boolean", prop: "spotlight", default: true, codeDefault: false },
  { type: "boolean", prop: "drift", default: false },
];

export const entries: DocEntry[] = [
  {
    slug: "pattern",
    name: "Pattern",
    group: "Layout",
    description:
      "Background patterns as a layer: dots, a grid, ruled lines, crosses, a checker, stripes and waves. Drop it into any positioned box and it fills it, behind the content, in currentColor — so a text-* class sets the colour and it follows the theme. Fade it toward the edges or one side. Delight: with spotlight, the pattern lights up in a soft circle under the pointer, like a torch on graph paper; with drift, it slides slowly on a diagonal.",
    controls: patternControls,
    Demo: ({ p }) => (
      <>
        <Pattern
          variant={p.variant as PatternVariant}
          size={Number(p.size)}
          fade={p.fade as PatternFade}
          spotlight={Boolean(p.spotlight)}
          drift={Boolean(p.drift)}
          spotColor="var(--rap-flame)"
          className={TONE[String(p.tone)]}
        />
        <span className="relative rounded-pill bg-paper px-5 py-2.5 font-medium">Move over me</span>
      </>
    ),
    code: (p) => `import { Pattern } from "@rapui/react";

<div className="relative">
  <Pattern${attrs(p, patternControls, ["tone"])}${p.spotlight ? ' spotColor="var(--rap-flame)"' : ""}${p.tone !== "ink" ? ` className="${TONE[String(p.tone)]}"` : ""} />
  {children}
</div>`,
    examples: [
      {
        title: "A stage with a flame torch",
        Demo: () => (
          <div className="relative grid w-full min-h-64 place-items-center rounded-card overflow-hidden">
            <Pattern variant="dots" size={20} fade="radial" spotlight spotColor="var(--rap-flame)" />
            <Button size="lg" variant="accent" className="relative">
              Ship it
            </Button>
          </div>
        ),
        code: `<div className="relative">
  <Pattern variant="dots" size={20} fade="radial" spotlight spotColor="var(--rap-flame)" />
  <Button size="lg" variant="accent">Ship it</Button>
</div>`,
      },
      {
        title: "Every pattern",
        Demo: () => (
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-tile">
            {VARIANTS.map((v) => (
              <div key={v} className="relative grid h-32 place-items-end justify-start rounded-card bg-paper p-3 overflow-hidden">
                <Pattern variant={v} size={v === "checker" ? 16 : 18} className={v === "checker" || v === "stripes" ? "text-ink/8" : "text-ink/25"} />
                <span className="relative rounded-pill bg-surface px-3 py-1 text-[0.8125rem] font-medium">{v}</span>
              </div>
            ))}
          </div>
        ),
        code: VARIANTS.map((v) => `<Pattern variant="${v}" />`).join("\n"),
      },
      {
        title: "Drifting graph paper under a card",
        Demo: () => (
          <div className="relative grid w-full min-h-64 place-items-center rounded-card bg-blue overflow-hidden">
            <Pattern variant="grid" size={28} fade="edges" drift className="text-white/35" />
            <div className="relative rounded-card bg-surface p-6 max-w-72">
              <p className="m-0 text-[1.25rem] font-medium tracking-[-0.02em]">Blueprint mode</p>
              <p className="m-0 mt-1 text-mute">The grid slides one cell every six seconds, forever.</p>
            </div>
          </div>
        ),
        code: `<div className="relative bg-blue">
  <Pattern variant="grid" size={28} fade="edges" drift className="text-white/35" />
  <Card />
</div>`,
      },
    ],
  },
];
