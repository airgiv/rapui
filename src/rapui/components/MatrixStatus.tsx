/* ══ MatrixStatus ═════════════════════════════════════════
   "Working on it" for long tasks: a 3×3 dot matrix pulsing, a
   label with a light passing through it, and the time so far in
   mono tabular figures — so a wait reads as progress, not as a
   hang. role="status", so screen readers hear the label.

   Variants are the matrix's animations: wave (a chevron front
   driving right), orbit (a comet round the edge), scan (rows top
   to bottom), twinkle. Square cells by default; `round` for dots.

   Calm runs the matrix and the shimmer slower; still holds the
   dim grid and a plain label (the timer keeps counting — it is
   information, not decoration). */
import { useEffect, useState, type HTMLAttributes } from "react";
import { cn } from "../utils";
import { DotMatrix, type DotMatrixAnimation } from "./DotMatrix";
import "./MatrixStatus.css";

export interface MatrixStatusProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  animation?: Exclude<DotMatrixAnimation, "none">;
  /** Round dots instead of square cells. */
  round?: boolean;
  /** Show the elapsed time. */
  timer?: boolean;
  /** When the work started (ms since epoch); defaults to mount time. */
  startedAt?: number;
}

function useElapsed(on: boolean, startedAt?: number) {
  const [start] = useState(() => startedAt ?? Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    if (!on) return;
    const t = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(t);
  }, [on]);
  const s = Math.max(0, (now - (startedAt ?? start)) / 1000);
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${(s % 60).toFixed(0).padStart(2, "0")}s`;
}

export function MatrixStatus({ label = "Thinking", animation = "wave", round = false, timer = true, startedAt, className, ...rest }: MatrixStatusProps) {
  const elapsed = useElapsed(timer, startedAt);
  return (
    <div role="status" data-slot="matrix-status" className={cn("inline-flex items-center gap-2.5 text-ink", className)} {...rest}>
      <DotMatrix cols={3} rows={3} size={4} gap={1.5} shape={round ? "round" : "square"} animation={animation} />
      <span className="rap-shimmer-text text-[0.8125rem] font-medium">{label}</span>
      {timer && <span className="font-mono text-[0.75rem] text-mute tabular-nums">{elapsed}</span>}
    </div>
  );
}
