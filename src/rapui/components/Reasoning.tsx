/* ══ Reasoning ════════════════════════════════════════════
   The assistant's thinking steps, folded into one line. While it
   works, the header is the current step's title with a light passing
   through it and a running clock; when it is done the header settles
   into "Thought for 12s" and a chevron. Open it to see the steps on
   a thin rail: the live one breathes, done ones get a drawn check,
   a failed one a cross.

     <Reasoning running={busy} defaultOpen steps={[
       { title: "Reading the brief", status: "done" },
       { title: "Searching the web", detail: "6 results", status: "active" },
     ]} />

   Delight (fun): each new step drops onto the rail and settles with a
   2px dip, and the rail fills like liquid down to it — a little slosh
   past the step and back. The header's label rolls up when the step
   changes. Calm: steps fade in, the fill eases down without the slosh,
   and the label just fades. Still: everything in place. */
import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./Collapsible";
import { ChevronDown } from "../icons";
import "./MatrixStatus.css";
import "./Reasoning.css";

export type ReasoningStepStatus = "pending" | "active" | "done" | "error";

export interface ReasoningStep {
  title: ReactNode;
  detail?: ReactNode;
  status: ReasoningStepStatus;
}

export interface ReasoningProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  steps: ReasoningStep[];
  /** Still thinking. Defaults to "some step is active or pending". */
  running?: boolean;
  /** Seconds it took, for a finished run you are replaying. Measured otherwise. */
  duration?: number;
  /** Open while running (on mount, and whenever a new run starts). */
  defaultOpen?: boolean;
  /** Fold the steps away when the run finishes. Default true. */
  autoCollapse?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Header while running and no step is active yet. Default "Thinking". */
  label?: string;
}

const fmt = (s: number) =>
  s < 1 ? "a moment" : s < 60 ? `${Math.round(s)}s` : `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, "0")}s`;

/* a clock that runs while `running` and keeps the last run's length */
function useRunClock(running: boolean) {
  const start = useRef<number | null>(null);
  const [now, setNow] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  useEffect(() => {
    if (!running) {
      if (start.current != null) setLast((Date.now() - start.current) / 1000);
      start.current = null;
      return;
    }
    start.current = Date.now();
    setNow(start.current);
    setLast(null);
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);
  const elapsed = running && start.current != null ? Math.max(0, (now - start.current) / 1000) : 0;
  return { elapsed, last };
}

/* the markers: opaque discs, so the rail runs behind them */
function Marker({ status }: { status: ReasoningStepStatus }) {
  return (
    <span
      data-slot="reasoning-marker"
      data-status={status}
      aria-hidden
      className={cn(
        "relative z-[1] grid size-[18px] flex-none place-items-center rounded-full",
        status === "pending" && "bg-paper-3",
        (status === "active" || status === "done") && "bg-ink text-paper",
        status === "error" && "bg-danger text-paper",
      )}
    >
      {status === "pending" && <span className="size-[5px] rounded-full bg-mute opacity-60" />}
      {status === "active" && (
        <>
          <span className="size-[6px] rounded-full bg-paper fun:animate-[rap-reasoning-breathe_1.4s_var(--rap-ease-in-out)_infinite] calm:animate-[rap-reasoning-breathe_2.4s_var(--rap-ease-in-out)_infinite]" />
          {/* a ring let go of every breath (fun only) */}
          <span className="pointer-events-none absolute inset-0 hidden rounded-full border-[1.5px] border-ink fun:block fun:animate-[rap-reasoning-ring_1.4s_var(--rap-ease-out)_infinite]" />
        </>
      )}
      {status === "done" && (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
          <path d="M5 12.5 10 17.5 19.5 7" pathLength={1} strokeDasharray={1} stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="animate-draw calm:animate-none" />
        </svg>
      )}
      {status === "error" && (
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none">
          <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" pathLength={1} strokeDasharray={1} stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" className="animate-draw calm:animate-none" />
        </svg>
      )}
    </span>
  );
}

/* the steps on their rail; mounted only while open */
function StepList({ steps }: { steps: ReasoningStep[] }) {
  const list = useRef<HTMLOListElement>(null);
  // steps present when the list mounts sit still; later ones drop in
  const [born] = useState(steps.length);
  const [rail, setRail] = useState({ top: 0, len: 0, fill: 0 });

  // the step the fill runs to: the live one, else the last one finished
  let target = steps.findIndex((s) => s.status === "active");
  if (target < 0) for (let i = steps.length - 1; i >= 0; i--) if (steps[i].status !== "pending") { target = i; break; }

  useLayoutEffect(() => {
    const ol = list.current;
    if (!ol) return;
    const measure = () => {
      const marks = ol.querySelectorAll<HTMLElement>("[data-slot=reasoning-marker]");
      if (marks.length < 2) return setRail({ top: 0, len: 0, fill: 0 });
      const mid = (m: HTMLElement) => m.offsetTop + m.offsetHeight / 2;
      const top = mid(marks[0]);
      const len = mid(marks[marks.length - 1]) - top;
      const fill = target < 0 ? 0 : mid(marks[Math.min(target, marks.length - 1)]) - top;
      setRail((r) => (r.top === top && r.len === len && r.fill === fill ? r : { top, len, fill }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ol);
    return () => ro.disconnect();
  }, [steps, target]);

  return (
    <ol ref={list} data-slot="reasoning-steps" className="relative m-0 flex list-none flex-col gap-3 p-0 pt-1">
      {/* the rail: a hairline track and its fill, from the first marker to the last */}
      <span aria-hidden data-slot="reasoning-rail" className="absolute left-[8.25px] w-[1.5px] rounded-full bg-line" style={{ top: rail.top, height: rail.len }}>
        <span
          data-slot="reasoning-rail-fill"
          className={cn(
            "absolute inset-x-0 top-0 rounded-full bg-ink",
            // fun: liquid — runs a hair past the step and sloshes back; calm: a plain ease
            "transition-[height] duration-[900ms] ease-[cubic-bezier(0.34,1.32,0.64,1)]",
            "calm:duration-(--rap-dur) calm:ease-soft",
          )}
          style={{ height: rail.fill }}
        />
      </span>
      {steps.map((s, i) => (
        <li
          key={i}
          data-slot="reasoning-step"
          data-status={s.status}
          aria-current={s.status === "active" ? "step" : undefined}
          className={cn(
            "grid grid-cols-[18px_1fr] items-start gap-x-3",
            i >= born && "fun:animate-[rap-reasoning-drop_480ms_var(--rap-ease-out)_both] calm:animate-[rap-reasoning-fade_260ms_var(--rap-ease-out)_both]",
          )}
        >
          <Marker status={s.status} />
          <div className="flex min-w-0 flex-col gap-0.5 pt-px">
            <span
              data-slot="reasoning-step-title"
              className={cn(
                "text-[0.875rem] leading-[1.35] font-medium",
                s.status === "pending" ? "text-mute" : s.status === "error" ? "text-danger" : "text-ink",
              )}
            >
              {s.title}
            </span>
            {s.detail != null && (
              <span data-slot="reasoning-step-detail" className="text-[0.8125rem] leading-[1.45] text-ink-2">
                {s.detail}
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Collapsible thinking steps on a rail, with a live header while the assistant works. */
export const Reasoning = forwardRef<HTMLDivElement, ReasoningProps>(function Reasoning(
  { steps, running: runningProp, duration, defaultOpen = false, autoCollapse = true, open: openProp, onOpenChange, label = "Thinking", className, ...rest },
  ref,
) {
  const running = runningProp ?? steps.some((s) => s.status === "active" || s.status === "pending");
  const { elapsed, last } = useRunClock(running);

  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) setOpenState(v);
    onOpenChange?.(v);
  };
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  // a new run opens (if asked); a finished one folds away (if asked)
  const was = useRef(running);
  useEffect(() => {
    if (running === was.current) return;
    was.current = running;
    if (running && defaultOpen) setOpenRef.current(true);
    if (!running && autoCollapse) setOpenRef.current(false);
  }, [running, defaultOpen, autoCollapse]);

  const active = steps.find((s) => s.status === "active");
  const failed = !running && steps.at(-1)?.status === "error";
  const secs = duration ?? last;
  const doneLabel = failed
    ? secs != null ? `Stopped after ${fmt(secs)}` : "Stopped"
    : secs != null ? `Thought for ${fmt(secs)}` : `Thought through ${steps.length} step${steps.length === 1 ? "" : "s"}`;
  const liveTitle = active?.title ?? `${label}…`;
  // what screen readers hear: the step titles as they change, then the summary
  const announce = running ? (typeof liveTitle === "string" ? liveTitle : label) : doneLabel;

  return (
    <Collapsible
      ref={ref}
      open={open}
      onOpenChange={setOpen}
      data-slot="reasoning"
      data-running={running || undefined}
      className={cn("gap-2.5 text-ink", className)}
      {...rest}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          data-slot="reasoning-trigger"
          className={cn(
            "inline-flex max-w-full items-center gap-2 self-start rounded-xs border-0 bg-transparent p-0 font-[inherit] text-[0.875rem] font-medium cursor-pointer",
            "text-ink-2 transition-colors duration-(--rap-dur-fast) ease-rm hover:text-ink",
            "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring",
          )}
        >
          {running ? (
            <>
              <span className="inline-flex min-w-0 overflow-hidden py-px">
                <span
                  key={typeof liveTitle === "string" ? liveTitle : steps.indexOf(active!)}
                  data-slot="reasoning-label"
                  className="rap-shimmer-text truncate fun:animate-label-in calm:animate-fade-in"
                >
                  {liveTitle}
                </span>
              </span>
              <span data-slot="reasoning-time" className="font-mono text-[0.75rem] font-normal tabular-nums text-mute">
                {Math.floor(elapsed)}s
              </span>
            </>
          ) : (
            <span data-slot="reasoning-label" className={cn("truncate calm:animate-fade-in", failed && "text-danger")}>
              {doneLabel}
            </span>
          )}
          <ChevronDown data-slot="collapsible-chevron" aria-hidden className="!size-4" />
        </button>
      </CollapsibleTrigger>
      <span role="status" className="sr-only">
        {announce}
      </span>
      <CollapsibleContent data-slot="reasoning-content">
        {/* one wrapper, so a real open deals the list as a whole, not each step */}
        <div className="pb-1 pl-px">
          <StepList steps={steps} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
