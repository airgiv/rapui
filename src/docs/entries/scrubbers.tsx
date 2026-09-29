import { TimeScrubber } from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

const timeControls: Control[] = [
  { type: "select", prop: "step", options: ["1", "5", "15", "30", "60"], default: "15" },
  { type: "number", prop: "momentum", label: "fling carry", min: 0, max: 100, default: 50 },
  { type: "select", prop: "format", options: ["12h", "24h"], default: "12h" },
  { type: "number", prop: "corner", min: 0, max: 40, default: 20 },
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
      <div className="doc-ground">
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
];
