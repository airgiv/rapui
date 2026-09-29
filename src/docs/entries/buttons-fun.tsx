import { useState } from "react";
import { ConfirmButton, HoldButton, SlideButton } from "../../rapui";
import type { ConfirmButtonVariant, HoldButtonSize, HoldButtonVariant, SlideButtonVariant } from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

const VARIANTS = ["accent", "blue", "ink", "danger"] as const;
const SIZES = ["md", "lg", "hero"] as const;

const holdControls: Control[] = [
  { type: "select", prop: "variant", options: VARIANTS, default: "danger", codeDefault: "accent" },
  { type: "select", prop: "size", options: SIZES, default: "hero", codeDefault: "md" },
  { type: "text", prop: "label", default: "Hold to delete project", codeDefault: null },
  { type: "text", prop: "doneLabel", label: "done label", default: "Project deleted", codeDefault: "Done" },
  { type: "number", prop: "holdMs", label: "hold, ms", min: 400, max: 3000, step: 100, default: 1200 },
  { type: "boolean", prop: "disabled", default: false },
];

const slideControls: Control[] = [
  { type: "select", prop: "variant", options: VARIANTS, default: "blue", codeDefault: "accent" },
  { type: "select", prop: "size", options: SIZES, default: "hero", codeDefault: "md" },
  { type: "text", prop: "label", default: "Slide to publish", codeDefault: "Slide to confirm" },
  { type: "text", prop: "doneLabel", label: "done label", default: "Published", codeDefault: "Done" },
  { type: "number", prop: "resetAfter", label: "reset after, ms", min: 800, max: 6000, step: 200, default: 2400 },
  { type: "boolean", prop: "disabled", default: false },
];

const confirmControls: Control[] = [
  { type: "select", prop: "variant", options: VARIANTS, default: "danger", codeDefault: "accent" },
  { type: "select", prop: "size", options: SIZES, default: "lg", codeDefault: "md" },
  { type: "text", prop: "label", default: "Delete workspace", codeDefault: "Delete" },
  { type: "text", prop: "confirmLabel", label: "confirm label", default: "Sure?", codeDefault: "Sure?" },
  { type: "text", prop: "doneLabel", label: "done label", default: "Workspace deleted", codeDefault: "Done" },
  { type: "number", prop: "timeoutMs", label: "timeout, ms", min: 1000, max: 8000, step: 500, default: 3000 },
];

/* a line under the demo that proves onConfirm fired */
function Log({ n, what }: { n: number; what: string }) {
  return <span className="doc-muted">{n === 0 ? "Nothing yet" : `${what} ${n === 1 ? "once" : `${n} times`}`}</span>;
}

export const entries: DocEntry[] = [
  {
    slug: "hold-button",
    name: "Hold button",
    group: "Actions",
    description:
      "Press and hold to confirm — for actions that deserve a moment, like deleting. Works with the pointer or by holding Space or Enter. Delight: while you hold, liquid fills the pill with a wobbling edge and rising notches; let go early and it drains back with a drop, hold to the end and it splats and draws a check.",
    controls: holdControls,
    Demo: ({ p }) => {
      const [n, setN] = useState(0);
      return (
        <div className="doc-stack">
          <HoldButton
            variant={p.variant as HoldButtonVariant}
            size={p.size as HoldButtonSize}
            holdMs={Number(p.holdMs)}
            doneLabel={String(p.doneLabel)}
            disabled={Boolean(p.disabled)}
            onConfirm={() => setN((x) => x + 1)}
          >
            {String(p.label)}
          </HoldButton>
          <Log n={n} what="Deleted" />
        </div>
      );
    },
    code: (p) => `import { HoldButton } from "rapui";

<HoldButton${attrs(p, holdControls, ["label"])} onConfirm={deleteProject}>
  ${p.label}
</HoldButton>`,
    examples: [
      {
        title: "Every variant, md and lg",
        Demo: () => (
          <div className="doc-stack">
            <div className="doc-row">
              {VARIANTS.map((v) => (
                <HoldButton key={v} variant={v} doneLabel="Done">
                  Hold to archive
                </HoldButton>
              ))}
            </div>
            <div className="doc-row">
              <HoldButton variant="ink" size="lg" holdMs={2000} doneLabel="Unpublished">
                Hold to unpublish
              </HoldButton>
            </div>
          </div>
        ),
        code: `<HoldButton variant="danger">Hold to archive</HoldButton>
<HoldButton variant="ink" size="lg" holdMs={2000} doneLabel="Unpublished">
  Hold to unpublish
</HoldButton>`,
      },
    ],
  },
  {
    slug: "slide-button",
    name: "Slide button",
    group: "Actions",
    description:
      "Slide to confirm: drag the round thumb to the far end of the pill. Past 90% it finishes on its own; Enter or Space on the thumb does the whole slide for you. Delight: the label fades and stretches away as the thumb covers it, the thumb squashes with speed and rubber-bands against the ends, and a short slide springs back home.",
    controls: slideControls,
    Demo: ({ p }) => {
      const [n, setN] = useState(0);
      return (
        <div className="doc-stack" style={{ width: "min(100%, 30rem)", minWidth: 0 }}>
          <SlideButton
            variant={p.variant as SlideButtonVariant}
            size={p.size as HoldButtonSize}
            label={String(p.label)}
            doneLabel={String(p.doneLabel)}
            resetAfter={Number(p.resetAfter)}
            disabled={Boolean(p.disabled)}
            onConfirm={() => setN((x) => x + 1)}
          />
          <Log n={n} what="Published" />
        </div>
      );
    },
    code: (p) => `import { SlideButton } from "rapui";

<SlideButton${attrs(p, slideControls)} onConfirm={publishSite} />`,
    examples: [
      {
        title: "Checkout, ink",
        Demo: () => <SlideButton variant="ink" size="lg" label="Slide to pay €24" doneLabel="Paid" />,
        code: `<SlideButton variant="ink" size="lg" label="Slide to pay €24" doneLabel="Paid" onConfirm={pay} />`,
      },
    ],
  },
  {
    slug: "confirm-button",
    name: "Confirm button",
    group: "Actions",
    description:
      "Two-step confirm in one pill: the first click arms it, the second acts, and it disarms by itself if you walk away. Escape cancels. Delight: on the first click the pill's width springs to fit “Sure?”, the letters roll over, and a ring drains around the rim while it waits.",
    controls: confirmControls,
    Demo: ({ p }) => {
      const [n, setN] = useState(0);
      return (
        <div className="doc-stack">
          <ConfirmButton
            variant={p.variant as ConfirmButtonVariant}
            size={p.size as HoldButtonSize}
            label={String(p.label)}
            confirmLabel={String(p.confirmLabel)}
            doneLabel={String(p.doneLabel)}
            timeoutMs={Number(p.timeoutMs)}
            onConfirm={() => setN((x) => x + 1)}
          />
          <Log n={n} what="Deleted" />
        </div>
      );
    },
    code: (p) => `import { ConfirmButton } from "rapui";

<ConfirmButton${attrs(p, confirmControls)} onConfirm={deleteWorkspace} />`,
    examples: [
      {
        title: "Sizes",
        Demo: () => (
          <div className="doc-row">
            <ConfirmButton variant="accent" label="Discard changes" confirmLabel="Discard?" doneLabel="Discarded" />
            <ConfirmButton variant="blue" size="lg" label="Leave team" confirmLabel="Really leave?" doneLabel="Left" />
            <ConfirmButton variant="ink" size="hero" label="Reset canvas" confirmLabel="Sure?" doneLabel="Canvas reset" />
          </div>
        ),
        code: `<ConfirmButton label="Discard changes" confirmLabel="Discard?" doneLabel="Discarded" />
<ConfirmButton variant="blue" size="lg" label="Leave team" confirmLabel="Really leave?" doneLabel="Left" />
<ConfirmButton variant="ink" size="hero" label="Reset canvas" doneLabel="Canvas reset" />`,
      },
    ],
  },
];
