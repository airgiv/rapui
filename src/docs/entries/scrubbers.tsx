import { useState } from "react";
import { RangeDial, TimeScrubber } from "../../rapui";
import {
  DateScrubber,
  ElasticSlider,
  HueRing,
  Knob,
  LensRuler,
  ScrubNumber,
  SplitSlider,
  TempoDial,
  TimeWheel,
  WheelPicker,
  hueName,
} from "../../rapui/groups/scrubbers";
import { DialsDemo } from "../../site/demos/DialsDemo";
import { Eye, Moon, RefreshCw, Sun, Volume1, Volume2 } from "../../rapui/icons";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* a paper ground inside the white stage, for demos drawn on the page colour */
const GROUND = "grid place-items-center w-full min-h-80 p-6 rounded-[calc(var(--rap-radius)-8px)] bg-paper";

const dialControls: Control[] = [
  { type: "select", prop: "snap", options: ["5", "15", "30", "60"], default: "15" },
  { type: "number", prop: "density", min: 24, max: 96, step: 4, default: 48 },
  { type: "number", prop: "reach", min: 44, max: 66, default: 56 },
];

const timeControls: Control[] = [
  { type: "select", prop: "step", options: ["1", "5", "15", "30", "60"], default: "15" },
  { type: "number", prop: "momentum", label: "fling carry", min: 0, max: 100, default: 50 },
  { type: "select", prop: "format", options: ["12h", "24h"], default: "12h" },
  { type: "number", prop: "corner", min: 0, max: 40, default: 20 },
];

/* ── Knob, WheelPicker, ElasticSlider, ScrubNumber ─────────────── */

const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  padding: "1.25rem 1.5rem",
  borderRadius: "var(--rap-radius)",
  background: "var(--rap-surface)",
};
const caption: React.CSSProperties = { fontSize: "0.8125rem", fontWeight: 500, letterSpacing: "-0.01em", color: "var(--rap-mute)" };
const db = (v: number) => (v > 0 ? `+${v}` : String(v));
const panFmt = (v: number) => (v === 0 ? "C" : v < 0 ? `L${-v}` : `R${v}`);

const knobControls: Control[] = [
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
  { type: "text", prop: "label", default: "Drive", codeDefault: "" },
  { type: "number", prop: "defaultValue", label: "start value", min: 0, max: 100, default: 40, codeDefault: null },
  { type: "number", prop: "min", min: -100, max: 0, default: 0 },
  { type: "number", prop: "max", min: 1, max: 200, default: 100 },
  { type: "number", prop: "step", min: 0.5, max: 25, step: 0.5, default: 5, codeDefault: 1 },
];

function MixerDemo() {
  return (
    <div style={card}>
      <div className="doc-between doc-row">
        <span style={{ fontWeight: 500 }}>Channel 3 · Vox</span>
        <span style={caption}>dB</span>
      </div>
      <div className="doc-row" style={{ gap: "1.25rem", alignItems: "flex-end" }}>
        <Knob size="lg" label="Gain" min={-24} max={24} step={0.5} defaultValue={3.5} format={db} />
        <Knob label="Low" min={-12} max={12} defaultValue={-2} format={db} />
        <Knob label="Mid" min={-12} max={12} defaultValue={0} format={db} />
        <Knob label="High" min={-12} max={12} defaultValue={4} format={db} />
        <Knob size="sm" label="Pan" min={-50} max={50} step={5} defaultValue={-15} format={panFmt} />
      </div>
    </div>
  );
}

function KnobPairDemo() {
  const [v, setV] = useState(64);
  return (
    <div className="doc-row" style={{ gap: "1.5rem" }}>
      <Knob label="Reverb mix" value={v} onValueChange={setV} format={(x) => `${x}%`} />
      <ScrubNumber label="Mix" unit="%" min={0} max={100} value={v} onValueChange={setV} />
    </div>
  );
}

const typefaces = ["Onest", "Geist", "Inter", "Söhne", "Graphik", "Neue Montreal", "Favorit", "Suisse Int'l", "GT America", "Aeonik"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weights = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];
const wheelSets: Record<string, readonly (string | { value: string; label: string })[]> = { typefaces, months, weights };

const wheelControls: Control[] = [
  { type: "select", prop: "options", options: ["typefaces", "months", "weights"], default: "typefaces", codeDefault: null },
  { type: "select", prop: "visible", options: ["3", "5", "7"], default: "5" },
  { type: "boolean", prop: "loop", default: false },
  { type: "select", prop: "align", options: ["center", "start", "end"], default: "center" },
];

function WheelDemo({ p }: { p: Record<string, string | number | boolean> }) {
  const set = wheelSets[String(p.options)] ?? typefaces;
  const [v, setV] = useState<string | undefined>(undefined);
  const first = typeof set[0] === "string" ? set[0] : set[0].value;
  return (
    <div style={{ ...card, alignItems: "center", padding: "1rem 1.5rem" }}>
      <WheelPicker
        key={String(p.options)}
        aria-label="Typeface"
        options={set}
        defaultValue={first}
        onValueChange={setV}
        visible={Number(p.visible)}
        loop={Boolean(p.loop)}
        align={p.align as "center" | "start" | "end"}
      />
      <span style={caption}>{v ? `Picked: ${v}` : "Drag, fling, scroll or use ↑ ↓"}</span>
    </div>
  );
}

function AlarmDemo() {
  const [t, setT] = useState("06:45");
  const [h, m] = t.split(":").map(Number);
  return (
    <div style={{ ...card, alignItems: "center" }}>
      <div className="doc-between doc-row" style={{ width: "100%" }}>
        <span style={{ fontWeight: 500 }}>Wake up</span>
        <span style={caption}>
          Rings at {h % 12 || 12}:{String(m).padStart(2, "0")} {h < 12 ? "AM" : "PM"}
        </span>
      </div>
      <TimeWheel value={t} onValueChange={setT} minuteStep={5} />
    </div>
  );
}

const elasticControls: Control[] = [
  { type: "number", prop: "defaultValue", label: "start value", min: 0, max: 100, default: 60, codeDefault: null },
  { type: "number", prop: "min", min: -100, max: 0, default: 0 },
  { type: "number", prop: "max", min: 1, max: 200, default: 100 },
  { type: "number", prop: "step", min: 1, max: 25, default: 1 },
  { type: "select", prop: "bubble", options: ["always", "active", "never"], default: "always" },
  { type: "boolean", prop: "icons", label: "end icons", default: true, codeDefault: false },
];

function VolumeDemo() {
  const [v, setV] = useState(72);
  return (
    <div style={{ ...card, width: "min(100%, 22rem)" }}>
      <div className="doc-between doc-row">
        <span style={{ fontWeight: 500 }}>Preview volume</span>
        <span style={caption}>{v === 0 ? "Muted" : `${v}%`}</span>
      </div>
      <ElasticSlider aria-label="Preview volume" value={v} onValueChange={setV} icons={[<Volume1 />, <Volume2 />]} bubble="active" />
    </div>
  );
}

const scrubControls: Control[] = [
  { type: "text", prop: "label", default: "W", codeDefault: null },
  { type: "text", prop: "unit", default: "px", codeDefault: "" },
  { type: "number", prop: "defaultValue", label: "start value", min: 0, max: 1000, default: 240, codeDefault: 0 },
  { type: "number", prop: "min", min: -1000, max: 0, default: 0, codeDefault: null },
  { type: "number", prop: "max", min: 1, max: 4000, default: 1440, codeDefault: null },
  { type: "select", prop: "step", options: ["1", "0.5", "0.1", "5"], default: "1" },
  { type: "select", prop: "size", options: ["sm", "md", "lg"], default: "md" },
];

function InspectorDemo() {
  /* one grid, 2px joints: related controls sit edge to edge */
  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--rap-gap-tight)" };
  return (
    <div style={{ ...card, width: "min(100%, 20rem)", gap: "0.75rem" }}>
      <span style={caption}>Frame · Hero card</span>
      <div style={grid}>
        <ScrubNumber size="sm" label="X" defaultValue={120} />
        <ScrubNumber size="sm" label="Y" defaultValue={48} />
        <ScrubNumber size="sm" label="W" min={1} max={4000} defaultValue={360} />
        <ScrubNumber size="sm" label="H" min={1} max={4000} defaultValue={240} />
        <ScrubNumber size="sm" label={<RefreshCw />} aria-label="Rotation" unit="°" min={-180} max={180} step={0.5} defaultValue={0} />
        <ScrubNumber size="sm" label={<Eye />} aria-label="Opacity" unit="%" min={0} max={100} defaultValue={100} />
      </div>
    </div>
  );
}


/* ── DateScrubber, TempoDial, HueRing, LensRuler, SplitSlider ─────── */

const dateControls: Control[] = [
  { type: "number", prop: "momentum", label: "fling carry", min: 0, max: 100, default: 50 },
  { type: "boolean", prop: "relative", default: true },
  { type: "boolean", prop: "bounded", label: "next 60 days only", default: false, codeDefault: null },
];

const isoIn = (days: number) => {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate() + days)).toISOString().slice(0, 10);
};

function BookingDemo() {
  const [d, setD] = useState(() => isoIn(3));
  return (
    <div style={{ ...card, width: "min(100%, 34rem)" }}>
      <div className="doc-between doc-row">
        <span style={{ fontWeight: 500 }}>Studio booking</span>
        <span style={caption}>{d}</span>
      </div>
      <DateScrubber aria-label="Booking date" value={d} onValueChange={setD} min={isoIn(0)} max={isoIn(90)} relative={false} />
    </div>
  );
}

const tempoControls: Control[] = [
  { type: "number", prop: "defaultValue", label: "start bpm", min: 40, max: 220, default: 96, codeDefault: 96 },
  { type: "number", prop: "size", min: 160, max: 320, step: 8, default: 220 },
  { type: "select", prop: "beats", options: ["3", "4", "6"], default: "4" },
  { type: "boolean", prop: "playing", default: true },
  { type: "boolean", prop: "tap", label: "tap pill", default: true },
];

const hueControls: Control[] = [
  { type: "number", prop: "defaultValue", label: "start hue", min: 0, max: 359, default: 60, codeDefault: 60 },
  { type: "number", prop: "size", min: 160, max: 320, step: 8, default: 220 },
  { type: "select", prop: "ticks", options: ["36", "48", "72", "96"], default: "72" },
  { type: "number", prop: "lightness", min: 0.5, max: 0.9, step: 0.02, default: 0.72 },
  { type: "number", prop: "chroma", min: 0.04, max: 0.22, step: 0.01, default: 0.15 },
];

function ThemeTintDemo() {
  const [h, setH] = useState(262);
  return (
    <div style={{ ...card, width: "min(100%, 30rem)", flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
      <HueRing aria-label="Accent hue" value={h} onValueChange={setH} size={180} step={5} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 0 }}>
        <span style={caption}>Workspace accent</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "var(--rap-control-h)",
            padding: "0 1.25rem",
            borderRadius: "var(--rap-radius-pill)",
            background: `oklch(0.6 0.17 ${h})`,
            color: "var(--rap-paper-2)",
            fontWeight: 500,
          }}
        >
          Publish
        </span>
        <span style={caption}>{hueName(h)}</span>
      </div>
    </div>
  );
}

const lensControls: Control[] = [
  { type: "number", prop: "min", min: 0, max: 20, default: 16 },
  { type: "number", prop: "max", min: 21, max: 40, default: 26 },
  { type: "select", prop: "step", options: ["0.1", "0.5", "1"], default: "0.5" },
  { type: "text", prop: "unit", default: "°", codeDefault: "" },
  { type: "text", prop: "label", default: "Studio", codeDefault: "" },
  { type: "number", prop: "height", min: 200, max: 440, step: 20, default: 300 },
];

function TypeRampDemo() {
  const [s, setS] = useState(32);
  return (
    <div style={{ ...card, width: "min(100%, 30rem)", flexDirection: "row", alignItems: "center", gap: "1.5rem" }}>
      <LensRuler label="Size" unit="px" min={8} max={96} step={1} major={8} value={s} onValueChange={setS} height={320} />
      <span style={{ fontSize: s, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1, minWidth: 0, overflowWrap: "anywhere" }}>Aa</span>
    </div>
  );
}

const splitControls: Control[] = [
  { type: "number", prop: "defaultValue", label: "left share", min: 0, max: 100, default: 60, codeDefault: 60 },
  { type: "text", prop: "left", label: "left label", default: "Deep work", codeDefault: null },
  { type: "text", prop: "right", label: "right label", default: "Meetings", codeDefault: null },
  { type: "select", prop: "step", options: ["1", "5", "10"], default: "1" },
  { type: "number", prop: "ticks", min: 16, max: 72, step: 4, default: 44 },
  { type: "boolean", prop: "centerDetent", label: "sticky 50/50", default: true },
];

export const entries: DocEntry[] = [
  {
    slug: "time-scrubber",
    name: "Time scrubber",
    group: "Scrubbers",
    basedOn: "Bencho, MIT",
    description:
      "A time over a ruler: drag the ruler under the centre mark, fling it and it coasts, then settles on the nearest step. Delight: one spring for the throw and the snap, digits roll through a fading window, and with sound on every step ticks under your thumb, firmer on the hour.",
    controls: timeControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <TimeScrubber
          key={`${p.step}-${p.format}`}
          step={String(p.step)}
          momentum={Number(p.momentum)}
          format={String(p.format)}
          corner={Number(p.corner)}
        />
      </div>
    ),
    code: (p) => `import { TimeScrubber } from "rapui";

<TimeScrubber${attrs(p, timeControls)} />`,
  },
  {
    slug: "range-dial",
    name: "Range dial",
    group: "Scrubbers",
    basedOn: "Bencho, MIT",
    description:
      "A range on a 24-hour dial — bedtime to wake-up — with two handles; the drag picks whichever is nearer. Delight: newly lit ticks draw themselves outward in a wave that starts at your finger, and the handles are liquid: as the window closes they neck and fuse into one drop. With sound on, each snap step clicks, pitched by the hour.",
    controls: dialControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <RangeDial snap={String(p.snap)} density={Number(p.density)} reach={Number(p.reach)} />
      </div>
    ),
    code: (p) => `import { RangeDial } from "rapui";

<RangeDial${attrs(p, dialControls)} />`,
  },
  {
    slug: "knob",
    name: "Knob",
    group: "Scrubbers",
    description:
      "A rotary dial for levels and amounts: drag up or right to turn it up, arrow keys step, Home/End jump to the stops. Delight: every step is a magnetic detent — turn slowly and the dial holds still in the notch, then hurries into the next with a click (firmer at the stops), while the tick ring lights up in flame and the number in the cap rolls.",
    controls: knobControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <Knob
          key={`${p.min}-${p.max}-${p.step}-${p.defaultValue}`}
          size={p.size as "sm" | "md" | "lg"}
          label={String(p.label) || undefined}
          defaultValue={Number(p.defaultValue)}
          min={Number(p.min)}
          max={Number(p.max)}
          step={Number(p.step)}
        />
      </div>
    ),
    code: (p) => `import { Knob } from "rapui";

<Knob${attrs(p, knobControls)} />`,
    examples: [
      {
        title: "Audio mixer",
        Demo: MixerDemo,
        code: `const db = (v: number) => (v > 0 ? \`+\${v}\` : String(v));

<Knob size="lg" label="Gain" min={-24} max={24} step={0.5} defaultValue={3.5} format={db} />
<Knob label="Low" min={-12} max={12} defaultValue={-2} format={db} />
<Knob label="Mid" min={-12} max={12} defaultValue={0} format={db} />
<Knob label="High" min={-12} max={12} defaultValue={4} format={db} />
<Knob size="sm" label="Pan" min={-50} max={50} step={5} defaultValue={-15}
  format={(v) => (v === 0 ? "C" : v < 0 ? \`L\${-v}\` : \`R\${v}\`)} />`,
      },
      {
        title: "Controlled — set it from elsewhere and it swings there on the spring",
        Demo: KnobPairDemo,
        code: `const [mix, setMix] = useState(64);

<Knob label="Reverb mix" value={mix} onValueChange={setMix} format={(v) => \`\${v}%\`} />
<ScrubNumber label="Mix" unit="%" min={0} max={100} value={mix} onValueChange={setMix} />`,
      },
    ],
  },
  {
    slug: "wheel-picker",
    name: "Wheel picker",
    group: "Scrubbers",
    description:
      "An iOS-style drum of options: drag or fling it, scroll it, tap a row, or use ↑ ↓ and type-ahead; it settles with one option in the band. Delight: the rows curve away round a real cylinder, a flick spins it and one spring brings it to rest (with a notch per row passed), and the blue band is a lens — rows change colour exactly as they cross its edge.",
    controls: wheelControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <WheelDemo p={p} />
      </div>
    ),
    code: (p) => {
      const name = String(p.options);
      const decl =
        name === "weights"
          ? `const weights = [{ value: "300", label: "Light" }, { value: "400", label: "Regular" }, …];`
          : name === "months"
            ? `const months = ["January", "February", "March", …];`
            : `const typefaces = ["Onest", "Geist", "Inter", "Söhne", …];`;
      return `import { WheelPicker } from "rapui";

${decl}

<WheelPicker options={${name}}${attrs(p, wheelControls, ["options"]).replace(/visible="(\d)"/, "visible={$1}")} onValueChange={setValue} />`;
    },
    examples: [
      {
        title: "Alarm — TimeWheel (hours, minutes, AM/PM)",
        Demo: AlarmDemo,
        code: `const [time, setTime] = useState("06:45"); // always 24-hour "HH:MM"

<TimeWheel value={time} onValueChange={setTime} minuteStep={5} />`,
      },
      {
        title: "24-hour, quarter hours",
        Demo: () => (
          <div style={{ ...card, padding: "0.75rem" }}>
            <TimeWheel format="24h" minuteStep={15} defaultValue="14:30" visible={3} />
          </div>
        ),
        code: `<TimeWheel format="24h" minuteStep={15} defaultValue="14:30" visible={3} />`,
      },
      {
        title: "Font weight — options with labels",
        Demo: () => (
          <div style={{ ...card, padding: "0.75rem" }}>
            <WheelPicker aria-label="Weight" options={weights} defaultValue="500" align="start" />
          </div>
        ),
        code: `const weights = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];

<WheelPicker aria-label="Weight" options={weights} defaultValue="500" align="start" />`,
      },
    ],
  },
  {
    slug: "elastic-slider",
    name: "Elastic slider",
    group: "Scrubbers",
    description:
      "A slider whose track is a rubber band, with the value on the thumb and optional icons at both ends. Delight: drag past either end and the band stretches after you with growing resistance, thinning as it goes and shoving the end icon aside; let go and it snaps back with a recoil and a drop — and the thumb squashes along its path the faster it moves.",
    controls: elasticControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div style={{ width: "min(100%, 22rem)", paddingTop: "2rem" }}>
          <ElasticSlider
            key={`${p.min}-${p.max}-${p.step}-${p.defaultValue}`}
            aria-label="Canvas brightness"
            defaultValue={Number(p.defaultValue)}
            min={Number(p.min)}
            max={Number(p.max)}
            step={Number(p.step)}
            bubble={p.bubble as "always" | "active" | "never"}
            icons={p.icons ? [<Moon />, <Sun />] : undefined}
          />
        </div>
      </div>
    ),
    code: (p) => `import { ElasticSlider } from "rapui";
import { Moon, Sun } from "rapui/icons";

<ElasticSlider aria-label="Canvas brightness"${attrs(p, elasticControls, ["icons"])}${p.icons ? " icons={[<Moon />, <Sun />]}" : ""} />`,
    examples: [
      {
        title: "Volume, bubble while held",
        Demo: VolumeDemo,
        code: `const [volume, setVolume] = useState(72);

<ElasticSlider aria-label="Preview volume" value={volume} onValueChange={setVolume}
  icons={[<Volume1 />, <Volume2 />]} bubble="active" />`,
      },
      {
        title: "Zoom, in steps of 10%",
        Demo: () => (
          <div style={{ width: "min(100%, 22rem)", paddingTop: "2rem" }}>
            <ElasticSlider aria-label="Zoom" min={10} max={400} step={10} defaultValue={100} format={(v) => `${v}%`} />
          </div>
        ),
        code: `<ElasticSlider aria-label="Zoom" min={10} max={400} step={10} defaultValue={100} format={(v) => \`\${v}%\`} />`,
      },
    ],
  },
  {
    slug: "scrub-number",
    name: "Scrub number",
    group: "Scrubbers",
    description:
      "A design-tool number: press the label and drag sideways to scrub (Shift ×10, Alt ×0.1), click the number to type, arrows step. Delight: the pill leans into the direction you drag on a spring and rights itself when you stop, the digits roll, every step ticks, and it shakes its head at min and max.",
    controls: scrubControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <ScrubNumber
          key={`${p.min}-${p.max}-${p.defaultValue}`}
          label={String(p.label)}
          unit={String(p.unit) || undefined}
          defaultValue={Number(p.defaultValue)}
          min={Number(p.min)}
          max={Number(p.max)}
          step={Number(p.step)}
          size={p.size as "sm" | "md" | "lg"}
        />
      </div>
    ),
    code: (p) => `import { ScrubNumber } from "rapui";

<ScrubNumber${attrs(p, scrubControls).replace(/step="([\d.]+)"/, "step={$1}")} />`,
    examples: [
      {
        title: "Property inspector",
        Demo: InspectorDemo,
        code: `<ScrubNumber size="sm" label="X" defaultValue={120} />
<ScrubNumber size="sm" label="Y" defaultValue={48} />
<ScrubNumber size="sm" label="W" min={1} max={4000} defaultValue={360} />
<ScrubNumber size="sm" label="H" min={1} max={4000} defaultValue={240} />
<ScrubNumber size="sm" label={<RefreshCw />} aria-label="Rotation" unit="°" min={-180} max={180} step={0.5} defaultValue={0} />
<ScrubNumber size="sm" label={<Eye />} aria-label="Opacity" unit="%" min={0} max={100} defaultValue={100} />`,
      },
    ],
  },
  {
    slug: "date-scrubber",
    name: "Date scrubber",
    group: "Scrubbers",
    description:
      "The time scrubber's ruler laid out in days: drag the calendar under the mark, fling it and it coasts to a whole day; ← → step a day, ↑ ↓ a week, PageUp/PageDown a month, Home jumps to today. Delight: weeks and months show as tick lengths and week-ends as a lighter patch of the tape, the day of the month rolls in big figures, and every day crossed clicks — pitched up through the month, firmest on the 1st.",
    controls: dateControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div style={{ ...card, width: "min(100%, 34rem)" }}>
          <DateScrubber
            key={String(p.bounded)}
            momentum={Number(p.momentum)}
            relative={Boolean(p.relative)}
            min={p.bounded ? isoIn(0) : undefined}
            max={p.bounded ? isoIn(60) : undefined}
          />
        </div>
      </div>
    ),
    code: (p) => `import { DateScrubber } from "rapui";

const [date, setDate] = useState("2026-10-02");

<DateScrubber value={date} onValueChange={setDate}${p.bounded ? ` min="2026-09-29" max="2026-11-28"` : ""}${attrs(p, dateControls, ["bounded"])} />`,
    examples: [
      {
        title: "Plan the night — every scrubber on one desk",
        Demo: () => (
          <div className="w-full p-3 rounded-[calc(var(--rap-radius)-8px)] bg-paper">
            <DialsDemo />
          </div>
        ),
        code: `<DateScrubber value={date} onValueChange={setDate} />
<LensRuler label="Room" unit="°" min={15} max={25} value={temp} onValueChange={setTemp} hint={zone(temp)} className="w-full max-w-72" />
<RangeDial />
<TimeScrubber step="15" format="24h" />
<TempoDial value={bpm} onValueChange={setBpm} onBeat={pulseLamp} />
<HueRing value={hue} onValueChange={setHue} />
<SplitSlider labels={["Rain", "Brown noise"]} value={mix} onValueChange={setMix} />`,
      },
      {
        title: "Bounded — the next 90 days, stretches past the ends and springs back",
        Demo: BookingDemo,
        code: `<DateScrubber value={date} onValueChange={setDate} min={today} max={in90Days} relative={false} />`,
      },
    ],
  },
  {
    slug: "tempo-dial",
    name: "Tempo dial",
    group: "Scrubbers",
    description:
      "A jog wheel for a tempo: spin the ring of ticks round (clockwise is faster), fling it and it coasts, arrows step one bpm, PageUp/PageDown ten, T or the pill taps the tempo in. Delight: one quarter of the ring flashes flame on every beat, walking round the face like a conductor's hand, and a tapped tempo spins the ring there on the spring instead of cutting to it.",
    controls: tempoControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <TempoDial
          key={`${p.defaultValue}`}
          defaultValue={Number(p.defaultValue)}
          size={Number(p.size)}
          beats={Number(p.beats)}
          playing={Boolean(p.playing)}
          tap={Boolean(p.tap)}
        />
      </div>
    ),
    code: (p) => `import { TempoDial } from "rapui";

<TempoDial${attrs(p, tempoControls).replace(/beats="(\d)"/, "beats={$1}")} onValueChange={setBpm} />`,
  },
  {
    slug: "hue-ring",
    name: "Hue ring",
    group: "Scrubbers",
    description:
      "A colour wheel made of ticks, each inked in its own OKLCH hue, so every step round the ring weighs the same to the eye; press anywhere on it, drag round, or use the arrows. Delight: the ticks around the chosen hue swell into a bulge that travels the short way round on a spring, the swatch pill in the middle takes the colour, and each tick crossed clicks, pitched round the wheel.",
    controls: hueControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <HueRing
          key={`${p.defaultValue}`}
          defaultValue={Number(p.defaultValue)}
          size={Number(p.size)}
          ticks={Number(p.ticks)}
          lightness={Number(p.lightness)}
          chroma={Number(p.chroma)}
        />
      </div>
    ),
    code: (p) => `import { HueRing } from "rapui";

<HueRing${attrs(p, hueControls).replace(/ticks="(\d+)"/, "ticks={$1}")} onValueChange={setHue} />`,
    examples: [
      {
        title: "Workspace accent, in 5° steps",
        Demo: ThemeTintDemo,
        code: `const [hue, setHue] = useState(262);

<HueRing value={hue} onValueChange={setHue} size={180} step={5} />
<Button style={{ background: \`oklch(0.6 0.17 \${hue})\` }}>Publish</Button>`,
      },
    ],
  },
  {
    slug: "lens-ruler",
    name: "Lens ruler",
    group: "Scrubbers",
    description:
      "A vertical ruler for a precise number — a thermostat, a type size: press anywhere and the value goes there, drag to fine-tune, arrows step, PageUp/PageDown jump a labelled unit. Delight: a magnifying lens rides the value on a spring, and under it the ticks spread apart in a fisheye and the fine ones, too close to read at rest, come into view.",
    controls: lensControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div style={{ ...card, flexDirection: "row" }}>
          <LensRuler
            key={`${p.min}-${p.max}-${p.step}`}
            min={Number(p.min)}
            max={Number(p.max)}
            step={Number(p.step)}
            defaultValue={Math.round((Number(p.min) + Number(p.max)) / 2)}
            unit={String(p.unit)}
            label={String(p.label) || undefined}
            height={Number(p.height)}
          />
        </div>
      </div>
    ),
    code: (p) => `import { LensRuler } from "rapui";

<LensRuler${attrs(p, lensControls).replace(/step="([\d.]+)"/, "step={$1}")} value={temp} onValueChange={setTemp} />`,
    examples: [
      {
        title: "Type size, labelled every 8px",
        Demo: TypeRampDemo,
        code: `<LensRuler label="Size" unit="px" min={8} max={96} step={1} major={8} value={size} onValueChange={setSize} height={320} />`,
      },
    ],
  },
  {
    slug: "split-slider",
    name: "Split slider",
    group: "Scrubbers",
    description:
      "One amount shared between two things — a crossfade, a 60/40 split: ticks fill the row from both ends and meet at a handle you drag; arrows step, Home/End go all one way, = snaps to even. Delight: the handle parts the ticks like a comb through grass — they lean away as it moves and stand back up when it stops — and 50/50 is a sticky centre notch with the firmest click.",
    controls: splitControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <div style={{ ...card, width: "min(100%, 26rem)" }}>
          <SplitSlider
            key={`${p.defaultValue}-${p.step}`}
            aria-label="Week split"
            defaultValue={Number(p.defaultValue)}
            labels={[String(p.left), String(p.right)]}
            step={Number(p.step)}
            ticks={Number(p.ticks)}
            centerDetent={Boolean(p.centerDetent)}
          />
        </div>
      </div>
    ),
    code: (p) => `import { SplitSlider } from "rapui";

<SplitSlider labels={["${p.left}", "${p.right}"]}${attrs(p, splitControls, ["left", "right"]).replace(/step="(\d+)"/, "step={$1}")} onValueChange={setShare} />`,
  },
];
