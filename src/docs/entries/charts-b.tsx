import { useEffect, useState } from "react";
import { GaugeChart, HeatGrid, RaceBars, type GaugeZone } from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry, Props } from "../types";

/* a paper ground inside the white stage: chart cards are white sheets */
const GROUND = "grid place-items-center w-full min-h-80 p-6 rounded-[calc(var(--rap-radius)-8px)] bg-paper";

/* a Lighthouse-style score: under 50 is poor, under 90 needs work */
const SCORE_ZONES: GaugeZone[] = [
  { to: 49, tone: "down" },
  { to: 89, tone: "warn" },
  { to: 100, tone: "up" },
];

const gaugeControls: Control[] = [
  { type: "number", prop: "value", min: 0, max: 100, default: 72, codeDefault: null },
  { type: "number", prop: "previous", min: 0, max: 100, default: 66, codeDefault: null },
  { type: "boolean", prop: "zones", default: true, codeDefault: false },
  { type: "text", prop: "label", default: "Performance score", codeDefault: null },
  { type: "boolean", prop: "readOnly", default: false },
  { type: "number", prop: "corner", min: 0, max: 40, default: 26 },
];

const heatControls: Control[] = [
  { type: "select", prop: "shape", options: ["square", "dot"], default: "square" },
  { type: "select", prop: "tone", options: ["ink", "up"], default: "ink" },
  { type: "number", prop: "weeks", min: 8, max: 26, default: 26 },
  { type: "number", prop: "corner", min: 0, max: 40, default: 26 },
];

const raceControls: Control[] = [
  { type: "number", prop: "rows", min: 3, max: 6, default: 6 },
  { type: "text", prop: "unit", default: "visits" },
  { type: "number", prop: "corner", min: 0, max: 40, default: 26 },
];

/* attrs() one control at a time, so a multi-line element gets one prop per line */
const lines = (p: Props, controls: Control[], skip: string[] = []) =>
  controls
    .map((c) => attrs(p, [c], skip).trim())
    .filter(Boolean)
    .map((a) => `\n  ${a}`)
    .join("");

function GaugeDemo({ p }: { p: Props }) {
  /* the panel's value is where the gauge starts; dragging moves it
     from there, and moving the panel again sends it swinging back */
  const [v, setV] = useState(Number(p.value));
  useEffect(() => setV(Number(p.value)), [p.value]);
  return (
    <GaugeChart
      value={v}
      onChange={setV}
      previous={Number(p.previous)}
      when="vs last week"
      label={String(p.label) || undefined}
      zones={p.zones ? SCORE_ZONES : undefined}
      readOnly={Boolean(p.readOnly)}
      corner={Number(p.corner)}
    />
  );
}

export const entries: DocEntry[] = [
  {
    slug: "gauge-chart",
    name: "Gauge chart",
    group: "Charts",
    description:
      "One reading against its range: an arc of ticks, lit up to the value, with the figure and its change in the middle. Drag along the arc (or use the arrow keys) to set it; zones colour the lit ticks green, amber or orange. Delight: the ring riding the arc is on an under-damped spring, so a new value swings past and settles while the newly lit ticks draw in one after another — with sound on, dragging round the arc is a rising scale.",
    controls: gaugeControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <GaugeDemo p={p} />
      </div>
    ),
    code: (p) => `import { GaugeChart } from "@rapui/react";

const [score, setScore] = useState(${Number(p.value)});
${p.zones ? `\nconst zones = [\n  { to: 49, tone: "down" },\n  { to: 89, tone: "warn" },\n  { to: 100, tone: "up" },\n];\n` : ""}
<GaugeChart
  value={score}
  onChange={setScore}${p.zones ? "\n  zones={zones}" : ""}
  when="vs last week"${lines(p, gaugeControls, ["value", "zones"])}
/>`,
  },
  {
    slug: "heat-grid",
    name: "Heat grid",
    group: "Charts",
    description:
      "Half a year of days as a grid of small squares, stepped by how much happened each day; the figure is the total and the change line carries the streak. Hover or arrow through the days to read one back, and switch the metric with the travelling pill. Delight: every day you touch sends a ripple out through its neighbours, and a new metric is laid down in a diagonal wave from the top-left.",
    controls: heatControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <HeatGrid shape={p.shape as "square" | "dot"} tone={p.tone as "ink" | "up"} weeks={Number(p.weeks)} corner={Number(p.corner)} />
      </div>
    ),
    code: (p) => `import { HeatGrid } from "@rapui/react";

<HeatGrid
  metrics={[
    { id: "edits", label: "Edits", unit: "edits", values: edits },  // one per day, oldest first
    { id: "publishes", label: "Publishes", unit: "publishes", values: publishes },
  ]}
  end="2026-09-27"${lines(p, heatControls)}
/>`,
  },
  {
    slug: "race-bars",
    name: "Race bars",
    group: "Charts",
    description:
      "A ranking as a short stack of thin bars — traffic by source, top pages — with the total as the figure. Hover a row to read its value, change and share; switch the period with the travelling pill. Delight: on a new period the rows race to their new places on a spring, overtaking each other and squashing as they go, the numbers count, and a new leader hops when it takes first place.",
    controls: raceControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <RaceBars rows={Number(p.rows)} unit={String(p.unit)} corner={Number(p.corner)} />
      </div>
    ),
    code: (p) => `import { RaceBars } from "@rapui/react";

<RaceBars
  periods={[
    {
      id: "7d",
      label: "7D",
      when: "vs previous 7 days",
      items: [
        { id: "behance", label: "Behance", value: 3920, prev: 610 },
        { id: "google", label: "Google", value: 2140, prev: 1985 },
        // …
      ],
    },
    // { id: "30d", … }, { id: "90d", … }
  ]}${lines(p, raceControls)}
/>`,
  },
];
