import { useState } from "react";
import { AtSign, Search } from "lucide-react";
import {
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Slider,
  ToggleGroup,
  ToggleGroupItem,
} from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* ── Input ─────────────────────────────────────────── */
const inputControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "text", prop: "placeholder", default: "you@studio.com" },
  { type: "boolean", prop: "invalid", default: false },
  { type: "boolean", prop: "disabled", default: false },
  { type: "boolean", prop: "icon", label: "prefix icon", default: true },
];

/* ── Select ────────────────────────────────────────── */
const selectControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "text", prop: "placeholder", default: "Pick a typeface" },
  { type: "boolean", prop: "disabled", default: false },
];

/* ── Checkbox ──────────────────────────────────────── */
const checkboxControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "select", prop: "state", label: "checked", options: ["false", "true", "indeterminate"], default: "true" },
  { type: "boolean", prop: "disabled", default: false },
  { type: "text", prop: "label", default: "Send me the monthly digest" },
];

/* ── Slider ────────────────────────────────────────── */
const sliderControls: Control[] = [
  { type: "select", prop: "mode", options: ["single", "range"], default: "single" },
  { type: "number", prop: "step", min: 1, max: 25, step: 1, default: 1 },
  { type: "boolean", prop: "disabled", default: false },
];

/* ── ToggleGroup ───────────────────────────────────── */
const toggleControls: Control[] = [
  { type: "select", prop: "type", options: ["single", "multiple"], default: "single" },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "boolean", prop: "disabled", default: false },
];

export const entries: DocEntry[] = [
  {
    slug: "input",
    name: "Input",
    group: "Forms",
    description: "Filled pill text field for everyday forms. Takes an icon or text before and after the value.",
    controls: inputControls,
    Demo: ({ p }) => (
      <div className="doc-stack" style={{ width: "min(100%, 22rem)" }}>
        <Label htmlFor="doc-input">Email</Label>
        <Input
          id="doc-input"
          size={p.size as "sm" | "md" | "lg"}
          placeholder={String(p.placeholder)}
          invalid={Boolean(p.invalid)}
          disabled={Boolean(p.disabled)}
          prefix={p.icon ? <AtSign /> : undefined}
        />
      </div>
    ),
    code: (p) =>
      `import { Input, Label } from "rapui";

<Label htmlFor="email">Email</Label>
<Input id="email"${attrs(p, inputControls, ["icon"])}${p.icon ? " prefix={<AtSign />}" : ""} />`,
    examples: [
      {
        title: "Search",
        Demo: () => <Input placeholder="Search projects" prefix={<Search />} suffix={<kbd className="doc-kbd">⌘K</kbd>} />,
        code: `<Input placeholder="Search projects" prefix={<Search />} suffix={<kbd>⌘K</kbd>} />`,
      },
    ],
  },
  {
    slug: "select",
    name: "Select",
    group: "Forms",
    basedOn: "Radix Select",
    description: "A list of options in a floating panel. Keyboard, typeahead and screen readers work out of the box.",
    controls: selectControls,
    Demo: ({ p }) => (
      <div style={{ width: "min(100%, 18rem)" }}>
        <Select disabled={Boolean(p.disabled)}>
          <SelectTrigger size={p.size as "sm" | "md" | "lg"}>
            <SelectValue placeholder={String(p.placeholder)} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sans</SelectLabel>
              <SelectItem value="onest">Onest</SelectItem>
              <SelectItem value="geist">Geist</SelectItem>
              <SelectItem value="inter">Inter</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Mono</SelectLabel>
              <SelectItem value="geist-mono">Geist Mono</SelectItem>
              <SelectItem value="jetbrains">JetBrains Mono</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    ),
    code: (p) =>
      `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "rapui";

<Select${p.disabled ? " disabled" : ""}>
  <SelectTrigger${p.size !== "md" ? ` size="${p.size}"` : ""}>
    <SelectValue placeholder="${p.placeholder}" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="onest">Onest</SelectItem>
    <SelectItem value="geist">Geist</SelectItem>
  </SelectContent>
</Select>`,
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    group: "Forms",
    basedOn: "Radix Checkbox",
    description: "Soft-cornered checkbox that fills with the selection blue. Supports an indeterminate state for “select all”.",
    controls: checkboxControls,
    Demo: ({ p }) => {
      const initial = p.state === "indeterminate" ? "indeterminate" : p.state === "true";
      const [checked, setChecked] = useState<boolean | "indeterminate">(initial);
      const [last, setLast] = useState(p.state);
      if (last !== p.state) {
        setLast(p.state);
        setChecked(initial);
      }
      return (
        <div className="doc-row">
          <Checkbox
            id="doc-cb"
            size={p.size as "sm" | "md" | "lg"}
            checked={checked}
            onCheckedChange={setChecked}
            disabled={Boolean(p.disabled)}
          />
          <Label htmlFor="doc-cb">{String(p.label)}</Label>
        </div>
      );
    },
    code: (p) =>
      `import { Checkbox, Label } from "rapui";

<Checkbox id="digest"${p.size !== "md" ? ` size="${p.size}"` : ""}${
        p.state === "indeterminate" ? ' checked="indeterminate"' : p.state === "true" ? " defaultChecked" : ""
      }${p.disabled ? " disabled" : ""} />
<Label htmlFor="digest">${p.label}</Label>`,
    examples: [
      {
        title: "Select all",
        Demo: function SelectAll() {
          const [rows, setRows] = useState([true, false, true]);
          const all = rows.every(Boolean) ? true : rows.some(Boolean) ? "indeterminate" : false;
          const names = ["Homepage", "Case studies", "Journal"];
          return (
            <div className="doc-stack">
              <div className="doc-row">
                <Checkbox id="all" checked={all} onCheckedChange={(v) => setRows(rows.map(() => v === true))} />
                <Label htmlFor="all">All pages</Label>
              </div>
              {names.map((n, i) => (
                <div className="doc-row doc-indent" key={n}>
                  <Checkbox
                    id={`pg-${i}`}
                    checked={rows[i]}
                    onCheckedChange={(v) => setRows(rows.map((r, k) => (k === i ? v === true : r)))}
                  />
                  <Label htmlFor={`pg-${i}`}>{n}</Label>
                </div>
              ))}
            </div>
          );
        },
        code: `const all = rows.every(Boolean) ? true : rows.some(Boolean) ? "indeterminate" : false;
<Checkbox checked={all} onCheckedChange={(v) => setRows(rows.map(() => v === true))} />`,
      },
    ],
  },
  {
    slug: "slider",
    name: "Slider",
    group: "Forms",
    basedOn: "Radix Slider",
    description: "Pick a number or a range by dragging. Arrow keys move it one step.",
    controls: sliderControls,
    Demo: ({ p }) => {
      const range = p.mode === "range";
      const [v, setV] = useState<number[]>(range ? [20, 70] : [40]);
      const [mode, setMode] = useState(p.mode);
      if (mode !== p.mode) {
        setMode(p.mode);
        setV(range ? [20, 70] : [40]);
      }
      return (
        <div className="doc-stack" style={{ width: "min(100%, 24rem)" }}>
          <div className="doc-row doc-between">
            <Label>Opacity</Label>
            <span className="doc-value">{v.join(" – ")}%</span>
          </div>
          <Slider value={v} onValueChange={setV} max={100} step={Number(p.step)} disabled={Boolean(p.disabled)} />
        </div>
      );
    },
    code: (p) =>
      `import { Slider } from "rapui";

<Slider defaultValue={${p.mode === "range" ? "[20, 70]" : "[40]"}} max={100}${p.step !== 1 ? ` step={${p.step}}` : ""}${
        p.disabled ? " disabled" : ""
      } />`,
  },
  {
    slug: "toggle-group",
    name: "Toggle group",
    group: "Forms",
    basedOn: "Radix ToggleGroup",
    description: "Segmented control: a row of options on one track, 2px apart. Single choice or a set of toggles.",
    controls: toggleControls,
    Demo: ({ p }) => {
      const common = { size: p.size as "sm" | "md" | "lg", disabled: Boolean(p.disabled) };
      const items = ["Day", "Week", "Month", "Year"].map((d) => (
        <ToggleGroupItem key={d} value={d.toLowerCase()}>
          {d}
        </ToggleGroupItem>
      ));
      return p.type === "multiple" ? (
        <ToggleGroup type="multiple" defaultValue={["week", "month"]} {...common}>
          {items}
        </ToggleGroup>
      ) : (
        <ToggleGroup type="single" defaultValue="week" {...common}>
          {items}
        </ToggleGroup>
      );
    },
    code: (p) =>
      `import { ToggleGroup, ToggleGroupItem } from "rapui";

<ToggleGroup type="${p.type}" defaultValue=${p.type === "multiple" ? '{["week"]}' : '"week"'}${attrs(p, toggleControls, ["type"])}>
  <ToggleGroupItem value="day">Day</ToggleGroupItem>
  <ToggleGroupItem value="week">Week</ToggleGroupItem>
  <ToggleGroupItem value="month">Month</ToggleGroupItem>
</ToggleGroup>`,
  },
];
