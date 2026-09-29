import { useState } from "react";
import { Accordion, BigLink, Button, ButtonGroup, CircleButton, Field, Switch } from "../../rapui";
import type { ButtonSize, ButtonVariant } from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

const VARIANTS = ["solid", "blue", "accent", "soft", "acid", "outline", "ghost"] as const;

const buttonControls: Control[] = [
  { type: "select", prop: "variant", options: VARIANTS, default: "solid" },
  { type: "select", prop: "size", options: ["sm", "md", "lg", "xl"], default: "lg" },
  { type: "text", prop: "label", default: "Start a project" },
  { type: "boolean", prop: "icon", default: true },
  { type: "boolean", prop: "roll", label: "rolling letters", default: true },
  { type: "boolean", prop: "magnetic", default: false },
  { type: "boolean", prop: "disabled", default: false },
];

const groupControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "lg" },
  { type: "boolean", prop: "vertical", default: false },
  { type: "boolean", prop: "fill", label: "fill width", default: false },
];

const circleControls: Control[] = [
  { type: "select", prop: "variant", options: ["accent", "blue", "ink", "acid", "outline"], default: "accent" },
  { type: "number", prop: "size", min: 80, max: 260, step: 10, default: 180, codeDefault: 160 },
  { type: "text", prop: "label", default: "" },
];

const bigLinkControls: Control[] = [
  { type: "select", prop: "size", options: ["lg", "xl", "xxl"], default: "xl" },
  { type: "text", prop: "meta", default: "24 projects", codeDefault: "" },
];

const switchControls: Control[] = [
  { type: "select", prop: "size", options: ["md", "lg"], default: "lg", codeDefault: "md" },
  { type: "text", prop: "label", default: "Publish automatically", codeDefault: null },
  { type: "text", prop: "onText", label: "on text", default: "on" },
  { type: "text", prop: "offText", label: "off text", default: "off" },
  { type: "boolean", prop: "disabled", default: false },
];

const fieldControls: Control[] = [
  { type: "select", prop: "size", options: ["md", "lg", "xl"], default: "xl", codeDefault: "lg" },
  { type: "text", prop: "label", default: "Your name", codeDefault: null },
  { type: "text", prop: "hint", default: "As it should appear on the invoice", codeDefault: "" },
  { type: "text", prop: "error", default: "" },
];

const accordionControls: Control[] = [
  { type: "boolean", prop: "numbered", default: true },
  { type: "boolean", prop: "multiple", label: "several open", default: false },
];

export const entries: DocEntry[] = [
  {
    slug: "button",
    name: "Button",
    group: "Actions",
    description:
      "Pill button. On hover a colour blob swells from below, the letters roll and the arrow bubble turns. Seven variants, four sizes.",
    controls: buttonControls,
    Demo: ({ p }) => (
      <Button
        variant={p.variant as ButtonVariant}
        size={p.size as ButtonSize}
        icon={p.icon ? true : undefined}
        roll={Boolean(p.roll)}
        magnetic={Boolean(p.magnetic)}
        disabled={Boolean(p.disabled)}
      >
        {String(p.label)}
      </Button>
    ),
    code: (p) => `import { Button } from "rapui";

<Button${attrs(p, buttonControls, ["label", "size"])}${p.size !== "md" ? ` size="${p.size}"` : ""}>${p.label}</Button>`,
    examples: [
      {
        title: "Every variant",
        Demo: () => (
          <ButtonGroup>
            {VARIANTS.map((v) => (
              <Button key={v} variant={v} size="md">
                {v}
              </Button>
            ))}
          </ButtonGroup>
        ),
        code: VARIANTS.map((v) => `<Button variant="${v}">${v}</Button>`).join("\n"),
      },
    ],
  },
  {
    slug: "button-group",
    name: "Button group",
    group: "Actions",
    description: "Buttons packed edge to edge with a 2px seam, so a set of actions reads as one object, the way Readymag lays them out.",
    controls: groupControls,
    Demo: ({ p }) => {
      const size = p.size as ButtonSize;
      return (
        <div style={{ width: p.fill ? "min(100%, 32rem)" : undefined }}>
          <ButtonGroup vertical={Boolean(p.vertical)} fill={Boolean(p.fill)}>
            <Button size={size} variant="blue" icon>
              Publish
            </Button>
            <Button size={size} variant="soft">
              Preview
            </Button>
            <Button size={size} variant="soft">
              Share
            </Button>
          </ButtonGroup>
        </div>
      );
    },
    code: (p) => `import { Button, ButtonGroup } from "rapui";

<ButtonGroup${attrs(p, groupControls, ["size"])}>
  <Button variant="blue" icon>Publish</Button>
  <Button variant="soft">Preview</Button>
  <Button variant="soft">Share</Button>
</ButtonGroup>`,
  },
  {
    slug: "circle-button",
    name: "Circle button",
    group: "Actions",
    description: "A round, magnetic call to action. Ink floods in from the centre on hover. Holds a word, an arrow, or both.",
    controls: circleControls,
    Demo: ({ p }) => (
      <CircleButton size={Number(p.size)} variant={p.variant as "accent"}>
        {p.label ? String(p.label) : undefined}
      </CircleButton>
    ),
    code: (p) => `import { CircleButton } from "rapui";

<CircleButton${attrs(p, circleControls, ["label"])}${p.label ? `>${p.label}</CircleButton>` : " />"}`,
  },
  {
    slug: "big-link",
    name: "Big link",
    group: "Actions",
    description: "A headline-sized text link: the word turns orange, an arrow slides in, the caption follows. Stack them for a menu or project index.",
    controls: bigLinkControls,
    Demo: ({ p }) => (
      <div style={{ width: "100%" }}>
        {["Work", "Studio", "Journal"].map((w) => (
          <BigLink key={w} href="#docs.big-link" size={p.size as "xl"} meta={p.meta ? String(p.meta) : undefined}>
            {w}
          </BigLink>
        ))}
      </div>
    ),
    code: (p) => `import { BigLink } from "rapui";

<BigLink href="/work"${attrs(p, bigLinkControls)}>Work</BigLink>`,
  },
  {
    slug: "switch",
    name: "Switch",
    group: "Forms",
    description: "A chunky switch with a springy knob that stretches while pressed. Short words can sit inside the track.",
    controls: switchControls,
    Demo: ({ p }) => {
      const [on, setOn] = useState(true);
      return (
        <Switch
          size={p.size as "md" | "lg"}
          checked={on}
          onCheckedChange={setOn}
          label={String(p.label)}
          onText={String(p.onText)}
          offText={String(p.offText)}
          disabled={Boolean(p.disabled)}
        />
      );
    },
    code: (p) => `import { Switch } from "rapui";

<Switch checked={on} onCheckedChange={setOn}${attrs(p, switchControls)} />`,
  },
  {
    slug: "giant-field",
    name: "Giant field",
    group: "Forms",
    description: "An oversized underline input for hero forms: the label floats up into a caption and the line draws itself on focus.",
    controls: fieldControls,
    Demo: ({ p }) => (
      <div style={{ width: "min(100%, 40rem)" }}>
        <Field
          label={String(p.label)}
          size={p.size as "xl"}
          hint={p.hint ? String(p.hint) : undefined}
          error={p.error ? String(p.error) : undefined}
        />
      </div>
    ),
    code: (p) => `import { Field } from "rapui";

<Field${attrs(p, fieldControls)} />`,
  },
  {
    slug: "accordion",
    name: "Accordion",
    group: "Layout",
    description: "Big numbered rows that open with a smooth height animation. The plus turns into a cross.",
    controls: accordionControls,
    Demo: ({ p }) => (
      <div style={{ width: "100%" }}>
        <Accordion
          key={String(p.multiple)}
          numbered={Boolean(p.numbered)}
          multiple={Boolean(p.multiple)}
          defaultOpen={[0]}
          items={[
            { title: "Strategy", meta: "1 week", content: "We read the brief, look at the market and agree on what the site should feel like." },
            { title: "Design", meta: "3 weeks", content: "Type first, then layout, then motion. We show work early and often." },
            { title: "Build", meta: "4 weeks", content: "Everything is built from rap/ui, so the site ships looking like the mock-ups." },
          ]}
        />
      </div>
    ),
    code: (p) => `import { Accordion } from "rapui";

<Accordion${attrs(p, accordionControls)} items={[
  { title: "Strategy", meta: "1 week", content: "…" },
  { title: "Design", meta: "3 weeks", content: "…" },
]} />`,
  },
];
