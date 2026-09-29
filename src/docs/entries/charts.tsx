import { BalanceChart, ProgressTicks } from "../../rapui";
import { cn } from "../../rapui/utils";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* a paper ground inside the white stage: chart cards are white sheets */
const GROUND = "grid place-items-center w-full min-h-80 p-6 rounded-[calc(var(--rap-radius)-8px)] bg-paper";

const balanceControls: Control[] = [
  { type: "number", prop: "resistance", min: 0, max: 100, default: 50 },
  { type: "number", prop: "threshold", min: 30, max: 120, default: 58 },
  { type: "number", prop: "spin", min: 0, max: 100, default: 50 },
  { type: "number", prop: "dots", min: 3, max: 10, default: 6 },
  { type: "number", prop: "corner", min: 0, max: 40, default: 26 },
];

const ticksControls: Control[] = [{ type: "number", prop: "value", min: 0, max: 100, default: 66 }];

export const entries: DocEntry[] = [
  {
    slug: "balance-chart",
    name: "Balance chart",
    group: "Charts",
    basedOn: "Bencho, MIT",
    description:
      "A portfolio card: a balance, its change and the day as a curve. Run along the line to read the day back — the figure, the change and the time follow your finger; switch the window with the travelling pill; pull the card down to refresh. Delight: the card stretches with your finger and squashes on the rebound, scattered dots are drawn together as you pull and touch at the exact distance that commits, then turn while it works. With sound on you hear the commit before you let go, and the scrub counts off the readings, pitched by the value.",
    controls: balanceControls,
    Demo: ({ p }) => (
      /* room below the card: it stretches with the pull and paints past its own box */
      <div className={cn(GROUND, "place-items-start justify-center pt-10 pb-36")}>
        <BalanceChart
          resistance={Number(p.resistance)}
          threshold={Number(p.threshold)}
          spin={Number(p.spin)}
          dots={Number(p.dots)}
          corner={Number(p.corner)}
        />
      </div>
    ),
    code: (p) => `import { BalanceChart } from "rapui";

<BalanceChart${attrs(p, balanceControls)} />`,
  },
  {
    slug: "progress-ticks",
    name: "Progress ticks",
    group: "Charts",
    basedOn: "Bencho, MIT",
    description:
      "Two numbers and a row of ticks. Hover (or drag a finger) along the row to preview another value; the delta appears only while you scrub. Delight: lit ticks stand taller and the row breathes on a sine; with sound on each tick clicks up a rising scale, firmer on the lit side.",
    controls: ticksControls,
    Demo: ({ p }) => (
      <div className={GROUND}>
        <ProgressTicks value={Number(p.value)} />
      </div>
    ),
    code: (p) => `import { ProgressTicks } from "rapui";

<ProgressTicks${attrs(p, ticksControls)} />`,
  },
];
