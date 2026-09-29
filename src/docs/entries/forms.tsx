import { useState } from "react";
import { addDays, startOfDay } from "date-fns";
import { AtSign, Bold, Grid3x3, Link2, Search, Strikethrough, Underline } from "lucide-react";
import {
  Button,
  ButtonGroup,
  Calendar,
  Checkbox,
  Combobox,
  DatePicker,
  FieldGroup,
  FormField,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  NumberField,
  RadioGroup,
  RadioGroupItem,
  REGEXP_ONLY_DIGITS,
  Textarea,
  Toggle,
  type DateRange,
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
  { type: "text", prop: "placeholder", default: "you@studio.com", codeDefault: null },
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

/* ═════════════════════════════════════════════════════
   Additional form controls
   ═════════════════════════════════════════════════════ */

type Size = "sm" | "md" | "lg";

/* ── Textarea ──────────────────────────────────────── */
const textareaControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "text", prop: "placeholder", default: "What is this project about?", codeDefault: null },
  { type: "number", prop: "rows", min: 2, max: 8, step: 1, default: 3 },
  { type: "boolean", prop: "autoGrow", default: true, codeDefault: false },
  { type: "boolean", prop: "invalid", default: false },
  { type: "boolean", prop: "disabled", default: false },
];

/* ── RadioGroup ────────────────────────────────────── */
const radioControls: Control[] = [
  { type: "select", prop: "variant", options: ["default", "card"], default: "default" },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "select", prop: "orientation", options: ["vertical", "horizontal"], default: "vertical" },
  { type: "boolean", prop: "disabled", default: false },
];

const EXPORT_FORMATS = [
  { value: "png", label: "PNG", description: "Raster, transparent background" },
  { value: "svg", label: "SVG", description: "Vector, editable in Figma" },
  { value: "pdf", label: "PDF", description: "Print-ready, fonts embedded" },
];

/* ── Toggle ────────────────────────────────────────── */
const toggleSingleControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "select", prop: "variant", options: ["default", "ghost"], default: "default" },
  { type: "select", prop: "content", options: ["icon", "text", "icon + text"], default: "icon + text" },
  { type: "boolean", prop: "disabled", default: false },
];

/* ── InputOTP ──────────────────────────────────────── */
const otpControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "select", prop: "length", options: ["4", "6"], default: "6" },
  { type: "boolean", prop: "separator", default: true },
  { type: "boolean", prop: "invalid", default: false },
  { type: "boolean", prop: "disabled", default: false },
];

/* ── Combobox ──────────────────────────────────────── */
const comboControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "text", prop: "placeholder", default: "Choose a typeface", codeDefault: null },
  { type: "text", prop: "searchPlaceholder", default: "Search fonts…", codeDefault: null },
  { type: "boolean", prop: "invalid", default: false },
  { type: "boolean", prop: "disabled", default: false },
];

const TYPEFACES = [
  { value: "onest", label: "Onest", keywords: ["sans", "google"] },
  { value: "geist", label: "Geist", keywords: ["sans", "vercel"] },
  { value: "inter", label: "Inter", keywords: ["sans"] },
  { value: "neue-montreal", label: "Neue Montreal", keywords: ["pangram", "sans"] },
  { value: "gt-america", label: "GT America", keywords: ["grilli", "sans"] },
  { value: "suisse-intl", label: "Suisse Int’l", keywords: ["swiss typefaces", "sans"] },
  { value: "helvetica-now", label: "Helvetica Now", keywords: ["monotype", "sans"] },
  { value: "canela", label: "Canela", keywords: ["commercial", "serif"] },
  { value: "editorial-new", label: "Editorial New", keywords: ["pangram", "serif"] },
  { value: "gt-sectra", label: "GT Sectra", keywords: ["grilli", "serif"] },
  { value: "geist-mono", label: "Geist Mono", keywords: ["mono", "code"] },
  { value: "jetbrains-mono", label: "JetBrains Mono", keywords: ["mono", "code"] },
];

/* ── Calendar ──────────────────────────────────────── */
const calendarControls: Control[] = [
  { type: "select", prop: "mode", options: ["single", "range", "multiple"], default: "single" },
  { type: "select", prop: "size", options: ["sm", "md"], default: "md" },
  { type: "select", prop: "numberOfMonths", label: "months", options: ["1", "2"], default: "1" },
  { type: "select", prop: "captionLayout", label: "caption", options: ["label", "dropdown"], default: "label" },
  { type: "boolean", prop: "showOutsideDays", default: true },
  { type: "boolean", prop: "disablePast", label: "disable past days", default: false },
];

/* ── DatePicker ────────────────────────────────────── */
const datePickerControls: Control[] = [
  { type: "select", prop: "mode", options: ["single", "range"], default: "single" },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "select", prop: "format", options: ["d MMM yyyy", "EEE, d MMMM", "dd.MM.yyyy", "yyyy-MM-dd"], default: "d MMM yyyy" },
  { type: "boolean", prop: "invalid", default: false },
  { type: "boolean", prop: "disabled", default: false },
];

/* ── FormField ─────────────────────────────────────── */
const formFieldControls: Control[] = [
  { type: "select", prop: "control", options: ["input", "select", "textarea", "number"], default: "input" },
  { type: "text", prop: "label", default: "Project name" },
  { type: "text", prop: "hint", default: "Shown in the dashboard and the browser tab." },
  { type: "text", prop: "error", default: "" },
  { type: "boolean", prop: "required", default: true },
];

/* ── NumberField ───────────────────────────────────── */
const numberControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "number", prop: "min", min: 0, max: 50, step: 1, default: 0 },
  { type: "number", prop: "max", min: 60, max: 400, step: 10, default: 200 },
  { type: "number", prop: "step", min: 1, max: 20, step: 1, default: 4 },
  { type: "text", prop: "unit", default: "px", codeDefault: null },
  { type: "boolean", prop: "invalid", default: false },
  { type: "boolean", prop: "disabled", default: false },
];

const today = () => startOfDay(new Date());

function CreateProjectForm() {
  const [name, setName] = useState("Autumn lookbook");
  const [brief, setBrief] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted && name.trim() === "" ? "Give the project a name." : undefined;
  return (
    <form
      className="doc-stack"
      style={{ width: "min(100%, 34rem)", gap: 24 }}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <FieldGroup legend="Create project" description="You can change all of this later in project settings.">
        <FormField label="Project name" required error={nameError}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Autumn lookbook" />
        </FormField>
        <FieldGroup columns={2}>
          <FormField label="Workspace" htmlFor="cp-workspace">
            <Select defaultValue="studio">
              <SelectTrigger id="cp-workspace">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">North Studio</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="clients">Client work</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Launch date" optional>
            <DatePicker placeholder="Not scheduled" style={{ width: "100%" }} />
          </FormField>
        </FieldGroup>
        <FormField label="Brief" optional hint="A few lines for collaborators." aside={`${brief.length}/280`}>
          <Textarea autoGrow maxLength={280} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Seasonal campaign, 12 spreads, print and web" />
        </FormField>
        <FormField label="Start from">
          <RadioGroup variant="card" defaultValue="blank" orientation="horizontal">
            <RadioGroupItem value="blank" label="Blank canvas" description="An empty 1440 px page" />
            <RadioGroupItem value="template" label="Template" description="Pick from 40 layouts" />
          </RadioGroup>
        </FormField>
        <div className="doc-row">
          <Checkbox id="cp-private" defaultChecked />
          <Label htmlFor="cp-private">Only people I invite can see it</Label>
        </div>
      </FieldGroup>
      <ButtonGroup>
        <Button type="submit" variant="blue">
          Create project
        </Button>
        <Button type="button" variant="soft" onClick={() => setSubmitted(false)}>
          Cancel
        </Button>
      </ButtonGroup>
    </form>
  );
}

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
  {
    slug: "textarea",
    name: "Textarea",
    group: "Forms",
    description: "Filled multi-line field with 20px corners. With autoGrow it grows with the text instead of scrolling.",
    controls: textareaControls,
    Demo: ({ p }) => {
      const [v, setV] = useState("");
      return (
        <div className="doc-stack" style={{ width: "min(100%, 26rem)", gap: 6 }}>
          <div className="doc-row doc-between">
            <Label htmlFor="doc-ta">Project description</Label>
            <span className="doc-muted" style={{ fontSize: "0.8125rem" }}>
              {v.length}/400
            </span>
          </div>
          <Textarea
            id="doc-ta"
            size={p.size as Size}
            rows={Number(p.rows)}
            maxLength={400}
            value={v}
            onChange={(e) => setV(e.target.value)}
            placeholder={String(p.placeholder)}
            autoGrow={Boolean(p.autoGrow)}
            invalid={Boolean(p.invalid)}
            disabled={Boolean(p.disabled)}
          />
        </div>
      );
    },
    code: (p) =>
      `import { Label, Textarea } from "rapui";

<Label htmlFor="about">Project description</Label>
<Textarea id="about"${attrs(p, textareaControls)} />`,
    examples: [
      {
        title: "Comment box",
        Demo: () => (
          <div className="doc-stack" style={{ width: "min(100%, 26rem)", gap: 6 }}>
            <Textarea size="sm" autoGrow rows={2} placeholder="Leave a note for the team…" defaultValue="Can we try the headline in 500 weight? It feels a bit loud next to the cover image." />
            <div className="doc-row" style={{ justifyContent: "flex-end", gap: 2 }}>
              <Button size="sm" variant="soft">Cancel</Button>
              <Button size="sm" variant="blue">Comment</Button>
            </div>
          </div>
        ),
        code: `<Textarea size="sm" autoGrow rows={2} placeholder="Leave a note for the team…" />`,
      },
    ],
  },
  {
    slug: "radio-group",
    name: "Radio group",
    group: "Forms",
    basedOn: "Radix RadioGroup",
    description: "Pick exactly one option. Round dots that fill blue, or filled cards with a title and a line of detail.",
    controls: radioControls,
    Demo: ({ p }) => {
      const common = {
        defaultValue: "svg",
        size: p.size as Size,
        disabled: Boolean(p.disabled),
        orientation: p.orientation as "vertical" | "horizontal",
        "aria-label": "Export format",
      };
      if (p.variant === "card") {
        return (
          <RadioGroup variant="card" {...common} style={{ width: p.orientation === "horizontal" ? "min(100%, 40rem)" : "min(100%, 22rem)" }}>
            {EXPORT_FORMATS.map((f) => (
              <RadioGroupItem key={f.value} value={f.value} label={f.label} description={f.description} />
            ))}
          </RadioGroup>
        );
      }
      return (
        <RadioGroup {...common}>
          {EXPORT_FORMATS.map((f) => (
            <div className="doc-row" key={f.value} style={{ gap: 10 }}>
              <RadioGroupItem value={f.value} id={`doc-rg-${f.value}`} />
              <Label htmlFor={`doc-rg-${f.value}`}>{f.label}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    },
    code: (p) =>
      p.variant === "card"
        ? `import { RadioGroup, RadioGroupItem } from "rapui";

<RadioGroup variant="card" defaultValue="svg"${attrs(p, radioControls, ["variant"])}>
  <RadioGroupItem value="png" label="PNG" description="Raster, transparent background" />
  <RadioGroupItem value="svg" label="SVG" description="Vector, editable in Figma" />
  <RadioGroupItem value="pdf" label="PDF" description="Print-ready, fonts embedded" />
</RadioGroup>`
        : `import { Label, RadioGroup, RadioGroupItem } from "rapui";

<RadioGroup defaultValue="svg"${attrs(p, radioControls, ["variant"])}>
  <div>
    <RadioGroupItem value="png" id="png" />
    <Label htmlFor="png">PNG</Label>
  </div>
  <div>
    <RadioGroupItem value="svg" id="svg" />
    <Label htmlFor="svg">SVG</Label>
  </div>
</RadioGroup>`,
    examples: [
      {
        title: "Plan picker",
        Demo: () => (
          <RadioGroup variant="card" defaultValue="studio" orientation="horizontal" aria-label="Plan" style={{ width: "min(100%, 44rem)" }}>
            <RadioGroupItem value="solo" label="Solo · $12/mo" description="One editor, 5 live projects, custom domain" />
            <RadioGroupItem value="studio" label="Studio · $48/mo" description="Up to 8 editors, unlimited projects, shared fonts" />
            <RadioGroupItem value="agency" label="Agency · Talk to us" description="Client workspaces, SSO, invoices per client" />
          </RadioGroup>
        ),
        code: `<RadioGroup variant="card" defaultValue="studio" orientation="horizontal">
  <RadioGroupItem value="solo" label="Solo · $12/mo" description="One editor, 5 live projects, custom domain" />
  <RadioGroupItem value="studio" label="Studio · $48/mo" description="Up to 8 editors, unlimited projects, shared fonts" />
  <RadioGroupItem value="agency" label="Agency · Talk to us" description="Client workspaces, SSO, invoices per client" />
</RadioGroup>`,
      },
    ],
  },
  {
    slug: "toggle",
    name: "Toggle",
    group: "Forms",
    basedOn: "Radix Toggle",
    description: "A single on/off pill button. Turns ink when it is on. For a set of options on one track, use Toggle group.",
    controls: toggleSingleControls,
    Demo: ({ p }) => {
      const icon = p.content !== "text";
      const text = p.content !== "icon";
      return (
        <Toggle
          size={p.size as Size}
          variant={p.variant as "default" | "ghost"}
          disabled={Boolean(p.disabled)}
          defaultPressed
          aria-label="Snap to grid"
        >
          {icon && <Grid3x3 />}
          {text && "Snap to grid"}
        </Toggle>
      );
    },
    code: (p) =>
      `import { Toggle } from "rapui";

<Toggle defaultPressed${attrs(p, toggleSingleControls, ["content"])} aria-label="Snap to grid">
  ${[p.content !== "text" ? "<Grid3x3 />" : "", p.content !== "icon" ? "Snap to grid" : ""].filter(Boolean).join("\n  ")}
</Toggle>`,
    examples: [
      {
        title: "Text formatting",
        Demo: () => (
          <div className="doc-row" style={{ gap: 2 }}>
            <Toggle size="sm" aria-label="Bold" defaultPressed>
              <Bold />
            </Toggle>
            <Toggle size="sm" aria-label="Underline">
              <Underline />
            </Toggle>
            <Toggle size="sm" aria-label="Strikethrough">
              <Strikethrough />
            </Toggle>
            <Toggle size="sm" aria-label="Link">
              <Link2 />
            </Toggle>
          </div>
        ),
        code: `<Toggle size="sm" aria-label="Bold"><Bold /></Toggle>
<Toggle size="sm" aria-label="Underline"><Underline /></Toggle>
<Toggle size="sm" aria-label="Strikethrough"><Strikethrough /></Toggle>`,
      },
    ],
  },
  {
    slug: "input-otp",
    name: "Input OTP",
    group: "Forms",
    basedOn: "input-otp",
    description: "One-time code entry in separate cells. It is a single real input underneath, so paste and SMS autofill work.",
    controls: otpControls,
    Demo: ({ p }) => {
      const len = Number(p.length);
      const half = len / 2;
      const [v, setV] = useState("");
      const slots = (from: number, to: number) =>
        Array.from({ length: to - from }, (_, i) => <InputOTPSlot key={from + i} index={from + i} />);
      return (
        <div className="doc-stack" style={{ gap: 10 }}>
          <Label htmlFor="doc-otp">Enter the code we sent to anna@northstudio.com</Label>
          <InputOTP
            key={len}
            id="doc-otp"
            maxLength={len}
            value={v}
            onChange={setV}
            pattern={REGEXP_ONLY_DIGITS}
            size={p.size as Size}
            invalid={Boolean(p.invalid)}
            disabled={Boolean(p.disabled)}
          >
            {p.separator ? (
              <>
                <InputOTPGroup>{slots(0, half)}</InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>{slots(half, len)}</InputOTPGroup>
              </>
            ) : (
              <InputOTPGroup>{slots(0, len)}</InputOTPGroup>
            )}
          </InputOTP>
          <span className="doc-muted" style={{ fontSize: "0.8125rem" }}>
            {v.length === len ? "Checking…" : "Didn’t get it? Resend in 0:42"}
          </span>
        </div>
      );
    },
    code: (p) => {
      const len = Number(p.length);
      const half = len / 2;
      const slot = (i: number) => `    <InputOTPSlot index={${i}} />`;
      const group = (a: number, b: number) =>
        `  <InputOTPGroup>\n${Array.from({ length: b - a }, (_, i) => slot(a + i)).join("\n")}\n  </InputOTPGroup>`;
      return `import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, REGEXP_ONLY_DIGITS } from "rapui";

<InputOTP maxLength={${len}} pattern={REGEXP_ONLY_DIGITS}${attrs(p, otpControls, ["length", "separator"])}>
${p.separator ? `${group(0, half)}\n  <InputOTPSeparator />\n${group(half, len)}` : group(0, len)}
</InputOTP>`;
    },
  },
  {
    slug: "combobox",
    name: "Combobox",
    group: "Forms",
    basedOn: "Radix Popover + cmdk",
    description: "A select you can type into. Use it when the list is long enough that scrolling gets tedious — fonts, clients, countries.",
    controls: comboControls,
    Demo: ({ p }) => {
      const [v, setV] = useState("neue-montreal");
      return (
        <div className="doc-stack" style={{ width: "min(100%, 18rem)", gap: 6 }}>
          <Label htmlFor="doc-combo">Heading font</Label>
          <Combobox
            id="doc-combo"
            options={TYPEFACES}
            value={v}
            onValueChange={setV}
            size={p.size as Size}
            placeholder={String(p.placeholder)}
            searchPlaceholder={String(p.searchPlaceholder)}
            emptyText="No typeface with that name."
            invalid={Boolean(p.invalid)}
            disabled={Boolean(p.disabled)}
          />
        </div>
      );
    },
    code: (p) =>
      `import { Combobox } from "rapui";

const fonts = [
  { value: "onest", label: "Onest" },
  { value: "neue-montreal", label: "Neue Montreal", keywords: ["pangram"] },
  { value: "editorial-new", label: "Editorial New" },
];

<Combobox
  options={fonts}
  value={font}
  onValueChange={setFont}
  emptyText="No typeface with that name."
 ${attrs(p, comboControls)}
/>`,
  },
  {
    slug: "calendar",
    name: "Calendar",
    group: "Forms",
    basedOn: "react-day-picker",
    description: "Month grid with round day cells. Select one day, a range or several days; every DayPicker prop is passed through.",
    controls: calendarControls,
    Demo: ({ p }) => {
      const t = today();
      const [single, setSingle] = useState<Date | undefined>(addDays(t, 3));
      const [range, setRange] = useState<DateRange | undefined>({ from: addDays(t, 2), to: addDays(t, 9) });
      const [multi, setMulti] = useState<Date[] | undefined>([addDays(t, 1), addDays(t, 4), addDays(t, 8)]);
      const common = {
        size: p.size as "sm" | "md",
        numberOfMonths: Number(p.numberOfMonths),
        showOutsideDays: Boolean(p.showOutsideDays),
        captionLayout: p.captionLayout as "label" | "dropdown",
        startMonth: new Date(t.getFullYear() - 5, 0),
        endMonth: new Date(t.getFullYear() + 5, 11),
        disabled: p.disablePast ? { before: t } : undefined,
      };
      const cal =
        p.mode === "range" ? (
          <Calendar mode="range" selected={range} onSelect={setRange} {...common} />
        ) : p.mode === "multiple" ? (
          <Calendar mode="multiple" selected={multi} onSelect={setMulti} {...common} />
        ) : (
          <Calendar mode="single" selected={single} onSelect={setSingle} {...common} />
        );
      return cal;
    },
    code: (p) => {
      const sel = p.mode === "range" ? "range" : p.mode === "multiple" ? "days" : "date";
      const extra = [
        p.size !== "md" ? ` size="${p.size}"` : "",
        p.numberOfMonths !== "1" ? ` numberOfMonths={${p.numberOfMonths}}` : "",
        p.captionLayout !== "label" ? ` captionLayout="${p.captionLayout}"` : "",
        !p.showOutsideDays ? " showOutsideDays={false}" : "",
        p.disablePast ? " disabled={{ before: new Date() }}" : "",
      ].join("");
      return `import { Calendar } from "rapui";

<Calendar mode="${p.mode}" selected={${sel}} onSelect={set${sel[0].toUpperCase()}${sel.slice(1)}}${extra} />`;
    },
  },
  {
    slug: "date-picker",
    name: "Date picker",
    group: "Forms",
    basedOn: "Radix Popover + react-day-picker",
    description: "A pill that opens a Calendar. Shows the chosen date with date-fns formatting; the range mode shows two months.",
    controls: datePickerControls,
    Demo: ({ p }) => {
      const common = {
        size: p.size as Size,
        format: String(p.format),
        invalid: Boolean(p.invalid),
        disabled: Boolean(p.disabled),
      };
      return (
        <div className="doc-stack" style={{ gap: 6 }}>
          <Label>{p.mode === "range" ? "Campaign runs" : "Publish on"}</Label>
          {p.mode === "range" ? (
            <DatePicker key="range" mode="range" defaultValue={{ from: addDays(today(), 7), to: addDays(today(), 20) }} {...common} />
          ) : (
            <DatePicker key="single" defaultValue={addDays(today(), 7)} {...common} />
          )}
        </div>
      );
    },
    code: (p) =>
      `import { DatePicker } from "rapui";

${
        p.mode === "range"
          ? `<DatePicker mode="range" value={range} onValueChange={setRange}`
          : `<DatePicker value={date} onValueChange={setDate}`
      }${attrs(p, datePickerControls, ["mode"])} />`,
    examples: [
      {
        title: "With presets",
        Demo: function Presets() {
          const [d, setD] = useState<Date | undefined>();
          const [open, setOpen] = useState(false);
          const pick = (n: number) => {
            setD(addDays(today(), n));
            setOpen(false);
          };
          return (
            <DatePicker
              value={d}
              onValueChange={setD}
              open={open}
              onOpenChange={setOpen}
              placeholder="Schedule publish"
              calendarProps={{ disabled: { before: today() } }}
              footer={
                <>
                  <Button size="sm" variant="soft" onClick={() => pick(0)}>Today</Button>
                  <Button size="sm" variant="soft" onClick={() => pick(1)}>Tomorrow</Button>
                  <Button size="sm" variant="soft" onClick={() => pick(7)}>In a week</Button>
                </>
              }
            />
          );
        },
        code: `<DatePicker
  value={date}
  onValueChange={setDate}
  calendarProps={{ disabled: { before: new Date() } }}
  footer={<Button size="sm" variant="soft" onClick={() => setDate(new Date())}>Today</Button>}
/>`,
      },
    ],
  },
  {
    slug: "form-field",
    name: "Form field",
    group: "Forms",
    description:
      "Label, control, hint and error in one stack, 6px apart. Wires id, aria-describedby and aria-invalid onto the control. FieldGroup stacks fields under a legend.",
    controls: formFieldControls,
    Demo: ({ p }) => {
      const err = String(p.error) || undefined;
      const common = { label: String(p.label), hint: String(p.hint) || undefined, error: err, required: Boolean(p.required) };
      let control;
      if (p.control === "select")
        control = (
          <FormField {...common} htmlFor="doc-ff-select">
            <Select defaultValue="web">
              <SelectTrigger id="doc-ff-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web">Website</SelectItem>
                <SelectItem value="deck">Pitch deck</SelectItem>
                <SelectItem value="longread">Longread</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        );
      else if (p.control === "textarea")
        control = (
          <FormField {...common}>
            <Textarea autoGrow placeholder="Seasonal campaign, 12 spreads" />
          </FormField>
        );
      else if (p.control === "number")
        control = (
          <FormField {...common}>
            <NumberField defaultValue={12} min={1} max={48} unit="columns" />
          </FormField>
        );
      else
        control = (
          <FormField {...common}>
            <Input defaultValue="Autumn lookbook" />
          </FormField>
        );
      return <div style={{ width: "min(100%, 24rem)" }}>{control}</div>;
    },
    code: (p) =>
      `import { FormField, Input } from "rapui";

<FormField label="${p.label}"${p.hint ? ` hint="${p.hint}"` : ""}${p.error ? ` error="${p.error}"` : ""}${p.required ? " required" : ""}>
  ${
    p.control === "select"
      ? "<Select>…</Select>"
      : p.control === "textarea"
        ? "<Textarea autoGrow />"
        : p.control === "number"
          ? '<NumberField defaultValue={12} min={1} max={48} unit="columns" />'
          : '<Input defaultValue="Autumn lookbook" />'
  }
</FormField>`,
    examples: [
      {
        title: "Create project",
        Demo: CreateProjectForm,
        code: `<FieldGroup legend="Create project" description="You can change all of this later in project settings.">
  <FormField label="Project name" required error={nameError}>
    <Input value={name} onChange={(e) => setName(e.target.value)} />
  </FormField>
  <FieldGroup columns={2}>
    <FormField label="Workspace" htmlFor="workspace">
      <Select defaultValue="studio">
        <SelectTrigger id="workspace"><SelectValue /></SelectTrigger>
        <SelectContent>…</SelectContent>
      </Select>
    </FormField>
    <FormField label="Launch date" optional>
      <DatePicker placeholder="Not scheduled" />
    </FormField>
  </FieldGroup>
  <FormField label="Brief" optional hint="A few lines for collaborators." aside={\`\${brief.length}/280\`}>
    <Textarea autoGrow maxLength={280} />
  </FormField>
  <FormField label="Start from">
    <RadioGroup variant="card" defaultValue="blank" orientation="horizontal">
      <RadioGroupItem value="blank" label="Blank canvas" description="An empty 1440 px page" />
      <RadioGroupItem value="template" label="Template" description="Pick from 40 layouts" />
    </RadioGroup>
  </FormField>
</FieldGroup>
<ButtonGroup>
  <Button type="submit" variant="blue">Create project</Button>
  <Button variant="soft">Cancel</Button>
</ButtonGroup>`,
      },
    ],
  },
  {
    slug: "number-field",
    name: "Number field",
    group: "Forms",
    description:
      "Number stepper: a pill with round − and + buttons 2px inside the ends. Arrow keys step, Shift steps by ten, Home and End jump to the limits.",
    controls: numberControls,
    Demo: ({ p }) => {
      const [v, setV] = useState<number | null>(24);
      return (
        <div className="doc-stack" style={{ gap: 6 }}>
          <Label htmlFor="doc-nf">Grid gutter</Label>
          <NumberField
            id="doc-nf"
            value={v}
            onValueChange={setV}
            size={p.size as Size}
            min={Number(p.min)}
            max={Number(p.max)}
            step={Number(p.step)}
            unit={String(p.unit) || undefined}
            invalid={Boolean(p.invalid)}
            disabled={Boolean(p.disabled)}
          />
        </div>
      );
    },
    code: (p) =>
      `import { NumberField } from "rapui";

<NumberField defaultValue={24}${attrs(p, numberControls, ["min", "max", "step"])} min={${p.min}} max={${p.max}} step={${p.step}} />`,
    examples: [
      {
        title: "Artboard size",
        Demo: () => (
          <div className="doc-row" style={{ gap: 2 }}>
            <NumberField size="sm" defaultValue={1440} min={320} max={3840} step={8} unit="W" style={{ maxWidth: "10rem" }} aria-label="Width" />
            <NumberField size="sm" defaultValue={900} min={320} max={2160} step={8} unit="H" style={{ maxWidth: "10rem" }} aria-label="Height" />
          </div>
        ),
        code: `<NumberField size="sm" defaultValue={1440} min={320} max={3840} step={8} unit="W" aria-label="Width" />
<NumberField size="sm" defaultValue={900} min={320} max={2160} step={8} unit="H" aria-label="Height" />`,
      },
    ],
  },
];
