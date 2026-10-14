import { useEffect, useState } from "react";
import { Button, StreamingText } from "../../rapui";
import { Reasoning, type ReasoningStep } from "../../rapui/components/Reasoning";
import { ToolCall, ToolChips, type ToolCallStatus } from "../../rapui/components/ToolCall";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* ── a fake agent run ─────────────────────────────────────── */

const STEPS: { title: string; detail: string }[] = [
  { title: "Reading the question", detail: "Which rapui preset suits an internal analytics dashboard?" },
  { title: "Searching the web", detail: "6 results — rapui.dev/presets, two GitHub discussions, a changelog" },
  { title: "Reading 3 files", detail: "presets.css, theme.css and DataTable.tsx, for density and radii" },
  { title: "Drafting the answer", detail: "Leading with product; minimal as the quieter fallback" },
];

/** Walks the steps on a timer: each one appears active, then is done. `k` = steps finished. */
function useAgentRun(stepMs: number, run: number) {
  const [k, setK] = useState(0);
  useEffect(() => {
    setK(0);
    const id = window.setInterval(() => setK((n) => (n >= STEPS.length ? n : n + 1)), stepMs);
    return () => window.clearInterval(id);
  }, [stepMs, run]);
  const steps: ReasoningStep[] = STEPS.slice(0, Math.min(k + 1, STEPS.length)).map((s, i) => ({
    ...s,
    status: i < k ? "done" : "active",
  }));
  return { steps, running: k < STEPS.length };
}

const SEARCH_INPUT = { query: "rapui preset for analytics dashboard", max_results: 6, recency: "1y" };
const SEARCH_OUTPUT = {
  results: [
    { title: "Presets — rapui", url: "https://rapui.dev/presets", snippet: "product: dense controls, hairline edges, square-ish radii…" },
    { title: "Which preset for admin UIs? · Discussion #212", url: "https://github.com/rapui/rapui/discussions/212", snippet: "We moved our console to product and never looked back." },
    { title: "Changelog 0.9", url: "https://rapui.dev/changelog#0.9", snippet: "minimal gains hairline card outlines" },
  ],
  took_ms: 1240,
};
const EMAIL_INPUT = {
  to: "alex@northwind.dev",
  subject: "Dashboard preset — recommendation",
  body: "Hi Alex — short version: use product. Notes attached.",
};
const EMAIL_ACTION = (
  <>
    Send an email to <strong className="font-medium">alex@northwind.dev</strong> with the subject “Dashboard preset — recommendation”.
  </>
);

const CHIPS = [
  { tool: "web_search", label: "Searched the web", detail: "6 results" },
  { tool: "read_file", label: "Read 3 files" },
  { tool: "send_email", label: "Drafted an email" },
];

/* ── controls ─────────────────────────────────────────────── */

const reasoningControls: Control[] = [
  { type: "boolean", prop: "defaultOpen", default: true, codeDefault: false },
  { type: "boolean", prop: "autoCollapse", default: true },
  { type: "number", prop: "stepMs", label: "step (ms)", min: 600, max: 4000, step: 100, default: 1600, codeDefault: null },
];

const toolControls: Control[] = [
  { type: "select", prop: "status", options: ["pending", "running", "done", "error"], default: "done" },
  { type: "boolean", prop: "needsApproval", default: false },
  { type: "boolean", prop: "allowAlways", default: true },
  { type: "boolean", prop: "defaultExpanded", default: false },
];

function Replay({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <Button size="sm" variant="soft" disabled={disabled} onClick={onClick}>
      Replay
    </Button>
  );
}

const ANSWER = `Go with product. It's built for screens like yours: compact control heights, hairline card edges and tight gaps, so a table and four charts fit without scrolling.

If it still feels loud, minimal keeps the same density with fewer colours.`;

export const entries: DocEntry[] = [
  {
    slug: "reasoning",
    name: "Reasoning",
    group: "AI",
    description:
      "The assistant's thinking steps, folded into one line. While it works the header is the current step with a passing light and a clock; when it finishes it settles into \"Thought for 12s\". Open it for the steps on a rail — the live one breathes, done ones get a drawn check, a failed one a cross. It can open on its own while running and fold away when done.",
    controls: reasoningControls,
    Demo: ({ p }) => {
      const [run, setRun] = useState(0);
      const { steps, running } = useAgentRun(Number(p.stepMs), run);
      return (
        <div className="flex w-full max-w-xl flex-col items-start gap-6">
          <Reasoning key={`${run}-${p.defaultOpen}`} steps={steps} running={running} defaultOpen={Boolean(p.defaultOpen)} autoCollapse={Boolean(p.autoCollapse)} />
          <Replay disabled={running} onClick={() => setRun((r) => r + 1)} />
        </div>
      );
    },
    code: (p) => `import { Reasoning } from "@rapui/react";

<Reasoning${attrs(p, reasoningControls, ["stepMs"])}
  running={isThinking}
  steps={[
    { title: "Reading the question", status: "done" },
    { title: "Searching the web", detail: "6 results", status: "active" },
  ]}
/>`,
    examples: [
      {
        title: "Finished, and one that failed",
        Demo: () => (
          <div className="flex flex-col gap-6">
            <Reasoning
              duration={12}
              steps={STEPS.map((s) => ({ ...s, status: "done" as const }))}
            />
            <Reasoning
              duration={5}
              defaultOpen
              autoCollapse={false}
              steps={[
                { title: "Reading the question", status: "done" },
                { title: "Opening the sales sheet", detail: "403 — the sheet isn't shared with this workspace", status: "error" },
              ]}
            />
          </div>
        ),
        code: `<Reasoning duration={12} steps={steps} />

<Reasoning duration={5} defaultOpen autoCollapse={false} steps={[
  { title: "Reading the question", status: "done" },
  { title: "Opening the sales sheet", detail: "403 — …", status: "error" },
]} />`,
      },
    ],
  },
  {
    slug: "tool-call",
    name: "Tool call",
    group: "AI",
    description:
      "One tool the assistant called: its name on a mono chip, what it was called with, where it stands (running, done in 1.2s, failed), and the Input and Output folded underneath as code. With `needsApproval` it asks first — the action in plain words, Approve or Deny, and an optional \"Always allow\" — and then shows what you decided.",
    controls: toolControls,
    Demo: ({ p }) => {
      const approval = Boolean(p.needsApproval);
      const status = p.status as ToolCallStatus;
      return (
        <div className="w-full max-w-xl">
          {approval ? (
            <ToolCall
              key={`ask-${p.allowAlways}`}
              name="send_email"
              needsApproval
              allowAlways={Boolean(p.allowAlways)}
              action={EMAIL_ACTION}
              summary="to alex@northwind.dev"
              status="pending"
              input={EMAIL_INPUT}
              defaultExpanded={Boolean(p.defaultExpanded)}
            />
          ) : (
            <ToolCall
              key={String(p.defaultExpanded)}
              name="web_search"
              status={status}
              duration={1240}
              input={SEARCH_INPUT}
              output={status === "done" ? SEARCH_OUTPUT : undefined}
              error={status === "error" ? "The search service timed out after 10s." : undefined}
              defaultExpanded={Boolean(p.defaultExpanded)}
            />
          )}
        </div>
      );
    },
    code: (p) =>
      p.needsApproval
        ? `import { ToolCall } from "@rapui/react";

<ToolCall
  name="send_email"
  needsApproval${attrs(p, toolControls, ["status", "needsApproval"])}
  action="Send an email to alex@northwind.dev with the subject “Dashboard preset — recommendation”."
  input={args}
  onApprove={({ always }) => runTool(always)}
  onDeny={() => cancelTool()}
/>`
        : `import { ToolCall } from "@rapui/react";

<ToolCall
  name="web_search"${attrs(p, toolControls, ["needsApproval", "allowAlways"])}
  duration={1240}
  input={{ query: "rapui preset for analytics dashboard" }}
  output={results}
/>`,
    examples: [
      {
        title: "An agent run",
        Demo: () => {
          const [run, setRun] = useState(0);
          const { steps, running } = useAgentRun(1300, run);
          const [answered, setAnswered] = useState(false);
          useEffect(() => setAnswered(false), [run]);
          return (
            <div className="flex w-full max-w-xl flex-col gap-4">
              <Reasoning key={run} steps={steps} running={running} defaultOpen />
              {steps.length >= 2 && (
                <ToolCall
                  name="web_search"
                  status={steps[1].status === "done" ? "done" : "running"}
                  duration={1240}
                  input={SEARCH_INPUT}
                  output={steps[1].status === "done" ? SEARCH_OUTPUT : undefined}
                  className="fun:animate-deal-in calm:animate-fade-in"
                />
              )}
              {!running && (
                <>
                  <StreamingText key={run} simulate speed={30} onDone={() => setAnswered(true)} className="text-[1rem] leading-[1.6]">
                    {ANSWER}
                  </StreamingText>
                  {answered && <ToolChips items={CHIPS} />}
                  {answered && (
                    <ToolCall
                      key={run}
                      name="send_email"
                      needsApproval
                      status="pending"
                      action={EMAIL_ACTION}
                      summary="to alex@northwind.dev"
                      input={EMAIL_INPUT}
                      className="fun:animate-deal-in calm:animate-fade-in"
                    />
                  )}
                  <div>
                    <Replay onClick={() => setRun((r) => r + 1)} />
                  </div>
                </>
              )}
            </div>
          );
        },
        code: `<Reasoning steps={steps} running={isThinking} defaultOpen />

<ToolCall name="web_search" status="done" duration={1240}
  input={{ query: "rapui preset for analytics dashboard" }} output={results} />

<StreamingText streaming={streaming}>{answer}</StreamingText>
<ToolChips items={[
  { tool: "web_search", label: "Searched the web", detail: "6 results" },
  { tool: "read_file", label: "Read 3 files" },
]} />

<ToolCall name="send_email" needsApproval
  action="Send an email to alex@northwind.dev with the subject …"
  onApprove={send} onDeny={cancel} />`,
      },
    ],
  },
  {
    slug: "tool-chips",
    name: "Tool chips",
    group: "AI",
    description:
      "The receipt under an answer: a compact row of what the assistant used — \"Searched the web · 6 results\", \"Read 3 files\". Icons are picked from the tool's name; give a chip an onClick to open the details.",
    Demo: () => (
      <div className="flex max-w-xl flex-col gap-3">
        <p className="m-0 text-[1rem] leading-[1.6] text-ink">Go with product — compact controls and hairline edges, made for dense screens.</p>
        <ToolChips
          items={[
            { tool: "web_search", label: "Searched the web", detail: "6 results", onClick: () => {} },
            { tool: "read_file", label: "Read 3 files", onClick: () => {} },
            { tool: "run_python", label: "Ran code", detail: "0.8s" },
            { tool: "calendar_lookup", label: "Checked your calendar" },
          ]}
        />
      </div>
    ),
    code: () => `import { ToolChips } from "@rapui/react";

<ToolChips items={[
  { tool: "web_search", label: "Searched the web", detail: "6 results", onClick: openSources },
  { tool: "read_file", label: "Read 3 files" },
  { tool: "run_python", label: "Ran code", detail: "0.8s" },
]} />`,
  },
];
