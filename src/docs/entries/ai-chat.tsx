import { useEffect, useRef, useState } from "react";
import { Button } from "../../rapui";
import { ChatMessage, ChatThread, MessageActions, type ChatAttachment, type ChatRole } from "../../rapui/components/ChatMessage";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

const QUESTION = "We're moving the docs site to the new preset system. Will our bundle grow if we only use a handful of components?";

const ANSWER = `No — every rapui component is its own module, so the bundle carries only what you import. Five components in, five components out.

The presets themselves are plain CSS custom properties: switching from fun to calm swaps a few dozen variables, not a second stylesheet. The one thing worth watching is icons — import them by name rather than the whole set, and they tree-shake like everything else.`;

const FOLLOW_UP = `Good catch. The chart components lean on Recharts, so they're the heaviest thing in the box — about 40 KB gzipped the first time you pull one in. Every chart after that shares it.

If the docs only need a sparkline or two, the DotMatrix and BarsChart parts are drawn by hand and cost almost nothing.`;

const FILES: ChatAttachment[] = [
  { name: "bundle-report.html", size: "184 KB" },
  { name: "treemap.png", size: "92 KB", kind: "image" },
];

/* ── playground ── */

const msgControls: Control[] = [
  { type: "select", prop: "role", options: ["assistant", "user"], default: "assistant", codeDefault: null },
  { type: "select", prop: "state", label: "assistant state", options: ["done", "pending", "streaming"], default: "streaming", codeDefault: "done" },
  { type: "text", prop: "name", default: "Rap", codeDefault: "" },
  { type: "text", prop: "time", default: "09:42", codeDefault: "" },
  { type: "boolean", prop: "attachments", default: false },
  { type: "boolean", prop: "actions", default: true, codeDefault: false },
];

/* ── a conversation that keeps going ── */

type Msg = { id: number; role: ChatRole; text: string; time: string; files?: ChatAttachment[]; state?: "pending" | "streaming" | "done" };

const START: Msg[] = [
  { id: 1, role: "user", text: QUESTION, time: "09:41", files: FILES },
  { id: 2, role: "assistant", text: ANSWER, time: "09:41", state: "streaming" },
];

function Conversation() {
  const [msgs, setMsgs] = useState<Msg[]>(START);
  const [run, setRun] = useState(0);
  const next = useRef(3);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const busy = msgs.some((m) => m.state === "pending" || m.state === "streaming");
  const settle = (id: number) => setMsgs((ms) => ms.map((m) => (m.id === id ? { ...m, state: "done" } : m)));

  const ask = () => {
    const u = next.current++;
    const a = next.current++;
    setMsgs((ms) => [
      ...ms,
      { id: u, role: "user", text: "And the charts? Those look heavy.", time: "09:43" },
      { id: a, role: "assistant", text: FOLLOW_UP, time: "09:43", state: "pending" },
    ]);
    timers.current.push(window.setTimeout(() => setMsgs((ms) => ms.map((m) => (m.id === a ? { ...m, state: "streaming" } : m))), 1600));
  };

  const regenerate = (id: number) => {
    setMsgs((ms) => ms.map((m) => (m.id === id ? { ...m, state: "pending" } : m)));
    timers.current.push(window.setTimeout(() => setMsgs((ms) => ms.map((m) => (m.id === id ? { ...m, state: "streaming" } : m))), 1200));
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <ChatThread key={run} className="h-[460px] rounded-card bg-surface shadow-[inset_0_0_0_1px_var(--rap-edge)]" contentClassName="p-5">
        {msgs.map((m) =>
          m.role === "user" ? (
            <ChatMessage key={m.id} role="user" time={m.time} attachments={m.files}>
              {m.text}
            </ChatMessage>
          ) : (
            <ChatMessage
              key={m.id}
              role="assistant"
              name="Rap"
              time={m.time}
              pending={m.state === "pending"}
              label="Checking the build"
              simulate={m.state === "streaming"}
              speed={26}
              onDone={() => settle(m.id)}
              actions={<MessageActions text={m.text} onRegenerate={() => regenerate(m.id)} onShare={() => {}} />}
            >
              {m.text}
            </ChatMessage>
          ),
        )}
      </ChatThread>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="soft" disabled={busy} onClick={ask}>
          Ask a follow-up
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            timers.current.forEach((t) => window.clearTimeout(t));
            next.current = 3;
            setMsgs(START);
            setRun((r) => r + 1);
          }}
        >
          Start over
        </Button>
      </div>
    </div>
  );
}

export const entries: DocEntry[] = [
  {
    slug: "chat-message",
    name: "Chat message",
    group: "AI",
    description:
      "One turn of a conversation. The user speaks in a bubble on the right; the assistant speaks without one, full width, beside a small orb that thinks while the answer is pending and speaks while it streams. Names, times, file chips and an actions row are all optional.",
    controls: msgControls,
    Demo: ({ p }) => {
      const [run, setRun] = useState(0);
      const user = p.role === "user";
      const st = String(p.state);
      return (
        <div className="flex w-full max-w-2xl flex-col items-start gap-5">
          <ChatMessage
            key={`${run}-${st}-${p.role}`}
            className="w-full"
            role={user ? "user" : "assistant"}
            name={String(p.name) || undefined}
            time={String(p.time) || undefined}
            pending={!user && st === "pending"}
            label="Reading the bundle report"
            simulate={!user && st === "streaming"}
            attachments={p.attachments ? FILES : undefined}
            actions={p.actions ? <MessageActions text={ANSWER} onRegenerate={() => setRun((r) => r + 1)} /> : undefined}
          >
            {user ? QUESTION : ANSWER}
          </ChatMessage>
          {!user && st === "streaming" && (
            <Button size="sm" variant="soft" onClick={() => setRun((r) => r + 1)}>
              Replay
            </Button>
          )}
        </div>
      );
    },
    code: (p) => {
      const user = p.role === "user";
      const st = String(p.state);
      const state = user ? "" : st === "pending" ? ` pending label="Reading the bundle report"` : st === "streaming" ? " streaming={!finished}" : "";
      const a = attrs(p, msgControls, ["state", "attachments", "actions"]);
      const files = p.attachments ? " attachments={[{ name: \"bundle-report.html\", size: \"184 KB\" }]}" : "";
      const acts = !user && p.actions ? "\n  actions={<MessageActions text={answer} onRegenerate={retry} />}" : "";
      return `import { ChatMessage, MessageActions } from "@rapui/react";

<ChatMessage${a}${state}${files}${acts}
>
  {${user ? "question" : "answer"}}
</ChatMessage>`;
    },
    examples: [
      {
        title: "Still thinking",
        Demo: () => (
          <div className="flex w-full max-w-2xl flex-col gap-7">
            <ChatMessage role="user" time="10:02">
              Summarise last week's incidents for the team update.
            </ChatMessage>
            <ChatMessage role="assistant" name="Rap" pending label="Reading 14 incident reports" />
          </div>
        ),
        code: `<ChatMessage role="user" time="10:02">Summarise last week's incidents for the team update.</ChatMessage>
<ChatMessage role="assistant" name="Rap" pending label="Reading 14 incident reports" />`,
      },
    ],
  },
  {
    slug: "message-actions",
    name: "Message actions",
    group: "AI",
    description:
      "The quiet row under an answer: copy (the icon turns into a check that draws itself), regenerate, thumbs up or down, and share. Icon buttons with labels and tooltips; the thumbs are toggles and only one can be on. In fun the chosen thumb hops and throws a pinch of confetti; in calm its fill fades in.",
    controls: [
      { type: "boolean", prop: "regenerate", default: true },
      { type: "boolean", prop: "share", default: true, codeDefault: false },
      { type: "boolean", prop: "hideFeedback", label: "hide thumbs", default: false },
    ],
    Demo: ({ p }) => {
      const [fb, setFb] = useState<"up" | "down" | null>(null);
      return (
        <div className="flex flex-col items-center gap-3">
          <MessageActions
            text={ANSWER}
            onRegenerate={p.regenerate ? () => {} : undefined}
            onShare={p.share ? () => {} : undefined}
            hideFeedback={Boolean(p.hideFeedback)}
            feedback={fb}
            onFeedbackChange={setFb}
          />
          <span className="text-[0.75rem] text-mute">feedback: {fb ?? "none"}</span>
        </div>
      );
    },
    code: (p) => `import { MessageActions } from "@rapui/react";

<MessageActions
  text={answer}${p.regenerate ? "\n  onRegenerate={retry}" : ""}${p.share ? "\n  onShare={share}" : ""}${p.hideFeedback ? "\n  hideFeedback" : "\n  feedback={feedback}\n  onFeedbackChange={setFeedback}"}
/>`,
  },
  {
    slug: "chat-thread",
    name: "Chat thread",
    group: "AI",
    description:
      "The scroll box a conversation lives in. It keeps to the bottom while new messages and streamed words arrive — unless you have scrolled up to read, in which case it stays put and a small \"New messages\" pill offers the way back down. Messages arrive with a short rise (fun: the user's bubble pops out of its corner) or a fade (calm).",
    Demo: () => <Conversation />,
    code: () => `import { ChatThread, ChatMessage, MessageActions } from "@rapui/react";

<ChatThread className="h-[460px]">
  {messages.map((m) => (
    <ChatMessage
      key={m.id}
      role={m.role}
      time={m.time}
      attachments={m.files}
      pending={m.pending}
      streaming={m.streaming}
      actions={m.role === "assistant" && <MessageActions text={m.text} onRegenerate={() => retry(m.id)} />}
    >
      {m.text}
    </ChatMessage>
  ))}
</ChatThread>`,
  },
];
