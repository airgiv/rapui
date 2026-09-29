import { useState } from "react";
import { EditorToolbar, editorIcons } from "../../rapui";
import type { EditorIconName, EditorToolbarSize, EditorToolbarTone } from "../../rapui";
import { cn } from "../../rapui/utils";
import { ToolbarDemo } from "../../site/demos/ToolbarDemo";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* a paper ground with a dot grid, like the editor canvas the bar floats over */
const CANVAS =
  "grid place-items-center justify-items-[safe_center] w-full min-h-80 px-4 pt-20 pb-10 overflow-x-auto rounded-[calc(var(--rap-radius)-8px)] bg-paper bg-[radial-gradient(var(--rap-fill-strong)_1.2px,transparent_1.6px)] bg-size-[24px_24px]";
/* something lit behind the glass so the frost has something to show */
const GLASS_GROUND =
  "[background:radial-gradient(circle_at_28%_60%,var(--rap-flame)_0_14%,transparent_15%),radial-gradient(circle_at_70%_42%,var(--rap-blue)_0_18%,transparent_19%),radial-gradient(circle_at_52%_78%,var(--rap-acid)_0_10%,transparent_11%),var(--rap-paper-3)]";

const toolbarControls: Control[] = [
  { type: "select", prop: "size", options: ["md", "lg", "hero"], default: "lg" },
  { type: "select", prop: "orientation", options: ["horizontal", "vertical"], default: "horizontal" },
  { type: "select", prop: "tone", options: ["blue", "ink", "flame", "acid", "plum"], default: "blue" },
  { type: "boolean", prop: "glass", default: false },
  { type: "boolean", prop: "labels", default: true },
];

const HUES: Partial<Record<EditorIconName, string>> = {
  select: "var(--rap-sky)",
  hand: "var(--rap-bubble)",
  text: "var(--rap-acid)",
  shape: "var(--rap-bubble)",
  pen: "var(--rap-sky)",
  image: "var(--rap-sky)",
  video: "var(--rap-flame)",
  frame: "var(--rap-acid)",
  sticker: "var(--rap-bubble)",
  comment: "var(--rap-acid)",
  animation: "var(--rap-flame)",
  widget: "var(--rap-acid)",
  layers: "var(--rap-sky)",
  eraser: "var(--rap-bubble)",
  plus: "var(--rap-acid)",
  audio: "var(--rap-plum)",
};

const iconControls: Control[] = [
  { type: "number", prop: "size", min: 24, max: 64, step: 4, default: 44, codeDefault: 32 },
  { type: "select", prop: "tint", options: ["per icon", "none", "acid", "flame", "sky", "bubble"], default: "per icon" },
];

function ToolbarPlayground({ p }: { p: Record<string, string | number | boolean> }) {
  const [tool, setTool] = useState("text");
  const vertical = p.orientation === "vertical";
  return (
    <div className={cn(CANVAS, p.glass && GLASS_GROUND, vertical && "pt-10 justify-items-start sm:justify-items-center")}>
      <EditorToolbar
        value={tool}
        onValueChange={setTool}
        size={p.size as EditorToolbarSize}
        orientation={vertical ? "vertical" : "horizontal"}
        tone={p.tone as EditorToolbarTone}
        glass={Boolean(p.glass)}
        labels={Boolean(p.labels)}
      />
    </div>
  );
}

export const entries: DocEntry[] = [
  {
    slug: "editor-toolbar",
    name: "Editor toolbar",
    group: "Expressive",
    basedOn: "Radix Toolbar + Popover",
    description:
      "The big tool bar of a canvas editor, at hero-input scale: 60–88px slots with the bespoke editor icons, tool groups, a “+” flyout of widgets, arrow keys and 1–9 to pick. Delight: one pad crawls between tools like a caterpillar and each icon does its own little gesture when you pick it — the ball bounces, the pen scribbles, the sticker peels.",
    controls: toolbarControls,
    Demo: ToolbarPlayground,
    code: (p) => `import { EditorToolbar } from "@rapui/react";

const [tool, setTool] = useState("select");

<EditorToolbar value={tool} onValueChange={setTool}${attrs(p, toolbarControls)} />`,
    examples: [
      {
        title: "On a canvas: picking a tool changes what lands on the paper",
        Demo: ToolbarDemo,
        code: `import { EditorToolbar, EDITOR_TOOLS, EDITOR_WIDGETS } from "@rapui/react";

<EditorToolbar
  value={tool}
  onValueChange={setTool}
  size="hero"
  glass
  groups={EDITOR_TOOLS}      // or your own [[{ id, label, icon, hue }]]
  widgets={EDITOR_WIDGETS}   // the "+" flyout; false hides it
  onAddWidget={(id) => place(id)}
/>`,
      },
    ],
  },
  {
    slug: "editor-icons",
    name: "Editor icons",
    group: "Expressive",
    description:
      "Sixteen hand-drawn two-tone glyphs for editor tools: a soft fill off-register behind 2px ink on a 32px grid. The fill reads the --tone custom property (or the tone prop), so a selected state can recolour it. Delight: hover one — each has its own motion, from a clicking cursor to a bouncing ball.",
    controls: iconControls,
    Demo: ({ p }) => (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-tile w-full">
        {(Object.keys(editorIcons) as EditorIconName[]).map((name) => {
          const Icon = editorIcons[name];
          const tint =
            p.tint === "per icon"
              ? `color-mix(in oklab, ${HUES[name]} 55%, transparent)`
              : p.tint === "none"
                ? undefined
                : `color-mix(in oklab, var(--rap-${p.tint}) 55%, transparent)`;
          return (
            <div
              key={name}
              title={name}
              className="rap-eti-host flex flex-col items-center justify-center gap-2 h-[112px] rounded-[20px] bg-paper text-ink transition-colors duration-(--rap-dur-fast) hover:bg-fill-hover"
            >
              <Icon size={Number(p.size)} tone={tint} />
              <span className="text-[0.75rem] text-mute">{name}</span>
            </div>
          );
        })}
      </div>
    ),
    code: (p) => {
      const tone =
        p.tint === "per icon" ? ` tone="var(--rap-acid)"` : p.tint === "none" ? "" : ` tone="var(--rap-${p.tint})"`;
      return `import { editorIcons, TextIcon } from "@rapui/react";

<TextIcon${attrs(p, iconControls, ["tint"])}${tone} />
<editorIcons.animation size={44} />

// hover motion plays inside any element with class "rap-eti-host"`;
    },
  },
];
