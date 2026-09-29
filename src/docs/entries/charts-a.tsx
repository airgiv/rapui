import { BarsChart, DonutChart, Sparkline } from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* a paper ground inside the white stage: chart cards are white sheets */
const GROUND = "grid place-items-center w-full min-h-80 p-6 rounded-[calc(var(--rap-radius)-8px)] bg-paper";

/* ── Sparkline ─────────────────────────────────────────────── */

/* three real-looking series: a studio's week of published pages (up), a landing page's
   bounce rate over two weeks (down is good, and still drawn orange — the line says the
   direction, not the verdict), and a fortnight of template sales (choppy, up) */
const SERIES: Record<string, number[]> = {
  pages: [31, 34, 33, 38, 41, 39, 45, 52, 49, 57, 63, 68],
  bounce: [58.2, 57.1, 57.9, 55.4, 54.8, 55.6, 52.3, 51.7, 50.2, 51.1, 48.9, 47.4],
  sales: [12, 19, 14, 22, 17, 9, 11, 24, 21, 28, 19, 26, 31, 29],
};

const sparkControls: Control[] = [
  {
    type: "select",
    prop: "series",
    options: ["pages", "bounce", "sales"],
    default: "pages",
  },
  /* the panel starts at a word's size for the sentence; the component's own default is 120×32 */
  {
    type: "number",
    prop: "width",
    min: 60,
    max: 240,
    step: 4,
    default: 88,
    codeDefault: 120,
  },
  {
    type: "number",
    prop: "height",
    min: 16,
    max: 64,
    default: 22,
    codeDefault: 32,
  },
  { type: "boolean", prop: "showEnd", default: true },
];

const ROWS = [
  {
    page: "Autumn lookbook",
    views: [310, 342, 298, 405, 461, 438, 522],
    total: "2,776",
  },
  {
    page: "Studio manifesto",
    views: [188, 176, 169, 150, 158, 141, 129],
    total: "1,111",
  },
  { page: "Pricing", views: [96, 104, 99, 121, 117, 133, 148], total: "818" },
];

function SparkRow() {
  return (
    <div className="w-full max-w-[26rem] rounded-card bg-surface px-5 py-4 text-ink">
      <table className="w-full border-collapse text-[0.875rem]">
        <thead>
          <tr className="text-mute text-[0.8125rem] font-medium">
            <th className="text-left font-medium pb-2">Page</th>
            <th className="text-left font-medium pb-2">Last 7 days</th>
            <th className="text-right font-medium pb-2">Views</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.page} className="border-t border-line">
              <td className="py-2.5 pr-3 font-medium">{r.page}</td>
              <td className="py-2.5 pr-3">
                <Sparkline data={r.views} width={96} height={24} aria-label={`${r.page}, views over the last 7 days`} />
              </td>
              <td className="py-2.5 text-right tabular-nums">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── BarsChart ─────────────────────────────────────────────── */

const barsControls: Control[] = [
  {
    type: "select",
    prop: "defaultRange",
    label: "window",
    options: ["7d", "30d", "12m"],
    default: "7d",
  },
  { type: "text", prop: "unit", default: "pages" },
  {
    type: "number",
    prop: "plotHeight",
    min: 80,
    max: 180,
    step: 4,
    default: 120,
  },
  { type: "number", prop: "corner", min: 0, max: 40, default: 26 },
];

/* ── DonutChart ────────────────────────────────────────────── */

const donutControls: Control[] = [
  { type: "text", prop: "title", default: "Visits" },
  { type: "number", prop: "size", min: 160, max: 260, step: 4, default: 208 },
  { type: "number", prop: "thickness", min: 12, max: 22, default: 16 },
  { type: "number", prop: "gap", min: 0, max: 10, default: 3 },
  { type: "number", prop: "corner", min: 0, max: 40, default: 26 },
];

export const entries: DocEntry[] = [
  {
    slug: "sparkline",
    name: "Sparkline",
    group: "Charts",
    description:
      "A trend the size of a word, for table cells and running text: the chart cards' 2.1px curve, green when it ends higher and orange when lower, no axes. Hover to read it back — the ring rides the line and a chip says the value. Delight: the line is drawn in with a pen stroke, and when the pen lifts the latest reading lands as a dot that softly breathes.",
    controls: sparkControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <p className="m-0 max-w-[26rem] rounded-card bg-surface px-6 py-5 text-[1.0625rem] leading-[1.7] text-ink">
          Pages published this fortnight{" "}
          <Sparkline
            data={SERIES[String(p.series)] ?? SERIES.pages}
            width={Number(p.width)}
            height={Number(p.height)}
            showEnd={Boolean(p.showEnd)}
            className="mx-1"
          />{" "}
          are running well ahead of last month — Thursday alone was the studio's best day since spring.
        </p>
      </div>
    ),
    code: (p) => `import { Sparkline } from "@rapui/react";

<Sparkline data={[${(SERIES[String(p.series)] ?? SERIES.pages).join(", ")}]}${attrs(p, sparkControls, ["series"])} />`,
    examples: [
      {
        title: "In a table row",
        Demo: () => (
          <div className={GROUND}>
            <SparkRow />
          </div>
        ),
        code: `<td>
  <Sparkline data={[310, 342, 298, 405, 461, 438, 522]} width={96} height={24} aria-label="Autumn lookbook, views over the last 7 days" />
</td>`,
      },
    ],
  },
  {
    slug: "bars-chart",
    name: "Bars chart",
    group: "Charts",
    description:
      "A count per day or month on the chart card: the total and its change against the window before, a row of rounded bars, and the travelling-pill tabs. Run along the bars (or use the arrow keys) to read one — it goes full colour, the rest step back, and the figure, change and label follow. Delight: switch the window and the bars are dropped in from above, landing with a squash and a bounce like a heap of blocks; click one and it wobbles like jelly. With sound on each landing is a soft notch, pitched by its height.",
    controls: barsControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <BarsChart
          key={String(p.defaultRange)}
          defaultRange={String(p.defaultRange)}
          unit={String(p.unit)}
          plotHeight={Number(p.plotHeight)}
          corner={Number(p.corner)}
        />
      </div>
    ),
    code: (p) => `import { BarsChart } from "@rapui/react";

<BarsChart${attrs(p, barsControls)}
  ranges={[
    { id: "7d", tab: "7D", span: "past 7 days", previous: 312, bars: [
      { label: "Wed 23 Sep", value: 48 }, { label: "Thu 24 Sep", value: 61 }, /* … */
    ] },
    /* 30D, 12M … */
  ]}
/>`,
  },
  {
    slug: "donut-chart",
    name: "Donut chart",
    group: "Charts",
    description:
      "Shares of one whole — where the month's visits came from — as a thin ring of round-ended segments with the total and its change in the hole. Point at a segment (or its legend entry, or use the arrow keys) and it lifts out of the ring while the centre reads its count and share. Delight: the ring is drawn by one pen going round from 12 o'clock, each segment sweeping a touch past its end; grab it and spin — it coasts and always comes home to the top, ticking like a prize wheel as segments pass.",
    controls: donutControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <DonutChart
          title={String(p.title)}
          size={Number(p.size)}
          thickness={Number(p.thickness)}
          gap={Number(p.gap)}
          corner={Number(p.corner)}
        />
      </div>
    ),
    code: (p) => `import { DonutChart } from "@rapui/react";

<DonutChart${attrs(p, donutControls)}
  change={3412}
  data={[
    { label: "Search", value: 18420 },
    { label: "Direct", value: 11236 },
    { label: "Social", value: 8904 },
    { label: "Referral", value: 5712 },
    { label: "Email", value: 3938 },
  ]}
/>`,
  },
];
