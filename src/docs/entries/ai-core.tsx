import { useEffect, useState } from "react";
import { AILoader, AIOrb, Button, StreamingText, type AILoaderLook, type AIOrbLook, type AIOrbState } from "../../rapui";
import { attrs } from "../codegen";
import type { Control, DocEntry } from "../types";

/* a fake voice level: a few sines, so the orb has something to listen to */
function useFakeLevel(on: boolean) {
  const [lvl, setLvl] = useState(0);
  useEffect(() => {
    if (!on) return setLvl(0);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const s = (t - t0) / 1000;
      setLvl(Math.max(0, 0.45 + 0.3 * Math.sin(s * 7.3) + 0.2 * Math.sin(s * 13.1 + 1) + 0.15 * Math.sin(s * 2.1)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return lvl;
}

const orbControls: Control[] = [
  { type: "select", prop: "state", options: ["idle", "listening", "thinking", "speaking"], default: "idle" },
  { type: "select", prop: "look", options: ["preset", "glow", "matrix", "ring"], default: "preset", codeDefault: "preset" },
  { type: "number", prop: "size", min: 24, max: 200, step: 4, default: 120, codeDefault: 48 },
];

const loaderControls: Control[] = [
  { type: "text", prop: "label", default: "Thinking" },
  { type: "select", prop: "look", options: ["preset", "dots", "line", "matrix", "orb", "shimmer"], default: "preset", codeDefault: "preset" },
  { type: "boolean", prop: "timer", default: true, codeDefault: false },
];

const ANSWER = `Short answer: yes — rapui ships every component as its own module, so your bundle only carries what you import.

The presets change colour, type and shape, and each one picks a motion level: fun moves, calm keeps one quiet detail, still holds everything in place.`;

export const entries: DocEntry[] = [
  {
    slug: "ai-orb",
    name: "AI orb",
    group: "AI",
    description:
      "The assistant's face: a small living object that shows what it is doing — idle, listening, thinking, speaking. Feed it a voice level (0..1) and it swells with the sound. Each preset gives it its own look: soft colour fields in a sphere (fun, civic, product — in the preset's colours), a disc of twinkling dots (signal), a hairline ring with a travelling arc (minimal).",
    controls: orbControls,
    Demo: ({ p }) => {
      const st = p.state as AIOrbState;
      const lvl = useFakeLevel(st === "listening" || st === "speaking");
      return <AIOrb state={st} level={lvl} size={Number(p.size)} look={p.look === "preset" ? undefined : (p.look as AIOrbLook)} />;
    },
    code: (p) => `import { AIOrb } from "@rapui/react";

<AIOrb${attrs(p, orbControls)}${p.state === "listening" || p.state === "speaking" ? " level={micLevel}" : ""} />`,
    examples: [
      {
        title: "Every state, every look",
        Demo: () => {
          const lvl = useFakeLevel(true);
          return (
            <div className="grid grid-cols-4 gap-x-8 gap-y-6 place-items-center max-[700px]:grid-cols-2">
              {(["glow", "matrix", "ring"] as const).flatMap((look) =>
                (["idle", "listening", "thinking", "speaking"] as const).map((s) => (
                  <div key={look + s} className="flex flex-col items-center gap-2">
                    <AIOrb look={look} state={s} level={s === "listening" || s === "speaking" ? lvl : 0} size={56} />
                    <span className="text-[0.75rem] text-mute">
                      {look} · {s}
                    </span>
                  </div>
                )),
              )}
            </div>
          );
        },
        code: `<AIOrb look="glow" state="thinking" />
<AIOrb look="matrix" state="listening" level={micLevel} />
<AIOrb look="ring" state="speaking" level={voiceLevel} />`,
      },
    ],
  },
  {
    slug: "ai-loader",
    name: "AI loader",
    group: "AI",
    description:
      "\"The assistant is working\": an indicator, a label with a light passing through it, and an optional timer. One component, five looks — hopping dots, a hairline with a travelling run, a dot-matrix wave, a small thinking orb, or the shimmering label alone — and each preset picks its own unless you say. Announced to screen readers as a status.",
    controls: loaderControls,
    Demo: ({ p }) => <AILoader label={String(p.label)} look={p.look === "preset" ? undefined : (p.look as AILoaderLook)} timer={Boolean(p.timer)} />,
    code: (p) => `import { AILoader } from "@rapui/react";

<AILoader${attrs(p, loaderControls)} />`,
    examples: [
      {
        title: "Every look",
        Demo: () => (
          <div className="flex flex-col gap-5">
            <AILoader look="dots" label="Thinking" />
            <AILoader look="line" label="Reading 12 documents" timer />
            <AILoader look="matrix" label="Searching the web" timer />
            <AILoader look="orb" label="Listening" />
            <AILoader look="shimmer" label="Writing an answer" />
          </div>
        ),
        code: `<AILoader look="dots" label="Thinking" />
<AILoader look="line" label="Reading 12 documents" timer />
<AILoader look="matrix" label="Searching the web" timer />
<AILoader look="orb" label="Listening" />
<AILoader look="shimmer" label="Writing an answer" />`,
      },
    ],
  },
  {
    slug: "streaming-text",
    name: "Streaming text",
    group: "AI",
    description:
      "An answer arriving word by word. Pass the text so far while a model streams (new words fade in, a caret blinks at the end), or the whole text with `simulate` for demos and replays. Paragraphs split on blank lines; screen readers get it as a polite live region.",
    controls: [{ type: "number", prop: "speed", label: "words / s", min: 4, max: 60, default: 24, codeDefault: 28 }],
    Demo: ({ p }) => {
      const [run, setRun] = useState(0);
      const [done, setDone] = useState(false);
      return (
        <div className="flex w-full max-w-xl flex-col items-start gap-5">
          <StreamingText key={run} simulate speed={Number(p.speed)} onDone={() => setDone(true)} className="text-[1.0625rem] leading-[1.6]">
            {ANSWER}
          </StreamingText>
          <Button
            size="sm"
            variant="soft"
            disabled={!done}
            onClick={() => {
              setDone(false);
              setRun((r) => r + 1);
            }}
          >
            Replay
          </Button>
        </div>
      );
    },
    code: () => `import { StreamingText } from "@rapui/react";

// while the model streams:
<StreamingText streaming={!finished}>{textSoFar}</StreamingText>

// or replay a finished answer:
<StreamingText simulate speed={28}>{answer}</StreamingText>`,
  },
];
