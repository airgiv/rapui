import { Accent, Badge, Button, Rating, Slider, Statement, StatementSlot, Switch, type BlockLook } from "../../rapui";
import { BlockFrame } from "../blockFrame";
import type { Control, DocEntry } from "../types";

const controls: Control[] = [
  { type: "select", prop: "look", options: ["preset", "fun", "civic", "signal", "product", "minimal"], default: "preset", codeDefault: "preset" },
  { type: "text", prop: "eyebrow", default: "One code, five characters" },
];

export const entries: DocEntry[] = [
  {
    slug: "statement",
    name: "Statement",
    group: "Blocks",
    description:
      "Big words with live parts set in among them: a switch between two words, a button where the verb would be, a slider mid-sentence — the product said and shown at once. Each look composes it its own way: huge and flush left with the parts a little askew in fun, centred light serif with each part on a soft white pill in civic (the way a public-service front page sets small pictures into its sentences), mono brackets in signal, hairline chips in product, bare in minimal.",
    controls,
    Demo: ({ p }) => (
      <BlockFrame>
        <Statement eyebrow={String(p.eyebrow) || undefined} size="sm" look={p.look === "preset" ? undefined : (p.look as BlockLook)}>
          Components that{" "}
          <StatementSlot>
            <Switch defaultChecked aria-label="A switch" />
          </StatementSlot>{" "}
          switch on,{" "}
          <StatementSlot>
            <Button size="sm" icon>
              Press
            </Button>
          </StatementSlot>{" "}
          back,{" "}
          <StatementSlot>
            <Slider defaultValue={[62]} aria-label="A slider" className="w-28" />
          </StatementSlot>{" "}
          slide and{" "}
          <StatementSlot>
            <Rating defaultValue={4} size={28} aria-label="A rating" />
          </StatementSlot>{" "}
          score — <Accent tone="mute">in whatever style you pick.</Accent>
        </Statement>
      </BlockFrame>
    ),
    code: () => `import { Statement, StatementSlot, Switch, Button } from "@rapui/react";

<Statement eyebrow="One code, five characters">
  Components that <StatementSlot><Switch defaultChecked /></StatementSlot> switch on,
  <StatementSlot><Button size="sm" icon>Press</Button></StatementSlot> back…
</Statement>`,
    examples: [
      {
        title: "With a badge and a button",
        Demo: () => (
          <BlockFrame>
            <Statement size="sm">
              Every answer arrives{" "}
              <StatementSlot>
                <Badge variant="success">cited</Badge>
              </StatementSlot>{" "}
              and checked, and anything it can't answer goes{" "}
              <StatementSlot>
                <Button size="sm" variant="soft">
                  to a person
                </Button>
              </StatementSlot>
              .
            </Statement>
          </BlockFrame>
        ),
        code: `<Statement>
  Every answer arrives <StatementSlot><Badge variant="success">cited</Badge></StatementSlot> and checked…
</Statement>`,
      },
    ],
  },
];
