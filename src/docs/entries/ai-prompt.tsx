import { useEffect, useRef, useState } from "react";
import { PromptInput } from "../../rapui/components/PromptInput";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* a fake mic level, so the listening orb has something to hear */
function useFakeLevel(on: boolean) {
  const [lvl, setLvl] = useState(0);
  useEffect(() => {
    if (!on) return setLvl(0);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const s = (t - t0) / 1000;
      setLvl(Math.max(0, 0.4 + 0.3 * Math.sin(s * 6.7) + 0.2 * Math.sin(s * 11.3 + 2) + 0.15 * Math.sin(s * 1.9)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return lvl;
}

/* send → "busy" for a few seconds, like a model answering; stop ends it early */
function useFakeAnswer() {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const t = useRef(0);
  useEffect(() => () => window.clearTimeout(t.current), []);
  return {
    busy,
    last,
    submit: (text: string, files: File[]) => {
      setLast(text + (files.length ? ` (+${files.length} file${files.length > 1 ? "s" : ""})` : ""));
      setBusy(true);
      window.clearTimeout(t.current);
      t.current = window.setTimeout(() => setBusy(false), 3500);
    },
    stop: () => {
      window.clearTimeout(t.current);
      setBusy(false);
    },
  };
}

const EXAMPLES = [
  "Ask anything…",
  "How do I renew my passport?",
  "Explain this electricity bill line by line",
  "Plan a weekend in Lisbon under €400",
  "Draft a polite reply to my landlord",
];

const SUGGESTIONS = ["Find a national park near me", "What's on the ballot this November?", "Apply for student aid", "Track my tax refund"];

const controls: Control[] = [
  { type: "select", prop: "size", options: ["md", "lg"], default: "md" },
  { type: "boolean", prop: "cycle", label: "cycling placeholder", default: true, codeDefault: null },
  { type: "boolean", prop: "suggestions", default: true, codeDefault: null },
  { type: "select", prop: "suggestionAction", options: ["fill", "send"], default: "fill" },
  { type: "boolean", prop: "mic", label: "voice button", default: true, codeDefault: null },
  { type: "number", prop: "maxRows", min: 2, max: 12, default: 8 },
  { type: "boolean", prop: "disabled", default: false },
];

function Playground({ p }: { p: Record<string, string | number | boolean> }) {
  const ans = useFakeAnswer();
  const [listening, setListening] = useState(false);
  const level = useFakeLevel(listening);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <PromptInput
        size={p.size as "md" | "lg"}
        placeholder={p.cycle ? EXAMPLES : "Ask anything…"}
        suggestions={p.suggestions ? SUGGESTIONS : undefined}
        suggestionAction={p.suggestionAction as "fill" | "send"}
        maxRows={Number(p.maxRows)}
        disabled={Boolean(p.disabled)}
        busy={ans.busy}
        onSubmit={ans.submit}
        onStop={ans.stop}
        listening={listening}
        level={level}
        onMicClick={p.mic ? () => setListening((l) => !l) : undefined}
      />
      <p className="text-center text-[0.8125rem] text-mute" aria-live="polite">
        {ans.busy ? "Answering… press Esc or the square to stop." : ans.last ? `Sent: “${ans.last}”` : "Enter sends · Shift+Enter adds a line"}
      </p>
    </div>
  );
}

function Hero() {
  const ans = useFakeAnswer();
  return (
    <div className="flex w-full flex-col items-center gap-8 px-2 py-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <h2 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.045em] text-ink">Hello, America.</h2>
        <p className="max-w-[36ch] text-[1.0625rem] text-ink-2">Ask about services, benefits, travel or your vote — in plain words.</p>
      </div>
      <PromptInput
        size="lg"
        className="max-w-3xl"
        placeholder={["What can I help you find?", "Do I need a visa for Japan?", "When is the next federal holiday?", "How do I register to vote?"]}
        suggestions={SUGGESTIONS}
        suggestionAction="send"
        busy={ans.busy}
        onSubmit={ans.submit}
        onStop={ans.stop}
      />
    </div>
  );
}

export const entries: DocEntry[] = [
  {
    slug: "prompt-input",
    name: "Prompt input",
    group: "AI",
    description:
      "The \"Ask anything…\" composer: a generous rounded field whose text grows to eight lines, attached files as removable chips, a mic button that turns into a listening orb, and a send button that becomes stop while the answer streams. Give it several placeholders and it cycles through example prompts; give it suggestions and they sit as chips underneath. Enter sends, Shift+Enter is a newline, Escape stops.",
    controls,
    Demo: Playground,
    code: (p) => `import { PromptInput } from "@rapui/react";

<PromptInput${attrs(p, controls, ["cycle", "suggestions", "mic"])}
  placeholder={${p.cycle ? `["Ask anything…", "How do I renew my passport?", "Plan a weekend in Lisbon"]` : `"Ask anything…"`}}${
      p.suggestions ? `\n  suggestions={["Find a national park near me", "Track my tax refund"]}` : ""
    }
  busy={streaming}
  onSubmit={(text, files) => ask(text, files)}
  onStop={abort}${p.mic ? `\n  listening={listening}\n  level={micLevel}\n  onMicClick={toggleMic}` : ""}
/>`,
    examples: [
      {
        title: "Hero: “Hello, America”",
        Demo: Hero,
        code: `<h2 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] tracking-[-0.045em]">
  Hello, America.
</h2>
<PromptInput
  size="lg"
  placeholder={["What can I help you find?", "Do I need a visa for Japan?", "How do I register to vote?"]}
  suggestions={["Find a national park near me", "What's on the ballot this November?", "Track my tax refund"]}
  suggestionAction="send"
  busy={streaming}
  onSubmit={ask}
  onStop={abort}
/>`,
      },
    ],
  },
];
