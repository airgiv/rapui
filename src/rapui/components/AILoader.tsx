/* ══ AILoader ═════════════════════════════════════════════
   "The assistant is working": an indicator, an optional label with
   a light passing through it, and an optional timer. One API, five
   looks — and each preset picks the one that suits it unless you
   say otherwise:

     dots     three dots taking turns (fun: they hop; product, minimal)
     line     a hairline with a short bright run travelling along it,
              under the label (civic)
     matrix   a 3×3 dot matrix wave (signal)
     orb      a small AIOrb thinking
     shimmer  the label alone, with the passing light

   role="status", so the label is announced. Calm runs everything
   slower and turns the hop into a fade; still shows the label. */
import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { usePreset } from "../hooks/usePreset";
import { cn } from "../utils";
import { AIOrb } from "./AIOrb";
import { DotMatrix } from "./DotMatrix";
import "./AILoader.css";
import "./MatrixStatus.css";

export type AILoaderLook = "dots" | "line" | "matrix" | "orb" | "shimmer";

export interface AILoaderProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  /** Defaults to the preset's look. */
  look?: AILoaderLook;
  timer?: boolean;
}

const LOOK: Record<string, AILoaderLook> = { fun: "dots", civic: "line", signal: "matrix", product: "shimmer", minimal: "dots" };

function useElapsed(on: boolean) {
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(t0);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [on]);
  const s = (now - t0) / 1000;
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60).toString().padStart(2, "0")}s`;
}

export function AILoader({ label = "Thinking", look, timer = false, className, ...rest }: AILoaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { preset } = usePreset(ref);
  const kind = look ?? LOOK[preset] ?? "dots";
  const elapsed = useElapsed(timer);

  const text = label ? <span className="rap-shimmer-text text-[0.875rem] font-medium">{label}</span> : null;
  const time = timer ? <span className="font-mono text-[0.75rem] text-mute tabular-nums">{elapsed}</span> : null;

  return (
    <div ref={ref} role="status" data-slot="ai-loader" data-look={kind} className={cn("inline-flex items-center gap-2.5 text-ink", className)} {...rest}>
      {kind === "dots" && (
        <span aria-hidden className="rap-ai-dots inline-flex items-center gap-[3px]">
          <i />
          <i />
          <i />
        </span>
      )}
      {kind === "matrix" && <DotMatrix cols={3} rows={3} size={4} gap={1.5} shape="square" animation="wave" />}
      {kind === "orb" && <AIOrb size={18} state="thinking" label="" aria-hidden />}
      {kind === "line" ? (
        <span className="inline-flex flex-col gap-1.5">
          <span className="inline-flex items-baseline gap-2.5">
            {text}
            {time}
          </span>
          <span aria-hidden className="rap-ai-line" />
        </span>
      ) : (
        <>
          {text}
          {time}
        </>
      )}
    </div>
  );
}
