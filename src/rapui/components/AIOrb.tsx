/* ══ AIOrb ════════════════════════════════════════════════
   The assistant's face: a small living object that says what the
   assistant is doing without words.

   States:
     idle       slow drift, a quiet breath
     listening  rings ripple out; `level` (0..1, e.g. mic input)
                swells the orb as you speak
     thinking   the colours turn faster and draw in
     speaking   the orb pulses with `level` (e.g. audio output)

   Looks — each preset picks its own, or pass `look`:
     glow    three soft colour fields turning inside a sphere
             (fun, civic, product) — colours from the preset's
             flame / blue / bubble, so it is red-white-and-navy in
             civic and orange-iris in product
     matrix  a disc of dots that twinkle and wave (signal)
     ring    a hairline circle with a travelling arc (minimal)

   All CSS: the state is a data attribute, the level a custom
   property. Calm slows everything and drops the breath; still
   holds a frozen frame. */
import { useRef, type CSSProperties, type HTMLAttributes } from "react";
import { usePreset } from "../hooks/usePreset";
import { cn } from "../utils";
import { DotMatrix } from "./DotMatrix";
import "./AIOrb.css";

export type AIOrbState = "idle" | "listening" | "thinking" | "speaking";
export type AIOrbLook = "glow" | "matrix" | "ring";

export interface AIOrbProps extends HTMLAttributes<HTMLDivElement> {
  state?: AIOrbState;
  /** Voice level 0..1 for listening / speaking. */
  level?: number;
  /** Diameter, px. */
  size?: number;
  /** Defaults to the preset's: matrix in signal, ring in minimal, glow elsewhere. */
  look?: AIOrbLook;
  /** Accessible name; the state is appended. */
  label?: string;
}

const LOOK: Record<string, AIOrbLook> = { signal: "matrix", minimal: "ring" };

export function AIOrb({ state = "idle", level = 0, size = 48, look, label = "Assistant", className, style, ...rest }: AIOrbProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { preset } = usePreset(ref);
  const kind = look ?? LOOK[preset] ?? "glow";
  const lvl = Math.max(0, Math.min(1, level));
  // the matrix disc: as many dots across as fit at a 5px pitch, masked to a circle
  const n = Math.max(5, Math.round(size / 5));
  const mid = (n - 1) / 2;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`${label}, ${state}`}
      data-slot="ai-orb"
      data-state={state}
      data-look={kind}
      className={cn("rap-ai-orb relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size, "--lvl": lvl, ...style } as CSSProperties}
      {...rest}
    >
      {kind === "glow" && (
        <span className="rap-orb-glow absolute inset-0 overflow-hidden rounded-full">
          <i className="rap-orb-field rap-orb-a" />
          <i className="rap-orb-field rap-orb-b" />
          <i className="rap-orb-field rap-orb-c" />
          <i className="rap-orb-sheen" />
        </span>
      )}
      {kind === "matrix" && (
        <DotMatrix
          cols={n}
          rows={n}
          size={Math.max(2, Math.round(size / n) - 2)}
          gap={2}
          animation={state === "idle" ? "twinkle" : state === "thinking" ? "orbit" : "wave"}
          pattern={(c, r) => Math.hypot(c - mid, r - mid) < n * 0.18}
          className="rap-orb-matrix text-accent"
          style={{ clipPath: "circle(50%)" }}
        />
      )}
      {kind === "ring" && (
        <svg viewBox="0 0 48 48" className="rap-orb-ring absolute inset-0 size-full overflow-visible" aria-hidden>
          <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
          <circle className="rap-orb-arc" cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" pathLength={100} />
          <circle className="rap-orb-core" cx="24" cy="24" r="4" fill="currentColor" />
        </svg>
      )}
      {/* listening: rings ripple out from the edge */}
      {state === "listening" && (
        <span aria-hidden className="absolute inset-0">
          <i className="rap-orb-ripple" />
          <i className="rap-orb-ripple [animation-delay:600ms]" />
        </span>
      )}
    </div>
  );
}
