import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EditorToolbar, EDITOR_TOOLS, EDITOR_WIDGETS, Sticker, editorIcons } from "../../rapui";
import type { EditorToolbarSize } from "../../rapui";
import { cn } from "../../rapui/utils";

/* Landing demo: the big EditorToolbar floating over a mini canvas.
   Picking a tool changes the cursor and drops that tool's "thing" onto
   the paper — a word that wobbles, a blob, a sticker slapped down, a
   ball that keeps bouncing. Each scene is keyed by the tool, so it
   re-enters every time you switch back. The bar scales with the stage
   (hero → lg → md) and stands up on the left edge on a phone. */

const TOOL_LABEL = Object.fromEntries([...EDITOR_TOOLS.flat(), ...EDITOR_WIDGETS].map((t) => [t.id, t.label]));
const KEYS = Object.fromEntries(EDITOR_TOOLS.flat().map((t, i) => [t.id, i + 1]));

const CURSORS: Record<string, string> = {
  select: "default",
  hand: "grab",
  text: "text",
  pen: "crosshair",
  frame: "crosshair",
  shape: "crosshair",
  comment: "copy",
};

/* how something lands on the canvas: dropped from above with a turn, behind fun */
const DROP = "fun:animate-[eti-drop-in_560ms_var(--rap-ease-out)_both]";
const CARD = "rounded-[22px] bg-surface shadow-pop";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(1200);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function Scene({ tool }: { tool: string }): ReactNode {
  switch (tool) {
    case "select":
      return (
        <div className={cn("relative", DROP)}>
          <div className={cn(CARD, "w-[min(300px,62vw)] p-5")}>
            <div className="h-28 rounded-[14px] bg-[linear-gradient(135deg,var(--rap-sky),var(--rap-blue))]" />
            <div className="mt-3 text-[1.125rem] font-medium tracking-[-0.02em]">Spring issue</div>
            <div className="text-[0.875rem] text-mute">Cover · 1440 × 900</div>
          </div>
          {/* the selection box with its handles */}
          <div className="pointer-events-none absolute -inset-2 rounded-[26px] outline-2 outline-blue">
            {["-top-1.5 -left-1.5", "-top-1.5 -right-1.5", "-bottom-1.5 -left-1.5", "-bottom-1.5 -right-1.5"].map((p) => (
              <span key={p} className={cn("absolute size-3 rounded-full border-2 border-blue bg-surface", p)} />
            ))}
          </div>
        </div>
      );
    case "hand":
      return (
        <div className="relative flex gap-4 fun:animate-[rap-float_3.2s_var(--rap-ease-in-out)_infinite]">
          {["var(--rap-acid)", "var(--rap-bubble)", "var(--rap-sky)"].map((c, i) => (
            <div key={c} className={cn(CARD, "size-24 sm:size-32 grid place-items-center")} style={{ rotate: `${(i - 1) * 4}deg` }}>
              <span className="size-12 rounded-full" style={{ background: c }} />
            </div>
          ))}
        </div>
      );
    case "frame":
      return (
        <div className={cn("relative w-[min(420px,64vw)] aspect-[4/3] rounded-[20px] border-2 border-dashed border-ink/40", DROP)}>
          <span className="absolute -top-7 left-1 text-[0.8125rem] font-medium text-mute">Section 1 · Hero</span>
          <span className="absolute inset-6 rounded-[12px] bg-fill" />
        </div>
      );
    case "text":
      return (
        <div
          className={cn(
            "font-display font-medium tracking-[-0.05em] leading-[0.9] text-[clamp(3.5rem,11vw,8.5rem)] origin-bottom",
            "fun:animate-[eti-jelly_1.8s_var(--rap-ease-in-out)_infinite]",
          )}
        >
          Hello<span className="text-flame">.</span>
        </div>
      );
    case "shape":
      return (
        <svg viewBox="0 0 200 200" className={cn("w-[min(260px,56vw)] overflow-visible", DROP)} aria-hidden>
          <path
            d="M104 18c42 2 78 30 78 78s-32 88-82 86S16 150 18 102 60 16 104 18z"
            className="fill-bubble"
          />
          <rect x="112" y="104" width="64" height="64" rx="16" className="fill-acid" style={{ rotate: "12deg", transformOrigin: "144px 136px" }} />
        </svg>
      );
    case "pen":
      return (
        <svg viewBox="0 0 320 140" className="w-[min(420px,64vw)] overflow-visible" aria-hidden>
          <path
            d="M10 100c30-60 60-60 70 0s40 60 70 0 40-60 70 0 40 60 80-20"
            fill="none"
            className="stroke-ink"
            strokeWidth="8"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            style={{ animation: "eti-draw 1.1s var(--rap-ease-out) both" }}
          />
        </svg>
      );
    case "comment":
      return (
        <div className={cn("flex items-end gap-3", DROP)}>
          <span className="grid place-items-center size-11 shrink-0 rounded-full bg-plum text-[#fff] font-medium">MK</span>
          <div className={cn(CARD, "rounded-bl-[6px] max-w-[260px] px-5 py-4 text-[1rem] tracking-[-0.01em]")}>
            Can the title be <b className="font-semibold">way</b> bigger?
          </div>
        </div>
      );
    case "image":
      return (
        <div className={cn(CARD, "p-3", DROP)}>
          <svg viewBox="0 0 300 200" className="w-[min(320px,60vw)] rounded-[14px]" aria-hidden>
            <rect width="300" height="200" className="fill-sky" />
            <circle cx="90" cy="70" r="26" className="fill-acid" />
            <path d="M0 200 90 110l60 60 50-40 100 70z" className="fill-blue" />
          </svg>
        </div>
      );
    case "video":
      return (
        <div className={cn("grid place-items-center w-[min(380px,64vw)] aspect-video rounded-[22px] bg-[#1a1a1a] shadow-pop", DROP)}>
          <span className="grid place-items-center size-16 rounded-full bg-flame fun:animate-[eti-pulse_1.4s_var(--rap-ease-in-out)_infinite]">
            <svg viewBox="0 0 24 24" className="size-7 fill-[#fff] translate-x-0.5" aria-hidden>
              <path d="M7 5v14l12-7z" />
            </svg>
          </span>
        </div>
      );
    case "audio":
      return (
        <div className={cn(CARD, "flex items-center gap-1.5 h-24 px-6", DROP)}>
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={i}
              className="w-1.5 rounded-pill bg-plum fun:animate-[eti-meter_900ms_var(--rap-ease-in-out)_infinite]"
              style={{ height: 14 + ((i * 37) % 44), animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      );
    case "animation":
      return (
        <div className="relative w-40 h-56">
          <span className="absolute bottom-0 inset-x-0 h-1 rounded-pill bg-ink/15" />
          <span
            className="absolute left-1/2 -ml-10 bottom-1 size-20 rounded-full bg-flame origin-bottom fun:animate-[eti-bounce_1s_linear_infinite]"
            style={{ "--tw-translate-y": "0" } as CSSProperties}
          />
        </div>
      );
    case "sticker":
      return (
        <div className={DROP}>
          <Sticker shape="burst" color="flame" rotate={-8} size="clamp(1.25rem,3vw,2rem)">
            hot drop
          </Sticker>
        </div>
      );
    case "widget":
      return (
        <div className={cn(CARD, "flex items-center gap-4 p-5 pr-7", DROP)}>
          <span className="grid place-items-center size-16 rounded-[18px] bg-acid text-[#282828]">
            <editorIcons.widget size={40} tone="var(--rap-paper-2)" />
          </span>
          <div>
            <div className="text-[1.0625rem] font-medium tracking-[-0.02em]">Embed</div>
            <div className="text-[0.875rem] text-mute">Map, form or any iframe</div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function ToolbarDemo() {
  const [tool, setTool] = useState("text");
  const [ref, w] = useWidth<HTMLDivElement>();
  const vertical = w < 700;
  const size: EditorToolbarSize = w >= 1080 ? "hero" : w >= 880 ? "lg" : "md";

  return (
    <div
      ref={ref}
      data-slot="toolbar-demo"
      className={cn(
        "relative w-full overflow-hidden rounded-card bg-paper",
        "bg-[radial-gradient(var(--rap-fill-strong)_1.2px,transparent_1.6px)] bg-size-[24px_24px]",
        vertical ? "h-[720px]" : size === "hero" ? "h-[640px]" : "h-[560px]",
      )}
      style={{ cursor: CURSORS[tool] ?? "copy" }}
    >
      {/* the tool's name, like an editor's status line */}
      <div className={cn("absolute top-5 right-5 flex items-center gap-2 text-[0.875rem] font-medium tracking-[-0.01em] text-mute", vertical && "left-24 right-auto")}>
        <span className="text-ink">{TOOL_LABEL[tool]}</span>
        {KEYS[tool] ? <span className="grid place-items-center min-w-6 h-6 px-1.5 rounded-pill bg-fill text-[0.75rem]">{KEYS[tool]}</span> : <span>widget</span>}
      </div>

      <div
        className={cn(
          "absolute grid place-items-center",
          vertical ? "inset-y-12 left-24 right-4" : cn("inset-x-6 top-14", size === "hero" ? "bottom-40" : "bottom-32"),
        )}
      >
        <div key={tool} className="grid place-items-center">
          <Scene tool={tool} />
        </div>
      </div>

      <EditorToolbar
        value={tool}
        onValueChange={setTool}
        size={size}
        orientation={vertical ? "vertical" : "horizontal"}
        glass
        className={cn("absolute", vertical ? "left-3 top-1/2 -translate-y-1/2" : "bottom-6 left-1/2 -translate-x-1/2")}
      />
    </div>
  );
}
